import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { useDashTheme } from "../dashboard/theme";
import { Choice, Icon, ThemeToggle } from "../dashboard/ui";
import { addDefaultAdhanIqama } from "../dashboard/utils";
import { PRAYER_KEYS, normalizeConfig } from "../dashboard/iqama";
import { fmt12, localISODate, parseISODate, parseTypedTime } from "../dashboard/time";
import ExcelImportModal, { type XlsxPreview } from "../dashboard/components/ExcelImportModal";
import { StepHeader, WizardNav } from "../onboarding/parts";
import { LocationStep, type Address } from "../onboarding/LocationStep";
import { CalculationStep, GroupCountStep } from "../onboarding/CalculationSteps";
import { IqamaStep } from "../onboarding/IqamaStep";
import { ExcelStep } from "../onboarding/ExcelStep";
import {
  EMPTY_COLUMN_MAP, HEADER_KEYWORDS, autoMapColumns, buildRows, calculateYear, defaultIqamaSetup, iqamaConfigOf, makePresets, parseSheetDate,
  type DayOverrides, type IqamaSetup, type ScheduleRow, type WizardPreset,
} from "../onboarding/schedule";
import "../onboarding/wizard.css";

// Steps: 0 welcome, 1 where times come from, 2 location, 3 same settings all year?,
// 4 calculation settings, 5 iqama times (automatic) or timetable upload (Excel).
const AUTO_STEPS = ["Where times come from", "Location", "Through the year", "Calculation", "Iqama times"];
const EXCEL_STEPS = ["Where times come from", "Your timetable"];

type JummahConfig = Record<string, unknown> & {
  jummah?: string[];
  jummahSlots?: boolean[];
  weekendIsha?: { enabled?: boolean; days?: string[]; iqama?: string };
};

