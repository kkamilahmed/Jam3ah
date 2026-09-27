import React, { useEffect, useRef, useState } from "react";
import DayEditor from "../dashboard/components/DayEditor";
import PeriodEditor from "../dashboard/components/PeriodEditor";
import { PRAYER_KEYS, PRAYER_NAMES, describePeriod, describeRule, periodWinner, overlappingPeriods, type IqamaPeriod, type IqamaRule, type PrayerKey } from "../dashboard/iqama";
import { displayTime, parseISODate } from "../dashboard/time";
import type { PrayerTime } from "../dashboard/types";
import { Icon } from "../dashboard/ui";
import { Disclosure, StepHeader, TimeInput, WizardNav } from "./parts";
import { MONTH_NAMES, type AdhanRule, type DayOverrides, type IqamaSetup, type ScheduleRow } from "./schedule";

type AnyRule = { mode: string; minutes?: number; time?: string };
type Mode = { value: string; label: string; unit?: string };

const IQAMA_MODES: Mode[] = [
  { value: "after", label: "Minutes after adhan", unit: "minutes after adhan" },
  { value: "fixed", label: "Same time every day" },
];
const ADHAN_MODES: Mode[] = [
  { value: "start", label: "At the start time" },
  { value: "after", label: "Minutes after the start time", unit: "minutes after the start time" },
  { value: "fixed", label: "Same time every day" },
];
const ORDINAL = ["1st", "2nd", "3rd"];
const WEEKEND = [{ id: "fri", label: "Friday" }, { id: "sat", label: "Saturday" }, { id: "sun", label: "Sunday" }];

