import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CALC_METHODS, TIMEZONES, type MonthPresetMap, type PrayerPreset } from "../constants";
import LocationMap from "../components/LocationMap";
import AdvancedCalcModal from "../components/AdvancedCalcModal";
import { Choice, Icon, Spinner, ToggleRow } from "../ui";

export interface GeneralSettings {
  masjidName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

type Jamaat = { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
type Location = { latitude: string; longitude: string; timezone: string };

interface SettingsTabProps {
  dark: boolean;
  registeredEmail: string;
  general: GeneralSettings;
  setGeneral: React.Dispatch<React.SetStateAction<GeneralSettings>>;
  savedGeneral: GeneralSettings;
  onSaveGeneral: () => Promise<void>;
  location: Location;
  setLocation: (patch: Partial<Location>) => void;
  savedLocation: Location;
  presets: PrayerPreset[];
  monthMap: MonthPresetMap;
  savedPresets: PrayerPreset[];
  savedMonthMap: MonthPresetMap;
  onUpdatePreset: (id: string, patch: Partial<PrayerPreset>) => void;
  onAddPreset: () => void;
  onDeletePreset: (id: string) => void;
  onSetMonthPreset: (month: number, presetId: string) => void;
  onSaveCalculation: () => void;
  onUndoCalculation: () => void;
  savingCalculation: boolean;
  jamaat: Jamaat;
  onSetJamaat: (next: Jamaat) => void;
}

const METHOD_HELP: Record<string, string> = {
  NorthAmerica: "Used by most masjids in Canada and the USA.",
  MoonsightingCommittee: "Popular in North America and the UK. Adjusts Fajr and Isha by season.",
  MuslimWorldLeague: "Common in Europe and the Far East.",
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const SettingsTab: React.FC<SettingsTabProps> = ({
  dark, registeredEmail, general, setGeneral, savedGeneral, onSaveGeneral, location, setLocation, savedLocation,
  presets, monthMap, savedPresets, savedMonthMap, onUpdatePreset, onAddPreset, onDeletePreset, onSetMonthPreset,
  onSaveCalculation, onUndoCalculation, savingCalculation, jamaat, onSetJamaat,
}) => {
  const navigate = useNavigate();
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const generalDirty = JSON.stringify(general) !== JSON.stringify(savedGeneral);
  const calcDirty =
    JSON.stringify(presets) !== JSON.stringify(savedPresets) ||
    JSON.stringify(monthMap) !== JSON.stringify(savedMonthMap) ||
    JSON.stringify(location) !== JSON.stringify(savedLocation);
  const allMonthsAssigned = Array.from({ length: 12 }, (_, i) => i + 1).every(m => !!monthMap[m]);
  const single = presets.length === 1 ? presets[0] : null;

  const field = (key: keyof GeneralSettings, label: string, opts: { placeholder?: string; help?: string; autoComplete?: string } = {}) => (
    <div className="d-field">
      <label className="d-label" htmlFor={`g-${key}`}>{label}</label>
      <input
        id={`g-${key}`}
        className="d-input"
        value={general[key]}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        onChange={e => setGeneral(g => ({ ...g, [key]: e.target.value }))}
      />
      {opts.help && <p className="d-help">{opts.help}</p>}
    </div>
  );

  const saveGeneral = async () => {
    setSavingGeneral(true);
    try { await onSaveGeneral(); } finally { setSavingGeneral(false); }
  };

  const monthsFor = (id: string) => {
    const ms = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => monthMap[m] === id);
    return ms.length === 12 ? "Every month" : ms.map(m => MONTH_NAMES[m - 1]).join(", ") || "No months yet";
  };
  const methodLabel = (v: string) => CALC_METHODS.find(m => m.value === v)?.label ?? v;

  return (
    <div className="d-page d-page--narrow">
      <div className="d-stack" style={{ gap: 8 }}>
        <h1 className="d-h1">Settings</h1>
        <p className="d-sub">Your masjid's details and how prayer times are worked out.</p>
      </div>

      <section className="d-card d-card-pad d-stack" style={{ gap: 20 }} aria-labelledby="det-h">
        <h2 id="det-h" className="d-h2">Masjid details</h2>
        {field("masjidName", "Masjid name", { autoComplete: "organization" })}
        <div className="d-grid-2">
          {field("phone", "Phone number", { placeholder: "e.g. 416 555 0100", help: "Shown on your TV screen and in the app.", autoComplete: "tel" })}
          <div className="d-field">
            <label className="d-label" htmlFor="g-email">Email</label>
            <input id="g-email" className="d-input" value={registeredEmail || "—"} readOnly />
            <p className="d-help">This is how you sign in. Contact us to change it.</p>
          </div>
        </div>
        {field("address", "Street address", { autoComplete: "street-address" })}
        <div className="d-grid-3">
          {field("city", "City", { autoComplete: "address-level2" })}
          {field("province", "Province or state", { autoComplete: "address-level1" })}
          {field("postalCode", "Postal code", { autoComplete: "postal-code" })}
        </div>
        {(generalDirty || savingGeneral) && (
          <div className="d-row d-row--wrap" style={{ justifyContent: "flex-end", gap: 12, paddingTop: 4 }}>
            <span className="d-strong" style={{ color: "var(--d-warn)", marginRight: "auto" }}>You have changes that are not saved yet.</span>
            <button type="button" className="d-btn d-btn--secondary" onClick={() => setGeneral(savedGeneral)} disabled={savingGeneral}>Undo changes</button>
            <button type="button" className="d-btn d-btn--primary" onClick={saveGeneral} disabled={savingGeneral}>{savingGeneral && <Spinner />}Save details</button>
          </div>
        )}
      </section>

      <section className="d-card d-card-pad d-stack" style={{ gap: 18 }} aria-labelledby="loc-h">
        <div className="d-stack" style={{ gap: 4 }}>
          <h2 id="loc-h" className="d-h2">Where is the masjid?</h2>
          <span className="d-muted">Adhan times are worked out for this spot on the map.</span>
        </div>
        <LocationMap
          latitude={location.latitude}
          longitude={location.longitude}
          dark={dark}
          height={280}
          readOnly={!editingPin}
          onChange={editingPin ? (lat, lng) => setLocation({ latitude: lat, longitude: lng }) : undefined}
        />
        {editingPin && <p className="d-notice d-notice--accent" style={{ margin: 0 }}><Icon name="touch_app" />Click the map or drag the pin to where the masjid is.</p>}
        <div className="d-row d-row--wrap" style={{ gap: 16, alignItems: "flex-end" }}>
          <div className="d-field" style={{ flex: 1, minWidth: 260 }}>
            <label className="d-label" htmlFor="loc-tz">Time zone</label>
            <select id="loc-tz" className="d-select" value={location.timezone} onChange={e => setLocation({ timezone: e.target.value })}>
              {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button type="button" className="d-btn d-btn--secondary" onClick={() => setEditingPin(v => !v)} aria-pressed={editingPin}>
            <Icon name={editingPin ? "check" : "location_on"} />{editingPin ? "Done moving the pin" : "Move the pin"}
          </button>
        </div>
      </section>

      <section className="d-card d-card-pad d-stack" style={{ gap: 20 }} aria-labelledby="calc-h">
        <div className="d-stack" style={{ gap: 4 }}>
          <h2 id="calc-h" className="d-h2">How adhan times are worked out</h2>
          <span className="d-muted">If you are not sure, keep these as they are and ask your imam.</span>
        </div>

        {single ? (
          <>
            <div className="d-field">
              <label className="d-label" htmlFor="calc-method">Calculation method</label>
              <select id="calc-method" className="d-select" value={single.method} onChange={e => onUpdatePreset(single.id, { method: e.target.value })}>
                {CALC_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <p className="d-help">{METHOD_HELP[single.method] ?? "Ask your imam if you are not sure which method your masjid follows."}</p>
            </div>
            <div className="d-stack" style={{ gap: 10 }} role="radiogroup" aria-labelledby="asr-label">
              <span id="asr-label" className="d-label">When does Asr start?</span>
              <div className="d-grid-2" style={{ gap: 14 }}>
                <Choice name="asr" checked={single.madhab !== "Hanafi"} onSelect={() => onUpdatePreset(single.id, { madhab: "Shafi" })} title="Standard" body="Shafi'i, Maliki and Hanbali. Asr starts earlier." />
                <Choice name="asr" checked={single.madhab === "Hanafi"} onSelect={() => onUpdatePreset(single.id, { madhab: "Hanafi" })} title="Hanafi" body="Asr starts later in the afternoon." />
              </div>
            </div>
          </>
        ) : (
          <div className="d-stack" style={{ gap: 0 }}>
            <p className="d-muted" style={{ margin: "0 0 8px" }}>Your masjid uses different settings in different months:</p>
            {presets.map(p => (
              <div key={p.id} className="d-list-row">
                <div className="d-stack" style={{ gap: 2 }}>
                  <span className="d-strong">{monthsFor(p.id)}</span>
                  <span className="d-muted d-small">{methodLabel(p.method)} · {p.madhab === "Hanafi" ? "Hanafi Asr" : "Standard Asr"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="d-btn d-btn--secondary" style={{ alignSelf: "flex-start" }} onClick={() => setAdvancedOpen(true)}>
          <Icon name="tune" />Advanced settings
        </button>
      </section>

      {(calcDirty || savingCalculation) && (
        <div className="d-card d-card-pad d-row d-row--wrap" style={{ gap: 12, position: "sticky", bottom: 16, zIndex: 5, boxShadow: "var(--d-shadow-pop)" }} role="region" aria-label="Unsaved changes">
          <div className="d-stack" style={{ gap: 2, marginRight: "auto" }}>
            <span className="d-strong" style={{ color: "var(--d-warn)" }}>Your location or prayer settings have changed.</span>
            <span className="d-muted d-small">
              {allMonthsAssigned ? "Save to use them. You can choose whether to update the prayer times you already have." : "Every month needs settings before you can save. Open Advanced settings."}
            </span>
          </div>
          <button type="button" className="d-btn d-btn--secondary" onClick={() => { onUndoCalculation(); setEditingPin(false); }} disabled={savingCalculation}>Undo changes</button>
          <button type="button" className="d-btn d-btn--primary" onClick={() => { onSaveCalculation(); setEditingPin(false); }} disabled={savingCalculation || !allMonthsAssigned}>
            {savingCalculation && <Spinner />}Save changes
          </button>
        </div>
      )}

      <section className="d-card d-card-pad d-stack" style={{ gap: 0, paddingBottom: 8 }} aria-labelledby="jam-h">
        <div className="d-stack" style={{ gap: 4, paddingBottom: 18 }}>
          <h2 id="jam-h" className="d-h2">Extra jamaats</h2>
          <span className="d-muted">Turn these on if your masjid holds more than one congregation. Jumu'ah times are set on the Prayer times page.</span>
        </div>
        <ToggleRow title="Second Fajr jamaat" body="Adds a second iqama time for Fajr." checked={jamaat.fajr2} onChange={v => onSetJamaat({ ...jamaat, fajr2: v, fajr3: v ? jamaat.fajr3 : false })} />
        <ToggleRow title="Third Fajr jamaat" body="Needs the second Fajr jamaat to be on." checked={jamaat.fajr3} disabled={!jamaat.fajr2} onChange={v => onSetJamaat({ ...jamaat, fajr3: v })} />
        <ToggleRow title="Second Maghrib jamaat" body="Adds a second iqama time for Maghrib." checked={jamaat.maghrib2} onChange={v => onSetJamaat({ ...jamaat, maghrib2: v, maghrib3: v ? jamaat.maghrib3 : false })} />
        <ToggleRow title="Third Maghrib jamaat" body="Needs the second Maghrib jamaat to be on." checked={jamaat.maghrib3} disabled={!jamaat.maghrib2} onChange={v => onSetJamaat({ ...jamaat, maghrib3: v })} />
      </section>

      <section className="d-card d-card-pad d-row d-row--wrap" style={{ gap: 16 }} aria-labelledby="wiz-h">
        <div className="d-stack" style={{ gap: 4, flex: 1, minWidth: 260 }}>
          <h2 id="wiz-h" className="d-h3">Start again with the setup guide</h2>
          <span className="d-muted">Walks you through location, calculation and iqama times step by step.</span>
        </div>
        <button type="button" className="d-btn d-btn--secondary" onClick={() => navigate("/onboarding")}><Icon name="restart_alt" />Open the setup guide</button>
      </section>

      {advancedOpen && (
        <AdvancedCalcModal
          presets={presets}
          monthMap={monthMap}
          onUpdate={onUpdatePreset}
          onAdd={onAddPreset}
          onDelete={onDeletePreset}
          onSetMonth={onSetMonthPreset}
          onClose={() => setAdvancedOpen(false)}
        />
      )}
    </div>
  );
};

export default SettingsTab;
