import React from "react";
import type { PrayerTime } from "../types";
import { Icon, Spinner } from "../ui";
import {
  PRAYER_KEYS, PRAYER_NAMES, activePeriod, adhanOf, describePeriod, describeRule, iqamaOf, overlappingPeriods, periodWinner, ruleSentence,
  type IqamaPeriod, type PrayerIqama, type PrayerKey,
} from "../iqama";
import { addDaysISO, displayTime, localISODate, parseISODate } from "../time";

interface PrayerTimesTabProps {
  now: Date;
  upcomingRows: PrayerTime[];
  config: Record<PrayerKey, PrayerIqama>;
  periodsToday: Record<PrayerKey, IqamaPeriod | null>;
  onChangeIqama: (key: PrayerKey) => void;
  onAddPeriod: (key: PrayerKey | null) => void;
  onEditPeriod: (key: PrayerKey, period: IqamaPeriod) => void;
  jummahTimes: string[];
  onEditJumuah: () => void;
  prayerSource: "excel" | "backend";
  calcSummary: string;
  onRequestSourceSwitch: (s: "excel" | "backend") => void;
  onGoSettings: () => void;
  prayerLoading: boolean;
  prayerTimesByMonth: Record<string, PrayerTime[]>;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  jamaat: { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
  onEditDay: (day: PrayerTime) => void;
  onOpenBulk: () => void;
  onFileChosen: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadSuccess: string;
  uploadError: string;
  onGenerateYear: (year: number) => void;
  generatingYear: number | null;
}

const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

const PrayerTimesTab: React.FC<PrayerTimesTabProps> = ({
  now, upcomingRows, config, periodsToday, onChangeIqama, onAddPeriod, onEditPeriod, jummahTimes, onEditJumuah, prayerSource, calcSummary,
  onRequestSourceSwitch, onGoSettings, prayerLoading, prayerTimesByMonth, selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear, jamaat, onEditDay, onOpenBulk, onFileChosen, uploadSuccess, uploadError,
  onGenerateYear, generatingYear,
}) => {
  const today = localISODate(now);
  const todayRow = upcomingRows.find(r => r.date === today);

  // Seasonal changes in the next 90 days: walk the days and note each day the rule in charge changes.
  const changes = PRAYER_KEYS.flatMap(k => {
    const out: { key: PrayerKey; date: string; text: string }[] = [];
    let prev = activePeriod(config[k], today);
    for (let i = 1; i <= 90; i++) {
      const date = addDaysISO(today, i);
      const cur = activePeriod(config[k], date);
      if ((cur?.id ?? null) !== (prev?.id ?? null)) {
        out.push({
          key: k,
          date,
          text: cur
            ? `${PRAYER_NAMES[k]} iqama will be ${ruleSentence(cur.rule)} (${describePeriod(cur)})`
            : `${PRAYER_NAMES[k]} iqama goes back to ${ruleSentence(config[k].usual)}`,
        });
      }
      prev = cur;
    }
    return out;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const [y, m] = selectedMonth.split("-").map(Number);
  const shiftMonth = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    if (d.getFullYear() !== selectedYear) setSelectedYear(d.getFullYear());
    setSelectedMonth(monthKey(d.getFullYear(), d.getMonth() + 1));
  };
  const goToday = () => {
    if (now.getFullYear() !== selectedYear) setSelectedYear(now.getFullYear());
    setSelectedMonth(monthKey(now.getFullYear(), now.getMonth() + 1));
  };
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = prayerTimesByMonth[selectedMonth] ?? [];
  const yearHasData = Object.keys(prayerTimesByMonth).some(k => k.startsWith(String(selectedYear)));

  const extraIqamas = (row: PrayerTime, k: PrayerKey) => {
    const r = row as unknown as Record<string, string | undefined>;
    if (k !== "fajr" && k !== "maghrib") return [];
    return [2, 3].filter(n => jamaat[`${k}${n}` as keyof typeof jamaat] && r[`${k}_iqama_${n}`]).map(n => displayTime(r[`${k}_iqama_${n}`]));
  };

  return (
    <div className="d-page">
      <div className="d-page-head">
        <div className="d-stack" style={{ gap: 8 }}>
          <h1 className="d-h1">Prayer times</h1>
          <p className="d-sub" style={{ maxWidth: 700 }}>
            {prayerSource === "backend"
              ? "Adhan times are worked out for you automatically. You decide when iqama happens."
              : "These times come from the timetable you uploaded. You can change any of them here."}
          </p>
        </div>
        <div className="d-row d-row--wrap d-no-print">
          <button type="button" className="d-btn d-btn--secondary" onClick={() => window.print()}><Icon name="print" />Print this month</button>
          <input id="timetable-file" type="file" accept=".xlsx,.xls" className="d-sr-only" onChange={e => { onFileChosen(e); e.target.value = ""; }} />
          <label htmlFor="timetable-file" className="d-btn d-btn--secondary" role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("timetable-file")?.click(); } }}>
            <Icon name="upload_file" />Upload a timetable
          </label>
        </div>
      </div>

