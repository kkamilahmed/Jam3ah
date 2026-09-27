import React, { useState } from "react";
import type { Announcement, Event } from "../types";
import { Choice, ConfirmDialog, Icon, Modal, Spinner } from "../ui";
import { addDaysISO, displayTime, fmt12, localISODate, parseISODate, parseTypedTime } from "../time";

export type Composer =
  | { kind: "announcement"; item?: Announcement }
  | { kind: "event"; item?: Event }
  | null;

export interface EventInput { title: string; description: string; date: string; time: string }
export interface AnnouncementInput { title: string; body: string; expiresAt: string | null }

interface EventsTabProps {
  now: Date;
  view: "events" | "announcements";
  setView: (v: "events" | "announcements") => void;
  events: Event[];
  announcements: Announcement[];
  loading: boolean;
  composer: Composer;
  setComposer: (c: Composer) => void;
  onSaveEvent: (input: EventInput, id?: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onSaveAnnouncement: (input: AnnouncementInput, id?: string) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longDate = (iso: string) => parseISODate(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

// ── Announcement form ──────────────────────────────────────────────────────
const AnnouncementForm: React.FC<{
  item?: Announcement;
  onSave: (input: AnnouncementInput) => Promise<void>;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const today = localISODate();
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  type Until = "week" | "today" | "date" | "forever";
  const [until, setUntil] = useState<Until>(item ? (item.expiresAt ? "date" : "forever") : "week");
  const [date, setDate] = useState(item?.expiresAt || addDaysISO(today, 7));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { setError("Please give the announcement a heading."); return; }
    if (!body.trim()) { setError("Please write the message people should read."); return; }
    const expiresAt = until === "week" ? addDaysISO(today, 7) : until === "today" ? today : until === "date" ? date : null;
    if (until === "date" && (!date || date < today)) { setError("Please choose today or a later date."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({ title: title.trim(), body: body.trim(), expiresAt });
    } catch (e) {
      setError((e as Error).message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Modal
      size="wide"
      title={item ? "Edit announcement" : "Post an announcement"}
      subtitle="It shows on the TV screen and in the app."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            {item ? "Save changes" : "Post it"}
          </button>
        </>
      }
    >
      <div className="d-field">
        <label className="d-label" htmlFor="an-title">Heading</label>
        <input id="an-title" className="d-input" placeholder="For example: Jumu'ah parking" value={title} onChange={e => { setTitle(e.target.value); setError(""); }} />
      </div>
      <div className="d-field">
        <label className="d-label" htmlFor="an-body">Message</label>
        <textarea id="an-body" className="d-textarea" rows={4} placeholder="What do you want people to know?" value={body} onChange={e => { setBody(e.target.value); setError(""); }} />
      </div>
      <div className="d-stack" style={{ gap: 10 }} role="radiogroup" aria-label="How long should it show?">
        <span className="d-label">How long should it show?</span>
        <div className="d-grid-2" style={{ gap: 12 }}>
          <Choice name="an-until" checked={until === "week"} onSelect={() => setUntil("week")} title="One week" body={`Until ${longDate(addDaysISO(today, 7))}`} />
          <Choice name="an-until" checked={until === "today"} onSelect={() => setUntil("today")} title="Just today" />
          <Choice name="an-until" checked={until === "date"} onSelect={() => setUntil("date")} title="Until a date I choose">
            {until === "date" && <input type="date" className="d-input" aria-label="Show until" min={today} value={date} onChange={e => setDate(e.target.value)} />}
          </Choice>
          <Choice name="an-until" checked={until === "forever"} onSelect={() => setUntil("forever")} title="Until I remove it" />
        </div>
      </div>
      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
    </Modal>
  );
};

// ── Event form ─────────────────────────────────────────────────────────────
const EventForm: React.FC<{
  item?: Event;
  onSave: (input: EventInput) => Promise<void>;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [date, setDate] = useState(item?.date ?? "");
  const [time, setTime] = useState(item?.time ? displayTime(item.time) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { setError("Please give the event a name."); return; }
    if (!date) { setError("Please choose the day of the event."); return; }
    const t = parseTypedTime(time);
    if (t === null) { setError("Please type the start time, like 7:30 PM."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), date, time: fmt12(t) });
    } catch (e) {
      setError((e as Error).message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Modal
      size="wide"
      title={item ? "Edit event" : "Add an event"}
      subtitle="Events show on the TV screen and in the app."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            {item ? "Save changes" : "Add event"}
          </button>
        </>
      }
    >
      <div className="d-field">
        <label className="d-label" htmlFor="ev-title">Name of the event</label>
        <input id="ev-title" className="d-input" placeholder="For example: Family night" value={title} onChange={e => { setTitle(e.target.value); setError(""); }} />
      </div>
      <div className="d-grid-2">
        <div className="d-field">
          <label className="d-label" htmlFor="ev-date">Day</label>
          <input id="ev-date" type="date" className="d-input" value={date} onChange={e => { setDate(e.target.value); setError(""); }} />
        </div>
        <div className="d-field">
          <label className="d-label" htmlFor="ev-time">Start time</label>
          <input id="ev-time" className="d-input" placeholder="e.g. 7:30 PM" value={time} onChange={e => { setTime(e.target.value); setError(""); }} />
        </div>
      </div>
      <div className="d-field">
        <label className="d-label" htmlFor="ev-desc">Details <span className="d-faint" style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea id="ev-desc" className="d-textarea" rows={3} placeholder="Who is it for, where is it, what should people bring?" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
    </Modal>
  );
};

// ── Tab ────────────────────────────────────────────────────────────────────
const EventsTab: React.FC<EventsTabProps> = ({
  now, view, setView, events, announcements, loading, composer, setComposer,
  onSaveEvent, onDeleteEvent, onSaveAnnouncement, onDeleteAnnouncement,
}) => {
  const today = localISODate(now);
  const [confirm, setConfirm] = useState<{ kind: "event" | "announcement"; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const upcoming = events.filter(e => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const live = announcements.filter(a => !a.expiresAt || a.expiresAt >= today).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ended = announcements.filter(a => a.expiresAt && a.expiresAt < today).sort((a, b) => (b.expiresAt || "").localeCompare(a.expiresAt || ""));

  const doDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === "event") await onDeleteEvent(confirm.id);
      else await onDeleteAnnouncement(confirm.id);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const eventRow = (ev: Event, faded = false) => {
    const d = parseISODate(ev.date);
    return (
      <div key={ev.id} className="d-list-row" style={{ alignItems: "flex-start", opacity: faded ? 0.75 : 1 }}>
        <div className="d-date-chip" aria-hidden="true"><span>{MONTHS[d.getMonth()]}</span><b>{d.getDate()}</b></div>
        <div className="d-stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
          <span className="d-strong" style={{ fontSize: 19 }}>{ev.title}</span>
          <span className="d-muted">{ev.date === today ? "Today" : longDate(ev.date)}{ev.time && ` · ${displayTime(ev.time)}`}</span>
          {ev.description && <span className="d-muted d-small" style={{ whiteSpace: "pre-line" }}>{ev.description}</span>}
        </div>
        <div className="d-row" style={{ gap: 6 }}>
          <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => setComposer({ kind: "event", item: ev })} aria-label={`Edit ${ev.title}`}>Edit</button>
          <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => setConfirm({ kind: "event", id: ev.id, title: ev.title })} aria-label={`Delete ${ev.title}`}>Delete</button>
        </div>
      </div>
    );
  };

  const announcementRow = (a: Announcement, isLive: boolean) => (
    <div key={a.id} className="d-list-row" style={{ alignItems: "flex-start" }}>
      <div className="d-stack" style={{ gap: 6, flex: 1, minWidth: 0 }}>
        <div className="d-row d-row--wrap" style={{ gap: 10 }}>
          <span className="d-strong" style={{ fontSize: 19 }}>{a.title}</span>
          <span className={`d-badge${isLive ? "" : " d-badge--muted"}`}>{isLive ? "Showing now" : "Ended"}</span>
        </div>
        <span style={{ whiteSpace: "pre-line" }}>{a.body}</span>
        <span className="d-muted d-small">
          {a.createdAt && `Posted ${new Date(a.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long" })} · `}
          {a.expiresAt ? `${isLive ? "Showing until" : "Ended on"} ${longDate(a.expiresAt)}` : "Showing until you remove it"}
        </span>
      </div>
      <div className="d-row" style={{ gap: 6 }}>
        <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => setComposer({ kind: "announcement", item: a })} aria-label={`Edit ${a.title}`}>Edit</button>
        <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => setConfirm({ kind: "announcement", id: a.id, title: a.title })} aria-label={`Remove ${a.title}`}>Remove</button>
      </div>
    </div>
  );

