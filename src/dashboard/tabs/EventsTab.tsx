import React from "react";
import { supabaseAdmin } from "../../lib/supabase";
import type { Event, EventForm, Announcement } from "../types";
import { THEMES, type ThemeKey } from "../themes";
import { to12h, formatTimeInput } from "../utils";
import { makeInputCls, labelCls } from "../constants";
import { Icon } from "../components/Icon";
import LocalInput from "../components/LocalInput";
import DatePicker from "../components/DatePicker";

interface EventsTabProps {
  theme: typeof THEMES[ThemeKey];
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  eventsLoading: boolean;
  eventsSubTab: "events" | "announcements";
  setEventsSubTab: React.Dispatch<React.SetStateAction<"events" | "announcements">>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  editingEvent: Event | null;
  setEditingEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  editingAnnouncement: Announcement | null;
  setEditingAnnouncement: React.Dispatch<React.SetStateAction<Announcement | null>>;
  announcementForm: { title: string; body: string; expiresAt: string };
  setAnnouncementForm: React.Dispatch<React.SetStateAction<{ title: string; body: string; expiresAt: string }>>;
  eventForm: EventForm;
  setEventForm: React.Dispatch<React.SetStateAction<EventForm>>;
  eventsPanel: boolean;
  setEventsPanel: React.Dispatch<React.SetStateAction<boolean>>;
  handleEventSubmit: () => Promise<void>;
  handleDeleteEvent: (id: string) => Promise<void>;
  handleEditEvent: (event: Event) => void;
}

