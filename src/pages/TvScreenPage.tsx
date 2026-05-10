import React, { useState, useEffect } from "react";
import { supabaseAdmin } from "../lib/supabase";
import { to12h } from "../dashboard/utils";
import type { PrayerTime } from "../dashboard/types";

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

function nextFridayDate(from: Date): string {
  const d = new Date(from);
  const daysAhead = d.getDay() === 5 ? 0 : (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
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
  const [orient, setOrient] = useState<Orient>(
    () => window.innerWidth >= window.innerHeight ? "h" : "v"
  );
  const [now, setNow] = useState(new Date());
  const [todayRow, setTodayRow] = useState<PrayerTime | null>(null);
  const [jummah, setJummah] = useState<JummahSlots>({ slot1: "", slot2: "", slot3: "", isFriday: false, fridayDate: "" });
  const ayah = AYAH_POOL[Math.floor(Date.now() / 86400000) % AYAH_POOL.length];

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

    const today = new Date().toISOString().slice(0, 10);
    const fridayDate = nextFridayDate(new Date());
    const isFriday = new Date().getDay() === 5;

    supabaseAdmin.from("prayer_times").select("*").eq("masjid_id", masjidId).eq("date", today).maybeSingle()
      .then(({ data }) => { if (data) setTodayRow(data as unknown as PrayerTime); });

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
  }, []);

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
  return orient === "h" ? <HLayout {...shared} /> : <VLayout {...shared} />;
};