async function upsertInChunks(rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
    if (error) throw new Error(error.message);
  }
}

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { dark, toggle: toggleTheme, themeAttr } = useDashTheme();

  const [masjidId] = useState<string | null>(() => sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id"));
  const [masjidName, setMasjidName] = useState(() => sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name") || "your masjid");
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("Saving…");
  const [saveError, setSaveError] = useState("");

  // Step 1
  const [source, setSource] = useState<"auto" | "excel" | null>(null);

  // Step 2
  const [addr, setAddr] = useState<Address>({ address: "", province: "", postalCode: "", country: "Canada", timezone: "America/Toronto" });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [lat, setLat] = useState(43.65107);
  const [lng, setLng] = useState(-79.347015);
  const [flyTrigger, setFlyTrigger] = useState(0);

  // Steps 3 and 4
  const [presetCount, setPresetCount] = useState<number | null>(null);
  const [presets, setPresets] = useState<WizardPreset[]>([]);

  // Step 5 (automatic)
  const [setup, setSetup] = useState<IqamaSetup>(defaultIqamaSetup);
  const [overrides, setOverrides] = useState<DayOverrides>({});
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const savedJummahConfig = useRef<JummahConfig>({});

  // Step 5 (Excel)
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxPreview, setXlsxPreview] = useState<XlsxPreview | null>(null);
  const [xlsxColMap, setXlsxColMap] = useState<Record<string, string>>(EMPTY_COLUMN_MAP);
  const [xlsxError, setXlsxError] = useState("");
  const [xlsxSuccess, setXlsxSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedJummah, setImportedJummah] = useState<string[]>([]);

  const year = new Date().getFullYear();
  const today = localISODate();

  useEffect(() => {
    const id = masjidId;
    if (!id) { navigate("/login", { replace: true }); return; }
    requestAnimationFrame(() => setTimeout(() => setVisible(true), 30));

    Promise.all([
      supabase.from("masjids").select("masjid_name, address, province, postal_code, country").eq("id", id).maybeSingle(),
      supabase.from("prayer_settings").select("latitude, longitude, timezone, prayer_config, jummah_config").eq("masjid_id", id).maybeSingle(),
    ]).then(async ([masjidRes, psRes]) => {
      const m = masjidRes.data;
      const loaded = { address: m?.address || "", province: m?.province || "", postalCode: m?.postal_code || "", country: m?.country || "Canada" };
      if (m?.masjid_name) setMasjidName(m.masjid_name);
      setAddr(a => ({ ...a, ...loaded, ...(psRes.data?.timezone ? { timezone: psRes.data.timezone } : {}) }));

      // Start from the iqama rules and Jumu'ah times the masjid already has, if any.
      const ps = psRes.data;
      const saved = normalizeConfig(ps?.prayer_config);
      const jc = (ps?.jummah_config ?? {}) as JummahConfig;
      savedJummahConfig.current = jc;
      setSetup(s => {
        const next = { ...s, iqama: { ...s.iqama }, periods: { ...s.periods } };
        for (const k of PRAYER_KEYS) {
          const cfg = saved[k];
          if (cfg) { next.iqama[k] = cfg.usual; next.periods[k] = cfg.periods; }
        }
        const times = (jc.jummah ?? []).filter((t, i) => t && jc.jummahSlots?.[i]);
        if (times.length) next.jummah = times;
        if (jc.weekendIsha?.iqama) next.weekendIsha = { days: jc.weekendIsha.days ?? [], iqama: jc.weekendIsha.iqama };
        return next;
      });

      if (ps?.latitude && ps?.longitude) {
        setLat(parseFloat(ps.latitude));
        setLng(parseFloat(ps.longitude));
      } else {
        // No saved coordinates: find the address on the map.
        const q = [loaded.address, loaded.province, loaded.postalCode, loaded.country].filter(Boolean).join(", ");
        if (q.trim()) {
          try {
            const hit = await geocode(q);
            if (hit) { setLat(hit.lat); setLng(hit.lng); setFlyTrigger(t => t + 1); }
          } catch { /* stay on the Toronto default */ }
        }
      }
    });
  }, [masjidId, navigate]);

  // New step: start at the top of the page.
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const location = useMemo(() => ({ latitude: String(lat), longitude: String(lng), timezone: addr.timezone }), [lat, lng, addr.timezone]);

  // Start times for the whole year, worked out exactly as the dashboard does.
  const startRows = useMemo(() => {
    if (step !== 5 || source !== "auto" || presets.length === 0) return [];
    try { return calculateYear(presets, location, year); } catch (e) { console.error("Prayer time calculation failed:", e); return []; }
  }, [step, source, presets, location, year]);
  const rows = useMemo<ScheduleRow[]>(() => buildRows(startRows, setup, overrides), [startRows, setup, overrides]);

  // ── Location ─────────────────────────────────────────────────────────────
  const savePin = (la: string, lo: string) => {
    if (masjidId) supabase.from("prayer_settings").upsert({ masjid_id: masjidId, latitude: la, longitude: lo }, { onConflict: "masjid_id" }).then();
  };

  const doGeolocate = async () => {
    const q = [addr.address, addr.province, addr.postalCode, addr.country].filter(Boolean).join(", ");
    if (!q) { setGeoError("Type the masjid's address first, then press Find."); return; }
    setGeoLoading(true);
    setGeoError("");
    try {
      const hit = await geocode(q);
      if (!hit) { setGeoError("We could not find that address. Try just the street and city, or drag the pin on the map instead."); return; }
      setLat(hit.lat);
      setLng(hit.lng);
      setFlyTrigger(t => t + 1);
      savePin(String(hit.lat), String(hit.lng));
    } catch {
      setGeoError("We could not look up the address. Check your internet connection and try again, or drag the pin on the map.");
    } finally {
      setGeoLoading(false);
    }
  };

  // ── Calculation groups ───────────────────────────────────────────────────
  const initPresets = () => {
    if (!presetCount) return;
    // Keep what was already chosen when coming back to this step with the same answer.
    if (presets.length !== presetCount) setPresets(makePresets(presetCount));
    setStep(4);
  };

  const patchPreset = (id: string, patch: Partial<WizardPreset>) => setPresets(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toggleMonth = (presetId: string, mo: number) =>
    setPresets(ps => ps.map(p => {
      if (p.id === presetId) {
        const has = p.months.includes(mo);
        return { ...p, months: has ? p.months.filter(m => m !== mo) : [...p.months, mo] };
      }
      return { ...p, months: p.months.filter(m => m !== mo) };
    }));

  const markInvalid = useCallback((key: string, bad: boolean) => setInvalid(v => (!!v[key] === bad ? v : { ...v, [key]: bad })), []);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goBack = () => {
    setSaveError("");
    if (step === 5 && source === "excel") { setStep(1); return; }
    setStep(s => Math.max(s - 1, 0));
  };

  const skip = () => {
    setLeaving(true);
    setTimeout(() => navigate("/home", { replace: true }), 400);
  };

  // ── Finish ───────────────────────────────────────────────────────────────
  const checkIqama = (): string => {
    if (Object.values(invalid).some(Boolean)) return "Some iqama or adhan times above are missing or could not be read. Please type them like 1:30 PM.";
    const missing = setup.jummah.findIndex(t => !t);
    if (missing >= 0) return `Please type a time for the ${["1st", "2nd", "3rd"][missing]} khutbah, like 1:30 PM.`;
    if (setup.weekendIsha.days.length > 0 && !setup.weekendIsha.iqama) return "Please type the weekend Isha iqama time, or untick the weekend days.";
    return "";
  };

  const handleFinish = async () => {
    if (!masjidId) return;
    if (source === "auto") {
      const problem = checkIqama();
      if (problem) { setSaveError(problem); return; }
    }
    setSaving(true);
    setSaveError("");
    try {
      setSaveMsg("Saving your settings…");
      const { error: masjidError } = await supabase.from("masjids").update({
        onboarding_complete: true,
        address: addr.address, province: addr.province, postal_code: addr.postalCode, country: addr.country,
      }).eq("id", masjidId);
      if (masjidError) throw new Error(masjidError.message);

      if (source) {
        const settings: Record<string, unknown> = {
          masjid_id: masjidId,
          source: source === "auto" ? "backend" : "excel",
          latitude: lat, longitude: lng, timezone: addr.timezone,
          method: presets[0]?.method ?? "NorthAmerica",
          presets: presets.length ? presets : null,
        };
        const jummah = source === "auto" ? setup.jummah : importedJummah;
        if (source === "auto" || jummah.length) {
          settings.jummah_config = {
            ...savedJummahConfig.current,
            jummah: [...jummah, "", "", ""].slice(0, 3),
            jummahSlots: [0, 1, 2].map(i => !!jummah[i]),
            ...(source === "auto" ? { weekendIsha: { enabled: !!setup.weekendIsha.iqama, ...setup.weekendIsha } } : {}),
          };
        }
        if (source === "auto") settings.prayer_config = iqamaConfigOf(setup);
        const { error } = await supabase.from("prayer_settings").upsert(settings, { onConflict: "masjid_id" });
        if (error) throw new Error(error.message);
      }

      if (source === "auto") {
        setSaveMsg("Working out prayer times…");
        const yearRows = buildRows(calculateYear(presets, location, year), setup, overrides);
        setSaveMsg(`Saving ${yearRows.length} days…`);
        await upsertInChunks(yearRows.map(r => ({ masjid_id: masjidId, ...r })));
        // The dashboard keeps which months use which settings in this browser.
        const monthMap = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, presets.find(p => p.months.includes(i + 1))?.id ?? ""]));
        try {
          localStorage.setItem("prayer_presets", JSON.stringify(presets));
          localStorage.setItem("month_preset_map", JSON.stringify(monthMap));
          localStorage.setItem("prayer_settings_location", JSON.stringify(location));
        } catch { /* storage blocked: the dashboard falls back to the saved settings */ }
      }
    } catch (e: unknown) {
      console.error("Onboarding error:", (e as Error).message);
      setSaveError(`We could not save your setup (${(e as Error).message}). Please press Finish setup again. If it keeps happening, choose Skip setup for now and contact us.`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setDone(true);
    const start = Date.now(), dur = 1800;
    const tick = () => {
      const p = Math.min(((Date.now() - start) / dur) * 100, 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => setLeaving(true), 2000);
    setTimeout(() => navigate("/home", { replace: true }), 2500);
  };

  // ── Excel upload ─────────────────────────────────────────────────────────
  const mapColumns = (headers: string[]) => setXlsxColMap(autoMapColumns(headers));

  const handleXlsxFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) { setXlsxError("Please choose an Excel file (.xlsx or .xls)."); return; }
    setXlsxFile(file);
    setXlsxError("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheetRows: Record<string, string[][]> = {};
        for (const name of wb.SheetNames) sheetRows[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false }) as string[][];
        const firstSheet = wb.SheetNames[0];
        const sheet = sheetRows[firstSheet];
        const headerIdx = sheet.findIndex(r => r.some(c => HEADER_KEYWORDS.some(k => String(c ?? "").toLowerCase().includes(k))));
        setXlsxPreview({ sheets: wb.SheetNames, sheetRows, selectedSheet: firstSheet, headerRowIdx: Math.max(0, headerIdx) });
        if (headerIdx >= 0) mapColumns(sheet[headerIdx].map(h => String(h ?? "").trim()));
      } catch (err) {
        console.error("Excel parse failed:", err);
        setXlsxError("We could not read that file. Is it an Excel timetable?");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleXlsxImport = async () => {
    if (!xlsxPreview) return;
    if (!masjidId) { setXlsxError("No masjid is signed in. Please sign in again."); return; }
    setIsImporting(true);
    setXlsxError("");
    try {
      const sheet = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
      const headers = sheet[xlsxPreview.headerRowIdx].map(h => String(h ?? "").trim());
      const dataRows = sheet.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c !== "" && c != null));
      const cv = (row: string[], col: string) => { const i = col ? headers.indexOf(col) : -1; return i >= 0 ? String(row[i] ?? "").trim() : ""; };
      const col = xlsxColMap;
      const jummah = [col.jummah1, col.jummah2, col.jummah3]
        .map(c => (c && dataRows[0] ? parseTypedTime(cv(dataRows[0], c)) : null))
        .flatMap(m => (m === null ? [] : [fmt12(m)]));

      const parsed: ScheduleRow[] = [];
      for (const row of dataRows) {
        let date = "";
        if (col.date) date = parseSheetDate(cv(row, col.date));
        else if (col.day) {
          const n = parseInt(cv(row, col.day), 10);
          if (n) date = `${today.slice(0, 7)}-${String(n).padStart(2, "0")}`;
        }
        if (!date) continue;
        const entry: ScheduleRow = { date };
        for (const k of PRAYER_KEYS) {
          entry[k] = cv(row, col[k]);
          if (col[`${k}_iqama`]) entry[`${k}_iqama`] = cv(row, col[`${k}_iqama`]);
        }
        if (parseISODate(date).getDay() === 5) jummah.forEach((t, i) => { entry[`jummah_${i + 1}`] = t; });
        parsed.push(entry);
      }
      if (parsed.length === 0) { setXlsxError("No days could be read. Check that the date column is matched correctly."); return; }

      await upsertInChunks(parsed.map(r => ({
        masjid_id: masjidId,
        ...addDefaultAdhanIqama(r as unknown as Parameters<typeof addDefaultAdhanIqama>[0]),
        ...r,
      })));
      setImportedJummah(jummah);
      const fmt = (d: string) => parseISODate(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
      setXlsxSuccess(`${parsed.length} days, ${fmt(parsed[0].date)} to ${fmt(parsed[parsed.length - 1].date)}.`);
      setXlsxPreview(null);
    } catch (e: unknown) {
      setXlsxError(`Import failed: ${(e as Error).message ?? "unknown error"}. Please try again.`);
    } finally {
      setIsImporting(false);
    }
  };

  // ── Page ─────────────────────────────────────────────────────────────────
  const steps = source === "excel" ? EXCEL_STEPS : AUTO_STEPS;
  const stepInfo = (n: number) => ({ index: n, total: steps.length, name: steps[n - 1] });

  const header = (
    <header className="d-header">
      <div className="d-brand">
        <div className="d-brand-mark" aria-hidden="true"><Icon name="mosque" /></div>
        <div className="d-stack" style={{ gap: 0, minWidth: 0 }}>
          <span className="wz-brand-name">Jam3ah</span>
          <span className="wz-brand-sub">Setting up {masjidName}</span>
        </div>
      </div>
      <div className="d-header-actions" style={{ marginLeft: "auto" }}>
        {step > 0 && !saving && !done && (
          <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={skip}>Skip setup for now</button>
        )}
        <ThemeToggle dark={dark} onToggle={toggleTheme} />
      </div>
    </header>
  );

  if (done) {
    return (
      <div className="dash wz" data-dash-theme={themeAttr}>
        {header}
        <main className="wz-done">
          <div className={`d-card d-card-pad d-stack wz-done-card${leaving ? " is-leaving" : ""}`} style={{ gap: 18, padding: "40px 32px" }} role="status">
            <div className="wz-done-icon"><Icon name="check_circle" /></div>
            <h1 className="d-h1">You're all set!</h1>
            <p className="d-sub">Your prayer times are ready. Taking you to your dashboard…</p>
            <div className="wz-done-bar" aria-hidden="true"><div style={{ width: `${progress}%` }} /></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash wz" data-dash-theme={themeAttr}>
      {header}
      <main className={`wz-main${leaving || !visible ? " is-hidden" : ""}`}>

        {step === 0 && (
          <div className="d-page d-page--narrow">
            <div className="d-stack" style={{ gap: 8 }}>
              <span className="d-muted" style={{ fontSize: 18 }}>Assalamu alaikum</span>
              <StepHeader title={`Welcome to Jam3ah, ${masjidName}`} sub="Let's set up your prayer times together. It takes about 3 minutes, and you can change everything later." />
            </div>
            <div className="wz-features">
              {[
                { icon: "schedule", title: "Adhan times", body: "Worked out for your location, or taken from your own timetable." },
                { icon: "tune", title: "How they are worked out", body: "The calculation method and Asr time your masjid follows." },
                { icon: "groups", title: "Iqama and Jumu'ah", body: "When the congregation starts, for every prayer." },
              ].map(f => (
                <div key={f.title} className="d-card wz-feature">
                  <span className="wz-feature-icon"><Icon name={f.icon} /></span>
                  <div className="d-stack" style={{ gap: 4 }}>
                    <span className="d-h3">{f.title}</span>
                    <span className="d-muted">{f.body}</span>
                  </div>
                </div>
              ))}
            </div>
            <WizardNav onNext={() => setStep(1)} nextLabel="Let's begin" />
          </div>
        )}

        {step === 1 && (
          <div className="d-page d-page--narrow">
            <StepHeader step={stepInfo(1)} title="Where should adhan times come from?" sub="You can switch between these later on the Prayer times page." />
            <div className="d-card d-card-pad d-stack" role="radiogroup" aria-label="Where adhan times come from" style={{ gap: 14 }}>
              <Choice name="source" checked={source === "auto"} onSelect={() => setSource("auto")} title="Work them out for me" body="Recommended. We work out adhan times from your masjid's location, for every day of the year." />
              <Choice name="source" checked={source === "excel"} onSelect={() => setSource("excel")} title="I have my own timetable" body="Upload an Excel file (.xlsx or .xls) with your masjid's prayer times." />
            </div>
            <WizardNav
              onBack={() => setStep(0)}
              onNext={() => setStep(source === "excel" ? 5 : 2)}
              nextDisabled={!source}
              hint={!source ? "Choose an answer to continue" : undefined}
            />
          </div>
        )}

        {step === 2 && (
          <LocationStep
            step={stepInfo(2)}
            value={addr}
            onChange={patch => setAddr(a => ({ ...a, ...patch }))}
            lat={lat}
            lng={lng}
            flyTrigger={flyTrigger}
            onMovePin={(la, lo) => { setLat(parseFloat(la)); setLng(parseFloat(lo)); savePin(la, lo); }}
            onFind={doGeolocate}
            finding={geoLoading}
            error={geoError}
            dark={dark}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <GroupCountStep step={stepInfo(3)} count={presetCount} setCount={setPresetCount} onBack={() => setStep(2)} onNext={initPresets} />
        )}

        {step === 4 && presets.length > 0 && (
          <CalculationStep
            step={stepInfo(4)}
            presets={presets}
            onPatch={patchPreset}
            onToggleMonth={toggleMonth}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {step === 5 && source === "auto" && (
          <IqamaStep
            step={stepInfo(5)}
            year={year}
            today={today}
            rows={rows}
            setup={setup}
            setSetup={setSetup}
            overrides={overrides}
            setOverrides={setOverrides}
            onInvalid={markInvalid}
            onBack={goBack}
            onFinish={handleFinish}
            saving={saving}
            saveMsg={saveMsg}
            error={saveError}
          />
        )}

        {step === 5 && source === "excel" && (
          <ExcelStep
            step={stepInfo(2)}
            fileName={xlsxFile?.name ?? ""}
            onFile={handleXlsxFile}
            success={xlsxSuccess}
            error={xlsxPreview ? "" : xlsxError}
            onBack={goBack}
            onFinish={handleFinish}
            saving={saving}
            saveMsg={saveMsg}
            saveError={saveError}
          />
        )}
      </main>

      {xlsxPreview && (
        <ExcelImportModal
          fileName={xlsxFile?.name ?? ""}
          preview={xlsxPreview}
          setPreview={setXlsxPreview}
          colMap={xlsxColMap}
          setColMap={setXlsxColMap}
          autoMapColumns={mapColumns}
          onImport={handleXlsxImport}
          importing={isImporting}
          error={xlsxError}
        />
      )}
    </div>
  );
}