// One prayer's rule: a choice of kind, then minutes or a time. Reports unreadable input to the parent.
const RuleRow: React.FC<{
  id: string;
  name: string;
  what: string;
  modes: Mode[];
  rule: AnyRule;
  onChange: (rule: AnyRule) => void;
  onValid: (ok: boolean) => void;
  example?: string;
  // Shown under the controls, e.g. the prayer's seasonal periods.
  extra?: React.ReactNode;
}> = ({ id, name, what, modes, rule, onChange, onValid, example, extra }) => {
  const [mode, setMode] = useState(rule.mode);
  const [mins, setMins] = useState(String(rule.minutes ?? 15));
  const [time, setTime] = useState(rule.time ?? "");
  const [error, setError] = useState("");
  const [needsTime, setNeedsTime] = useState(false);
  const unit = modes.find(m => m.value === mode)?.unit;

  const report = (msg: string) => { setError(msg); setNeedsTime(false); onValid(!msg); };
  // A time not typed yet: not an error to shout about, but the rule is not complete.
  const awaitTime = () => { setError(""); setNeedsTime(true); onValid(false); };
  // The saved rule is always the last one that could be read, so a hidden row never blocks finishing.
  const onValidRef = useRef(onValid);
  useEffect(() => { onValidRef.current = onValid; });
  useEffect(() => () => onValidRef.current(true), []);
  const commitMins = (text: string) => {
    if (!/^\d{1,3}$/.test(text.trim()) || Number(text) > 120) { report("Please type a number of minutes between 0 and 120."); return; }
    report("");
    onChange({ mode: "after", minutes: Number(text) });
  };
  const pickMode = (m: string) => {
    setMode(m);
    if (m === "start") { report(""); onChange({ mode: "start" }); }
    if (m === "after") commitMins(mins);
    if (m === "fixed") {
      if (time) { report(""); onChange({ mode: "fixed", time }); } else awaitTime();
    }
  };

  return (
    <div className="wz-rule">
      <span className="d-h3 wz-rule-name">{name}</span>
      <div className="d-stack" style={{ gap: 10 }}>
        <select id={id} className="d-select" aria-label={`${name} ${what}`} value={mode} onChange={e => pickMode(e.target.value)}>
          {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {mode === "after" && (
          <div className="wz-rule-value">
            <input
              className="d-input wz-input-mins"
              inputMode="numeric"
              aria-label={`${name}: ${unit}`}
              aria-invalid={!!error || undefined}
              value={mins}
              onChange={e => { setMins(e.target.value); commitMins(e.target.value); }}
            />
            <span className="d-muted">{unit}</span>
          </div>
        )}
        {mode === "fixed" && (
          <TimeInput
            label={`${name} ${what} time`}
            className="wz-input-time"
            value={time}
            invalid={!!error}
            onChange={v => {
              if (v === null) { report("We could not read that time. Please type it like 1:30 PM."); return; }
              setTime(v);
              if (!v) { awaitTime(); return; }
              report("");
              onChange({ mode: "fixed", time: v });
            }}
          />
        )}
        {error && <p className="wz-error" role="alert">{error}</p>}
        {needsTime && mode === "fixed" && <p className="d-help">Type the time, like 1:30 PM.</p>}
        {extra}
      </div>
      {example && !error && !needsTime && <span className="wz-rule-example">{example}</span>}
    </div>
  );
};

export const IqamaStep: React.FC<{
  step: { index: number; total: number; name: string };
  year: number;
  today: string;
  rows: ScheduleRow[];
  setup: IqamaSetup;
  setSetup: React.Dispatch<React.SetStateAction<IqamaSetup>>;
  overrides: DayOverrides;
  setOverrides: React.Dispatch<React.SetStateAction<DayOverrides>>;
  onInvalid: (key: string, bad: boolean) => void;
  onBack: () => void;
  onFinish: () => void;
  saving: boolean;
  saveMsg: string;
  error: string;
}> = ({ step, year, today, rows, setup, setSetup, overrides, setOverrides, onInvalid, onBack, onFinish, saving, saveMsg, error }) => {
  const [month, setMonth] = useState(() => (today.startsWith(String(year)) ? Number(today.slice(5, 7)) : 1));
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [periodEdit, setPeriodEdit] = useState<{ prayer: PrayerKey; period?: IqamaPeriod } | null>(null);
  const setPeriods = (k: PrayerKey, periods: IqamaPeriod[]) => setSetup(s => ({ ...s, periods: { ...s.periods, [k]: periods } }));
  const periodsFor = (k: PrayerKey) => setup.periods[k] ?? [];

  const exampleRow = rows.find(r => r.date === today) ?? rows[0];
  const exampleDay = exampleRow?.date === today ? "Today" : exampleRow ? parseISODate(exampleRow.date).toLocaleDateString("en-US", { day: "numeric", month: "long" }) : "";
  const example = (k: PrayerKey) =>
    exampleRow ? `${exampleDay}: adhan ${displayTime(exampleRow[`${k}_adhan`] ?? exampleRow[k])}, iqama ${displayTime(exampleRow[`${k}_iqama`])}` : undefined;

  const setIqama = (k: PrayerKey, r: AnyRule) => setSetup(s => ({ ...s, iqama: { ...s.iqama, [k]: r as IqamaRule } }));
  const setAdhan = (k: PrayerKey, r: AnyRule) => setSetup(s => ({ ...s, adhan: { ...s.adhan, [k]: r as AdhanRule } }));
  const jummahCount = setup.jummah.length;
  const days = rows.filter(r => Number(r.date.slice(5, 7)) === month);
  const shift = (d: number) => setMonth(m => Math.min(12, Math.max(1, m + d)));
  const dayLabel = (iso: string) => parseISODate(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="d-page">
      <StepHeader
        step={step}
        title="When is iqama?"
        sub="These rules fill in the iqama time for every day of the year. You can change any of this later on the Prayer times page."
      />

      <section className="d-card d-card--clip" aria-labelledby="iq-rules-h">
        <div className="d-stack wz-card-head" style={{ gap: 4 }}>
          <h2 id="iq-rules-h" className="d-h2">Iqama for each prayer</h2>
          <span className="d-muted">Most masjids start the congregation a set number of minutes after the adhan.</span>
        </div>
        {PRAYER_KEYS.map(k => (
          <RuleRow
            key={k}
            id={`iq-${k}`}
            name={PRAYER_NAMES[k]}
            what="iqama"
            modes={IQAMA_MODES}
            rule={setup.iqama[k]}
            onChange={r => setIqama(k, r)}
            onValid={ok => onInvalid(`iqama-${k}`, !ok)}
            example={example(k)}
            extra={
              <div className="d-stack" style={{ gap: 8 }}>
                {periodsFor(k).map(p => (
                  <div key={p.id} className="wz-period">
                    <div className="d-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                      <span className="d-small d-strong">{describePeriod(p)}{p.kind === "months" && <span className="d-faint" style={{ fontWeight: 400 }}> · every year</span>}</span>
                      <span>{describeRule(p.rule)}</span>
                    </div>
                    <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => setPeriodEdit({ prayer: k, period: p })} aria-label={`Edit ${PRAYER_NAMES[k]} iqama for ${describePeriod(p)}`}>Edit</button>
                  </div>
                ))}
                {overlappingPeriods(periodsFor(k)).map(([a, b]) => (
                  <p key={a.id + b.id} className="d-notice d-notice--warn d-small" style={{ margin: 0, padding: "10px 12px" }}>
                    {describePeriod(a)} and {describePeriod(b)} overlap. Where they overlap, {describePeriod(periodWinner(a, b))} is used.
                  </p>
                ))}
                <button type="button" className="d-link" style={{ alignSelf: "flex-start", textAlign: "left" }} onClick={() => setPeriodEdit({ prayer: k })}>
                  + Different time for part of the year
                </button>
              </div>
            }
          />
        ))}
        <div className="wz-card-foot">
          <Disclosure label="Call the adhan later than the start time">
            <p className="d-help">Usually the adhan is called as soon as the prayer time starts. Change this only if your masjid waits.</p>
            <div className="d-card d-card--clip">
              {PRAYER_KEYS.map(k => (
                <RuleRow
                  key={k}
                  id={`ad-${k}`}
                  name={PRAYER_NAMES[k]}
                  what="adhan"
                  modes={ADHAN_MODES}
                  rule={setup.adhan[k]}
                  onChange={r => setAdhan(k, r)}
                  onValid={ok => onInvalid(`adhan-${k}`, !ok)}
                />
              ))}
            </div>
          </Disclosure>
        </div>
      </section>

      <div className="d-grid-2" style={{ alignItems: "start" }}>
        <section className="d-card d-card-pad d-stack" aria-labelledby="jm-h">
          <div className="d-stack" style={{ gap: 4 }}>
            <h2 id="jm-h" className="d-h2">Jumu'ah</h2>
            <span className="d-muted">Used for every Friday.</span>
          </div>
          <div className="d-field">
            <label className="d-label" htmlFor="jm-count">How many khutbahs?</label>
            <select
              id="jm-count"
              className="d-select"
              value={jummahCount}
              onChange={e => {
                const n = Number(e.target.value);
                setSetup(s => ({ ...s, jummah: Array.from({ length: n }, (_, i) => s.jummah[i] ?? "") }));
                for (let i = n; i < 3; i++) onInvalid(`jummah-${i}`, false);
              }}
            >
              <option value={0}>No Jumu'ah at this masjid</option>
              <option value={1}>1 khutbah</option>
              <option value={2}>2 khutbahs</option>
              <option value={3}>3 khutbahs</option>
            </select>
          </div>
          {jummahCount > 0 && (
            <div className="d-row d-row--wrap" style={{ gap: 16, alignItems: "flex-start" }}>
              {setup.jummah.map((t, i) => (
                <div key={i} className="d-field" style={{ width: 170 }}>
                  <label className="d-label" htmlFor={`jm-${i}`}>{ORDINAL[i]} khutbah</label>
                  <TimeInput
                    id={`jm-${i}`}
                    value={t}
                    onChange={v => {
                      onInvalid(`jummah-${i}`, v === null);
                      if (v !== null) setSetup(s => ({ ...s, jummah: s.jummah.map((x, j) => (j === i ? v : x)) }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="d-card d-card-pad d-stack" aria-labelledby="wi-h">
          <div className="d-stack" style={{ gap: 4 }}>
            <h2 id="wi-h" className="d-h2">Different Isha iqama on weekends</h2>
            <span className="d-muted">Leave this empty if Isha follows the rule above every day.</span>
          </div>
          <div className="wz-days" role="group" aria-label="Weekend days">
            {WEEKEND.map(d => {
              const on = setup.weekendIsha.days.includes(d.id);
              return (
                <label key={d.id} className={`d-choice${on ? " is-selected" : ""}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setSetup(s => ({
                      ...s,
                      weekendIsha: { ...s.weekendIsha, days: on ? s.weekendIsha.days.filter(x => x !== d.id) : [...s.weekendIsha.days, d.id] },
                    }))}
                  />
                  <span className="d-strong">{d.label}</span>
                </label>
              );
            })}
          </div>
          <div className="d-field">
            <label className="d-label" htmlFor="wi-time">Isha iqama on those days</label>
            <TimeInput
              id="wi-time"
              className="wz-input-time"
              placeholder="e.g. 9:30 PM"
              value={setup.weekendIsha.iqama}
              onChange={v => {
                onInvalid("weekend", v === null);
                if (v !== null) setSetup(s => ({ ...s, weekendIsha: { ...s.weekendIsha, iqama: v } }));
              }}
            />
          </div>
        </section>
      </div>

      <section className="d-card d-card--clip" aria-labelledby="tt-h">
        <div className="d-card-head wz-tt-head">
          <div className="d-stack" style={{ gap: 4 }}>
            <h2 id="tt-h" className="d-h2">Check the timetable</h2>
            <span className="d-muted d-small">Adhan time, with the iqama time underneath in bold. Press Change to set a different time for one day.</span>
          </div>
          <div className="wz-month-nav">
            <button type="button" className="d-btn d-btn--secondary d-btn--sm d-btn--icon" onClick={() => shift(-1)} disabled={month === 1} aria-label="Earlier month"><Icon name="chevron_left" /></button>
            <select className="d-select" aria-label="Month" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n} {year}</option>)}
            </select>
            <button type="button" className="d-btn d-btn--secondary d-btn--sm d-btn--icon" onClick={() => shift(1)} disabled={month === 12} aria-label="Later month"><Icon name="chevron_right" /></button>
          </div>
        </div>

        <div className="d-mtable-wrap" style={{ overflowX: "auto" }}>
          <table className="d-mtable">
            <thead>
              <tr>
                <th scope="col">Day</th>
                {PRAYER_KEYS.map(k => <th key={k} scope="col">{PRAYER_NAMES[k]}</th>)}
                <th scope="col"><span className="d-sr-only">Change</span></th>
              </tr>
            </thead>
            <tbody>
              {days.map(day => {
                const d = parseISODate(day.date);
                const isFriday = d.getDay() === 5;
                const jm = [1, 2, 3].map(n => day[`jummah_${n}`]).filter(Boolean).map(t => displayTime(t));
                return (
                  <tr key={day.date} className={`${day.date === today ? "is-today" : ""}${isFriday ? " is-friday" : ""}`}>
                    <td>
                      <span className="d-day">{d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}</span>
                      {day.date === today && <span className="d-badge wz-changed">Today</span>}
                      {overrides[day.date] && <span className="d-badge d-badge--muted wz-changed">Changed</span>}
                    </td>
                    {PRAYER_KEYS.map(k => (
                      <td key={k}>
                        <span className="d-cell-adhan">{displayTime(day[`${k}_adhan`] ?? day[k])}</span>
                        <span className="d-cell-iqama">{displayTime(day[`${k}_iqama`])}</span>
                        {k === "dhuhr" && isFriday && jm.length > 0 && <span className="d-cell-adhan" style={{ color: "var(--d-accent-soft-text)", fontWeight: 700 }}>Jumu'ah {jm.join(" · ")}</span>}
                      </td>
                    ))}
                    <td>
                      <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => setEditing(day)} aria-label={`Change ${dayLabel(day.date)}`}>
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
            const jm = [1, 2, 3].map(n => day[`jummah_${n}`]).filter(Boolean).map(t => displayTime(t));
            const short = (t: string | null | undefined) => displayTime(t).replace(/ (AM|PM)$/, "");
            return (
              <div key={day.date} className={`d-mlist-day${day.date === today ? " is-today" : ""}`}>
                <div className="d-row" style={{ justifyContent: "space-between" }}>
                  <span className="d-day">
                    {d.toLocaleDateString("en-US", { weekday: "long" })} {d.getDate()}
                    {overrides[day.date] && <span className="d-badge d-badge--muted wz-changed">Changed</span>}
                  </span>
                  <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => setEditing(day)} aria-label={`Change ${dayLabel(day.date)}`}>
                    <Icon name="edit" />Change
                  </button>
                </div>
                <div className="d-mlist-grid">
                  {PRAYER_KEYS.map(k => (
                    <div key={k}>
                      <small>{PRAYER_NAMES[k]}</small>
                      <span>{short(day[`${k}_adhan`] ?? day[k])}</span>
                      <b>{short(day[`${k}_iqama`])}</b>
                    </div>
                  ))}
                </div>
                {jm.length > 0 && <p className="d-small" style={{ margin: "8px 0 0", color: "var(--d-accent-soft-text)", fontWeight: 700 }}>Jumu'ah {jm.join(" · ")}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}><Icon name="error" />{error}</p>}
      <WizardNav onBack={onBack} onNext={onFinish} nextLabel="Finish setup" busy={saving} busyLabel={saveMsg} />

      {periodEdit && (
        <PeriodEditor
          prayer={periodEdit.prayer}
          period={periodEdit.period}
          usual={k => setup.iqama[k]}
          onSave={(k, p) => {
            const list = periodsFor(k);
            setPeriods(k, list.some(x => x.id === p.id) ? list.map(x => (x.id === p.id ? p : x)) : [...list, p]);
            setPeriodEdit(null);
          }}
          onRemove={periodEdit.period ? () => {
            setPeriods(periodEdit.prayer, periodsFor(periodEdit.prayer).filter(x => x.id !== periodEdit.period!.id));
            setPeriodEdit(null);
          } : undefined}
          onClose={() => setPeriodEdit(null)}
        />
      )}
      {editing && (
        <DayEditor
          day={editing as unknown as PrayerTime}
          jamaat={{ fajr2: false, fajr3: false, maghrib2: false, maghrib3: false }}
          jummahSlots={[0, 1, 2].map(i => !!setup.jummah[i]) as [boolean, boolean, boolean]}
          onSave={async (date, patch) => {
            setOverrides(o => ({ ...o, [date]: { ...o[date], ...patch } }));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};
