import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";
import { generateYearPrayerTimes } from "../lib/prayerTimes";
import LocationMap from "../dashboard/components/LocationMap";
import LocalInput from "../dashboard/components/LocalInput";
import BatchControl from "../dashboard/components/BatchControl";
import { formatTimeInput } from "../dashboard/utils";
import {
  CALC_METHODS as CALC_METHODS_FULL, MADHABS as MADHABS_FULL,
  HIGH_LATITUDE_RULES, POLAR_CIRCLE_RESOLUTIONS, SHAFAQ_OPTIONS,
  ROUNDING_OPTIONS, METHOD_ANGLES, TIMEZONES,
} from "../dashboard/constants";
import Select from "../dashboard/components/Select";
import type { BatchCell, BatchConfig } from "../dashboard/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALC_METHODS = CALC_METHODS_FULL;
const MADHABS      = MADHABS_FULL;


const PRAYERS  = ["fajr","dhuhr","asr","maghrib","isha"] as const;
const P_LABEL: Record<string, string> = { fajr:"Fajr", dhuhr:"Dhuhr", asr:"Asr", maghrib:"Maghrib", isha:"Isha" };
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Preset = {
  id: string; name: string; months: number[];
  method: string; madhab: string;
  fajrAngle: string; ishaAngle: string; ishaInterval: string; maghribAngle: string;
  highLatitudeRule: string; polarCircleResolution: string; shafaq: string; rounding: string;
  adjustFajr: string; adjustSunrise: string; adjustDhuhr: string;
  adjustAsr: string; adjustMaghrib: string; adjustIsha: string;
};
type PrayerPair = { adhan: string; iqama: string };
// month(1-12) → day(1-31) → prayer → {adhan, iqama}
type Schedule   = Record<number, Record<number, Record<string, PrayerPair>>>;

// "HH:MM" 24h → "h:mm AM/PM"
const to12h = (t: string): string => {
  if (!t || t === "—") return t;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  const h = parseInt(m[1]); const min = m[2];
  return `${h % 12 || 12}:${min} ${h >= 12 ? "PM" : "AM"}`;
};

