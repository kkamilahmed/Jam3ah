import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "../lib/supabase";

import type {
  PrayerTime, Event, EventForm, Announcement,
  Month, BatchCell, BatchCell2, BatchConfig,
} from "../dashboard/types";
import { THEMES, type ThemeKey } from "../dashboard/themes";
import {
  to12h,
  makeDefaultBatchAdhan, makeDefaultBatchIqama,
  applyBatchCell, addDefaultAdhanIqama,
} from "../dashboard/utils";
import { generateYearAdhan, generateMonthAdhan, mergePresetWithLocation, type PrayerPreset, type MonthPresetMap } from "../dashboard/constants";
import { Icon, CrescentIcon } from "../dashboard/components/Icon";

import OverviewTab     from "../dashboard/tabs/OverviewTab";
import PrayerTimesTab  from "../dashboard/tabs/PrayerTimesTab";
import EventsTab       from "../dashboard/tabs/EventsTab";
import SettingsTab     from "../dashboard/tabs/SettingsTab";

// ── Dashboard Component ───────────────────────────────────────────────────
const VALID_TABS = ["overview", "prayer-times", "events", "settings"];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const activeTab = VALID_TABS.includes(tab ?? "") ? tab! : "overview";
  const setActiveTab = (t: string) => navigate(`/home/${t}`);

  // ── Theme ──────────────────────────────────────────────────────────────
  const [themeName] = useState<ThemeKey>(() => {
    return (localStorage.getItem("masjid_theme") as ThemeKey) || "emerald";
  });
  const theme = THEMES[themeName];
  const [settingsTab, setSettingsTab] = useState<string>("profile");
  const [mounted, setMounted] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const storedName = sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name") || "Toronto Hifz Academy";

  // ── General settings ──────────────────────────────────────────────────
  const registeredEmail = sessionStorage.getItem("user_email") || localStorage.getItem("user_email") || "";

  const [generalSettings, setGeneralSettings] = useState({
    masjidName: storedName,
    address: "123 Islington Ave",
    city: "Toronto",
    province: "ON",
    postalCode: "M9A 1A1",
    phone: "(416) 555-0194",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Prayer settings ───────────────────────────────────────────────────
  const [prayerSettings, setPrayerSettings] = useState({
    latitude:              "43.651070",
    longitude:             "-79.347015",
    timezone:              "America/Toronto",
    method:                "NorthAmerica",
    fajrAngle:             "",
    ishaAngle:             "",
    ishaInterval:          "",
    maghribAngle:          "",
    madhab:                "Shafi",
    highLatitudeRule:      "recommended",
    polarCircleResolution: "AqrabBalad",
    shafaq:                "General",
    rounding:              "Nearest",
    adjustFajr:            "0",
    adjustSunrise:         "0",
    adjustDhuhr:           "0",
    adjustAsr:             "0",
    adjustMaghrib:         "0",
    adjustIsha:            "0",
  });

  // ── Prayer times state ────────────────────────────────────────────────
  const [prayerSource, setPrayerSource] = useState<"excel" | "backend">("backend");
  const [pendingSource, setPendingSource] = useState<"excel" | "backend" | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [switchLoading, setSwitchLoading] = useState(false);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [prayerTimesByMonth, setPrayerTimesByMonth] = useState<Record<string, PrayerTime[]>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [xlsxPreview, setXlsxPreview] = useState<{
    sheets: string[];
    sheetRows: Record<string, string[][]>;
    selectedSheet: string;
    headerRowIdx: number;
  } | null>(null);
  const [colMap, setColMap] = useState<Record<string, string>>({
    date: "", day: "", fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "",
    fajr_iqama: "", dhuhr_iqama: "", asr_iqama: "", maghrib_iqama: "", isha_iqama: "",
    jummah1: "", jummah2: "", jummah3: "",
  });
  const [importMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const defaultExtra = {
    fajr: [] as string[],
    maghrib: [] as string[],
    jummah: ["1:15 PM"],
    weekendIsha: { enabled: false, days: ["fri", "sat"] as string[], iqama: "" },
  };
  const [extraTimings, setExtraTimings] = useState<{
    fajr: string[]; maghrib: string[]; jummah: string[];
    weekendIsha: { enabled: boolean; days: string[]; iqama: string };
  }>(defaultExtra);

  // ── Jamaat settings ───────────────────────────────────────────────────
  const [jamaatSettings, setJamaatSettings] = useState({ fajr2: false, fajr3: false, maghrib2: false, maghrib3: false });

  // ── Batch update state ────────────────────────────────────────────────
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");
  const [batchAdhan, setBatchAdhan] = useState<BatchConfig>(makeDefaultBatchAdhan());
  const [batchIqama, setBatchIqama] = useState<BatchConfig>(makeDefaultBatchIqama());
  const [batchIqama2, setBatchIqama2] = useState<{ fajr: BatchCell2; maghrib: BatchCell2 }>({
    fajr:    { mode: "fixed", offset: 0, fixed: "", enabled: false },
    maghrib: { mode: "fixed", offset: 0, fixed: "", enabled: false },
  });
  const [batchIqama3, setBatchIqama3] = useState<{ fajr: BatchCell2; maghrib: BatchCell2 }>({
    fajr:    { mode: "fixed", offset: 0, fixed: "", enabled: false },
    maghrib: { mode: "fixed", offset: 0, fixed: "", enabled: false },
  });
  const [applyingBatch, setApplyingBatch] = useState(false);
  const [batchApplied, setBatchApplied] = useState(false);
  const [batchError, setBatchError] = useState("");

  // ── Events state ──────────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsSubTab, setEventsSubTab] = useState<"events" | "announcements">("events");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", expiresAt: "" });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", description: "", date: "", time: "", endTime: "", category: "General" });
  const [eventsPanel, setEventsPanel] = useState(false);



  // ── Presets & schedule ────────────────────────────────────────────────
  const defaultPresetId = "default";
  const defaultPreset: PrayerPreset = {
    id: defaultPresetId,
    method: "NorthAmerica", fajrAngle: "", ishaAngle: "", ishaInterval: "", maghribAngle: "",
    madhab: "Shafi", highLatitudeRule: "recommended", polarCircleResolution: "AqrabBalad",
    shafaq: "General", rounding: "Nearest",
    adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0",
    adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0",
  };
  const [prayerPresets, setPrayerPresets] = useState<PrayerPreset[]>(() => {
    try { const s = localStorage.getItem("prayer_presets"); if (s) return JSON.parse(s); } catch {}
    return [defaultPreset];
  });
  const [monthPresetMap, setMonthPresetMap] = useState<MonthPresetMap>(() => {
    try { const s = localStorage.getItem("month_preset_map"); if (s) return JSON.parse(s); } catch {}
    return Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, defaultPresetId]));
  });

  const handleAddPreset = () => {
    const id = crypto.randomUUID();
    // Copy settings from first preset as a sensible default
    const base = prayerPresets[0];
    setPrayerPresets(prev => [...prev, {
      id,
      method: base?.method ?? "NorthAmerica",
      fajrAngle: base?.fajrAngle ?? "", ishaAngle: base?.ishaAngle ?? "",
      ishaInterval: base?.ishaInterval ?? "", maghribAngle: base?.maghribAngle ?? "",
      madhab: base?.madhab ?? "Shafi",
      highLatitudeRule: base?.highLatitudeRule ?? "recommended",
      polarCircleResolution: base?.polarCircleResolution ?? "AqrabBalad",
      shafaq: base?.shafaq ?? "General",
      rounding: base?.rounding ?? "Nearest",
      adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0",
      adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0",
    }]);
    // New preset starts with no months assigned — user clicks chips to assign
  };

  const handleDeletePreset = (id: string) => {
    if (prayerPresets.length <= 1) return; // always keep at least one
    setPrayerPresets(prev => prev.filter(p => p.id !== id));
    setMonthPresetMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[+k] === id) next[+k] = ""; });
      return next;
    });
  };

  const handleUpdatePreset = (id: string, patch: Partial<PrayerPreset>) =>
    setPrayerPresets(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const handleSetMonthPreset = (month: number, presetId: string) =>
    setMonthPresetMap(prev => ({ ...prev, [month]: presetId }));


  // ── Schedule edit state ───────────────────────────────────────────────
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(false);
  const [scheduleEdited, setScheduleEdited] = useState(false);
  const originalMonthSnapshot = useRef<Record<string, PrayerTime[]>>({});

  // ── Derived ───────────────────────────────────────────────────────────

  const months: Month[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(selectedYear, i, 1);
    return {
      value: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMonthKey = todayStr.slice(0, 7);
  const todayRow = prayerTimesByMonth[todayMonthKey]?.find(r => r.date === todayStr);

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) navigate("/", { replace: true });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 10);
    const t2 = setTimeout(() => setAnimDone(true), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Lock body scroll when source-switch modal is open
  useEffect(() => {
    document.body.style.overflow = pendingSource ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [pendingSource]);

  // ── Load prayer times from Supabase ───────────────────────────────────
  useEffect(() => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) { setPrayerLoading(false); return; }
    setPrayerLoading(true);

    supabaseAdmin
      .from("prayer_times")
      .select("date,fajr,dhuhr,asr,maghrib,isha,fajr_adhan,fajr_iqama,fajr_iqama_2,fajr_iqama_3,dhuhr_adhan,dhuhr_iqama,asr_adhan,asr_iqama,maghrib_adhan,maghrib_iqama,maghrib_iqama_2,maghrib_iqama_3,isha_adhan,isha_iqama,jummah_1,jummah_2,jummah_3")
      .eq("masjid_id", masjidId)
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`)
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const grouped: Record<string, PrayerTime[]> = {};
          const timeFields = ["fajr","dhuhr","asr","maghrib","isha","fajr_adhan","fajr_iqama","fajr_iqama_2","fajr_iqama_3","dhuhr_adhan","dhuhr_iqama","asr_adhan","asr_iqama","maghrib_adhan","maghrib_iqama","maghrib_iqama_2","maghrib_iqama_3","isha_adhan","isha_iqama","jummah_1","jummah_2","jummah_3"];
          for (const row of data) {
            const key = (row.date as string).slice(0, 7);
            if (!grouped[key]) grouped[key] = [];
            const normalized: Record<string, unknown> = { ...row };
            for (const f of timeFields) {
              if (normalized[f]) normalized[f] = to12h(normalized[f] as string);
            }
            grouped[key].push(normalized as unknown as PrayerTime);
          }
          setPrayerTimesByMonth(grouped);
          originalMonthSnapshot.current = { ...grouped };
        }
        setPrayerLoading(false);
      });
  }, [selectedYear]);

  // ── Sync selectedMonth when year changes ─────────────────────────────
  useEffect(() => {
    const monthNum = selectedMonth.slice(5, 7);
    setSelectedMonth(`${selectedYear}-${monthNum}`);
  }, [selectedYear]);

  // ── Load prayer settings from Supabase ───────────────────────────────
  useEffect(() => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    supabaseAdmin
      .from("prayer_settings")
      .select("extra_timings, times_source")
      .eq("masjid_id", masjidId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.extra_timings) setExtraTimings(data.extra_timings as typeof defaultExtra);
        if (data?.times_source === "excel" || data?.times_source === "backend") {
          setPrayerSource(data.times_source);
        }
      });
  }, []);

  // ── Load events & announcements from Supabase ─────────────────────────
  useEffect(() => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) { setEventsLoading(false); return; }
    Promise.all([
      supabaseAdmin.from("events").select("*").eq("masjid_id", masjidId).order("date", { ascending: true }),
      supabaseAdmin.from("announcements").select("*").eq("masjid_id", masjidId).order("created_at", { ascending: false }),
    ]).then(([evRes, annRes]) => {
      if (evRes.data) setEvents(evRes.data.map(r => ({ id: r.id, title: r.title, description: r.description || "", date: r.date, time: r.time || "", endTime: r.end_time || "", category: r.category || "" })));
      if (annRes.data) setAnnouncements(annRes.data.map(r => ({ id: r.id, title: r.title, body: r.body || "", createdAt: r.created_at || "", expiresAt: r.expires_at || "" })));
      setEventsLoading(false);
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  const [presetsSaved, setPresetsSaved] = useState(false);
  const [presetRegenConfirm, setPresetRegenConfirm] = useState(false);
  const [regenInProgress, setRegenInProgress] = useState(false);

  const doSavePresets = () => {
    localStorage.setItem("prayer_presets", JSON.stringify(prayerPresets));
    localStorage.setItem("month_preset_map", JSON.stringify(monthPresetMap));
    localStorage.setItem("prayer_settings_location", JSON.stringify({
      latitude: prayerSettings.latitude,
      longitude: prayerSettings.longitude,
      timezone: prayerSettings.timezone,
    }));
    setPresetsSaved(true);
    setTimeout(() => setPresetsSaved(false), 3000);
  };

  const handleSavePresets = () => {
    const generatedMonths = Object.keys(prayerTimesByMonth).sort();
    if (prayerSource === "backend" && generatedMonths.length > 0) {
      setPresetRegenConfirm(true);
    } else {
      doSavePresets();
    }
  };

  const handleConfirmPresetRegen = async () => {
    setPresetRegenConfirm(false);
    doSavePresets();
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setRegenInProgress(true);
    const location = { latitude: prayerSettings.latitude, longitude: prayerSettings.longitude, timezone: prayerSettings.timezone };
    try {
      const generatedMonths = Object.keys(prayerTimesByMonth).sort();
      const newGrouped: Record<string, PrayerTime[]> = { ...prayerTimesByMonth };
      const allRows: Record<string, string | null>[] = [];
      for (const monthKey of generatedMonths) {
        const monthNum = parseInt(monthKey.slice(5, 7));
        const presetId = monthPresetMap[monthNum];
        const preset = prayerPresets.find(p => p.id === presetId) ?? prayerPresets[0];
        const ps = mergePresetWithLocation(preset, location);
        const times = generateMonthAdhan(ps, monthKey);
        const existing = prayerTimesByMonth[monthKey] ?? [];
        const existingByDate = Object.fromEntries(existing.map(r => [r.date, r]));
        newGrouped[monthKey] = times.map(({ sunrise: _s, ...t }) => {
          const prev = existingByDate[t.date] ?? {};
          return { ...prev, ...t } as PrayerTime;
        });
        for (const { sunrise: _s, ...t } of times) {
          const prev = existingByDate[t.date] ?? {};
          allRows.push({ masjid_id: masjidId, ...prev, ...t });
        }
      }
      for (let i = 0; i < allRows.length; i += 100) {
        const { error } = await supabaseAdmin.from("prayer_times").upsert(allRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        if (error) throw new Error(error.message);
      }
      setPrayerTimesByMonth(newGrouped);
    } catch (err) {
      setUploadError("Regen failed: " + (err as Error).message);
    } finally {
      setRegenInProgress(false);
    }
  };

  const handleSaveSettings = () => {
    sessionStorage.setItem("masjid_name", generalSettings.masjidName);
    localStorage.setItem("masjid_name", generalSettings.masjidName);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleBatchApply = async () => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) { setBatchError("No masjid ID found."); return; }
    if (!batchFrom || !batchTo) { setBatchError("Please select a date range."); return; }
    if (batchFrom > batchTo) { setBatchError("Start date must be before end date."); return; }
    setBatchError(""); setApplyingBatch(true);

    const upsertRows: Record<string, string | null>[] = [];
    for (const days of Object.values(prayerTimesByMonth)) {
      for (const day of days) {
        if (day.date < batchFrom || day.date > batchTo) continue;
        const row: Record<string, string | null> = { masjid_id: masjidId, date: day.date };
        for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
          const start = day[p] ?? "";
          const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[p];
          const iCell = (batchIqama as unknown as Record<string, BatchCell>)[p];
          const adhanTime = applyBatchCell(aCell, start);
          row[`${p}_adhan`] = adhanTime;
          row[`${p}_iqama`] = applyBatchCell(iCell, adhanTime);
        }
        row.fajr_iqama_2    = jamaatSettings.fajr2    ? applyBatchCell(batchIqama2.fajr,    row.fajr_iqama as string)    : null;
        row.maghrib_iqama_2 = jamaatSettings.maghrib2 ? applyBatchCell(batchIqama2.maghrib, row.maghrib_iqama as string) : null;
        row.fajr_iqama_3    = jamaatSettings.fajr3    ? applyBatchCell(batchIqama3.fajr,    row.fajr_iqama_2 as string ?? row.fajr_iqama as string)    : null;
        row.maghrib_iqama_3 = jamaatSettings.maghrib3 ? applyBatchCell(batchIqama3.maghrib, row.maghrib_iqama_2 as string ?? row.maghrib_iqama as string) : null;
        const dayOfWeek = new Date(day.date + "T12:00:00").getDay(); // 0=Sun,5=Fri,6=Sat
        if (dayOfWeek === 5) {
          row.jummah_1 = extraTimings.jummah[0] || null;
          row.jummah_2 = extraTimings.jummah[1] || null;
          row.jummah_3 = extraTimings.jummah[2] || null;
        }
        if (extraTimings.weekendIsha.enabled && extraTimings.weekendIsha.iqama) {
          const dayName = dayOfWeek === 5 ? "fri" : dayOfWeek === 6 ? "sat" : dayOfWeek === 0 ? "sun" : null;
          if (dayName && extraTimings.weekendIsha.days.includes(dayName)) {
            row.isha_iqama = extraTimings.weekendIsha.iqama;
          }
        }
        upsertRows.push(row);
      }
    }

    if (upsertRows.length === 0) { setBatchError("No loaded prayer times in that date range."); setApplyingBatch(false); return; }

    for (let i = 0; i < upsertRows.length; i += 100) {
      const { error } = await supabaseAdmin.from("prayer_times").upsert(upsertRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
      if (error) { setBatchError("Save failed: " + error.message); setApplyingBatch(false); return; }
    }

    setPrayerTimesByMonth(prev => {
      const updated = { ...prev };
      for (const [key, days] of Object.entries(prev)) {
        updated[key] = days.map(day => {
          const match = upsertRows.find(r => r.date === day.date);
          return match ? { ...day, ...match } : day;
        });
      }
      return updated;
    });

    setApplyingBatch(false); setBatchApplied(true);
    setTimeout(() => setBatchApplied(false), 2500);
  };

  const handleConfirmSourceSwitch = async () => {
    if (!pendingSource) return;
    const newSource = pendingSource;
    setPendingSource(null);
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");

    if (masjidId) {
      await supabaseAdmin.from("prayer_settings").upsert({ masjid_id: masjidId, times_source: newSource }, { onConflict: "masjid_id" });
    }

    if (newSource === "excel") {
      if (masjidId) await supabaseAdmin.from("prayer_times").delete().eq("masjid_id", masjidId);
      setPrayerTimesByMonth({});
      setPrayerSource("excel");
    } else {
      setPrayerSource("backend");
      if (!masjidId) return;
      setSwitchLoading(true);
      setUploadError("");
      try {
        const year = new Date().getFullYear();
        const times = generateYearAdhan(prayerSettings, year);
        const rows = times.map(({ sunrise: _s, ...t }) => ({ masjid_id: masjidId, ...t, ...addDefaultAdhanIqama(t) }));
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabaseAdmin.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
          if (error) throw new Error(error.message);
        }
        const grouped: Record<string, PrayerTime[]> = {};
        for (const { sunrise: _s, ...row } of times) {
          const key = row.date.slice(0, 7);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ ...row, ...addDefaultAdhanIqama(row) } as PrayerTime);
        }
        setPrayerTimesByMonth(grouped);
        originalMonthSnapshot.current = { ...grouped };
        setUploadSuccess(`Prayer times auto-calculated for all of ${year}.`);
        setTimeout(() => setUploadSuccess(""), 4000);
      } catch (err) {
        setUploadError("Failed to regenerate: " + (err as Error).message);
      } finally {
        setSwitchLoading(false);
      }
    }
  };

  const [generatingYear, setGeneratingYear] = useState<number | null>(null);

  const handleGenerateYear = async (year: number) => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setGeneratingYear(year);
    try {
      const times = generateYearAdhan(prayerSettings, year);
      const rows = times.map(({ sunrise: _s, ...t }) => ({ masjid_id: masjidId, ...t, ...addDefaultAdhanIqama(t) }));
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabaseAdmin.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        if (error) throw new Error(error.message);
      }
      const grouped: Record<string, PrayerTime[]> = {};
      for (const { sunrise: _s, ...row } of times) {
        const key = row.date.slice(0, 7);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ ...row, ...addDefaultAdhanIqama(row) } as PrayerTime);
      }
      setPrayerTimesByMonth(prev => ({ ...prev, ...grouped }));
    } catch (err) {
      setUploadError("Failed to generate: " + (err as Error).message);
    } finally {
      setGeneratingYear(null);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const find = (kws: string[]) => headers.find(h => kws.some(k => h.toLowerCase().includes(k))) ?? "";
    setColMap({
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
      jummah1:       find(["jumah 1", "jummah 1", "1st jum"]) || find(["jumah", "jummah"]),
      jummah2:       find(["jumah 2", "jummah 2", "2nd jum"]),
      jummah3:       find(["jumah 3", "jummah 3", "3rd jum"]),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadError("Please upload an Excel file (.xlsx or .xls)"); return;
    }
    setUploadFile(file); setUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
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
      } catch { setUploadError("Failed to read file."); }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!xlsxPreview) return;
    setIsUploading(true); setUploadError(""); setUploadSuccess("");
    try {
      const rows = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
      const headers = rows[xlsxPreview.headerRowIdx].map(h => String(h ?? "").trim());
      const dataRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c !== "" && c != null));
      const ci = (col: string) => col ? headers.indexOf(col) : -1;
      const cv = (row: string[], col: string) => { const i = ci(col); return i >= 0 ? String(row[i] ?? "").trim() : ""; };

      const parsed: PrayerTime[] = [];
      for (const row of dataRows) {
        let dateStr = "";
        if (colMap.date) {
          const raw = cv(row, colMap.date);
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            dateStr = raw;
          } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(raw)) {
            const parts = raw.split(/[\/\-]/);
            dateStr = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          } else if (!isNaN(Number(raw)) && Number(raw) > 40000) {
            const d = new Date(Math.round((Number(raw) - 25569) * 86400 * 1000));
            dateStr = d.toISOString().slice(0, 10);
          } else {
            const parsed2 = new Date(raw);
            if (!isNaN(parsed2.getTime())) dateStr = parsed2.toISOString().slice(0, 10);
          }
        } else if (colMap.day) {
          const dayNum = parseInt(cv(row, colMap.day));
          if (!dayNum || isNaN(dayNum)) continue;
          dateStr = `${importMonth}-${String(dayNum).padStart(2, "0")}`;
        }
        if (!dateStr) continue;

        const entry: PrayerTime = {
          date:    dateStr,
          fajr:    cv(row, colMap.fajr),
          dhuhr:   cv(row, colMap.dhuhr),
          asr:     cv(row, colMap.asr),
          maghrib: cv(row, colMap.maghrib),
          isha:    cv(row, colMap.isha),
        };
        if (colMap.fajr_iqama)    entry.fajr_iqama    = cv(row, colMap.fajr_iqama);
        if (colMap.dhuhr_iqama)   entry.dhuhr_iqama   = cv(row, colMap.dhuhr_iqama);
        if (colMap.asr_iqama)     entry.asr_iqama     = cv(row, colMap.asr_iqama);
        if (colMap.maghrib_iqama) entry.maghrib_iqama = cv(row, colMap.maghrib_iqama);
        if (colMap.isha_iqama)    entry.isha_iqama    = cv(row, colMap.isha_iqama);
        parsed.push(entry);
      }

      if (parsed.length === 0) { setUploadError("No rows could be extracted. Check your column mapping."); setIsUploading(false); return; }

      const jTimes = [colMap.jummah1, colMap.jummah2, colMap.jummah3]
        .map(col => col ? cv(dataRows[0], col) : "").filter(Boolean);
      if (jTimes.length > 0) setExtraTimings(prev => ({ ...prev, jummah: jTimes }));

      const parsedWithDefaults = parsed.map(row => ({ ...row, ...addDefaultAdhanIqama(row) }));
      const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
      if (masjidId) {
        const dbRows = parsedWithDefaults.map(row => ({ masjid_id: masjidId, ...row }));
        for (let i = 0; i < dbRows.length; i += 100) {
          await supabaseAdmin.from("prayer_times").upsert(dbRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        }
      }
      const grouped: Record<string, PrayerTime[]> = {};
      for (const row of parsedWithDefaults) {
        const key = row.date?.slice(0, 7);
        if (key) { if (!grouped[key]) grouped[key] = []; grouped[key].push(row as PrayerTime); }
      }
      setPrayerTimesByMonth(prev => ({ ...prev, ...grouped }));
      const fmtD = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      setUploadSuccess(`${parsed.length} days imported · ${fmtD(parsed[0].date)} – ${fmtD(parsed[parsed.length - 1].date)}`);
      setTimeout(() => setUploadSuccess(""), 4000);
      setXlsxPreview(null); setUploadFile(null);
    } catch (err) { setUploadError("Import failed: " + (err as Error).message); }
    finally { setIsUploading(false); }
  };

  const handleEditCell = (date: string, field: string, value: string) => {
    const monthKey = date.slice(0, 7);
    setPrayerTimesByMonth(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].map(d => d.date === date ? { ...d, [field]: value } : d),
    }));
    setScheduleEdited(true);
  };

  const handleSaveSchedule = async () => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setSavingSchedule(true);
    const rows = (prayerTimesByMonth[selectedMonth] || []).map(day => ({ masjid_id: masjidId, ...day }));
    for (let i = 0; i < rows.length; i += 100) {
      await supabaseAdmin.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
    }
    setSavingSchedule(false); setSavedSchedule(true); setScheduleEdited(false);
    originalMonthSnapshot.current[selectedMonth] = (prayerTimesByMonth[selectedMonth] || []).map(r => ({ ...r }));
    setTimeout(() => setSavedSchedule(false), 2500);
  };

  const handleDiscardChanges = () => {
    const snap = originalMonthSnapshot.current[selectedMonth];
    if (snap) setPrayerTimesByMonth(prev => ({ ...prev, [selectedMonth]: snap }));
    setScheduleEdited(false);
  };


  const handleEventSubmit = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) { alert("Fill in all required fields"); return; }
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    const row = { masjid_id: masjidId, title: eventForm.title, description: eventForm.description, date: eventForm.date, time: eventForm.time, end_time: eventForm.endTime || null, category: eventForm.category };
    if (editingEvent) {
      const { error } = await supabaseAdmin.from("events").update(row).eq("id", editingEvent.id);
      if (error) { alert("Failed to save: " + error.message); return; }
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventForm } : e));
    } else {
      const { data, error } = await supabaseAdmin.from("events").insert(row).select().single();
      if (error) { alert("Failed to create: " + error.message); return; }
      setEvents(prev => [...prev, { id: data.id, title: data.title, description: data.description, date: data.date, time: data.time, endTime: data.end_time || "", category: data.category }]);
    }
    setEventsPanel(false); setEventForm({ title: "", description: "", date: "", time: "", endTime: "", category: "General" }); setEditingEvent(null);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
    if (error) { alert("Failed to delete: " + error.message); return; }
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({ title: event.title, description: event.description, date: event.date, time: event.time, endTime: event.endTime || "", category: event.category || "General" });
    setEventsPanel(true);
  };

  // ── Sidebar tabs ──────────────────────────────────────────────────────
  const sidebarTabs = [
    { id: "overview",     name: "Overview",     icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "prayer-times", name: "Prayer Times", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "events",       name: "Events",       icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "settings",     name: "Settings",     icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={animDone ? { opacity: 1 } : {
      opacity:    mounted ? 1 : 0,
      transform:  mounted ? "scale(1) translateY(0)" : "scale(1.015) translateY(16px)",
      transition: "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)",
    }}>

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 w-full bg-zinc-950/95 backdrop-blur-xl border-b ${theme.navBorder} z-50 py-4`}>
        <div className="max-w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center`}>
              <CrescentIcon className={`w-5 h-5 ${theme.iconColor}`} />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white leading-tight">{generalSettings.masjidName}</div>
              <div className={`text-xs font-bold tracking-widest uppercase ${theme.label}`}>Admin Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-zinc-400 font-bold tabular-nums">
              {currentTime.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Sidebar ── */}
      <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-56 bg-zinc-950 border-r border-white/[0.06] z-40 flex flex-col">

        {/* Nav items */}
        <div className="flex-1 px-3 pt-5 pb-3 space-y-0.5 overflow-y-auto">
          {sidebarTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left group ${
                  isActive
                    ? `${theme.accentBg} ${theme.accent} border ${theme.accentBorder}`
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.05] border border-transparent"
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isActive ? theme.iconBg : "bg-zinc-800/70 group-hover:bg-zinc-700/70"
                }`}>
                  <Icon d={tab.icon} className={`w-3.5 h-3.5 ${isActive ? theme.iconColor : "text-zinc-500 group-hover:text-zinc-300"}`} />
                </div>
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Bottom: logout */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-white hover:bg-white/[0.05] border border-transparent transition-all text-left group">
            <div className="w-7 h-7 rounded-lg bg-zinc-800/70 group-hover:bg-zinc-700/70 flex items-center justify-center shrink-0 transition-all">
              <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
            </div>
            Logout
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="ml-56 pt-[73px] pb-12 min-h-screen">

        {activeTab === "overview" && (
          <OverviewTab
            theme={theme}
            currentTime={currentTime}
            generalSettings={generalSettings}
            todayRow={todayRow}
            events={events}
            announcements={announcements}
            prayerTimesByMonth={prayerTimesByMonth}
            setActiveTab={setActiveTab}
            setEventsSubTab={setEventsSubTab}
          />
        )}

        {activeTab === "prayer-times" && (
          <PrayerTimesTab
            theme={theme}
            todayRow={todayRow}
            prayerSource={prayerSource}
            setPendingSource={setPendingSource}
            pendingSource={pendingSource}
            prayerLoading={prayerLoading}
            prayerTimesByMonth={prayerTimesByMonth}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            months={months}
            scheduleEdited={scheduleEdited}
            setScheduleEdited={setScheduleEdited}
            savingSchedule={savingSchedule}
            savedSchedule={savedSchedule}
            switchLoading={switchLoading}
            uploadFile={uploadFile}
            uploadSuccess={uploadSuccess}
            uploadError={uploadError}
            handleFileChange={handleFileChange}
            handleSaveSchedule={handleSaveSchedule}
            handleDiscardChanges={handleDiscardChanges}
            handleEditCell={handleEditCell}
            handleConfirmSourceSwitch={handleConfirmSourceSwitch}
            batchFrom={batchFrom}
            setBatchFrom={setBatchFrom}
            batchTo={batchTo}
            setBatchTo={setBatchTo}
            batchAdhan={batchAdhan}
            setBatchAdhan={setBatchAdhan}
            batchIqama={batchIqama}
            setBatchIqama={setBatchIqama}
            batchIqama2={batchIqama2}
            setBatchIqama2={setBatchIqama2}
            batchIqama3={batchIqama3}
            setBatchIqama3={setBatchIqama3}
            applyingBatch={applyingBatch}
            batchApplied={batchApplied}
            batchError={batchError}
            handleBatchApply={handleBatchApply}
            jamaatSettings={jamaatSettings}
            extraTimings={extraTimings}
            setExtraTimings={setExtraTimings}
            xlsxPreview={xlsxPreview}
            setXlsxPreview={setXlsxPreview}
            colMap={colMap}
            setColMap={setColMap}
            autoMapColumns={autoMapColumns}
            handleConfirmImport={handleConfirmImport}
            isUploading={isUploading}
            handleGenerateYear={handleGenerateYear}
            generatingYear={generatingYear}
          />
        )}

        {activeTab === "events" && (
          <EventsTab
            theme={theme}
            events={events}
            setEvents={setEvents}
            eventsLoading={eventsLoading}
            eventsSubTab={eventsSubTab}
            setEventsSubTab={setEventsSubTab}
            announcements={announcements}
            setAnnouncements={setAnnouncements}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
            editingAnnouncement={editingAnnouncement}
            setEditingAnnouncement={setEditingAnnouncement}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm}
            eventForm={eventForm}
            setEventForm={setEventForm}
            eventsPanel={eventsPanel}
            setEventsPanel={setEventsPanel}
            handleEventSubmit={handleEventSubmit}
            handleDeleteEvent={handleDeleteEvent}
            handleEditEvent={handleEditEvent}
          />
        )}


        {activeTab === "settings" && (
          <SettingsTab
            theme={theme}
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            registeredEmail={registeredEmail}
            generalSettings={generalSettings}
            setGeneralSettings={setGeneralSettings}
            settingsSaved={settingsSaved}
            handleSaveSettings={handleSaveSettings}
            prayerSettings={prayerSettings}
            setPrayerSettings={setPrayerSettings}
            jamaatSettings={jamaatSettings}
            setJamaatSettings={setJamaatSettings}
            prayerPresets={prayerPresets}
            monthPresetMap={monthPresetMap}
            handleAddPreset={handleAddPreset}
            handleDeletePreset={handleDeletePreset}
            handleUpdatePreset={handleUpdatePreset}
            handleSetMonthPreset={handleSetMonthPreset}
            handleSavePresets={handleSavePresets}
            presetsSaved={presetsSaved}
          />
        )}

      </div>

      {/* ── Preset regen confirmation modal ── */}
      {presetRegenConfirm && (() => {
        const generatedMonths = Object.keys(prayerTimesByMonth).sort();
        const first = generatedMonths[0];
        const last = generatedMonths[generatedMonths.length - 1];
        const fmt = (m: string) => new Date(m + "-01T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.75)" }}>
            <div className="w-full max-w-sm bg-zinc-900 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-7 pt-7 pb-5 border-b border-white/5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${theme.iconBg}`}>
                  <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className={`w-5 h-5 ${theme.iconColor}`} />
                </div>
                <div className="text-lg font-black text-white mb-1">Regenerate prayer times?</div>
                <div className="text-sm text-zinc-400 leading-relaxed">
                  This will recalculate adhan times for <span className="text-white font-bold">{generatedMonths.length} month{generatedMonths.length !== 1 ? "s" : ""}</span> ({fmt(first)} – {fmt(last)}) using the new preset settings. Iqama times will be preserved.
                </div>
              </div>
              <div className="px-7 py-5 flex gap-3">
                <button onClick={() => { setPresetRegenConfirm(false); doSavePresets(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-black text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/8 transition-all">
                  Save only
                </button>
                <button onClick={handleConfirmPresetRegen}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-black text-sm transition-all ${theme.btn}`}>
                  Save &amp; Regenerate
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Regen in progress overlay ── */}
      {regenInProgress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin w-10 h-10 text-emerald-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <div className="text-white font-black text-sm">Regenerating prayer times…</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
