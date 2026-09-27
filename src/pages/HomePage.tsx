import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "../lib/supabase";

import type { PrayerTime, Event, Announcement, BatchCell, BatchCell2, BatchConfig } from "../dashboard/types";
import { to12h, makeDefaultBatchAdhan, makeDefaultBatchIqama, applyBatchCell, addDefaultAdhanIqama } from "../dashboard/utils";
import {
  CALC_METHODS, generateMonthAdhan, mergePresetWithLocation,
  type PrayerPreset, type MonthPresetMap,
} from "../dashboard/constants";
import {
  PRAYER_KEYS, PRAYER_NAMES, activePeriod, adhanOf, defaultRule, describePeriod, iqamaFromRule, inferRule, normalizeConfig, ruleMatches, ruleOn,
  type IqamaConfig, type IqamaPeriod, type IqamaRule, type PrayerIqama, type PrayerKey,
} from "../dashboard/iqama";
import { addDaysISO, fmt12, localISODate, parseISODate, toMinutes } from "../dashboard/time";

import { useDashTheme } from "../dashboard/theme";
import DashboardShell, { DASHBOARD_TABS, type DashboardTab } from "../dashboard/DashboardShell";
import { ConfirmDialog, Modal, Spinner, Toast, type ToastState } from "../dashboard/ui";
import HomeTab from "../dashboard/tabs/HomeTab";
import PrayerTimesTab from "../dashboard/tabs/PrayerTimesTab";
import EventsTab, { type AnnouncementInput, type Composer, type EventInput } from "../dashboard/tabs/EventsTab";
import SettingsTab, { type GeneralSettings } from "../dashboard/tabs/SettingsTab";
import IqamaEditor from "../dashboard/components/IqamaEditor";
import PeriodEditor from "../dashboard/components/PeriodEditor";
import DayEditor from "../dashboard/components/DayEditor";
import JumuahEditor from "../dashboard/components/JumuahEditor";
import BulkEditor from "../dashboard/components/BulkEditor";
import ExcelImportModal, { type XlsxPreview } from "../dashboard/components/ExcelImportModal";
import TutorialOverlay from "../components/TutorialOverlay";

const TAB_IDS = DASHBOARD_TABS.map(t => t.id) as readonly string[];

const TIME_FIELDS = [
  "fajr", "dhuhr", "asr", "maghrib", "isha",
  "fajr_adhan", "fajr_iqama", "fajr_iqama_2", "fajr_iqama_3",
  "dhuhr_adhan", "dhuhr_iqama", "asr_adhan", "asr_iqama",
  "maghrib_adhan", "maghrib_iqama", "maghrib_iqama_2", "maghrib_iqama_3",
  "isha_adhan", "isha_iqama", "jummah_1", "jummah_2", "jummah_3",
];
const ROW_COLUMNS = ["date", ...TIME_FIELDS].join(",");

type Extra = {
  fajr: string[];
  maghrib: string[];
  jummah: string[];
  jummahSlots: [boolean, boolean, boolean];
  weekendIsha: { enabled: boolean; days: string[]; iqama: string };
};
type Jamaat = { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
type Location = { latitude: string; longitude: string; timezone: string };

const DEFAULT_EXTRA: Extra = {
  fajr: [],
  maghrib: [],
  jummah: ["", "", ""],
  jummahSlots: [false, false, false],
  weekendIsha: { enabled: true, days: ["fri", "sat"], iqama: "" },
};

const DEFAULT_PRESET: PrayerPreset = {
  id: "default",
  method: "NorthAmerica",
  fajrAngle: "", ishaAngle: "", ishaInterval: "", maghribAngle: "",
  madhab: "Shafi",
  highLatitudeRule: "recommended",
  polarCircleResolution: "AqrabBalad",
  shafaq: "General",
  rounding: "Nearest",
  adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0", adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0",
};
const DEFAULT_MONTH_MAP: MonthPresetMap = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, DEFAULT_PRESET.id]));

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getMasjidId = () => sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");

// Stored times come in as "05:42" or "5:42 AM"; the dashboard keeps the 12-hour form.
const normalizeRow = (row: Record<string, unknown>): PrayerTime => {
  const out: Record<string, unknown> = { ...row };
  for (const f of TIME_FIELDS) if (out[f]) out[f] = to12h(out[f] as string);
  return out as unknown as PrayerTime;
};

const groupByMonth = (rows: PrayerTime[]) => {
  const grouped: Record<string, PrayerTime[]> = {};
  for (const r of rows) (grouped[r.date.slice(0, 7)] ??= []).push(r);
  return grouped;
};

type DayRow = ReturnType<typeof generateMonthAdhan>[number];
const withoutSunrise = (t: DayRow) => {
  const { sunrise, ...rest } = t;
  void sunrise;
  return rest;
};

