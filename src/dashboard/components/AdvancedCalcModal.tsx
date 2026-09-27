import React from "react";
import { Modal } from "../ui";
import {
  CALC_METHODS, HIGH_LATITUDE_RULES, MADHABS, METHOD_ANGLES, POLAR_CIRCLE_RESOLUTIONS, ROUNDING_OPTIONS, SHAFAQ_OPTIONS,
  type MonthPresetMap, type PrayerPreset,
} from "../constants";

interface AdvancedCalcModalProps {
  presets: PrayerPreset[];
  monthMap: MonthPresetMap;
  onUpdate: (id: string, patch: Partial<PrayerPreset>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSetMonth: (month: number, presetId: string) => void;
  onClose: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ADJUST = [
  { key: "adjustFajr", label: "Fajr" },
  { key: "adjustSunrise", label: "Sunrise" },
  { key: "adjustDhuhr", label: "Dhuhr" },
  { key: "adjustAsr", label: "Asr" },
  { key: "adjustMaghrib", label: "Maghrib" },
  { key: "adjustIsha", label: "Isha" },
] as const;

const SelectField: React.FC<{ id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; help?: string; disabled?: boolean }> = ({
  id, label, value, options, onChange, help, disabled,
}) => (
  <div className="d-field">
    <label className="d-label" htmlFor={id} style={{ fontSize: 16 }}>{label}</label>
    <select id={id} className="d-select" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {help && <p className="d-help">{help}</p>}
  </div>
);

const AdvancedCalcModal: React.FC<AdvancedCalcModalProps> = ({ presets, monthMap, onUpdate, onAdd, onDelete, onSetMonth, onClose }) => {
  const unassigned = MONTHS.filter((_, i) => !monthMap[i + 1]);
  return (
    <Modal
      size="xwide"
      title="Advanced settings"
      onClose={onClose}
      footer={<button type="button" className="d-btn d-btn--primary" onClick={onClose}>Done</button>}
    >
      <p className="d-notice d-notice--warn" style={{ margin: 0 }}>
        Most masjids never need to change these. Only change them if your imam or scholars advise it. Nothing is saved until you press Save changes on the Settings page.
      </p>
      {unassigned.length > 0 && (
        <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}>
          {unassigned.join(", ")} {unassigned.length === 1 ? "has" : "have"} no settings. Pick a group for every month before saving.
        </p>
      )}

      {presets.map((p, pi) => {
        const custom = p.method === "Other";
        const angles = METHOD_ANGLES[p.method] ?? METHOD_ANGLES.Other;
        const show = (n: number | null) => (n === null ? "" : String(n));
        return (
          <section key={p.id} className="d-card d-card-pad d-stack" style={{ gap: 20 }} aria-label={`Settings group ${pi + 1}`}>
            <div className="d-row" style={{ justifyContent: "space-between" }}>
              <span className="d-h3">{presets.length > 1 ? `Settings group ${pi + 1}` : "Settings for every month"}</span>
              {presets.length > 1 && (
                <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={() => onDelete(p.id)}><span className="material-symbols-outlined" aria-hidden="true">delete</span>Remove this group</button>
              )}
            </div>

            {presets.length > 1 && (
              <div className="d-stack" style={{ gap: 8 }}>
                <span className="d-label" style={{ fontSize: 16 }}>Months that use this group</span>
                <div className="d-row d-row--wrap" style={{ gap: 8 }}>
                  {MONTHS.map((name, i) => {
                    const month = i + 1;
                    const owned = monthMap[month] === p.id;
                    return (
                      <button
                        key={month}
                        type="button"
                        aria-pressed={owned}
                        className={`d-btn d-btn--sm ${owned ? "d-btn--primary" : "d-btn--secondary"}`}
                        style={{ minWidth: 72 }}
                        onClick={() => onSetMonth(month, owned ? "" : p.id)}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="d-grid-2">
              <SelectField id={`m-${p.id}`} label="Calculation method" value={p.method} options={CALC_METHODS} onChange={v => onUpdate(p.id, { method: v })} />
              <SelectField id={`a-${p.id}`} label="Asr" value={p.madhab} options={MADHABS} onChange={v => onUpdate(p.id, { madhab: v })} />
            </div>

            <div className="d-stack" style={{ gap: 8 }}>
              <span className="d-label" style={{ fontSize: 16 }}>Twilight angles {custom ? "" : <span className="d-faint" style={{ fontWeight: 400 }}>(set by the method; choose “Other / Custom” to change)</span>}</span>
              <div className="d-grid-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {([
                  { key: "fajrAngle", label: "Fajr angle", val: custom ? p.fajrAngle : show(angles.fajr) },
                  { key: "ishaAngle", label: "Isha angle", val: custom ? p.ishaAngle : show(angles.isha) },
                  { key: "ishaInterval", label: "Isha, minutes after Maghrib", val: custom ? p.ishaInterval : show(angles.ishaInterval) },
                  { key: "maghribAngle", label: "Maghrib angle", val: custom ? p.maghribAngle : show(angles.maghrib) },
                ] as const).map(f => (
                  <div key={f.key} className="d-field">
                    <label className="d-label" htmlFor={`${f.key}-${p.id}`} style={{ fontSize: 15, fontWeight: 400 }}>{f.label}</label>
                    <input
                      id={`${f.key}-${p.id}`}
                      className="d-input"
                      inputMode="decimal"
                      readOnly={!custom}
                      value={f.val}
                      placeholder="—"
                      onChange={e => custom && onUpdate(p.id, { [f.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="d-grid-2">
              <SelectField id={`hl-${p.id}`} label="Far north or south (high latitude)" value={p.highLatitudeRule} options={HIGH_LATITUDE_RULES} onChange={v => onUpdate(p.id, { highLatitudeRule: v })} help="Only matters where summer nights are very short." />
              <SelectField id={`pc-${p.id}`} label="When the sun doesn't set or rise" value={p.polarCircleResolution} options={POLAR_CIRCLE_RESOLUTIONS} onChange={v => onUpdate(p.id, { polarCircleResolution: v })} />
              <SelectField id={`sh-${p.id}`} label="Twilight (Moonsighting Committee only)" value={p.shafaq} options={SHAFAQ_OPTIONS} disabled={p.method !== "MoonsightingCommittee"} onChange={v => onUpdate(p.id, { shafaq: v })} />
              <SelectField id={`rd-${p.id}`} label="Rounding" value={p.rounding} options={ROUNDING_OPTIONS} onChange={v => onUpdate(p.id, { rounding: v })} />
            </div>

            <div className="d-stack" style={{ gap: 8 }}>
              <span className="d-label" style={{ fontSize: 16 }}>Move a prayer earlier or later (minutes)</span>
              <p className="d-help">For example, type 2 to make Maghrib 2 minutes later every day. Use a minus sign for earlier.</p>
              <div className="d-grid-3" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
                {ADJUST.map(a => (
                  <div key={a.key} className="d-field">
                    <label className="d-label" htmlFor={`${a.key}-${p.id}`} style={{ fontSize: 15, fontWeight: 400 }}>{a.label}</label>
                    <input id={`${a.key}-${p.id}`} className="d-input" style={{ textAlign: "center" }} inputMode="numeric" value={p[a.key]} onChange={e => onUpdate(p.id, { [a.key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <div className="d-row d-row--wrap" style={{ gap: 12 }}>
        <button type="button" className="d-btn d-btn--secondary" onClick={onAdd}><span className="material-symbols-outlined" aria-hidden="true">add</span>Use different settings for some months</button>
        <span className="d-help">For example, a different method in the summer months.</span>
      </div>
    </Modal>
  );
};

export default AdvancedCalcModal;
