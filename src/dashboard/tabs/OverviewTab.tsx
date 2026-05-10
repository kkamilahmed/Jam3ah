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
  setActiveTab: (tab: string) => void;
  setEventsSubTab: (tab: "events" | "announcements") => void;
}

const PRAYER_ICONS = ["wb_twilight", "light_mode", "partly_cloudy_day", "wb_shade", "bedtime"];
const PRAYER_LABELS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

const OverviewTab: React.FC<OverviewTabProps> = ({
  currentTime, generalSettings, todayRow, events, announcements,
  prayerTimesByMonth, setActiveTab, setEventsSubTab,
}) => {
  const todayDate = new Date();
  const todayISO = todayDate.toISOString().slice(0, 10);

  const nowMins = todayDate.getHours() * 60 + todayDate.getMinutes();
  const prayerKeys = ["fajr","dhuhr","asr","maghrib","isha"] as const;
  const prayerMins = prayerKeys.map(k => {
    const t = (todayRow as unknown as Record<string,string>)?.[k] || "";
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  });
  const nextIdx = prayerMins.findIndex(m => m > nowMins);
  const nextPrayerIdx = nextIdx === -1 ? 0 : nextIdx;

  const row = todayRow as unknown as Record<string,string> | undefined;
  const fmt = (t?: string) => t ? to12h(t) : "—";

  const upcomingEvents = events.filter(e => e.date >= todayISO).sort((a,b) => a.date.localeCompare(b.date));
  const activeAnnouncements = announcements.filter(a => !a.expiresAt || a.expiresAt >= todayISO);
  const statCards = [
    { label: "Upcoming Events", sublabel: "Next 30 Days", value: upcomingEvents.length, icon: "calendar_month", action: () => setActiveTab("events") },
    { label: "Active Announcements", sublabel: "Live Now", value: activeAnnouncements.length, icon: "campaign", action: () => { setActiveTab("events"); setEventsSubTab("announcements"); } },
    { label: "Subscribers", sublabel: "Community", value: 0, icon: "group", action: () => {} },
  ];

  const hijriDate = new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(currentTime);
  const isMobile = useIsMobile();

  return (
    <div style={{ padding: isMobile ? "24px 16px 60px" : "48px 40px 80px", fontFamily: "Manrope, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: isMobile ? 24 : 48, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: isMobile ? 12 : 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
            Administrator Dashboard
          </p>
          <h1 style={{ fontSize: isMobile ? 22 : 42, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-max)", margin: "4px 0 0", lineHeight: 1.2 }}>
            {isMobile ? <>As-salamu Alaykum, <span style={{ color: "var(--accent)" }}>{generalSettings.masjidName || "Admin"}</span>.</> : <>Assalamu Alaikum Warahmatullahi Wabarakatuh,{" "}<span style={{ color: "var(--accent)" }}>{generalSettings.masjidName || "Admin"}</span>.</>}
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
        </div>
      </header>

      {/* ── Stats Grid ── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <button key={s.label} onClick={s.action}
            style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: isMobile ? "16px" : "24px", textAlign: "left", cursor: "pointer", transition: "background 0.2s", display: "flex", flexDirection: "column", gap: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#252525"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-low)"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: "var(--accent-bg)", border: "1px solid var(--accent-bg)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent)" }}>{s.icon}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{s.sublabel}</span>
            </div>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </button>
        ))}

      </section>

      {/* ── Prayer Schedule ── */}
      <section style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: isMobile ? "20px 16px" : "32px", marginBottom: 24 }}>
        <div style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h2 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-max)", margin: "0 0 4px" }}>Today's Prayer Schedule</h2>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
            {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prayerKeys.map((key, i) => {
              const isNext = i === nextPrayerIdx && !!todayRow;
              const adhan = fmt(row?.[`${key}_adhan`] || row?.[key]);
              const iqama = fmt(row?.[`${key}_iqama`]);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, background: isNext ? "rgba(52,211,153,0.04)" : "var(--surface-mid)", borderRadius: 2, padding: "14px 16px", outline: isNext ? "1px solid var(--accent-bg)" : "1px solid var(--surface-high)", borderLeft: isNext ? "3px solid var(--accent)" : "3px solid transparent" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>{PRAYER_ICONS[i]}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isNext ? "#e8e8e8" : "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", width: 64, flexShrink: 0 }}>{PRAYER_LABELS[i]}</div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 9, color: isNext ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Adhan</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.5)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{adhan}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 9, color: isNext ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Iqama</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.5)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{iqama}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {prayerKeys.map((key, i) => {
            const isNext = i === nextPrayerIdx && !!todayRow;
            const adhan = fmt(row?.[`${key}_adhan`] || row?.[key]);
            const iqama = fmt(row?.[`${key}_iqama`]);
            return (
              <div key={key}
                style={{
                  background: isNext ? "rgba(52,211,153,0.04)" : "var(--surface-mid)",
                  border: "1px solid transparent",
                  borderTop: isNext ? "3px solid var(--accent)" : "3px solid transparent",
                  borderRadius: 2,
                  padding: "24px 16px",
                  textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  boxShadow: isNext ? "0 0 32px rgba(52,211,153,0.06)" : "none",
                  outline: isNext ? "1px solid var(--accent-bg)" : "1px solid var(--surface-high)",
                  transition: "all 0.15s",
                }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize: 22, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.25)", marginBottom: 10 }}>
                  {PRAYER_ICONS[i]}
                </span>
                <div style={{ fontSize: 11, fontWeight: 700, color: isNext ? "#e8e8e8" : "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
                  {PRAYER_LABELS[i]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
                  <div>
                    <p style={{ fontSize: 9, color: isNext ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 3px" }}>Adhan</p>
                    <p style={{ fontSize: isNext ? 18 : 15, fontWeight: isNext ? 800 : 700, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.5)", margin: 0, letterSpacing: isNext ? "-0.02em" : "0", fontVariantNumeric: "tabular-nums" }}>{adhan}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: isNext ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 3px" }}>Iqama</p>
                    <p style={{ fontSize: isNext ? 18 : 15, fontWeight: isNext ? 800 : 700, color: isNext ? "var(--accent)" : "rgba(255,255,255,0.5)", margin: 0, letterSpacing: isNext ? "-0.02em" : "0", fontVariantNumeric: "tabular-nums" }}>{iqama}</p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
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
                  <div key={ev.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, transition: "background 0.15s, border-color 0.15s", cursor: "default" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1d1d1d"; (e.currentTarget as HTMLElement).style.borderColor = "#252525"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-mid)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-high)"; }}>
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
                  </div>
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
          <button onClick={() => { setActiveTab("events"); setEventsSubTab("announcements"); }}
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
