import React, { useState, useEffect } from "react";
import { supabaseAdmin } from "../lib/supabase";
import { to12h } from "../dashboard/utils";
import type { PrayerTime } from "../dashboard/types";
import { localISODate } from "../dashboard/time";
import { useDashTheme } from "../dashboard/theme";
import "./TvScreenPage.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToMins(t: string): number {
  if (!t || t === "—") return -1;
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = parseInt(m12[2]);
    const p = m12[3].toUpperCase();
    if (p === "AM" && h === 12) h = 0;
    if (p === "PM" && h !== 12) h += 12;
    return h * 60 + min;
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
  return -1;
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseLocal(iso: string): Date {
  return new Date(iso + "T12:00:00");
}

function nextFridayDate(from: Date): string {
  const d = new Date(from);
  const daysAhead = d.getDay() === 5 ? 0 : (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysAhead);
  return localISODate(d);
}

const PRAYER_DEFS = [
  { key: "fajr",    label: "Fajr",    adhanKey: "fajr_adhan",    iqamaKey: "fajr_iqama",    extraIqamaKeys: ["fajr_iqama_2", "fajr_iqama_3"] },
  { key: "dhuhr",   label: "Dhuhr",   adhanKey: "dhuhr_adhan",   iqamaKey: "dhuhr_iqama",   extraIqamaKeys: [] as string[] },
  { key: "asr",     label: "Asr",     adhanKey: "asr_adhan",     iqamaKey: "asr_iqama",     extraIqamaKeys: [] as string[] },
  { key: "maghrib", label: "Maghrib", adhanKey: "maghrib_adhan", iqamaKey: "maghrib_iqama", extraIqamaKeys: ["maghrib_iqama_2", "maghrib_iqama_3"] },
  { key: "isha",    label: "Isha",    adhanKey: "isha_adhan",    iqamaKey: "isha_iqama",    extraIqamaKeys: [] as string[] },
];

const AYAH_POOL = [
  { arabic: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا", english: "Indeed, prayer has been decreed upon the believers a decree of specified times.", ref: "An-Nisa 4:103" },
  { arabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ", english: "And establish prayer and give zakah and bow with those who bow.", ref: "Al-Baqarah 2:43" },
  { arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ", english: "And seek help through patience and prayer. Indeed, it is difficult except for the humbly submissive.", ref: "Al-Baqarah 2:45" },
  { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", english: "O you who have believed, seek help through patience and prayer.", ref: "Al-Baqarah 2:153" },
  { arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي", english: "My Lord, make me an establisher of prayer, and from my descendants.", ref: "Ibrahim 14:40" },
  { arabic: "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ", english: "Indeed, Allah confers blessing upon the Prophet, and His angels ask Him to do so.", ref: "Al-Ahzab 33:56" },
  { arabic: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ", english: "Maintain with care the [obligatory] prayers and the middle prayer, and stand before Allah devoutly obedient.", ref: "Al-Baqarah 2:238" },
];

type Orient = "h" | "v";
interface AyahData { arabic: string; english: string; ref: string; }
interface JummahSlots { slot1: string; slot2: string; slot3: string; isFriday: boolean; fridayDate: string; }
interface Prayer { key: string; label: string; adhan: string; iqamas: string[]; }
interface LayoutProps {
  prayers: Prayer[];
  nextIdx: number;
  rawNextIdx: number;
  countdownSecs: number;
  clockHM: string;
  clockSec: string;
  dateStr: string;
  hijri: string;
  ayah: AyahData;
  jummah: JummahSlots;
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TvScreenPage: React.FC = () => {
  const { themeAttr } = useDashTheme();
  const [orient, setOrient] = useState<Orient>(
    () => window.innerWidth >= window.innerHeight ? "h" : "v"
  );
  const [now, setNow] = useState(new Date());
  const [todayRow, setTodayRow] = useState<PrayerTime | null>(null);
  const [jummah, setJummah] = useState<JummahSlots>({ slot1: "", slot2: "", slot3: "", isFriday: false, fridayDate: "" });
  const ayah = AYAH_POOL[Math.floor(now.getTime() / 86400000) % AYAH_POOL.length];
  const today = localISODate(now);
  // Picks up changes made in the dashboard: refetch every five minutes and when the day changes.
  const refreshSlot = Math.floor(now.getTime() / 300_000);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent) => setOrient(e.matches ? "h" : "v");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
    if (!masjidId) return;

    const fridayDate = nextFridayDate(parseLocal(today));
    const isFriday = parseLocal(today).getDay() === 5;

    supabaseAdmin.from("prayer_times").select("*").eq("masjid_id", masjidId).eq("date", today).maybeSingle()
      .then(({ data, error }) => { if (!error) setTodayRow((data as unknown as PrayerTime) ?? null); });

    supabaseAdmin.from("prayer_times").select("jummah_1,jummah_2,jummah_3").eq("masjid_id", masjidId).eq("date", fridayDate).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as Record<string, string>;
          setJummah({
            slot1: to12h(d.jummah_1 || "") || "",
            slot2: to12h(d.jummah_2 || "") || "",
            slot3: to12h(d.jummah_3 || "") || "",
            isFriday, fridayDate,
          });
        }
      });
  }, [today, refreshSlot]);

  const row = todayRow as unknown as Record<string, string> | null;
  const isFriday = now.getDay() === 5;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const prayers = PRAYER_DEFS.map(p => {
    let label = p.label;
    let iqamaKey: string = p.iqamaKey;
    let extraKeys: string[] = p.extraIqamaKeys;
    if (p.key === "dhuhr" && isFriday && row?.jummah_1) {
      label = "Jumu'ah"; iqamaKey = "jummah_1"; extraKeys = ["jummah_2", "jummah_3"];
    }
    const adhan = to12h(row?.[p.adhanKey] || row?.[p.key] || "") || "—";
    const iqamas = [iqamaKey, ...extraKeys]
      .map(k => to12h(row?.[k] || "") || "")
      .filter(Boolean);
    return { key: p.key, label, adhan, iqamas: iqamas.length ? iqamas : ["—"] };
  });

  const rawNextIdx = prayers.findIndex(p => timeToMins(p.adhan) > nowMins);
  const nextIdx = rawNextIdx >= 0 ? rawNextIdx : 0; // cycle back to Fajr after Isha
  const nowTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const nextPrayerSecs = timeToMins(prayers[nextIdx].adhan) * 60;
  const countdownSecs = rawNextIdx >= 0
    ? Math.max(0, nextPrayerSecs - nowTotalSecs)
    : Math.max(0, 86400 - nowTotalSecs + nextPrayerSecs); // overnight to next Fajr

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hijri = new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);
  const clockHM = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const clockSec = String(now.getSeconds()).padStart(2, "0");

  const shared = { prayers, nextIdx, rawNextIdx, countdownSecs, clockHM, clockSec, dateStr, hijri, ayah, jummah };
  return (
    <div className={`dash tv tv--${orient}`} data-dash-theme={themeAttr}>
      {orient === "h" ? <HLayout {...shared} /> : <VLayout {...shared} />}
    </div>
  );
};


