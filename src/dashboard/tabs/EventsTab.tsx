import React from "react";
import { supabaseAdmin } from "../../lib/supabase";
import type { Event, EventForm, Announcement } from "../types";
import type { THEMES, ThemeKey } from "../themes";
import { to12h, formatTimeInput } from "../utils";
import LocalInput from "../components/LocalInput";
import DatePicker from "../components/DatePicker";
import useIsMobile from "../../hooks/useIsMobile";

interface EventsTabProps {
  theme: typeof THEMES[ThemeKey];
  events: Event[];
  eventsLoading: boolean;
  eventsSubTab: "events" | "announcements";
  openNewEvent: () => void;
  openNewAnnouncement: () => void;
  showToast: (message: string, kind?: "success" | "error") => void;
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

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "var(--surface-low)",
  border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--on-surface)",
  fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 500,
  outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-ghost)", marginBottom: 6 };

const EventsTab: React.FC<EventsTabProps> = ({
  events, eventsLoading, eventsSubTab,
  openNewEvent, openNewAnnouncement, showToast,
  announcements, setAnnouncements, editingEvent, setEditingEvent,
  editingAnnouncement, setEditingAnnouncement, announcementForm, setAnnouncementForm,
  eventForm, setEventForm, eventsPanel, setEventsPanel,
  handleEventSubmit, handleDeleteEvent, handleEditEvent,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const isMobile = useIsMobile();

  const navH = 60;

  const closePanel = () => {
    setEventsPanel(false);
    setEditingEvent(null);
    setEditingAnnouncement(null);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const formPanel = (
    <div style={{ padding: isMobile ? "20px 16px 40px" : "28px 28px" }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--outline)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {eventsSubTab === "events" ? "Event" : "Announcement"}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--on-surface)", margin: 0 }}>
            {eventsSubTab === "events"
              ? (editingEvent ? "Edit Event" : "New Event")
              : (editingAnnouncement ? "Edit Announcement" : "New Announcement")}
          </h2>
        </div>
        <button onClick={closePanel}
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, cursor: "pointer" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-ghost)" }}>close</span>
        </button>
      </div>

      {/* Event form */}
      {eventsSubTab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Title <span style={{ color: "#f87171" }}>*</span></label>
            <LocalInput type="text" placeholder="e.g. Friday Khutbah" value={eventForm.title}
              onCommit={v => setEventForm(p => ({ ...p, title: v }))}
              className="" style={inp} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea rows={3} placeholder="Describe the event..." value={eventForm.description}
              onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
              style={{ ...inp, resize: "none" }} />
          </div>
          <div>
            <label style={lbl}>Date <span style={{ color: "#f87171" }}>*</span></label>
            <DatePicker value={eventForm.date} onChange={v => setEventForm(p => ({ ...p, date: v }))} placeholder="Select date" align="left" fullWidth />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Start Time <span style={{ color: "#f87171" }}>*</span></label>
              <LocalInput type="text" placeholder="1:30 PM" value={eventForm.time}
                onCommit={v => setEventForm(p => ({ ...p, time: formatTimeInput(v) || v }))}
                className="" style={inp} />
            </div>
            <div>
              <label style={lbl}>End Time</label>
              <LocalInput type="text" placeholder="3:00 PM" value={eventForm.endTime}
                onCommit={v => setEventForm(p => ({ ...p, endTime: formatTimeInput(v) || v }))}
                className="" style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
            <button onClick={closePanel}
              style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--text-ghost)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleEventSubmit}
              style={{ flex: 1, padding: "11px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
              {editingEvent ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </div>
      )}

      {/* Announcement form */}
      {eventsSubTab === "announcements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Title <span style={{ color: "#f87171" }}>*</span></label>
            <LocalInput type="text" placeholder="Announcement title" value={announcementForm.title}
              onCommit={v => setAnnouncementForm(p => ({ ...p, title: v }))}
              className="" style={inp} />
          </div>
          <div>
            <label style={lbl}>Body <span style={{ color: "#f87171" }}>*</span></label>
            <textarea rows={5} placeholder="Write your announcement..." value={announcementForm.body}
              onChange={e => setAnnouncementForm(p => ({ ...p, body: e.target.value }))}
              style={{ ...inp, resize: "none" }} />
          </div>
          <div>
            <label style={lbl}>Expires (optional)</label>
            <DatePicker value={announcementForm.expiresAt} onChange={v => setAnnouncementForm(p => ({ ...p, expiresAt: v }))} placeholder="Select expiry date" align="left" fullWidth />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
            <button onClick={closePanel}
              style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--text-ghost)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button
              onClick={async () => {
                if (!announcementForm.title || !announcementForm.body) {
                  showToast("Fill in all required fields", "error");
                  return;
                }
                const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
                const row = { masjid_id: masjidId, title: announcementForm.title, body: announcementForm.body, expires_at: announcementForm.expiresAt || null };
                const wasEditing = !!editingAnnouncement;
                if (editingAnnouncement) {
                  const { error } = await supabaseAdmin.from("announcements").update(row).eq("id", editingAnnouncement.id);
                  if (error) { showToast("Failed to save announcement: " + error.message, "error"); return; }
                  setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? { ...a, ...announcementForm } : a));
                } else {
                  const { data, error } = await supabaseAdmin.from("announcements").insert(row).select().single();
                  if (error) { showToast("Failed to post announcement: " + error.message, "error"); return; }
                  setAnnouncements(prev => [...prev, { id: data.id, title: data.title, body: data.body || "", createdAt: data.created_at || today, expiresAt: data.expires_at || "" }]);
                }
                closePanel();
                showToast(wasEditing ? "Announcement updated" : "Announcement posted");
              }}
              style={{ flex: 1, padding: "11px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
              {editingAnnouncement ? "Save Changes" : "Post Announcement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: `calc(100vh - ${navH}px)`, fontFamily: "Manrope, sans-serif" }}>

      {/* Mobile full-screen overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {eventsPanel && (
            <div onClick={closePanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />
          )}
          {/* Slide-up sheet */}
          <div style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
            background: "var(--surface)",
            borderRadius: "16px 16px 0 0",
            border: "1px solid var(--outline-variant)",
            maxHeight: "90dvh",
            overflowY: "auto",
            transform: eventsPanel ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}>
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, background: "var(--outline-variant)", borderRadius: 2 }} />
            </div>
            {formPanel}
          </div>
        </>
      )}

      {/* Left panel — list */}
      <div style={{ flex: 1, overflowY: "auto", maxHeight: `calc(100vh - ${navH}px)`, borderRight: (!isMobile && eventsPanel) ? "1px solid var(--surface-mid)" : "1px solid transparent", transition: "border-color 0.3s" }}>
        <div style={{ padding: isMobile ? "20px 16px 80px" : "28px 28px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: isMobile ? "center" : "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <div>
              {!isMobile && <div style={{ fontSize: 10, fontWeight: 600, color: "var(--outline)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Management</div>}
              <h1 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "var(--on-surface)", margin: 0, letterSpacing: "-0.02em" }}>
                {eventsSubTab === "events" ? "Events" : "Announcements"}
              </h1>
            </div>
            <button onClick={eventsSubTab === "events" ? openNewEvent : openNewAnnouncement}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "8px 12px" : "9px 16px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: "pointer", transition: "background 0.12s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              {eventsSubTab === "events" ? "New Event" : "New Announcement"}
            </button>
          </div>

          {/* Events grid */}
          {eventsSubTab === "events" && (
            <div>
              {eventsLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--outline)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8, animation: "spin 1s linear infinite" }}>progress_activity</span>
                  <p style={{ fontSize: 13, margin: 0 }}>Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--outline-variant)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 10 }}>calendar_month</span>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>No events yet</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
                    const [yyyy, mm, dd] = ev.date.split("-");
                    const isToday = ev.date === today;
                    const isPast = ev.date < today;
                    const isEditing = editingEvent?.id === ev.id && eventsPanel;
                    return (
                      <div key={ev.id}
                        style={{ display: "flex", flexDirection: "column", padding: "20px", background: isEditing ? "var(--surface-low)" : "var(--surface)", border: `1px solid ${isEditing ? "var(--outline-variant)" : "var(--surface-mid)"}`, borderRadius: 2, transition: "border-color 0.12s", gap: 14 }}
                        onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}
                        onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-mid)"; }}>
                        {/* Card top: date + today badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ width: 52, height: 56, background: isPast ? "var(--bg)" : "var(--surface-mid)", border: `1px solid ${isPast ? "var(--surface-mid)" : "var(--surface-highest)"}`, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: isPast ? "var(--outline-variant)" : "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{MONTHS[parseInt(mm)-1]}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: isPast ? "var(--outline)" : "var(--on-surface)", lineHeight: 1.1 }}>{dd}</div>
                            <div style={{ fontSize: 9, color: "var(--outline-variant)", fontWeight: 500 }}>{yyyy}</div>
                          </div>
                          {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2 }}>Today</span>}
                        </div>
                        {/* Card body */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: isPast ? "var(--text-phantom)" : "var(--on-surface)", marginBottom: 6, lineHeight: 1.3 }}>{ev.title}</div>
                          {ev.description && <div style={{ fontSize: 12, color: "var(--outline)", lineHeight: 1.55, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.description}</div>}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--outline)" }}>schedule</span>
                            <span style={{ fontSize: 12, color: "var(--text-phantom)", fontWeight: 500 }}>{to12h(ev.time)}{ev.endTime ? ` – ${to12h(ev.endTime)}` : ""}</span>
                          </div>
                        </div>
                        {/* Card actions */}
                        <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--surface-mid)", paddingTop: 14 }}>
                          <button onClick={() => handleEditEvent(ev)}
                            style={{ flex: 1, padding: "7px 0", background: isEditing ? "var(--surface-high)" : "var(--surface-low)", border: `1px solid ${isEditing ? "var(--outline-variant)" : "var(--surface-high)"}`, borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => handleDeleteEvent(ev.id)}
                            style={{ flex: 1, padding: "7px 0", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 2, color: "#f87171", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Announcements grid */}
          {eventsSubTab === "announcements" && (
            <div>
              {announcements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--outline-variant)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 10 }}>campaign</span>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>No announcements yet</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {sortedAnnouncements.map(ann => {
                    const isEditing = editingAnnouncement?.id === ann.id && eventsPanel;
                    const isExpired = ann.expiresAt ? new Date(ann.expiresAt) < new Date() : false;
                    return (
                      <div key={ann.id}
                        style={{ display: "flex", flexDirection: "column", padding: "20px", background: isEditing ? "var(--surface-low)" : "var(--surface)", border: `1px solid ${isEditing ? "var(--outline-variant)" : "var(--surface-mid)"}`, borderRadius: 2, transition: "border-color 0.12s", gap: 14 }}
                        onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}
                        onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-mid)"; }}>
                        {/* Card top: icon + expired badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ width: 36, height: 36, background: "var(--accent-bg)", border: "1px solid var(--accent-bg)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent)" }}>campaign</span>
                          </div>
                          {isExpired && <span style={{ fontSize: 9, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2 }}>Expired</span>}
                        </div>
                        {/* Card body */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--on-surface)", marginBottom: 8, lineHeight: 1.3 }}>{ann.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text-phantom)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ann.body}</div>
                        </div>
                        {/* Card meta */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {ann.createdAt && <span style={{ fontSize: 11, color: "var(--outline-variant)", fontWeight: 500 }}>Posted {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {ann.expiresAt && <span style={{ fontSize: 11, fontWeight: 500, color: isExpired ? "#f87171" : "var(--outline-variant)" }}>Expires {new Date(ann.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                        </div>
                        {/* Card actions */}
                        <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--surface-mid)", paddingTop: 14 }}>
                          <button
                            onClick={() => { setEditingAnnouncement(ann); setAnnouncementForm({ title: ann.title, body: ann.body, expiresAt: ann.expiresAt }); setEventsPanel(true); }}
                            style={{ flex: 1, padding: "7px 0", background: isEditing ? "var(--surface-high)" : "var(--surface-low)", border: `1px solid ${isEditing ? "var(--outline-variant)" : "var(--surface-high)"}`, borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Edit</button>
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this announcement?")) return;
                              const { error } = await supabaseAdmin.from("announcements").delete().eq("id", ann.id);
                              if (error) { showToast("Failed to delete announcement: " + error.message, "error"); return; }
                              setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                              showToast("Announcement deleted");
                            }}
                            style={{ flex: 1, padding: "7px 0", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 2, color: "#f87171", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop right form panel */}
      {!isMobile && (
        <div style={{ width: eventsPanel ? "42%" : 0, maxHeight: `calc(100vh - ${navH}px)`, overflow: eventsPanel ? "auto" : "hidden", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}>
          <div style={{ opacity: eventsPanel ? 1 : 0, transform: eventsPanel ? "translateX(0)" : "translateX(20px)", transition: "opacity 0.2s ease 0.08s, transform 0.2s ease 0.08s", minWidth: 360 }}>
            {formPanel}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EventsTab;
