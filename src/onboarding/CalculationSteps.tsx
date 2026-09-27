import React from "react";
import { Choice, Icon } from "../dashboard/ui";
import {
  CALC_METHODS, HIGH_LATITUDE_RULES, METHOD_ANGLES, POLAR_CIRCLE_RESOLUTIONS, ROUNDING_OPTIONS, SHAFAQ_OPTIONS,
} from "../dashboard/constants";
import { Disclosure, SelectField, StepHeader, WizardNav } from "./parts";
import { METHOD_HELP, MONTH_NAMES, type WizardPreset } from "./schedule";

type StepInfo = { index: number; total: number; name: string };

// ── Step 3: one set of settings, or different ones in some months ───────
export const GroupCountStep: React.FC<{
  step: StepInfo;
  count: number | null;
  setCount: (n: number) => void;
  onBack: () => void;
  onNext: () => void;
}> = ({ step, count, setCount, onBack, onNext }) => (
  <div className="d-page d-page--narrow">
    <StepHeader
      step={step}
      title="Are your settings the same all year?"
      sub="Most masjids work out adhan times the same way in every month."
    />
    <div className="d-card d-card-pad d-stack" role="radiogroup" aria-label="Settings through the year" style={{ gap: 14 }}>
      <Choice name="groups" checked={count === 1} onSelect={() => setCount(1)} title="Yes, the same all year" body="Recommended. You can change this later in Settings." />
      <Choice
        name="groups"
        checked={count !== null && count > 1}
        onSelect={() => setCount(count && count > 1 ? count : 2)}
        title="No, some months are different"
        body="For example, a different calculation method in the summer months."
      >
        {count !== null && count > 1 && (
          <div className="d-field" style={{ maxWidth: 320 }}>
            <label className="d-label" htmlFor="group-count">How many different settings?</label>
            <select id="group-count" className="d-select" value={count} onChange={e => setCount(Number(e.target.value))}>
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} sets of settings</option>)}
            </select>
          </div>
        )}
      </Choice>
    </div>
    <WizardNav onBack={onBack} onNext={onNext} nextDisabled={!count} hint={!count ? "Choose an answer to continue" : undefined} />
  </div>
);

// ── Step 4: calculation method, Asr and advanced settings per group ─────
const ADJUST = [
  { key: "adjustFajr", label: "Fajr" },
  { key: "adjustSunrise", label: "Sunrise" },
  { key: "adjustDhuhr", label: "Dhuhr" },
  { key: "adjustAsr", label: "Asr" },
  { key: "adjustMaghrib", label: "Maghrib" },
  { key: "adjustIsha", label: "Isha" },
] as const;