  return (
    <div className="d-page d-page--narrow" style={{ maxWidth: 1040 }}>
      <div className="d-page-head">
        <div className="d-stack" style={{ gap: 8 }}>
          <h1 className="d-h1">Announcements &amp; events</h1>
          <p className="d-sub">Everything here shows on your TV screen and in the app.</p>
        </div>
        <button type="button" className="d-btn d-btn--primary" onClick={() => setComposer({ kind: view === "events" ? "event" : "announcement" })}>
          <Icon name="add" />{view === "events" ? "Add an event" : "Post an announcement"}
        </button>
      </div>

      <div className="d-segmented" role="tablist" aria-label="Show">
        <button type="button" role="tab" aria-selected={view === "announcements"} onClick={() => setView("announcements")}>
          <Icon name="campaign" />Announcements{live.length > 0 && <span className="d-badge">{live.length}</span>}
        </button>
        <button type="button" role="tab" aria-selected={view === "events"} onClick={() => setView("events")}>
          <Icon name="event" />Events{upcoming.length > 0 && <span className="d-badge">{upcoming.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="d-card d-empty"><Spinner /><span>Loading…</span></div>
      ) : view === "announcements" ? (
        <section className="d-card d-card-pad" aria-label="Announcements">
          {live.length === 0 && ended.length === 0 ? (
            <div className="d-empty">
              <Icon name="campaign" />
              <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>No announcements yet</span>
              <span>Post one and it appears on the TV screen straight away.</span>
              <button type="button" className="d-btn d-btn--primary" onClick={() => setComposer({ kind: "announcement" })}><Icon name="add" />Post an announcement</button>
            </div>
          ) : (
            <>
              <h2 className="d-h3" style={{ marginBottom: 4 }}>Showing now</h2>
              {live.length === 0 ? <p className="d-muted">Nothing is being announced at the moment.</p> : live.map(a => announcementRow(a, true))}
              {ended.length > 0 && (
                <>
                  <h2 className="d-h3" style={{ margin: "24px 0 4px" }}>Ended</h2>
                  {ended.slice(0, 10).map(a => announcementRow(a, false))}
                </>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="d-card d-card-pad" aria-label="Events">
          {upcoming.length === 0 && past.length === 0 ? (
            <div className="d-empty">
              <Icon name="event" />
              <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>No events yet</span>
              <span>Add classes, talks and community dinners so people know what's on.</span>
              <button type="button" className="d-btn d-btn--primary" onClick={() => setComposer({ kind: "event" })}><Icon name="add" />Add an event</button>
            </div>
          ) : (
            <>
              <h2 className="d-h3" style={{ marginBottom: 4 }}>Coming up</h2>
              {upcoming.length === 0 ? <p className="d-muted">No events planned yet.</p> : upcoming.map(ev => eventRow(ev))}
              {past.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <button type="button" className="d-btn d-btn--ghost d-btn--sm" aria-expanded={showPast} onClick={() => setShowPast(s => !s)}>
                    <Icon name={showPast ? "expand_less" : "expand_more"} />{showPast ? "Hide past events" : `Show past events (${past.length})`}
                  </button>
                  {showPast && past.slice(0, 20).map(ev => eventRow(ev, true))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {composer?.kind === "announcement" && (
        <AnnouncementForm
          item={composer.item}
          onClose={() => setComposer(null)}
          onSave={input => onSaveAnnouncement(input, composer.item?.id)}
        />
      )}
      {composer?.kind === "event" && (
        <EventForm item={composer.item} onClose={() => setComposer(null)} onSave={input => onSaveEvent(input, composer.item?.id)} />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "event" ? "Delete this event?" : "Remove this announcement?"}
          body={<>“{confirm.title}” will disappear from the TV screen and the app. This cannot be undone.</>}
          confirmLabel={confirm.kind === "event" ? "Delete event" : "Remove announcement"}
          danger
          busy={deleting}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default EventsTab;
