import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "../lib/supabase";
import { generateYearPrayerTimes } from "../lib/prayerTimes";

// ── Types ─────────────────────────────────────────────────────────────────
interface PrayerTime {
  date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string;
  fajr_adhan?: string; fajr_iqama?: string;
  dhuhr_adhan?: string; dhuhr_iqama?: string;
  asr_adhan?: string; asr_iqama?: string;
  maghrib_adhan?: string; maghrib_iqama?: string; maghrib_iqama_2?: string; maghrib_iqama_3?: string;
  isha_adhan?: string; isha_iqama?: string;
  fajr_iqama_2?: string; fajr_iqama_3?: string;
  jummah_1?: string; jummah_2?: string; jummah_3?: string;
}
interface Event { id: number; title: string; description: string; date: string; time: string; }
interface EventForm { title: string; description: string; date: string; time: string; }
interface NotificationForm { type: string; title: string; message: string; }
interface Question { id: number; name: string; email: string; question: string; date: string; answered: boolean; answer?: string; }
interface Month { value: string; label: string; }
interface BatchCell { mode: "offset" | "fixed"; offset: number; fixed: string; }
interface BatchCell2 extends BatchCell { enabled: boolean; }
interface BatchConfig { fajr: BatchCell; dhuhr: BatchCell; asr: BatchCell; maghrib: BatchCell; isha: BatchCell; }

// ── Themes ────────────────────────────────────────────────────────────────
const THEMES = {
  emerald: {
    name: "Emerald", hex: "#34d399",
    navBorder: "border-emerald-900/40",
    sidebarActive: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
    dot: "bg-emerald-400",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/20",
    accentBorder: "border-emerald-500/40",
    accentBadge: "bg-emerald-500/15 border-emerald-500/30",
    btn: "bg-emerald-500 hover:bg-emerald-400 text-black",
    subtleBtn: "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400",
    label: "text-emerald-500",
    nextCard: "bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-500/30",
    inputFocus: "focus:border-emerald-500",
    iconBg: "bg-emerald-500/15 border border-emerald-500/30",
    iconColor: "text-emerald-400",
    patternColor: "#34d399",
  },
  amber: {
    name: "Gold", hex: "#f59e0b",
    navBorder: "border-amber-900/40",
    sidebarActive: "bg-amber-500/20 border border-amber-500/40 text-amber-400",
    dot: "bg-amber-400",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/20",
    accentBorder: "border-amber-500/40",
    accentBadge: "bg-amber-500/15 border-amber-500/30",
    btn: "bg-amber-500 hover:bg-amber-400 text-black",
    subtleBtn: "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400",
    label: "text-amber-500",
    nextCard: "bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/30",
    inputFocus: "focus:border-amber-500",
    iconBg: "bg-amber-500/15 border border-amber-500/30",
    iconColor: "text-amber-400",
    patternColor: "#f59e0b",
  },
  sky: {
    name: "Ocean", hex: "#38bdf8",
    navBorder: "border-sky-900/40",
    sidebarActive: "bg-sky-500/20 border border-sky-500/40 text-sky-400",
    dot: "bg-sky-400",
    accent: "text-sky-400",
    accentBg: "bg-sky-500/20",
    accentBorder: "border-sky-500/40",
    accentBadge: "bg-sky-500/15 border-sky-500/30",
    btn: "bg-sky-500 hover:bg-sky-400 text-black",
    subtleBtn: "bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400",
    label: "text-sky-500",
    nextCard: "bg-sky-500/20 border-sky-500/60 ring-2 ring-sky-500/30",
    inputFocus: "focus:border-sky-500",
    iconBg: "bg-sky-500/15 border border-sky-500/30",
    iconColor: "text-sky-400",
    patternColor: "#38bdf8",
  },
  violet: {
    name: "Royal", hex: "#a78bfa",
    navBorder: "border-violet-900/40",
    sidebarActive: "bg-violet-500/20 border border-violet-500/40 text-violet-400",
    dot: "bg-violet-400",
    accent: "text-violet-400",
    accentBg: "bg-violet-500/20",
    accentBorder: "border-violet-500/40",
    accentBadge: "bg-violet-500/15 border-violet-500/30",
    btn: "bg-violet-500 hover:bg-violet-400 text-white",
    subtleBtn: "bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400",
    label: "text-violet-500",
    nextCard: "bg-violet-500/20 border-violet-500/60 ring-2 ring-violet-500/30",
    inputFocus: "focus:border-violet-500",
    iconBg: "bg-violet-500/15 border border-violet-500/30",
    iconColor: "text-violet-400",
    patternColor: "#a78bfa",
  },
  rose: {
    name: "Ruby", hex: "#fb7185",
    navBorder: "border-rose-900/40",
    sidebarActive: "bg-rose-500/20 border border-rose-500/40 text-rose-400",
    dot: "bg-rose-400",
    accent: "text-rose-400",
    accentBg: "bg-rose-500/20",
    accentBorder: "border-rose-500/40",
    accentBadge: "bg-rose-500/15 border-rose-500/30",
    btn: "bg-rose-500 hover:bg-rose-400 text-white",
    subtleBtn: "bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400",
    label: "text-rose-500",
    nextCard: "bg-rose-500/20 border-rose-500/60 ring-2 ring-rose-500/30",
    inputFocus: "focus:border-rose-500",
    iconBg: "bg-rose-500/15 border border-rose-500/30",
    iconColor: "text-rose-400",
    patternColor: "#fb7185",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ── SVG helpers ───────────────────────────────────────────────────────────
const IslamicPattern = ({ color = "#34d399", opacity = 0.04 }: { color?: string; opacity?: number }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <defs>
      <pattern id="islamic-dash" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={color} strokeWidth="0.8">
          <polygon points="40,4 52,16 52,36 40,48 28,36 28,16" />
          <polygon points="40,4 76,22 76,58 40,76 4,58 4,22" />
          <line x1="40" y1="4" x2="40" y2="76" />
          <line x1="4" y1="22" x2="76" y2="58" />
          <line x1="4" y1="58" x2="76" y2="22" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-dash)" />
  </svg>
);

const CrescentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
  </svg>
);

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

// ── Prayer method options (for PHP backend) ───────────────────────────────
const CALC_METHODS = [
  { value: "ISNA",     label: "ISNA – Islamic Society of North America",   fajr: 15,   isha: 15 },
  { value: "MWL",      label: "MWL – Muslim World League",                 fajr: 18,   isha: 17 },
  { value: "Egyptian", label: "Egyptian – Egyptian General Authority",      fajr: 19.5, isha: 17.5 },
  { value: "Makkah",   label: "Makkah – Umm Al-Qura University",           fajr: 18.5, isha: 0 },
  { value: "Karachi",  label: "Karachi – Univ. of Islamic Sciences",       fajr: 18,   isha: 18 },
  { value: "Tehran",   label: "Tehran – Geophysics Research Institute",     fajr: 17.7, isha: 14 },
  { value: "Jafari",   label: "Jafari – Shia Ithna-Ashari (Qum)",         fajr: 16,   isha: 14 },
  { value: "Custom",   label: "Custom – Define your own angles",            fajr: 0,    isha: 0 },
];

const TIMEZONES = [
  "America/Toronto", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Vancouver", "Europe/London", "Europe/Istanbul",
  "Asia/Karachi", "Asia/Dubai", "Asia/Riyadh", "Asia/Dhaka", "Africa/Cairo",
  "Australia/Sydney",
];

// ── Module-level helpers ──────────────────────────────────────────────────
function makeBatchCell(offset: number): BatchCell { return { mode: "offset", offset, fixed: "" }; }
function makeDefaultBatchAdhan(): BatchConfig {
  return { fajr: makeBatchCell(0), dhuhr: makeBatchCell(0), asr: makeBatchCell(0), maghrib: makeBatchCell(0), isha: makeBatchCell(0) };
}
function makeDefaultBatchIqama(): BatchConfig {
  return { fajr: makeBatchCell(30), dhuhr: makeBatchCell(30), asr: makeBatchCell(30), maghrib: makeBatchCell(3), isha: makeBatchCell(30) };
}
function applyBatchCell(cell: BatchCell, base: string): string {
  if (!base || base === "—") return "—";
  if (cell.mode === "fixed" && cell.fixed) return formatTimeInput(cell.fixed);
  return addMinsToTime(base, cell.offset);
}
function addDefaultAdhanIqama(row: { date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
    const start = row[p] ?? "";
    const adhan = start; // 0 min offset
    out[`${p}_adhan`] = adhan;
    out[`${p}_iqama`] = addMinsToTime(adhan, p === "maghrib" ? 3 : 30);
  }
  return out;
}
function addMinsToTime(timeStr: string, mins: number): string {
  if (!timeStr || timeStr === "—") return "–";
  let totalH: number, totalM: number;
  const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) { totalH = parseInt(m24[1]); totalM = parseInt(m24[2]); }
  else {
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let h = parseInt(match[1]);
    const p = match[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    totalH = h; totalM = parseInt(match[2]);
  }
  const total = totalH * 60 + totalM + mins;
  const nh = Math.floor(total / 60) % 24, nm = total % 60;
  const np = nh >= 12 ? "PM" : "AM";
  const dh = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
  return `${dh}:${String(nm).padStart(2, "0")} ${np}`;
}
// ── Time helpers ──────────────────────────────────────────────────────────
function to12h(timeStr: string): string {
  if (!timeStr || timeStr === "—") return timeStr;
  const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = parseInt(m24[1]);
    const min = m24[2];
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${min} ${period}`;
  }
  return timeStr;
}

function formatTimeInput(val: string): string {
  const clean = val.trim();
  if (!clean) return "";
  // Already "h:mm AM/PM"
  const mFull = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (mFull) return `${parseInt(mFull[1])}:${mFull[2].padStart(2, "0")} ${mFull[3].toUpperCase()}`;
  // "h:mmam" or "hhmm am/pm"
  const mAmPm = clean.match(/^(\d{1,2}):?(\d{2})\s*(am|pm)$/i);
  if (mAmPm) {
    let h = parseInt(mAmPm[1]); const m = mAmPm[2]; const p = mAmPm[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${h >= 12 ? "PM" : "AM"}`;
  }
  // "h:mm" 24h or ambiguous
  const m24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1]); const m = m24[2];
    const period = h >= 12 ? "PM" : "AM";
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${period}`;
  }
  // Compact "630" or "0630"
  const mCompact = clean.match(/^(\d{3,4})$/);
  if (mCompact) {
    const s = mCompact[1].padStart(4, "0");
    const h = parseInt(s.slice(0, 2)); const m = s.slice(2);
    const period = h >= 12 ? "PM" : "AM";
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${period}`;
  }
  return val;
}

