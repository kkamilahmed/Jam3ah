import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import { supabaseAdmin } from "../../lib/supabase";
import { THEMES, type ThemeKey } from "../themes";
import {
  CALC_METHODS, TIMEZONES, MADHABS, HIGH_LATITUDE_RULES,
  POLAR_CIRCLE_RESOLUTIONS, SHAFAQ_OPTIONS, ROUNDING_OPTIONS, METHOD_ANGLES,
  type PrayerPreset, type MonthPresetMap,
} from "../constants";
import LocalInput from "../components/LocalInput";
import Select from "../components/Select";
import LocationMap from "../components/LocationMap";

interface SettingsTabProps {
  theme: typeof THEMES[ThemeKey];
  registeredEmail: string;
  generalSettings: {
    masjidName: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  setGeneralSettings: React.Dispatch<React.SetStateAction<SettingsTabProps["generalSettings"]>>;
  settingsSaved: boolean;
  savedGeneralSettings: SettingsTabProps["generalSettings"];
  handleSaveSettings: () => void;
  prayerSettings: {
    latitude: string; longitude: string; timezone: string;
    method: string; fajrAngle: string; ishaAngle: string;
    ishaInterval: string; maghribAngle: string;
    madhab: string; highLatitudeRule: string;
    polarCircleResolution: string; shafaq: string; rounding: string;
    adjustFajr: string; adjustSunrise: string; adjustDhuhr: string;
    adjustAsr: string; adjustMaghrib: string; adjustIsha: string;
  };
  setPrayerSettings: React.Dispatch<React.SetStateAction<SettingsTabProps["prayerSettings"]>>;
  jamaatSettings: { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
  setJamaatSettings: React.Dispatch<React.SetStateAction<{ fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean }>>;
  extraTimings: { fajr: string[]; maghrib: string[]; jummah: string[]; jummahSlots: [boolean, boolean, boolean]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } };
  setExtraTimings: React.Dispatch<React.SetStateAction<{ fajr: string[]; maghrib: string[]; jummah: string[]; jummahSlots: [boolean, boolean, boolean]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } }>>;
  prayerPresets: PrayerPreset[];
  monthPresetMap: MonthPresetMap;
  handleAddPreset: () => void;
  handleDeletePreset: (id: string) => void;
  handleUpdatePreset: (id: string, patch: Partial<PrayerPreset>) => void;
  handleSetMonthPreset: (month: number, presetId: string) => void;
  presetsSaved: boolean;
  savedPrayerPresets: PrayerPreset[];
  savedMonthPresetMap: MonthPresetMap;
  handleCancelPresets: () => void;
  handleSavePresetsOnly: () => void;
  handleSavePresetsAndRegen: () => void;
  hasGeneratedMonths: boolean;
}

// ── Shared style constants ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--surface-low)",
  border: "1px solid var(--outline-variant)",
  color: "var(--on-surface)",
  borderRadius: 2,
  fontFamily: "Manrope, sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  opacity: 0.4,
  cursor: "not-allowed",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-ghost)",
  display: "block",
  marginBottom: 6,
  fontFamily: "Manrope, sans-serif",
};


const cardStyle: React.CSSProperties = {
  background: "var(--surface-low)",
  border: "1px solid var(--surface-high)",
  borderRadius: 2,
  overflow: "hidden",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "18px 24px",
  borderBottom: "1px solid var(--outline-subtle)",
};

