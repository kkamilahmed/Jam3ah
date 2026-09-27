import React, { useState } from "react";
import { Choice, Modal, Spinner } from "../ui";
import { PRAYER_KEYS, PRAYER_NAMES, describePeriod, iqamaFromRule, type IqamaPeriod, type IqamaRule, type PrayerKey } from "../iqama";
import { addDaysISO, fmt12, localISODate, parseISODate, parseTypedTime } from "../time";

interface IqamaEditorProps {
  // Null lets the admin pick the prayer (used when planning a future change).
  prayer: PrayerKey | null;
  rules: Record<PrayerKey, IqamaRule | null>;
  todayAdhan: (key: PrayerKey) => number | null;
  defaultStart?: "today" | "tomorrow" | "date";
  // Seasonal periods of this prayer; they keep their own times.
  periods?: IqamaPeriod[];
  onSave: (key: PrayerKey, rule: IqamaRule, fromDate: string) => Promise<void>;
  onClose: () => void;
}

const IqamaEditor: React.FC<IqamaEditorProps> = ({ prayer, rules, todayAdhan, defaultStart = "today", periods = [], onSave, onClose }) => {
  const today = localISODate();
  const [key, setKey] = useState<PrayerKey>(prayer ?? "fajr");
  const initial = rules[prayer ?? "fajr"];
  const [mode, setMode] = useState<"after" | "fixed">(initial?.mode ?? "after");
  const [mins, setMins] = useState(initial?.mode === "after" ? String(initial.minutes) : "15");
  const [fixed, setFixed] = useState(initial?.mode === "fixed" ? initial.time : "");
  const [start, setStart] = useState<"today" | "tomorrow" | "date">(defaultStart);
  const [date, setDate] = useState(addDaysISO(today, 7));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pickPrayer = (k: PrayerKey) => {
    setKey(k);
    const r = rules[k];
    setMode(r?.mode ?? "after");
    if (r?.mode === "after") setMins(String(r.minutes));
    if (r?.mode === "fixed") setFixed(r.time);
    setError("");
  };

  const fromDate = start === "today" ? today : start === "tomorrow" ? addDaysISO(today, 1) : date;
  const adhan = todayAdhan(key);
  const minsNum = /^\d{1,3}$/.test(mins.trim()) ? Number(mins) : null;
  const fixedMins = parseTypedTime(fixed);

  let preview = "";
  if (mode === "after" && minsNum !== null) {
    preview = adhan !== null
      ? `Today that would be iqama at ${fmt12(adhan + minsNum)} (adhan is ${fmt12(adhan)}).`
      : `Iqama will be ${minsNum} minutes after adhan every day.`;
  } else if (mode === "fixed" && fixedMins !== null) {
    preview = `Iqama will be at ${fmt12(fixedMins)} every day.`;
  }

  const save = async () => {
    let rule: IqamaRule;
    if (mode === "after") {
      if (minsNum === null || minsNum > 120) { setError("Please type a number of minutes between 0 and 120."); return; }
      rule = { mode: "after", minutes: minsNum };
    } else {
      if (fixedMins === null) { setError("Please type a time like 1:30 PM."); return; }
      rule = { mode: "fixed", time: fmt12(fixedMins) };
    }
    if (start === "date" && (!date || date < today)) { setError("Please choose today or a date in the future."); return; }
    if (adhan !== null && iqamaFromRule(rule, adhan) < adhan) {
      setError(`That would put iqama before the adhan (${fmt12(adhan)}). Please choose a later time.`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(key, rule, fromDate);
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const startLabel = (d: string) => parseISODate(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Modal
      title={prayer ? `Change ${periods.length ? "the usual " : ""}${PRAYER_NAMES[key]} iqama` : "Plan an iqama change"}
      subtitle={periods.length ? "This is the time for the rest of the year." : "When should the congregation start?"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            Save iqama time
          </button>
        </>
      }
    >
      {!prayer && (
        <div className="d-field">
          <label className="d-label" htmlFor="iq-prayer">Prayer</label>
          <select id="iq-prayer" className="d-select" value={key} onChange={e => pickPrayer(e.target.value as PrayerKey)}>
            {PRAYER_KEYS.map(k => <option key={k} value={k}>{PRAYER_NAMES[k]}</option>)}
          </select>
        </div>
      )}

      {periods.length > 0 && (
        <p className="d-notice d-notice--info" style={{ margin: 0 }}>
          Your different times for {periods.map(describePeriod).join(" and ")} stay as they are.
        </p>
      )}

      <div className="d-stack" style={{ gap: 12 }} role="radiogroup" aria-label="Kind of iqama time">
        <Choice name="iq-mode" checked={mode === "after"} onSelect={() => { setMode("after"); setError(""); }} title="A number of minutes after adhan">
          <div className="d-row">
            <input
              className="d-input"
              style={{ width: 100, textAlign: "center" }}
              inputMode="numeric"
              aria-label="Minutes after adhan"
              value={mins}
              onFocus={() => setMode("after")}
              onChange={e => { setMins(e.target.value); setMode("after"); setError(""); }}
            />
            <span className="d-muted">minutes after adhan</span>
          </div>
        </Choice>
        <Choice name="iq-mode" checked={mode === "fixed"} onSelect={() => { setMode("fixed"); setError(""); }} title="The same time every day">
          <input
            className="d-input"
            style={{ width: 180 }}
            aria-label="Iqama time"
            placeholder="e.g. 1:30 PM"
            value={fixed}
            onFocus={() => setMode("fixed")}
            onChange={e => { setFixed(e.target.value); setMode("fixed"); setError(""); }}
          />
        </Choice>
      </div>

      <div className="d-field">
        <label className="d-label" htmlFor="iq-start">Starting from</label>
        <select id="iq-start" className="d-select" style={{ maxWidth: 360 }} value={start} onChange={e => setStart(e.target.value as typeof start)}>
          <option value="today">Today ({startLabel(today)})</option>
          <option value="tomorrow">Tomorrow ({startLabel(addDaysISO(today, 1))})</option>
          <option value="date">A different date…</option>
        </select>
        {start === "date" && (
          <input type="date" className="d-input" style={{ maxWidth: 240 }} aria-label="Start date" min={today} value={date} onChange={e => setDate(e.target.value)} />
        )}
        <p className="d-help">Every day from then on uses the new time, until you change it again.</p>
      </div>

      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
      {!error && preview && <p className="d-strong" style={{ margin: 0, fontSize: 18 }}>{preview}</p>}
    </Modal>
  );
};

export default IqamaEditor;