const GroupSettings: React.FC<{
  preset: WizardPreset;
  presets: WizardPreset[];
  index: number;
  onPatch: (patch: Partial<WizardPreset>) => void;
  onToggleMonth: (month: number) => void;
}> = ({ preset: p, presets, index, onPatch, onToggleMonth }) => {
  const multi = presets.length > 1;
  const custom = p.method === "Other";
  const angles = METHOD_ANGLES[p.method] ?? METHOD_ANGLES.Other;
  const show = (n: number | null) => (n === null ? "" : String(n));
  const ownerOf = (month: number) => presets.find(o => o.months.includes(month));

  return (
    <section className="d-card d-card-pad d-stack" style={{ gap: 24 }} aria-labelledby={`grp-${p.id}`}>
      {multi && (
        <>
          <div className="d-row" style={{ gap: 14 }}>
            <span className="d-badge">{index + 1}</span>
            <h2 id={`grp-${p.id}`} className="d-h2">{p.name.trim() || `Settings ${index + 1}`}</h2>
          </div>
          <div className="d-field">
            <label className="d-label" htmlFor={`name-${p.id}`}>Name for these settings</label>
            <input id={`name-${p.id}`} className="d-input" style={{ maxWidth: 420 }} value={p.name} placeholder="e.g. Winter" onChange={e => onPatch({ name: e.target.value })} />
          </div>
          <div className="d-stack" style={{ gap: 8 }}>
            <span className="d-label" id={`months-${p.id}`}>Months that use these settings</span>
            <div className="wz-months" role="group" aria-labelledby={`months-${p.id}`}>
              {MONTH_NAMES.map((name, i) => {
                const month = i + 1;
                const owned = p.months.includes(month);
                const other = !owned ? ownerOf(month) : undefined;
                return (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={owned}
                    title={other ? `Now in "${other.name || "another group"}". Press to move it here.` : undefined}
                    className={`d-btn d-btn--sm ${owned ? "d-btn--primary" : "d-btn--secondary"}`}
                    onClick={() => onToggleMonth(month)}
                  >
                    {name.slice(0, 3)}
                    {other && <span className="d-sr-only">, used by {other.name || "another group"}</span>}
                  </button>
                );
              })}
            </div>
            <p className="d-help">Press a month to add it here. A month can only be in one group.</p>
          </div>
        </>
      )}
      {!multi && <h2 id={`grp-${p.id}`} className="d-sr-only">Settings for every month</h2>}

      <SelectField
        id={`method-${p.id}`}
        label="Calculation method"
        value={p.method}
        options={CALC_METHODS}
        onChange={v => onPatch({ method: v })}
        help={METHOD_HELP[p.method] ?? "Ask your imam if you are not sure which method your masjid follows."}
      />

      <div className="d-stack" style={{ gap: 10 }} role="radiogroup" aria-labelledby={`asr-${p.id}`}>
        <span id={`asr-${p.id}`} className="d-label">When does Asr start?</span>
        <div className="d-grid-2" style={{ gap: 14 }}>
          <Choice name={`asr-${p.id}`} checked={p.madhab !== "Hanafi"} onSelect={() => onPatch({ madhab: "Shafi" })} title="Standard" body="Shafi'i, Maliki and Hanbali. Asr starts earlier." />
          <Choice name={`asr-${p.id}`} checked={p.madhab === "Hanafi"} onSelect={() => onPatch({ madhab: "Hanafi" })} title="Hanafi" body="Asr starts later in the afternoon." />
        </div>
      </div>

      <div className="wz-advanced">
        <Disclosure label="Advanced settings">
          <p className="d-notice d-notice--warn" style={{ margin: 0 }}>
            <Icon name="warning" />
            Most masjids never need to change these. Only change them if your imam or scholars advise it.
          </p>
          <div className="d-stack" style={{ gap: 8 }}>
            <span className="d-label">
              Twilight angles{" "}
              {!custom && <span className="d-faint" style={{ fontWeight: 400 }}>(set by the method; choose "Other / Custom" to change them)</span>}
            </span>
            <div className="wz-grid-4">
              {([
                { key: "fajrAngle", label: "Fajr angle", val: custom ? p.fajrAngle : show(angles.fajr) },
                { key: "ishaAngle", label: "Isha angle", val: custom ? p.ishaAngle : show(angles.isha) },
                { key: "ishaInterval", label: "Isha, minutes after Maghrib", val: custom ? p.ishaInterval : show(angles.ishaInterval) },
                { key: "maghribAngle", label: "Maghrib angle", val: custom ? p.maghribAngle : show(angles.maghrib) },
              ] as const).map(f => (
                <div key={f.key} className="d-field">
                  <label className="d-label" htmlFor={`${f.key}-${p.id}`} style={{ fontSize: 16, fontWeight: 400 }}>{f.label}</label>
                  <input
                    id={`${f.key}-${p.id}`}
                    className="d-input"
                    inputMode="decimal"
                    readOnly={!custom}
                    value={f.val}
                    placeholder={custom ? "" : "Not used"}
                    onChange={e => custom && onPatch({ [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="d-grid-2">
            <SelectField id={`hl-${p.id}`} label="Far north or south (high latitude)" value={p.highLatitudeRule} options={HIGH_LATITUDE_RULES} onChange={v => onPatch({ highLatitudeRule: v })} help="Only matters where summer nights are very short." />
            <SelectField id={`pc-${p.id}`} label="When the sun doesn't set or rise" value={p.polarCircleResolution} options={POLAR_CIRCLE_RESOLUTIONS} onChange={v => onPatch({ polarCircleResolution: v })} />
            <SelectField id={`sh-${p.id}`} label="Twilight (Moonsighting Committee only)" value={p.shafaq} options={SHAFAQ_OPTIONS} disabled={p.method !== "MoonsightingCommittee"} onChange={v => onPatch({ shafaq: v })} />
            <SelectField id={`rd-${p.id}`} label="Rounding" value={p.rounding} options={ROUNDING_OPTIONS} onChange={v => onPatch({ rounding: v })} />
          </div>
          <div className="d-stack" style={{ gap: 8 }}>
            <span className="d-label">Move a prayer earlier or later (minutes)</span>
            <p className="d-help">For example, type 2 to make Maghrib 2 minutes later every day. Use a minus sign for earlier.</p>
            <div className="wz-grid-6">
              {ADJUST.map(a => (
                <div key={a.key} className="d-field">
                  <label className="d-label" htmlFor={`${a.key}-${p.id}`} style={{ fontSize: 16, fontWeight: 400 }}>{a.label}</label>
                  <input id={`${a.key}-${p.id}`} className="d-input" style={{ textAlign: "center" }} inputMode="numeric" value={p[a.key]} onChange={e => onPatch({ [a.key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      </div>
    </section>
  );
};

export const CalculationStep: React.FC<{
  step: StepInfo;
  presets: WizardPreset[];
  onPatch: (id: string, patch: Partial<WizardPreset>) => void;
  onToggleMonth: (id: string, month: number) => void;
  onBack: () => void;
  onNext: () => void;
}> = ({ step, presets, onPatch, onToggleMonth, onBack, onNext }) => {
  const unassigned = MONTH_NAMES.filter((_, i) => !presets.some(p => p.months.includes(i + 1)));
  return (
    <div className="d-page d-page--narrow">
      <StepHeader
        step={step}
        title="How are adhan times worked out?"
        sub="If you are not sure, keep these as they are and ask your imam."
      />
      {presets.map((p, i) => (
        <GroupSettings
          key={p.id}
          preset={p}
          presets={presets}
          index={i}
          onPatch={patch => onPatch(p.id, patch)}
          onToggleMonth={m => onToggleMonth(p.id, m)}
        />
      ))}
      {unassigned.length > 0 && (
        <p role="status" className="d-notice d-notice--warn" style={{ margin: 0 }}>
          <Icon name="warning" />
          <span>
            {unassigned.length === 12 ? "No months have settings yet." : `${unassigned.join(", ")} ${unassigned.length === 1 ? "has" : "have"} no settings yet.`}{" "}
            Choose the months for each group above.
          </span>
        </p>
      )}
      <WizardNav onBack={onBack} onNext={onNext} nextDisabled={unassigned.length > 0} hint={unassigned.length > 0 ? "Every month needs settings" : undefined} />
    </div>
  );
};
