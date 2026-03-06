import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

// ── Types ─────────────────────────────────────────────────────────────────
interface PrayerTime { date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string; }
interface Event { id: number; title: string; description: string; date: string; time: string; }
interface EventForm { title: string; description: string; date: string; time: string; }
interface NotificationForm { type: string; title: string; message: string; }
interface Question { id: number; name: string; email: string; question: string; date: string; answered: boolean; answer?: string; }
interface Month { value: string; label: string; }

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
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-03");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prayerTimesByMonth, setPrayerTimesByMonth] = useState<Record<string, PrayerTime[]>>({
    "2026-03": [
      { date: "2026-03-01", fajr: "5:47 AM", dhuhr: "12:29 PM", asr: "3:41 PM", maghrib: "5:58 PM", isha: "7:28 PM" },
      { date: "2026-03-02", fajr: "5:45 AM", dhuhr: "12:29 PM", asr: "3:43 PM", maghrib: "6:00 PM", isha: "7:30 PM" },
      { date: "2026-03-03", fajr: "5:43 AM", dhuhr: "12:28 PM", asr: "3:44 PM", maghrib: "6:01 PM", isha: "7:31 PM" },
    ],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [prayerOffsets, setPrayerOffsets] = useState<Record<string, { adhan: number; iqama: number }>>({
    fajr:    { adhan: 5,  iqama: 20 },
    dhuhr:   { adhan: 5,  iqama: 15 },
    asr:     { adhan: 5,  iqama: 15 },
    maghrib: { adhan: 5,  iqama: 10 },
    isha:    { adhan: 5,  iqama: 15 },
  });
  const [extraTimings, setExtraTimings] = useState<{ fajr: string[]; maghrib: string[]; jummah: string[] }>({
    fajr: [],
    maghrib: [],
    jummah: ["1:15 PM"],
  });

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

  const months: Month[] = [
    { value: "2026-01", label: "January 2026" }, { value: "2026-02", label: "February 2026" },
    { value: "2026-03", label: "March 2026" },   { value: "2026-04", label: "April 2026" },
    { value: "2026-05", label: "May 2026" },     { value: "2026-06", label: "June 2026" },
  ];

  const todayPrayers = [
    { name: "Fajr", time: "5:47 AM", arabic: "الفجر" },
    { name: "Dhuhr", time: "12:29 PM", arabic: "الظهر" },
    { name: "Asr", time: "3:41 PM", arabic: "العصر" },
    { name: "Maghrib", time: "5:58 PM", arabic: "المغرب" },
    { name: "Isha", time: "7:28 PM", arabic: "العشاء" },
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

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  const handleSaveSettings = () => {
    sessionStorage.setItem("masjid_name", generalSettings.masjidName);
    localStorage.setItem("masjid_name", generalSettings.masjidName);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) { setUploadFile(file); setUploadError(""); }
      else { setUploadError("Please upload an Excel file (.xlsx or .xls)"); setUploadFile(null); }
    }
  };

  const handleUploadPrayerTimes = async () => {
    if (!uploadFile) { setUploadError("Please select a file"); return; }
    setIsUploading(true); setUploadError(""); setUploadSuccess("");
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
          if (jsonData.length === 0) { setUploadError("Excel file is empty"); setIsUploading(false); return; }
          const required = ["Date", "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
          const hasAll = required.every((col) => Object.keys(jsonData[0]).some((k) => k.toLowerCase().includes(col.toLowerCase())));
          if (!hasAll) { setUploadError("Excel must have columns: Date, Fajr, Dhuhr, Asr, Maghrib, Isha"); setIsUploading(false); return; }
          const get = (row: Record<string, string>, col: string) => Object.keys(row).find((k) => k.toLowerCase().includes(col.toLowerCase())) || col;
          const parsed: PrayerTime[] = jsonData.map((row) => ({
            date: row[get(row, "date")], fajr: row[get(row, "fajr")], dhuhr: row[get(row, "dhuhr")],
            asr: row[get(row, "asr")], maghrib: row[get(row, "maghrib")], isha: row[get(row, "isha")],
          }));
          setPrayerTimesByMonth((prev) => ({ ...prev, [selectedMonth]: parsed }));
          setUploadSuccess(`Uploaded ${parsed.length} days for ${months.find((m) => m.value === selectedMonth)?.label}!`);
          setUploadFile(null);
        } catch { setUploadError("Failed to parse Excel file."); }
        finally { setIsUploading(false); }
      };
      reader.onerror = () => { setUploadError("Failed to read file"); setIsUploading(false); };
      reader.readAsBinaryString(uploadFile);
    } catch { setUploadError("Upload failed."); setIsUploading(false); }
  };

  const addMinsToTime = (timeStr: string, mins: number): string => {
    if (!timeStr) return "–";
    if (!mins) return timeStr;
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    const np = nh >= 12 ? "PM" : "AM";
    const dh = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
    return `${dh}:${String(nm).padStart(2, "0")} ${np}`;
  };

  const handleEditStartTime = (dayIdx: number, field: keyof PrayerTime, value: string) => {
    setPrayerTimesByMonth(prev => ({
      ...prev,
      [selectedMonth]: prev[selectedMonth].map((day, i) =>
        i === dayIdx ? { ...day, [field]: value } : day
      ),
    }));
  };

  const handleGenerateFromBackend = async () => {
    setIsGenerating(true);
    // Simulate a backend call
    await new Promise((r) => setTimeout(r, 1800));
    const days = new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]), 0).getDate();
    const generated: PrayerTime[] = Array.from({ length: days }, (_, i) => {
      const dayNum = i + 1;
      const pad = (n: number) => String(n).padStart(2, "0");
      const fajrH = 5, fajrM = 47 - Math.floor(dayNum * 0.5);
      const maghribH = 17, maghribM = 58 + Math.floor(dayNum * 0.7);
      const mH = maghribM >= 60 ? maghribH + 1 : maghribH;
      const mM = maghribM >= 60 ? maghribM - 60 : maghribM;
      return {
        date: `${selectedMonth}-${pad(dayNum)}`,
        fajr: `${fajrH}:${pad(Math.max(fajrM, 30))} AM`,
        dhuhr: `12:29 PM`,
        asr: `3:${pad(41 + Math.floor(dayNum * 0.3))} PM`,
        maghrib: `${mH % 12 || 12}:${pad(mM)} PM`,
        isha: `7:${pad(28 + Math.floor(dayNum * 0.2))} PM`,
      };
    });
    setPrayerTimesByMonth((prev) => ({ ...prev, [selectedMonth]: generated }));
    setIsGenerating(false);
    setUploadSuccess(`Generated ${days} days of prayer times for ${months.find((m) => m.value === selectedMonth)?.label} using ${prayerSettings.method} method.`);
    setTimeout(() => setUploadSuccess(""), 5000);
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
    <div className="min-h-screen bg-zinc-950 text-white">

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
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Management</div>
                <h1 className="text-4xl font-black">Prayer Times</h1>
              </div>
              {/* Source pill toggle */}
              <div className="flex bg-zinc-800/70 rounded-xl p-1 border border-white/5">
                {[
                  { k: "backend", label: "Auto-calculate", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { k: "excel",   label: "Upload Excel",   icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
                ].map((opt) => (
                  <button key={opt.k} onClick={() => setPrayerSource(opt.k as "excel" | "backend")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                      prayerSource === opt.k ? `bg-zinc-950 ${theme.accent} shadow` : "text-zinc-500 hover:text-zinc-300"
                    }`}>
                    <Icon d={opt.icon} className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Prayer cards (start + adhan + iqama per prayer) ── */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {PRAYER_META.map((p) => {
                const startTime = sampleDay ? String((sampleDay as unknown as Record<string,string>)[p.key]) : null;
                const offsets   = prayerOffsets[p.key];
                return (
                  <div key={p.key} className="rounded-2xl p-5 border-2 bg-zinc-900/60 border-white/5 transition-all">
                    {/* Prayer name */}
                    <div className="mb-4">
                      <div className="text-lg font-black mb-0.5 text-white">{p.label}</div>
                      <div className={`text-sm ${theme.accent}`}>{p.arabic}</div>
                    </div>

                    {/* Start time */}
                    <div className="mb-4">
                      <div className="text-xs font-black uppercase tracking-widest mb-1 text-zinc-600">Start</div>
                      <div className="text-2xl font-black tabular-nums text-white">
                        {startTime ?? <span className="text-zinc-600 text-base">—</span>}
                      </div>
                      {prayerSource === "backend" && startTime && (
                        <div className="text-xs mt-0.5 text-zinc-600">auto-calculated</div>
                      )}
                    </div>

                    {/* Adhan row */}
                    <div className="rounded-xl p-3 mb-2 bg-zinc-800/50">
                      <div className="text-xs font-black uppercase tracking-widest mb-2 text-zinc-500">Adhan</div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          onClick={() => setPrayerOffsets(prev => ({ ...prev, [p.key]: { ...prev[p.key], adhan: Math.max(0, prev[p.key].adhan - 1) } }))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-black transition-all bg-zinc-700 hover:bg-zinc-600 text-zinc-300">−</button>
                        <span className="text-sm font-black w-10 text-center tabular-nums text-zinc-200">+{offsets.adhan}m</span>
                        <button
                          onClick={() => setPrayerOffsets(prev => ({ ...prev, [p.key]: { ...prev[p.key], adhan: prev[p.key].adhan + 1 } }))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-black transition-all bg-zinc-700 hover:bg-zinc-600 text-zinc-300">+</button>
                      </div>
                      {startTime
                        ? <div className={`text-sm font-bold ${theme.accent}`}>{addMinsToTime(startTime, offsets.adhan)}</div>
                        : <div className="text-sm text-zinc-600">—</div>
                      }
                    </div>

                    {/* Iqama row */}
                    <div className="rounded-xl p-3 bg-zinc-800/50">
                      <div className="text-xs font-black uppercase tracking-widest mb-2 text-zinc-500">Iqama</div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          onClick={() => setPrayerOffsets(prev => ({ ...prev, [p.key]: { ...prev[p.key], iqama: Math.max(0, prev[p.key].iqama - 1) } }))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-black transition-all bg-zinc-700 hover:bg-zinc-600 text-zinc-300">−</button>
                        <span className="text-sm font-black w-10 text-center tabular-nums text-zinc-200">+{offsets.iqama}m</span>
                        <button
                          onClick={() => setPrayerOffsets(prev => ({ ...prev, [p.key]: { ...prev[p.key], iqama: prev[p.key].iqama + 1 } }))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-black transition-all bg-zinc-700 hover:bg-zinc-600 text-zinc-300">+</button>
                      </div>
                      {startTime
                        ? <div className={`text-sm font-bold ${theme.accent}`}>{addMinsToTime(startTime, offsets.iqama)}</div>
                        : <div className="text-sm text-zinc-600">—</div>
                      }
                    </div>

                    {/* Extra congregation times for Fajr / Maghrib */}
                    {(p.key === "fajr" || p.key === "maghrib") && (() => {
                      const key = p.key as "fajr" | "maghrib";
                      const times = extraTimings[key];
                      return (
                        <div className="mt-3 border-t border-white/5 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Extra Times</div>
                            {times.length < 3 && (
                              <button
                                onClick={() => setExtraTimings(prev => ({ ...prev, [key]: [...prev[key], ""] }))}
                                className={`text-xs font-black px-2 py-0.5 rounded-lg ${theme.subtleBtn}`}
                              >+ Add</button>
                            )}
                          </div>
                          {times.length === 0 && (
                            <div className="text-xs text-zinc-700 italic">No extra times</div>
                          )}
                          {times.map((t, i) => (
                            <div key={i} className="flex items-center gap-1.5 mb-1.5">
                              <div className="text-xs text-zinc-600 w-14 shrink-0 font-bold">{p.label} {i + 2}</div>
                              <input
                                type="text"
                                value={t}
                                onChange={e => {
                                  const updated = [...times];
                                  updated[i] = e.target.value;
                                  setExtraTimings(prev => ({ ...prev, [key]: updated }));
                                }}
                                placeholder="6:30 AM"
                                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-white/20 min-w-0"
                              />
                              <button
                                onClick={() => setExtraTimings(prev => ({ ...prev, [key]: prev[key].filter((_, j) => j !== i) }))}
                                className="text-zinc-600 hover:text-rose-400 text-sm font-black transition-colors leading-none"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {/* ── Jummah Timings ── */}
            <div className="rounded-2xl p-5 border-2 bg-zinc-900/60 border-white/5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-black text-white mb-0.5">Jummah</div>
                  <div className={`text-sm ${theme.accent}`}>الجمعة</div>
                </div>
                {extraTimings.jummah.length < 3 && (
                  <button
                    onClick={() => setExtraTimings(prev => ({ ...prev, jummah: [...prev.jummah, ""] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black ${theme.subtleBtn}`}
                  >+ Add Jummah</button>
                )}
              </div>
              {extraTimings.jummah.length === 0 ? (
                <div className="text-sm text-zinc-600 italic">No Jummah times set. Click "Add Jummah" to get started.</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {extraTimings.jummah.map((t, i) => (
                    <div key={i} className="bg-zinc-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Jummah {i + 1}</div>
                        <button
                          onClick={() => setExtraTimings(prev => ({ ...prev, jummah: prev.jummah.filter((_, j) => j !== i) }))}
                          className="text-zinc-600 hover:text-rose-400 text-sm font-black transition-colors leading-none"
                        >×</button>
                      </div>
                      <input
                        type="text"
                        value={t}
                        onChange={e => {
                          const updated = [...extraTimings.jummah];
                          updated[i] = e.target.value;
                          setExtraTimings(prev => ({ ...prev, jummah: updated }));
                        }}
                        placeholder="1:15 PM"
                        className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-2 text-xl font-black text-white focus:outline-none focus:border-white/20"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Month + Action bar ── */}
            <div className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-6 border bg-zinc-900/60 border-white/5">
              {/* Month pills */}
              <div className="flex gap-2 flex-1">
                {months.map((m) => {
                  const hasData = !!prayerTimesByMonth[m.value];
                  const isActive = selectedMonth === m.value;
                  return (
                    <button key={m.value} onClick={() => setSelectedMonth(m.value)}
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
              {prayerSource === "backend" ? (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs text-zinc-500">
                    <div className="font-bold">{prayerSettings.city || "Toronto"}, {prayerSettings.country || "CA"}</div>
                    <div>{CALC_METHODS.find(m => m.value === prayerSettings.method)?.label?.split(" – ")[0]}</div>
                  </div>
                  <button onClick={handleGenerateFromBackend} disabled={isGenerating}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shrink-0 ${
                      isGenerating ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : `${theme.btn} hover:scale-[1.02]`
                    }`}>
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating...
                      </>
                    ) : `Generate ${months.find(m => m.value === selectedMonth)?.label?.split(" ")[0]}`}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 shrink-0">
                  <div>
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-bar" />
                    <label htmlFor="file-upload-bar" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm cursor-pointer transition-all border-2 border-dashed ${
                      uploadFile ? `${theme.accentBorder} ${theme.accentBg} ${theme.accent}` : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                    }`}>
                      <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="w-4 h-4" />
                      {uploadFile ? uploadFile.name : "Select .xlsx"}
                    </label>
                  </div>
                  <button onClick={handleUploadPrayerTimes} disabled={!uploadFile || isUploading}
                    className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shrink-0 ${
                      !uploadFile || isUploading ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : `${theme.btn} hover:scale-[1.02]`
                    }`}>
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              )}
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
            {!prayerTimesByMonth[selectedMonth] ? (
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
                      {months.find((m) => m.value === selectedMonth)?.label} — {prayerTimesByMonth[selectedMonth].length} days
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {prayerSource === "excel" && (
                      <span className="text-xs px-3 py-1.5 rounded-lg border font-bold border-white/10 text-zinc-500">
                        Click start time to edit
                      </span>
                    )}
                    <div className={`text-xs px-3 py-1.5 rounded-lg font-bold ${theme.accentBg} ${theme.accent} border ${theme.accentBorder}`}>
                      Adhan &amp; Iqama from cards above
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/8">
                        {[
                          { label: "Date", w: "w-24" },
                          { label: "Fajr", w: "" },
                          { label: "Dhuhr", w: "" },
                          { label: "Asr", w: "" },
                          { label: "Maghrib", w: "" },
                          { label: "Isha", w: "" },
                        ].map((h, hi) => (
                          <th key={h.label} colSpan={hi === 0 ? 1 : 3}
                            className={`py-3 px-4 text-xs font-black uppercase tracking-widest text-zinc-500 ${hi > 0 ? "text-center border-l border-white/8" : "text-left"} ${h.w}`}>
                            {h.label}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b-2 border-white/10">
                        <th />
                        {PRAYER_META.map((p) => (
                          <React.Fragment key={p.key}>
                            <th className="py-2 px-3 text-xs font-bold text-left border-l border-white/8 text-zinc-600">Start</th>
                            <th className="py-2 px-3 text-xs font-bold text-left text-zinc-600">Adhan</th>
                            <th className="py-2 px-3 text-xs font-bold text-left text-zinc-600">Iqama</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prayerTimesByMonth[selectedMonth].map((day, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                          <td className="py-3 px-4 font-black text-sm text-white">
                            {day.date.split("-").slice(1).join("/")}
                          </td>
                          {PRAYER_META.map((p) => {
                            const start = day[p.key] as string;
                            return (
                              <React.Fragment key={p.key}>
                                <td className="py-3 px-3 border-l border-white/5 font-bold text-sm text-zinc-200">
                                  {prayerSource === "excel" ? (
                                    <input type="text" value={start}
                                      onChange={(e) => handleEditStartTime(i, p.key, e.target.value)}
                                      className="w-24 text-sm font-bold py-0.5 px-1.5 rounded border bg-transparent focus:outline-none border-white/15 text-zinc-200 focus:border-white/35"
                                    />
                                  ) : <span>{start}</span>}
                                </td>
                                <td className="py-3 px-3 text-sm text-zinc-500">
                                  {addMinsToTime(start, prayerOffsets[p.key].adhan)}
                                </td>
                                <td className="py-3 px-3 text-sm text-zinc-500">
                                  {addMinsToTime(start, prayerOffsets[p.key].iqama)}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </div>
  );
};

export default Dashboard;