async function upsertInChunks(rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabaseAdmin.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
    if (error) throw new Error(error.message);
  }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const activeTab = (TAB_IDS.includes(tab ?? "") ? tab : "overview") as DashboardTab;
  const goTab = useCallback((t: DashboardTab) => { navigate(`/home/${t}`); window.scrollTo(0, 0); }, [navigate]);

  // ── Session guard ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) navigate("/", { replace: true });
  }, [navigate]);

  // ── Theme ───────────────────────────────────────────────────────────────
  const { dark, toggle: toggleTheme } = useDashTheme();

  // ── Clock ───────────────────────────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const today = localISODate(now);

  // ── Toast ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    clearTimeout(toastTimer.current);
    setToast({ message, kind });
    toastTimer.current = setTimeout(() => setToast(null), kind === "error" ? 7000 : 4500);
  }, []);

  // ── Tutorial ────────────────────────────────────────────────────────────
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem("tour_seen"));
  const closeTutorial = () => {
    localStorage.setItem("tour_seen", "1");
    setShowTutorial(false);
  };

  // ── Masjid details ──────────────────────────────────────────────────────
  const registeredEmail = sessionStorage.getItem("user_email") || localStorage.getItem("user_email") || "";
  const initialGeneral: GeneralSettings = {
    masjidName: sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name") || "Your masjid",
    address: "", city: "", province: "", postalCode: "", phone: "",
  };
  const [general, setGeneral] = useState<GeneralSettings>(initialGeneral);
  const [savedGeneral, setSavedGeneral] = useState<GeneralSettings>(initialGeneral);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Prayer settings ─────────────────────────────────────────────────────
  const defaultLocation: Location = { latitude: "43.651070", longitude: "-79.347015", timezone: "America/Toronto" };
  const [location, setLocationState] = useState<Location>(defaultLocation);
  const [savedLocation, setSavedLocation] = useState<Location>(defaultLocation);
  const setLocation = (patch: Partial<Location>) => setLocationState(l => ({ ...l, ...patch }));
  const [prayerSource, setPrayerSource] = useState<"excel" | "backend">("backend");
  const [pendingSource, setPendingSource] = useState<"excel" | "backend" | null>(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [extraTimings, setExtraTimings] = useState<Extra>(DEFAULT_EXTRA);
  const [jamaat, setJamaatState] = useState<Jamaat>({ fajr2: false, fajr3: false, maghrib2: false, maghrib3: false });
  const [iqamaConfig, setIqamaConfig] = useState<IqamaConfig>({});

  const [presets, setPresets] = useState<PrayerPreset[]>(() => readJSON("prayer_presets", [DEFAULT_PRESET]));
  const [savedPresets, setSavedPresets] = useState<PrayerPreset[]>(() => readJSON("prayer_presets", [DEFAULT_PRESET]));
  const [monthMap, setMonthMap] = useState<MonthPresetMap>(() => readJSON("month_preset_map", DEFAULT_MONTH_MAP));
  const [savedMonthMap, setSavedMonthMap] = useState<MonthPresetMap>(() => readJSON("month_preset_map", DEFAULT_MONTH_MAP));
  const [presetRegenConfirm, setPresetRegenConfirm] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // ── Prayer times ────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState(() => now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => today.slice(0, 7));
  const [prayerLoading, setPrayerLoading] = useState(() => !!getMasjidId());
  const [prayerTimesByMonth, setPrayerTimesByMonth] = useState<Record<string, PrayerTime[]>>({});
  const [upcomingRows, setUpcomingRows] = useState<PrayerTime[]>([]);
  const [scheduleEnd, setScheduleEnd] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(() => !!getMasjidId());
  const [generatingYear, setGeneratingYear] = useState<number | null>(null);

  // Excel import
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [xlsxPreview, setXlsxPreview] = useState<XlsxPreview | null>(null);
  const [colMap, setColMap] = useState<Record<string, string>>({
    date: "", day: "", fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "",
    fajr_iqama: "", dhuhr_iqama: "", asr_iqama: "", maghrib_iqama: "", isha_iqama: "",
    jummah1: "", jummah2: "", jummah3: "",
  });

  // Bulk editing
  const [bulkOpen, setBulkOpen] = useState(false);
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");
  const [batchAdhan, setBatchAdhan] = useState<BatchConfig>(makeDefaultBatchAdhan());
  const [batchIqama, setBatchIqama] = useState<BatchConfig>(makeDefaultBatchIqama());
  const emptyCell2: BatchCell2 = { mode: "fixed", offset: 0, fixed: "", enabled: false };
  const [batchIqama2, setBatchIqama2] = useState({ fajr: emptyCell2, maghrib: emptyCell2 });
  const [batchIqama3, setBatchIqama3] = useState({ fajr: emptyCell2, maghrib: emptyCell2 });
  const [applyingBatch, setApplyingBatch] = useState(false);
  const [batchApplied, setBatchApplied] = useState(false);
  const [batchError, setBatchError] = useState("");

  // Editors
  const [iqamaEdit, setIqamaEdit] = useState<{ prayer: PrayerKey | null } | null>(null);
  const [periodEdit, setPeriodEdit] = useState<{ prayer: PrayerKey | null; period?: IqamaPeriod } | null>(null);
  const [dayEdit, setDayEdit] = useState<PrayerTime | null>(null);
  const [jumuahOpen, setJumuahOpen] = useState(false);

  // ── Events & announcements ──────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [eventsLoading, setEventsLoading] = useState(() => !!getMasjidId());
  const [eventsView, setEventsView] = useState<"events" | "announcements">("announcements");
  const [composer, setComposer] = useState<Composer>(null);

  // ── Loading ─────────────────────────────────────────────────────────────
  const fetchYear = async (year: number) => {
    const masjidId = getMasjidId();
    if (!masjidId) return null;
    const { data, error } = await supabaseAdmin
      .from("prayer_times")
      .select(ROW_COLUMNS)
      .eq("masjid_id", masjidId)
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: true });
    if (error) return null;
    return groupByMonth(((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeRow));
  };

  const fetchUpcoming = async () => {
    const masjidId = getMasjidId();
    if (!masjidId) return null;
    const start = localISODate();
    const [rowsRes, lastRes] = await Promise.all([
      supabaseAdmin.from("prayer_times").select(ROW_COLUMNS).eq("masjid_id", masjidId)
        .gte("date", start).lte("date", addDaysISO(start, 90)).order("date", { ascending: true }),
      supabaseAdmin.from("prayer_times").select("date").eq("masjid_id", masjidId).order("date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (rowsRes.error || lastRes.error) return null;
    return {
      rows: ((rowsRes.data ?? []) as unknown as Record<string, unknown>[]).map(normalizeRow),
      end: (lastRes.data as { date: string } | null)?.date ?? null,
    };
  };

  const applyYear = (grouped: Record<string, PrayerTime[]> | null) => {
    if (grouped) setPrayerTimesByMonth(grouped);
    setPrayerLoading(false);
  };
  const applyUpcoming = (u: Awaited<ReturnType<typeof fetchUpcoming>>) => {
    if (u) { setUpcomingRows(u.rows); setScheduleEnd(u.end); }
    setScheduleLoading(false);
  };

  const refreshPrayerTimes = async () => {
    const [grouped, upcoming] = await Promise.all([fetchYear(selectedYear), fetchUpcoming()]);
    applyYear(grouped);
    applyUpcoming(upcoming);
  };

  useEffect(() => {
    let alive = true;
    fetchYear(selectedYear).then(g => { if (alive) applyYear(g); });
    return () => { alive = false; };
  }, [selectedYear]);

  // Reload "today" data on load and when the date rolls over while the dashboard is open.
  useEffect(() => {
    let alive = true;
    fetchUpcoming().then(u => { if (alive) applyUpcoming(u); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => {
    const masjidId = getMasjidId();
    if (!masjidId) return;
    supabaseAdmin
      .from("prayer_settings")
      .select("source, jummah_config, presets, prayer_config, latitude, longitude, timezone")
      .eq("masjid_id", masjidId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.jummah_config) {
          const { jamaatSettings: savedJamaat, ...timings } = data.jummah_config as Extra & { jamaatSettings?: Jamaat };
          setExtraTimings({ ...DEFAULT_EXTRA, ...timings });
          if (savedJamaat) setJamaatState(savedJamaat);
        }
        if (data.source === "excel" || data.source === "backend") setPrayerSource(data.source);
        if (Array.isArray(data.presets) && data.presets.length) {
          localStorage.setItem("prayer_presets", JSON.stringify(data.presets));
          setPresets(data.presets);
          setSavedPresets(data.presets);
        }
        setIqamaConfig(normalizeConfig(data.prayer_config));
        const loc = {
          latitude: data.latitude || defaultLocation.latitude,
          longitude: data.longitude || defaultLocation.longitude,
          timezone: data.timezone || defaultLocation.timezone,
        };
        setLocationState(loc);
        setSavedLocation(loc);
      });
    // defaultLocation is a constant literal; loading runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const masjidId = getMasjidId();
    if (!masjidId) return;
    supabaseAdmin
      .from("masjids")
      .select("masjid_name, address, city, province, postal_code, masjid_phone")
      .eq("id", masjidId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const loaded: GeneralSettings = {
          masjidName: data.masjid_name || "",
          address: data.address || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postal_code || "",
          phone: data.masjid_phone || "",
        };
        setGeneral(loaded);
        setSavedGeneral(loaded);
        setProfileLoaded(true);
        if (data.masjid_name) {
          sessionStorage.setItem("masjid_name", data.masjid_name);
          localStorage.setItem("masjid_name", data.masjid_name);
        }
      });
  }, []);

  useEffect(() => {
    const masjidId = getMasjidId();
    if (!masjidId) return;
    Promise.all([
      supabaseAdmin.from("events").select("*").eq("masjid_id", masjidId).order("date", { ascending: true }),
      supabaseAdmin.from("announcements").select("*").eq("masjid_id", masjidId).order("created_at", { ascending: false }),
    ]).then(([evRes, annRes]) => {
      if (evRes.data) {
        setEvents(evRes.data.map(r => ({
          id: r.id, title: r.title, description: r.description || "", date: r.date, time: r.time || "", endTime: "", category: "",
        })));
      }
      if (annRes.data) {
        setAnnouncements(annRes.data.map(r => ({
          id: r.id, title: r.title, body: r.body || "", createdAt: r.created_at || "", expiresAt: r.expires_at || "",
        })));
      }
      setEventsLoading(false);
    });
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const todayRow = upcomingRows.find(r => r.date === today);
  const nextWeek = useMemo(() => upcomingRows.filter(r => r.date >= today).slice(0, 7), [upcomingRows, today]);
  // Today's rule for each prayer. Trust the saved rules while today's times still follow them;
  // otherwise describe what the schedule actually does.
  const rules = useMemo(() => {
    const out = {} as Record<PrayerKey, IqamaRule | null>;
    for (const k of PRAYER_KEYS) {
      const saved = iqamaConfig[k] ? ruleOn(iqamaConfig[k], k, today) : null;
      out[k] = saved && todayRow && ruleMatches(saved, todayRow, k) ? saved : inferRule(nextWeek, k) ?? (todayRow ? null : saved);
    }
    return out;
  }, [iqamaConfig, todayRow, nextWeek, today]);
  // Each prayer's usual rule and seasonal periods. Masjids set up before periods existed get
  // their current rule as the usual one.
  const prayerConfig = useMemo(() => {
    const out = {} as Record<PrayerKey, PrayerIqama>;
    for (const k of PRAYER_KEYS) {
      out[k] = iqamaConfig[k] ?? { usual: rules[k] ?? defaultRule(k), periods: [] };
    }
    return out;
  }, [iqamaConfig, rules]);
  const periodsToday = Object.fromEntries(PRAYER_KEYS.map(k => [k, activePeriod(prayerConfig[k], today)])) as Record<PrayerKey, IqamaPeriod | null>;
  const jummahTimes = extraTimings.jummahSlots.flatMap((on, i) => (on && extraTimings.jummah[i] ? [to12h(extraTimings.jummah[i])] : []));
  const calcSummary = (() => {
    const place = general.city || "your masjid's location";
    if (presets.length > 1) return `${place}, with different settings in different months`;
    const m = CALC_METHODS.find(c => c.value === presets[0]?.method);
    const short = m?.label.match(/\(([^)]+)\)/)?.[1] ?? m?.label ?? "your chosen method";
    return `${place} using the ${short} method`;
  })();

  // ── Iqama rules ─────────────────────────────────────────────────────────
  // Saves a prayer's usual rule and periods, then fills in every day from `fromDate` onwards
  // with whichever rule applies on that day.
  const applyPrayerConfig = async (key: PrayerKey, cfg: PrayerIqama, fromDate: string) => {
    const masjidId = getMasjidId();
    if (!masjidId) throw new Error("Please sign in again.");
    const { data, error } = await supabaseAdmin
      .from("prayer_times")
      .select(`date,${key},${key}_adhan`)
      .eq("masjid_id", masjidId)
      .gte("date", fromDate)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Record<string, string | null>[];
    if (rows.length === 0) throw new Error("There are no prayer times from that date yet. Add prayer times first.");

    const wi = extraTimings.weekendIsha;
    const weekendDay = (iso: string) => ["sun", "", "", "", "", "fri", "sat"][parseISODate(iso).getDay()];
    const updates = rows.flatMap(r => {
      const date = r.date as string;
      const adhan = toMinutes(r[`${key}_adhan`] || r[key]);
      if (adhan === null) return [];
      // Keep a weekend Isha override the masjid has set up.
      if (key === "isha" && wi.iqama && wi.days.includes(weekendDay(date))) return [];
      return [{ masjid_id: masjidId, date, [`${key}_iqama`]: fmt12(iqamaFromRule(ruleOn(cfg, key, date), adhan)) }];
    });
    await upsertInChunks(updates);

    const next = { ...iqamaConfig, [key]: cfg };
    const { error: cfgError } = await supabaseAdmin
      .from("prayer_settings")
      .upsert({ masjid_id: masjidId, prayer_config: next }, { onConflict: "masjid_id" });
    if (cfgError) throw new Error(cfgError.message);
    setIqamaConfig(next);
    await refreshPrayerTimes();
  };

  const applyIqamaRule = async (key: PrayerKey, rule: IqamaRule, fromDate: string) => {
    await applyPrayerConfig(key, { ...prayerConfig[key], usual: rule }, fromDate);
    setIqamaEdit(null);
    const when = fromDate === today ? "from today" : `from ${parseISODate(fromDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}`;
    notify(`${PRAYER_NAMES[key]} iqama updated ${when}. The TV screen and app will show it within a few minutes.`);
  };

  const savePeriod = async (key: PrayerKey, period: IqamaPeriod) => {
    const cfg = prayerConfig[key];
    const exists = cfg.periods.some(p => p.id === period.id);
    const periods = exists ? cfg.periods.map(p => (p.id === period.id ? period : p)) : [...cfg.periods, period];
    await applyPrayerConfig(key, { ...cfg, periods }, today);
    setPeriodEdit(null);
    notify(`${PRAYER_NAMES[key]} iqama for ${describePeriod(period)} saved. The TV screen and app will follow it.`);
  };

  const removePeriod = async (key: PrayerKey, period: IqamaPeriod) => {
    const cfg = prayerConfig[key];
    await applyPrayerConfig(key, { ...cfg, periods: cfg.periods.filter(p => p.id !== period.id) }, today);
    setPeriodEdit(null);
    notify(`${PRAYER_NAMES[key]} iqama for ${describePeriod(period)} removed. Those days use the usual time again.`);
  };

  // "Change" next to today's iqama edits whatever is in charge today: a period, or the usual rule.
  const changeTodaysIqama = (key: PrayerKey) => {
    const p = periodsToday[key];
    if (p) setPeriodEdit({ prayer: key, period: p });
    else setIqamaEdit({ prayer: key });
  };

  const saveDay = async (date: string, patch: Record<string, string | null>) => {
    const masjidId = getMasjidId();
    if (!masjidId) throw new Error("Please sign in again.");
    await upsertInChunks([{ masjid_id: masjidId, date, ...patch }]);
    await refreshPrayerTimes();
    setDayEdit(null);
    notify(`${parseISODate(date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} is saved.`);
  };

  const saveJumuah = async (times: string[], slots: [boolean, boolean, boolean]) => {
    const masjidId = getMasjidId();
    if (!masjidId) throw new Error("Please sign in again.");
    const next: Extra = { ...extraTimings, jummah: times, jummahSlots: slots };
    const { error } = await supabaseAdmin
      .from("prayer_settings")
      .upsert({ masjid_id: masjidId, jummah_config: { ...next, jamaatSettings: jamaat } }, { onConflict: "masjid_id" });
    if (error) throw new Error(error.message);
    const { data, error: rowsError } = await supabaseAdmin.from("prayer_times").select("date").eq("masjid_id", masjidId).gte("date", today);
    if (rowsError) throw new Error(rowsError.message);
    const fridays = ((data ?? []) as { date: string }[]).filter(r => parseISODate(r.date).getDay() === 5);
    await upsertInChunks(fridays.map(r => ({
      masjid_id: masjidId,
      date: r.date,
      jummah_1: slots[0] ? times[0] : null,
      jummah_2: slots[1] ? times[1] : null,
      jummah_3: slots[2] ? times[2] : null,
    })));
    setExtraTimings(next);
    await refreshPrayerTimes();
    setJumuahOpen(false);
    notify("Jumu'ah times saved for every Friday from today.");
  };

  // ── Calculation settings ────────────────────────────────────────────────
  const savePresets = async () => {
    const masjidId = getMasjidId();
    localStorage.setItem("prayer_presets", JSON.stringify(presets));
    localStorage.setItem("month_preset_map", JSON.stringify(monthMap));
    localStorage.setItem("prayer_settings_location", JSON.stringify(location));
    if (masjidId) {
      const { error } = await supabaseAdmin.from("prayer_settings").upsert(
        {
          masjid_id: masjidId,
          presets,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone,
          method: presets[0]?.method ?? "NorthAmerica",
          jummah_config: { ...extraTimings, jamaatSettings: jamaat },
        },
        { onConflict: "masjid_id" },
      );
      if (error) throw new Error(error.message);
    }
    setSavedPresets(presets);
    setSavedMonthMap(monthMap);
    setSavedLocation(location);
  };

  const onSaveCalculation = () => {
    if (prayerSource === "backend" && Object.keys(prayerTimesByMonth).length > 0) setPresetRegenConfirm(true);
    else {
      setSavingCalculation(true);
      savePresets()
        .then(() => notify("Settings saved."))
        .catch(e => notify(`Could not save: ${(e as Error).message}`, "error"))
        .finally(() => setSavingCalculation(false));
    }
  };

  const saveCalculationAndRecalculate = async (recalculate: boolean) => {
    setPresetRegenConfirm(false);
    setSavingCalculation(true);
    try {
      await savePresets();
      const masjidId = getMasjidId();
      if (recalculate && masjidId) {
        setRecalculating(true);
        const months = Object.keys(prayerTimesByMonth).sort();
        const rows: Record<string, unknown>[] = [];
        for (const mk of months) {
          const preset = presets.find(p => p.id === monthMap[parseInt(mk.slice(5, 7), 10)]) ?? presets[0];
          const times = generateMonthAdhan(mergePresetWithLocation(preset, location), mk);
          const existing = Object.fromEntries((prayerTimesByMonth[mk] ?? []).map(r => [r.date, r]));
          for (const t of times.map(withoutSunrise)) {
            const prev = existing[t.date] as unknown as Record<string, string> | undefined;
            // New start times. Adhan keeps any gap the masjid set after the start time,
            // and iqama keeps its gap after adhan (or its fixed time).
            const row: Record<string, unknown> = { masjid_id: masjidId, date: t.date };
            for (const k of PRAYER_KEYS) {
              const newStart = toMinutes(t[k]);
              row[k] = t[k];
              if (newStart === null) continue;
              const oldStart = toMinutes(prev?.[k]);
              const oldAdhan = toMinutes(prev?.[`${k}_adhan`] || prev?.[k]);
              const oldIqama = toMinutes(prev?.[`${k}_iqama`]);
              const newAdhan = newStart + (oldStart !== null && oldAdhan !== null ? oldAdhan - oldStart : 0);
              row[`${k}_adhan`] = fmt12(newAdhan);
              row[`${k}_iqama`] = iqamaConfig[k]
                ? fmt12(iqamaFromRule(ruleOn(iqamaConfig[k], k, t.date), newAdhan))
                : fmt12(newAdhan + (oldAdhan !== null && oldIqama !== null ? oldIqama - oldAdhan : k === "maghrib" ? 3 : 30));
            }
            rows.push(row);
          }
        }
        await upsertInChunks(rows);
        await refreshPrayerTimes();
        notify("Settings saved and prayer times updated.");
      } else {
        notify("Settings saved. Your existing prayer times were not changed.");
      }
    } catch (e) {
      notify(`Could not save: ${(e as Error).message}`, "error");
    } finally {
      setSavingCalculation(false);
      setRecalculating(false);
    }
  };

  const undoCalculation = () => {
    setPresets(savedPresets);
    setMonthMap(savedMonthMap);
    setLocationState(savedLocation);
  };

  const addPreset = () => {
    const base = presets[0] ?? DEFAULT_PRESET;
    setPresets(prev => [...prev, { ...base, id: crypto.randomUUID(), adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0", adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0" }]);
  };
  const deletePreset = (id: string) => {
    if (presets.length <= 1) return;
    setPresets(prev => prev.filter(p => p.id !== id));
    setMonthMap(prev => Object.fromEntries(Object.entries(prev).map(([m, pid]) => [m, pid === id ? "" : pid])) as MonthPresetMap);
  };
  const updatePreset = (id: string, patch: Partial<PrayerPreset>) => setPresets(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const setMonthPreset = (month: number, presetId: string) => setMonthMap(prev => ({ ...prev, [month]: presetId }));

  const setJamaat = async (next: Jamaat) => {
    const prev = jamaat;
    setJamaatState(next);
    const masjidId = getMasjidId();
    if (!masjidId) return;
    const { error } = await supabaseAdmin
      .from("prayer_settings")
      .upsert({ masjid_id: masjidId, jummah_config: { ...extraTimings, jamaatSettings: next } }, { onConflict: "masjid_id" });
    if (error) { setJamaatState(prev); notify(`Could not save: ${error.message}`, "error"); }
    else notify("Saved.");
  };

  const saveGeneral = async () => {
    const masjidId = getMasjidId();
    if (!masjidId) { notify("Please sign in again.", "error"); return; }
    const { error } = await supabaseAdmin
      .from("masjids")
      .update({
        masjid_name: general.masjidName,
        address: general.address,
        city: general.city,
        province: general.province,
        postal_code: general.postalCode,
        masjid_phone: general.phone,
      })
      .eq("id", masjidId);
    if (error) { notify(`Could not save: ${error.message}`, "error"); return; }
    sessionStorage.setItem("masjid_name", general.masjidName);
    localStorage.setItem("masjid_name", general.masjidName);
    setSavedGeneral(general);
    notify("Masjid details saved.");
  };

  // ── Generating and importing times ──────────────────────────────────────
  const buildYearRows = (masjidId: string, year: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const preset = presets.find(p => p.id === monthMap[i + 1]) ?? presets[0] ?? DEFAULT_PRESET;
      return generateMonthAdhan(mergePresetWithLocation(preset, location), `${year}-${String(i + 1).padStart(2, "0")}`);
    })
      .flat()
      .map(withoutSunrise)
      .map(t => {
        const row: Record<string, unknown> = { masjid_id: masjidId, ...t, ...addDefaultAdhanIqama(t) };
        for (const k of PRAYER_KEYS) {
          const a = toMinutes(t[k]);
          if (iqamaConfig[k] && a !== null) row[`${k}_iqama`] = fmt12(iqamaFromRule(ruleOn(iqamaConfig[k], k, t.date), a));
        }
        return row;
      });

  const generateYear = async (year: number) => {
    const masjidId = getMasjidId();
    if (!masjidId) return;
    setGeneratingYear(year);
    try {
      await upsertInChunks(buildYearRows(masjidId, year));
      await refreshPrayerTimes();
      notify(`Prayer times for ${year} are ready.`);
    } catch (err) {
      notify(`Could not work out prayer times: ${(err as Error).message}`, "error");
    } finally {
      setGeneratingYear(null);
    }
  };

  const confirmSourceSwitch = async () => {
    if (!pendingSource) return;
    const newSource = pendingSource;
    const masjidId = getMasjidId();
    setSwitchLoading(true);
    try {
      if (masjidId) {
        const { error } = await supabaseAdmin.from("prayer_settings").upsert({ masjid_id: masjidId, source: newSource }, { onConflict: "masjid_id" });
        if (error) throw new Error(error.message);
      }
      if (newSource === "excel") {
        if (masjidId) {
          const { error } = await supabaseAdmin.from("prayer_times").delete().eq("masjid_id", masjidId);
          if (error) throw new Error(error.message);
        }
        setPrayerSource("excel");
        await refreshPrayerTimes();
        notify("Automatic times removed. Upload your timetable to add your own.");
      } else {
        setPrayerSource("backend");
        if (masjidId) {
          const year = new Date().getFullYear();
          await upsertInChunks(buildYearRows(masjidId, year));
          await refreshPrayerTimes();
          notify(`Prayer times are now worked out automatically for ${year}.`);
        }
      }
      setPendingSource(null);
    } catch (err) {
      notify(`Could not switch: ${(err as Error).message}`, "error");
    } finally {
      setSwitchLoading(false);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    // Keep digits so "Jummah 2" is not mistaken for "Jummah 1".
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isIqamaLike = (h: string) => {
      const n = norm(h);
      return n.includes("iqama") || n.includes("jamat");
    };
    const find = (kws: string[], excludeIqama = false) => {
      const kwsN = kws.map(norm);
      return headers.find(h => {
        if (excludeIqama && isIqamaLike(h)) return false;
        const hn = norm(h);
        return kwsN.some(k => hn.includes(k));
      }) ?? "";
    };
    setColMap({
      date: find(["date"]),
      day: find(["day", "no."]),
      fajr: find(["fajr begin", "fajr start", "fajr adhan", "fajr azan"]) || find(["fajr"], true),
      dhuhr: find(["dhuhr begin", "zuhr begin", "dhuhr start", "zuhr start"]) || find(["dhuhr", "zuhr"], true),
      asr: find(["asr begin", "asr start"]) || find(["asr"], true),
      maghrib: find(["maghrib begin", "maghrib start", "sunset"]) || find(["maghrib"], true),
      isha: find(["isha begin", "isha start"]) || find(["isha"], true),
      fajr_iqama: find(["fajr iqama", "fajr jamat", "fajr jamaat"]),
      dhuhr_iqama: find(["dhuhr iqama", "zuhr iqama", "dhuhr jamat", "zuhr jamat"]),
      asr_iqama: find(["asr iqama", "asr jamat"]),
      maghrib_iqama: find(["maghrib iqama", "maghrib jamat"]),
      isha_iqama: find(["isha iqama", "isha jamat"]),
      jummah1: find(["jumah 1", "jummah 1", "1st jum"]) || find(["jumah", "jummah"]),
      jummah2: find(["jumah 2", "jummah 2", "2nd jum"]),
      jummah3: find(["jumah 3", "jummah 3", "3rd jum"]),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      setUploadError("Please choose an Excel file (.xlsx or .xls).");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheetRows: Record<string, string[][]> = {};
        for (const name of wb.SheetNames) {
          sheetRows[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false }) as string[][];
        }
        const firstSheet = wb.SheetNames[0];
        const rows = sheetRows[firstSheet];
        const keywords = ["fajr", "dhuhr", "zuhr", "asr", "maghrib", "isha", "date", "day"];
        const headerIdx = rows.findIndex(r => r.some(c => keywords.some(k => String(c ?? "").toLowerCase().includes(k))));
        setXlsxPreview({ sheets: wb.SheetNames, sheetRows, selectedSheet: firstSheet, headerRowIdx: Math.max(0, headerIdx) });
        if (headerIdx >= 0) autoMapColumns(rows[headerIdx].map(h => String(h ?? "").trim()));
      } catch (err) {
        console.error("Excel parse failed:", err);
        setUploadError("We could not read that file. Is it an Excel timetable?");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!xlsxPreview) return;
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const rows = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
      const headers = rows[xlsxPreview.headerRowIdx].map(h => String(h ?? "").trim());
      const dataRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c !== "" && c != null));
      const cv = (row: string[], col: string) => {
        const i = col ? headers.indexOf(col) : -1;
        return i >= 0 ? String(row[i] ?? "").trim() : "";
      };
      const importMonth = today.slice(0, 7);

      const parsed: PrayerTime[] = [];
      for (const row of dataRows) {
        let dateStr = "";
        if (colMap.date) {
          const raw = cv(row, colMap.date);
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            dateStr = raw;
          } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(raw)) {
            const parts = raw.split(/[/-]/);
            dateStr = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          } else if (!isNaN(Number(raw)) && Number(raw) > 40000) {
            // Excel serial dates count days in UTC.
            dateStr = new Date(Math.round((Number(raw) - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
          } else {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) dateStr = localISODate(d);
          }
        } else if (colMap.day) {
          const dayNum = parseInt(cv(row, colMap.day), 10);
          if (!dayNum || isNaN(dayNum)) continue;
          dateStr = `${importMonth}-${String(dayNum).padStart(2, "0")}`;
        }
        if (!dateStr) continue;

        const entry: PrayerTime = {
          date: dateStr,
          fajr: cv(row, colMap.fajr),
          dhuhr: cv(row, colMap.dhuhr),
          asr: cv(row, colMap.asr),
          maghrib: cv(row, colMap.maghrib),
          isha: cv(row, colMap.isha),
        };
        for (const k of PRAYER_KEYS) {
          const col = colMap[`${k}_iqama`];
          if (col) (entry as unknown as Record<string, string>)[`${k}_iqama`] = cv(row, col);
        }
        parsed.push(entry);
      }

      if (parsed.length === 0) {
        setUploadError("No days could be read. Check that the date column is matched correctly.");
        return;
      }

      const jTimes = [colMap.jummah1, colMap.jummah2, colMap.jummah3].map(col => (col ? cv(dataRows[0], col) : "")).filter(Boolean);
      if (jTimes.length > 0) setExtraTimings(prev => ({ ...prev, jummah: jTimes }));

      const masjidId = getMasjidId();
      if (!masjidId) throw new Error("No masjid selected. Please sign in again.");
      await upsertInChunks(parsed.map(row => ({ masjid_id: masjidId, ...addDefaultAdhanIqama(row), ...row })));
      await refreshPrayerTimes();
      const fmtD = (d: string) => parseISODate(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
      setUploadSuccess(`${parsed.length} days imported, ${fmtD(parsed[0].date)} to ${fmtD(parsed[parsed.length - 1].date)}.`);
      setTimeout(() => setUploadSuccess(""), 6000);
      setXlsxPreview(null);
      setUploadFile(null);
    } catch (err) {
      setUploadError(`Import failed: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Bulk editing ────────────────────────────────────────────────────────
  const handleBatchApply = async () => {
    const masjidId = getMasjidId();
    if (!masjidId) { setBatchError("Please sign in again."); return; }
    if (!batchFrom || !batchTo) { setBatchError("Please choose a start and end date."); return; }
    if (batchFrom > batchTo) { setBatchError("The start date must be before the end date."); return; }
    setBatchError("");
    setApplyingBatch(true);

    const upsertRows: Record<string, string | null>[] = [];
    for (const days of Object.values(prayerTimesByMonth)) {
      for (const day of days) {
        if (day.date < batchFrom || day.date > batchTo) continue;
        const row: Record<string, string | null> = { masjid_id: masjidId, date: day.date };
        for (const p of PRAYER_KEYS) {
          const start = day[p] ?? "";
          const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[p];
          const iCell = (batchIqama as unknown as Record<string, BatchCell>)[p];
          const adhanEmpty = aCell.mode === "fixed" && !aCell.fixed;
          const iqamaEmpty = iCell.mode === "fixed" && !iCell.fixed;
          const existingAdhan = (day as unknown as Record<string, string>)[`${p}_adhan`] ?? start;
          const adhanTime = adhanEmpty ? existingAdhan : applyBatchCell(aCell, start);
          if (!adhanEmpty) row[`${p}_adhan`] = adhanTime;
          if (!iqamaEmpty) row[`${p}_iqama`] = applyBatchCell(iCell, adhanTime);
        }
        const baseIqama = (p: "fajr" | "maghrib") => (row[`${p}_iqama`] as string) ?? (day as unknown as Record<string, string>)[`${p}_iqama`];
        row.fajr_iqama_2 = jamaat.fajr2 ? applyBatchCell(batchIqama2.fajr, baseIqama("fajr")) : null;
        row.maghrib_iqama_2 = jamaat.maghrib2 ? applyBatchCell(batchIqama2.maghrib, baseIqama("maghrib")) : null;
        row.fajr_iqama_3 = jamaat.fajr3 ? applyBatchCell(batchIqama3.fajr, row.fajr_iqama_2 ?? baseIqama("fajr")) : null;
        row.maghrib_iqama_3 = jamaat.maghrib3 ? applyBatchCell(batchIqama3.maghrib, row.maghrib_iqama_2 ?? baseIqama("maghrib")) : null;
        const dow = parseISODate(day.date).getDay();
        if (dow === 5) {
          row.jummah_1 = extraTimings.jummahSlots[0] ? extraTimings.jummah[0] || null : null;
          row.jummah_2 = extraTimings.jummahSlots[1] ? extraTimings.jummah[1] || null : null;
          row.jummah_3 = extraTimings.jummahSlots[2] ? extraTimings.jummah[2] || null : null;
        }
        if (extraTimings.weekendIsha.iqama) {
          const dayName = dow === 5 ? "fri" : dow === 6 ? "sat" : dow === 0 ? "sun" : null;
          if (dayName && extraTimings.weekendIsha.days.includes(dayName)) row.isha_iqama = extraTimings.weekendIsha.iqama;
        }
        upsertRows.push(row);
      }
    }

    if (upsertRows.length === 0) {
      setBatchError("There are no prayer times loaded for those dates.");
      setApplyingBatch(false);
      return;
    }
    try {
      await upsertInChunks(upsertRows);
      const masjidIdForCfg = getMasjidId();
      if (masjidIdForCfg) {
        await supabaseAdmin.from("prayer_settings").upsert(
          { masjid_id: masjidIdForCfg, jummah_config: { ...extraTimings, jamaatSettings: jamaat } },
          { onConflict: "masjid_id" },
        );
      }
      await refreshPrayerTimes();
      setBatchApplied(true);
      setTimeout(() => setBatchApplied(false), 2500);
      notify(`${upsertRows.length} days updated.`);
    } catch (err) {
      setBatchError(`Could not save: ${(err as Error).message}`);
    } finally {
      setApplyingBatch(false);
    }
  };

  // ── Events & announcements ──────────────────────────────────────────────
  const saveEvent = async (input: EventInput, id?: string) => {
    const masjidId = getMasjidId();
    if (!masjidId) throw new Error("Please sign in again.");
    const row = { masjid_id: masjidId, title: input.title, description: input.description, date: input.date, time: input.time, location: null };
    if (id) {
      const { error } = await supabaseAdmin.from("events").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...input } : e)));
      notify("Event saved.");
    } else {
      const { data, error } = await supabaseAdmin.from("events").insert(row).select().single();
      if (error) throw new Error(error.message);
      setEvents(prev => [...prev, { id: data.id, title: data.title, description: data.description || "", date: data.date, time: data.time || "", endTime: "", category: "" }]);
      notify("Event added. It now shows on the TV screen and in the app.");
    }
    setComposer(null);
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
    if (error) { notify(`Could not delete: ${error.message}`, "error"); return; }
    setEvents(prev => prev.filter(e => e.id !== id));
    notify("Event deleted.");
  };

  const saveAnnouncement = async (input: AnnouncementInput, id?: string) => {
    const masjidId = getMasjidId();
    if (!masjidId) throw new Error("Please sign in again.");
    const row = { masjid_id: masjidId, title: input.title, body: input.body, expires_at: input.expiresAt };
    if (id) {
      const { error } = await supabaseAdmin.from("announcements").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      setAnnouncements(prev => prev.map(a => (a.id === id ? { ...a, title: input.title, body: input.body, expiresAt: input.expiresAt ?? "" } : a)));
      notify("Announcement saved.");
    } else {
      const { data, error } = await supabaseAdmin.from("announcements").insert(row).select().single();
      if (error) throw new Error(error.message);
      setAnnouncements(prev => [{ id: data.id, title: data.title, body: data.body || "", createdAt: data.created_at || new Date().toISOString(), expiresAt: data.expires_at || "" }, ...prev]);
      notify("Posted. It now shows on the TV screen and in the app.");
    }
    setComposer(null);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id);
    if (error) { notify(`Could not remove: ${error.message}`, "error"); return; }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    notify("Announcement removed.");
  };

  const openComposer = (c: NonNullable<Composer>) => {
    setEventsView(c.kind === "event" ? "events" : "announcements");
    setComposer(c);
    goTab("events");
  };

  const signOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };
  const openTv = () => window.open("/home/tvscreen", "_blank", "noopener");

  // ── Render ──────────────────────────────────────────────────────────────
  const adhanToday = (k: PrayerKey) => toMinutes(adhanOf(todayRow, k));

  return (
    <DashboardShell
      masjidName={general.masjidName || "Your masjid"}
      activeTab={activeTab}
      onNavigate={goTab}
      dark={dark}
      onToggleTheme={toggleTheme}
      onOpenTv={openTv}
      onHelp={() => setShowTutorial(true)}
      onSignOut={signOut}
    >
      {activeTab === "overview" && (
        <HomeTab
          masjidName={general.masjidName || "your masjid"}
          now={now}
          todayRow={todayRow}
          tomorrowRow={upcomingRows.find(r => r.date === addDaysISO(today, 1))}
          rules={rules}
          jummahTimes={jummahTimes}
          scheduleEnd={scheduleEnd}
          scheduleLoading={scheduleLoading}
          phoneMissing={profileLoaded && !savedGeneral.phone}
          events={events}
          announcements={announcements}
          periodsToday={periodsToday}
          onChangeIqama={changeTodaysIqama}
          onGoPrayerTimes={() => goTab("prayer-times")}
          onGoSettings={() => goTab("settings")}
          onNewAnnouncement={() => openComposer({ kind: "announcement" })}
          onNewEvent={() => openComposer({ kind: "event" })}
          onSeeAnnouncements={() => { setEventsView("announcements"); goTab("events"); }}
          onSeeEvents={() => { setEventsView("events"); goTab("events"); }}
          onEditAnnouncement={a => openComposer({ kind: "announcement", item: a })}
          onOpenTv={openTv}
        />
      )}

      {activeTab === "prayer-times" && (
        <PrayerTimesTab
          now={now}
          upcomingRows={upcomingRows}
          config={prayerConfig}
          periodsToday={periodsToday}
          onChangeIqama={k => setIqamaEdit({ prayer: k })}
          onAddPeriod={k => setPeriodEdit({ prayer: k })}
          onEditPeriod={(k, p) => setPeriodEdit({ prayer: k, period: p })}
          jummahTimes={jummahTimes}
          onEditJumuah={() => setJumuahOpen(true)}
          prayerSource={prayerSource}
          calcSummary={calcSummary}
          onRequestSourceSwitch={setPendingSource}
          onGoSettings={() => goTab("settings")}
          prayerLoading={prayerLoading}
          prayerTimesByMonth={prayerTimesByMonth}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          jamaat={jamaat}
          onEditDay={setDayEdit}
          onOpenBulk={() => { setBatchError(""); setBulkOpen(true); }}
          onFileChosen={handleFileChange}
          uploadSuccess={uploadSuccess}
          uploadError={xlsxPreview ? "" : uploadError}
          onGenerateYear={generateYear}
          generatingYear={generatingYear}
        />
      )}

      {activeTab === "events" && (
        <EventsTab
          now={now}
          view={eventsView}
          setView={setEventsView}
          events={events}
          announcements={announcements}
          loading={eventsLoading}
          composer={composer}
          setComposer={setComposer}
          onSaveEvent={saveEvent}
          onDeleteEvent={deleteEvent}
          onSaveAnnouncement={saveAnnouncement}
          onDeleteAnnouncement={deleteAnnouncement}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          dark={dark}
          registeredEmail={registeredEmail}
          general={general}
          setGeneral={setGeneral}
          savedGeneral={savedGeneral}
          onSaveGeneral={saveGeneral}
          location={location}
          setLocation={setLocation}
          savedLocation={savedLocation}
          presets={presets}
          monthMap={monthMap}
          savedPresets={savedPresets}
          savedMonthMap={savedMonthMap}
          onUpdatePreset={updatePreset}
          onAddPreset={addPreset}
          onDeletePreset={deletePreset}
          onSetMonthPreset={setMonthPreset}
          onSaveCalculation={onSaveCalculation}
          onUndoCalculation={undoCalculation}
          savingCalculation={savingCalculation}
          jamaat={jamaat}
          onSetJamaat={setJamaat}
        />
      )}

      {iqamaEdit && (
        <IqamaEditor
          prayer={iqamaEdit.prayer}
          rules={Object.fromEntries(PRAYER_KEYS.map(k => [k, prayerConfig[k].usual])) as Record<PrayerKey, IqamaRule>}
          todayAdhan={adhanToday}
          defaultStart={iqamaEdit.prayer ? "today" : "date"}
          periods={iqamaEdit.prayer ? prayerConfig[iqamaEdit.prayer].periods : []}
          onSave={applyIqamaRule}
          onClose={() => setIqamaEdit(null)}
        />
      )}
      {periodEdit && (
        <PeriodEditor
          prayer={periodEdit.prayer}
          period={periodEdit.period}
          usual={k => prayerConfig[k].usual}
          onSave={savePeriod}
          onRemove={periodEdit.period && periodEdit.prayer ? () => removePeriod(periodEdit.prayer!, periodEdit.period!) : undefined}
          onClose={() => setPeriodEdit(null)}
        />
      )}
      {dayEdit && (
        <DayEditor day={dayEdit} jamaat={jamaat} jummahSlots={extraTimings.jummahSlots} onSave={saveDay} onClose={() => setDayEdit(null)} />
      )}
      {jumuahOpen && (
        <JumuahEditor times={extraTimings.jummah} slots={extraTimings.jummahSlots} onSave={saveJumuah} onClose={() => setJumuahOpen(false)} />
      )}
      {bulkOpen && (
        <BulkEditor
          prayerTimesByMonth={prayerTimesByMonth}
          from={batchFrom} setFrom={setBatchFrom}
          to={batchTo} setTo={setBatchTo}
          adhan={batchAdhan} setAdhan={setBatchAdhan}
          iqama={batchIqama} setIqama={setBatchIqama}
          iqama2={batchIqama2} setIqama2={setBatchIqama2}
          iqama3={batchIqama3} setIqama3={setBatchIqama3}
          jamaat={jamaat}
          extra={extraTimings}
          setExtra={setExtraTimings}
          applying={applyingBatch}
          applied={batchApplied}
          error={batchError}
          onApply={handleBatchApply}
          onClose={() => setBulkOpen(false)}
        />
      )}
      {xlsxPreview && (
        <ExcelImportModal
          fileName={uploadFile?.name ?? "your file"}
          preview={xlsxPreview}
          setPreview={setXlsxPreview}
          colMap={colMap}
          setColMap={setColMap}
          autoMapColumns={autoMapColumns}
          onImport={handleConfirmImport}
          importing={isUploading}
          error={uploadError}
        />
      )}
      {pendingSource && (
        <ConfirmDialog
          title={pendingSource === "excel" ? "Use only your own timetable?" : "Work out adhan times automatically?"}
          body={pendingSource === "excel" ? (
            <>
              <strong style={{ color: "var(--d-danger)" }}>All prayer times will be deleted</strong>, including iqama times you have set.
              You will need to upload your timetable to add them back.
            </>
          ) : (
            <>
              Adhan times for {new Date().getFullYear()} will be worked out for {general.city || "your masjid's location"} and will
              replace the times from your uploaded timetable. Iqama times go back to 30 minutes after adhan (3 minutes for Maghrib).
            </>
          )}
          confirmLabel={pendingSource === "excel" ? "Delete and switch" : "Switch to automatic times"}
          danger={pendingSource === "excel"}
          busy={switchLoading}
          onConfirm={confirmSourceSwitch}
          onCancel={() => setPendingSource(null)}
        />
      )}
      {presetRegenConfirm && (
        <Modal
          title="Update your prayer times too?"
          onClose={() => setPresetRegenConfirm(false)}
          footer={
            <>
              <button type="button" className="d-btn d-btn--secondary" onClick={() => saveCalculationAndRecalculate(false)}>Only save the settings</button>
              <button type="button" className="d-btn d-btn--primary" onClick={() => saveCalculationAndRecalculate(true)}>Save and update prayer times</button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55 }}>
            You already have prayer times for {Object.keys(prayerTimesByMonth).length} month{Object.keys(prayerTimesByMonth).length === 1 ? "" : "s"} of {selectedYear}.
            We can work out their adhan times again with the new settings. Iqama times keep the same gap after adhan.
          </p>
        </Modal>
      )}
      {recalculating && (
        <div className="d-overlay" style={{ alignItems: "center" }} aria-live="polite">
          <div className="d-card d-card-pad d-row" style={{ gap: 14 }}><Spinner /><span className="d-strong">Saving and updating prayer times…</span></div>
        </div>
      )}

      <Toast toast={toast} />
      {showTutorial && <TutorialOverlay onClose={closeTutorial} setActiveTab={t => goTab(t as DashboardTab)} />}
    </DashboardShell>
  );
};

export default Dashboard;
