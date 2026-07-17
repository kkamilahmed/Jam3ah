import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "../lib/supabase";

import type {
  PrayerTime,
  Event,
  EventForm,
  Announcement,
  Month,
  BatchCell,
  BatchCell2,
  BatchConfig,
} from "../dashboard/types";
import { THEMES, type ThemeKey } from "../dashboard/themes";
import {
  to12h,
  makeDefaultBatchAdhan,
  makeDefaultBatchIqama,
  applyBatchCell,
  addDefaultAdhanIqama,
} from "../dashboard/utils";
import {
  generateYearAdhan,
  generateMonthAdhan,
  mergePresetWithLocation,
  type PrayerPreset,
  type MonthPresetMap,
} from "../dashboard/constants";

import OverviewTab from "../dashboard/tabs/OverviewTab";
import PrayerTimesTab from "../dashboard/tabs/PrayerTimesTab";
import EventsTab from "../dashboard/tabs/EventsTab";
import SettingsTab from "../dashboard/tabs/SettingsTab";
import TutorialOverlay from "../components/TutorialOverlay";
import Toast, { type ToastState, type ToastKind } from "../dashboard/components/Toast";

// ── Dashboard Component ───────────────────────────────────────────────────
const VALID_TABS = [
  "overview",
  "prayer-times",
  "events",
  "announcements",
  "settings",
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const activeTab = VALID_TABS.includes(tab ?? "") ? tab! : "overview";
  // Events and Announcements are separate top-level tabs sharing one component.
  const eventsSubTab: "events" | "announcements" =
    activeTab === "announcements" ? "announcements" : "events";

  const [seenTabs, setSeenTabs] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("seen_tabs") || '["overview"]')); }
    catch { return new Set(["overview"]); }
  });
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem("tour_seen"));

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastId = useRef(0);
  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    setToast({ message, kind, id: ++toastId.current });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const setActiveTab = (t: string) => {
    setSeenTabs(prev => {
      const next = new Set([...prev, t]);
      localStorage.setItem("seen_tabs", JSON.stringify([...next]));
      return next;
    });
    navigate(`/home/${t}`);
  };

  const isMobile = useIsMobile();

  // ── Theme ──────────────────────────────────────────────────────────────
  const [themeName] = useState<ThemeKey>(() => {
    return (localStorage.getItem("masjid_theme") as ThemeKey) || "emerald";
  });
  const theme = THEMES[themeName];
  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem("app_theme") !== "light",
  );
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("app_theme");
    } else {
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("app_theme", "light");
    }
  };
  const [mounted, setMounted] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const storedName =
    sessionStorage.getItem("masjid_name") ||
    localStorage.getItem("masjid_name") ||
    "Toronto Hifz Academy";

  // ── General settings ──────────────────────────────────────────────────
  const registeredEmail =
    sessionStorage.getItem("user_email") ||
    localStorage.getItem("user_email") ||
    "";

  const defaultGeneralSettings = {
    masjidName: storedName,
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
  };
  const [generalSettings, setGeneralSettings] = useState(
    defaultGeneralSettings,
  );
  const [savedGeneralSettings, setSavedGeneralSettings] = useState(
    defaultGeneralSettings,
  );
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Prayer settings ───────────────────────────────────────────────────
  const [prayerSettings, setPrayerSettings] = useState({
    latitude: "43.651070",
    longitude: "-79.347015",
    timezone: "America/Toronto",
    method: "NorthAmerica",
    fajrAngle: "",
    ishaAngle: "",
    ishaInterval: "",
    maghribAngle: "",
    madhab: "Shafi",
    highLatitudeRule: "recommended",
    polarCircleResolution: "AqrabBalad",
    shafaq: "General",
    rounding: "Nearest",
    adjustFajr: "0",
    adjustSunrise: "0",
    adjustDhuhr: "0",
    adjustAsr: "0",
    adjustMaghrib: "0",
    adjustIsha: "0",
  });

  // ── Prayer times state ────────────────────────────────────────────────
  const [prayerSource, setPrayerSource] = useState<"excel" | "backend">(
    "backend",
  );
  const [pendingSource, setPendingSource] = useState<
    "excel" | "backend" | null
  >(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [switchLoading, setSwitchLoading] = useState(false);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [prayerTimesByMonth, setPrayerTimesByMonth] = useState<
    Record<string, PrayerTime[]>
  >({});
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
    date: "",
    day: "",
    fajr: "",
    dhuhr: "",
    asr: "",
    maghrib: "",
    isha: "",
    fajr_iqama: "",
    dhuhr_iqama: "",
    asr_iqama: "",
    maghrib_iqama: "",
    isha_iqama: "",
    jummah1: "",
    jummah2: "",
    jummah3: "",
  });
  const [importMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const defaultExtra = {
    fajr: [] as string[],
    maghrib: [] as string[],
    jummah: ["", "", ""],
    jummahSlots: [false, false, false] as [boolean, boolean, boolean],
    weekendIsha: { enabled: true, days: ["fri", "sat"] as string[], iqama: "" },
  };
  const [extraTimings, setExtraTimings] = useState<{
    fajr: string[];
    maghrib: string[];
    jummah: string[];
    jummahSlots: [boolean, boolean, boolean];
    weekendIsha: { enabled: boolean; days: string[]; iqama: string };
  }>(defaultExtra);

  // ── Jamaat settings ───────────────────────────────────────────────────
  const [jamaatSettings, setJamaatSettings] = useState({
    fajr2: false,
    fajr3: false,
    maghrib2: false,
    maghrib3: false,
  });

  // ── Batch update state ────────────────────────────────────────────────
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");
  const [batchAdhan, setBatchAdhan] = useState<BatchConfig>(
    makeDefaultBatchAdhan(),
  );
  const [batchIqama, setBatchIqama] = useState<BatchConfig>(
    makeDefaultBatchIqama(),
  );
  const [batchIqama2, setBatchIqama2] = useState<{
    fajr: BatchCell2;
    maghrib: BatchCell2;
  }>({
    fajr: { mode: "fixed", offset: 0, fixed: "", enabled: false },
    maghrib: { mode: "fixed", offset: 0, fixed: "", enabled: false },
  });
  const [batchIqama3, setBatchIqama3] = useState<{
    fajr: BatchCell2;
    maghrib: BatchCell2;
  }>({
    fajr: { mode: "fixed", offset: 0, fixed: "", enabled: false },
    maghrib: { mode: "fixed", offset: 0, fixed: "", enabled: false },
  });
  const [applyingBatch, setApplyingBatch] = useState(false);
  const [batchApplied, setBatchApplied] = useState(false);
  const [batchError, setBatchError] = useState("");

  // ── Events state ──────────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    expiresAt: "",
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    category: "General",
  });
  const [eventsPanel, setEventsPanel] = useState(false);

  // ── Presets & schedule ────────────────────────────────────────────────
  const defaultPresetId = "default";
  const defaultPreset: PrayerPreset = {
    id: defaultPresetId,
    method: "NorthAmerica",
    fajrAngle: "",
    ishaAngle: "",
    ishaInterval: "",
    maghribAngle: "",
    madhab: "Shafi",
    highLatitudeRule: "recommended",
    polarCircleResolution: "AqrabBalad",
    shafaq: "General",
    rounding: "Nearest",
    adjustFajr: "0",
    adjustSunrise: "0",
    adjustDhuhr: "0",
    adjustAsr: "0",
    adjustMaghrib: "0",
    adjustIsha: "0",
  };
  const [prayerPresets, setPrayerPresets] = useState<PrayerPreset[]>(() => {
    try {
      const s = localStorage.getItem("prayer_presets");
      if (s) return JSON.parse(s);
    } catch {}
    return [defaultPreset];
  });
  const [monthPresetMap, setMonthPresetMap] = useState<MonthPresetMap>(() => {
    try {
      const s = localStorage.getItem("month_preset_map");
      if (s) return JSON.parse(s);
    } catch {}
    return Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, defaultPresetId]),
    );
  });
  const [savedPrayerPresets, setSavedPrayerPresets] = useState<PrayerPreset[]>(
    () => {
      try {
        const s = localStorage.getItem("prayer_presets");
        if (s) return JSON.parse(s);
      } catch {}
      return [defaultPreset];
    },
  );
  const [savedMonthPresetMap, setSavedMonthPresetMap] =
    useState<MonthPresetMap>(() => {
      try {
        const s = localStorage.getItem("month_preset_map");
        if (s) return JSON.parse(s);
      } catch {}
      return Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [i + 1, defaultPresetId]),
      );
    });

  const handleAddPreset = () => {
    const id = crypto.randomUUID();
    // Copy settings from first preset as a sensible default
    const base = prayerPresets[0];
    setPrayerPresets((prev) => [
      ...prev,
      {
        id,
        method: base?.method ?? "NorthAmerica",
        fajrAngle: base?.fajrAngle ?? "",
        ishaAngle: base?.ishaAngle ?? "",
        ishaInterval: base?.ishaInterval ?? "",
        maghribAngle: base?.maghribAngle ?? "",
        madhab: base?.madhab ?? "Shafi",
        highLatitudeRule: base?.highLatitudeRule ?? "recommended",
        polarCircleResolution: base?.polarCircleResolution ?? "AqrabBalad",
        shafaq: base?.shafaq ?? "General",
        rounding: base?.rounding ?? "Nearest",
        adjustFajr: "0",
        adjustSunrise: "0",
        adjustDhuhr: "0",
        adjustAsr: "0",
        adjustMaghrib: "0",
        adjustIsha: "0",
      },
    ]);
    // New preset starts with no months assigned — user clicks chips to assign
  };

  const handleDeletePreset = (id: string) => {
    if (prayerPresets.length <= 1) return; // always keep at least one
    setPrayerPresets((prev) => prev.filter((p) => p.id !== id));
    setMonthPresetMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[+k] === id) next[+k] = "";
      });
      return next;
    });
  };

  const handleUpdatePreset = (id: string, patch: Partial<PrayerPreset>) =>
    setPrayerPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const handleSetMonthPreset = (month: number, presetId: string) =>
    setMonthPresetMap((prev) => ({ ...prev, [month]: presetId }));

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
  const todayRow = prayerTimesByMonth[todayMonthKey]?.find(
    (r) => r.date === todayStr,
  );

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) navigate("/", { replace: true });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 10);
    const t2 = setTimeout(() => setAnimDone(true), 650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Lock body scroll when source-switch modal is open
  useEffect(() => {
    document.body.style.overflow = pendingSource ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [pendingSource]);

  // ── Load prayer times from Supabase ───────────────────────────────────
  useEffect(() => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) {
      setPrayerLoading(false);
      return;
    }
    setPrayerLoading(true);

    supabaseAdmin
      .from("prayer_times")
      .select(
        "date,fajr,dhuhr,asr,maghrib,isha,fajr_adhan,fajr_iqama,fajr_iqama_2,fajr_iqama_3,dhuhr_adhan,dhuhr_iqama,asr_adhan,asr_iqama,maghrib_adhan,maghrib_iqama,maghrib_iqama_2,maghrib_iqama_3,isha_adhan,isha_iqama,jummah_1,jummah_2,jummah_3",
      )
      .eq("masjid_id", masjidId)
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`)
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const grouped: Record<string, PrayerTime[]> = {};
          const timeFields = [
            "fajr",
            "dhuhr",
            "asr",
            "maghrib",
            "isha",
            "fajr_adhan",
            "fajr_iqama",
            "fajr_iqama_2",
            "fajr_iqama_3",
            "dhuhr_adhan",
            "dhuhr_iqama",
            "asr_adhan",
            "asr_iqama",
            "maghrib_adhan",
            "maghrib_iqama",
            "maghrib_iqama_2",
            "maghrib_iqama_3",
            "isha_adhan",
            "isha_iqama",
            "jummah_1",
            "jummah_2",
            "jummah_3",
          ];
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
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    supabaseAdmin
      .from("prayer_settings")
      .select("source, jummah_config, presets, latitude, longitude, timezone")
      .eq("masjid_id", masjidId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.jummah_config) {
          const { jamaatSettings: savedJamaat, ...timings } =
            data.jummah_config as typeof defaultExtra & {
              jamaatSettings?: typeof jamaatSettings;
            };
          setExtraTimings(timings as typeof defaultExtra);
          if (savedJamaat) setJamaatSettings(savedJamaat);
        }
        if (data?.source === "excel" || data?.source === "backend") {
          setPrayerSource(data.source);
        }
        if (data?.presets) {
          localStorage.setItem("prayer_presets", JSON.stringify(data.presets));
          setPrayerPresets(data.presets);
          setSavedPrayerPresets(data.presets);
        }
        if (data?.latitude || data?.longitude || data?.timezone) {
          setPrayerSettings((prev) => ({
            ...prev,
            ...(data.latitude ? { latitude: data.latitude } : {}),
            ...(data.longitude ? { longitude: data.longitude } : {}),
            ...(data.timezone ? { timezone: data.timezone } : {}),
          }));
        }
      });
  }, []);

  // ── Load masjid profile from Supabase ────────────────────────────────
  useEffect(() => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    supabaseAdmin
      .from("masjids")
      .select("masjid_name, address, city, province, postal_code, masjid_phone")
      .eq("id", masjidId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const loaded = {
          masjidName: data.masjid_name || "",
          address: data.address || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postal_code || "",
          phone: data.masjid_phone || "",
        };
        setGeneralSettings(loaded);
        setSavedGeneralSettings(loaded);
        if (data.masjid_name) {
          sessionStorage.setItem("masjid_name", data.masjid_name);
          localStorage.setItem("masjid_name", data.masjid_name);
        }
      });
  }, []);

  // ── Load events & announcements from Supabase ─────────────────────────
  useEffect(() => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) {
      setEventsLoading(false);
      return;
    }
    Promise.all([
      supabaseAdmin
        .from("events")
        .select("*")
        .eq("masjid_id", masjidId)
        .order("date", { ascending: true }),
      supabaseAdmin
        .from("announcements")
        .select("*")
        .eq("masjid_id", masjidId)
        .order("created_at", { ascending: false }),
    ]).then(([evRes, annRes]) => {
      if (evRes.data)
        setEvents(
          evRes.data.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description || "",
            date: r.date,
            time: r.time || "",
            endTime: "",
            category: "",
          })),
        );
      if (annRes.data)
        setAnnouncements(
          annRes.data.map((r) => ({
            id: r.id,
            title: r.title,
            body: r.body || "",
            createdAt: r.created_at || "",
            expiresAt: r.expires_at || "",
          })),
        );
      setEventsLoading(false);
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleCloseTutorial = () => {
    const allTabs = ["overview", "prayer-times", "events", "settings"];
    localStorage.setItem("tour_seen", "1");
    localStorage.setItem("seen_tabs", JSON.stringify(allTabs));
    setSeenTabs(new Set(allTabs));
    setShowTutorial(false);
  };

  const [presetsSaved, setPresetsSaved] = useState(false);
  const [presetRegenConfirm, setPresetRegenConfirm] = useState(false);
  const [regenInProgress, setRegenInProgress] = useState(false);

  const doSavePresets = async () => {
    localStorage.setItem("prayer_presets", JSON.stringify(prayerPresets));
    localStorage.setItem("month_preset_map", JSON.stringify(monthPresetMap));
    localStorage.setItem(
      "prayer_settings_location",
      JSON.stringify({
        latitude: prayerSettings.latitude,
        longitude: prayerSettings.longitude,
        timezone: prayerSettings.timezone,
      }),
    );
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (masjidId) {
      const { error } = await supabaseAdmin.from("prayer_settings").upsert(
        {
          masjid_id: masjidId,
          presets: prayerPresets,
          latitude: prayerSettings.latitude,
          longitude: prayerSettings.longitude,
          timezone: prayerSettings.timezone,
          method: prayerPresets[0]?.method ?? "NorthAmerica",
          jummah_config: { ...extraTimings, jamaatSettings },
        },
        { onConflict: "masjid_id" },
      );
      if (error) {
        showToast("Failed to save presets: " + error.message, "error");
        return;
      }
    }
    setSavedPrayerPresets(prayerPresets);
    setSavedMonthPresetMap(monthPresetMap);
    setPresetsSaved(true);
    setTimeout(() => setPresetsSaved(false), 3000);
    showToast("Prayer presets saved");
  };

  const handleCancelPresets = () => {
    setPrayerPresets(savedPrayerPresets);
    setMonthPresetMap(savedMonthPresetMap);
  };

  const handleSavePresetsOnly = () => doSavePresets();
  const hasGeneratedMonths =
    prayerSource === "backend" && Object.keys(prayerTimesByMonth).length > 0;

  const handleConfirmPresetRegen = async () => {
    setPresetRegenConfirm(false);
    doSavePresets();
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setRegenInProgress(true);
    const location = {
      latitude: prayerSettings.latitude,
      longitude: prayerSettings.longitude,
      timezone: prayerSettings.timezone,
    };
    try {
      const generatedMonths = Object.keys(prayerTimesByMonth).sort();
      const newGrouped: Record<string, PrayerTime[]> = {
        ...prayerTimesByMonth,
      };
      const allRows: Record<string, string | null>[] = [];
      for (const monthKey of generatedMonths) {
        const monthNum = parseInt(monthKey.slice(5, 7));
        const presetId = monthPresetMap[monthNum];
        const preset =
          prayerPresets.find((p) => p.id === presetId) ?? prayerPresets[0];
        const ps = mergePresetWithLocation(preset, location);
        const times = generateMonthAdhan(ps, monthKey);
        const existing = prayerTimesByMonth[monthKey] ?? [];
        const existingByDate = Object.fromEntries(
          existing.map((r) => [r.date, r]),
        );
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
        const { error } = await supabaseAdmin
          .from("prayer_times")
          .upsert(allRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        if (error) throw new Error(error.message);
      }
      setPrayerTimesByMonth(newGrouped);
    } catch (err) {
      setUploadError("Regen failed: " + (err as Error).message);
    } finally {
      setRegenInProgress(false);
    }
  };

  const handleSaveSettings = async () => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) {
      showToast("No masjid ID found. Please log in again.", "error");
      return;
    }
    const { error } = await supabaseAdmin
      .from("masjids")
      .update({
        masjid_name: generalSettings.masjidName,
        address: generalSettings.address,
        city: generalSettings.city,
        province: generalSettings.province,
        postal_code: generalSettings.postalCode,
        masjid_phone: generalSettings.phone,
      })
      .eq("id", masjidId);
    if (error) {
      showToast("Failed to save: " + error.message, "error");
      return;
    }
    sessionStorage.setItem("masjid_name", generalSettings.masjidName);
    localStorage.setItem("masjid_name", generalSettings.masjidName);
    setSavedGeneralSettings(generalSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
    showToast("Masjid profile saved");
  };

  const handleBatchApply = async () => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) {
      setBatchError("No masjid ID found.");
      return;
    }
    if (!batchFrom || !batchTo) {
      setBatchError("Please select a date range.");
      return;
    }
    if (batchFrom > batchTo) {
      setBatchError("Start date must be before end date.");
      return;
    }
    setBatchError("");
    setApplyingBatch(true);

    const upsertRows: Record<string, string | null>[] = [];
    for (const days of Object.values(prayerTimesByMonth)) {
      for (const day of days) {
        if (day.date < batchFrom || day.date > batchTo) continue;
        const row: Record<string, string | null> = {
          masjid_id: masjidId,
          date: day.date,
        };
        for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
          const start = day[p] ?? "";
          const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[p];
          const iCell = (batchIqama as unknown as Record<string, BatchCell>)[p];
          const adhanEmpty = aCell.mode === "fixed" && !aCell.fixed;
          const iqamaEmpty = iCell.mode === "fixed" && !iCell.fixed;
          const existingAdhan =
            (day as unknown as Record<string, string>)[`${p}_adhan`] ?? start;
          const adhanTime = adhanEmpty
            ? existingAdhan
            : applyBatchCell(aCell, start);
          if (!adhanEmpty) row[`${p}_adhan`] = adhanTime;
          if (!iqamaEmpty) row[`${p}_iqama`] = applyBatchCell(iCell, adhanTime);
        }
        row.fajr_iqama_2 = jamaatSettings.fajr2
          ? applyBatchCell(batchIqama2.fajr, row.fajr_iqama as string)
          : null;
        row.maghrib_iqama_2 = jamaatSettings.maghrib2
          ? applyBatchCell(batchIqama2.maghrib, row.maghrib_iqama as string)
          : null;
        row.fajr_iqama_3 = jamaatSettings.fajr3
          ? applyBatchCell(
              batchIqama3.fajr,
              (row.fajr_iqama_2 as string) ?? (row.fajr_iqama as string),
            )
          : null;
        row.maghrib_iqama_3 = jamaatSettings.maghrib3
          ? applyBatchCell(
              batchIqama3.maghrib,
              (row.maghrib_iqama_2 as string) ?? (row.maghrib_iqama as string),
            )
          : null;
        const dayOfWeek = new Date(day.date + "T12:00:00").getDay(); // 0=Sun,5=Fri,6=Sat
        if (dayOfWeek === 5) {
          row.jummah_1 = extraTimings.jummahSlots[0]
            ? extraTimings.jummah[0] || null
            : null;
          row.jummah_2 = extraTimings.jummahSlots[1]
            ? extraTimings.jummah[1] || null
            : null;
          row.jummah_3 = extraTimings.jummahSlots[2]
            ? extraTimings.jummah[2] || null
            : null;
        }
        if (extraTimings.weekendIsha.iqama) {
          const dayName =
            dayOfWeek === 5
              ? "fri"
              : dayOfWeek === 6
                ? "sat"
                : dayOfWeek === 0
                  ? "sun"
                  : null;
          if (dayName && extraTimings.weekendIsha.days.includes(dayName)) {
            row.isha_iqama = extraTimings.weekendIsha.iqama;
          }
        }
        upsertRows.push(row);
      }
    }

    if (upsertRows.length === 0) {
      setBatchError("No loaded prayer times in that date range.");
      setApplyingBatch(false);
      return;
    }

    for (let i = 0; i < upsertRows.length; i += 100) {
      const { error } = await supabaseAdmin
        .from("prayer_times")
        .upsert(upsertRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
      if (error) {
        setBatchError("Save failed: " + error.message);
        setApplyingBatch(false);
        return;
      }
    }

    setPrayerTimesByMonth((prev) => {
      const updated = { ...prev };
      for (const [key, days] of Object.entries(prev)) {
        updated[key] = days.map((day) => {
          const match = upsertRows.find((r) => r.date === day.date);
          return match ? { ...day, ...match } : day;
        });
      }
      return updated;
    });

    setApplyingBatch(false);
    setBatchApplied(true);
    setTimeout(() => setBatchApplied(false), 2500);
    showToast(`Applied to ${upsertRows.length} days`);
  };

  const handleConfirmSourceSwitch = async () => {
    if (!pendingSource) return;
    const newSource = pendingSource;
    setPendingSource(null);
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");

    if (masjidId) {
      await supabaseAdmin
        .from("prayer_settings")
        .upsert(
          { masjid_id: masjidId, source: newSource },
          { onConflict: "masjid_id" },
        );
    }

    if (newSource === "excel") {
      if (masjidId)
        await supabaseAdmin
          .from("prayer_times")
          .delete()
          .eq("masjid_id", masjidId);
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
        const rows = times.map(({ sunrise: _s, ...t }) => ({
          masjid_id: masjidId,
          ...t,
          ...addDefaultAdhanIqama(t),
        }));
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabaseAdmin
            .from("prayer_times")
            .upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
          if (error) throw new Error(error.message);
        }
        const grouped: Record<string, PrayerTime[]> = {};
        for (const { sunrise: _s, ...row } of times) {
          const key = row.date.slice(0, 7);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            ...row,
            ...addDefaultAdhanIqama(row),
          } as PrayerTime);
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
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setGeneratingYear(year);
    try {
      const times = generateYearAdhan(prayerSettings, year);
      const rows = times.map(({ sunrise: _s, ...t }) => ({
        masjid_id: masjidId,
        ...t,
        ...addDefaultAdhanIqama(t),
      }));
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabaseAdmin
          .from("prayer_times")
          .upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        if (error) throw new Error(error.message);
      }
      const grouped: Record<string, PrayerTime[]> = {};
      for (const { sunrise: _s, ...row } of times) {
        const key = row.date.slice(0, 7);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          ...row,
          ...addDefaultAdhanIqama(row),
        } as PrayerTime);
      }
      setPrayerTimesByMonth((prev) => ({ ...prev, ...grouped }));
    } catch (err) {
      setUploadError("Failed to generate: " + (err as Error).message);
    } finally {
      setGeneratingYear(null);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const find = (kws: string[]) =>
      headers.find((h) => kws.some((k) => h.toLowerCase().includes(k))) ?? "";
    setColMap({
      date: find(["date"]),
      day: find(["day", "no."]),
      fajr:
        find(["fajr begin", "fajr start", "fajr adhan", "fajr azan"]) ||
        find(["fajr"]),
      dhuhr:
        find(["dhuhr begin", "zuhr begin", "dhuhr start", "zuhr start"]) ||
        find(["dhuhr", "zuhr"]),
      asr: find(["asr begin", "asr start"]) || find(["asr"]),
      maghrib:
        find(["maghrib begin", "maghrib start", "sunset"]) || find(["maghrib"]),
      isha: find(["isha begin", "isha start"]) || find(["isha"]),
      fajr_iqama: find(["fajr iqama", "fajr jamat", "fajr jamaat"]),
      dhuhr_iqama: find([
        "dhuhr iqama",
        "zuhr iqama",
        "dhuhr jamat",
        "zuhr jamat",
      ]),
      asr_iqama: find(["asr iqama", "asr jamat"]),
      maghrib_iqama: find(["maghrib iqama", "maghrib jamat"]),
      isha_iqama: find(["isha iqama", "isha jamat"]),
      jummah1:
        find(["jumah 1", "jummah 1", "1st jum"]) || find(["jumah", "jummah"]),
      jummah2: find(["jumah 2", "jummah 2", "2nd jum"]),
      jummah3: find(["jumah 3", "jummah 3", "3rd jum"]),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheetRows: Record<string, string[][]> = {};
        for (const name of wb.SheetNames) {
          sheetRows[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], {
            header: 1,
            raw: false,
          }) as string[][];
        }
        const firstSheet = wb.SheetNames[0];
        const rows = sheetRows[firstSheet];
        const keywords = [
          "fajr",
          "dhuhr",
          "zuhr",
          "asr",
          "maghrib",
          "isha",
          "date",
          "day",
        ];
        const headerIdx = rows.findIndex((r) =>
          r.some((c) =>
            keywords.some((k) =>
              String(c ?? "")
                .toLowerCase()
                .includes(k),
            ),
          ),
        );
        setXlsxPreview({
          sheets: wb.SheetNames,
          sheetRows,
          selectedSheet: firstSheet,
          headerRowIdx: Math.max(0, headerIdx),
        });
        if (headerIdx >= 0)
          autoMapColumns(rows[headerIdx].map((h) => String(h ?? "").trim()));
      } catch {
        setUploadError("Failed to read file.");
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
      const headers = rows[xlsxPreview.headerRowIdx].map((h) =>
        String(h ?? "").trim(),
      );
      const dataRows = rows
        .slice(xlsxPreview.headerRowIdx + 1)
        .filter((r) => r.some((c) => c !== "" && c != null));
      const ci = (col: string) => (col ? headers.indexOf(col) : -1);
      const cv = (row: string[], col: string) => {
        const i = ci(col);
        return i >= 0 ? String(row[i] ?? "").trim() : "";
      };

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
            const d = new Date(
              Math.round((Number(raw) - 25569) * 86400 * 1000),
            );
            dateStr = d.toISOString().slice(0, 10);
          } else {
            const parsed2 = new Date(raw);
            if (!isNaN(parsed2.getTime()))
              dateStr = parsed2.toISOString().slice(0, 10);
          }
        } else if (colMap.day) {
          const dayNum = parseInt(cv(row, colMap.day));
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
        if (colMap.fajr_iqama) entry.fajr_iqama = cv(row, colMap.fajr_iqama);
        if (colMap.dhuhr_iqama) entry.dhuhr_iqama = cv(row, colMap.dhuhr_iqama);
        if (colMap.asr_iqama) entry.asr_iqama = cv(row, colMap.asr_iqama);
        if (colMap.maghrib_iqama)
          entry.maghrib_iqama = cv(row, colMap.maghrib_iqama);
        if (colMap.isha_iqama) entry.isha_iqama = cv(row, colMap.isha_iqama);
        parsed.push(entry);
      }

      if (parsed.length === 0) {
        setUploadError(
          "No rows could be extracted. Check your column mapping.",
        );
        setIsUploading(false);
        return;
      }

      const jTimes = [colMap.jummah1, colMap.jummah2, colMap.jummah3]
        .map((col) => (col ? cv(dataRows[0], col) : ""))
        .filter(Boolean);
      if (jTimes.length > 0)
        setExtraTimings((prev) => ({ ...prev, jummah: jTimes }));

      const parsedWithDefaults = parsed.map((row) => ({
        ...row,
        ...addDefaultAdhanIqama(row),
      }));
      const masjidId =
        sessionStorage.getItem("masjid_id") ||
        localStorage.getItem("masjid_id");
      if (masjidId) {
        const dbRows = parsedWithDefaults.map((row) => ({
          masjid_id: masjidId,
          ...row,
        }));
        for (let i = 0; i < dbRows.length; i += 100) {
          await supabaseAdmin
            .from("prayer_times")
            .upsert(dbRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
        }
      }
      const grouped: Record<string, PrayerTime[]> = {};
      for (const row of parsedWithDefaults) {
        const key = row.date?.slice(0, 7);
        if (key) {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(row as PrayerTime);
        }
      }
      setPrayerTimesByMonth((prev) => ({ ...prev, ...grouped }));
      const fmtD = (d: string) =>
        new Date(d + "T12:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      setUploadSuccess(
        `${parsed.length} days imported · ${fmtD(parsed[0].date)} – ${fmtD(parsed[parsed.length - 1].date)}`,
      );
      setTimeout(() => setUploadSuccess(""), 4000);
      setXlsxPreview(null);
      setUploadFile(null);
    } catch (err) {
      setUploadError("Import failed: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCell = (date: string, field: string, value: string) => {
    const monthKey = date.slice(0, 7);
    setPrayerTimesByMonth((prev) => ({
      ...prev,
      [monthKey]: prev[monthKey].map((d) =>
        d.date === date ? { ...d, [field]: value } : d,
      ),
    }));
    setScheduleEdited(true);
  };

  const handleSaveSchedule = async () => {
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;
    setSavingSchedule(true);
    const rows = (prayerTimesByMonth[selectedMonth] || []).map((day) => ({
      masjid_id: masjidId,
      ...day,
    }));
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabaseAdmin
        .from("prayer_times")
        .upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
      if (error) {
        setSavingSchedule(false);
        showToast("Failed to save schedule: " + error.message, "error");
        return;
      }
    }
    setSavingSchedule(false);
    setSavedSchedule(true);
    setScheduleEdited(false);
    originalMonthSnapshot.current[selectedMonth] = (
      prayerTimesByMonth[selectedMonth] || []
    ).map((r) => ({ ...r }));
    setTimeout(() => setSavedSchedule(false), 2500);
    showToast(`Prayer schedule saved (${rows.length} days)`);
  };

  const handleDiscardChanges = () => {
    const snap = originalMonthSnapshot.current[selectedMonth];
    if (snap)
      setPrayerTimesByMonth((prev) => ({ ...prev, [selectedMonth]: snap }));
    setScheduleEdited(false);
  };

  const handleEventSubmit = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      showToast("Fill in all required fields", "error");
      return;
    }
    const masjidId =
      sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    const row = {
      masjid_id: masjidId,
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date,
      time: eventForm.time,
      location: null,
    };
    if (editingEvent) {
      const { error } = await supabaseAdmin
        .from("events")
        .update(row)
        .eq("id", editingEvent.id);
      if (error) {
        showToast("Failed to save event: " + error.message, "error");
        return;
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id ? { ...e, ...eventForm } : e,
        ),
      );
    } else {
      const { data, error } = await supabaseAdmin
        .from("events")
        .insert(row)
        .select()
        .single();
      if (error) {
        showToast("Failed to create event: " + error.message, "error");
        return;
      }
      setEvents((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          description: data.description || "",
          date: data.date,
          time: data.time || "",
          endTime: "",
          category: "",
        },
      ]);
    }
    const wasEditing = !!editingEvent;
    setEventsPanel(false);
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      category: "General",
    });
    setEditingEvent(null);
    showToast(wasEditing ? "Event updated" : "Event created");
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
    if (error) {
      showToast("Failed to delete event: " + error.message, "error");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("Event deleted");
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: event.endTime || "",
      category: event.category || "General",
    });
    setEventsPanel(true);
  };

  // Open a blank create form. Also navigates, so Overview can deep-link here.
  const openNewEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      category: "General",
    });
    setEventsPanel(true);
    setActiveTab("events");
  };

  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", body: "", expiresAt: "" });
    setEventsPanel(true);
    setActiveTab("announcements");
  };

  // ── Nav tabs ──────────────────────────────────────────────────────────
  // `short` is used only in the mobile bottom bar, where five labels must fit.
  const navTabs = [
    { id: "overview", name: "Overview", short: "Overview", ms: "dashboard" },
    {
      id: "prayer-times",
      name: "Prayer Times",
      short: "Prayers",
      ms: "schedule",
    },
    { id: "events", name: "Events", short: "Events", ms: "calendar_month" },
    {
      id: "announcements",
      name: "Announcements",
      short: "Notices",
      ms: "campaign",
    },
    { id: "settings", name: "Settings", short: "Settings", ms: "settings" },
  ];

  const navH = 56;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="dashboard-root"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--on-surface)",
        fontFamily: "Manrope, sans-serif",
        ...(!animDone
          ? {
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? "scale(1) translateY(0)"
                : "scale(1.015) translateY(16px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }
          : {}),
      }}
    >
      {/* ── Top Navigation ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--outline-subtle)",
          zIndex: 50,
          height: navH,
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "0 16px" : "0 24px",
          gap: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--surface-mid)",
              border: "1px solid var(--outline-variant)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: "var(--on-surface)" }}
            >
              mosque
            </span>
          </div>
          {!isMobile && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--on-surface)",
              }}
            >
              {generalSettings.masjidName}
            </div>
          )}
        </div>

        {/* Tabs — hidden on mobile (bottom bar used instead) */}
        {!isMobile && (
          <div
            data-tour="nav-tabs"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tour={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 20px",
                    height: 56,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: isActive ? "var(--accent)" : "var(--text-phantom)",
                      fontWeight: isActive ? 700 : 500,
                      borderBottom: isActive
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                      paddingBottom: 2,
                      transition: "all 0.12s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--text-dim)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--text-phantom)";
                    }}
                  >
                    {tab.name}
                  </span>
                  {!seenTabs.has(tab.id) && !isActive && (
                    <div style={{
                      position: "absolute",
                      top: 11,
                      right: 10,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#34d399",
                      animation: "beacon-pulse 2s ease-in-out infinite",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Right side: tour + theme toggle + sign out */}
        <div
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            data-tour="tour-btn"
            onClick={() => setShowTutorial(true)}
            title="Take the tour"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              border: "1px solid var(--outline-subtle)",
              background: "transparent",
              color: "var(--text-phantom)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-variant)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-subtle)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-phantom)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              help
            </span>
          </button>
          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              border: "1px solid var(--outline-subtle)",
              background: "transparent",
              color: "var(--text-phantom)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-variant)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-subtle)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-phantom)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 2,
              border: "1px solid var(--outline-subtle)",
              background: "transparent",
              color: "var(--text-phantom)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-variant)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-faint)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--outline-subtle)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-phantom)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14 }}
            >
              logout
            </span>
            {!isMobile && "Sign out"}
          </button>
        </div>
      </nav>

      {/* ── Bottom Tab Bar (mobile only) ── */}
      {isMobile && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--nav-bg)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid var(--outline-subtle)",
            display: "flex",
            height: 60,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 22,
                    color: isActive ? "var(--accent)" : "var(--text-phantom)",
                  }}
                >
                  {tab.ms}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--accent)" : "var(--text-phantom)",
                    fontFamily: "Manrope, sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.short}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Main Content ── */}
      <div
        data-tab-content=""
        style={{
          paddingTop: navH,
          paddingBottom: isMobile ? 60 : 0,
          minHeight: "100vh",
          overflowX: isMobile ? "hidden" : undefined,
        }}
      >
        {activeTab === "overview" && (
          <OverviewTab
            theme={theme}
            currentTime={currentTime}
            generalSettings={generalSettings}
            todayRow={todayRow}
            events={events}
            announcements={announcements}
            prayerTimesByMonth={prayerTimesByMonth}
            prayerSource={prayerSource}
            setActiveTab={setActiveTab}
            openNewEvent={openNewEvent}
            openNewAnnouncement={openNewAnnouncement}
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

        {(activeTab === "events" || activeTab === "announcements") && (
          <EventsTab
            theme={theme}
            events={events}
            eventsLoading={eventsLoading}
            eventsSubTab={eventsSubTab}
            openNewEvent={openNewEvent}
            openNewAnnouncement={openNewAnnouncement}
            showToast={showToast}
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
            registeredEmail={registeredEmail}
            generalSettings={generalSettings}
            setGeneralSettings={setGeneralSettings}
            settingsSaved={settingsSaved}
            savedGeneralSettings={savedGeneralSettings}
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
            presetsSaved={presetsSaved}
            savedPrayerPresets={savedPrayerPresets}
            savedMonthPresetMap={savedMonthPresetMap}
            handleCancelPresets={handleCancelPresets}
            handleSavePresetsOnly={handleSavePresetsOnly}
            handleSavePresetsAndRegen={handleConfirmPresetRegen}
            hasGeneratedMonths={hasGeneratedMonths}
            extraTimings={extraTimings}
            setExtraTimings={setExtraTimings}
          />
        )}
      </div>

      {/* ── Preset regen confirmation modal ── */}
      {presetRegenConfirm &&
        (() => {
          const generatedMonths = Object.keys(prayerTimesByMonth).sort();
          const first = generatedMonths[0];
          const last = generatedMonths[generatedMonths.length - 1];
          const fmt = (m: string) =>
            new Date(m + "-01T12:00:00").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                backdropFilter: "blur(4px)",
                backgroundColor: "rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 380,
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "24px 24px 20px",
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: "#c6c6c7" }}
                    >
                      refresh
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#c6c6c7",
                      marginBottom: 8,
                    }}
                  >
                    Regenerate prayer times?
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#5a5a5a", lineHeight: 1.6 }}
                  >
                    This will recalculate adhan times for{" "}
                    <strong style={{ color: "#acabaa" }}>
                      {generatedMonths.length} month
                      {generatedMonths.length !== 1 ? "s" : ""}
                    </strong>{" "}
                    ({fmt(first)} – {fmt(last)}) using the new preset settings.
                    Iqama times will be preserved.
                  </div>
                </div>
                <div style={{ padding: "16px 24px", display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      setPresetRegenConfirm(false);
                      doSavePresets();
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 2,
                      color: "#acabaa",
                      fontFamily: "Manrope, sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Save only
                  </button>
                  <button
                    onClick={handleConfirmPresetRegen}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#c6c6c7",
                      border: "1px solid #c6c6c7",
                      borderRadius: 2,
                      color: "#0e0e0e",
                      fontFamily: "Manrope, sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Save &amp; Regenerate
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Regen in progress overlay ── */}
      {regenInProgress && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: "#c6c6c7",
                animation: "spin 1s linear infinite",
              }}
            >
              progress_activity
            </span>
            <div style={{ color: "#acabaa", fontWeight: 600, fontSize: 13 }}>
              Regenerating prayer times…
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes beacon-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.7); }
          70%  { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
      `}</style>

      {/* ── Tutorial overlay ── */}
      {showTutorial && (
        <TutorialOverlay onClose={handleCloseTutorial} setActiveTab={setActiveTab} />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
};

export default Dashboard;