// "h:mm AM/PM" → "HH:MM" (for offset math)
const to24h = (t: string): string => {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t;
  let h = parseInt(m[1]); const min = m[2]; const p = m[3].toUpperCase();
  if (p === "AM" && h === 12) h = 0;
  else if (p === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${min}`;
};

// Add minutes to "HH:MM", returns "HH:MM"
const addMins = (t24: string, mins: number): string => {
  const m = t24.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t24;
  const total = parseInt(m[1]) * 60 + parseInt(m[2]) + mins;
  const safe  = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const emptyBatch = (): BatchConfig => ({
  fajr:    { mode: "fixed", offset: 15, fixed: "" },
  dhuhr:   { mode: "fixed", offset: 15, fixed: "" },
  asr:     { mode: "fixed", offset: 15, fixed: "" },
  maghrib: { mode: "fixed", offset: 15, fixed: "" },
  isha:    { mode: "fixed", offset: 15, fixed: "" },
});

function emptySchedule(): Schedule {
  const s: Schedule = {};
  for (let mo = 1; mo <= 12; mo++) {
    s[mo] = {};
    for (let day = 1; day <= 31; day++)
      s[mo][day] = Object.fromEntries(PRAYERS.map(p => [p, { adhan: "", iqama: "" }]));
  }
  return s;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const F = "Manrope, sans-serif";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px",
  background: "var(--surface-low)", border: "1px solid var(--outline-variant)",
  borderRadius: 2, color: "var(--on-surface)", fontFamily: F,
  fontSize: 13, fontWeight: 500, outline: "none",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: "none" as const, WebkitAppearance: "none" as const, cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--on-surface-variant)", marginBottom: 7, letterSpacing: "0.02em",
};

// Primary = emerald accent, secondary = ghost border
const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "12px", background: "var(--accent)",
  border: "1px solid transparent", borderRadius: 2,
  color: "var(--accent-text)", fontFamily: F, fontWeight: 700,
  fontSize: 14, cursor: "pointer", transition: "background 0.15s",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};

const secondaryBtn: React.CSSProperties = {
  padding: "11px 20px", background: "transparent",
  border: "1px solid var(--outline-variant)", borderRadius: 2,
  color: "var(--on-surface-variant)", fontFamily: F,
  fontWeight: 600, fontSize: 13, cursor: "pointer",
};

// ─── Progress dots ────────────────────────────────────────────────────────────

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} style={{
          height: 5, borderRadius: 2,
          width: k === i ? 24 : k < i ? 16 : 6,
          background: k <= i ? "var(--accent)" : "var(--surface-high)",
          transition: "width 0.25s, background 0.25s",
        }} />
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg style={{ animation: "spin 0.8s linear infinite", width: 16, height: 16, flexShrink: 0 }}
         viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WelcomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [masjidId,   setMasjidId]   = useState<string | null>(null);
  const [masjidName, setMasjidName] = useState("Your Masjid");
  const [visible,    setVisible]    = useState(false);
  const [leaving,    setLeaving]    = useState(false);
  const [step,       setStep]       = useState(0);
  const [done,       setDone]       = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("Saving…");

  // step 1
  const [source, setSource] = useState<"auto" | "excel" | null>(null);

  // step 2
  const [address,    setAddress]    = useState("");
  const [province,   setProvince]   = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country,    setCountry]    = useState("Canada");
  const [timezone,   setTimezone]   = useState("America/Toronto");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState("");
  const [lat, setLat] = useState(43.651070);
  const [lng, setLng] = useState(-79.347015);
  const [flyTrigger, setFlyTrigger] = useState(0);

  // step 3
  const [presetCount, setPresetCount] = useState<number | null>(null);

  // step 4
  const [presets,    setPresets]    = useState<Preset[]>([]);
  const [activePTab, setActivePTab] = useState(0);

  // step 5
  const [schedule,         setSchedule]         = useState<Schedule>(emptySchedule);
  const [activeMo,         setActiveMo]         = useState(1);
  const [scheduleYear,     setScheduleYear]     = useState(new Date().getFullYear());
  const [jummahEnabled,    setJummahEnabled]    = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [jummahTimes,      setJummahTimes]      = useState<{ j1: string; j2: string; j3: string }>({ j1: "", j2: "", j3: "" });
  const [batchOpen,        setBatchOpen]        = useState(false);
  const [batchFromDay,     setBatchFromDay]     = useState(1);
  const [batchToDay,       setBatchToDay]       = useState(31);
  const [batchAdhan,         setBatchAdhan]         = useState<BatchConfig>(emptyBatch);
  const [batchIqama,         setBatchIqama]         = useState<BatchConfig>(emptyBatch);
  const [showBatchSummary,   setShowBatchSummary]   = useState(false);
  const [weekendIshaDays,    setWeekendIshaDays]    = useState<string[]>([]);
  const [weekendIshaIqama,   setWeekendIshaIqama]   = useState("");
  // date string "YYYY-MM-DD" → prayer → calculated start time ("HH:MM")
  const [calcTimes,        setCalcTimes]        = useState<Record<string, Record<string, string>>>({});
  const [refLoading,       setRefLoading]       = useState(false);

  // Excel upload (source === "excel")
  const [xlsxFile,    setXlsxFile]    = useState<File | null>(null);
  const [xlsxPreview, setXlsxPreview] = useState<{
    sheets: string[]; sheetRows: Record<string, string[][]>;
    selectedSheet: string; headerRowIdx: number;
  } | null>(null);
  const [xlsxColMap, setXlsxColMap] = useState<Record<string, string>>({});
  const [xlsxError,   setXlsxError]   = useState("");
  const [xlsxSuccess, setXlsxSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const id   = sessionStorage.getItem("masjid_id")   || localStorage.getItem("masjid_id");
    const name = sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name");
    if (!id) { navigate("/login", { replace: true }); return; }
    setMasjidId(id);
    if (name) setMasjidName(name);
    requestAnimationFrame(() => setTimeout(() => setVisible(true), 30));

    Promise.all([
      supabase.from("masjids").select("masjid_name, address, province, postal_code, country").eq("id", id).maybeSingle(),
      supabase.from("prayer_settings").select("latitude, longitude, timezone").eq("masjid_id", id).maybeSingle(),
    ]).then(async ([masjidRes, psRes]) => {
      let loadedAddress = "", loadedProvince = "", loadedPostal = "", loadedCountry = "Canada";
      if (masjidRes.data) {
        if (masjidRes.data.masjid_name) setMasjidName(masjidRes.data.masjid_name);
        if (masjidRes.data.address)     { setAddress(masjidRes.data.address);         loadedAddress  = masjidRes.data.address; }
        if (masjidRes.data.province)    { setProvince(masjidRes.data.province);        loadedProvince = masjidRes.data.province; }
        if (masjidRes.data.postal_code) { setPostalCode(masjidRes.data.postal_code);  loadedPostal   = masjidRes.data.postal_code; }
        if (masjidRes.data.country)     { setCountry(masjidRes.data.country);          loadedCountry  = masjidRes.data.country; }
      }
      if (psRes.data?.latitude && psRes.data?.longitude) {
        setLat(parseFloat(psRes.data.latitude));
        setLng(parseFloat(psRes.data.longitude));
        if (psRes.data.timezone) setTimezone(psRes.data.timezone);
      } else {
        // No saved coordinates — geocode from address
        const q = [loadedAddress, loadedProvince, loadedPostal, loadedCountry].filter(Boolean).join(", ");
        if (q.trim()) {
          try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { "Accept-Language": "en" } });
            const data = await res.json();
            if (data.length) {
              const newLat = parseFloat(data[0].lat);
              const newLng = parseFloat(data[0].lon);
              setLat(newLat);
              setLng(newLng);
              setFlyTrigger(t => t + 1);
            }
          } catch { /* stay on Toronto default */ }
        }
        if (psRes.data?.timezone) setTimezone(psRes.data.timezone);
      }
    });
  }, []);

  // Compute calculated start times for every day when entering step 5
  useEffect(() => {
    if (step !== 5 || source !== "auto") return;
    setRefLoading(true);
    try {
      const year    = new Date().getFullYear();
      const methods = presets.length > 0 ? [...new Set(presets.map(p => p.method))] : ["NorthAmerica"];
      const byMethod: Record<string, ReturnType<typeof generateYearPrayerTimes>> = {};
      for (const m of methods) byMethod[m] = generateYearPrayerTimes(lat, lng, timezone, m, year);

      const ct: Record<string, Record<string, string>> = {};
      for (let mo = 1; mo <= 12; mo++) {
        const preset      = presets.find(p => p.months.includes(mo)) ?? presets[0];
        const method      = preset?.method ?? "NorthAmerica";
        const rows        = byMethod[method] ?? [];
        const daysInMonth = new Date(year, mo, 0).getDate();
        const ms          = String(mo).padStart(2, "0");
        for (let day = 1; day <= daysInMonth; day++) {
          const ds      = String(day).padStart(2, "0");
          const dateStr = `${year}-${ms}-${ds}`;
          const row     = rows.find(r => r.date === dateStr);
          if (row) ct[dateStr] = { fajr: row.fajr, dhuhr: row.dhuhr, asr: row.asr, maghrib: row.maghrib, isha: row.isha };
        }
      }
      setCalcTimes(ct);
    } catch { /* silent */ } finally {
      setRefLoading(false);
    }
  }, [step]);

  // ── Geocode ────────────────────────────────────────────────────────────────
  const doGeolocate = async () => {
    const q = [address, province, postalCode, country].filter(Boolean).join(", ");
    if (!q) { setGeoError("Enter an address first."); return; }
    setGeoLoading(true);
    setGeoError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (!data.length) { setGeoError("Address not found. Try a simpler query."); return; }
      const newLat = parseFloat(data[0].lat);
      const newLng = parseFloat(data[0].lon);
      setLat(newLat);
      setLng(newLng);
      setFlyTrigger(t => t + 1);
      if (masjidId) {
        supabase.from("prayer_settings").upsert(
          { masjid_id: masjidId, latitude: String(newLat), longitude: String(newLng) },
          { onConflict: "masjid_id" }
        );
      }
    } catch {
      setGeoError("Geocoding failed. Check your connection.");
    } finally {
      setGeoLoading(false);
    }
  };

  // ── Preset helpers ─────────────────────────────────────────────────────────
  const initPresets = () => {
    if (!presetCount) return;
    const defaultNames = ["All Year", "Winter", "Spring", "Summer", "Autumn"];
    setPresets(Array.from({ length: presetCount }, (_, i) => ({
      id: String(i), name: defaultNames[i] ?? `Preset ${i + 1}`, months: [],
      method: "NorthAmerica", madhab: "Shafi",
      fajrAngle: "", ishaAngle: "", ishaInterval: "", maghribAngle: "",
      highLatitudeRule: "recommended", polarCircleResolution: "AqrabBalad",
      shafaq: "General", rounding: "Nearest",
      adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0",
      adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0",
    })));
    setActivePTab(0);
    setStep(4);
  };

  const patchPreset = (id: string, patch: Partial<Preset>) =>
    setPresets(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const toggleMonth = (presetId: string, mo: number) =>
    setPresets(ps => ps.map(p => {
      if (p.id === presetId) {
        const has = p.months.includes(mo);
        return { ...p, months: has ? p.months.filter(m => m !== mo) : [...p.months, mo] };
      }
      return { ...p, months: p.months.filter(m => m !== mo) };
    }));

  const allAssigned = presets.length > 0 &&
    Array.from({ length: 12 }, (_, i) => i + 1).every(m => presets.some(p => p.months.includes(m)));
  const unassigned  = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter(m => !presets.some(p => p.months.includes(m)));

  // ── Schedule helpers ───────────────────────────────────────────────────────
  const setDayTime = (mo: number, day: number, prayer: string, field: "adhan" | "iqama", val: string) =>
    setSchedule(s => ({ ...s, [mo]: { ...s[mo], [day]: { ...s[mo][day], [prayer]: { ...s[mo][day][prayer], [field]: val } } } }));


  const monthFilled = (mo: number) => {
    const days = schedule[mo];
    return Object.values(days).some(d => Object.values(d).some(p => p.adhan || p.iqama));
  };

  // ── Batch apply ────────────────────────────────────────────────────────────
  const applyBatch = () => {
    const year = new Date().getFullYear();
    const ms   = String(activeMo).padStart(2, "0");
    const daysInMonth = new Date(year, activeMo, 0).getDate();
    const from = Math.max(1, batchFromDay);
    const to   = Math.min(daysInMonth, batchToDay);

    setSchedule(s => {
      const newMo = { ...s[activeMo] };
      for (let day = from; day <= to; day++) {
        if (!newMo[day]) continue;
        const ds      = String(day).padStart(2, "0");
        const dateStr = `${year}-${ms}-${ds}`;
        newMo[day] = { ...newMo[day] };

        for (const pr of PRAYERS) {
          const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[pr];
          const iCell = (batchIqama as unknown as Record<string, BatchCell>)[pr];
          const calcT24 = calcTimes[dateStr]?.[pr] ?? "";

          // Resolve new adhan
          let newAdhan = newMo[day][pr].adhan;
          if (aCell.fixed || aCell.mode === "offset") {
            if (aCell.mode === "fixed" && aCell.fixed) {
              newAdhan = aCell.fixed;
            } else if (aCell.mode === "offset" && calcT24) {
              newAdhan = to12h(addMins(calcT24, aCell.offset));
            }
          }

          // Resolve new iqama
          let newIqama = newMo[day][pr].iqama;
          if (iCell.fixed || iCell.mode === "offset") {
            if (iCell.mode === "fixed" && iCell.fixed) {
              newIqama = iCell.fixed;
            } else if (iCell.mode === "offset") {
              // offset from the (possibly new) adhan
              const base24 = newAdhan ? to24h(newAdhan) : calcT24;
              if (base24) newIqama = to12h(addMins(base24, iCell.offset));
            }
          }

          newMo[day] = { ...newMo[day], [pr]: { adhan: newAdhan, iqama: newIqama } };
        }

        const dow = new Date(`${year}-${ms}-${String(day).padStart(2, "0")}T12:00:00`).getDay();
        // Jummah — apply on Fridays only
        if (dow === 5) {
          const jKeys = ["j1", "j2", "j3"] as const;
          jKeys.forEach((k, i) => {
            if (jummahEnabled[i] && jummahTimes[k]) {
              newMo[day] = { ...newMo[day], [`jummah_${i + 1}`]: { adhan: jummahTimes[k], iqama: "" } };
            }
          });
        }
        // Weekend Isha — apply on selected days
        const dowId = ["sun","mon","tue","wed","thu","fri","sat"][dow];
        if (weekendIshaDays.includes(dowId) && weekendIshaIqama) {
          newMo[day] = { ...newMo[day], isha: { ...newMo[day].isha, iqama: weekendIshaIqama } };
        }
      }
      return { ...s, [activeMo]: newMo };
    });
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 5 && source === "excel") { setStep(1); return; }
    if (step === 5 && source === "auto")  { setStep(4); return; }
    setStep(s => Math.max(s - 1, 0));
  };

  const skip = () => {
    setLeaving(true);
    setTimeout(() => navigate("/home", { replace: true }), 400);
  };

  // ── Finish ─────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!masjidId) return;
    setSaving(true);
    try {
      setSaveMsg("Saving settings…");
      await supabase.from("masjids").update({
        onboarding_complete: true,
        address, province, postal_code: postalCode, country,
      }).eq("id", masjidId);

      if (source) {
        await supabase.from("prayer_settings").upsert({
          masjid_id: masjidId,
          source:    source === "auto" ? "backend" : "excel",
          latitude:  lat, longitude: lng, timezone,
          method:    presets[0]?.method ?? "NorthAmerica",
          presets:   presets.length ? presets : null,
        }, { onConflict: "masjid_id" });
      }

      if (source === "auto") {
        setSaveMsg("Calculating prayer times…");
        const year   = new Date().getFullYear();
        const times  = generateYearPrayerTimes(lat, lng, timezone, presets[0]?.method ?? "NorthAmerica", year);
        setSaveMsg(`Saving ${times.length} days…`);
        const rows = times.map(({ sunrise: _s, ...t }) => ({ masjid_id: masjidId, ...t }));
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabase.from("prayer_times")
            .upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
          if (error) throw new Error(error.message);
        }
      }
    } catch (e: unknown) {
      console.error("Onboarding error:", (e as Error).message);
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

  // ── Excel upload helpers ───────────────────────────────────────────────────

  const xlsxAutoMap = (headers: string[]) => {
    const find = (kws: string[]) => headers.find(h => kws.some(k => h.toLowerCase().includes(k))) ?? "";
    setXlsxColMap({
      date:          find(["date"]),
      day:           find(["day", "no."]),
      fajr:          find(["fajr begin", "fajr start", "fajr adhan", "fajr azan"]) || find(["fajr"]),
      dhuhr:         find(["dhuhr begin", "zuhr begin", "dhuhr start", "zuhr start"]) || find(["dhuhr", "zuhr"]),
      asr:           find(["asr begin", "asr start"]) || find(["asr"]),
      maghrib:       find(["maghrib begin", "maghrib start", "sunset"]) || find(["maghrib"]),
      isha:          find(["isha begin", "isha start"]) || find(["isha"]),
      fajr_iqama:    find(["fajr iqama", "fajr jamat", "fajr jamaat"]),
      dhuhr_iqama:   find(["dhuhr iqama", "zuhr iqama", "dhuhr jamat", "zuhr jamat"]),
      asr_iqama:     find(["asr iqama", "asr jamat"]),
      maghrib_iqama: find(["maghrib iqama", "maghrib jamat"]),
      isha_iqama:    find(["isha iqama", "isha jamat"]),
    });
  };

  const handleXlsxFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setXlsxError("Please upload an Excel file (.xlsx or .xls)"); return;
    }
    setXlsxFile(file); setXlsxError(""); setXlsxSuccess("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheetRows: Record<string, string[][]> = {};
        for (const name of wb.SheetNames)
          sheetRows[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false }) as string[][];
        const firstSheet = wb.SheetNames[0];
        const rows = sheetRows[firstSheet];
        const keywords = ["fajr","dhuhr","zuhr","asr","maghrib","isha","date","day"];
        const headerIdx = rows.findIndex(r => r.some(c => keywords.some(k => String(c ?? "").toLowerCase().includes(k))));
        setXlsxPreview({ sheets: wb.SheetNames, sheetRows, selectedSheet: firstSheet, headerRowIdx: Math.max(0, headerIdx) });
        if (headerIdx >= 0) xlsxAutoMap(rows[headerIdx].map(h => String(h ?? "").trim()));
      } catch { setXlsxError("Failed to read file."); }
    };
    reader.readAsBinaryString(file);
  };

  const handleXlsxImport = async () => {
    if (!xlsxPreview || !masjidId) return;
    setIsImporting(true); setXlsxError(""); setXlsxSuccess("");
    try {
      const rows    = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
      const headers = rows[xlsxPreview.headerRowIdx].map(h => String(h ?? "").trim());
      const dataRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c !== "" && c != null));
      const cv = (row: string[], col: string) => { const i = col ? headers.indexOf(col) : -1; return i >= 0 ? String(row[i] ?? "").trim() : ""; };

      type DbRow = { date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string;
        fajr_iqama?: string; dhuhr_iqama?: string; asr_iqama?: string; maghrib_iqama?: string; isha_iqama?: string; };
      const parsed: DbRow[] = [];

      for (const row of dataRows) {
        let dateStr = "";
        if (xlsxColMap.date) {
          const raw = cv(row, xlsxColMap.date);
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) dateStr = raw;
          else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(raw)) {
            const p = raw.split(/[\/\-]/); dateStr = `${p[2]}-${p[0].padStart(2,"0")}-${p[1].padStart(2,"0")}`;
          } else if (!isNaN(Number(raw)) && Number(raw) > 40000) {
            dateStr = new Date(Math.round((Number(raw)-25569)*86400*1000)).toISOString().slice(0,10);
          } else { const d = new Date(raw); if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0,10); }
        }
        if (!dateStr) continue;

        const entry: DbRow = { date: dateStr, fajr: cv(row, xlsxColMap.fajr), dhuhr: cv(row, xlsxColMap.dhuhr),
          asr: cv(row, xlsxColMap.asr), maghrib: cv(row, xlsxColMap.maghrib), isha: cv(row, xlsxColMap.isha) };
        if (xlsxColMap.fajr_iqama)    entry.fajr_iqama    = cv(row, xlsxColMap.fajr_iqama);
        if (xlsxColMap.dhuhr_iqama)   entry.dhuhr_iqama   = cv(row, xlsxColMap.dhuhr_iqama);
        if (xlsxColMap.asr_iqama)     entry.asr_iqama     = cv(row, xlsxColMap.asr_iqama);
        if (xlsxColMap.maghrib_iqama) entry.maghrib_iqama = cv(row, xlsxColMap.maghrib_iqama);
        if (xlsxColMap.isha_iqama)    entry.isha_iqama    = cv(row, xlsxColMap.isha_iqama);
        parsed.push(entry);
      }

      if (parsed.length === 0) { setXlsxError("No rows could be extracted. Check your column mapping."); setIsImporting(false); return; }

      // Save to DB
      const dbRows = parsed.map(r => ({ masjid_id: masjidId, ...r }));
      for (let i = 0; i < dbRows.length; i += 100)
        await supabase.from("prayer_times").upsert(dbRows.slice(i, i+100), { onConflict: "masjid_id,date" });

      // Populate local schedule state (iqama times)
      const newSched: Schedule = {};
      for (const row of parsed) {
        const [, moStr, dyStr] = row.date.split("-");
        const mo = parseInt(moStr), dy = parseInt(dyStr);
        if (!mo || !dy) continue;
        if (!newSched[mo]) newSched[mo] = {};
        if (!newSched[mo][dy]) newSched[mo][dy] = {};
        for (const pr of PRAYERS) {
          newSched[mo][dy][pr] = {
            adhan: (row as unknown as Record<string, string>)[`${pr}_iqama`] ? (row as unknown as Record<string, string>)[`${pr}`] : (row as unknown as Record<string, string>)[`${pr}`] ?? "",
            iqama: (row as unknown as Record<string, string>)[`${pr}_iqama`] ?? "",
          };
        }
      }
      setSchedule(prev => {
        const merged: Schedule = { ...prev };
        for (const mo in newSched) {
          merged[Number(mo)] = { ...(merged[Number(mo)] ?? {}), ...newSched[Number(mo)] };
        }
        return merged;
      });

      const fmt = (d: string) => new Date(d+"T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
      setXlsxSuccess(`${parsed.length} days imported · ${fmt(parsed[0].date)} – ${fmt(parsed[parsed.length-1].date)}`);
      setXlsxPreview(null);
    } catch (e: unknown) {
      setXlsxError((e as Error).message ?? "Import failed.");
    }
    setIsImporting(false);
  };

  const totalDots = source === "excel" ? 3 : 6;
  const dotIdx    = source === "excel"
    ? (step <= 1 ? step : 2)
    : Math.min(step, 5);

  // ── Completion ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
        <div style={{ textAlign: "center", maxWidth: 340, opacity: leaving ? 0 : 1, transform: leaving ? "scale(0.9) translateY(-24px)" : "scale(1)", transition: "all 0.4s ease" }}>
          <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 24px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", animation: "ping 1.5s ease infinite" }} />
            <div style={{ position: "relative", width: 72, height: 72, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--accent)" }}>check_circle</span>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>Setup Complete</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 8px" }}>You're all set!</h1>
          <p style={{ color: "var(--text-ghost)", fontSize: 14, marginBottom: 28 }}>Taking you to your dashboard…</p>
          <div style={{ height: 2, background: "var(--surface-mid)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.1s linear" }} />
          </div>
        </div>
        <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(1.6);opacity:0}}`}</style>
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--on-surface)", fontFamily: F, display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--surface-high)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--on-surface)" }}>mosque</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)" }}>jam3ah</span>
        </div>
        <Dots n={totalDots} i={dotIdx} />
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: step === 5 ? "flex-start" : "center", justifyContent: "center", padding: isMobile ? "24px 16px 60px" : step === 5 ? "40px 40px 80px" : "40px 40px", opacity: leaving ? 0 : visible ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <div style={{ width: "100%", maxWidth: step === 5 ? 1400 : step === 4 ? 860 : step === 2 ? 960 : 640, transition: "max-width 0.3s ease" }}>

          {/* ════ STEP 0 — Welcome ════ */}
          {step === 0 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                  Setup Wizard
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>
                  Welcome, {masjidName.split(" ")[0]}
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>
                  Let's set up your prayer times — takes about 3 minutes.
                </p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { icon: "calculate",  label: "Prayer Times",   desc: "Auto-calculate or upload" },
                    { icon: "tune",       label: "Calc Presets",   desc: "Set methods per season" },
                    { icon: "schedule",   label: "Iqama Times",    desc: "Month-by-month schedule" },
                  ].map((f, i) => (
                    <div key={i} style={{ background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: "16px 12px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent)", display: "block", marginBottom: 8 }}>{f.icon}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-ghost)" }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(1)}
                style={{ ...primaryBtn }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                Get Started
              </button>
            </div>
          )}

          {/* ════ STEP 1 — Source ════ */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                  Step 1 of {source === "excel" ? 3 : 6}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Prayer Times Source</h1>
                <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>How would you like prayer start times to be managed?</p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {([
                    { val: "auto",  label: "Auto-Calculate", desc: "We compute times from your location using an Islamic calculation method.", icon: "calculate" },
                    { val: "excel", label: "Upload Excel",   desc: "Upload your own schedule spreadsheet from the Prayer Times tab later.",     icon: "upload_file" },
                  ] as const).map(o => (
                    <button key={o.val} onClick={() => setSource(o.val)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px", borderRadius: 2, border: source === o.val ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: source === o.val ? "var(--accent-bg)" : "var(--surface-low)", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: source === o.val ? "var(--accent)" : "var(--text-ghost)", flexShrink: 0, marginTop: 1 }}>{o.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: source === o.val ? "var(--on-surface)" : "var(--text-faint)", marginBottom: 3 }}>{o.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-ghost)", lineHeight: 1.5 }}>{o.desc}</div>
                      </div>
                      {source === o.val && <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", marginLeft: "auto", flexShrink: 0 }}>check_circle</span>}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep(0)} style={secondaryBtn}>Back</button>
                  <button onClick={() => { if (source === "excel") setStep(5); else setStep(2); }}
                    disabled={!source}
                    style={{ ...primaryBtn, flex: 1, width: "auto", opacity: !source ? 0.4 : 1, cursor: !source ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (source) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 2 — Location ════ */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                  Step 2 of 6
                </div>
                <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Location & Timezone</h1>
                <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--text-ghost)", margin: 0 }}>Enter your masjid's address — used to calculate accurate prayer times.</p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: isMobile ? 16 : 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24, alignItems: "stretch" }}>

                  {/* Left: fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Street Address</label>
                      <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="123 Main St"
                        onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                        onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Province / State</label>
                        <input value={province} onChange={e => setProvince(e.target.value)} style={inputStyle} placeholder="Ontario"
                          onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                          onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Postal Code</label>
                        <input value={postalCode} onChange={e => setPostalCode(e.target.value)} style={inputStyle} placeholder="M5V 3A1"
                          onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                          onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} placeholder="Canada"
                        onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                        onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Timezone</label>
                      <Select
                        value={timezone}
                        onChange={v => setTimezone(v)}
                        options={TIMEZONES}
                      />
                    </div>

                    {geoError && (
                      <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2 }}>
                        <p style={{ color: "#f87171", fontSize: 13, margin: 0, fontWeight: 500 }}>{geoError}</p>
                      </div>
                    )}

                    <button onClick={doGeolocate} disabled={geoLoading}
                      style={{ padding: "10px 16px", background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: F, fontWeight: 600, fontSize: 12, cursor: geoLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: geoLoading ? 0.6 : 1 }}
                      onMouseEnter={e => { if (!geoLoading) { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)"; }}>
                      {geoLoading ? <><Spinner />Locating…</> : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>my_location</span>Locate on Map</>}
                    </button>

                    {/* Back/Continue on desktop only — on mobile shown below the map */}
                    {!isMobile && (
                      <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                        <button onClick={() => setStep(1)} style={secondaryBtn}>Back</button>
                        <button onClick={() => setStep(3)}
                          style={{ ...primaryBtn, flex: 1, width: "auto" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                          Continue
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: map */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={labelStyle}>Pin Location</label>
                      <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                    </div>
                    <LocationMap
                      latitude={String(lat)}
                      longitude={String(lng)}
                      flyTrigger={flyTrigger}
                      onChange={(la, lo) => {
                        setLat(parseFloat(la));
                        setLng(parseFloat(lo));
                        if (masjidId) {
                          supabase.from("prayer_settings").upsert(
                            { masjid_id: masjidId, latitude: la, longitude: lo },
                            { onConflict: "masjid_id" }
                          );
                        }
                      }}
                      height={isMobile ? 240 : 340}
                    />
                    <p style={{ fontSize: 11, color: "var(--text-ghost)", margin: 0 }}>Click the map or drag the pin to fine-tune your location.</p>
                  </div>

                </div>

                {/* Back/Continue on mobile — below the map */}
                {isMobile && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button onClick={() => setStep(1)} style={secondaryBtn}>Back</button>
                    <button onClick={() => setStep(3)}
                      style={{ ...primaryBtn, flex: 1, width: "auto" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 3 — Preset count ════ */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                  Step 3 of 6
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Calculation Presets</h1>
                <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>How many different calculation setups do you need? Most masjids use 1–2.</p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {([
                    [1, "One method all year — simplest"],
                    [2, "Two setups — e.g. summer / winter"],
                    [3, "Three setups — seasonal fine-tuning"],
                    [4, "Four setups — quarterly control"],
                    [5, "Five setups — maximum flexibility"],
                  ] as [number, string][]).map(([n, desc]) => (
                    <button key={n} onClick={() => setPresetCount(n)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 2, border: presetCount === n ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: presetCount === n ? "var(--accent-bg)" : "var(--surface-low)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 2, background: presetCount === n ? "var(--accent-bg)" : "var(--surface-mid)", border: presetCount === n ? "1px solid var(--accent-border)" : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: presetCount === n ? "var(--accent)" : "var(--text-ghost)" }}>{n}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: presetCount === n ? "var(--on-surface)" : "var(--text-faint)" }}>{n === 1 ? "1 preset" : `${n} presets`}</div>
                        <div style={{ fontSize: 12, color: "var(--text-ghost)", marginTop: 2 }}>{desc}</div>
                      </div>
                      {presetCount === n && <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", marginLeft: "auto" }}>check_circle</span>}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep(2)} style={secondaryBtn}>Back</button>
                  <button onClick={initPresets} disabled={!presetCount}
                    style={{ ...primaryBtn, flex: 1, width: "auto", opacity: !presetCount ? 0.4 : 1, cursor: !presetCount ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (presetCount) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 4 — Preset config ════ */}
          {step === 4 && presets.length > 0 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                  Step 4 of 6
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Configure Presets</h1>
                <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>Set calculation settings for each preset and assign months. All 12 months must be covered.</p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: isMobile ? 16 : 24 }}>
                {/* Preset tabs */}
                {presets.length > 1 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24, borderBottom: "1px solid var(--surface-high)", paddingBottom: 16 }}>
                    {presets.map((p, i) => (
                      <button key={p.id} onClick={() => setActivePTab(i)}
                        style={{ padding: "6px 14px", borderRadius: 2, fontFamily: F, fontSize: 12, fontWeight: 600, cursor: "pointer", border: activePTab === i ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: activePTab === i ? "var(--accent-bg)" : "transparent", color: activePTab === i ? "var(--accent)" : "var(--text-ghost)", transition: "all 0.15s" }}>
                        {p.name || `Preset ${i + 1}`}
                        {p.months.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>({p.months.length}mo)</span>}
                      </button>
                    ))}
                  </div>
                )}

                {(() => {
                  const p = presets[activePTab];
                  if (!p) return null;
                  const isCustom   = p.method === "Other";
                  const isMoon     = p.method === "MoonsightingCommittee";
                  const angles     = METHOD_ANGLES[p.method] ?? METHOD_ANGLES.Other;
                  const methodLabel = CALC_METHODS.find(m => m.value === p.method)?.label ?? p.method;
                  const av = (n: number | null) => n === null ? "" : String(n);

                  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-faint)", fontFamily: F, whiteSpace: "nowrap" }}>{children}</span>
                      <div style={{ flex: 1, height: 1, background: "var(--surface-high)" }} />
                    </div>
                  );

                  const FieldNote = ({ children }: { children: React.ReactNode }) => (
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--text-ghost)", fontFamily: F, lineHeight: 1.4 }}>{children}</p>
                  );

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                      {/* Name + Months */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <SectionTitle>Identity</SectionTitle>
                        <div>
                          <label style={labelStyle}>Preset Name</label>
                          <input value={p.name} onChange={e => patchPreset(p.id, { name: e.target.value })}
                            style={inputStyle} placeholder="e.g. Winter, Summer, Default"
                            onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                            onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Assign Months</label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: isMobile ? 4 : 7 }}>
                            {MONTHS.map((name, i) => {
                              const mo    = i + 1;
                              const owned = p.months.includes(mo);
                              const taken = !owned && presets.some(pr => pr.id !== p.id && pr.months.includes(mo));
                              return (
                                <button key={mo} onClick={() => toggleMonth(p.id, mo)}
                                  style={{ padding: isMobile ? "5px 0" : "5px 13px", borderRadius: 2, border: owned ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: owned ? "var(--accent-bg)" : "var(--surface-low)", fontFamily: F, fontSize: isMobile ? 10 : 12, fontWeight: 600, color: owned ? "var(--accent)" : taken ? "var(--text-phantom)" : "var(--text-ghost)", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                                  {name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Method & School */}
                      <div>
                        <SectionTitle>Method & School</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Calculation Method</label>
                            <Select value={p.method} onChange={v => patchPreset(p.id, { method: v })} options={CALC_METHODS} />
                          </div>
                          <div>
                            <label style={labelStyle}>Asr School</label>
                            <Select value={p.madhab} onChange={v => patchPreset(p.id, { madhab: v })} options={MADHABS} />
                          </div>
                        </div>
                      </div>

                      {/* Angles */}
                      <div>
                        <SectionTitle>Angles</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: isMobile ? 10 : 14 }}>
                          {([
                            { label: "Fajr Angle", val: isCustom ? p.fajrAngle : av(angles.fajr), key: "fajrAngle" as const, locked: !isCustom && angles.fajr !== null, na: !isCustom && angles.fajr === null },
                            { label: "Isha Angle", val: isCustom ? p.ishaAngle : av(angles.isha), key: "ishaAngle" as const, locked: !isCustom && angles.isha !== null, na: !isCustom && angles.isha === null },
                            { label: "Isha Interval (min)", val: isCustom ? p.ishaInterval : av(angles.ishaInterval), key: "ishaInterval" as const, locked: !isCustom && angles.ishaInterval !== null, na: !isCustom && angles.ishaInterval === null },
                            { label: "Maghrib Angle", val: isCustom ? p.maghribAngle : av(angles.maghrib), key: "maghribAngle" as const, locked: !isCustom && angles.maghrib !== null, na: !isCustom && angles.maghrib === null },
                          ]).map(f => {
                            const disabled = !isCustom;
                            return (
                              <div key={f.key}>
                                <label style={labelStyle}>{f.label}</label>
                                <input
                                  value={f.val} type="number" step="0.1" placeholder="—"
                                  disabled={disabled}
                                  onChange={e => { if (!disabled) patchPreset(p.id, { [f.key]: e.target.value }); }}
                                  style={{ ...inputStyle, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "text" }}
                                />
                                {disabled && f.locked && <FieldNote>Defined by {methodLabel}</FieldNote>}
                                {disabled && f.na && <FieldNote>Not used by {methodLabel}</FieldNote>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Edge Cases */}
                      <div>
                        <SectionTitle>Edge Cases</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>High Latitude Rule</label>
                            <Select value={p.highLatitudeRule} onChange={v => patchPreset(p.id, { highLatitudeRule: v })} options={HIGH_LATITUDE_RULES} />
                          </div>
                          <div>
                            <label style={labelStyle}>Polar Circle Resolution</label>
                            <Select value={p.polarCircleResolution} onChange={v => patchPreset(p.id, { polarCircleResolution: v })} options={POLAR_CIRCLE_RESOLUTIONS} />
                          </div>
                          <div>
                            <label style={labelStyle}>Shafaq</label>
                            <Select value={p.shafaq} disabled={!isMoon} onChange={v => patchPreset(p.id, { shafaq: v })} options={SHAFAQ_OPTIONS} />
                            {!isMoon && <FieldNote>Moonsighting Committee only.</FieldNote>}
                          </div>
                        </div>
                      </div>

                      {/* Output */}
                      <div>
                        <SectionTitle>Output</SectionTitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: 10 }}>
                            {([
                              { key: "adjustFajr"    as const, label: "Fajr"    },
                              { key: "adjustSunrise" as const, label: "Sunrise" },
                              { key: "adjustDhuhr"   as const, label: "Dhuhr"   },
                              { key: "adjustAsr"     as const, label: "Asr"     },
                              { key: "adjustMaghrib" as const, label: "Maghrib" },
                              { key: "adjustIsha"    as const, label: "Isha"    },
                            ]).map(f => (
                              <div key={f.key}>
                                <label style={labelStyle}>{f.label}</label>
                                <input value={p[f.key]} type="number" step="1" placeholder="0"
                                  onChange={e => patchPreset(p.id, { [f.key]: e.target.value })}
                                  style={{ ...inputStyle, textAlign: "center" }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ maxWidth: isMobile ? "100%" : 200 }}>
                            <label style={labelStyle}>Rounding</label>
                            <Select value={p.rounding} onChange={v => patchPreset(p.id, { rounding: v })} options={ROUNDING_OPTIONS} />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {!allAssigned && unassigned.length > 0 && (
                  <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "rgba(234,179,8,0.8)" }}>warning</span>
                    <span style={{ fontSize: 13, color: "rgba(234,179,8,0.8)", fontWeight: 500 }}>
                      Unassigned: {unassigned.map(m => MONTHS[m - 1]).join(", ")}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setStep(3)} style={secondaryBtn}>Back</button>
                  <button onClick={() => { if (allAssigned) setStep(5); }}
                    disabled={!allAssigned}
                    style={{ ...primaryBtn, flex: 1, width: "auto", opacity: !allAssigned ? 0.4 : 1, cursor: !allAssigned ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (allAssigned) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 5 — Monthly schedule ════ */}
          {step === 5 && (() => {
            const year        = scheduleYear;
            const ms          = String(activeMo).padStart(2, "0");
            const daysInMonth = new Date(year, activeMo, 0).getDate();
            const showCalc    = source === "auto" && !refLoading && Object.keys(calcTimes).length > 0;
            const jummahCount = jummahEnabled.filter(Boolean).length;
            const tdPx        = "2px 6px";
            const thPx        = "8px 10px";
            const txtSz       = 10.5;
            const cellInp: React.CSSProperties = {
              width: "100%", background: "transparent", border: "1px solid transparent",
              borderRadius: 2, padding: "3px 6px", fontSize: txtSz, color: "#ffffff",
              fontFamily: F, outline: "none", textAlign: "center", transition: "border-color 0.15s",
            };

            return (
              <div>

                {/* ── Batch summary modal ── */}
                {showBatchSummary && (() => {
                  const lines: { label: string; value: string; skip: boolean }[] = [];
                  for (const pr of PRAYERS) {
                    const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[pr];
                    const iCell = (batchIqama as unknown as Record<string, BatchCell>)[pr];
                    const aEmpty = aCell.mode === "fixed" && !aCell.fixed;
                    const iEmpty = iCell.mode === "fixed" && !iCell.fixed;
                    lines.push({ label: `${P_LABEL[pr]} Adhan`, value: aEmpty ? "—" : aCell.mode === "fixed" ? aCell.fixed : `+${aCell.offset} min from start`, skip: aEmpty });
                    lines.push({ label: `${P_LABEL[pr]} Iqama`,  value: iEmpty ? "—" : iCell.mode === "fixed" ? iCell.fixed : `+${iCell.offset} min from adhan`, skip: iEmpty });
                  }
                  const jLines = ([1, 2, 3] as const)
                    .map(n => jummahEnabled[n - 1] ? { label: `Jummah ${n}`, value: jummahTimes[`j${n}` as "j1"|"j2"|"j3"] || "—" } : null)
                    .filter(Boolean) as { label: string; value: string }[];
                  const hasAny = lines.some(l => !l.skip) || jLines.length > 0;
                  return (
                    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
                      onClick={() => setShowBatchSummary(false)}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 4, width: 440, maxWidth: "90vw", overflow: "hidden", fontFamily: F }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 4 }}>Confirm</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "-0.02em" }}>Prayer Schedule Builder</div>
                          </div>
                          <button onClick={() => setShowBatchSummary(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-ghost)", padding: 4, display: "flex" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                          </button>
                        </div>
                        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--surface-high)", display: "flex", gap: 20 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", marginBottom: 2 }}>Days</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Day {batchFromDay} → Day {Math.min(daysInMonth, batchToDay)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", marginBottom: 2 }}>Month</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{MONTHS[activeMo - 1]}</div>
                          </div>
                        </div>
                        <div style={{ padding: "14px 22px", maxHeight: 280, overflowY: "auto" }}>
                          {!hasAny
                            ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-ghost)" }}>No changes to apply — all fields are empty.</p>
                            : <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {lines.filter(l => !l.skip).map((l, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--surface-low)", borderRadius: 2, border: "1px solid var(--surface-high)" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" }}>{l.label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{l.value}</span>
                                  </div>
                                ))}
                                {jLines.map((l, i) => (
                                  <div key={`j${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--surface-low)", borderRadius: 2, border: "1px solid var(--accent-border)" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" }}>{l.label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{l.value}</span>
                                  </div>
                                ))}
                              </div>
                          }
                        </div>
                        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--surface-high)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button onClick={() => setShowBatchSummary(false)}
                            style={{ padding: "8px 18px", borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: F, background: "transparent", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)", cursor: "pointer" }}>
                            Cancel
                          </button>
                          <button disabled={!hasAny} onClick={() => { setShowBatchSummary(false); applyBatch(); }}
                            style={{ padding: "8px 18px", borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: F, background: hasAny ? "var(--accent)" : "var(--surface-high)", border: "none", color: hasAny ? "var(--accent-text)" : "var(--text-ghost)", cursor: hasAny ? "pointer" : "not-allowed" }}>
                            Confirm & Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                    {source === "excel" ? "Step 2 of 3" : "Step 5 of 6"}
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>
                    {source === "excel" ? "Upload Prayer Schedule" : "Prayer Schedule Builder"}
                  </h1>
                  <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>
                    {source === "excel"
                      ? "Upload your Excel spreadsheet to import prayer times."
                      : <>Set adhan and iqama times month by month.
                        {source === "auto" && refLoading && <><span> Computing times…</span> <Spinner /></>}
                        {showCalc && <span style={{ color: "var(--accent)", fontWeight: 600 }}> Calculated start times shown.</span>}
                      </>
                    }
                  </p>
                </div>

                <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 24 }}>

                  {/* ── Excel Upload Section ── */}
                  {source === "excel" && (
                    <div style={{ marginBottom: 20 }}>
                      <input type="file" accept=".xlsx,.xls" onChange={handleXlsxFile} id="xlsxUploadOnboarding" style={{ display: "none" }} />
                      {xlsxSuccess ? (
                        /* Success state */
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }}>check_circle</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", marginBottom: 2 }}>{xlsxFile?.name}</div>
                            <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{xlsxSuccess}</div>
                          </div>
                          <label htmlFor="xlsxUploadOnboarding" style={{ padding: "6px 14px", borderRadius: 2, fontSize: 12, fontWeight: 600, fontFamily: F, border: "1px solid var(--accent-border)", color: "var(--accent)", background: "transparent", cursor: "pointer" }}>
                            Replace
                          </label>
                        </div>
                      ) : (
                        /* Drop zone */
                        <label htmlFor="xlsxUploadOnboarding" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", border: "2px dashed var(--outline-variant)", borderRadius: 2, cursor: "pointer", background: "var(--surface-low)", transition: "border-color 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-border)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--outline-variant)")}>
                          <div style={{ width: 52, height: 52, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 26, color: "var(--accent)" }}>upload_file</span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", marginBottom: 4 }}>Click to upload Excel file</div>
                            <div style={{ fontSize: 12, color: "var(--text-ghost)" }}>.xlsx or .xls — your prayer times spreadsheet</div>
                          </div>
                          {xlsxError && <p style={{ color: "#f87171", fontSize: 12, fontWeight: 600, margin: 0 }}>{xlsxError}</p>}
                        </label>
                      )}
                    </div>
                  )}

                  {/* ── Prayer Schedule Builder (collapsible) ── */}
                  <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
                    {/* Header row */}
                    <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: batchOpen ? "1px solid var(--surface-high)" : "none", cursor: "pointer" }}
                      onClick={() => setBatchOpen(o => !o)}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", transition: "transform 0.2s", transform: batchOpen ? "rotate(90deg)" : "none", flexShrink: 0 }}>chevron_right</span>
                          <div>
                            <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--on-surface)", margin: 0, letterSpacing: "-0.02em" }}>Prayer Schedule Builder</h2>
                            <p style={{ fontSize: 12, color: "var(--text-ghost)", fontWeight: 400, margin: "3px 0 0" }}>Set fixed times or offsets per prayer, then apply to a day range</p>
                          </div>
                        </div>
                        {batchOpen && !isMobile && (
                          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>From</span>
                              <input type="number" min={1} max={daysInMonth} value={batchFromDay}
                                onChange={e => setBatchFromDay(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ ...inputStyle, width: 64, textAlign: "center", padding: "6px 8px", fontSize: 13 }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>To</span>
                              <input type="number" min={1} max={daysInMonth} value={batchToDay}
                                onChange={e => setBatchToDay(Math.min(daysInMonth, parseInt(e.target.value) || daysInMonth))}
                                style={{ ...inputStyle, width: 64, textAlign: "center", padding: "6px 8px", fontSize: 13 }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "transparent" }}>x</span>
                              <button onClick={() => setShowBatchSummary(true)}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", height: 36, borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: F, background: "var(--accent)", border: "1px solid var(--accent)", color: "var(--accent-text)", cursor: "pointer", transition: "background 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Mobile: From/To/Apply stacked below header */}
                      {batchOpen && isMobile && (
                        <div onClick={e => e.stopPropagation()} style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>From Day</span>
                            <input type="number" min={1} max={daysInMonth} value={batchFromDay}
                              onChange={e => setBatchFromDay(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ ...inputStyle, textAlign: "center", padding: "8px", fontSize: 13 }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>To Day</span>
                            <input type="number" min={1} max={daysInMonth} value={batchToDay}
                              onChange={e => setBatchToDay(Math.min(daysInMonth, parseInt(e.target.value) || daysInMonth))}
                              style={{ ...inputStyle, textAlign: "center", padding: "8px", fontSize: 13 }} />
                          </div>
                          <button onClick={() => setShowBatchSummary(true)}
                            style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: F, background: "var(--accent)", border: "1px solid var(--accent)", color: "var(--accent-text)", cursor: "pointer" }}>
                            Apply to Range
                          </button>
                        </div>
                      )}
                    </div>

                    {batchOpen && (<>
                      {isMobile ? (
                        /* ── Mobile: stacked prayer cards ── */
                        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                          {PRAYERS.map(pr => (
                            <div key={pr} style={{ background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2 }}>
                              <div style={{ padding: "7px 12px", borderBottom: "1px solid var(--surface-high)", background: "var(--surface-low)" }}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--on-surface)" }}>{P_LABEL[pr]}</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                <div style={{ padding: "10px 12px", borderRight: "1px solid var(--surface-high)" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 6 }}>Adhan</div>
                                  <BatchControl
                                    cell={(batchAdhan as unknown as Record<string, BatchCell>)[pr]}
                                    onUpdate={patch => setBatchAdhan(prev => ({ ...prev, [pr]: { ...(prev as unknown as Record<string, BatchCell>)[pr], ...patch } }))}
                                    placeholder="6:00 AM" accentBg="" accent="" />
                                </div>
                                <div style={{ padding: "10px 12px" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 6 }}>Iqama</div>
                                  <BatchControl
                                    cell={(batchIqama as unknown as Record<string, BatchCell>)[pr]}
                                    onUpdate={patch => setBatchIqama(prev => ({ ...prev, [pr]: { ...(prev as unknown as Record<string, BatchCell>)[pr], ...patch } }))}
                                    placeholder="6:20 AM" accentBg="" accent="" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* ── Desktop: horizontal grid ── */
                        <div>
                        {/* Column headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                          <div style={{ padding: "10px 16px" }} />
                          {PRAYERS.map(pr => (
                            <div key={pr} style={{ padding: "10px 16px", borderLeft: "1px solid var(--surface-high)" }}>
                              <span style={{ fontWeight: 800, color: "var(--on-surface)", fontSize: 13 }}>{P_LABEL[pr]}</span>
                            </div>
                          ))}
                        </div>

                        {/* Adhan row */}
                        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>Adhan</span>
                          </div>
                          {PRAYERS.map(pr => (
                            <div key={pr} style={{ padding: "14px 16px", borderLeft: "1px solid var(--surface-high)" }}>
                              <BatchControl
                                cell={(batchAdhan as unknown as Record<string, BatchCell>)[pr]}
                                onUpdate={patch => setBatchAdhan(prev => ({ ...prev, [pr]: { ...(prev as unknown as Record<string, BatchCell>)[pr], ...patch } }))}
                                placeholder="6:00 AM" accentBg="" accent="" />
                            </div>
                          ))}
                        </div>

                        {/* Iqama row */}
                        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>Iqama</span>
                          </div>
                          {PRAYERS.map(pr => (
                            <div key={pr} style={{ padding: "14px 16px", borderLeft: "1px solid var(--surface-high)" }}>
                              <BatchControl
                                cell={(batchIqama as unknown as Record<string, BatchCell>)[pr]}
                                onUpdate={patch => setBatchIqama(prev => ({ ...prev, [pr]: { ...(prev as unknown as Record<string, BatchCell>)[pr], ...patch } }))}
                                placeholder="6:20 AM" accentBg="" accent="" />
                            </div>
                          ))}
                        </div>
                        </div>
                      )}

                      {/* Weekend Isha */}
                      <div style={{ padding: isMobile ? "14px 16px" : "20px 24px" }}>
                        <div style={{ marginBottom: 14 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--on-surface)" }}>Weekend Isha</span>
                          <p style={{ fontSize: 12, color: "var(--text-ghost)", fontWeight: 400, marginTop: 2, marginBottom: 0 }}>Override Isha iqama on selected days</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            {[{ id: "fri", label: "Fri" }, { id: "sat", label: "Sat" }, { id: "sun", label: "Sun" }].map(d => {
                              const active = weekendIshaDays.includes(d.id);
                              return (
                                <button key={d.id}
                                  onClick={() => setWeekendIshaDays(prev => active ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                                  style={{ flex: 1, padding: "7px 0", borderRadius: 2, fontSize: 12, fontWeight: 700, fontFamily: F, border: active ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: active ? "var(--accent-bg)" : "transparent", color: active ? "var(--accent)" : "var(--text-phantom)", cursor: "pointer", transition: "all 0.15s" }}>
                                  {d.label}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 6 }}>Iqama Time</div>
                            <LocalInput value={weekendIshaIqama}
                              onCommit={v => setWeekendIshaIqama(formatTimeInput(v))}
                              placeholder="10:00 PM"
                              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 800, color: "var(--on-surface)", fontFamily: F } as React.CSSProperties} />
                          </div>
                        </div>
                      </div>

                    </>)}
                  </div>

                  {/* ── Jummah ── */}
                  <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, marginBottom: 20, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: jummahEnabled.some(Boolean) ? 12 : 0 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--on-surface)", marginBottom: 2 }}>Jummah</div>
                        <p style={{ fontSize: 12, color: "var(--text-ghost)", fontWeight: 400, margin: 0 }}>Applied to Fridays in the day range</p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        {([1, 2, 3] as const).map(n => {
                          const on = jummahEnabled[n - 1];
                          return (
                            <button key={n}
                              onClick={() => setJummahEnabled(j => { const c = [...j] as [boolean, boolean, boolean]; c[n - 1] = !c[n - 1]; return c; })}
                              style={{ padding: "4px 14px", borderRadius: 2, fontFamily: F, fontSize: 11, fontWeight: 700, cursor: "pointer", border: on ? "1px solid var(--accent-border)" : "1px solid var(--outline-variant)", background: on ? "var(--accent-bg)" : "transparent", color: on ? "var(--accent)" : "var(--text-ghost)", transition: "all 0.15s" }}>
                              {n === 1 ? "1st" : n === 2 ? "2nd" : "3rd"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {jummahEnabled.some(Boolean) && (
                      <div style={{ display: "flex", gap: 10 }}>
                        {([1, 2, 3] as const).map(n => {
                          if (!jummahEnabled[n - 1]) return null;
                          const key = `j${n}` as "j1" | "j2" | "j3";
                          return (
                            <div key={n} style={{ flex: 1, background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "10px 12px" }}>
                              <span style={{ display: "block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 6 }}>Khutbah {n}</span>
                              <LocalInput value={jummahTimes[key]}
                                onCommit={v => setJummahTimes(t => ({ ...t, [key]: formatTimeInput(v) }))}
                                placeholder="1:15 PM"
                                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 800, color: "var(--on-surface)", fontFamily: F } as React.CSSProperties} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Month / Year navigation ── */}
                  {isMobile ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 16 }}>
                      <Select
                        value={String(activeMo)}
                        onChange={v => { const mo = Number(v); setActiveMo(mo); setBatchFromDay(1); setBatchToDay(new Date(year, mo, 0).getDate()); }}
                        options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m + (monthFilled(i + 1) ? " ●" : "") }))}
                      />
                      <Select
                        value={String(scheduleYear)}
                        onChange={v => setScheduleYear(Number(v))}
                        options={[-1, 0, 1].map(d => ({ value: String(year + d), label: String(year + d) }))}
                        style={{ minWidth: 90 }}
                      />
                    </div>
                  ) : (
                    <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: "10px 14px", marginBottom: 20 }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {MONTHS.map((m, i) => {
                          const mo = i + 1; const active = activeMo === mo; const filled = monthFilled(mo);
                          return (
                            <button key={mo} onClick={() => { setActiveMo(mo); setBatchFromDay(1); setBatchToDay(new Date(year, mo, 0).getDate()); }}
                              style={{ flex: 1, padding: "6px 0", borderRadius: 2, fontFamily: F, fontSize: 12, fontWeight: 700, cursor: "pointer", border: active ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: active ? "var(--accent-bg)" : "var(--surface-mid)", color: active ? "var(--accent)" : "var(--text-ghost)", transition: "all 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              {m}
                              {filled && <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "var(--accent)" : "var(--outline)" }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Schedule table ── */}
                  <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, marginBottom: 20 }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--surface-high)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 3 }}>Monthly Schedule</div>
                      <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--on-surface)", margin: 0, letterSpacing: "-0.02em" }}>{MONTHS[activeMo - 1]} {year}</h2>
                    </div>
                    {isMobile ? (
                      /* ── Mobile: vertical day-cards ── */
                      <div style={{ padding: "8px 12px 12px" }}>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day      = i + 1;
                          const ds       = String(day).padStart(2, "0");
                          const dateStr  = `${year}-${ms}-${ds}`;
                          const isFriday = new Date(`${dateStr}T12:00:00`).getDay() === 5;
                          const todayStr = new Date().toISOString().split("T")[0];
                          const isToday  = dateStr === todayStr;
                          const weekday  = new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
                          return (
                            <div key={day} style={{ marginBottom: 8, background: isToday ? "rgba(52,211,153,0.06)" : "var(--surface-mid)", border: isToday ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", borderRadius: 2 }}>
                              {/* Day header */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderBottom: "1px solid var(--surface-high)" }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "-0.01em" }}>{ms}/{ds}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-ghost)" }}>{weekday}</span>
                                {isToday && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, padding: "2px 6px" }}>Today</span>}
                              </div>
                              {/* Column labels (once per card) */}
                              <div style={{ display: "grid", gridTemplateColumns: showCalc ? "80px 1fr 1fr 1fr" : "80px 1fr 1fr", padding: "4px 12px 2px", borderBottom: "1px solid var(--surface-high)" }}>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-ghost)" }} />
                                {showCalc && <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-ghost)", textAlign: "center" }}>Start</span>}
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-ghost)", textAlign: "center" }}>Adhan</span>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-ghost)", textAlign: "center" }}>Iqama</span>
                              </div>
                              {/* Prayer rows */}
                              {PRAYERS.map((pr, pi) => {
                                const pair  = schedule[activeMo][day]?.[pr] ?? { adhan: "", iqama: "" };
                                const start = showCalc ? to12h(calcTimes[dateStr]?.[pr] ?? "") : "";
                                return (
                                  <div key={pr} style={{ display: "grid", gridTemplateColumns: showCalc ? "80px 1fr 1fr 1fr" : "80px 1fr 1fr", padding: "4px 12px", borderBottom: pi < PRAYERS.length - 1 || (isFriday && jummahCount > 0) ? "1px solid var(--surface-high)" : undefined, alignItems: "center" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>{P_LABEL[pr]}</span>
                                    {showCalc && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-ghost)", textAlign: "center" }}>{start || "—"}</span>}
                                    <div style={{ textAlign: "center" }}>
                                      <LocalInput value={pair.adhan}
                                        onCommit={v => setDayTime(activeMo, day, pr, "adhan", formatTimeInput(v))}
                                        placeholder="—" style={{ ...cellInp, textAlign: "center" }} />
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <LocalInput value={pair.iqama}
                                        onCommit={v => setDayTime(activeMo, day, pr, "iqama", formatTimeInput(v))}
                                        placeholder="—" style={{ ...cellInp, textAlign: "center", fontWeight: 700 }} />
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Jummah rows (Fridays only) */}
                              {isFriday && jummahEnabled.map((on, j) => on ? (
                                <div key={j} style={{ display: "grid", gridTemplateColumns: showCalc ? "80px 1fr 1fr 1fr" : "80px 1fr 1fr", padding: "4px 12px", borderBottom: j < jummahCount - 1 ? "1px solid var(--surface-high)" : undefined, alignItems: "center" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>Khutbah {j + 1}</span>
                                  {showCalc && <span />}
                                  <div style={{ textAlign: "center" }}>
                                    <LocalInput
                                      value={(schedule[activeMo][day] as unknown as Record<string, PrayerPair>)?.[`jummah_${j + 1}`]?.adhan ?? ""}
                                      onCommit={v => setDayTime(activeMo, day, `jummah_${j + 1}`, "adhan", formatTimeInput(v))}
                                      placeholder="—" style={{ ...cellInp, textAlign: "center", color: "var(--accent)", fontWeight: 700 }} />
                                  </div>
                                  <div />
                                </div>
                              ) : null)}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ── Desktop: table ── */
                      <div>
                      {(() => {
                        const datePct  = 5;
                        const dataColCount = PRAYERS.length * (showCalc ? 3 : 2) + jummahCount;
                        const colPct   = parseFloat(((100 - datePct) / dataColCount).toFixed(4));
                        return (
                      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                          <col style={{ width: `${datePct}%` }} />
                          {PRAYERS.map(pr => (
                            <React.Fragment key={pr}>
                              {showCalc && <col style={{ width: `${colPct}%` }} />}
                              <col style={{ width: `${colPct}%` }} />
                              <col style={{ width: `${colPct}%` }} />
                            </React.Fragment>
                          ))}
                          {jummahEnabled.map((on, j) => on ? <col key={j} style={{ width: `${colPct}%` }} /> : null)}
                        </colgroup>

                        <thead>
                          {/* Row 1 — prayer names */}
                          <tr style={{ borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                            <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", textAlign: "center" }}>Date</th>
                            {PRAYERS.map(pr => (
                              <th key={pr} colSpan={showCalc ? 3 : 2}
                                style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", textAlign: "center", borderLeft: "1px solid var(--surface-high)" }}>
                                {P_LABEL[pr]}
                              </th>
                            ))}
                            {jummahCount > 0 && (
                              <th colSpan={jummahCount}
                                style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", textAlign: "center", borderLeft: "1px solid var(--surface-high)" }}>
                                Jummah
                              </th>
                            )}
                          </tr>
                          {/* Row 2 — sub-labels */}
                          <tr style={{ borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                            <th />
                            {PRAYERS.map(pr => (
                              <React.Fragment key={pr}>
                                {showCalc && <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-ghost)" }}>Start</th>}
                                <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-ghost)" }}>Adhan</th>
                                <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-ghost)" }}>Iqama</th>
                              </React.Fragment>
                            ))}
                            {jummahEnabled.map((on, i) => on ? (
                              <th key={i} style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-ghost)" }}>
                                Khutbah {i + 1}
                              </th>
                            ) : null)}
                          </tr>
                        </thead>

                        <tbody>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day      = i + 1;
                            const ds       = String(day).padStart(2, "0");
                            const dateStr  = `${year}-${ms}-${ds}`;
                            const isFriday = new Date(`${dateStr}T12:00:00`).getDay() === 5;
                            const todayStr = new Date().toISOString().split("T")[0];
                            const isToday  = dateStr === todayStr;
                            return (
                              <tr key={day} style={{ borderBottom: "1px solid var(--surface-high)", background: isToday ? "rgba(52,211,153,0.05)" : i % 2 === 0 ? "var(--surface-low)" : "var(--surface)" }}>
                                <td style={{ padding: tdPx, fontWeight: 700, fontSize: txtSz, color: "var(--on-surface)", textAlign: "center" }}>
                                  {ms}/{ds}
                                </td>
                                {PRAYERS.map(pr => {
                                  const pair  = schedule[activeMo][day]?.[pr] ?? { adhan: "", iqama: "" };
                                  const start = showCalc ? to12h(calcTimes[dateStr]?.[pr] ?? "") : "";
                                  return (
                                    <React.Fragment key={pr}>
                                      {showCalc && (
                                        <td style={{ padding: tdPx, borderLeft: "1px solid var(--surface-high)", fontWeight: 600, fontSize: txtSz, color: "var(--text-ghost)", textAlign: "center" }}>
                                          {start || "—"}
                                        </td>
                                      )}
                                      <td style={{ padding: "2px 4px", borderLeft: "1px solid var(--surface-high)" }}>
                                        <LocalInput value={pair.adhan}
                                          onCommit={v => setDayTime(activeMo, day, pr, "adhan", formatTimeInput(v))}
                                          placeholder="—" style={cellInp} />
                                      </td>
                                      <td style={{ padding: "2px 4px", borderLeft: "1px solid var(--surface-high)" }}>
                                        <LocalInput value={pair.iqama}
                                          onCommit={v => setDayTime(activeMo, day, pr, "iqama", formatTimeInput(v))}
                                          placeholder="—" style={{ ...cellInp, fontWeight: 700 }} />
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                                {jummahEnabled.map((on, j) => on ? (
                                  <td key={j} style={{ padding: "2px 4px", borderLeft: "1px solid var(--surface-high)" }}>
                                    {isFriday ? (
                                      <LocalInput
                                        value={(schedule[activeMo][day] as unknown as Record<string, PrayerPair>)?.[`jummah_${j + 1}`]?.adhan ?? ""}
                                        onCommit={v => setDayTime(activeMo, day, `jummah_${j + 1}`, "adhan", formatTimeInput(v))}
                                        placeholder="—" style={{ ...cellInp, color: "var(--accent)", fontWeight: 700 }} />
                                    ) : null}
                                  </td>
                                ) : null)}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                        );
                      })()}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={goBack} style={secondaryBtn}>Back</button>
                    <button onClick={handleFinish} disabled={saving}
                      style={{ ...primaryBtn, flex: 1, width: "auto", opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                      onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
                      {saving ? <><Spinner />{saveMsg}</> : "Complete Setup"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Skip */}
      {step > 0 && !saving && (
        <div style={{ textAlign: "center", padding: "0 0 24px" }}>
          <button onClick={skip}
            style={{ fontSize: 12, color: "var(--text-ghost)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: F, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--on-surface-variant)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-ghost)")}>
            Skip setup for now
          </button>
        </div>
      )}

      {/* ── Excel Column Mapping Modal ── */}
      {xlsxPreview && (() => {
        const rows        = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
        const headers     = rows[xlsxPreview.headerRowIdx]?.map(h => String(h ?? "").trim()) ?? [];
        const previewRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c)).slice(0, 5);
        const colOpts     = ["", ...headers];
        const mappedSet   = new Set(Object.values(xlsxColMap).filter(Boolean));

        const colLabel = (h: string) => {
          const entry = Object.entries(xlsxColMap).find(([, v]) => v === h);
          if (!entry) return null;
          const labels: Record<string, string> = {
            date: "Date", day: "Day #", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr",
            maghrib: "Maghrib", isha: "Isha", fajr_iqama: "Fajr Iqama",
            dhuhr_iqama: "Dhuhr Iqama", asr_iqama: "Asr Iqama",
            maghrib_iqama: "Maghrib Iqama", isha_iqama: "Isha Iqama",
          };
          return labels[entry[0]] ?? entry[0];
        };

        const selStyle: React.CSSProperties = { width: "100%", background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "6px 10px", fontSize: 12, color: "var(--on-surface)", fontFamily: F, outline: "none", appearance: "none" as const };
        const sel = (key: string) => (
          <select style={selStyle} value={xlsxColMap[key] ?? ""} onChange={e => setXlsxColMap(m => ({ ...m, [key]: e.target.value }))}>
            {colOpts.map(o => <option key={o} value={o}>{o || "— none —"}</option>)}
          </select>
        );

        const PRAYER_ROWS = [
          { key: "fajr",    label: "Fajr",    iqama: "fajr_iqama" },
          { key: "dhuhr",   label: "Dhuhr",   iqama: "dhuhr_iqama" },
          { key: "asr",     label: "Asr",     iqama: "asr_iqama" },
          { key: "maghrib", label: "Maghrib", iqama: "maghrib_iqama" },
          { key: "isha",    label: "Isha",    iqama: "isha_iqama" },
        ];

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.88)" }}>
            <div style={{ width: "100%", maxWidth: "64rem", background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, boxShadow: "0 25px 60px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", overflow: "hidden", height: "90vh" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 28px", borderBottom: "1px solid var(--surface-high)", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <div style={{ width: 38, height: 38, borderRadius: 2, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent)" }}>upload_file</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--on-surface)", margin: 0, letterSpacing: "-0.02em" }}>Map Columns</h2>
                  <p style={{ fontSize: 11, color: "var(--text-ghost)", marginTop: 2, marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{xlsxFile?.name}</p>
                </div>
                {xlsxPreview.sheets.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 3 }}>
                    {xlsxPreview.sheets.map(s => (
                      <button key={s} onClick={() => {
                        const r = xlsxPreview.sheetRows[s];
                        const kws = ["fajr","dhuhr","zuhr","asr","maghrib","isha","date","day"];
                        const hi  = r.findIndex(row => row.some(c => kws.some(k => String(c ?? "").toLowerCase().includes(k))));
                        setXlsxPreview(p => p ? { ...p, selectedSheet: s, headerRowIdx: Math.max(0, hi) } : p);
                        if (hi >= 0) xlsxAutoMap(r[hi].map(h => String(h ?? "").trim()));
                      }} style={{ padding: "5px 12px", borderRadius: 2, fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", transition: "all 0.15s", background: xlsxPreview.selectedSheet === s ? "var(--accent-bg)" : "transparent", border: xlsxPreview.selectedSheet === s ? "1px solid var(--accent-border)" : "1px solid transparent", color: xlsxPreview.selectedSheet === s ? "var(--accent)" : "var(--text-ghost)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "var(--text-ghost)", fontWeight: 600 }}>Header row</span>
                  <input type="number" min={1} max={rows.length}
                    value={xlsxPreview.headerRowIdx + 1}
                    onChange={e => {
                      const idx = Math.max(0, parseInt(e.target.value) - 1);
                      setXlsxPreview(p => p ? { ...p, headerRowIdx: idx } : p);
                      xlsxAutoMap((rows[idx] ?? []).map(h => String(h ?? "").trim()));
                    }}
                    style={{ width: 52, background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "5px 8px", fontSize: 13, color: "var(--on-surface)", textAlign: "center", outline: "none", fontFamily: F }}
                  />
                </div>
                <button onClick={() => setXlsxPreview(null)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer", flexShrink: 0 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

                {/* Top half: data preview */}
                <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--surface-high)", flex: "0 0 40%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px 6px", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>Data Preview</span>
                    <span style={{ fontSize: 10, color: "var(--text-ghost)", fontWeight: 600 }}>· first 5 rows after header</span>
                  </div>
                  {headers.length > 0 ? (
                    <div style={{ overflow: "auto", flex: 1, padding: "0 16px 14px" }}>
                      <table style={{ fontSize: 11, borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
                        <thead>
                          <tr>
                            {headers.map((h, i) => {
                              const label = colLabel(h);
                              return (
                                <th key={i} style={{ padding: "7px 14px", textAlign: "left", whiteSpace: "nowrap", borderBottom: label ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: label ? "var(--accent-bg)" : "transparent" }}>
                                  <div style={{ fontWeight: 700, color: label ? "var(--accent)" : "var(--text-ghost)" }}>{h}</div>
                                  {label && <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2, opacity: 0.7, color: "var(--accent)" }}>{label}</div>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--surface-low)" : "var(--surface)" }}>
                              {headers.map((h, ci) => (
                                <td key={ci} style={{ padding: "5px 14px", whiteSpace: "nowrap", borderBottom: "1px solid var(--surface-mid)", color: mappedSet.has(h) ? "var(--on-surface)" : "var(--text-ghost)", fontWeight: mappedSet.has(h) ? 600 : 400 }}>
                                  {String(row[ci] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-ghost)", fontSize: 13, padding: "0 24px" }}>
                      No headers found at row {xlsxPreview.headerRowIdx + 1} — try a different header row number.
                    </div>
                  )}
                </div>

                {/* Bottom half: column mapping */}
                <div style={{ flex: 1, padding: "14px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "auto" }}>

                  {/* Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                    <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 4, height: 12, borderRadius: 2, background: "rgba(96,165,250,0.5)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>Date</span>
                    </div>
                    <div style={{ width: 200 }}>{sel("date")}</div>
                    <span style={{ fontSize: 10, color: "var(--text-ghost)", fontWeight: 600 }}>YYYY-MM-DD · DD/MM/YYYY · Excel serial</span>
                  </div>

                  <div style={{ borderTop: "1px solid var(--surface-high)", marginBottom: 10 }} />

                  {/* Prayer rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    <div style={{ display: "grid", gap: 10, alignItems: "center", marginBottom: 4, gridTemplateColumns: "90px 1fr 1fr" }}>
                      <div />
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center" }}>Adhan / Start</div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center" }}>Iqama</div>
                    </div>
                    {PRAYER_ROWS.map(p => (
                      <div key={p.key} style={{ display: "grid", gap: 10, alignItems: "center", gridTemplateColumns: "90px 1fr 1fr" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{p.label}</span>
                        {sel(p.key)}
                        {sel(p.iqama)}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 28px", borderTop: "1px solid var(--surface-high)" }}>
                {xlsxError
                  ? <p style={{ color: "#f87171", fontSize: 13, fontWeight: 600, flex: 1, margin: 0 }}>{xlsxError}</p>
                  : <p style={{ color: "var(--text-ghost)", fontSize: 11, flex: 1, margin: 0 }}>Highlighted columns will be imported. Unmapped prayers use auto-calculated defaults.</p>
                }
                <button onClick={() => setXlsxPreview(null)} style={{ padding: "8px 18px", borderRadius: 2, fontWeight: 600, fontSize: 13, fontFamily: F, border: "1px solid var(--outline-variant)", color: "var(--text-ghost)", background: "transparent", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleXlsxImport} disabled={isImporting || !xlsxColMap.date}
                  style={{ padding: "8px 26px", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: F, cursor: isImporting || !xlsxColMap.date ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s", background: isImporting || !xlsxColMap.date ? "var(--surface-low)" : "var(--accent)", border: isImporting || !xlsxColMap.date ? "1px solid var(--surface-mid)" : "1px solid var(--accent)", color: isImporting || !xlsxColMap.date ? "var(--text-ghost)" : "var(--accent-text)" }}>
                  {isImporting
                    ? <><Spinner /> Importing…</>
                    : <>Import <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
                  }
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(1.6);opacity:0} }
        select option { background: #131313; color: #c6c6c7; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