// ── Dashboard Component ───────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // ── Theme ──────────────────────────────────────────────────────────────
  const [themeName, setThemeName] = useState<ThemeKey>(() => {
    return (localStorage.getItem("masjid_theme") as ThemeKey) || "emerald";
  });
  const theme = THEMES[themeName];

  useEffect(() => {
    localStorage.setItem("masjid_theme", themeName);
  }, [themeName]);

  // ── Core state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [settingsTab, setSettingsTab] = useState<string>("general");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const storedName = sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name") || "Toronto Hifz Academy";

  // ── General settings ──────────────────────────────────────────────────
  const [generalSettings, setGeneralSettings] = useState({
    masjidName: storedName,
    phone: "(416) 555-0194",
    email: "info@torontohifz.ca",
    address: "123 Islington Ave, Toronto, ON M9A 1A1",
    website: "www.torontohifz.ca",
    subdomain: "torontohifz",
    instagram: "@torontohifz",
    facebook: "torontohifzacademy",
    twitter: "@torontohifz",
    youtube: "TorontoHifzAcademy",
    whatsapp: "+1 416-555-0194",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Prayer settings ───────────────────────────────────────────────────
  const [prayerSettings, setPrayerSettings] = useState({
    city: "Toronto",
    country: "Canada",
    latitude: "43.651070",
    longitude: "-79.347015",
    elevation: "76",
    timezone: "America/Toronto",
    method: "ISNA",
    asrMethod: "Standard",
    higherLatRule: "AngleBased",
    midnightMode: "Standard",
    fajrAdjust: "0",
    dhuhrAdjust: "0",
    asrAdjust: "0",
    maghribAdjust: "0",
    ishaAdjust: "0",
    sunriseAdjust: "0",
    customFajrAngle: "15",
    customIshaAngle: "15",
    imsakMinutes: "10",
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
  const [importMonth, setImportMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const defaultExtra = { fajr: [] as string[], maghrib: [] as string[], jummah: ["1:15 PM"] };
  const [extraTimings, setExtraTimings] = useState<{ fajr: string[]; maghrib: string[]; jummah: string[] }>(defaultExtra);
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
  const [events, setEvents] = useState<Event[]>([
    { id: 1, title: "Friday Khutbah", description: "Special lecture on Islamic finance", date: "2026-03-08", time: "13:00" },
    { id: 2, title: "Hifz Graduation Ceremony", description: "Annual graduation for our Huffaz students", date: "2026-03-15", time: "18:00" },
    { id: 3, title: "Tajweed Workshop", description: "Workshop with Sheikh Yusuf on advanced Tajweed rules", date: "2026-03-22", time: "14:00" },
  ]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", description: "", date: "", time: "" });

  // ── Notifications state ───────────────────────────────────────────────
  const [notificationForm, setNotificationForm] = useState<NotificationForm>({ type: "general", title: "", message: "" });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  // ── Questions state ───────────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, name: "Ahmed Hassan",    email: "ahmed@email.com",   question: "What time is Fajr this Friday?",                              date: "2026-03-05", answered: false },
    { id: 2, name: "Fatima Al-Rashid",email: "fatima@email.com",  question: "Is there a Quran class for sisters on weekday evenings?",     date: "2026-03-04", answered: false },
    { id: 3, name: "Omar Siddiqui",   email: "omar@email.com",    question: "Can I register my child for the Hifz program?",              date: "2026-03-03", answered: true,  answer: "Yes, registration is open until March 15. Please contact us at info@torontohifz.ca" },
    { id: 4, name: "Yusuf Malik",     email: "yusuf@email.com",   question: "What is the procedure for conducting a Nikah at the masjid?", date: "2026-03-02", answered: false },
    { id: 5, name: "Aisha Benali",    email: "aisha@email.com",   question: "Are there Tajweed classes available on weekends?",            date: "2026-03-01", answered: false },
  ]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(1);
  const [replyText, setReplyText] = useState("");
  const [questionsFilter, setQuestionsFilter] = useState<"all" | "unanswered" | "answered">("unanswered");

  // ── Derived ───────────────────────────────────────────────────────────
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter((e) => new Date(e.date) > currentTime).length,
    subscribedUsers: 1234,
    notificationsSent: 89,
  };

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
  const fmt = (t?: string) => t ? to12h(t) : "—";
  const todayPrayers = [
    { name: "Fajr",    time: fmt(todayRow?.fajr),    arabic: "الفجر" },
    { name: "Dhuhr",   time: fmt(todayRow?.dhuhr),   arabic: "الظهر" },
    { name: "Asr",     time: fmt(todayRow?.asr),     arabic: "العصر" },
    { name: "Maghrib", time: fmt(todayRow?.maghrib), arabic: "المغرب" },
    { name: "Isha",    time: fmt(todayRow?.isha),    arabic: "العشاء" },
  ];

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
    const t2 = setTimeout(() => setAnimDone(true), 650); // after transition finishes
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
        }
        setPrayerLoading(false);
      });
  }, [selectedYear]);

  // ── Sync selectedMonth when year changes (preserve same month number) ──
  useEffect(() => {
    const monthNum = selectedMonth.slice(5, 7);
    setSelectedMonth(`${selectedYear}-${monthNum}`);
  }, [selectedYear]);

  // ── Load prayer settings (extra_timings + times_source) from Supabase ──
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
        prayerSourceLoaded.current = true;
      });
  }, []);


  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

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
        // 2nd & 3rd jamaat for fajr and maghrib
        row.fajr_iqama_2    = jamaatSettings.fajr2    ? applyBatchCell(batchIqama2.fajr,    row.fajr_iqama as string)    : null;
        row.maghrib_iqama_2 = jamaatSettings.maghrib2 ? applyBatchCell(batchIqama2.maghrib, row.maghrib_iqama as string) : null;
        row.fajr_iqama_3    = jamaatSettings.fajr3    ? applyBatchCell(batchIqama3.fajr,    row.fajr_iqama_2 as string ?? row.fajr_iqama as string)    : null;
        row.maghrib_iqama_3 = jamaatSettings.maghrib3 ? applyBatchCell(batchIqama3.maghrib, row.maghrib_iqama_2 as string ?? row.maghrib_iqama as string) : null;
        // Jummah times — only for Fridays
        if (new Date(day.date + "T12:00:00").getDay() === 5) {
          row.jummah_1 = extraTimings.jummah[0] || null;
          row.jummah_2 = extraTimings.jummah[1] || null;
          row.jummah_3 = extraTimings.jummah[2] || null;
        }
        upsertRows.push(row);
      }
    }

    if (upsertRows.length === 0) { setBatchError("No loaded prayer times in that date range."); setApplyingBatch(false); return; }

    for (let i = 0; i < upsertRows.length; i += 100) {
      const { error } = await supabaseAdmin.from("prayer_times").upsert(upsertRows.slice(i, i + 100), { onConflict: "masjid_id,date" });
      if (error) { setBatchError("Save failed: " + error.message); setApplyingBatch(false); return; }
    }

    // Update local state
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

    // Persist the new source to DB immediately
    if (masjidId) {
      await supabaseAdmin.from("prayer_settings").upsert({ masjid_id: masjidId, times_source: newSource }, { onConflict: "masjid_id" });
    }

    if (newSource === "excel") {
      // Delete all prayer times from DB and clear state
      if (masjidId) await supabaseAdmin.from("prayer_times").delete().eq("masjid_id", masjidId);
      setPrayerTimesByMonth({});
      setPrayerSource("excel");
    } else {
      // Switch to auto: regenerate full year from prayer settings
      setPrayerSource("backend");
      if (!masjidId) return;
      setSwitchLoading(true);
      setUploadError("");
      try {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prayerSettings.city + ", " + prayerSettings.country)}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const geoData = await geo.json();
        if (!geoData || geoData.length === 0) throw new Error("Could not geocode city. Update city/country in Settings.");
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        const year = new Date().getFullYear();
        const times = generateYearPrayerTimes(lat, lng, prayerSettings.timezone, prayerSettings.method, year);
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
        setUploadSuccess(`Prayer times auto-calculated for all of ${year}.`);
        setTimeout(() => setUploadSuccess(""), 4000);
      } catch (err) {
        setUploadError("Failed to regenerate: " + (err as Error).message);
      } finally {
        setSwitchLoading(false);
      }
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const find = (kws: string[]) => {
      const h = headers.find(h => kws.some(k => h.toLowerCase().includes(k))) ?? "";
      return h;
    };
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
          // Try ISO date, Excel serial, or "DD/MM/YYYY" etc.
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            dateStr = raw;
          } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(raw)) {
            const parts = raw.split(/[\/\-]/);
            dateStr = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          } else if (!isNaN(Number(raw)) && Number(raw) > 40000) {
            // Excel serial date
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

      // Extract Jummah from first Friday row or first data row
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

  const handleUploadPrayerTimes = handleConfirmImport;

  const handleEditStartTime = (dayIdx: number, field: keyof PrayerTime, value: string) => {
    setPrayerTimesByMonth(prev => ({
      ...prev,
      [selectedMonth]: prev[selectedMonth].map((day, i) =>
        i === dayIdx ? { ...day, [field]: value } : day
      ),
    }));
  };

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(false);
  const [scheduleEdited, setScheduleEdited] = useState(false);

  const handleEditCell = (date: string, field: string, value: string) => {
    const monthKey = date.slice(0, 7);
    setPrayerTimesByMonth(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].map(d => d.date === date ? { ...d, [field]: value } : d),
    }));
    setScheduleEdited(true);
  };

  const handleFormatCell = (date: string, field: string, value: string) => {
    const formatted = formatTimeInput(value);
    if (formatted !== value) {
      const monthKey = date.slice(0, 7);
      setPrayerTimesByMonth(prev => ({
        ...prev,
        [monthKey]: prev[monthKey].map(d => d.date === date ? { ...d, [field]: formatted } : d),
      }));
    }
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
    setTimeout(() => setSavedSchedule(false), 2500);
  };


  const handleEventSubmit = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) { alert("Fill in all required fields"); return; }
    if (editingEvent) setEvents(events.map((e) => e.id === editingEvent.id ? { ...e, ...eventForm } : e));
    else setEvents([...events, { id: Date.now(), ...eventForm }]);
    setShowEventModal(false); setEventForm({ title: "", description: "", date: "", time: "" }); setEditingEvent(null);
  };

  const handleDeleteEvent = (id: number) => { if (confirm("Delete this event?")) setEvents(events.filter((e) => e.id !== id)); };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event); setEventForm({ title: event.title, description: event.description, date: event.date, time: event.time }); setShowEventModal(true);
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) { alert("Fill in all fields"); return; }
    setIsSendingNotification(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSendingNotification(false); setNotifSent(true);
    setNotificationForm({ type: "general", title: "", message: "" });
    setTimeout(() => setNotifSent(false), 4000);
  };

  const sidebarTabs = [
    { id: "overview",      name: "Overview",       icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "prayer-times",  name: "Prayer Times",   icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "events",        name: "Events",          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "notifications", name: "Notifications",   icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { id: "questions",     name: "Questions",       icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { id: "settings",      name: "Settings",        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  // ── Shared input class ────────────────────────────────────────────────
  const inputCls = `w-full px-4 py-3 bg-black/40 border-2 border-white/10 ${theme.inputFocus} rounded-xl text-white font-medium outline-none placeholder-zinc-600 transition-all`;
  const selectCls = `w-full px-4 py-3 bg-black/40 border-2 border-white/10 ${theme.inputFocus} rounded-xl text-white font-medium outline-none transition-all`;
  const labelCls = `block text-xs text-zinc-500 font-black uppercase tracking-widest mb-2`;

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
            <a href="/site" target="_blank" className={`px-4 py-2 ${theme.subtleBtn} rounded-lg font-bold text-sm transition-all`}>
              View Public Site
            </a>
            <button onClick={handleLogout} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-bold text-sm transition-all">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Sidebar ── */}
      <div className={`fixed left-0 top-[73px] h-[calc(100vh-73px)] ${sidebarCollapsed ? "w-16" : "w-64"} bg-zinc-950 border-r border-white/5 z-40 transition-all duration-200 overflow-hidden`}>
        <div className="relative h-full">
          <IslamicPattern color={theme.patternColor} opacity={0.03} />
          <div className="relative p-3 space-y-1 h-full flex flex-col">

            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="w-full flex items-center justify-center p-2.5 mb-1 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent transition-all"
            >
              <Icon
                d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
                className="w-4 h-4"
              />
            </button>

            {!sidebarCollapsed && (
              <div className="text-xs text-zinc-600 font-black uppercase tracking-widest px-4 mb-2">Navigation</div>
            )}

            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={sidebarCollapsed ? tab.name : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all ${sidebarCollapsed ? "justify-center" : ""} ${
                  activeTab === tab.id
                    ? theme.sidebarActive
                    : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon d={tab.icon} className={`w-5 h-5 shrink-0 ${activeTab === tab.id ? theme.iconColor : ""}`} />
                {!sidebarCollapsed && tab.name}
                {!sidebarCollapsed && activeTab === tab.id && <div className={`ml-auto w-1.5 h-1.5 ${theme.dot} rounded-full`} />}
              </button>
            ))}

            {!sidebarCollapsed && (
              <>
                <div className="pt-6 mt-4 border-t border-white/5">
                  <div className="text-xs text-zinc-600 font-black uppercase tracking-widest px-4 mb-3">Quick Stats</div>
                  <div className="px-4 space-y-3">
                    {[
                      { label: "Subscribers", value: stats.subscribedUsers.toLocaleString(), col: theme.accent },
                      { label: "Events", value: stats.totalEvents, col: "text-sky-400" },
                      { label: "Unanswered", value: questions.filter(q => !q.answered).length, col: "text-rose-400" },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500 font-bold">{s.label}</span>
                        <span className={`text-sm font-black ${s.col}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <div className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                    <span className="font-bold">{theme.name} Theme</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className={`${sidebarCollapsed ? "ml-16" : "ml-64"} pt-[73px] pb-12 min-h-screen transition-all duration-200`}>

        {/* ════════ OVERVIEW ════════ */}
        {activeTab === "overview" && (
          <div className="relative">
            <IslamicPattern color={theme.patternColor} opacity={0.025} />
            <div className="relative px-8 py-10">
              <div className="mb-10">
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Dashboard</div>
                <h1 className="text-4xl font-black mb-2">
                  Welcome back, <span className={theme.accent}>{generalSettings.masjidName.split(" ")[0]}</span>
                </h1>
                <p className="text-zinc-400 text-lg">
                  {currentTime.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-5 mb-8">
                {[
                  { label: "Total Events",      value: stats.totalEvents,                   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", col: theme.iconBg, txt: theme.iconColor },
                  { label: "Upcoming Events",   value: stats.upcomingEvents,                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",                                              col: "bg-sky-500/15 border border-sky-500/30",    txt: "text-sky-400" },
                  { label: "Subscribers",       value: stats.subscribedUsers.toLocaleString(), icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", col: "bg-violet-500/15 border border-violet-500/30", txt: "text-violet-400" },
                  { label: "Notifications Sent", value: stats.notificationsSent,             icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", col: "bg-amber-500/15 border border-amber-500/30",  txt: "text-amber-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${s.col}`}>
                      <Icon d={s.icon} className={`w-5 h-5 ${s.txt}`} />
                    </div>
                    <div className="text-3xl font-black mb-1">{s.value}</div>
                    <div className="text-sm font-bold text-zinc-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Today's prayer times */}
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.label}`}>Today</div>
                    <h2 className="text-2xl font-black">Prayer Times</h2>
                  </div>
                  <button onClick={() => setActiveTab("prayer-times")} className={`text-sm font-bold transition-colors ${theme.accent} hover:opacity-70`}>
                    Manage →
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {todayPrayers.map((p, i) => (
                    <div key={p.name} className={`text-center p-4 rounded-xl border transition-all ${i === 3 ? theme.nextCard : "bg-zinc-800/40 border-white/5"}`}>
                      {i === 3 && <div className={`text-xs font-black mb-1 uppercase tracking-wider ${theme.accent}`}>Next</div>}
                      <div className="text-lg mb-1 text-zinc-500" style={{ fontFamily: "serif" }}>{p.arabic}</div>
                      <div className={`text-xs font-bold mb-2 ${i === 3 ? theme.accent : "text-zinc-400"}`}>{p.name}</div>
                      <div className={`text-lg font-black tabular-nums ${i === 3 ? "text-white" : "text-zinc-200"}`}>{p.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming events */}
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.label}`}>Schedule</div>
                    <h2 className="text-2xl font-black">Upcoming Events</h2>
                  </div>
                  <button onClick={() => setActiveTab("events")} className={`text-sm font-bold transition-colors ${theme.accent} hover:opacity-70`}>View All →</button>
                </div>
                <div className="space-y-3">
                  {events.slice(0, 3).map((ev) => (
                    <div key={ev.id} className={`flex items-center gap-5 p-4 bg-zinc-800/40 border border-white/5 rounded-xl hover:border-white/10 transition-all group`}>
                      <div className={`w-14 h-14 ${theme.iconBg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
                        <div className={`text-xs font-black uppercase ${theme.iconColor}`}>{ev.date.split("-")[1] === "03" ? "MAR" : ev.date.split("-")[1] === "04" ? "APR" : "MON"}</div>
                        <div className="text-white text-xl font-black leading-none">{ev.date.split("-")[2]}</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-black mb-0.5">{ev.title}</div>
                        <div className="text-zinc-500 text-sm">{ev.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ PRAYER TIMES ════════ */}
        {activeTab === "prayer-times" && (() => {
          const PRAYER_META = [
            { key: "fajr" as keyof PrayerTime,    label: "Fajr",    arabic: "الفجر" },
            { key: "dhuhr" as keyof PrayerTime,   label: "Dhuhr",   arabic: "الظهر" },
            { key: "asr" as keyof PrayerTime,     label: "Asr",     arabic: "العصر" },
            { key: "maghrib" as keyof PrayerTime, label: "Maghrib", arabic: "المغرب" },
            { key: "isha" as keyof PrayerTime,    label: "Isha",    arabic: "العشاء" },
          ];
          const sampleDay = prayerTimesByMonth[selectedMonth]?.[0];

          return (
          <div className="px-8 py-10">

            {/* ── Header ── */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Management</div>
                <h1 className="text-4xl font-black">Prayer Times</h1>
              </div>
              <div className="flex items-center bg-zinc-900/60 border border-white/8 rounded-xl p-1 gap-1 mb-1">
                {([{ k: "backend" as const, label: "Auto-calculate" }, { k: "excel" as const, label: "Upload Excel" }]).map(opt => (
                  <button key={opt.k}
                    onClick={() => opt.k !== prayerSource && setPendingSource(opt.k)}
                    className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${
                      prayerSource === opt.k ? `${theme.accentBg} ${theme.accent}` : "text-zinc-500 hover:text-white"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Today's Prayer Times ── */}
            {(() => {
              return (
                <div className="rounded-2xl bg-zinc-900/60 border border-white/5 mb-5 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${theme.label}`}>Today</div>
                      <div className="text-base font-black text-white">
                        {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600 font-bold">
                      {todayRow ? "" : "No times loaded"}
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-5 gap-3">
                    {PRAYER_META.map((p) => {
                      const row = todayRow as unknown as Record<string,string> | undefined;
                      const adhanT = row ? (row[`${p.key}_adhan`] || row[p.key] || "—") : "—";
                      const iqamaT = row ? (row[`${p.key}_iqama`] || "—") : "—";
                      return (
                        <div key={p.key} className="relative bg-zinc-800/60 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                          {/* Header */}
                          <div className="flex flex-col items-center pt-5 pb-4 px-4 border-b border-white/5">
                            <div className={`text-xl mb-1`} style={{ fontFamily: "serif", color: "inherit" }}>
                              <span className={theme.accent}>{p.arabic}</span>
                            </div>
                            <div className="font-black text-white text-2xl tracking-tight">{p.label}</div>
                          </div>
                          {/* Times */}
                          <div className="grid grid-cols-2 divide-x divide-white/5 flex-1">
                            {[
                              { label: "Adhan", val: to12h(adhanT) },
                              { label: "Iqama", val: to12h(iqamaT) },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex flex-col items-center justify-center py-5 px-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">{label}</div>
                                <div className={`text-xl font-black tabular-nums text-center ${theme.accent}`}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Adhan & Iqama Schedule ── */}
            {(() => {
              const renderControl = (cell: BatchCell, onUpdate: (p: Partial<BatchCell>) => void, placeholder = "6:00 AM") => (
                <div className="space-y-1.5">
                  <div className="flex rounded-md overflow-hidden border border-white/8 w-fit text-[10px] font-black">
                    {([{ v: "offset", label: "+Min" }, { v: "fixed", label: "Fixed" }] as const).map(m => (
                      <button key={m.v} onClick={() => onUpdate({ mode: m.v })}
                        className={`px-2 py-0.5 transition-all ${cell.mode === m.v ? `${theme.accentBg} ${theme.accent}` : "text-zinc-600 hover:text-zinc-300 bg-zinc-800/60"}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {cell.mode === "offset" ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdate({ offset: Math.max(0, cell.offset - 1) })}
                        className="w-5 h-5 rounded flex items-center justify-center text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/8">−</button>
                      <span className="text-sm font-black w-11 text-center tabular-nums text-white">+{cell.offset}m</span>
                      <button onClick={() => onUpdate({ offset: cell.offset + 1 })}
                        className="w-5 h-5 rounded flex items-center justify-center text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/8">+</button>
                    </div>
                  ) : (
                    <input value={cell.fixed} onChange={e => onUpdate({ fixed: e.target.value })}
                      onBlur={e => onUpdate({ fixed: formatTimeInput(e.target.value) })}
                      placeholder={placeholder}
                      className="w-24 bg-zinc-800/60 border border-white/10 rounded-md px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-white/30" />
                  )}
                </div>
              );

              const renderJamaat2or3 = (
                cell: BatchCell2,
                _onToggle: () => void,
                onUpdate: (p: Partial<BatchCell>) => void,
                _label: string,
                placeholder: string
              ) => renderControl(cell, onUpdate, placeholder);

              return (
                <div className="rounded-2xl bg-zinc-900/60 border border-white/5 mb-8 overflow-hidden">

                  {/* ── Header ── */}
                  <div className="px-7 py-5 border-b border-white/5">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h2 className="text-xl font-black text-white">Adhan &amp; Iqama</h2>
                        <p className="text-xs text-zinc-500 font-bold mt-1">Set offsets or fixed times per prayer, then apply to a date range</p>
                      </div>
                      {/* Date range + Apply */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">From</span>
                            <div className="bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2">
                              <input type="date" value={batchFrom} onChange={e => setBatchFrom(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white focus:outline-none" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">To</span>
                            <div className="bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2">
                              <input type="date" value={batchTo} onChange={e => setBatchTo(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white focus:outline-none" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 opacity-0">Btn</span>
                            <button onClick={handleBatchApply} disabled={applyingBatch}
                              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all h-[38px] ${
                                batchApplied ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                  : applyingBatch ? "bg-zinc-800 text-zinc-500 cursor-wait border border-white/5"
                                  : `${theme.btn}`
                              }`}>
                              {applyingBatch
                                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Applying…</>
                                : batchApplied ? <><Icon d="M5 13l4 4L19 7" className="w-4 h-4" /> Applied</>
                                : "Apply"
                              }
                            </button>
                          </div>
                        </div>
                        {batchError && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-3.5 h-3.5 shrink-0" />
                            {batchError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Column headers ── */}
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5 bg-zinc-950/30">
                    <div className="px-5 py-2.5" />
                    {PRAYER_META.map(p => (
                      <div key={p.key} className="px-5 py-2.5 border-l border-white/5 flex items-center gap-2">
                        <span className="font-black text-white text-sm">{p.label}</span>
                        <span className={`text-xs ${theme.accent}`} style={{ fontFamily: "serif" }}>{p.arabic}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Adhan row ── */}
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                    <div className="px-5 py-4 flex items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Adhan</span>
                    </div>
                    {PRAYER_META.map(p => (
                      <div key={p.key} className="px-5 py-4 border-l border-white/5">
                        {renderControl(
                          (batchAdhan as unknown as Record<string, BatchCell>)[p.key],
                          patch => setBatchAdhan(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } })),
                          "6:00 AM"
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Iqama row ── */}
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                    <div className="px-5 py-4 flex items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Iqama</span>
                    </div>
                    {PRAYER_META.map(p => (
                      <div key={p.key} className="px-5 py-4 border-l border-white/5">
                        {renderControl(
                          (batchIqama as unknown as Record<string, BatchCell>)[p.key],
                          patch => setBatchIqama(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } })),
                          "6:30 AM"
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── 2nd Jamaat row (fajr + maghrib only) ── */}
                  {(jamaatSettings.fajr2 || jamaatSettings.maghrib2) && (
                    <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                      <div className="px-5 py-4 flex items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">2nd Jamaat</span>
                      </div>
                      {PRAYER_META.map(p => {
                        const show = (p.key === "fajr" && jamaatSettings.fajr2) || (p.key === "maghrib" && jamaatSettings.maghrib2);
                        const k = p.key as "fajr" | "maghrib";
                        return (
                          <div key={p.key} className="px-5 py-4 border-l border-white/5">
                            {show ? renderJamaat2or3(
                              batchIqama2[k],
                              () => setBatchIqama2(prev => ({ ...prev, [k]: { ...prev[k], enabled: !prev[k].enabled } })),
                              patch => setBatchIqama2(prev => ({ ...prev, [k]: { ...prev[k], ...patch } })),
                              "", "7:00 AM"
                            ) : <span className="text-zinc-700 text-xs">—</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── 3rd Jamaat row (fajr + maghrib only) ── */}
                  {(jamaatSettings.fajr3 || jamaatSettings.maghrib3) && (
                    <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                      <div className="px-5 py-4 flex items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">3rd Jamaat</span>
                      </div>
                      {PRAYER_META.map(p => {
                        const show = (p.key === "fajr" && jamaatSettings.fajr3) || (p.key === "maghrib" && jamaatSettings.maghrib3);
                        const k = p.key as "fajr" | "maghrib";
                        return (
                          <div key={p.key} className="px-5 py-4 border-l border-white/5">
                            {show ? renderJamaat2or3(
                              batchIqama3[k],
                              () => setBatchIqama3(prev => ({ ...prev, [k]: { ...prev[k], enabled: !prev[k].enabled } })),
                              patch => setBatchIqama3(prev => ({ ...prev, [k]: { ...prev[k], ...patch } })),
                              "", "7:30 AM"
                            ) : <span className="text-zinc-700 text-xs">—</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Jummah ── */}
                  <div className="px-7 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Jummah</span>
                        <span className={`ml-2 text-sm ${theme.accent}`} style={{ fontFamily: "serif" }}>الجمعة</span>
                        <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Applied to Fridays in the selected date range</p>
                      </div>
                      {extraTimings.jummah.length < 3 && (
                        <button onClick={() => setExtraTimings(prev => ({ ...prev, jummah: [...prev.jummah, ""] }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black ${theme.subtleBtn}`}>+ Add Khutbah</button>
                      )}
                    </div>
                    {extraTimings.jummah.length === 0 ? (
                      <div className="text-xs text-zinc-600 font-bold py-4 text-center border border-dashed border-white/8 rounded-xl">
                        No Jummah times — click + Add Khutbah to get started
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {extraTimings.jummah.map((t, i) => (
                          <div key={i} className="flex-1 bg-zinc-800/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${theme.label}`}>Khutbah {i + 1}</span>
                              <button onClick={() => setExtraTimings(prev => ({ ...prev, jummah: prev.jummah.filter((_, j) => j !== i) }))}
                                className="text-zinc-600 hover:text-rose-400 text-xs font-black transition-colors">×</button>
                            </div>
                            <input type="text" value={t}
                              onChange={e => { const u = [...extraTimings.jummah]; u[i] = e.target.value; setExtraTimings(prev => ({ ...prev, jummah: u })); }}
                              onBlur={e => { const u = [...extraTimings.jummah]; u[i] = formatTimeInput(e.target.value); setExtraTimings(prev => ({ ...prev, jummah: u })); }}
                              placeholder="1:15 PM"
                              className="w-full bg-zinc-900/60 border border-white/8 rounded-lg px-3 py-2 text-xl font-black text-white focus:outline-none focus:border-white/20" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}


            {/* ── Source switch confirmation modal ── */}
            {pendingSource && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.75)" }}>
                <div className="w-full max-w-md bg-zinc-900 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

                  {/* Top band */}
                  <div className={`px-7 pt-7 pb-5 ${pendingSource === "excel" ? "bg-red-500/5 border-b border-red-500/10" : `bg-zinc-800/40 border-b border-white/5`}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${pendingSource === "excel" ? "bg-red-500/15 border border-red-500/25" : `${theme.iconBg}`}`}>
                        {pendingSource === "excel"
                          ? <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5 text-red-400" />
                          : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className={`w-5 h-5 ${theme.iconColor}`} />
                        }
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-0.5">Switching source</div>
                        <div className="text-lg font-black text-white">
                          {pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}
                        </div>
                      </div>
                    </div>

                    {/* Before / After */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/80 border border-white/8 text-center">
                        <div className="text-xs text-zinc-600 font-bold mb-0.5 uppercase tracking-wider">From</div>
                        <div className="text-sm font-black text-zinc-300">{prayerSource === "backend" ? "Auto-calculate" : "Upload Excel"}</div>
                      </div>
                      <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" className="w-4 h-4 text-zinc-600 shrink-0" />
                      <div className={`flex-1 px-4 py-3 rounded-xl border text-center ${pendingSource === "excel" ? "bg-red-500/10 border-red-500/20" : `${theme.accentBg} ${theme.accentBorder}`}`}>
                        <div className={`text-xs font-bold mb-0.5 uppercase tracking-wider ${pendingSource === "excel" ? "text-red-500/70" : theme.label}`}>To</div>
                        <div className={`text-sm font-black ${pendingSource === "excel" ? "text-red-400" : theme.accent}`}>{pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-7 py-5">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {pendingSource === "excel"
                        ? <><span className="text-red-400 font-bold">All prayer times will be deleted</span> from the database. You'll need to upload an Excel file to add them back.</>
                        : <><span className={`${theme.accent} font-bold`}>Prayer times will be recalculated</span> for the full year using your location and method settings, overwriting any existing data.</>
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-7 pb-7 flex gap-3">
                    <button onClick={() => setPendingSource(null)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm text-zinc-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                      Cancel
                    </button>
                    <button onClick={handleConfirmSourceSwitch}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                        pendingSource === "excel" ? "bg-red-500 hover:bg-red-400 text-white" : `${theme.btn} hover:opacity-90`
                      }`}>
                      {pendingSource === "excel" ? "Delete & Switch" : "Generate & Switch"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Month + Action bar ── */}
            <div className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-6 border bg-zinc-900/60 border-white/5">
              {/* Month pills */}
              <div className="flex gap-2 flex-1 overflow-x-auto pb-0.5 scrollbar-none">
                {months.map((m) => {
                  const hasData = !!prayerTimesByMonth[m.value];
                  const isActive = selectedMonth === m.value;
                  return (
                    <button key={m.value} onClick={() => { setSelectedMonth(m.value); setScheduleEdited(false); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                        isActive ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-white/5 bg-zinc-800/30 hover:border-white/10 text-zinc-500 hover:text-white"
                      }`}>
                      {m.label.split(" ")[0]}
                      {hasData && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? theme.dot : "bg-zinc-500"}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 shrink-0">
                {prayerSource === "backend" ? (
                  switchLoading ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating…
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-sm font-black text-white w-10 text-center">{selectedYear}</span>
                      <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <div>
                      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-bar" />
                      <label htmlFor="file-upload-bar" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm cursor-pointer transition-all border-2 border-dashed ${
                        uploadFile ? `${theme.accentBorder} ${theme.accentBg} ${theme.accent}` : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                      }`}>
                        <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="w-4 h-4" />
                        {uploadFile ? uploadFile.name : "Select .xlsx"}
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-sm font-black text-white w-10 text-center">{selectedYear}</span>
                      <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Feedback messages */}
            {uploadSuccess && (
              <div className="mb-4 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-3">
                <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-emerald-400 font-bold text-sm">{uploadSuccess}</p>
              </div>
            )}
            {uploadError && (
              <div className="mb-4 p-4 bg-red-500/15 border border-red-500/40 rounded-xl">
                <p className="text-red-400 font-bold text-sm">{uploadError}</p>
              </div>
            )}

            {/* ── Schedule table ── */}
            {prayerLoading ? (
              <div className="rounded-2xl border-2 border-dashed border-white/8 flex flex-col items-center justify-center text-center py-20">
                <svg className="animate-spin h-10 w-10 mb-4 text-zinc-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="text-sm text-zinc-600 font-bold">Loading prayer times…</div>
              </div>
            ) : !prayerTimesByMonth[selectedMonth] ? (
              <div className="rounded-2xl border-2 border-dashed border-white/8 flex flex-col items-center justify-center text-center py-20">
                <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 mb-4 text-zinc-700" />
                <div className="font-black text-lg mb-2 text-zinc-500">
                  No schedule for {months.find(m => m.value === selectedMonth)?.label}
                </div>
                <div className="text-sm text-zinc-700">
                  {prayerSource === "backend" ? "Click Generate above to calculate prayer times" : "Select a file and click Upload above"}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 bg-zinc-900/60 border-white/5">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.label}`}>Monthly Schedule</div>
                    <h2 className="text-xl font-black text-white">
                      {months.find((m) => m.value === selectedMonth)?.label}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {(scheduleEdited || savingSchedule || savedSchedule) && (
                      <button onClick={handleSaveSchedule} disabled={savingSchedule}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all ${
                          savedSchedule ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                            : savingSchedule ? "bg-zinc-800 text-zinc-500 cursor-wait border border-white/5"
                            : `${theme.btn}`
                        }`}>
                        {savingSchedule
                          ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
                          : savedSchedule ? <><Icon d="M5 13l4 4L19 7" className="w-3.5 h-3.5" /> Saved</>
                          : "Save"
                        }
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  {(() => {
                    const extraCols: Record<string, string[]> = {
                      fajr:    [...(jamaatSettings.fajr2 ? ["2nd"] : []), ...(jamaatSettings.fajr3 ? ["3rd"] : [])],
                      dhuhr:   [],
                      asr:     [],
                      maghrib: [...(jamaatSettings.maghrib2 ? ["2nd"] : []), ...(jamaatSettings.maghrib3 ? ["3rd"] : [])],
                      isha:    [],
                    };
                    const jummahCount = extraTimings.jummah.length;
                    const totalCols = 1 + PRAYER_META.reduce((s, p) => s + 3 + extraCols[p.key].length, 0) + jummahCount;
                    const compact = totalCols > 17;
                    const tdPx = compact ? "px-1" : "px-2";
                    const thPx = compact ? "px-1.5" : "px-3";
                    const txtSz = compact ? "text-xs" : "text-sm";
                    const inputCls = `w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/25 rounded px-1 py-0.5 ${txtSz} text-zinc-400 focus:text-white focus:outline-none transition-all placeholder-zinc-700`;
                    return (
                      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                        <thead>
                          <tr className="border-b border-white/8">
                            <th className={`py-3 px-3 ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-left`} style={{ width: compact ? "52px" : "72px" }}>Date</th>
                            {PRAYER_META.map((p) => (
                              <th key={p.key} colSpan={3 + extraCols[p.key].length}
                                className={`py-3 ${thPx} ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-center border-l border-white/8`}>
                                {p.label}
                              </th>
                            ))}
                            {jummahCount > 0 && (
                              <th colSpan={jummahCount}
                                className={`py-3 ${thPx} ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-center border-l border-white/8`}>
                                Jummah
                              </th>
                            )}
                          </tr>
                          <tr className="border-b-2 border-white/10">
                            <th />
                            {PRAYER_META.map((p) => (
                              <React.Fragment key={p.key}>
                                <th className={`py-2 ${thPx} ${txtSz} font-bold text-center border-l border-white/8 text-zinc-600`}>Start</th>
                                <th className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>Adhan</th>
                                <th className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>Iqama</th>
                                {extraCols[p.key].map(n => (
                                  <th key={n} className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>{n} Jamaat</th>
                                ))}
                              </React.Fragment>
                            ))}
                            {Array.from({ length: jummahCount }, (_, i) => (
                              <th key={i} className={`py-2 ${thPx} ${txtSz} font-bold text-center border-l border-white/8 text-zinc-600`}>
                                Khutbah {i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {prayerTimesByMonth[selectedMonth].map((day, i) => {
                            const d = day as unknown as Record<string, string>;
                            const isFriday = new Date(day.date + "T12:00:00").getDay() === 5;
                            return (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                                <td className={`py-2 px-2 font-black ${txtSz} text-white`}>
                                  {day.date.split("-").slice(1).join("/")}
                                </td>
                                {PRAYER_META.map((p) => {
                                  const start = day[p.key] as string;
                                  return (
                                    <React.Fragment key={p.key}>
                                      {/* Start time — read-only */}
                                      <td className={`py-2 ${tdPx} border-l border-white/5 font-bold ${txtSz} text-zinc-400 text-center`}>
                                        {to12h(start)}
                                      </td>
                                      {/* Adhan */}
                                      <td className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                        <input
                                          value={d[`${p.key}_adhan`] || ""}
                                          onChange={e => handleEditCell(day.date, `${p.key}_adhan`, e.target.value)}
                                          onBlur={e => handleFormatCell(day.date, `${p.key}_adhan`, e.target.value)}
                                          placeholder="—"
                                          className={inputCls + " text-center"}
                                        />
                                      </td>
                                      {/* Iqama */}
                                      <td className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                        <input
                                          value={d[`${p.key}_iqama`] || ""}
                                          onChange={e => handleEditCell(day.date, `${p.key}_iqama`, e.target.value)}
                                          onBlur={e => handleFormatCell(day.date, `${p.key}_iqama`, e.target.value)}
                                          placeholder="—"
                                          className={inputCls + " text-center"}
                                        />
                                      </td>
                                      {/* Extra jamaats */}
                                      {extraCols[p.key].map((n) => {
                                        const field = `${p.key}_iqama_${n === "2nd" ? 2 : 3}`;
                                        return (
                                          <td key={n} className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                            <input
                                              value={d[field] || ""}
                                              onChange={e => handleEditCell(day.date, field, e.target.value)}
                                              onBlur={e => handleFormatCell(day.date, field, e.target.value)}
                                              placeholder="—"
                                              className={inputCls + " text-center"}
                                            />
                                          </td>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                                {/* Jummah cells — editable on Fridays only */}
                                {Array.from({ length: jummahCount }, (_, j) => {
                                  const field = `jummah_${j + 1}`;
                                  const val = d[field] || "";
                                  return (
                                    <td key={j} className={`py-2 ${tdPx} ${txtSz} border-l border-white/5`}>
                                      {isFriday ? (
                                        <input
                                          value={val}
                                          onChange={e => handleEditCell(day.date, field, e.target.value)}
                                          onBlur={e => handleFormatCell(day.date, field, e.target.value)}
                                          placeholder="—"
                                          className={`w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/25 rounded px-1 py-0.5 ${txtSz} font-bold focus:outline-none transition-all placeholder-zinc-700 text-center ${theme.accent}`}
                                        />
                                      ) : (
                                        <span className="text-zinc-700 px-1">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ════════ EVENTS ════════ */}
        {activeTab === "events" && (
          <div className="px-8 py-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Management</div>
                <h1 className="text-4xl font-black mb-2">Events & Announcements</h1>
                <p className="text-zinc-400 text-lg">Manage your masjid's events</p>
              </div>
              <button
                onClick={() => { setEditingEvent(null); setEventForm({ title: "", description: "", date: "", time: "" }); setShowEventModal(true); }}
                className={`px-6 py-3 ${theme.btn} rounded-xl font-black hover:scale-105 transition-all`}
              >
                + Create Event
              </button>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-bold">No events yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 ${theme.iconBg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
                        <div className={`text-xs font-black uppercase ${theme.iconColor}`}>{ev.date.split("-")[1] === "03" ? "MAR" : ev.date.split("-")[1] === "04" ? "APR" : "MON"}</div>
                        <div className="text-white text-xl font-black leading-none">{ev.date.split("-")[2]}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black mb-1">{ev.title}</h3>
                        <p className="text-zinc-500 text-sm">{ev.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-sm mb-4">
                      <span className={`flex items-center gap-1.5 ${theme.accent}`}><Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4" />{ev.date}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{ev.time}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditEvent(ev)} className="flex-1 py-2.5 rounded-xl font-bold border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-sm">Edit</button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="flex-1 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ NOTIFICATIONS ════════ */}
        {activeTab === "notifications" && (
          <div className="px-8 py-10">
            <div className="mb-8">
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Broadcast</div>
              <h1 className="text-4xl font-black mb-2">Send Notifications</h1>
              <p className="text-zinc-400 text-lg">Deliver announcements to {stats.subscribedUsers.toLocaleString()} subscribers</p>
            </div>
            {notifSent && (
              <div className="mb-6 p-5 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                  <Icon d="M5 13l4 4L19 7" className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-black">Notification Sent!</div>
                  <div className="text-emerald-400 text-sm font-bold">Delivered to {stats.subscribedUsers.toLocaleString()} subscribers</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 items-stretch">

              {/* Left: Compose */}
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-0.5">Compose</h2>
                  <p className="text-zinc-500 text-sm">Write and send a broadcast message</p>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {[
                      { value: "general", label: "General",     icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
                      { value: "prayer",  label: "Prayer Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { value: "event",   label: "Event",       icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                    ].map((t) => (
                      <button key={t.value} onClick={() => setNotificationForm({ ...notificationForm, type: t.value })}
                        className={`p-4 rounded-xl border-2 transition-all ${notificationForm.type === t.value ? `${theme.accentBg} ${theme.accentBorder}` : "border-white/5 bg-zinc-800/40 hover:border-white/10"}`}>
                        <Icon d={t.icon} className={`w-6 h-6 mx-auto mb-2 ${notificationForm.type === t.value ? theme.iconColor : "text-zinc-500"}`} />
                        <div className={`text-xs font-black text-center ${notificationForm.type === t.value ? "text-white" : "text-zinc-500"}`}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" value={notificationForm.title} maxLength={50}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="e.g., Jummah Prayer Update" className={inputCls} />
                  <div className="text-xs text-right text-zinc-600 mt-1">{notificationForm.title.length}/50</div>
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Message</label>
                  <textarea value={notificationForm.message} maxLength={200} rows={5}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    placeholder="Enter your message..." className={inputCls + " resize-none"} />
                  <div className="text-xs text-right text-zinc-600 mt-1">{notificationForm.message.length}/200</div>
                </div>
                <button onClick={handleSendNotification} disabled={isSendingNotification || !notificationForm.title || !notificationForm.message}
                  className={`w-full py-4 rounded-xl font-black text-lg transition-all ${isSendingNotification || !notificationForm.title || !notificationForm.message ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : `${theme.btn} hover:scale-[1.01]`}`}>
                  {isSendingNotification ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : `Send to ${stats.subscribedUsers.toLocaleString()} Subscribers`}
                </button>
              </div>

              {/* Right: Stats + Preview */}
              <div className="flex flex-col gap-5">
                {/* Reach stats */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7">
                  <h2 className="text-xl font-black mb-5">Reach</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Subscribers", value: stats.subscribedUsers.toLocaleString(), icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                      { label: "Sent This Month", value: stats.notificationsSent, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                    ].map((s) => (
                      <div key={s.label} className="bg-zinc-800/60 rounded-xl p-4 border border-white/5">
                        <div className={`w-8 h-8 ${theme.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                          <Icon d={s.icon} className={`w-4 h-4 ${theme.iconColor}`} />
                        </div>
                        <div className={`text-2xl font-black ${theme.accent}`}>{s.value}</div>
                        <div className="text-zinc-500 text-xs font-bold mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live notification preview */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex-1">
                  <h2 className="text-xl font-black mb-5">Preview</h2>
                  <div className="bg-zinc-800/60 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                        <CrescentIcon className={`w-5 h-5 ${theme.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-white">{generalSettings.masjidName}</div>
                        <div className={`text-sm mt-0.5 ${notificationForm.title ? "text-zinc-200" : "text-zinc-600"}`}>
                          {notificationForm.title || "Notification title will appear here"}
                        </div>
                        <div className={`text-xs mt-1.5 leading-relaxed ${notificationForm.message ? "text-zinc-400" : "text-zinc-700"}`}>
                          {notificationForm.message || "Your message body will appear here. Keep it clear and concise."}
                        </div>
                        <div className="text-zinc-600 text-xs mt-2">just now</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-600 text-xs mt-4 text-center">This is how your notification will appear on subscribers' phones</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════ QUESTIONS ════════ */}
        {activeTab === "questions" && (() => {
          const filtered = questions.filter(q =>
            questionsFilter === "all" ? true : questionsFilter === "unanswered" ? !q.answered : q.answered
          );
          const selected = questions.find(q => q.id === selectedQuestionId) ?? null;
          const unansweredCount = questions.filter(q => !q.answered).length;

          return (
          <div className="px-8 py-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Community</div>
                <h1 className="text-4xl font-black mb-2">Questions</h1>
                <p className="text-zinc-400 text-lg">
                  {unansweredCount > 0 ? <><span className="text-rose-400 font-black">{unansweredCount}</span> unanswered questions</> : "All questions answered"}
                </p>
              </div>
              <div className="flex gap-2">
                {(["unanswered", "all", "answered"] as const).map((f) => (
                  <button key={f} onClick={() => setQuestionsFilter(f)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm border-2 capitalize transition-all ${
                      questionsFilter === f ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-6 items-start">

              {/* Question list */}
              <div className="col-span-2 space-y-2">
                {filtered.length === 0 && (
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl py-16 text-center">
                    <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                    <p className="text-zinc-500 font-bold">No questions here</p>
                  </div>
                )}
                {filtered.map((q) => (
                  <button key={q.id} onClick={() => { setSelectedQuestionId(q.id); setReplyText(""); }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedQuestionId === q.id
                        ? `${theme.accentBg} ${theme.accentBorder}`
                        : "bg-zinc-900/60 border-white/5 hover:border-white/10"
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-black text-sm text-white">{q.name}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                        q.answered ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {q.answered ? "Answered" : "Pending"}
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-snug line-clamp-2">{q.question}</p>
                    <div className="text-zinc-600 text-xs mt-2">{new Date(q.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</div>
                  </button>
                ))}
              </div>

              {/* Detail + reply panel */}
              <div className="col-span-3">
                {!selected ? (
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl py-24 text-center">
                    <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500 font-bold">Select a question to reply</p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-7 py-5 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-lg text-white">{selected.name}</div>
                          <div className="text-zinc-500 text-sm">{selected.email} · {new Date(selected.date).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}</div>
                        </div>
                        <div className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                          selected.answered ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}>
                          {selected.answered ? "Answered" : "Awaiting reply"}
                        </div>
                      </div>
                    </div>

                    {/* Question bubble */}
                    <div className="px-7 py-6 border-b border-white/5">
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">Question</div>
                      <div className="bg-zinc-800/60 rounded-2xl rounded-tl-none px-5 py-4 text-zinc-200 leading-relaxed">
                        {selected.question}
                      </div>
                    </div>

                    {/* Existing answer */}
                    {selected.answered && selected.answer && (
                      <div className="px-7 py-6 border-b border-white/5">
                        <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">Your Reply</div>
                        <div className={`${theme.accentBg} border ${theme.accentBorder} rounded-2xl rounded-tr-none px-5 py-4 ${theme.accent} leading-relaxed`}>
                          {selected.answer}
                        </div>
                      </div>
                    )}

                    {/* Reply box */}
                    <div className="px-7 py-6">
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">
                        {selected.answered ? "Update Reply" : "Write Reply"}
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                        placeholder="Type your reply..."
                        className={inputCls + " resize-none mb-4"}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (!replyText.trim()) return;
                            setQuestions(prev => prev.map(q => q.id === selected.id ? { ...q, answered: true, answer: replyText.trim() } : q));
                            setReplyText("");
                          }}
                          disabled={!replyText.trim()}
                          className={`flex-1 py-3 rounded-xl font-black transition-all ${!replyText.trim() ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : `${theme.btn} hover:scale-[1.01]`}`}>
                          {selected.answered ? "Update Reply" : "Send Reply"}
                        </button>
                        {selected.answered && (
                          <button
                            onClick={() => setQuestions(prev => prev.map(q => q.id === selected.id ? { ...q, answered: false, answer: undefined } : q))}
                            className="px-5 py-3 rounded-xl font-black border-2 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                            Mark Unanswered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
          );
        })()}

        {/* ════════ SETTINGS ════════ */}
        {activeTab === "settings" && (
          <div className="px-8 py-10">
            <div className="mb-8">
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Configuration</div>
              <h1 className="text-4xl font-black mb-2">Settings</h1>
              <p className="text-zinc-400 text-lg">Configure your masjid profile, prayer times, and appearance</p>
            </div>

            {/* Settings sub-nav */}
            <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
              {[
                { id: "general", label: "General", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { id: "prayer", label: "Prayer Settings", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                { id: "theme", label: "Theme", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                    settingsTab === t.id ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-transparent text-zinc-500 hover:text-white"
                  }`}
                >
                  <Icon d={t.icon} className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── GENERAL SETTINGS ── */}
            {settingsTab === "general" && (
              <div className="space-y-6">

                {settingsSaved && (
                  <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-xl flex items-center gap-3">
                    <Icon d="M5 13l4 4L19 7" className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Settings saved successfully!</span>
                  </div>
                )}

                {/* Row 1: Identity + Contact */}
                <div className="grid grid-cols-2 gap-6 items-stretch">
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-5">
                    <div>
                      <h3 className="text-xl font-black mb-0.5">Masjid Identity</h3>
                      <p className="text-zinc-500 text-sm">Your name and public URL</p>
                    </div>
                    <div>
                      <label className={labelCls}>Masjid / Academy Name</label>
                      <input className={inputCls} value={generalSettings.masjidName} onChange={(e) => setGeneralSettings({ ...generalSettings, masjidName: e.target.value })} placeholder="e.g., Toronto Hifz Academy" />
                    </div>
                    <div>
                      <label className={labelCls}>Subdomain</label>
                      <div className="flex items-center">
                        <input className={inputCls + " rounded-r-none border-r-0"} value={generalSettings.subdomain} onChange={(e) => setGeneralSettings({ ...generalSettings, subdomain: e.target.value })} placeholder="torontohifz" />
                        <div className="px-4 py-3 bg-zinc-800 border-2 border-white/10 border-l-0 rounded-r-xl text-zinc-500 font-bold text-sm whitespace-nowrap">.jam3ah.app</div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Website</label>
                      <input className={inputCls} value={generalSettings.website} onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })} placeholder="www.yourdomain.ca" />
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-5">
                    <div>
                      <h3 className="text-xl font-black mb-0.5">Contact Information</h3>
                      <p className="text-zinc-500 text-sm">Shown on your public site</p>
                    </div>
                    <div>
                      <label className={labelCls}>Address</label>
                      <input className={inputCls} value={generalSettings.address} onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })} placeholder="123 Main St, City, Province" />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input className={inputCls} value={generalSettings.phone} onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })} placeholder="+1 (416) 555-0000" />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input className={inputCls} value={generalSettings.email} onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })} placeholder="info@masjid.ca" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Social + Preview */}
                <div className="grid grid-cols-2 gap-6 items-stretch">
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-4">
                    <div>
                      <h3 className="text-xl font-black mb-0.5">Social Media</h3>
                      <p className="text-zinc-500 text-sm">Displayed on your public website</p>
                    </div>
                    {[
                      { key: "instagram", label: "Instagram", prefix: "@", placeholder: "yourmasjid", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" },
                      { key: "facebook", label: "Facebook", prefix: "fb.com/", placeholder: "yourmasjid", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                      { key: "twitter", label: "X / Twitter", prefix: "@", placeholder: "yourmasjid", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                      { key: "youtube", label: "YouTube", prefix: "youtube.com/", placeholder: "YourMasjid", icon: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                      { key: "whatsapp", label: "WhatsApp", prefix: "", placeholder: "+1 416-555-0000", icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
                    ].map((s) => (
                      <div key={s.key} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24"><path d={s.icon} /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className={labelCls}>{s.label}</label>
                          <div className="flex items-center">
                            {s.prefix && <span className="px-3 py-3 bg-zinc-800 border-2 border-r-0 border-white/10 rounded-l-xl text-zinc-500 font-bold text-xs whitespace-nowrap">{s.prefix}</span>}
                            <input className={`${inputCls} ${s.prefix ? "rounded-l-none border-l-0" : ""}`}
                              value={(generalSettings as any)[s.key]}
                              onChange={(e) => setGeneralSettings({ ...generalSettings, [s.key]: e.target.value })}
                              placeholder={s.placeholder} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Live preview */}
                    <div className={`rounded-2xl overflow-hidden border-2 ${theme.accentBorder} flex-1`}>
                      <div className={`px-5 py-3 border-b ${theme.accentBorder} flex items-center gap-3`} style={{ background: `${theme.hex}15` }}>
                        <div className={`w-8 h-8 ${theme.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                          <CrescentIcon className={`w-4 h-4 ${theme.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-white">{generalSettings.masjidName || "Your Masjid"}</div>
                          <div className={`text-xs font-bold ${theme.accent}`}>{generalSettings.subdomain || "yourmasjid"}.jam3ah.app</div>
                        </div>
                      </div>
                      <div className="p-5 bg-zinc-900 space-y-2.5">
                        {generalSettings.address && (
                          <div className="flex items-start gap-2 text-sm text-zinc-400">
                            <Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                            {generalSettings.address}
                          </div>
                        )}
                        {generalSettings.phone && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" className="w-4 h-4 text-zinc-500 shrink-0" />
                            {generalSettings.phone}
                          </div>
                        )}
                        {generalSettings.email && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-4 h-4 text-zinc-500 shrink-0" />
                            {generalSettings.email}
                          </div>
                        )}
                        {!generalSettings.address && !generalSettings.phone && !generalSettings.email && (
                          <p className="text-zinc-600 text-sm text-center py-3">Fill in your details to see a preview</p>
                        )}
                      </div>
                    </div>

                    {/* Profile completeness */}
                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5">
                      <div className="text-xs font-black uppercase tracking-widest mb-3 text-zinc-500">Profile Completeness</div>
                      <div className="grid grid-cols-2 gap-x-6">
                        {[
                          { label: "Masjid Name", done: !!generalSettings.masjidName },
                          { label: "Subdomain",   done: !!generalSettings.subdomain },
                          { label: "Address",     done: !!generalSettings.address },
                          { label: "Phone",       done: !!generalSettings.phone },
                          { label: "Email",       done: !!generalSettings.email },
                          { label: "Social Media",done: !!(generalSettings.instagram || generalSettings.facebook || generalSettings.twitter) },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm text-zinc-400">{item.label}</span>
                            {item.done
                              ? <div className={`flex items-center gap-1 ${theme.accent}`}><Icon d="M5 13l4 4L19 7" className="w-3 h-3" /><span className="text-xs font-bold">Done</span></div>
                              : <span className="text-xs text-zinc-600 font-bold">Missing</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveSettings} className={`w-full py-4 rounded-xl font-black text-lg ${theme.btn} transition-all hover:scale-[1.01]`}>
                  Save General Settings
                </button>
              </div>
            )}

            {/* ── PRAYER SETTINGS ── */}
            {settingsTab === "prayer" && (
              <div className="space-y-6">

                {/* Row 1: Location (full width) */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7">
                  <h3 className="text-xl font-black mb-1">Location</h3>
                  <p className="text-zinc-500 text-sm mb-6">Set your masjid's location for accurate prayer time calculation</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className={labelCls}>City</label>
                      <input className={inputCls} value={prayerSettings.city} onChange={(e) => setPrayerSettings({ ...prayerSettings, city: e.target.value })} placeholder="Toronto" />
                    </div>
                    <div>
                      <label className={labelCls}>Country</label>
                      <input className={inputCls} value={prayerSettings.country} onChange={(e) => setPrayerSettings({ ...prayerSettings, country: e.target.value })} placeholder="Canada" />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Timezone</label>
                      <select className={selectCls} value={prayerSettings.timezone} onChange={(e) => setPrayerSettings({ ...prayerSettings, timezone: e.target.value })}>
                        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Latitude</label>
                      <input className={inputCls} type="number" step="0.000001" value={prayerSettings.latitude} onChange={(e) => setPrayerSettings({ ...prayerSettings, latitude: e.target.value })} placeholder="43.651070" />
                    </div>
                    <div>
                      <label className={labelCls}>Longitude</label>
                      <input className={inputCls} type="number" step="0.000001" value={prayerSettings.longitude} onChange={(e) => setPrayerSettings({ ...prayerSettings, longitude: e.target.value })} placeholder="-79.347015" />
                    </div>
                    <div>
                      <label className={labelCls}>Elevation (m)</label>
                      <input className={inputCls} type="number" value={prayerSettings.elevation} onChange={(e) => setPrayerSettings({ ...prayerSettings, elevation: e.target.value })} placeholder="76" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Calculation + Adjustments side by side */}
                <div className="grid grid-cols-2 gap-6 items-stretch">

                  {/* Calculation Settings */}
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 space-y-5 flex flex-col">
                    <div>
                      <h3 className="text-xl font-black mb-0.5">Calculation</h3>
                      <p className="text-zinc-500 text-sm">How prayer times are derived astronomically</p>
                    </div>

                    <div>
                      <label className={labelCls}>Method</label>
                      <select className={selectCls} value={prayerSettings.method} onChange={(e) => setPrayerSettings({ ...prayerSettings, method: e.target.value })}>
                        {CALC_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      {prayerSettings.method !== "Custom" && (() => {
                        const m = CALC_METHODS.find(x => x.value === prayerSettings.method)!;
                        return <p className="text-zinc-600 text-xs mt-1.5">Fajr {m.fajr}° · Isha {m.isha > 0 ? `${m.isha}°` : "90 min after Maghrib"}</p>;
                      })()}
                      {prayerSettings.method === "Custom" && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Fajr Angle (°)</label>
                            <input className={inputCls} type="number" step="0.1" value={prayerSettings.customFajrAngle} onChange={(e) => setPrayerSettings({ ...prayerSettings, customFajrAngle: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelCls}>Isha Angle (°)</label>
                            <input className={inputCls} type="number" step="0.1" value={prayerSettings.customIshaAngle} onChange={(e) => setPrayerSettings({ ...prayerSettings, customIshaAngle: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Higher Latitude Rule</label>
                      <p className="text-zinc-600 text-xs mb-2">Needed for Toronto, London, Oslo — where standard angles fail in summer</p>
                      <select className={selectCls} value={prayerSettings.higherLatRule} onChange={(e) => setPrayerSettings({ ...prayerSettings, higherLatRule: e.target.value })}>
                        <option value="None">None — equatorial regions only</option>
                        <option value="Midnight">Midnight — half the night</option>
                        <option value="OneSeventh">One-Seventh — 1/7 of the night</option>
                        <option value="AngleBased">Angle-Based — recommended for Canada &amp; UK</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Asr Madhab</label>
                      <div className="flex gap-2 mt-1">
                        {[
                          { value: "Standard", label: "Standard", sub: "Shafi / Maliki / Hanbali" },
                          { value: "Hanafi",   label: "Hanafi",   sub: "Shadow = 2× height" },
                        ].map((opt) => (
                          <button key={opt.value} onClick={() => setPrayerSettings({ ...prayerSettings, asrMethod: opt.value })}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 text-left transition-all ${prayerSettings.asrMethod === opt.value ? `${theme.accentBg} ${theme.accentBorder}` : "border-white/5 bg-zinc-800/40 hover:border-white/10"}`}>
                            <div className={`font-black text-sm ${prayerSettings.asrMethod === opt.value ? "text-white" : "text-zinc-300"}`}>{opt.label}</div>
                            <div className="text-zinc-600 text-xs mt-0.5">{opt.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Midnight Mode</label>
                      <div className="flex gap-2 mt-1">
                        {[
                          { value: "Standard", label: "Standard", sub: "Sunset → Sunrise" },
                          { value: "Jafari",   label: "Jafari",   sub: "Sunset → Fajr" },
                        ].map((opt) => (
                          <button key={opt.value} onClick={() => setPrayerSettings({ ...prayerSettings, midnightMode: opt.value })}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 text-left transition-all ${prayerSettings.midnightMode === opt.value ? `${theme.accentBg} ${theme.accentBorder}` : "border-white/5 bg-zinc-800/40 hover:border-white/10"}`}>
                            <div className={`font-black text-sm ${prayerSettings.midnightMode === opt.value ? "text-white" : "text-zinc-300"}`}>{opt.label}</div>
                            <div className="text-zinc-600 text-xs mt-0.5">{opt.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manual Adjustments */}
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 space-y-5 flex flex-col">
                    <div>
                      <h3 className="text-xl font-black mb-0.5">Manual Adjustments</h3>
                      <p className="text-zinc-500 text-sm">Shift any prayer earlier or later by minutes</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "fajrAdjust",    label: "Fajr" },
                        { key: "sunriseAdjust", label: "Sunrise" },
                        { key: "dhuhrAdjust",   label: "Dhuhr" },
                        { key: "asrAdjust",     label: "Asr" },
                        { key: "maghribAdjust", label: "Maghrib" },
                        { key: "ishaAdjust",    label: "Isha" },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className={labelCls}>{f.label} (min)</label>
                          <input className={inputCls} type="number" value={(prayerSettings as any)[f.key]}
                            onChange={(e) => setPrayerSettings({ ...prayerSettings, [f.key]: e.target.value })} placeholder="0" />
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <label className={labelCls}>Imsak (min before Fajr)</label>
                      <p className="text-zinc-600 text-xs mb-3">Eating cutoff before Fajr — typically 10 min</p>
                      <input className={inputCls} type="number" value={prayerSettings.imsakMinutes}
                        onChange={(e) => setPrayerSettings({ ...prayerSettings, imsakMinutes: e.target.value })} placeholder="10" />
                    </div>
                  </div>

                </div>

                {/* Multiple Jamaats */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7">
                  <h3 className="text-xl font-black mb-1">Multiple Jamaats</h3>
                  <p className="text-zinc-500 text-sm mb-6">Enable 2nd and 3rd jamaat for Fajr and Maghrib — controls appear in the Adhan &amp; Iqama batch update card.</p>
                  <div className="grid grid-cols-2 gap-5">
                    {([
                      { key: "fajr2" as const, label: "Fajr", jamaat: "2nd Jamaat" },
                      { key: "fajr3" as const, label: "Fajr", jamaat: "3rd Jamaat" },
                      { key: "maghrib2" as const, label: "Maghrib", jamaat: "2nd Jamaat" },
                      { key: "maghrib3" as const, label: "Maghrib", jamaat: "3rd Jamaat" },
                    ]).map(({ key, label, jamaat }) => (
                      <button key={key} onClick={() => setJamaatSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          jamaatSettings[key] ? `${theme.accentBg} ${theme.accentBorder}` : "border-white/5 bg-zinc-800/40 hover:border-white/10"
                        }`}>
                        <div>
                          <div className={`font-black text-sm ${jamaatSettings[key] ? "text-white" : "text-zinc-300"}`}>{label} — {jamaat}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{jamaatSettings[key] ? "Enabled" : "Disabled"}</div>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-all relative ${jamaatSettings[key] ? theme.accentBg + " border " + theme.accentBorder : "bg-zinc-700"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${jamaatSettings[key] ? theme.dot + " right-0.5" : "bg-zinc-500 left-0.5"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times Source */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7">
                  <h3 className="text-xl font-black mb-1">Times Source</h3>
                  <p className="text-zinc-500 text-sm mb-6">Choose how prayer start times are populated</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { k: "backend" as const, label: "Auto-calculate", sub: "Computed from location & method settings", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
                      { k: "excel"   as const, label: "Upload Excel",   sub: "Import from a spreadsheet file",           icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
                    ].map(opt => (
                      <button key={opt.k}
                        onClick={() => opt.k !== prayerSource && setPendingSource(opt.k)}
                        className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                          prayerSource === opt.k
                            ? `${theme.accentBg} ${theme.accentBorder}`
                            : "border-white/5 bg-zinc-800/40 hover:border-white/10"
                        }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${prayerSource === opt.k ? theme.iconBg : "bg-zinc-700/40"}`}>
                          <Icon d={opt.icon} className={`w-5 h-5 ${prayerSource === opt.k ? theme.iconColor : "text-zinc-500"}`} />
                        </div>
                        <div>
                          <div className={`font-black text-sm mb-0.5 ${prayerSource === opt.k ? "text-white" : "text-zinc-300"}`}>{opt.label}</div>
                          <div className="text-zinc-500 text-xs">{opt.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveSettings} className={`w-full py-4 rounded-xl font-black text-lg ${theme.btn} transition-all hover:scale-[1.01]`}>
                  Save Prayer Settings
                </button>
              </div>
            )}

            {/* ── THEME SETTINGS ── */}
            {settingsTab === "theme" && (
              <div className="grid grid-cols-2 gap-6 items-stretch">

                {/* Left: picker */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-6">
                  <div>
                    <h3 className="text-xl font-black mb-0.5">Colour Theme</h3>
                    <p className="text-zinc-500 text-sm">
                      Applies to both your dashboard and public site at{" "}
                      <span className={`font-bold ${theme.accent}`}>{generalSettings.subdomain}.jam3ah.app</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setThemeName(key)}
                        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          themeName === key ? "bg-white/5" : "border-white/5 hover:border-white/15 bg-zinc-800/40"
                        }`}
                        style={{ borderColor: themeName === key ? t.hex : undefined, boxShadow: themeName === key ? `0 0 0 4px ${t.hex}22` : undefined }}
                      >
                        <div className="w-10 h-10 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${t.hex}, ${t.hex}66)`, boxShadow: `0 4px 20px ${t.hex}44` }} />
                        <span className={`text-xs font-black ${themeName === key ? "text-white" : "text-zinc-400"}`}>{t.name}</span>
                        {themeName === key && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                            <Icon d="M5 13l4 4L19 7" className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className={`rounded-xl p-4 border flex items-center gap-3 ${theme.accentBg} ${theme.accentBorder}`}>
                    <div className={`w-9 h-9 ${theme.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className={`w-5 h-5 ${theme.iconColor}`} />
                    </div>
                    <div>
                      <div className={`font-black text-sm ${theme.accent}`}>Theme auto-saved</div>
                      <div className="text-zinc-500 text-xs">Changes apply instantly everywhere</div>
                    </div>
                  </div>
                </div>

                {/* Right: live preview */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 flex flex-col space-y-4">
                  <div>
                    <h3 className="text-xl font-black mb-0.5">Live Preview</h3>
                    <p className="text-zinc-500 text-sm">How your dashboard looks with the selected theme</p>
                  </div>
                  <div className={`rounded-2xl overflow-hidden border-2 flex-1 ${theme.accentBorder}`}>
                    <div className={`px-5 py-3 border-b ${theme.accentBorder} flex items-center gap-3`} style={{ background: `${theme.hex}15` }}>
                      <div className={`w-8 h-8 ${theme.iconBg} rounded-lg flex items-center justify-center`}>
                        <CrescentIcon className={`w-4 h-4 ${theme.iconColor}`} />
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{generalSettings.masjidName}</div>
                        <div className={`text-xs font-bold uppercase tracking-widest ${theme.label}`}>Admin Dashboard</div>
                      </div>
                    </div>
                    <div className="p-5 bg-zinc-900">
                      <div className="flex gap-2 mb-5">
                        {["Overview", "Prayer Times", "Events"].map((tab, i) => (
                          <div key={tab} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${i === 0 ? `${theme.accentBg} ${theme.accent}` : "text-zinc-600 bg-zinc-800"}`}>{tab}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {["Events", "Subscribers", "Notifications"].map((s, i) => (
                          <div key={s} className="bg-zinc-800 rounded-xl p-4 border border-white/5">
                            <div className={`w-8 h-8 ${theme.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                              <div className={`w-4 h-4 rounded-full ${theme.dot}`} />
                            </div>
                            <div className="text-white font-black text-xl">{[3, "1.2K", 89][i]}</div>
                            <div className="text-zinc-500 text-xs font-bold mt-0.5">{s}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Event Modal ── */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">{editingEvent ? "Edit Event" : "Create Event"}</h2>
              <button onClick={() => setShowEventModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <Icon d="M6 18L18 6M6 6l12 12" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Title *", type: "text", placeholder: "Event title", key: "title" as keyof EventForm },
                { label: "Description", type: "text", placeholder: "Brief description", key: "description" as keyof EventForm },
                { label: "Date *", type: "date", placeholder: "", key: "date" as keyof EventForm },
                { label: "Time *", type: "time", placeholder: "", key: "time" as keyof EventForm },
              ].map((f) => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={eventForm[f.key]}
                    onChange={(e) => setEventForm({ ...eventForm, [f.key]: e.target.value })}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 text-zinc-400 hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleEventSubmit} className={`flex-1 py-3 ${theme.btn} rounded-xl font-black transition-all`}>{editingEvent ? "Save Changes" : "Create Event"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel Column Mapping Modal ── */}
      {xlsxPreview && (() => {
        const rows = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
        const headers = rows[xlsxPreview.headerRowIdx]?.map(h => String(h ?? "").trim()) ?? [];
        const previewRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c)).slice(0, 5);
        const colOpts = ["", ...headers];

        const REQUIRED_FIELDS = [
          { key: "date",    label: "Date",         hint: "Full date column (YYYY-MM-DD, DD/MM/YYYY, etc.)" },
          { key: "day",     label: "Day #",         hint: "Day-of-month number (1–31). Used if no full date column." },
          { key: "fajr",    label: "Fajr",          hint: "Fajr start / adhan time" },
          { key: "dhuhr",   label: "Dhuhr / Zuhr",  hint: "Dhuhr start time" },
          { key: "asr",     label: "Asr",           hint: "Asr start time" },
          { key: "maghrib", label: "Maghrib",       hint: "Maghrib start time" },
          { key: "isha",    label: "Isha",          hint: "Isha start time" },
        ];
        const IQAMA_FIELDS = [
          { key: "fajr_iqama",    label: "Fajr Iqama" },
          { key: "dhuhr_iqama",   label: "Dhuhr Iqama" },
          { key: "asr_iqama",     label: "Asr Iqama" },
          { key: "maghrib_iqama", label: "Maghrib Iqama" },
          { key: "isha_iqama",    label: "Isha Iqama" },
        ];
        const JUMMAH_FIELDS = [
          { key: "jummah1", label: "Jummah 1" },
          { key: "jummah2", label: "Jummah 2" },
          { key: "jummah3", label: "Jummah 3" },
        ];

        const sel = (key: string) => (
          <select
            className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors appearance-none"
            value={colMap[key] ?? ""}
            onChange={e => setColMap(m => ({ ...m, [key]: e.target.value }))}
          >
            {colOpts.map(o => <option key={o} value={o}>{o || "— none —"}</option>)}
          </select>
        );

        const PRAYER_ROWS = [
          { key: "fajr",    label: "Fajr",    arabic: "الفجر",   iqama: "fajr_iqama" },
          { key: "dhuhr",   label: "Dhuhr",   arabic: "الظهر",   iqama: "dhuhr_iqama" },
          { key: "asr",     label: "Asr",     arabic: "العصر",   iqama: "asr_iqama" },
          { key: "maghrib", label: "Maghrib", arabic: "المغرب",  iqama: "maghrib_iqama" },
          { key: "isha",    label: "Isha",    arabic: "العشاء",   iqama: "isha_iqama" },
        ];

        const mappedSet = new Set(Object.values(colMap).filter(Boolean));
        const colLabel = (h: string) => {
          const entry = Object.entries(colMap).find(([, v]) => v === h);
          if (!entry) return null;
          const labels: Record<string, string> = {
            date: "Date", day: "Day #", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr",
            maghrib: "Maghrib", isha: "Isha", fajr_iqama: "Fajr Iqama",
            dhuhr_iqama: "Dhuhr Iqama", asr_iqama: "Asr Iqama",
            maghrib_iqama: "Maghrib Iqama", isha_iqama: "Isha Iqama",
            jummah1: "Jummah 1", jummah2: "Jummah 2", jummah3: "Jummah 3",
          };
          return labels[entry[0]] ?? entry[0];
        };

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.88)" }}>
            <div className="w-full max-w-5xl bg-zinc-900 border border-white/8 rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "90vh" }}>

              {/* Header */}
              <div className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className={`w-5 h-5 ${theme.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black">Map Columns</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{uploadFile?.name}</p>
                </div>
                {xlsxPreview.sheets.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-zinc-800/60 border border-white/8 rounded-xl p-1">
                    {xlsxPreview.sheets.map(s => (
                      <button key={s} onClick={() => {
                        const newRows = xlsxPreview.sheetRows[s];
                        const keywords = ["fajr","dhuhr","zuhr","asr","maghrib","isha","date","day"];
                        const hi = newRows.findIndex(r => r.some(c => keywords.some(k => String(c ?? "").toLowerCase().includes(k))));
                        setXlsxPreview(p => p ? { ...p, selectedSheet: s, headerRowIdx: Math.max(0, hi) } : p);
                        if (hi >= 0) autoMapColumns(newRows[hi].map(h => String(h ?? "").trim()));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${xlsxPreview.selectedSheet === s ? `${theme.accentBg} ${theme.accent}` : "text-zinc-500 hover:text-white"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 font-bold">Header row</span>
                  <input type="number" min={1} max={rows.length}
                    value={xlsxPreview.headerRowIdx + 1}
                    onChange={e => {
                      const idx = Math.max(0, parseInt(e.target.value) - 1);
                      setXlsxPreview(p => p ? { ...p, headerRowIdx: idx } : p);
                      autoMapColumns((rows[idx] ?? []).map(h => String(h ?? "").trim()));
                    }}
                    className="w-14 bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
                <button onClick={() => { setXlsxPreview(null); setUploadFile(null); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/8 transition-all shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">

                {/* Top half: data preview */}
                <div className="flex flex-col border-b border-white/5" style={{ flex: "0 0 40%" }}>
                  <div className="flex items-center gap-2 px-7 pt-3 pb-2 shrink-0">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Data Preview</span>
                    <span className="text-[10px] text-zinc-700 font-bold">· first 5 rows after header</span>
                  </div>
                  {headers.length > 0 ? (
                    <div className="overflow-auto flex-1 px-5 pb-4">
                      <table className="text-xs border-collapse w-max min-w-full">
                        <thead>
                          <tr>
                            {headers.map((h, i) => {
                              const label = colLabel(h);
                              return (
                                <th key={i} className={`px-4 py-2 text-left whitespace-nowrap border-b ${label ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/5"}`}>
                                  <div className={`font-black ${label ? theme.accent : "text-zinc-500"}`}>{h}</div>
                                  {label && <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-60 ${theme.accent}`}>{label}</div>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? "" : "bg-white/[0.02]"}>
                              {headers.map((h, ci) => (
                                <td key={ci} className={`px-4 py-1.5 whitespace-nowrap border-b border-white/[0.03] ${mappedSet.has(h) ? "text-white font-semibold" : "text-zinc-600"}`}>
                                  {String(row[ci] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm px-7">
                      No headers found at row {xlsxPreview.headerRowIdx + 1} — try a different header row number.
                    </div>
                  )}
                </div>

                {/* Bottom half: column mapping */}
                <div className="flex-1 px-7 py-4 flex flex-col justify-between">

                  {/* Date */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <div className="w-1.5 h-3 rounded-full bg-blue-400/60 shrink-0"></div>
                      <span className="text-xs font-black text-zinc-300">Date</span>
                    </div>
                    <div className="w-52">{sel("date")}</div>
                    <span className="text-[10px] text-zinc-700 font-bold">YYYY-MM-DD · DD/MM/YYYY · Excel serial</span>
                  </div>

                  <div className="border-t border-white/5 mb-3" />

                  {/* Prayer rows */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    <div className="grid gap-3 items-center mb-1" style={{ gridTemplateColumns: "96px 1fr 1fr" }}>
                      <div />
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">Adhan / Start</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">Iqama</div>
                    </div>
                    {PRAYER_ROWS.map(p => (
                      <div key={p.key} className="grid gap-3 items-center" style={{ gridTemplateColumns: "96px 1fr 1fr" }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-3 rounded-full bg-emerald-400/60 shrink-0"></div>
                          <div>
                            <div className="text-sm font-black text-white leading-tight">{p.label}</div>
                            <div className="text-[10px] text-zinc-600" style={{ fontFamily: "serif" }}>{p.arabic}</div>
                          </div>
                        </div>
                        {sel(p.key)}
                        {sel(p.iqama)}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 mb-3" />

                  {/* Jummah */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <div className="w-1.5 h-3 rounded-full bg-amber-400/60 shrink-0"></div>
                      <span className="text-xs font-black text-zinc-300">Jummah</span>
                    </div>
                    <div className="flex gap-3 flex-1">
                      {JUMMAH_FIELDS.map(f => (
                        <div key={f.key} className="flex-1">
                          <label className="text-[10px] font-bold text-zinc-600 mb-1 block">{f.label}</label>
                          {sel(f.key)}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-8 py-3 border-t border-white/5">
                {uploadError
                  ? <p className="text-red-400 text-sm font-bold flex-1">{uploadError}</p>
                  : <p className="text-zinc-600 text-xs flex-1">Highlighted columns will be imported. Unmapped prayers use auto-calculated defaults.</p>
                }
                <button onClick={() => { setXlsxPreview(null); setUploadFile(null); }} className="px-5 py-2.5 rounded-xl font-bold border border-white/8 text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-sm">
                  Cancel
                </button>
                <button onClick={handleConfirmImport} disabled={isUploading || !colMap.date}
                  className={`px-7 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${isUploading || !colMap.date ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : `${theme.btn} hover:scale-[1.02]`}`}>
                  {isUploading
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Importing…</>
                    : <>Import <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Dashboard;
