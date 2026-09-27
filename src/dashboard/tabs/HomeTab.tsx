import React from "react";
import type { Announcement, Event, PrayerTime } from "../types";
import { Icon } from "../ui";
import { PRAYER_KEYS, PRAYER_NAMES, adhanOf, describePeriod, describeRule, iqamaOf, type IqamaPeriod, type IqamaRule, type PrayerKey } from "../iqama";
import { addDaysISO, displayTime, formatCountdown, formatHijri, formatLongDate, localISODate, parseISODate, toMinutes } from "../time";

interface HomeTabProps {
  masjidName: string;
  now: Date;
  todayRow: PrayerTime | undefined;
  tomorrowRow: PrayerTime | undefined;
  rules: Record<PrayerKey, IqamaRule | null>;
  // The seasonal period in charge today, if any, for each prayer.
  periodsToday: Record<PrayerKey, IqamaPeriod | null>;
  jummahTimes: string[];
  scheduleEnd: string | null;
  scheduleLoading: boolean;
  phoneMissing: boolean;
  events: Event[];
  announcements: Announcement[];
  onChangeIqama: (key: PrayerKey) => void;
  onGoPrayerTimes: () => void;
  onGoSettings: () => void;
  onNewAnnouncement: () => void;
  onNewEvent: () => void;
  onSeeAnnouncements: () => void;
  onSeeEvents: () => void;
  onEditAnnouncement: (a: Announcement) => void;
  onOpenTv: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const HomeTab: React.FC<HomeTabProps> = ({
  masjidName, now, todayRow, tomorrowRow, rules, periodsToday, jummahTimes, scheduleEnd, scheduleLoading, phoneMissing,
  events, announcements, onChangeIqama, onGoPrayerTimes, onGoSettings, onNewAnnouncement,
  onNewEvent, onSeeAnnouncements, onSeeEvents, onEditAnnouncement, onOpenTv,
}) => {
  const today = localISODate(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const adhanMins = Object.fromEntries(PRAYER_KEYS.map(k => [k, toMinutes(adhanOf(todayRow, k))])) as Record<PrayerKey, number | null>;
  const nextKey = PRAYER_KEYS.find(k => (adhanMins[k] ?? -1) > nowMins) ?? null;

  const upcomingEvents = events.filter(e => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const eventsSoon = upcomingEvents.filter(e => e.date <= addDaysISO(today, 30));
  const liveAnnouncements = announcements
    .filter(a => !a.expiresAt || a.expiresAt >= today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  type Attention = { tone: "warn" | "ok"; text: string; action?: { label: string; run: () => void } };
  const attention: Attention[] = [];
  if (!scheduleLoading) {
    if (!scheduleEnd) {
      attention.push({ tone: "warn", text: "There are no prayer times yet", action: { label: "Set up prayer times", run: onGoPrayerTimes } });
    } else if (scheduleEnd < addDaysISO(today, 30)) {
      attention.push({
        tone: "warn",
        text: `Prayer times run out on ${parseISODate(scheduleEnd).toLocaleDateString("en-US", { day: "numeric", month: "long" })}`,
        action: { label: "Add more prayer times", run: onGoPrayerTimes },
      });
    }
  }
  if (phoneMissing) attention.push({ tone: "warn", text: "Your masjid's phone number is missing", action: { label: "Add it in Settings", run: onGoSettings } });
  if (eventsSoon.length === 0) attention.push({ tone: "warn", text: "No events planned in the next 30 days", action: { label: "Add an event", run: onNewEvent } });
  if (!scheduleLoading && scheduleEnd && scheduleEnd >= addDaysISO(today, 30)) {
    attention.push({ tone: "ok", text: `Prayer times are ready until ${parseISODate(scheduleEnd).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}` });
  }

  const hijri = formatHijri(now);
  const nextName = nextKey ? PRAYER_NAMES[nextKey] : null;
  const nextIn = nextKey && adhanMins[nextKey] !== null ? formatCountdown((adhanMins[nextKey] as number) - nowMins) : "";

  return (
    <div className="d-page">
      <div className="d-page-head">
        <div className="d-stack" style={{ gap: 6 }}>
          <span className="d-sub">Assalamu alaikum</span>
          <h1 className="d-h1">Today at {masjidName}</h1>
          <span className="d-sub">{formatLongDate(now)}{hijri && ` · ${hijri}`}</span>
        </div>
      </div>

      <div className="d-home-grid">
        <div className="d-stack" style={{ gap: 28 }}>
          <section className="d-card d-card--clip" aria-labelledby="today-h">
            <div className="d-card-head" style={{ padding: "26px 28px 20px" }}>
              <div className="d-stack" style={{ gap: 6 }}>
                <h2 id="today-h" className="d-h2">Today's prayer times</h2>
                <span className="d-muted">This is what the TV screen and the app show right now.</span>
              </div>
              <button type="button" className="d-link" onClick={onGoPrayerTimes}>See the whole month</button>
            </div>

            {todayRow ? (
              <>
                {nextName ? (
                  <div className="d-notice d-notice--accent" style={{ margin: "0 28px 20px", fontSize: 18 }}>
                    <Icon name="schedule" />
                    <span><strong>Next: {nextName}</strong> · adhan at {displayTime(adhanOf(todayRow, nextKey as PrayerKey))}, in {nextIn}</span>
                  </div>
                ) : tomorrowRow && (
                  <div className="d-notice d-notice--accent" style={{ margin: "0 28px 20px", fontSize: 18 }}>
                    <Icon name="bedtime" />
                    <span><strong>Next: Fajr tomorrow</strong> · adhan at {displayTime(adhanOf(tomorrowRow, "fajr"))}, iqama {displayTime(iqamaOf(tomorrowRow, "fajr"))}</span>
                  </div>
                )}
                <div className="d-ptable-head" aria-hidden="true">
                  <span>Prayer</span><span>Adhan</span><span>Iqama</span><span />
                </div>
                {PRAYER_KEYS.map(k => {
                  const isNext = k === nextKey;
                  const isPast = !isNext && adhanMins[k] !== null && (adhanMins[k] as number) <= nowMins;
                  return (
                    <div key={k} className={`d-ptable-row${isNext ? " is-next" : ""}${isPast ? " is-past" : ""}`}>
                      <div className="d-stack" style={{ gap: 2 }}>
                        <span className="d-pname">{PRAYER_NAMES[k]}</span>
                        {(isNext || isPast) && <span className="d-ptag">{isNext ? "Next prayer" : "Done for today"}</span>}
                      </div>
                      <span className="d-ptime"><span className="d-only-mobile d-muted" style={{ fontSize: 16 }}>Adhan </span>{displayTime(adhanOf(todayRow, k))}</span>
                      <div className="d-stack" style={{ gap: 2 }}>
                        <span className="d-ptime d-ptime--strong"><span className="d-only-mobile d-muted" style={{ fontSize: 16, fontWeight: 400 }}>Iqama </span>{displayTime(iqamaOf(todayRow, k))}</span>
                        <span className="d-prule">{describeRule(rules[k])}{periodsToday[k] && ` (${describePeriod(periodsToday[k]!)})`}</span>
                      </div>
                      <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => onChangeIqama(k)} aria-label={`Change ${PRAYER_NAMES[k]} iqama`}>
                        Change
                      </button>
                    </div>
                  );
                })}
                {jummahTimes.length > 0 && (
                  <div className="d-ptable-row d-ptable-row--simple">
                    <div className="d-stack" style={{ gap: 2 }}>
                      <span className="d-pname">Jumu'ah</span>
                      <span className="d-ptag">Fridays</span>
                    </div>
                    <span className="d-ptime d-ptime--strong" style={{ gridColumn: "span 2" }}>{jummahTimes.join(" and ")}</span>
                    <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={onGoPrayerTimes} aria-label="Change Jumu'ah times">
                      Change
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="d-empty" style={{ borderTop: "1px solid var(--d-border)" }}>
                <Icon name="schedule" />
                <span className="d-strong" style={{ color: "var(--d-text)" }}>{scheduleLoading ? "Loading today's times…" : "There are no prayer times for today yet"}</span>
                {!scheduleLoading && <button type="button" className="d-btn d-btn--primary" onClick={onGoPrayerTimes}>Set up prayer times</button>}
              </div>
            )}
          </section>

          <section className="d-card d-card-pad d-stack" aria-labelledby="ann-h">
            <div className="d-card-head" style={{ alignItems: "center" }}>
              <h2 id="ann-h" className="d-h2">Announcements showing now</h2>
              <button type="button" className="d-link" onClick={onSeeAnnouncements}>See all</button>
            </div>
            {liveAnnouncements.length === 0 ? (
              <div className="d-row d-row--wrap" style={{ gap: 16 }}>
                <span className="d-muted">Nothing is being announced at the moment.</span>
                <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={onNewAnnouncement}><Icon name="add" />Post an announcement</button>
              </div>
            ) : (
              <div>
                {liveAnnouncements.slice(0, 3).map(a => (
                  <div key={a.id} className="d-list-row">
                    <div className="d-stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
                      <span className="d-strong" style={{ fontSize: 18 }}>{a.title}</span>
                      <span className="d-muted d-small">
                        {a.createdAt && `Posted ${new Date(a.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long" })}`}
                        {a.expiresAt ? ` · Showing until ${parseISODate(a.expiresAt).toLocaleDateString("en-US", { day: "numeric", month: "long" })}` : " · No end date"}
                      </span>
                    </div>
                    <button type="button" className="d-link" onClick={() => onEditAnnouncement(a)} aria-label={`Edit announcement: ${a.title}`}>Edit</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="d-stack" style={{ gap: 28 }}>
          <section className="d-card d-card-pad d-stack" style={{ gap: 12 }} aria-labelledby="qa-h">
            <h2 id="qa-h" className="d-h2" style={{ marginBottom: 4 }}>What would you like to do?</h2>
            <button type="button" className="d-btn d-btn--primary d-btn--block" onClick={onNewAnnouncement}><Icon name="campaign" />Post an announcement</button>
            <button type="button" className="d-btn d-btn--secondary d-btn--block" onClick={onNewEvent}><Icon name="event" />Add an event</button>
            <button type="button" className="d-btn d-btn--secondary d-btn--block" onClick={onGoPrayerTimes}><Icon name="schedule" />Change iqama times</button>
            <button type="button" className="d-btn d-btn--secondary d-btn--block" onClick={onOpenTv}><Icon name="tv" />Open the TV screen</button>
          </section>

          {attention.length > 0 && (
            <section className="d-card d-card-pad d-stack" aria-labelledby="att-h">
              <h2 id="att-h" className="d-h2">Needs your attention</h2>
              {attention.map(item =>
                item.tone === "warn" ? (
                  <div key={item.text} className="d-notice d-notice--warn">
                    <Icon name="error" />
                    <div className="d-stack" style={{ gap: 6 }}>
                      <span className="d-strong">{item.text}</span>
                      {item.action && <button type="button" className="d-link" style={{ alignSelf: "flex-start" }} onClick={item.action.run}>{item.action.label}</button>}
                    </div>
                  </div>
                ) : (
                  <div key={item.text} className="d-row" style={{ padding: "4px 16px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--d-success)", display: "flex" }}><Icon name="check_circle" /></span>
                    <span className="d-muted">{item.text}</span>
                  </div>
                ),
              )}
            </section>
          )}

          <section className="d-card d-card-pad d-stack" aria-labelledby="ev-h">
            <div className="d-card-head" style={{ alignItems: "center" }}>
              <h2 id="ev-h" className="d-h2">Coming up</h2>
              {upcomingEvents.length > 0 && <button type="button" className="d-link" onClick={onSeeEvents}>See all</button>}
            </div>
            {upcomingEvents.length === 0 ? (
              <span className="d-muted">No events planned yet.</span>
            ) : (
              upcomingEvents.slice(0, 3).map(ev => {
                const d = parseISODate(ev.date);
                return (
                  <div key={ev.id} className="d-row" style={{ gap: 16 }}>
                    <div className="d-date-chip" aria-hidden="true"><span>{MONTHS[d.getMonth()]}</span><b>{d.getDate()}</b></div>
                    <div className="d-stack" style={{ gap: 2, minWidth: 0 }}>
                      <span className="d-strong" style={{ fontSize: 18 }}>{ev.title}</span>
                      <span className="d-muted d-small">
                        {ev.date === today ? "Today" : d.toLocaleDateString("en-US", { weekday: "long" })}
                        {ev.time && ` · ${displayTime(ev.time)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default HomeTab;