      {uploadSuccess && <p role="status" className="d-notice d-notice--success" style={{ margin: 0 }}><Icon name="check_circle" />{uploadSuccess}</p>}
      {uploadError && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}><Icon name="error" />{uploadError}</p>}

      <div className="d-notice d-notice--info d-no-print" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <Icon name="info" />
        {prayerSource === "backend" ? (
          <>
            <span style={{ flex: 1, minWidth: 240 }}>Adhan times are worked out for <strong style={{ color: "var(--d-text)" }}>{calcSummary}</strong>.</span>
            <button type="button" className="d-link" onClick={onGoSettings}>Change how adhan is worked out</button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, minWidth: 240 }}>Times come from <strong style={{ color: "var(--d-text)" }}>your uploaded timetable</strong>.</span>
            <button type="button" className="d-link" onClick={() => onRequestSourceSwitch("backend")}>Work out adhan times automatically instead</button>
          </>
        )}
      </div>

      <section className="d-stack d-no-print" aria-labelledby="iq-h">
        <div className="d-stack" style={{ gap: 4 }}>
          <h2 id="iq-h" className="d-h2">When is iqama?</h2>
          <span className="d-muted">These rules fill in the iqama time for every day.</span>
        </div>
        <div className="d-grid-3">
          {PRAYER_KEYS.map(k => {
            const cfg = config[k];
            const overlaps = overlappingPeriods(cfg.periods);
            return (
              <div key={k} className="d-card d-card-pad d-stack" style={{ gap: 10, padding: "22px 24px" }}>
                <div className="d-row" style={{ justifyContent: "space-between" }}>
                  <span className="d-h3" style={{ fontSize: 22 }}>{PRAYER_NAMES[k]}</span>
                  <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => onChangeIqama(k)} aria-label={`Change the usual ${PRAYER_NAMES[k]} iqama`}>Change</button>
                </div>
                <div className="d-stack" style={{ gap: 2 }}>
                  {cfg.periods.length > 0 && <span className="d-muted d-small">Usually</span>}
                  <span className="d-strong" style={{ fontSize: 19 }}>{describeRule(cfg.usual)}</span>
                </div>
                {cfg.periods.map(p => (
                  <div key={p.id} className="d-row" style={{ gap: 10, padding: "10px 12px", borderRadius: "var(--d-r-btn)", background: "var(--d-surface-2)", border: "1px solid var(--d-border)" }}>
                    <div className="d-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                      <span className="d-small d-strong">
                        {describePeriod(p)}
                        {periodsToday[k]?.id === p.id && <span className="d-badge" style={{ marginLeft: 8 }}>Now</span>}
                        {p.kind === "months" && <span className="d-faint" style={{ fontWeight: 400 }}> · every year</span>}
                      </span>
                      <span>{describeRule(p.rule)}</span>
                    </div>
                    <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => onEditPeriod(k, p)} aria-label={`Edit ${PRAYER_NAMES[k]} iqama for ${describePeriod(p)}`}>Edit</button>
                  </div>
                ))}
                {overlaps.map(([a, b]) => (
                  <p key={a.id + b.id} className="d-notice d-notice--warn d-small" style={{ margin: 0, padding: "10px 12px" }}>
                    {describePeriod(a)} and {describePeriod(b)} overlap. Where they overlap, {describePeriod(periodWinner(a, b))} is used.
                  </p>
                ))}
                <button type="button" className="d-link" style={{ alignSelf: "flex-start", textAlign: "left" }} onClick={() => onAddPeriod(k)}>
                  + Different time for part of the year
                </button>
                <span className="d-muted d-small">
                  {todayRow ? `Today: adhan ${displayTime(adhanOf(todayRow, k))}, iqama ${displayTime(iqamaOf(todayRow, k))}` : "No times for today yet"}
                </span>
              </div>
            );
          })}
          <div className="d-card d-card-pad d-stack" style={{ gap: 10, padding: "22px 24px" }}>
            <div className="d-row" style={{ justifyContent: "space-between" }}>
              <span className="d-h3" style={{ fontSize: 22 }}>Jumu'ah</span>
              <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={onEditJumuah} aria-label="Change Jumu'ah times">Change</button>
            </div>
            <span className="d-strong" style={{ fontSize: 19 }}>
              {jummahTimes.length === 0 ? "Not set up yet" : `${jummahTimes.length === 1 ? "1 khutbah" : `${jummahTimes.length} khutbahs`}: ${jummahTimes.join(" and ")}`}
            </span>
            <span className="d-muted d-small">Every Friday</span>
          </div>
        </div>

        {changes.length > 0 ? (
          <div className="d-card d-card-pad d-stack" style={{ gap: 10 }}>
            <span className="d-h3">Changes coming up</span>
            {changes.map(c => (
              <div key={c.key + c.date} className="d-row" style={{ alignItems: "flex-start" }}>
                <span style={{ color: "var(--d-accent)", display: "flex" }}><Icon name="event_upcoming" /></span>
                <span>From <strong>{parseISODate(c.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</strong>, {c.text}.</span>
              </div>
            ))}
            <button type="button" className="d-btn d-btn--secondary d-btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => onAddPeriod(null)}><Icon name="add" />Add a different time for part of the year</button>
          </div>
        ) : (
          <div className="d-row d-row--wrap" style={{ gap: 16, padding: "18px 22px", borderRadius: "var(--d-r-btn)", border: "1.5px dashed var(--d-border-strong)" }}>
            <span style={{ color: "var(--d-text-3)", display: "flex" }}><Icon name="calendar_month" /></span>
            <div className="d-stack" style={{ gap: 2, flex: 1, minWidth: 240 }}>
              <span className="d-strong" style={{ fontSize: 18 }}>No changes in the next three months</span>
              <span className="d-muted d-small">Want a later Asr in summer, or different times in Ramadan? Set it up once and it changes by itself on the day.</span>
            </div>
            <button type="button" className="d-btn d-btn--secondary" onClick={() => onAddPeriod(null)}><Icon name="add" />Different time for part of the year</button>
          </div>
        )}
      </section>

      <section className="d-card d-card--clip" aria-labelledby="month-h">
        <div className="d-card-head" style={{ padding: "22px 28px", alignItems: "center" }}>
          <div className="d-stack" style={{ gap: 4 }}>
            <h2 id="month-h" className="d-h2">{monthLabel}</h2>
            <span className="d-muted d-small d-no-print">Adhan time, with the iqama time underneath in bold.</span>
          </div>
          <div className="d-row d-row--wrap d-no-print">
            <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => shiftMonth(-1)}><Icon name="chevron_left" />Earlier</button>
            <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={goToday}>This month</button>
            <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => shiftMonth(1)}>Later<Icon name="chevron_right" /></button>
          </div>
        </div>

        {prayerLoading ? (
          <div className="d-empty"><Spinner /><span>Loading prayer times…</span></div>
        ) : days.length === 0 ? (
          <div className="d-empty">
            <Icon name="calendar_month" />
            <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>There are no prayer times for {monthLabel}</span>
            {prayerSource === "backend" && !yearHasData ? (
              <button type="button" className="d-btn d-btn--primary" disabled={generatingYear === selectedYear} onClick={() => onGenerateYear(selectedYear)}>
                {generatingYear === selectedYear && <Spinner />}
                Work out prayer times for {selectedYear}
              </button>
            ) : (
              <span>Upload a timetable that covers this month, or switch to automatic times.</span>
            )}
          </div>
        ) : (
          <>
          <div className="d-mtable-wrap" style={{ overflowX: "auto" }}>
            <table className="d-mtable">
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  {PRAYER_KEYS.map(k => <th key={k} scope="col">{PRAYER_NAMES[k]}</th>)}
                  <th scope="col" className="d-no-print"><span className="d-sr-only">Change</span></th>
                </tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const d = parseISODate(day.date);
                  const isFriday = d.getDay() === 5;
                  const r = day as unknown as Record<string, string | undefined>;
                  const jm = [1, 2, 3].map(n => r[`jummah_${n}`]).filter(Boolean).map(t => displayTime(t));
                  return (
                    <tr key={day.date} className={`${day.date === today ? "is-today" : ""}${isFriday ? " is-friday" : ""}`}>
                      <td>
                        <span className="d-day">{d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}</span>
                        {day.date === today && <span className="d-badge" style={{ marginLeft: 8 }}>Today</span>}
                      </td>
                      {PRAYER_KEYS.map(k => (
                        <td key={k}>
                          <span className="d-cell-adhan">{displayTime(adhanOf(day, k))}</span>
                          <span className="d-cell-iqama">{displayTime(iqamaOf(day, k))}</span>
                          {extraIqamas(day, k).map((t, i) => <span key={i} className="d-cell-adhan">{i === 0 ? "2nd" : "3rd"} {t}</span>)}
                          {k === "dhuhr" && isFriday && jm.length > 0 && <span className="d-cell-adhan" style={{ color: "var(--d-accent-soft-text)", fontWeight: 700 }}>Jumu'ah {jm.join(" · ")}</span>}
                        </td>
                      ))}
                      <td className="d-no-print">
                        <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => onEditDay(day)} aria-label={`Change ${d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}`}>
                          <Icon name="edit" />Change
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="d-mlist">
            {days.map(day => {
              const d = parseISODate(day.date);
              const r = day as unknown as Record<string, string | undefined>;
              const jm = [1, 2, 3].map(n => r[`jummah_${n}`]).filter(Boolean).map(t => displayTime(t));
              const short = (t: string | undefined) => displayTime(t).replace(/ (AM|PM)$/, "");
              return (
                <div key={day.date} className={`d-mlist-day${day.date === today ? " is-today" : ""}`}>
                  <div className="d-row" style={{ justifyContent: "space-between" }}>
                    <span className="d-day">
                      {d.toLocaleDateString("en-US", { weekday: "long" })} {d.getDate()}
                      {day.date === today && <span className="d-badge" style={{ marginLeft: 8 }}>Today</span>}
                    </span>
                    <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => onEditDay(day)} aria-label={`Change ${d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}`}>
                      <Icon name="edit" />Change
                    </button>
                  </div>
                  <div className="d-mlist-grid">
                    {PRAYER_KEYS.map(k => (
                      <div key={k}>
                        <small>{PRAYER_NAMES[k]}</small>
                        <span>{short(adhanOf(day, k))}</span>
                        <b>{short(iqamaOf(day, k))}</b>
                      </div>
                    ))}
                  </div>
                  {jm.length > 0 && d.getDay() === 5 && <p className="d-small" style={{ margin: "8px 0 0", color: "var(--d-accent-soft-text)", fontWeight: 700 }}>Jumu'ah {jm.join(" · ")}</p>}
                </div>
              );
            })}
          </div>
          </>
        )}
      </section>

      <section className="d-card d-card-pad d-row d-row--wrap d-no-print" style={{ gap: 16 }}>
        <div className="d-stack" style={{ gap: 4, flex: 1, minWidth: 260 }}>
          <span className="d-h3">Change many days at once</span>
          <span className="d-muted">Set adhan and iqama for a range of dates, add a second jamaat time, or a different Isha on weekends.</span>
        </div>
        <button type="button" className="d-btn d-btn--secondary" onClick={onOpenBulk}><Icon name="date_range" />Change many days</button>
        {prayerSource === "backend" && (
          <button type="button" className="d-btn d-btn--ghost" onClick={() => onRequestSourceSwitch("excel")}>Use only my own timetable</button>
        )}
      </section>
    </div>
  );
};

export default PrayerTimesTab;
