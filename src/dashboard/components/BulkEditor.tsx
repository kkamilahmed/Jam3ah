import React, { useEffect, useRef } from "react";
import type { BatchCell, BatchCell2, BatchConfig, PrayerTime } from "../types";
import { Modal, Spinner } from "../ui";
import { PRAYER_KEYS, PRAYER_NAMES, type PrayerKey } from "../iqama";
import { fmt12, parseISODate, parseTypedTime } from "../time";

type Extra = { fajr: string[]; maghrib: string[]; jummah: string[]; jummahSlots: [boolean, boolean, boolean]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } };

interface BulkEditorProps {
  prayerTimesByMonth: Record<string, PrayerTime[]>;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  adhan: BatchConfig;
  setAdhan: React.Dispatch<React.SetStateAction<BatchConfig>>;
  iqama: BatchConfig;
  setIqama: React.Dispatch<React.SetStateAction<BatchConfig>>;
  iqama2: { fajr: BatchCell2; maghrib: BatchCell2 };
  setIqama2: React.Dispatch<React.SetStateAction<{ fajr: BatchCell2; maghrib: BatchCell2 }>>;
  iqama3: { fajr: BatchCell2; maghrib: BatchCell2 };
  setIqama3: React.Dispatch<React.SetStateAction<{ fajr: BatchCell2; maghrib: BatchCell2 }>>;
  jamaat: { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
  extra: Extra;
  setExtra: React.Dispatch<React.SetStateAction<Extra>>;
  applying: boolean;
  applied: boolean;
  error: string;
  onApply: () => void;
  onClose: () => void;
}

type Choice = "keep" | "offset" | "fixed";
const choiceOf = (c: BatchCell): Choice => (c.mode === "offset" ? "offset" : c.fixed ? "fixed" : "keep");

// One "how should this time be set" control: keep / minutes after / fixed time.
const CellControl: React.FC<{
  id: string;
  cell: BatchCell;
  onChange: (patch: Partial<BatchCell>) => void;
  afterLabel: string;
}> = ({ id, cell, onChange, afterLabel }) => {
  // Local choice: "same time every day" with no time typed yet must still show the time box.
  const [choice, setChoice] = React.useState<Choice>(choiceOf(cell));
  const [fixedText, setFixedText] = React.useState(cell.fixed);
  return (
    <div className="d-stack" style={{ gap: 8 }}>
      <select
        id={id}
        className="d-select"
        value={choice}
        onChange={e => {
          const v = e.target.value as Choice;
          setChoice(v);
          if (v === "keep") onChange({ mode: "fixed", fixed: "" });
          if (v === "offset") onChange({ mode: "offset" });
          if (v === "fixed") { const m = parseTypedTime(fixedText); onChange({ mode: "fixed", fixed: m === null ? "" : fmt12(m) }); }
        }}
      >
        <option value="keep">Leave as it is</option>
        <option value="offset">{afterLabel}</option>
        <option value="fixed">The same time every day</option>
      </select>
      {choice === "offset" && (
        <div className="d-row">
          <input
            className="d-input"
            style={{ width: 90, textAlign: "center" }}
            inputMode="numeric"
            aria-label="Minutes"
            value={String(cell.offset)}
            onChange={e => { const n = parseInt(e.target.value, 10); onChange({ offset: isNaN(n) || n < 0 ? 0 : n }); }}
          />
          <span className="d-muted d-small">minutes</span>
        </div>
      )}
      {choice === "fixed" && (
        <input
          className="d-input"
          aria-label="Time"
          placeholder="e.g. 1:30 PM"
          value={fixedText}
          onChange={e => setFixedText(e.target.value)}
          onBlur={() => { const m = parseTypedTime(fixedText); onChange({ mode: "fixed", fixed: m === null ? "" : fmt12(m) }); if (m !== null) setFixedText(fmt12(m)); }}
        />
      )}
    </div>
  );
};

const BulkEditor: React.FC<BulkEditorProps> = ({
  prayerTimesByMonth, from, setFrom, to, setTo, adhan, setAdhan, iqama, setIqama, iqama2, setIqama2, iqama3, setIqama3,
  jamaat, extra, setExtra, applying, applied, error, onApply, onClose,
}) => {
  const days = Object.values(prayerTimesByMonth).flat().filter(d => from && to && d.date >= from && d.date <= to).length;
  const cellOf = (cfg: BatchConfig, k: PrayerKey) => (cfg as unknown as Record<PrayerKey, BatchCell>)[k];
  const patchCfg = (set: React.Dispatch<React.SetStateAction<BatchConfig>>, k: PrayerKey) => (p: Partial<BatchCell>) =>
    set(prev => ({ ...prev, [k]: { ...(prev as unknown as Record<PrayerKey, BatchCell>)[k], ...p } }));

  const wasApplying = useRef(false);
  useEffect(() => {
    if (wasApplying.current && !applying && applied) onClose();
    wasApplying.current = applying;
  }, [applying, applied, onClose]);

  const fmtDay = (iso: string) => parseISODate(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Modal
      size="xwide"
      title="Change many days at once"
      subtitle="For bigger changes, like a new timetable for Ramadan or the winter months."
      onClose={onClose}
      footer={
        <>
          {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: "0 auto 0 0" }}>{error}</p>}
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={applying}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={onApply} disabled={applying || !from || !to || days === 0}>
            {applying && <Spinner />}
            {days > 0 ? `Apply to ${days} day${days === 1 ? "" : "s"}` : "Apply"}
          </button>
        </>
      }
    >
      <div className="d-row d-row--wrap" style={{ gap: 16, alignItems: "flex-end" }}>
        <div className="d-field" style={{ width: 220 }}>
          <label className="d-label" htmlFor="bulk-from">From</label>
          <input id="bulk-from" type="date" className="d-input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="d-field" style={{ width: 220 }}>
          <label className="d-label" htmlFor="bulk-to">Until</label>
          <input id="bulk-to" type="date" className="d-input" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} />
        </div>
        {from && to && (
          <p className="d-help" style={{ paddingBottom: 14 }}>
            {days > 0 ? `${fmtDay(from)} to ${fmtDay(to)}: ${days} days` : "No prayer times are loaded for those dates. Pick dates in the year you are viewing."}
          </p>
        )}
      </div>

      <div className="d-card d-card--clip">
        {PRAYER_KEYS.map((k, i) => {
          const extraJamaats: { label: string; cell: BatchCell2; set: (p: Partial<BatchCell2>) => void }[] = [];
          if (k === "fajr" || k === "maghrib") {
            if (jamaat[k === "fajr" ? "fajr2" : "maghrib2"]) extraJamaats.push({ label: "2nd jamaat", cell: iqama2[k], set: p => setIqama2(prev => ({ ...prev, [k]: { ...prev[k], ...p } })) });
            if (jamaat[k === "fajr" ? "fajr3" : "maghrib3"]) extraJamaats.push({ label: "3rd jamaat", cell: iqama3[k], set: p => setIqama3(prev => ({ ...prev, [k]: { ...prev[k], ...p } })) });
          }
          return (
            <div key={k} className="d-row d-row--wrap" style={{ gap: 20, alignItems: "flex-start", padding: "20px 24px", borderTop: i ? "1px solid var(--d-border)" : undefined }}>
              <span className="d-h3" style={{ width: 110, paddingTop: 34 }}>{PRAYER_NAMES[k]}</span>
              <div className="d-field" style={{ width: 260 }}>
                <label className="d-label" htmlFor={`bulk-a-${k}`} style={{ fontSize: 16 }}>Adhan</label>
                <CellControl id={`bulk-a-${k}`} cell={cellOf(adhan, k)} onChange={patchCfg(setAdhan, k)} afterLabel="Minutes after the start time" />
              </div>
              <div className="d-field" style={{ width: 260 }}>
                <label className="d-label" htmlFor={`bulk-i-${k}`} style={{ fontSize: 16 }}>Iqama</label>
                <CellControl id={`bulk-i-${k}`} cell={cellOf(iqama, k)} onChange={patchCfg(setIqama, k)} afterLabel="Minutes after adhan" />
              </div>
              {extraJamaats.map(j => (
                <div key={j.label} className="d-field" style={{ width: 260 }}>
                  <label className="d-label" htmlFor={`bulk-${k}-${j.label}`} style={{ fontSize: 16 }}>{j.label}</label>
                  <CellControl id={`bulk-${k}-${j.label}`} cell={j.cell} onChange={j.set} afterLabel="Minutes after the jamaat before" />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="d-card d-card-pad d-stack">
        <div className="d-stack" style={{ gap: 4 }}>
          <span className="d-h3">Different Isha iqama on weekends</span>
          <span className="d-muted">Leave the time empty if Isha is the same every day.</span>
        </div>
        <div className="d-row d-row--wrap" style={{ gap: 12 }}>
          {[{ id: "fri", label: "Friday" }, { id: "sat", label: "Saturday" }, { id: "sun", label: "Sunday" }].map(d => {
            const on = extra.weekendIsha.days.includes(d.id);
            return (
              <label key={d.id} className={`d-choice${on ? " is-selected" : ""}`} style={{ padding: "12px 16px", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={on}
                  style={{ width: 20, height: 20, accentColor: "var(--d-accent)" }}
                  onChange={() => setExtra(prev => ({
                    ...prev,
                    weekendIsha: { ...prev.weekendIsha, days: on ? prev.weekendIsha.days.filter(x => x !== d.id) : [...prev.weekendIsha.days, d.id] },
                  }))}
                />
                <span className="d-strong">{d.label}</span>
              </label>
            );
          })}
          <input
            className="d-input"
            style={{ width: 180 }}
            aria-label="Weekend Isha iqama time"
            placeholder="e.g. 9:30 PM"
            defaultValue={extra.weekendIsha.iqama}
            onBlur={e => { const m = parseTypedTime(e.target.value); setExtra(prev => ({ ...prev, weekendIsha: { ...prev.weekendIsha, iqama: m === null ? "" : fmt12(m) } })); }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default BulkEditor;