// ── Horizontal layout ─────────────────────────────────────────────────────────
function HLayout({ prayers, nextIdx, rawNextIdx, countdownSecs, clockHM, clockSec, dateStr, hijri, ayah, jummah }: LayoutProps) {
  const jSlots = [jummah.slot1, jummah.slot2, jummah.slot3].filter(Boolean);
  const jLabel = jummah.isFriday ? "Today"
    : jummah.fridayDate ? new Date(jummah.fridayDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
  const timerStr = formatCountdown(countdownSecs);
  const isUrgent = countdownSecs > 0 && countdownSecs < 600;

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "var(--bg)", color: "var(--on-surface)",
      display: "flex", flexDirection: "column", userSelect: "none",
    }}>

      {/* ── Top bar: Timer | Clock | Dates ── */}
      <div style={{
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "clamp(20px,3.8vh,50px) clamp(32px,4.5vw,64px)",
        borderBottom: "1px solid var(--outline-subtle)",
        gap: 8,
      }}>

        {/* LEFT — circular countdown timer */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px,1.4vw,20px)" }}>
          {timerStr ? (
            <div style={{
              width: "clamp(130px,22vh,240px)",
              height: "clamp(130px,22vh,240px)",
              borderRadius: "50%",
              border: `2px solid ${isUrgent ? "rgba(251,191,36,0.55)" : "var(--outline)"}`,
              background: isUrgent ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.02)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(2px,0.4vh,5px)",
              transition: "border-color 0.5s, background 0.5s",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: "clamp(8px,1.15vh,14px)",
                fontWeight: 700,
                color: isUrgent ? "rgba(251,191,36,0.6)" : "var(--text-phantom)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}>
                until {prayers[nextIdx]?.label}
              </span>
              <span style={{
                fontSize: "clamp(28px,5.8vh,76px)",
                fontWeight: 800,
                color: isUrgent ? "rgba(251,191,36,0.95)" : "var(--text-max)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                transition: "color 0.5s",
              }}>
                {timerStr}
              </span>
            </div>
          ) : (
            <div style={{
              width: "clamp(120px,19vh,210px)",
              height: "clamp(120px,19vh,210px)",
              borderRadius: "50%",
              border: "2px solid var(--outline-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "clamp(16px,2.6vh,34px)", color: "var(--text-phantom)" }}>—</span>
            </div>
          )}
        </div>

        {/* CENTER — current clock */}
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.03em" }}>
            <span style={{
              fontSize: "clamp(100px,19vh,240px)",
              fontWeight: 800,
              color: "var(--text-max)",
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}>
              {clockHM}
            </span>
            <span style={{
              fontSize: "clamp(40px,7.6vh,100px)",
              fontWeight: 300,
              color: "var(--text-phantom)",
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              paddingBottom: "0.07em",
            }}>
              :{clockSec}
            </span>
          </div>
        </div>

        {/* RIGHT — dates */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "clamp(3px,0.5vh,6px)" }}>
          <span style={{ fontSize: "clamp(16px,2.6vh,34px)", fontWeight: 500, color: "var(--text-dim)", lineHeight: 1.3 }}>
            {dateStr}
          </span>
          <span style={{ fontSize: "clamp(13px,2vh,26px)", color: "var(--text-ghost)" }}>
            {hijri}
          </span>
        </div>
      </div>

      {/* ── Prayer grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", marginTop: "clamp(16px,2.8vh,38px)" }}>
        {prayers.map((p, i) => {
          const isNext = i === nextIdx;
          const isPast = rawNextIdx >= 0 ? i < nextIdx : i !== 0;
          return (
            <div key={p.key} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(10px,1.9vh,26px)",
              padding: "clamp(22px,3.6vh,48px) 8px",
              background: isNext ? "rgba(52,211,153,0.04)" : "transparent",
              borderTop: `3px solid ${isNext ? "var(--accent)" : "transparent"}`,
              borderRight: i < prayers.length - 1 ? "1px solid var(--outline-subtle)" : "none",
            }}>
              {/* Name */}
              <span style={{
                fontSize: "clamp(12px,1.5vw,22px)",
                fontWeight: isNext ? 700 : 400,
                color: isNext ? "rgba(255,255,255,0.94)" : isPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.36)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                {p.label}
              </span>
              {/* Adhan */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(6px,0.7vw,9px)", fontWeight: 700, color: isNext ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.14)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 5 }}>
                  Adhan
                </div>
                <span style={{
                  fontSize: "clamp(22px,3.3vw,54px)",
                  fontWeight: isNext ? 800 : 700,
                  color: isNext ? "var(--accent)" : isPast ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.52)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                }}>
                  {p.adhan}
                </span>
              </div>
              {/* Iqama(s) */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(6px,0.7vw,9px)", fontWeight: 700, color: isNext ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.14)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 5 }}>
                  {p.iqamas.length > 1 ? "Iqama" : "Iqama"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(2px,0.4vh,5px)" }}>
                  {p.iqamas.map((iq, idx) => (
                    <span key={idx} style={{
                      fontSize: idx === 0 ? "clamp(22px,3.3vw,54px)" : "clamp(17px,2.5vw,40px)",
                      fontWeight: isNext ? (idx === 0 ? 700 : 600) : 600,
                      color: isNext ? (idx === 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)") : isPast ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.37)",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}>
                      {p.iqamas.length > 1 && <span style={{ fontSize: "0.5em", opacity: 0.5, marginRight: "0.2em" }}>{idx + 1}</span>}
                      {iq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Jumu'ah strip ── */}
      {jSlots.length > 0 && (
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "clamp(12px,2vw,28px)",
          padding: "clamp(8px,1.2vh,14px) clamp(32px,4.5vw,64px)",
          borderTop: "1px solid rgba(251,191,36,0.12)",
          background: "rgba(251,191,36,0.03)",
        }}>
          <span style={{ fontSize: "clamp(7px,0.75vw,10px)", fontWeight: 700, color: "rgba(251,191,36,0.55)", textTransform: "uppercase", letterSpacing: "0.2em", whiteSpace: "nowrap" }}>
            Jumu'ah
          </span>
          {jLabel && (
            <span style={{ fontSize: "clamp(8px,0.8vw,11px)", color: "rgba(251,191,36,0.38)", letterSpacing: "0.04em" }}>
              {jLabel}
            </span>
          )}
          <div style={{ width: 1, height: "clamp(10px,1.4vh,18px)", background: "rgba(251,191,36,0.2)" }} />
          {jSlots.map((s, i) => (
            <span key={i} style={{ fontSize: "clamp(13px,1.5vw,22px)", fontWeight: 700, color: "rgba(251,191,36,0.88)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Ayah of the Day — bottom ── */}
      <div style={{
        flexShrink: 0,
        marginTop: "clamp(22px,3.8vh,50px)",
        borderTop: "1px solid var(--outline-subtle)",
        padding: "clamp(22px,3.8vh,50px) clamp(48px,8vw,120px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(5px,0.8vh,10px)",
      }}>
        <span style={{ fontSize: "clamp(8px,0.85vw,11px)", fontWeight: 700, color: "var(--text-phantom)", textTransform: "uppercase", letterSpacing: "0.26em" }}>
          Ayah of the Day
        </span>
        <p style={{
          margin: 0, direction: "rtl", textAlign: "center",
          fontSize: "clamp(18px,2.1vw,32px)", fontWeight: 600,
          color: "var(--text-max)", fontFamily: "'Amiri','Traditional Arabic',serif",
          lineHeight: 1.7,
        }}>
          {ayah.arabic}
        </p>
        <p style={{
          margin: 0, textAlign: "center",
          fontSize: "clamp(12px,1.25vw,18px)", fontWeight: 400,
          color: "var(--text-dim)", fontStyle: "italic", lineHeight: 1.45,
        }}>
          "{ayah.english}"
        </p>
        <span style={{ fontSize: "clamp(10px,1vw,14px)", fontWeight: 600, color: "var(--accent)", opacity: 0.65, letterSpacing: "0.08em" }}>
          — {ayah.ref}
        </span>
      </div>
    </div>
  );
}

// ── Vertical layout ───────────────────────────────────────────────────────────
function VLayout({ prayers, nextIdx, rawNextIdx, countdownSecs, clockHM, clockSec, dateStr, hijri, ayah, jummah }: LayoutProps) {
  const jSlots = [jummah.slot1, jummah.slot2, jummah.slot3].filter(Boolean);
  const jLabel = jummah.isFriday ? "Today"
    : jummah.fridayDate ? new Date(jummah.fridayDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
  const timerStr = formatCountdown(countdownSecs);

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "var(--bg)", color: "var(--on-surface)",
      display: "flex", flexDirection: "column", userSelect: "none",
    }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column",
        gap: "clamp(4px,0.7vh,8px)",
        padding: "clamp(14px,2.4vh,28px) clamp(20px,3.5vw,40px)",
        borderBottom: "1px solid var(--outline-subtle)",
      }}>
        {timerStr && (
          <div style={{ display: "flex", alignItems: "baseline", gap: "clamp(6px,1vw,10px)" }}>
            <span style={{
              fontSize: "clamp(28px,5.5vh,60px)",
              fontWeight: 800,
              color: countdownSecs < 600 ? "rgba(251,191,36,0.9)" : "var(--text-max)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              transition: "color 0.5s",
            }}>
              {timerStr}
            </span>
            <span style={{ fontSize: "clamp(8px,1.1vh,12px)", fontWeight: 700, color: "var(--text-phantom)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
              until {nextIdx >= 0 ? prayers[nextIdx].label : ""}
            </span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em", lineHeight: 1 }}>
          <span style={{ fontSize: "clamp(40px,8.5vh,90px)", fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
            {clockHM}
          </span>
          <span style={{ fontSize: "clamp(16px,3.3vh,38px)", fontWeight: 300, color: "var(--text-phantom)", fontVariantNumeric: "tabular-nums", paddingBottom: "0.05em" }}>
            :{clockSec}
          </span>
        </div>
        <div style={{ display: "flex", gap: "clamp(6px,1.2vw,14px)", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "clamp(9px,1.4vh,15px)", fontWeight: 500, color: "var(--text-dim)" }}>{dateStr}</span>
          <span style={{ color: "var(--outline-subtle)", fontSize: 9 }}>|</span>
          <span style={{ fontSize: "clamp(8px,1.2vh,12px)", color: "var(--text-ghost)" }}>{hijri}</span>
        </div>
      </div>

      {/* ── Prayer rows ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {prayers.map((p, i) => {
          const isNext = i === nextIdx;
          const isPast = rawNextIdx >= 0 ? i < nextIdx : i !== 0;
          const textDim = isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.42)";
          const timeDim = isPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.5)";
          const labelC  = isNext ? "rgba(52,211,153,0.55)" : "rgba(255,255,255,0.16)";

          return (
            <div key={p.key} style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr",
              alignItems: "center",
              padding: "0 clamp(20px,3.5vw,40px)",
              background: isNext ? "rgba(52,211,153,0.04)" : "transparent",
              borderLeft: `2px solid ${isNext ? "var(--accent)" : "transparent"}`,
              borderBottom: i < prayers.length - 1 ? "1px solid var(--outline-subtle)" : "none",
              transition: "background 0.4s",
            }}>
              <span style={{ fontSize: "clamp(14px,2.4vh,28px)", fontWeight: isNext ? 700 : 400, color: isNext ? "rgba(255,255,255,0.92)" : textDim, letterSpacing: "-0.01em" }}>
                {p.label}
              </span>
              <div>
                <div style={{ fontSize: "clamp(6px,0.8vh,9px)", fontWeight: 700, color: labelC, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 2 }}>Adhan</div>
                <span style={{ fontSize: "clamp(15px,2.8vh,34px)", fontWeight: isNext ? 800 : 600, color: isNext ? "var(--accent)" : timeDim, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                  {p.adhan}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "clamp(6px,0.8vh,9px)", fontWeight: 700, color: labelC, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 2 }}>Iqama</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {p.iqamas.map((iq, idx) => (
                    <span key={idx} style={{ fontSize: idx === 0 ? "clamp(15px,2.8vh,34px)" : "clamp(12px,2.2vh,26px)", fontWeight: isNext ? (idx === 0 ? 700 : 600) : 600, color: isNext ? (idx === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)") : timeDim, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                      {p.iqamas.length > 1 && <span style={{ fontSize: "0.5em", opacity: 0.45, marginRight: "0.2em" }}>{idx + 1}</span>}
                      {iq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Jumu'ah strip ── */}
      {jSlots.length > 0 && (
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px,1.5vw,16px)",
          padding: "clamp(7px,1.1vh,13px) clamp(20px,3.5vw,40px)",
          borderTop: "1px solid rgba(251,191,36,0.12)",
          background: "rgba(251,191,36,0.04)",
        }}>
          <span style={{ fontSize: "clamp(7px,0.85vh,10px)", fontWeight: 700, color: "rgba(251,191,36,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", whiteSpace: "nowrap" }}>
            Jumu'ah{jLabel ? ` · ${jLabel}` : ""}
          </span>
          {jSlots.map((s, i) => (
            <span key={i} style={{ fontSize: "clamp(12px,1.7vh,20px)", fontWeight: 700, color: "rgba(251,191,36,0.85)", fontVariantNumeric: "tabular-nums" }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Ayah of the Day ── */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(5px,0.9vh,11px)",
        padding: "clamp(12px,2vh,24px) clamp(20px,3.5vw,40px)",
        borderTop: "1px solid var(--outline-subtle)",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--outline-subtle))" }} />
          <span style={{ fontSize: "clamp(7px,0.85vh,10px)", fontWeight: 700, color: "var(--text-phantom)", textTransform: "uppercase", letterSpacing: "0.24em", whiteSpace: "nowrap" }}>
            Ayah of the Day
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, var(--outline-subtle))" }} />
        </div>
        <p style={{ margin: 0, textAlign: "center", direction: "rtl", fontSize: "clamp(14px,2.1vh,26px)", fontWeight: 600, color: "var(--text-max)", fontFamily: "'Amiri','Traditional Arabic',serif", lineHeight: 1.8 }}>
          {ayah.arabic}
        </p>
        <p style={{ margin: 0, textAlign: "center", fontSize: "clamp(9px,1.3vh,14px)", color: "var(--text-dim)", fontStyle: "italic", lineHeight: 1.45 }}>
          "{ayah.english}"
        </p>
        <span style={{ fontSize: "clamp(8px,1vh,11px)", fontWeight: 600, color: "var(--accent)", opacity: 0.65, letterSpacing: "0.06em" }}>
          — {ayah.ref}
        </span>
      </div>
    </div>
  );
}

export default TvScreenPage;