const EventsTab: React.FC<EventsTabProps> = ({
  theme,
  events,
  setEvents: _setEvents,
  eventsLoading,
  eventsSubTab,
  setEventsSubTab,
  announcements,
  setAnnouncements,
  editingEvent,
  setEditingEvent,
  editingAnnouncement,
  setEditingAnnouncement,
  announcementForm,
  setAnnouncementForm,
  eventForm,
  setEventForm,
  eventsPanel,
  setEventsPanel,
  handleEventSubmit,
  handleDeleteEvent,
  handleEditEvent,
}) => {
  const inputCls = makeInputCls(theme.inputFocus);
  const today = new Date().toISOString().slice(0, 10);
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  const openNewEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: "", description: "", date: "", time: "", endTime: "", category: "General" });
    setEventsPanel(true);
  };
  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", body: "", expiresAt: "" });
    setEventsPanel(true);
  };
  const closePanel = () => {
    setEventsPanel(false);
    setEditingEvent(null);
    setEditingAnnouncement(null);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 73px)" }}>

      {/* ── Left: List panel ── */}
      <div
        className="flex-1 overflow-y-auto border-r border-transparent"
        style={{
          maxHeight: "calc(100vh - 73px)",
          borderRightColor: eventsPanel ? "rgba(255,255,255,0.08)" : "transparent",
          transition: "border-color 0.35s ease",
        }}
      >
        <div className="px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${theme.label}`}>Management</div>
              <h1 className="text-3xl font-black">Events & Announcements</h1>
            </div>
            <button
              onClick={eventsSubTab === "events" ? openNewEvent : openNewAnnouncement}
              className={`px-5 py-2.5 ${theme.btn} rounded-xl font-black text-sm hover:scale-105 transition-all`}
            >
              + {eventsSubTab === "events" ? "New Event" : "New Announcement"}
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1 w-fit mb-7">
            {([
              { k: "events" as const,        label: "Events",        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { k: "announcements" as const, label: "Announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
            ]).map(t => (
              <button
                key={t.k}
                onClick={() => { setEventsSubTab(t.k); setEventsPanel(false); setEditingEvent(null); setEditingAnnouncement(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${eventsSubTab === t.k ? `${theme.accentBg} ${theme.accent}` : "text-zinc-500 hover:text-white"}`}
              >
                <Icon d={t.icon} className="w-4 h-4" />
                {t.label}
                {t.k === "announcements" && announcements.length > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${eventsSubTab === t.k ? "bg-black/20" : "bg-zinc-700 text-zinc-300"}`}>
                    {announcements.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Events list ── */}
          {eventsSubTab === "events" && (
            <div>
              {eventsLoading ? (
                <div className="text-center py-20 text-zinc-600">
                  <svg className="animate-spin w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-sm font-bold">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-20 text-zinc-700">
                  <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-black">No events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
                    const [yyyy, mm, dd] = ev.date.split("-");
                    const isToday = ev.date === today;
                    const isPast = ev.date < today;
                    const isEditing = editingEvent?.id === ev.id && eventsPanel;
                    return (
                      <div
                        key={ev.id}
                        className={`bg-zinc-900/60 border rounded-2xl p-4 flex items-center gap-4 transition-all ${
                          isEditing ? `${theme.accentBorder} ${theme.accentBg}` : isToday ? `${theme.accentBorder}` : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`w-12 shrink-0 rounded-xl flex flex-col items-center justify-center py-2 ${isPast ? "bg-zinc-800/60" : isToday ? "bg-black/20" : theme.iconBg}`}>
                          <div className={`text-[9px] font-black uppercase tracking-widest ${isPast ? "text-zinc-600" : theme.iconColor}`}>{MONTHS[parseInt(mm) - 1]}</div>
                          <div className={`text-xl font-black leading-none mt-0.5 ${isPast ? "text-zinc-500" : "text-white"}`}>{dd}</div>
                          <div className={`text-[9px] font-bold ${isPast ? "text-zinc-600" : "text-zinc-400"}`}>{yyyy}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className={`font-black text-sm ${isPast ? "text-zinc-400" : "text-white"}`}>{ev.title}</h3>
                            {isToday && (
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${theme.accentBg} ${theme.accent} border ${theme.accentBorder}`}>Today</span>
                            )}
                          </div>
                          <p className="text-zinc-500 text-xs truncate">{ev.description}</p>
                          <span className="text-zinc-600 text-xs font-bold">{to12h(ev.time)}{ev.endTime ? ` – ${to12h(ev.endTime)}` : ""}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditEvent(ev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isEditing ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-white/8 text-zinc-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >Edit</button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                          >Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Announcements list ── */}
          {eventsSubTab === "announcements" && (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-20 text-zinc-700">
                  <Icon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-black">No announcements yet</p>
                </div>
              ) : sortedAnnouncements.map(ann => {
                const isEditing = editingAnnouncement?.id === ann.id && eventsPanel;
                return (
                  <div
                    key={ann.id}
                    className={`bg-zinc-900/60 border rounded-2xl p-5 transition-all ${isEditing ? `${theme.accentBorder} ${theme.accentBg}` : "border-white/5 hover:border-white/10"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white text-sm mb-1">{ann.title}</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-3">{ann.body}</p>
                        <div className="flex items-center gap-3">
                          {ann.createdAt && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              Posted {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          {ann.expiresAt && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${new Date(ann.expiresAt) < new Date() ? "text-red-400" : "text-zinc-500"}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Expires {new Date(ann.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => { setEditingAnnouncement(ann); setAnnouncementForm({ title: ann.title, body: ann.body, expiresAt: ann.expiresAt }); setEventsPanel(true); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isEditing ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-white/8 text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >Edit</button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this announcement?")) return;
                            const { error } = await supabaseAdmin.from("announcements").delete().eq("id", ann.id);
                            if (error) { alert("Failed to delete: " + error.message); return; }
                            setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        >Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div
        style={{
          width: eventsPanel ? "50%" : "0",
          maxHeight: "calc(100vh - 73px)",
          overflow: eventsPanel ? "auto" : "hidden",
          transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            opacity: eventsPanel ? 1 : 0,
            transform: eventsPanel ? "translateX(0)" : "translateX(24px)",
            transition: "opacity 0.25s ease 0.1s, transform 0.25s ease 0.1s",
            minWidth: "400px",
          }}
        >
          <div className="px-8 py-8">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${theme.label}`}>
                  {eventsSubTab === "events" ? "Event" : "Announcement"}
                </div>
                <h2 className="text-2xl font-black">
                  {eventsSubTab === "events"
                    ? (editingEvent ? "Edit Event" : "New Event")
                    : (editingAnnouncement ? "Edit Announcement" : "New Announcement")}
                </h2>
              </div>
              <button
                onClick={closePanel}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/60 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
              </button>
            </div>

            {/* ── Event form ── */}
            {eventsSubTab === "events" && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Title <span className="text-red-400">*</span></label>
                  <LocalInput type="text" placeholder="e.g. Friday Khutbah" value={eventForm.title}
                    onCommit={v => setEventForm(p => ({ ...p, title: v }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={4} placeholder="Describe the event..." value={eventForm.description}
                    onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                    className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Date <span className="text-red-400">*</span></label>
                  <DatePicker value={eventForm.date} onChange={v => setEventForm(p => ({ ...p, date: v }))} placeholder="Select date" align="left" fullWidth />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Time <span className="text-red-400">*</span></label>
                    <LocalInput type="text" placeholder="e.g. 1:30 PM" value={eventForm.time}
                      onCommit={v => setEventForm(p => ({ ...p, time: formatTimeInput(v) || v }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Time <span className="text-zinc-600">(optional)</span></label>
                    <LocalInput type="text" placeholder="e.g. 3:00 PM" value={eventForm.endTime}
                      onCommit={v => setEventForm(p => ({ ...p, endTime: formatTimeInput(v) || v }))} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closePanel} className="flex-1 py-3 rounded-xl font-bold border border-white/10 text-zinc-400 hover:bg-white/5 transition-all">Cancel</button>
                  <button onClick={handleEventSubmit} className={`flex-1 py-3 ${theme.btn} rounded-xl font-black transition-all hover:scale-[1.02]`}>
                    {editingEvent ? "Save Changes" : "Create Event"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Announcement form ── */}
            {eventsSubTab === "announcements" && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Title <span className="text-red-400">*</span></label>
                  <LocalInput type="text" placeholder="Announcement title" value={announcementForm.title}
                    onCommit={v => setAnnouncementForm(p => ({ ...p, title: v }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Body <span className="text-red-400">*</span></label>
                  <textarea rows={5} placeholder="Write your announcement..." value={announcementForm.body}
                    onChange={e => setAnnouncementForm(p => ({ ...p, body: e.target.value }))}
                    className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Expires (optional)</label>
                  <DatePicker value={announcementForm.expiresAt} onChange={v => setAnnouncementForm(p => ({ ...p, expiresAt: v }))} placeholder="Select expiry date" align="left" fullWidth />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closePanel} className="flex-1 py-3 rounded-xl font-bold border border-white/10 text-zinc-400 hover:bg-white/5 transition-all">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!announcementForm.title || !announcementForm.body) return;
                      const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
                      const row = { masjid_id: masjidId, title: announcementForm.title, body: announcementForm.body, expires_at: announcementForm.expiresAt || null };
                      if (editingAnnouncement) {
                        const { error } = await supabaseAdmin.from("announcements").update(row).eq("id", editingAnnouncement.id);
                        if (error) { alert("Failed to save: " + error.message); return; }
                        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? { ...a, ...announcementForm } : a));
                      } else {
                        const { data, error } = await supabaseAdmin.from("announcements").insert(row).select().single();
                        if (error) { alert("Failed to post: " + error.message); return; }
                        setAnnouncements(prev => [...prev, { id: data.id, title: data.title, body: data.body || "", createdAt: data.created_at || today, expiresAt: data.expires_at || "" }]);
                      }
                      closePanel();
                    }}
                    className={`flex-1 py-3 ${theme.btn} rounded-xl font-black transition-all hover:scale-[1.02]`}
                  >
                    {editingAnnouncement ? "Save Changes" : "Post Announcement"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsTab;