const cardBodyStyle: React.CSSProperties = {
  padding: "20px 24px",
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Card: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; headerExtra?: React.ReactNode; compact?: boolean; noPadding?: boolean }> = ({
  title, subtitle, children, headerExtra, compact = false, noPadding = false,
}) => (
  <div style={cardStyle}>
    {(title || headerExtra) && (
      <div style={{ ...cardHeaderStyle, padding: compact ? "12px 16px" : "18px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {title && <div style={{ fontFamily: "Manrope, sans-serif", fontSize: compact ? 14 : 15, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>{title}</div>}
          {subtitle && (
            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: compact ? 12 : 13, color: "var(--text-dim)", fontWeight: 400, marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {headerExtra && <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>{headerExtra}</div>}
      </div>
    )}
    <div style={noPadding ? undefined : { ...cardBodyStyle, padding: compact ? "16px 16px" : "20px 24px" }}>{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const PRESET_DOTS = ["#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SectionHeading: React.FC<{ label: string; action?: React.ReactNode }> = ({ label, action }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 8, paddingBottom: 12, borderBottom: "1px solid var(--outline-subtle)" }}>
    <h2 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>{label}</h2>
    {action && <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{action}</div>}
  </div>
);

const SettingsTab: React.FC<SettingsTabProps> = ({
  theme,
  registeredEmail,
  generalSettings, setGeneralSettings,
  settingsSaved, savedGeneralSettings, handleSaveSettings,
  prayerSettings, setPrayerSettings,
  jamaatSettings, setJamaatSettings,
  extraTimings, setExtraTimings,
  prayerPresets, monthPresetMap,
  handleAddPreset, handleDeletePreset, handleUpdatePreset,
  handleSetMonthPreset, presetsSaved,
  savedPrayerPresets, savedMonthPresetMap, handleCancelPresets,
  handleSavePresetsOnly, handleSavePresetsAndRegen, hasGeneratedMonths,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedExplainerOpen, setFeedExplainerOpen] = useState(false);
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});
  const [editingLocation, setEditingLocation] = useState(false);

  const hasPresetChanges =
    JSON.stringify(prayerPresets) !== JSON.stringify(savedPrayerPresets) ||
    JSON.stringify(monthPresetMap) !== JSON.stringify(savedMonthPresetMap);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(k => k === key ? null : k), 2000);
    });
  };

  void theme;

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 73px)", background: "var(--bg)", fontFamily: "Manrope, sans-serif", overflowX: "hidden" }}>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 80px" : "28px 32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Masjid Profile ── */}
          <section id="settings-profile" style={sectionStyle}>
            {(() => {
              const hasChanges = JSON.stringify(generalSettings) !== JSON.stringify(savedGeneralSettings);
              return (
                <>
                <SectionHeading label="Masjid Profile" action={
                  hasChanges ? (
                    <button onClick={handleSaveSettings} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
                      Save
                    </button>
                  ) : settingsSaved ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "rgba(100,200,100,0.8)", fontFamily: "Manrope, sans-serif" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                      Saved
                    </span>
                  ) : null
                } />
                <Card compact={isMobile}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <Field label="Masjid / Academy Name">
                        <LocalInput style={inputStyle} value={generalSettings.masjidName}
                          onCommit={v => setGeneralSettings({ ...generalSettings, masjidName: v })}
                          placeholder="e.g., Toronto Hifz Academy" />
                      </Field>
                      <Field label="Registered Email">
                        <div style={{ ...inputStyle, opacity: 0.4, cursor: "not-allowed", userSelect: "none" }}>
                          {registeredEmail || "—"}
                        </div>
                      </Field>
                    </div>

                    <Field label="Street Address">
                      <LocalInput style={inputStyle} value={generalSettings.address}
                        onCommit={v => setGeneralSettings({ ...generalSettings, address: v })}
                        placeholder="123 Main St" />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 12 }}>
                      <Field label="City">
                        <LocalInput style={inputStyle} value={generalSettings.city}
                          onCommit={v => setGeneralSettings({ ...generalSettings, city: v })}
                          placeholder="Toronto" />
                      </Field>
                      <Field label="Province">
                        <LocalInput style={inputStyle} value={generalSettings.province}
                          onCommit={v => setGeneralSettings({ ...generalSettings, province: v })}
                          placeholder="ON" />
                      </Field>
                      <Field label="Postal Code">
                        <LocalInput style={inputStyle} value={generalSettings.postalCode}
                          onCommit={v => setGeneralSettings({ ...generalSettings, postalCode: v })}
                          placeholder="M9A 1A1" />
                      </Field>
                      <Field label="Contact Number">
                        <LocalInput style={inputStyle} value={generalSettings.phone}
                          onCommit={v => setGeneralSettings({ ...generalSettings, phone: v })}
                          placeholder="+1 (416) 555-0000" />
                      </Field>
                    </div>

                  </div>
                </Card>
                </>
              );
            })()}
          </section>

          {/* ── Prayer Configuration ── */}
          <section id="settings-prayer" style={sectionStyle}>
            <SectionHeading label="Prayer Configuration" />

            {/* Location + Jamaats/Jummah side by side */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, alignItems: "stretch" }}>

              {/* Left: Location */}
              <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
                <div style={{ ...cardHeaderStyle, padding: isMobile ? "12px 16px" : "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontFamily: "Manrope, sans-serif", fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Location</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {editingLocation && (
                      <button
                        onClick={() => setMapFlyTrigger(t => t + 1)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>my_location</span>
                        Back to pin
                      </button>
                    )}
                    <button
                      onClick={() => setEditingLocation(e => !e)}
                      style={editingLocation
                        ? { display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--accent-text)", cursor: "pointer" }
                        : { display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                      onMouseEnter={e => { if (!editingLocation) { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; } }}
                      onMouseLeave={e => { if (!editingLocation) { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; } }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{editingLocation ? "check" : "edit_location_alt"}</span>
                      {editingLocation ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
                <div style={{ ...cardBodyStyle, padding: isMobile ? "16px 16px" : "20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: editingLocation ? 10 : 16 }}>
                    <div>
                      <label style={labelStyle}>Latitude</label>
                      {editingLocation ? (
                        <LocalInput style={inputStyle} type="number" step="0.000001" value={prayerSettings.latitude}
                          onCommit={v => setPrayerSettings(p => ({ ...p, latitude: v }))} placeholder="43.651070" />
                      ) : (
                        <div style={{ ...inputStyle, color: "var(--text-dim)", cursor: "default", userSelect: "text" }}>{prayerSettings.latitude || "-"}</div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Longitude</label>
                      {editingLocation ? (
                        <LocalInput style={inputStyle} type="number" step="0.000001" value={prayerSettings.longitude}
                          onCommit={v => setPrayerSettings(p => ({ ...p, longitude: v }))} placeholder="-79.347015" />
                      ) : (
                        <div style={{ ...inputStyle, color: "var(--text-dim)", cursor: "default", userSelect: "text" }}>{prayerSettings.longitude || "-"}</div>
                      )}
                    </div>
                    <div style={isMobile ? { gridColumn: "1 / -1" } : undefined}>
                      <label style={labelStyle}>Timezone</label>
                      <Select value={prayerSettings.timezone} onChange={v => setPrayerSettings(p => ({ ...p, timezone: v }))} options={TIMEZONES} />
                    </div>
                  </div>
                  {editingLocation && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--text-ghost)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--accent)" }}>touch_app</span>
                      Drag the pin or click the map to set your masjid's location.
                    </div>
                  )}
                  <div style={{ flex: 1, minHeight: 200 }}>
                    <LocationMap latitude={prayerSettings.latitude} longitude={prayerSettings.longitude}
                      flyTrigger={mapFlyTrigger} readOnly={!editingLocation}
                      onChange={(la, lo) => setPrayerSettings(p => ({ ...p, latitude: la, longitude: lo }))}
                      autoCenter={!editingLocation} height="100%" />
                  </div>
                </div>
              </div>

              {/* Right: Multiple Jamaats + Jummah stacked */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Multiple Jamaats */}
                <Card compact={isMobile} title="Multiple Jamaats" subtitle="Enable additional jamaats for Fajr and Maghrib">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {([
                      { key: "fajr2" as const,    label: "Fajr",    jamaat: "2nd Jamaat", requires: null         },
                      { key: "fajr3" as const,    label: "Fajr",    jamaat: "3rd Jamaat", requires: "fajr2"      },
                      { key: "maghrib2" as const, label: "Maghrib", jamaat: "2nd Jamaat", requires: null         },
                      { key: "maghrib3" as const, label: "Maghrib", jamaat: "3rd Jamaat", requires: "maghrib2"   },
                    ] as const).map(({ key, label, jamaat, requires }) => {
                      const active = jamaatSettings[key];
                      const locked = requires !== null && !jamaatSettings[requires];
                      return (
                        <button key={key} disabled={locked} onClick={async () => {
                            let next = { ...jamaatSettings, [key]: !jamaatSettings[key] };
                            if (key === "fajr2"    && !next.fajr2)    next = { ...next, fajr3: false };
                            if (key === "maghrib2" && !next.maghrib2) next = { ...next, maghrib3: false };
                            setJamaatSettings(next);
                            const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
                            if (masjidId) {
                              await supabaseAdmin.from("prayer_settings").upsert(
                                { masjid_id: masjidId, jummah_config: { ...extraTimings, jamaatSettings: next } },
                                { onConflict: "masjid_id" }
                              );
                            }
                          }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: active ? "var(--surface-mid)" : "var(--surface)", border: active ? "1px solid var(--outline-variant)" : "1px solid var(--surface-mid)", borderRadius: 2, cursor: locked ? "not-allowed" : "pointer", textAlign: "left", transition: "all 0.15s", opacity: locked ? 0.35 : 1 }}>
                          <div>
                            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: active ? "var(--on-surface)" : "var(--text-ghost)", marginBottom: 2 }}>{label}</div>
                            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--outline)" }}>{jamaat}</div>
                          </div>
                          <div style={{ width: 28, height: 16, borderRadius: 8, background: active ? "var(--accent-border)" : "var(--surface-high)", border: active ? "1px solid var(--accent-border-strong)" : "1px solid var(--outline-variant)", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
                            <div style={{ position: "absolute", top: 2, left: active ? 12 : 2, width: 10, height: 10, borderRadius: "50%", background: active ? "var(--accent)" : "var(--outline)", transition: "left 0.15s, background 0.15s" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Jummah Khutbahs */}
                <Card compact={isMobile} title="Jummah" subtitle="Enable khutbah slots to show in Prayer Schedule Builder">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(["1st Khutbah", "2nd Khutbah", "3rd Khutbah"] as const).map((label, i) => {
                      const active = extraTimings.jummahSlots[i];
                      const locked = i > 0 && !extraTimings.jummahSlots[i - 1];
                      return (
                        <button key={i} disabled={locked}
                          onClick={async () => {
                            const s: [boolean, boolean, boolean] = [...extraTimings.jummahSlots] as [boolean, boolean, boolean];
                            s[i] = !s[i];
                            if (!s[i]) { for (let j = i + 1; j < 3; j++) s[j] = false; }
                            const next = { ...extraTimings, jummahSlots: s };
                            setExtraTimings(next);
                            const masjidId = sessionStorage.getItem("masjid_id") || localStorage.getItem("masjid_id");
                            if (masjidId) {
                              await supabaseAdmin.from("prayer_settings").upsert(
                                { masjid_id: masjidId, jummah_config: { ...next, jamaatSettings } },
                                { onConflict: "masjid_id" }
                              );
                            }
                          }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: active ? "var(--surface-mid)" : "var(--surface)", border: active ? "1px solid var(--outline-variant)" : "1px solid var(--surface-mid)", borderRadius: 2, cursor: locked ? "not-allowed" : "pointer", textAlign: "left", transition: "all 0.15s", opacity: locked ? 0.35 : 1 }}>
                          <div>
                            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: active ? "var(--on-surface)" : "var(--text-ghost)", marginBottom: 2 }}>Jummah</div>
                            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--outline)" }}>{label}</div>
                          </div>
                          <div style={{ width: 28, height: 16, borderRadius: 8, background: active ? "var(--accent-border)" : "var(--surface-high)", border: active ? "1px solid var(--accent-border-strong)" : "1px solid var(--outline-variant)", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
                            <div style={{ position: "absolute", top: 2, left: active ? 12 : 2, width: 10, height: 10, borderRadius: "50%", background: active ? "var(--accent)" : "var(--outline)", transition: "left 0.15s, background 0.15s" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

              </div>
            </div>

            {/* ── Monthly Presets ── */}
            {(() => {
              const MONTHS = MONTHS_SHORT;
              const ADJUSTMENTS = [
                { key: "adjustFajr"    as const, label: "Fajr"    },
                { key: "adjustSunrise" as const, label: "Sunrise" },
                { key: "adjustDhuhr"   as const, label: "Dhuhr"   },
                { key: "adjustAsr"     as const, label: "Asr"     },
                { key: "adjustMaghrib" as const, label: "Maghrib" },
                { key: "adjustIsha"    as const, label: "Isha"    },
              ] as const;

              const unassignedMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => !monthPresetMap[m]);

              return (
                <>
                {unassignedMonths.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 2, fontFamily: "Manrope, sans-serif" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#fbbf24", flexShrink: 0 }}>warning</span>
                    <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
                      {unassignedMonths.map(m => MONTHS_SHORT[m - 1]).join(", ")} {unassignedMonths.length === 1 ? "has" : "have"} no preset assigned
                    </span>
                  </div>
                )}
                <Card
                  compact={isMobile}
                  noPadding
                  title="Monthly Presets"
                  subtitle={isMobile ? undefined : "Create configurations and assign them to months. Inherits location and timezone from above."}
                  headerExtra={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {presetsSaved && !hasPresetChanges && (
                        <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(100,200,100,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>Saved
                        </span>
                      )}
                      {hasPresetChanges && (
                        <>
                          <button onClick={handleCancelPresets} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "6px 10px" : "7px 14px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "var(--on-surface-variant)", cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>Cancel
                          </button>
                          {(() => {
                            const allAssigned = Array.from({ length: 12 }, (_, i) => i + 1).every(m => !!monthPresetMap[m]);
                            return (
                              <button onClick={() => allAssigned && setShowSaveConfirm(true)} disabled={!allAssigned} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "6px 10px" : "7px 16px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: isMobile ? 11 : 12, fontWeight: 700, cursor: allAssigned ? "pointer" : "not-allowed", opacity: allAssigned ? 1 : 0.4 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>save</span>Save
                              </button>
                            );
                          })()}
                        </>
                      )}
                      <button onClick={handleAddPreset} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "6px 10px" : "7px 14px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "var(--on-surface-variant)", cursor: "pointer" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>{isMobile ? "Preset" : "New Preset"}
                      </button>
                    </div>
                  }
                >
                  {prayerPresets.length === 0 ? (
                    <div style={{ padding: "32px 24px", textAlign: "center", fontFamily: "Manrope, sans-serif", fontSize: 13, color: "var(--text-ghost)" }}>
                      No presets yet — create one to get started.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
                      {prayerPresets.map((preset, pi) => {
                        const dotColor = PRESET_DOTS[pi % PRESET_DOTS.length];
                        const isCustom = preset.method === "Other";
                        const methodAngles = METHOD_ANGLES[preset.method] ?? METHOD_ANGLES.Other;
                        const angleVal = (n: number | null) => n === null ? "" : String(n);
                        const isLastOdd = pi === prayerPresets.length - 1 && prayerPresets.length % 2 !== 0;
                        const inRow2Plus = isMobile ? pi >= 1 : pi >= 2;
                        const isRightCol = !isMobile && pi % 2 === 1;
                        return (
                          <div key={preset.id} style={{ gridColumn: (!isMobile && isLastOdd) ? "1 / -1" : undefined, borderTop: inRow2Plus ? "1px solid var(--outline-subtle)" : undefined, borderLeft: isRightCol ? "1px solid var(--outline-subtle)" : undefined, padding: isMobile ? "14px 16px" : "20px", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>

                            {/* Preset label + delete */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: dotColor, fontFamily: "Manrope, sans-serif" }}>Preset {pi + 1}</span>
                              {prayerPresets.length > 1 && (
                                <button onClick={() => handleDeletePreset(preset.id)}
                                  style={{ marginLeft: "auto", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, cursor: "pointer", color: "var(--text-phantom)", transition: "color 0.15s, border-color 0.15s" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.borderColor = "#f87171"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-phantom)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                </button>
                              )}
                            </div>

                            {/* Month chips */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: isMobile ? 4 : 6 }}>
                              {MONTHS.map((name, i) => {
                                const month = i + 1;
                                const owner = monthPresetMap[month] ?? "";
                                const isOwned = owner === preset.id;
                                const isTaken = owner !== "" && owner !== preset.id;
                                const takenByIdx = isTaken ? prayerPresets.findIndex(p => p.id === owner) : -1;
                                return (
                                  <button key={month}
                                    title={isTaken ? `Assigned to Preset ${takenByIdx + 1} — click to move here` : isOwned ? "Click to unassign" : "Click to assign"}
                                    onClick={() => handleSetMonthPreset(month, isOwned ? "" : preset.id)}
                                    style={{ padding: isMobile ? "5px 0" : "5px 12px", borderRadius: 2, border: isOwned ? `1px solid ${dotColor}40` : "1px solid var(--outline-subtle)", background: isOwned ? `${dotColor}15` : "var(--surface-mid)", fontFamily: "Manrope, sans-serif", fontSize: isMobile ? 10 : 11, fontWeight: 700, color: isOwned ? dotColor : isTaken ? "var(--text-phantom)" : "var(--text-ghost)", cursor: "pointer", transition: "all 0.12s", textAlign: "center" }}>
                                    {name}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Method + Madhab */}
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                              <div>
                                <label style={labelStyle}>Calculation Method</label>
                                <Select value={preset.method} onChange={v => handleUpdatePreset(preset.id, { method: v })} options={CALC_METHODS} />
                              </div>
                              <div>
                                <label style={labelStyle}>Asr School</label>
                                <Select value={preset.madhab} onChange={v => handleUpdatePreset(preset.id, { madhab: v })} options={MADHABS} />
                              </div>
                            </div>

                            {/* Angles */}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Angles</label>
                                {!isCustom && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2, color: "var(--text-ghost)", fontFamily: "Manrope, sans-serif" }}>Set by method</span>}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8 }}>
                                {[
                                  { label: "Fajr", val: isCustom ? preset.fajrAngle : angleVal(methodAngles.fajr), key: "fajrAngle" as const },
                                  { label: "Isha", val: isCustom ? preset.ishaAngle : angleVal(methodAngles.isha), key: "ishaAngle" as const },
                                  { label: "Isha interval", val: isCustom ? preset.ishaInterval : angleVal(methodAngles.ishaInterval), key: "ishaInterval" as const },
                                  { label: "Maghrib", val: isCustom ? preset.maghribAngle : angleVal(methodAngles.maghrib), key: "maghribAngle" as const },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label style={labelStyle}>{f.label}</label>
                                    <LocalInput style={isCustom ? inputStyle : inputDisabledStyle} type="number" step="0.1" value={f.val} onCommit={v => isCustom && handleUpdatePreset(preset.id, { [f.key]: v })} placeholder="—" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Advanced (Edge Cases + Output) — collapsed by default */}
                            {(() => {
                              const isAdvOpen = !!advancedOpen[preset.id];
                              const adjustCount = ADJUSTMENTS.filter(({ key }) => {
                                const v = String(preset[key] ?? "").trim();
                                return v !== "" && v !== "0";
                              }).length;
                              return (
                                <div>
                                  <button
                                    onClick={() => setAdvancedOpen(o => ({ ...o, [preset.id]: !o[preset.id] }))}
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-ghost)" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 15, transition: "transform 0.2s", transform: isAdvOpen ? "rotate(90deg)" : "rotate(0deg)" }}>chevron_right</span>
                                    Advanced
                                    {!isAdvOpen && adjustCount > 0 && (
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", color: "var(--accent)", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, padding: "1px 6px" }}>{adjustCount} adjustment{adjustCount !== 1 ? "s" : ""}</span>
                                    )}
                                  </button>

                                  {isAdvOpen && (
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 12 }}>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif" }}>Edge Cases</span>
                                        <div><label style={labelStyle}>High Latitude Rule</label><Select value={preset.highLatitudeRule} onChange={v => handleUpdatePreset(preset.id, { highLatitudeRule: v })} options={HIGH_LATITUDE_RULES} /></div>
                                        <div><label style={labelStyle}>Polar Circle Resolution</label><Select value={preset.polarCircleResolution} onChange={v => handleUpdatePreset(preset.id, { polarCircleResolution: v })} options={POLAR_CIRCLE_RESOLUTIONS} /></div>
                                        <div style={{ opacity: preset.method !== "MoonsightingCommittee" ? 0.4 : 1 }}>
                                          <label style={labelStyle}>Shafaq{preset.method !== "MoonsightingCommittee" && <span style={{ marginLeft: 6, fontWeight: 400, textTransform: "none", letterSpacing: "normal", color: "var(--text-ghost)" }}>- Moonsighting only</span>}</label>
                                          <Select value={preset.shafaq} disabled={preset.method !== "MoonsightingCommittee"} onChange={v => handleUpdatePreset(preset.id, { shafaq: v })} options={SHAFAQ_OPTIONS} />
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif" }}>Output</span>
                                        <div><label style={labelStyle}>Time Rounding</label><Select value={preset.rounding} onChange={v => handleUpdatePreset(preset.id, { rounding: v })} options={ROUNDING_OPTIONS} /></div>
                                        <div>
                                          <label style={labelStyle}>Minute Adjustments</label>
                                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
                                            {ADJUSTMENTS.map(({ key, label }) => (
                                              <div key={key}>
                                                <label style={labelStyle}>{label}</label>
                                                <LocalInput style={inputStyle} type="number" step="1" value={preset[key]} onCommit={v => handleUpdatePreset(preset.id, { [key]: v })} placeholder="0" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                </>
              );
            })()}


          </section>

          {/* ── Data & Integrations ── */}
          <section id="settings-data" style={sectionStyle}>
            <SectionHeading label="Data & Integrations" />

          {/* ── Public Data Feed ── */}
          {(() => {
            const BASE = "https://cdn.jam3ah.app/masjids";
            const slug = (generalSettings.masjidName || "my-masjid")
              .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const fileUrl = `${BASE}/${slug}/prayers.json`;
            const copied = copiedKey === "feed";

            return (
              <Card
                compact={isMobile}
                title="Public Data Feed"
                subtitle="One static JSON file — the full year of prayer times. Embed it on your masjid website. Visitors never touch our server."
              >
                {/* Single file URL */}
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 8 : 10, padding: "12px 14px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0 }}>data_object</span>
                    <code style={{ flex: 1, fontFamily: "monospace", fontSize: isMobile ? 11 : 12, color: "var(--on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fileUrl}
                    </code>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, fontWeight: 600, color: "var(--text-ghost)", background: "var(--surface-high)", border: "1px solid var(--outline-subtle)", borderRadius: 2, padding: "2px 7px", whiteSpace: "nowrap" }}>
                      permanent URL
                    </span>
                    <button
                      onClick={() => copyToClipboard(fileUrl, "feed")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: copied ? "var(--accent-bg)" : "transparent", border: copied ? "1px solid var(--accent-border)" : "1px solid var(--outline-variant)", borderRadius: 2, cursor: "pointer", fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: copied ? "var(--accent)" : "var(--text-ghost)", transition: "all 0.15s" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{copied ? "check" : "content_copy"}</span>
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* How it works dropdown */}
                <div style={{ border: "1px solid var(--outline-subtle)", borderRadius: 2, overflow: "hidden" }}>
                  <button
                    onClick={() => setFeedExplainerOpen(o => !o)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface)", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--on-surface-variant)", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--accent)" }}>help</span>
                      How does this work?
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-ghost)", transition: "transform 0.2s", transform: feedExplainerOpen ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
                  </button>

                  {feedExplainerOpen && (
                    <div style={{ padding: "0 14px 14px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid var(--outline-subtle)" }}>

                      {/* Flow diagram */}
                      <div style={{ overflowX: "auto", marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 2, overflow: "hidden", border: "1px solid var(--outline-subtle)", minWidth: isMobile ? 520 : undefined }}>
                        {[
                          { icon: "edit",          label: "You save a change"            },
                          { icon: "arrow_forward", label: null                            },
                          { icon: "upload",        label: "JSON written to R2"           },
                          { icon: "arrow_forward", label: null                            },
                          { icon: "autorenew",     label: "Cloudflare cache purged"      },
                          { icon: "arrow_forward", label: null                            },
                          { icon: "language",      label: "Visitors get fresh data instantly" },
                        ].map((step, i) =>
                          step.label === null ? (
                            <span key={i} className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text-phantom)", padding: "0 2px", flexShrink: 0 }}>arrow_forward</span>
                          ) : (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 8px", background: "var(--surface-mid)" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)" }}>{step.icon}</span>
                              <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.3 }}>{step.label}</span>
                            </div>
                          )
                        )}
                      </div>
                      </div>{/* end flow scroll wrapper */}

                      {/* The problem */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>The problem</div>
                        <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          Your masjid's website needs to show today's prayer times. But if every visitor's browser calls Jam3ah's server directly, that server gets hit thousands of times a day — expensive and slow.
                        </p>
                      </div>

                      {/* The solution */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>The solution — static file on a CDN</div>
                        <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          Instead of a live API, Jam3ah generates a single JSON file containing every prayer time for the entire year. This file lives on <strong style={{ color: "var(--on-surface)" }}>Cloudflare R2</strong> — object storage with a global CDN built in. Visitors fetch this file directly from Cloudflare's nearest edge server. Jam3ah's server is never involved in a visitor request.
                        </p>
                      </div>

                      {/* What is R2 */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>What is Cloudflare R2?</div>
                        <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          R2 is Cloudflare's file storage — similar to Amazon S3, but with <strong style={{ color: "var(--on-surface)" }}>zero egress fees</strong>. Egress means data leaving storage toward the user. AWS charges heavily for this. Cloudflare does not — because they own both the storage and the CDN network, so data never leaves their infrastructure.
                        </p>
                      </div>

                      {/* What is a CDN edge */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>What is a CDN edge node?</div>
                        <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          Cloudflare has hundreds of servers (edge nodes) spread around the world. When a visitor requests <code style={{ fontFamily: "monospace", fontSize: 11, color: "var(--on-surface-variant)" }}>prayers.json</code>, Cloudflare serves it from the node physically closest to that visitor — not from your server, not even from R2. R2 is only read when an edge node doesn't have a cached copy yet.
                        </p>
                      </div>

                      {/* What happens on update */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>What happens when you update prayer times?</div>
                        <p style={{ margin: "0 0 10px", fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>When you hit Save, Jam3ah does three things automatically:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {[
                            { n: "1", text: "Regenerates the full year JSON from your latest prayer schedule" },
                            { n: "2", text: "Overwrites the file on Cloudflare R2 — same permanent URL, new content" },
                            { n: "3", text: "Calls the Cloudflare Cache Purge API — all edge nodes instantly drop their stale copy" },
                          ].map(({ n, text }) => (
                            <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Manrope, sans-serif", fontSize: 10, fontWeight: 800, color: "var(--accent)" }}>{n}</div>
                              <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, paddingTop: 2 }}>{text}</p>
                            </div>
                          ))}
                        </div>
                        <p style={{ margin: "10px 0 0", fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          The next visitor anywhere in the world gets the updated file within seconds — without the masjid changing anything on their website.
                        </p>
                      </div>

                      {/* Sample data */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>Sample data</div>
                        <div style={{ background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2, padding: "14px 16px", overflowX: "auto" }}>
                          <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 11.5, color: "var(--on-surface-variant)", lineHeight: 1.8 }}>{`{
  "2026-04-25": {
    "fajr":    { "adhan": "05:12", "iqama": "05:30" },
    "dhuhr":   { "adhan": "13:16", "iqama": "13:30" },
    "asr":     { "adhan": "16:48", "iqama": "17:00" },
    "maghrib": { "adhan": "20:11", "iqama": "20:11" },
    "isha":    { "adhan": "21:45", "iqama": "22:00" },
    "jummah":  { "khutbah1": "13:00", "khutbah2": "14:15" }
  },
  "2026-04-26": {
    "fajr":    { "adhan": "05:10", "iqama": "05:30" },
    "dhuhr":   { "adhan": "13:16", "iqama": "13:30" },
    "asr":     { "adhan": "16:49", "iqama": "17:00" },
    "maghrib": { "adhan": "20:12", "iqama": "20:12" },
    "isha":    { "adhan": "21:46", "iqama": "22:00" }
  },
  ...
  "2026-12-31": { ... }
}`}</pre>
                        </div>
                      </div>

                      {/* Cost */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>What does this cost?</div>
                        <p style={{ margin: "0 0 10px", fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
                          R2's free tier covers 10 GB storage, 1M writes, and 10M reads per month. Egress is always free. For thousands of masjids the CDN layer costs <strong style={{ color: "var(--on-surface)" }}>close to $0</strong>.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { label: "Storage",  value: "~50 MB",  sub: "for 1,000 masjids" },
                            { label: "Writes",   value: "≈ saves", sub: "negligible"         },
                            { label: "Egress",   value: "Free",    sub: "always, unlimited"  },
                          ].map(({ label, value, sub }) => (
                            <div key={label} style={{ padding: "10px 12px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2 }}>
                              <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                              <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>{value}</div>
                              <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </Card>
            );
          })()}
          </section>

          {/* ── Page footer: re-run onboarding ── */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, marginTop: 8, paddingTop: 20, borderTop: "1px solid var(--outline-subtle)" }}>
            <div>
              <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Setup Wizard</div>
              <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Walk through the guided setup again to reconfigure your masjid from scratch.</div>
            </div>
            <button
              onClick={() => navigate("/onboarding")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-ghost)", cursor: "pointer", transition: "border-color 0.15s, color 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>replay</span>
              Retake Setup Wizard
            </button>
          </div>

        </div>
      </div>


      {/* ── Preset save confirmation modal ── */}
      {showSaveConfirm && (() => {
        const addedPresets   = prayerPresets.filter(p => !savedPrayerPresets.find(s => s.id === p.id));
        const removedPresets = savedPrayerPresets.filter(s => !prayerPresets.find(p => p.id === s.id));
        const changedPresets = prayerPresets.filter(p => {
          const saved = savedPrayerPresets.find(s => s.id === p.id);
          return saved && JSON.stringify(p) !== JSON.stringify(saved);
        });
        const changedMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(m =>
          monthPresetMap[m] !== savedMonthPresetMap[m]
        );

        const FIELD_LABELS: Partial<Record<keyof PrayerPreset, string>> = {
          method: "Method", madhab: "Asr School", highLatitudeRule: "High Latitude Rule",
          polarCircleResolution: "Polar Circle", shafaq: "Shafaq", rounding: "Rounding",
          fajrAngle: "Fajr Angle", ishaAngle: "Isha Angle",
          ishaInterval: "Isha Interval", maghribAngle: "Maghrib Angle",
          adjustFajr: "Adj Fajr", adjustSunrise: "Adj Sunrise", adjustDhuhr: "Adj Dhuhr",
          adjustAsr: "Adj Asr", adjustMaghrib: "Adj Maghrib", adjustIsha: "Adj Isha",
        };
        const getPresetDiff = (p: PrayerPreset) => {
          const saved = savedPrayerPresets.find(s => s.id === p.id);
          if (!saved) return [];
          return (Object.keys(FIELD_LABELS) as (keyof PrayerPreset)[])
            .filter(k => p[k] !== saved[k])
            .map(k => ({ key: k, label: FIELD_LABELS[k]!, from: saved[k] || "—", to: p[k] || "—" }));
        };
        const hasAnything = addedPresets.length || removedPresets.length || changedPresets.length || changedMonths.length;
        const allMonthsAssigned = Array.from({ length: 12 }, (_, i) => i + 1).every(m => !!monthPresetMap[m]);

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
               onClick={e => { if (e.target === e.currentTarget) setShowSaveConfirm(false); }}>
            <div style={{ width: "100%", maxWidth: 500, margin: "0 16px", background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

              {/* Header */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--outline-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Review Changes</div>
                  <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>Choose how to apply these preset changes</div>
                </div>
                <button onClick={() => setShowSaveConfirm(false)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, cursor: "pointer", color: "var(--text-ghost)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "55vh", overflowY: "auto" }}>
                {!hasAnything && (
                  <p style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 13, color: "var(--text-dim)" }}>No changes detected.</p>
                )}

                {addedPresets.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>Added</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {addedPresets.map((p, i) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 2 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
                          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>New Preset {i + 1}</span>
                          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--text-ghost)" }}>{p.method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {removedPresets.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>Removed</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {removedPresets.map(p => {
                        const idx = savedPrayerPresets.findIndex(s => s.id === p.id);
                        return (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 2 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>Preset {idx + 1}</span>
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--text-ghost)" }}>{p.method}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {changedPresets.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>Modified Presets</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {changedPresets.map(p => {
                        const idx  = prayerPresets.findIndex(x => x.id === p.id);
                        const dot  = PRESET_DOTS[idx % PRESET_DOTS.length];
                        const diff = getPresetDiff(p);
                        return (
                          <div key={p.id} style={{ background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--outline-subtle)" }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                              <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>Preset {idx + 1}</span>
                              <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--text-faint)", marginLeft: 2 }}>{diff.length} change{diff.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {diff.map(({ key, label, from, to }) => (
                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderBottom: "1px solid var(--outline-subtle)" }}>
                                  <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-ghost)", minWidth: 88, flexShrink: 0 }}>{label}</span>
                                  <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 2, padding: "1px 6px", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{from}</span>
                                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>arrow_forward</span>
                                  <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", borderRadius: 2, padding: "1px 6px", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{to}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {changedMonths.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontFamily: "Manrope, sans-serif", marginBottom: 8 }}>Month Assignments</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {changedMonths.map(m => {
                        const newId  = monthPresetMap[m];
                        const newIdx = prayerPresets.findIndex(p => p.id === newId);
                        const dot    = newIdx >= 0 ? PRESET_DOTS[newIdx % PRESET_DOTS.length] : "var(--outline)";
                        return (
                          <div key={m} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2 }}>
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--on-surface)" }}>{MONTHS_SHORT[m - 1]}</span>
                            <span className="material-symbols-outlined" style={{ fontSize: 11, color: "var(--text-faint)" }}>arrow_forward</span>
                            {newIdx >= 0
                              ? <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, color: dot }}>Preset {newIdx + 1}</span>
                              : <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 11, color: "var(--text-ghost)" }}>Unassigned</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--outline-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                {!allMonthsAssigned && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fbbf24" }}>warning</span>
                    <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>Assign all months before saving</span>
                  </div>
                )}
                {allMonthsAssigned && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                    {hasGeneratedMonths && (
                      <button onClick={() => { handleSavePresetsAndRegen(); setShowSaveConfirm(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "transparent", border: "1px solid var(--accent-border)", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>autorenew</span>
                        Save & Regenerate
                      </button>
                    )}
                    <button onClick={() => { handleSavePresetsOnly(); setShowSaveConfirm(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 2, fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
                      Save
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default SettingsTab;
