import React from "react";
import LocationMap from "../dashboard/components/LocationMap";
import { TIMEZONES } from "../dashboard/constants";
import { Icon, Spinner } from "../dashboard/ui";
import { StepHeader, WizardNav } from "./parts";

export interface Address {
  address: string;
  province: string;
  postalCode: string;
  country: string;
  timezone: string;
}

export const LocationStep: React.FC<{
  step: { index: number; total: number; name: string };
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  lat: number;
  lng: number;
  flyTrigger: number;
  onMovePin: (lat: string, lng: string) => void;
  onFind: () => void;
  finding: boolean;
  error: string;
  dark: boolean;
  onBack: () => void;
  onNext: () => void;
}> = ({ step, value, onChange, lat, lng, flyTrigger, onMovePin, onFind, finding, error, dark, onBack, onNext }) => {
  const field = (key: keyof Omit<Address, "timezone">, label: string, placeholder: string, autoComplete: string) => (
    <div className="d-field">
      <label className="d-label" htmlFor={`loc-${key}`}>{label}</label>
      <input
        id={`loc-${key}`}
        className="d-input"
        value={value[key]}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange({ [key]: e.target.value })}
        onKeyDown={e => { if (e.key === "Enter") onFind(); }}
      />
    </div>
  );

  return (
    <div className="d-page d-page--narrow">
      <StepHeader step={step} title="Where is the masjid?" sub="Adhan times are worked out for this spot on the map." />
      <div className="d-card d-card-pad">
        <div className="wz-location">
          <div className="d-stack" style={{ gap: 18 }}>
            {field("address", "Street address", "e.g. 123 Main Street, Toronto", "street-address")}
            <div className="d-grid-2" style={{ gap: 16 }}>
              {field("province", "Province or state", "e.g. Ontario", "address-level1")}
              {field("postalCode", "Postal code", "e.g. M5V 3A1", "postal-code")}
            </div>
            {field("country", "Country", "e.g. Canada", "country-name")}
            <button type="button" className="d-btn d-btn--secondary" style={{ alignSelf: "flex-start" }} onClick={onFind} disabled={finding}>
              {finding ? <Spinner /> : <Icon name="travel_explore" />}
              {finding ? "Finding the address…" : "Find this address on the map"}
            </button>
            {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}><Icon name="error" />{error}</p>}
            <div className="d-field">
              <label className="d-label" htmlFor="loc-tz">Time zone</label>
              <select id="loc-tz" className="d-select" value={value.timezone} onChange={e => onChange({ timezone: e.target.value })}>
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label.replace(" \u2014 ", ", ")}</option>)}
              </select>
            </div>
          </div>
          <div className="d-stack" style={{ gap: 10 }}>
            <span className="d-label" id="map-label">The masjid on the map</span>
            <div aria-labelledby="map-label">
              <LocationMap latitude={String(lat)} longitude={String(lng)} flyTrigger={flyTrigger} onChange={onMovePin} height="min(380px, 72vw)" dark={dark} />
            </div>
            <p className="d-help">If the pin is not quite right, click the map or drag the pin to the masjid.</p>
            <span className="wz-coords">Pin at {lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </div>
        </div>
      </div>
      <WizardNav onBack={onBack} onNext={onNext} />
    </div>
  );
};