// ── Shared pieces ─────────────────────────────────────────────────────────────
// Times come in as "5:42 AM"; the AM/PM is set smaller so the digits carry the weight.
function Time({ value, className = "" }: { value: string; className?: string }) {
  if (!value || value === "—") return <span className={`tv-time tv-time--empty ${className}`}>-</span>;
  const m = value.match(/^(.*\d)\s*(AM|PM)$/i);
  return (
    <span className={`tv-time ${className}`}>
      {m ? <>{m[1]}<span className="tv-ampm">{m[2].toUpperCase()}</span></> : value}
    </span>
  );
}

function Clock({ clockHM, clockSec }: { clockHM: string; clockSec: string }) {
  const m = clockHM.match(/^(.*\d)\s*(AM|PM)$/i);
  return (
    <div className="tv-clock" aria-label={`${clockHM}`}>
      <span className="tv-clock-hm">{m ? m[1] : clockHM}</span>
      <span className="tv-clock-side">
        <span className="tv-clock-sec">:{clockSec}</span>
        {m && <span className="tv-clock-ampm">{m[2].toUpperCase()}</span>}
      </span>
    </div>
  );
}

function Dates({ dateStr, hijri }: { dateStr: string; hijri: string }) {
  return (
    <div className="tv-dates">
      <span className="tv-date">{dateStr}</span>
      <span className="tv-hijri">{hijri}</span>
    </div>
  );
}

function Ayah({ ayah }: { ayah: AyahData }) {
  return (
    <section className="tv-card tv-ayah" aria-label="Ayah of the day">
      <p className="tv-ayah-ar" lang="ar" dir="rtl">{ayah.arabic}</p>
      <p className="tv-ayah-en">
        "{ayah.english}" <span className="tv-ayah-ref">{ayah.ref}</span>
      </p>
    </section>
  );
}

