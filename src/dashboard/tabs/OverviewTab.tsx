import React from "react";
import type { PrayerTime, Event, Announcement } from "../types";
import type { THEMES, ThemeKey } from "../themes";
import { to12h } from "../utils";
import useIsMobile from "../../hooks/useIsMobile";

interface OverviewTabProps {
  theme: typeof THEMES[ThemeKey];
  currentTime: Date;
  generalSettings: { masjidName: string; [key: string]: string };
  todayRow: PrayerTime | undefined;
  events: Event[];
  announcements: Announcement[];
  prayerTimesByMonth: Record<string, PrayerTime[]>;
  prayerSource: "excel" | "backend";
  setActiveTab: (tab: string) => void;
  openNewEvent: () => void;
  openNewAnnouncement: () => void;
}

const PRAYER_ICONS = ["wb_twilight", "light_mode", "partly_cloudy_day", "wb_shade", "bedtime"];
const PRAYER_LABELS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const OverviewTab: React.FC<OverviewTabProps> = ({
  currentTime, generalSettings, todayRow, events, announcements,
  prayerTimesByMonth, prayerSource, setActiveTab, openNewEvent, openNewAnnouncement,
}) => {
  const todayDate = new Date();
  const todayISO = todayDate.toLocaleDateString("en-CA"); // local YYYY-MM-DD (avoids UTC off-by-one)

  const nowMins = todayDate.getHours() * 60 + todayDate.getMinutes();
  const prayerKeys = ["fajr","dhuhr","asr","maghrib","isha"] as const;
  const prayerMins = prayerKeys.map(k => {
    const t = (todayRow as unknown as Record<string,string>)?.[k] || "";
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  });
  const hasTimes = !!todayRow && prayerMins.some(m => m >= 0);
  const nextIdx = prayerMins.findIndex(m => m > nowMins);
  const nextPrayerIdx = nextIdx === -1 ? 0 : nextIdx;
  const nextMin = prayerMins[nextPrayerIdx];
  // Minutes until the next prayer; if all of today's have passed, count to tomorrow's Fajr.
  const minsUntil = hasTimes && nextMin >= 0
    ? (nextIdx === -1 ? (24 * 60 - nowMins) + nextMin : nextMin - nowMins)
    : -1;
  const countdown = minsUntil >= 0
    ? (minsUntil >= 60 ? `${Math.floor(minsUntil / 60)}h ${String(minsUntil % 60).padStart(2, "0")}m` : `${minsUntil}m`)
    : null;
  const nextLabel = PRAYER_LABELS[nextPrayerIdx];

  const row = todayRow as unknown as Record<string,string> | undefined;
  const fmt = (t?: string) => t ? to12h(t) : "—";

  const upcomingEvents = events.filter(e => e.date >= todayISO).sort((a,b) => a.date.localeCompare(b.date));
  const activeAnnouncements = announcements.filter(a => !a.expiresAt || a.expiresAt >= todayISO);

  // Prayer-time coverage: how far ahead the schedule is filled in, and whether
  // this month or next month has a gap the admin needs to fix.
  const nextMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);
  const hasThisMonth = (prayerTimesByMonth[monthKey(todayDate)]?.length ?? 0) > 0;
  const hasNextMonth = (prayerTimesByMonth[monthKey(nextMonthDate)]?.length ?? 0) > 0;
  const daysCovered = Object.values(prayerTimesByMonth).flat().filter(r => r.date >= todayISO).length;
  const prayerWarn = !hasThisMonth || !hasNextMonth;
  const missingMonth = !hasThisMonth ? MONTHS_LONG[todayDate.getMonth()] : !hasNextMonth ? MONTHS_LONG[nextMonthDate.getMonth()] : null;
  const sourceLabel = prayerSource === "backend" ? "Auto-calculated" : "From Excel";

  // Informative stat sublabels (replacing decorative "Scheduled" / "Live Now").
  const nextEvent = upcomingEvents[0];
  const nextEventLabel = nextEvent
    ? (nextEvent.date === todayISO ? "Today" : new Date(nextEvent.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }))
    : null;

  const statCards = [
    { label: "Days of Prayer Times", sublabel: sourceLabel, value: daysCovered, icon: "schedule", warn: false, action: () => setActiveTab("prayer-times") },
    { label: "Upcoming Events", sublabel: nextEventLabel ? `Next ${nextEventLabel}` : "None upcoming", value: upcomingEvents.length, icon: "calendar_month", warn: false, action: () => setActiveTab("events") },
    { label: "Active Announcements", sublabel: activeAnnouncements.length ? "On your website" : "None live", value: activeAnnouncements.length, icon: "campaign", warn: false, action: () => setActiveTab("announcements") },
  ];

  const quickActions = [
    { label: "New Event", icon: "add", action: openNewEvent },
    { label: "Post Announcement", icon: "campaign", action: openNewAnnouncement },
    { label: "Edit Prayer Times", icon: "schedule", action: () => setActiveTab("prayer-times") },
    { label: "Masjid Profile", icon: "settings", action: () => setActiveTab("settings") },
  ];

  const hijriDate = new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(currentTime);
  const isMobile = useIsMobile();

  return (
    <div style={{ padding: isMobile ? "24px 16px 60px" : "48px 40px 80px", fontFamily: "Manrope, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: isMobile ? 24 : 48, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: isMobile ? 12 : 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          {generalSettings.city && (
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
              {generalSettings.city}
            </p>
          )}
          <h1 style={{ fontSize: isMobile ? 22 : 42, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-max)", margin: "4px 0 0", lineHeight: 1.2 }}>
            {isMobile ? <>Assalamu Alaikum, <span style={{ color: "var(--accent)" }}>{generalSettings.masjidName || "Admin"}</span>.</> : <>Assalamu Alaikum Warahmatullahi Wabarakatuh,{" "}<span style={{ color: "var(--accent)" }}>{generalSettings.masjidName || "Admin"}</span>.</>}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "6px 0 0", fontWeight: 500 }}>
            {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0 }}>
          <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-faint)", marginTop: 6 }}>{hijriDate}</div>
          {countdown && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
                Next: <span style={{ color: "var(--accent)" }}>{nextLabel}</span> · in {countdown}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Coverage alert (only when a month is missing) ── */}
      {prayerWarn && (
        <button onClick={() => setActiveTab("prayer-times")}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: isMobile ? "14px 16px" : "16px 20px", marginBottom: isMobile ? 16 : 24, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 2, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#f87171", flexShrink: 0 }}>warning</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.01em" }}>{missingMonth} has no prayer times</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Visitors to your website will see nothing for that month. Add times before it starts.</div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#f87171" }}>
            {!isMobile && "Fix now"}
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </span>
        </button>
      )}

      {/* ── Quick Actions ── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 24 }}>
        {quickActions.map(a => (
          <button key={a.label} onClick={a.action}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: isMobile ? "12px 10px" : "14px 16px", background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, color: "var(--on-surface)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "var(--surface-mid)"; t.style.borderColor = "var(--accent-border)"; }}
            onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "var(--surface-low)"; t.style.borderColor = "var(--surface-mid)"; }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text-ghost)", flexShrink: 0 }}>{a.icon}</span>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.label}</span>
          </button>
        ))}
      </section>

      {/* ── Stats Grid ── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <button key={s.label} onClick={s.action}
            style={{ background: "var(--surface-low)", border: `1px solid ${s.warn ? "rgba(239,68,68,0.25)" : "var(--surface-mid)"}`, borderRadius: 2, padding: isMobile ? "16px" : "24px", textAlign: "left", cursor: "pointer", transition: "background 0.2s", display: "flex", flexDirection: "column", gap: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-mid)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-low)"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: s.warn ? "rgba(239,68,68,0.06)" : "var(--accent-bg)", border: `1px solid ${s.warn ? "rgba(239,68,68,0.15)" : "var(--accent-bg)"}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.warn ? "#f87171" : "var(--accent)" }}>{s.warn ? "warning" : s.icon}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.warn ? "#f87171" : "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "right" }}>{s.sublabel}</span>
            </div>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </button>
        ))}

      </section>

      {/* ── Today's prayers (condensed — full board lives on the Prayer Times tab) ── */}
      <section style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: isMobile ? "18px 16px" : "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-max)", margin: 0 }}>Today's Prayers</h2>
          <button onClick={() => setActiveTab("prayer-times")}
            style={{ background: "none", border: "none", color: "var(--accent)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            View All
          </button>
        </div>

        {!hasTimes ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", color: "var(--text-phantom)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>schedule</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>No prayer times loaded for today</span>
          </div>
        ) : (
          <>
            {/* Next prayer callout */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: isMobile ? 8 : 14, padding: isMobile ? "12px 14px" : "14px 18px", marginBottom: 14, background: "rgba(52,211,153,0.05)", border: "1px solid var(--accent-bg)", borderLeft: "3px solid var(--accent)", borderRadius: 2 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }}>{PRAYER_ICONS[nextPrayerIdx]}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>Next</span>
                <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.01em" }}>{nextLabel}</span>
                <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{fmt(row?.[`${prayerKeys[nextPrayerIdx]}_adhan`] || row?.[prayerKeys[nextPrayerIdx]])}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-ghost)", fontVariantNumeric: "tabular-nums" }}>iqama {fmt(row?.[`${prayerKeys[nextPrayerIdx]}_iqama`])}</span>
              </div>
              {countdown && <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>in {countdown}</span>}
            </div>

            {/* All five, compact */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: isMobile ? 6 : 10 }}>
              {prayerKeys.map((key, i) => {
                const isNext = i === nextPrayerIdx;
                const adhan = fmt(row?.[`${key}_adhan`] || row?.[key]);
                const iqama = fmt(row?.[`${key}_iqama`]);
                return (
                  <div key={key} style={{ padding: isMobile ? "10px 4px" : "12px 8px", textAlign: "center", background: isNext ? "rgba(52,211,153,0.05)" : "var(--surface-mid)", border: `1px solid ${isNext ? "var(--accent-bg)" : "var(--surface-high)"}`, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: isNext ? "var(--accent)" : "var(--text-phantom)" }}>{PRAYER_ICONS[i]}</span>
                    <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: isNext ? "var(--accent)" : "var(--text-ghost)" }}>{PRAYER_LABELS[i]}</span>
                    <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, color: isNext ? "var(--text-max)" : "var(--text-dim)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{adhan}</span>
                    <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--text-phantom)", fontVariantNumeric: "tabular-nums" }}>iq {iqama}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Events & Announcements ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24 }}>

        {/* Upcoming Events */}
        <section style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: isMobile ? "20px 16px" : "32px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-max)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Upcoming Events</h2>
            <button onClick={() => setActiveTab("events")}
              style={{ background: "none", border: "none", color: "var(--accent)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              View All
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--text-phantom)", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 10 }}>calendar_month</span>
              <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>No upcoming events</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {upcomingEvents.slice(0, 4).map(ev => {
                const [, mm, dd] = ev.date.split("-");
                const isToday = ev.date === todayISO;
                return (
                  <button key={ev.id} onClick={() => setActiveTab("events")}
                    style={{ width: "100%", textAlign: "left", fontFamily: "Manrope, sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, transition: "background 0.15s, border-color 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "var(--surface-high)"; t.style.borderColor = "var(--surface-highest)"; }}
                    onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "var(--surface-mid)"; t.style.borderColor = "var(--surface-high)"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-high)", border: "1px solid var(--outline-variant)", borderRadius: 2, minWidth: 52, padding: "8px 10px" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{MONTHS_SHORT[parseInt(mm)-1]}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", lineHeight: 1.1 }}>{dd}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-max)" }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{to12h(ev.time)}{ev.endTime ? ` – ${to12h(ev.endTime)}` : ""}</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: isToday ? "var(--accent)" : "var(--outline-variant)" }}>arrow_forward_ios</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Latest Announcements */}
        <section style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: isMobile ? "20px 16px" : "32px", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-max)", margin: "0 0 28px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Latest Announcements</h2>
          {activeAnnouncements.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--text-phantom)", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 10 }}>campaign</span>
              <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>No active announcements</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
              {activeAnnouncements.slice(0, 3).map((ann, i, arr) => (
                <div key={ann.id} style={{ paddingBottom: i < arr.length - 1 ? 20 : 0, marginBottom: i < arr.length - 1 ? 20 : 0, borderBottom: i < arr.length - 1 ? "1px solid var(--surface-low)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, padding: "3px 8px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)", borderRadius: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Announcement
                    </span>
                    {ann.createdAt && (
                      <span style={{ fontSize: 10, color: "var(--text-ghost)", fontWeight: 500 }}>
                        {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-max)", margin: "0 0 6px", lineHeight: 1.35 }}>{ann.title}</h4>
                  <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ann.body}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setActiveTab("announcements")}
            style={{ marginTop: 24, padding: "12px", background: "transparent", border: "1px solid var(--surface-mid)", borderRadius: 2, color: "var(--text-dim)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.2em", transition: "background 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-high)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            All Announcements
          </button>
        </section>

      </div>
    </div>
  );
};

export default OverviewTab;
