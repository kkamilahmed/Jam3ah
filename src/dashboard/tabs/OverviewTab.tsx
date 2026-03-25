import React from "react";
import type { PrayerTime, Event, Announcement } from "../types";
import { THEMES, type ThemeKey } from "../themes";
import { to12h } from "../utils";
import { IslamicPattern, Icon } from "../components/Icon";

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

const OverviewTab: React.FC<OverviewTabProps> = ({
  theme,
  currentTime,
  generalSettings,
  todayRow,
  events,
  announcements,
  prayerTimesByMonth,
  setActiveTab,
  setEventsSubTab,
}) => {
  const todayDate = new Date();
  const todayISO = todayDate.toISOString().slice(0, 10);
  const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  // Find next prayer
  const nowMins = todayDate.getHours() * 60 + todayDate.getMinutes();
  const prayerKeys = ["fajr","dhuhr","asr","maghrib","isha"] as const;
  const prayerMins = prayerKeys.map(k => {
    const t = todayRow?.[k] || "";
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  });
  const nextIdx = prayerMins.findIndex(m => m > nowMins);
  const nextPrayerIdx = nextIdx === -1 ? 0 : nextIdx;

  const upcomingEvents = events.filter(e => e.date >= todayISO).sort((a,b) => a.date.localeCompare(b.date));
  const activeAnnouncements = announcements.filter(a => !a.expiresAt || a.expiresAt >= todayISO);


  const fmt = (t?: string) => t ? to12h(t) : "—";
  const row = todayRow as unknown as Record<string,string> | undefined;

  return (
    <div className="relative">
      <IslamicPattern color={theme.patternColor} opacity={0.025} />
      <div className="relative px-8 py-10">

        {/* ── Hero ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Dashboard</div>
            <h1 className="text-4xl font-black mb-1">{generalSettings.masjidName}</h1>
            <p className="text-zinc-500 font-bold">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black tabular-nums tracking-tight ${theme.accent}`}>
              {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" AM","").replace(" PM","")}
              <span className="text-xl ml-1 text-zinc-500">{currentTime.getHours() >= 12 ? "PM" : "AM"}</span>
            </div>
            <div className="text-zinc-600 text-sm font-bold mt-1">Local Time</div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Upcoming Events",        value: upcomingEvents.length,      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", accent: theme.iconColor, bg: theme.iconBg, action: () => setActiveTab("events") },
            { label: "Active Announcements",   value: activeAnnouncements.length, icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z", accent: "text-sky-400", bg: "bg-sky-500/15 border border-sky-500/30", action: () => setActiveTab("events") },
            { label: "Prayer Days Loaded",     value: Object.values(prayerTimesByMonth).reduce((s,m) => s + m.length, 0), icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", accent: "text-violet-400", bg: "bg-violet-500/15 border border-violet-500/30", action: () => setActiveTab("prayer-times") },
          ].map(s => (
            <button key={s.label} onClick={s.action} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all text-left group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon d={s.icon} className={`w-5 h-5 ${s.accent}`} />
              </div>
              <div className="text-3xl font-black mb-0.5">{s.value}</div>
              <div className="text-xs font-bold text-zinc-500">{s.label}</div>
            </button>
          ))}
        </div>

        {/* ── Prayer Times ── */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${theme.label}`}>Today's Schedule</div>
              <h2 className="text-lg font-black">Prayer Times</h2>
            </div>
            <button onClick={() => setActiveTab("prayer-times")} className={`text-xs font-black uppercase tracking-widest ${theme.accent} hover:opacity-70 transition-opacity`}>Manage →</button>
          </div>
          <div className="grid grid-cols-5 divide-x divide-white/5">
            {prayerKeys.map((key, i) => {
              const isNext = i === nextPrayerIdx && !!todayRow;
              const adhan = fmt(row?.[`${key}_adhan`] || row?.[key]);
              const iqama = fmt(row?.[`${key}_iqama`]);
              const labels = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];
              const arabic = ["الفجر","الظهر","العصر","المغرب","العشاء"];
              return (
                <div key={key} className={`flex flex-col items-center py-6 px-3 transition-all ${isNext ? `${theme.accentBg}` : ""}`}>
                  {isNext && <div className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 py-0.5 rounded-full ${theme.accentBg} ${theme.accent} border ${theme.accentBorder}`}>Next</div>}
                  <div className={`text-base mb-0.5 ${isNext ? theme.accent : "text-zinc-600"}`} style={{ fontFamily: "serif" }}>{arabic[i]}</div>
                  <div className={`text-xs font-black mb-3 ${isNext ? "text-white" : "text-zinc-400"}`}>{labels[i]}</div>
                  <div className={`text-lg font-black tabular-nums ${isNext ? "text-white" : "text-zinc-300"}`}>{adhan}</div>
                  <div className="text-[10px] text-zinc-600 font-bold mt-0.5">Adhan</div>
                  <div className={`text-sm font-bold tabular-nums mt-2 ${isNext ? theme.accent : "text-zinc-500"}`}>{iqama}</div>
                  <div className="text-[10px] text-zinc-600 font-bold mt-0.5">Iqama</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Upcoming Events */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-black">Upcoming Events</h2>
              <button onClick={() => setActiveTab("events")} className={`text-xs font-black uppercase tracking-widest ${theme.accent} hover:opacity-70 transition-opacity`}>View All →</button>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="py-12 text-center text-zinc-700">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-bold">No upcoming events</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {upcomingEvents.slice(0, 4).map(ev => {
                  const [yyyy, mm, dd] = ev.date.split("-");
                  const isToday = ev.date === todayISO;
                  return (
                    <div key={ev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-11 shrink-0 rounded-xl flex flex-col items-center justify-center py-2 ${isToday ? theme.iconBg : "bg-zinc-800/60"}`}>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${isToday ? theme.iconColor : "text-zinc-600"}`}>{MONTHS_SHORT[parseInt(mm)-1]}</div>
                        <div className={`text-lg font-black leading-none mt-0.5 ${isToday ? "text-white" : "text-zinc-400"}`}>{dd}</div>
                        <div className={`text-[8px] font-bold ${isToday ? "text-zinc-400" : "text-zinc-600"}`}>{yyyy}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-white truncate">{ev.title}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{to12h(ev.time)}{ev.endTime ? ` – ${to12h(ev.endTime)}` : ""}</div>
                      </div>
                      {isToday && <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${theme.accentBg} ${theme.accent} border ${theme.accentBorder}`}>Today</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Announcements */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-black">Announcements</h2>
              <button onClick={() => { setActiveTab("events"); setEventsSubTab("announcements"); }} className={`text-xs font-black uppercase tracking-widest ${theme.accent} hover:opacity-70 transition-opacity`}>View All →</button>
            </div>
            {activeAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-zinc-700">
                <Icon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-bold">No active announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeAnnouncements.slice(0, 4).map(ann => (
                  <div key={ann.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="font-black text-sm text-white mb-1 truncate">{ann.title}</div>
                    <div className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{ann.body}</div>
                    {ann.expiresAt && (
                      <div className="text-zinc-600 text-[10px] font-bold mt-1.5">
                        Expires {new Date(ann.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
