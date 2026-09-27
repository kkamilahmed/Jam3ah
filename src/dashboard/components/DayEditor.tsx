import React, { useState } from "react";
import type { PrayerTime } from "../types";
import { Modal, Spinner } from "../ui";
import { PRAYER_KEYS, PRAYER_NAMES } from "../iqama";
import { displayTime, fmt12, parseISODate, parseTypedTime } from "../time";

interface DayEditorProps {
  day: PrayerTime;
  jamaat: { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
  jummahSlots: [boolean, boolean, boolean];
  onSave: (date: string, patch: Record<string, string | null>) => Promise<void>;
  onClose: () => void;
}

type Field = { key: string; label: string };

const DayEditor: React.FC<DayEditorProps> = ({ day, jamaat, jummahSlots, onSave, onClose }) => {
  const row = day as unknown as Record<string, string | undefined>;
  const isFriday = parseISODate(day.date).getDay() === 5;

  const groups: { title: string; fields: Field[] }[] = PRAYER_KEYS.map(k => {
    const fields: Field[] = [
      { key: `${k}_adhan`, label: "Adhan" },
      { key: `${k}_iqama`, label: "Iqama" },
    ];
    if (k === "fajr" || k === "maghrib") {
      if (jamaat[`${k}2`]) fields.push({ key: `${k}_iqama_2`, label: "2nd jamaat" });
      if (jamaat[`${k}3`]) fields.push({ key: `${k}_iqama_3`, label: "3rd jamaat" });
    }
    return { title: PRAYER_NAMES[k], fields };
  });
  if (isFriday && jummahSlots.some(Boolean)) {
    groups.push({
      title: "Jumu'ah",
      fields: jummahSlots.flatMap((on, i) => (on ? [{ key: `jummah_${i + 1}`, label: `Khutbah ${i + 1}` }] : [])),
    });
  }

  const initial: Record<string, string> = {};
  for (const g of groups) for (const f of g.fields) {
    const v = row[f.key] || (f.key.endsWith("_adhan") ? row[f.key.replace("_adhan", "")] : "") || "";
    initial[f.key] = v ? displayTime(v) : "";
  }
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const patch: Record<string, string | null> = {};
    for (const [key, raw] of Object.entries(values)) {
      if (raw === initial[key]) continue;
      if (!raw.trim()) { patch[key] = null; continue; }
      const m = parseTypedTime(raw);
      if (m === null) { setError(`"${raw}" is not a time we can read. Please type it like 1:30 PM.`); return; }
      patch[key] = fmt12(m);
    }
    if (Object.keys(patch).length === 0) { onClose(); return; }
    setError("");
    setSaving(true);
    try {
      await onSave(day.date, patch);
    } catch (e) {
      setError((e as Error).message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Modal
      size="wide"
      title={`Change ${parseISODate(day.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}`}
      subtitle="Only this day changes. Type times like 1:30 PM."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="d-btn d-btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            Save this day
          </button>
        </>
      }
    >
      {groups.map(g => (
        <div key={g.title} className="d-row d-row--wrap" style={{ alignItems: "flex-end", gap: 16 }}>
          <span className="d-h3" style={{ width: 110, paddingBottom: 12 }}>{g.title}</span>
          {g.fields.map(f => (
            <div key={f.key} className="d-field" style={{ width: 160 }}>
              <label className="d-label" htmlFor={`day-${f.key}`} style={{ fontSize: 16 }}>{f.label}</label>
              <input
                id={`day-${f.key}`}
                className="d-input"
                value={values[f.key]}
                placeholder="—"
                onChange={e => { setValues(v => ({ ...v, [f.key]: e.target.value })); setError(""); }}
              />
            </div>
          ))}
        </div>
      ))}
      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>{error}</p>}
    </Modal>
  );
};

export default DayEditor;
