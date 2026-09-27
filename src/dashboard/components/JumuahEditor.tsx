import React, { useState } from "react";
import { Modal, Spinner } from "../ui";
import { fmt12, parseTypedTime, displayTime } from "../time";

interface JumuahEditorProps {
  times: string[];
  slots: [boolean, boolean, boolean];
  onSave: (times: string[], slots: [boolean, boolean, boolean]) => Promise<void>;
  onClose: () => void;
}

const ORDINAL = ["1st", "2nd", "3rd"];

const JumuahEditor: React.FC<JumuahEditorProps> = ({ times, slots, onSave, onClose }) => {
  const enabled = slots.filter(Boolean).length;
  const [count, setCount] = useState(Math.max(1, enabled));
  const [values, setValues] = useState([0, 1, 2].map(i => (times[i] ? displayTime(times[i]) : "")));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const m = parseTypedTime(values[i] ?? "");
      if (m === null) { setError(`Please type a time for the ${ORDINAL[i]} khutbah, like 1:30 PM.`); return; }
      out.push(fmt12(m));
    }
    const nextSlots = [0, 1, 2].map(i => i < count) as [boolean, boolean, boolean];
    setError("");
    setSaving(true);
    try {
      await onSave([...out, "", "", ""].slice(0, 3), nextSlots);
    } catch (e) {
      setError((e as Error).message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Jumu'ah times"
      subtitle="These times are used for every Friday from today onwards."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            Save Jumu'ah times
          </button>
        </>
      }
    >
      <div className="d-field">
        <label className="d-label" htmlFor="jm-count">How many khutbahs?</label>
        <select id="jm-count" className="d-select" style={{ maxWidth: 220 }} value={count} onChange={e => setCount(Number(e.target.value))}>
          <option value={1}>1 khutbah</option>
          <option value={2}>2 khutbahs</option>
          <option value={3}>3 khutbahs</option>
        </select>
      </div>
      <div className="d-row d-row--wrap" style={{ gap: 16 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="d-field" style={{ width: 170 }}>
            <label className="d-label" htmlFor={`jm-${i}`}>{ORDINAL[i]} khutbah</label>
            <input
              id={`jm-${i}`}
              className="d-input"
              placeholder="e.g. 1:30 PM"
              value={values[i]}
              onChange={e => { const v = [...values]; v[i] = e.target.value; setValues(v); setError(""); }}
            />
          </div>
        ))}
      </div>
      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
    </Modal>
  );
};

export default JumuahEditor;
