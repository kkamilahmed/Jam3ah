import React, { useState } from "react";
import { Choice, Modal, Spinner } from "../ui";
import {
  MONTH_LONG, PRAYER_KEYS, PRAYER_NAMES, describePeriod, ruleSentence,
  type IqamaPeriod, type IqamaRule, type PrayerKey,
} from "../iqama";
import { addDaysISO, fmt12, localISODate, parseTypedTime } from "../time";

interface PeriodEditorProps {
  // Null lets the person pick the prayer.
  prayer: PrayerKey | null;
  // The period being edited; empty when adding a new one.
  period?: IqamaPeriod;
  usual: (key: PrayerKey) => IqamaRule;
  onSave: (key: PrayerKey, period: IqamaPeriod) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  onClose: () => void;
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

const PeriodEditor: React.FC<PeriodEditorProps> = ({ prayer, period, usual, onSave, onRemove, onClose }) => {
  const today = localISODate();
  const [key, setKey] = useState<PrayerKey>(prayer ?? "fajr");
  const startRule = period?.rule ?? usual(prayer ?? "fajr");
  const [kind, setKind] = useState<"months" | "dates">(period?.kind ?? "months");
  const [fromMonth, setFromMonth] = useState(period?.kind === "months" ? period.fromMonth : new Date().getMonth() + 1);
  const [toMonth, setToMonth] = useState(period?.kind === "months" ? period.toMonth : new Date().getMonth() + 1);
  const [from, setFrom] = useState(period?.kind === "dates" ? period.from : today);
  const [to, setTo] = useState(period?.kind === "dates" ? period.to : addDaysISO(today, 29));
  const [mode, setMode] = useState<"after" | "fixed">(startRule.mode);
  const [mins, setMins] = useState(startRule.mode === "after" ? String(startRule.minutes) : "30");
  const [fixed, setFixed] = useState(startRule.mode === "fixed" ? startRule.time : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);

  const minsNum = /^\d{1,3}$/.test(mins.trim()) ? Number(mins) : null;
  const fixedMins = parseTypedTime(fixed);
  const rule: IqamaRule | null =
    mode === "after" ? (minsNum !== null && minsNum <= 120 ? { mode: "after", minutes: minsNum } : null)
      : fixedMins !== null ? { mode: "fixed", time: fmt12(fixedMins) } : null;
  const draft: IqamaPeriod = kind === "months"
    ? { id: period?.id ?? "draft", kind, fromMonth, toMonth, rule: rule ?? startRule }
    : { id: period?.id ?? "draft", kind, from, to, rule: rule ?? startRule };
  const preview = rule
    ? `${kind === "months" ? `Every year from ${describePeriod(draft)}` : `From ${describePeriod(draft)}`}, ${PRAYER_NAMES[key]} iqama will be ${ruleSentence(rule)}. The rest of the year stays ${ruleSentence(usual(key))}.`
    : "";

  const save = async () => {
    if (mode === "after" && (minsNum === null || minsNum > 120)) { setError("Please type a number of minutes between 0 and 120."); return; }
    if (mode === "fixed" && fixedMins === null) { setError("Please type a time like 7:00 PM."); return; }
    if (kind === "dates") {
      if (!from || !to) { setError("Please choose both dates."); return; }
      if (to < from) { setError("The end date must be on or after the start date."); return; }
      if (to < today) { setError("That period has already finished. Please choose dates from today onwards."); return; }
    }
    setError("");
    setBusy("save");
    try {
      await onSave(key, { ...draft, id: period?.id ?? newId(), rule: rule! });
    } catch (e) {
      setError((e as Error).message || "Could not save. Please try again.");
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!onRemove) return;
    setBusy("remove");
    try {
      await onRemove();
    } catch (e) {
      setError((e as Error).message || "Could not remove. Please try again.");
      setBusy(null);
    }
  };

  const monthSelect = (id: string, label: string, value: number, set: (m: number) => void) => (
    <div className="d-field" style={{ width: 200 }}>
      <label className="d-label" htmlFor={id} style={{ fontSize: 16 }}>{label}</label>
      <select id={id} className="d-select" value={value} onChange={e => set(Number(e.target.value))}>
        {MONTH_LONG.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
    </div>
  );

  return (
    <Modal
      size="wide"
      title={period ? `${PRAYER_NAMES[key]} iqama for ${describePeriod(period)}` : "A different time for part of the year"}
      subtitle={period ? "Change or remove this period." : "For example, a later Asr in the summer months, or different times in Ramadan."}
      onClose={onClose}
      footer={
        <>
          {onRemove && (
            <button type="button" className="d-btn d-btn--danger" style={{ marginRight: "auto" }} onClick={remove} disabled={!!busy}>
              {busy === "remove" && <Spinner />}Remove this period
            </button>
          )}
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={!!busy}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={!!busy}>
            {busy === "save" && <Spinner />}Save
          </button>
        </>
      }
    >
      {!prayer && (
        <div className="d-field">
          <label className="d-label" htmlFor="pe-prayer">Prayer</label>
          <select
            id="pe-prayer"
            className="d-select"
            style={{ maxWidth: 300 }}
            value={key}
            onChange={e => {
              const k = e.target.value as PrayerKey;
              setKey(k);
              const u = usual(k);
              setMode(u.mode);
              if (u.mode === "after") setMins(String(u.minutes)); else setFixed(u.time);
            }}
          >
            {PRAYER_KEYS.map(k => <option key={k} value={k}>{PRAYER_NAMES[k]}</option>)}
          </select>
        </div>
      )}

      <div className="d-stack" style={{ gap: 12 }} role="radiogroup" aria-label="When">
        <span className="d-label">When?</span>
        <Choice name="pe-kind" checked={kind === "months"} onSelect={() => setKind("months")} title="The same months every year" body="Good for summer and winter times.">
          {kind === "months" && (
            <div className="d-row d-row--wrap" style={{ gap: 16 }}>
              {monthSelect("pe-from-month", "From the start of", fromMonth, setFromMonth)}
              {monthSelect("pe-to-month", "Until the end of", toMonth, setToMonth)}
            </div>
          )}
        </Choice>
        <Choice name="pe-kind" checked={kind === "dates"} onSelect={() => setKind("dates")} title="Exact dates, this time only" body="Good for Ramadan, which moves every year.">
          {kind === "dates" && (
            <div className="d-row d-row--wrap" style={{ gap: 16 }}>
              <div className="d-field" style={{ width: 200 }}>
                <label className="d-label" htmlFor="pe-from" style={{ fontSize: 16 }}>From</label>
                <input id="pe-from" type="date" className="d-input" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="d-field" style={{ width: 200 }}>
                <label className="d-label" htmlFor="pe-to" style={{ fontSize: 16 }}>Until</label>
                <input id="pe-to" type="date" className="d-input" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
          )}
        </Choice>
      </div>

      <div className="d-stack" style={{ gap: 12 }} role="radiogroup" aria-label="Iqama time in this period">
        <span className="d-label">Iqama in this period</span>
        <Choice name="pe-mode" checked={mode === "after"} onSelect={() => { setMode("after"); setError(""); }} title="A number of minutes after adhan">
          <div className="d-row">
            <input
              className="d-input"
              style={{ width: 100, textAlign: "center" }}
              inputMode="numeric"
              aria-label="Minutes after adhan in this period"
              value={mins}
              onFocus={() => setMode("after")}
              onChange={e => { setMins(e.target.value); setMode("after"); setError(""); }}
            />
            <span className="d-muted">minutes after adhan</span>
          </div>
        </Choice>
        <Choice name="pe-mode" checked={mode === "fixed"} onSelect={() => { setMode("fixed"); setError(""); }} title="The same time every day">
          <input
            className="d-input"
            style={{ width: 180 }}
            aria-label="Iqama time in this period"
            placeholder="e.g. 7:00 PM"
            value={fixed}
            onFocus={() => setMode("fixed")}
            onChange={e => { setFixed(e.target.value); setMode("fixed"); setError(""); }}
          />
        </Choice>
      </div>

      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
      {!error && preview && <p className="d-strong" style={{ margin: 0, fontSize: 18 }}>{preview}</p>}
    </Modal>
  );
};

export default PeriodEditor;