function jummahInfo(jummah: JummahSlots) {
  const slots = [jummah.slot1, jummah.slot2, jummah.slot3].filter(Boolean);
  const when = jummah.isFriday ? "Today"
    : jummah.fridayDate ? new Date(jummah.fridayDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
  return { slots, when };
}

function Jummah({ jummah }: { jummah: JummahSlots }) {
  const { slots, when } = jummahInfo(jummah);
  if (!slots.length) return null;
  return (
    <section className="tv-card tv-jummah" aria-label="Jumu'ah">
      <div className="tv-jummah-head">
        <span className="tv-jummah-title">Jumu'ah</span>
        {when && <span className="tv-jummah-when">{when}</span>}
      </div>
      <div className="tv-jummah-times">
        {slots.map((s, i) => <Time key={i} value={s} />)}
      </div>
    </section>
  );
}

function prayerState(i: number, nextIdx: number, rawNextIdx: number) {
  const isNext = i === nextIdx;
  const isPast = rawNextIdx >= 0 ? i < nextIdx : i !== 0;
  return isNext ? "is-next" : isPast ? "is-past" : "";
}

function extraLabel(idx: number): string {
  return idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx + 1}th`;
}

// ── Horizontal layout ─────────────────────────────────────────────────────────
function HLayout({ prayers, nextIdx, rawNextIdx, countdownSecs, clockHM, clockSec, dateStr, hijri, ayah, jummah }: LayoutProps) {
  const timerStr = formatCountdown(countdownSecs);
  const hasJummah = jummahInfo(jummah).slots.length > 0;
  // Every card reserves the same rows (extra jamaats, the "Next prayer" label) so times line up across cards.
  const maxExtras = Math.max(0, ...prayers.map(p => p.iqamas.length - 1));

  return (
    <main className="tv-screen">
      <header className="tv-head">
        <Clock clockHM={clockHM} clockSec={clockSec} />
        {timerStr ? (
          <div className="tv-countdown" role="timer">
            <span className="tv-countdown-label">{prayers[nextIdx].label} in</span>
            <span className="tv-countdown-time">{timerStr}</span>
          </div>
        ) : <span />}
        <Dates dateStr={dateStr} hijri={hijri} />
      </header>

      <div className="tv-cols">
        {prayers.map((p, i) => {
          const state = prayerState(i, nextIdx, rawNextIdx);
          return (
            <section key={p.key} className={`tv-card tv-col ${state}`} aria-label={p.label}>
              <h2 className="tv-pname">{p.label}</h2>
              <div className="tv-slot">
                <span className="tv-slot-label">Adhan</span>
                <Time value={p.adhan} className="tv-adhan" />
              </div>
              <div className="tv-slot">
                <span className="tv-slot-label">Iqama</span>
                <Time value={p.iqamas[0]} className="tv-iqama" />
                {Array.from({ length: maxExtras }, (_, idx) => {
                  const iq = p.iqamas[idx + 1];
                  return (
                    <span key={idx} className={`tv-extra${iq ? "" : " tv-placeholder"}`} aria-hidden={!iq}>
                      <span className="tv-extra-label">{extraLabel(idx + 1)}</span>
                      <Time value={iq || "0:00 AM"} />
                    </span>
                  );
                })}
              </div>
              <div className={`tv-next${state === "is-next" ? "" : " tv-placeholder"}`} aria-hidden={state !== "is-next"}>
                <span className="tv-next-label">Next prayer</span>
              </div>
            </section>
          );
        })}
      </div>

      <div className={`tv-foot${hasJummah ? "" : " tv-foot--single"}`}>
        <Jummah jummah={jummah} />
        <Ayah ayah={ayah} />
      </div>
    </main>
  );
}

// ── Vertical layout ───────────────────────────────────────────────────────────
function VLayout({ prayers, nextIdx, rawNextIdx, countdownSecs, clockHM, clockSec, dateStr, hijri, ayah, jummah }: LayoutProps) {
  const timerStr = formatCountdown(countdownSecs);

  return (
    <main className="tv-screen">
      <header className="tv-head">
        <Clock clockHM={clockHM} clockSec={clockSec} />
        <Dates dateStr={dateStr} hijri={hijri} />
      </header>

      <section className="tv-card tv-table" aria-label="Today's prayer times">
        <div className="tv-trow tv-thead" aria-hidden="true">
          <span>Prayer</span><span>Adhan</span><span>Iqama</span>
        </div>
        {prayers.map((p, i) => {
          const state = prayerState(i, nextIdx, rawNextIdx);
          return (
            <div key={p.key} className={`tv-trow ${state}`}>
              <div className="tv-tname">
                <h2 className="tv-pname">{p.label}</h2>
                {state === "is-next" && (
                  <span className="tv-next-inline">
                    <span className="tv-next-label">Next prayer</span>
                    {timerStr && <span className="tv-next-count">in {timerStr}</span>}
                  </span>
                )}
              </div>
              <Time value={p.adhan} className="tv-adhan" />
              <div className="tv-tiqama">
                <Time value={p.iqamas[0]} className="tv-iqama" />
                {p.iqamas.slice(1).map((iq, idx) => (
                  <span key={idx} className="tv-extra">
                    <span className="tv-extra-label">{extraLabel(idx + 1)}</span>
                    <Time value={iq} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <Jummah jummah={jummah} />
      <Ayah ayah={ayah} />
    </main>
  );
}

export default TvScreenPage;
