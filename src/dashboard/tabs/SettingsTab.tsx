import React from "react";
import { THEMES, type ThemeKey } from "../themes";
import {
  CALC_METHODS, TIMEZONES, MADHABS, HIGH_LATITUDE_RULES,
  POLAR_CIRCLE_RESOLUTIONS, SHAFAQ_OPTIONS, ROUNDING_OPTIONS, METHOD_ANGLES,
  makeInputCls, labelCls, inputClsBase,
  type PrayerPreset, type MonthPresetMap,
} from "../constants";
import { Icon } from "../components/Icon";
import LocalInput from "../components/LocalInput";
import Select from "../components/Select";
import LocationMap from "../components/LocationMap";

interface SettingsTabProps {
  theme: typeof THEMES[ThemeKey];
  settingsTab: string;
  setSettingsTab: React.Dispatch<React.SetStateAction<string>>;
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
  prayerPresets: PrayerPreset[];
  monthPresetMap: MonthPresetMap;
  handleAddPreset: () => void;
  handleDeletePreset: (id: string) => void;
  handleUpdatePreset: (id: string, patch: Partial<PrayerPreset>) => void;
  handleSetMonthPreset: (month: number, presetId: string) => void;
  handleSavePresets: () => void;
  presetsSaved: boolean;
}

const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "prayer",  label: "Prayer" },
];


const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = "" }) => (
  <div className={`bg-zinc-900/50 border border-white/[0.07] rounded-2xl overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-white/[0.06]">
      <div className="font-black text-white">{title}</div>
      {subtitle && <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const SettingsTab: React.FC<SettingsTabProps> = ({
  theme,
  settingsTab, setSettingsTab,
  registeredEmail,
  generalSettings, setGeneralSettings,
  settingsSaved, handleSaveSettings,
  prayerSettings, setPrayerSettings,
  jamaatSettings, setJamaatSettings,
  prayerPresets, monthPresetMap,
  handleAddPreset, handleDeletePreset, handleUpdatePreset,
  handleSetMonthPreset, handleSavePresets, presetsSaved,
}) => {
  const inputCls = makeInputCls(theme.inputFocus);

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 73px)" }}>

      {/* ── Top tab bar ── */}
      <div className="shrink-0 px-8 pt-7 pb-0 border-b border-white/[0.06] flex items-end gap-1">
        {SETTINGS_TABS.map(t => (
          <button key={t.id} onClick={() => setSettingsTab(t.id)}
            className={`px-5 py-2.5 text-sm font-bold transition-all rounded-t-xl border-b-2 -mb-px ${
              settingsTab === t.id
                ? `text-white border-current ${theme.accent}`
                : "text-zinc-500 hover:text-zinc-300 border-transparent"
            }`}
            style={{ borderBottomColor: settingsTab === t.id ? theme.hex : undefined }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">

        {/* ════ PROFILE ════ */}
        {settingsTab === "profile" && (
          <div className="space-y-6 max-w-xl">

            {settingsSaved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-sm">Saved successfully</span>
              </div>
            )}

            <Card title="Masjid Profile">
              <div className="space-y-4">

                <Field label="Masjid / Academy Name">
                  <LocalInput className={inputCls} value={generalSettings.masjidName}
                    onCommit={v => setGeneralSettings({ ...generalSettings, masjidName: v })}
                    placeholder="e.g., Toronto Hifz Academy" />
                </Field>

                <Field label="Registered Email">
                  <div className={`${inputCls} opacity-50 cursor-not-allowed select-none`}>
                    {registeredEmail || "—"}
                  </div>
                </Field>

                <Field label="Street Address">
                  <LocalInput className={inputCls} value={generalSettings.address}
                    onCommit={v => setGeneralSettings({ ...generalSettings, address: v })}
                    placeholder="123 Main St" />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="City">
                    <LocalInput className={inputCls} value={generalSettings.city}
                      onCommit={v => setGeneralSettings({ ...generalSettings, city: v })}
                      placeholder="Toronto" />
                  </Field>
                  <Field label="Province">
                    <LocalInput className={inputCls} value={generalSettings.province}
                      onCommit={v => setGeneralSettings({ ...generalSettings, province: v })}
                      placeholder="ON" />
                  </Field>
                  <Field label="Postal Code">
                    <LocalInput className={inputCls} value={generalSettings.postalCode}
                      onCommit={v => setGeneralSettings({ ...generalSettings, postalCode: v })}
                      placeholder="M9A 1A1" />
                  </Field>
                </div>

                <Field label="Contact Number">
                  <LocalInput className={inputCls} value={generalSettings.phone}
                    onCommit={v => setGeneralSettings({ ...generalSettings, phone: v })}
                    placeholder="+1 (416) 555-0000" />
                </Field>

              </div>
            </Card>

            <button onClick={handleSaveSettings} className={`px-8 py-3 rounded-xl font-black ${theme.btn} transition-all hover:scale-[1.01]`}>
              Save Profile
            </button>
          </div>
        )}


        {/* ════ PRAYER SETTINGS ════ */}
        {settingsTab === "prayer" && (
          <div className="space-y-5">

            {/* Location */}
            <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl p-6">
              <div className="mb-4">
                <div className="font-black text-white">Location</div>
                <div className="text-xs text-zinc-500 mt-0.5">Drag the pin or click the map to set coordinates</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className={labelCls}>Latitude</label>
                  <LocalInput className={inputCls} type="number" step="0.000001"
                    value={prayerSettings.latitude}
                    onCommit={v => setPrayerSettings(p => ({ ...p, latitude: v }))}
                    placeholder="43.651070" />
                </div>
                <div>
                  <label className={labelCls}>Longitude</label>
                  <LocalInput className={inputCls} type="number" step="0.000001"
                    value={prayerSettings.longitude}
                    onCommit={v => setPrayerSettings(p => ({ ...p, longitude: v }))}
                    placeholder="-79.347015" />
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <Select value={prayerSettings.timezone}
                    onChange={v => setPrayerSettings(p => ({ ...p, timezone: v }))}
                    options={TIMEZONES} />
                </div>
              </div>
              <LocationMap
                latitude={prayerSettings.latitude}
                longitude={prayerSettings.longitude}
                onChange={(lat, lng) => setPrayerSettings(p => ({ ...p, latitude: lat, longitude: lng }))}
              />
            </div>

            {/* ── Monthly Presets ── */}
            {(() => {
              const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const ADJUSTMENTS = [
                { key: "adjustFajr"    as const, label: "Fajr"    },
                { key: "adjustSunrise" as const, label: "Sunrise" },
                { key: "adjustDhuhr"   as const, label: "Dhuhr"   },
                { key: "adjustAsr"     as const, label: "Asr"     },
                { key: "adjustMaghrib" as const, label: "Maghrib" },
                { key: "adjustIsha"    as const, label: "Isha"    },
              ] as const;

              // Explicit class strings — required for Tailwind v4 static scanning
              const PRESET_COLORS = [
                { activeBg: "bg-emerald-500/20", activeBorder: "border-emerald-500/50", activeText: "text-emerald-300", dot: "bg-emerald-400" },
                { activeBg: "bg-sky-500/20",     activeBorder: "border-sky-500/50",     activeText: "text-sky-300",     dot: "bg-sky-400"     },
                { activeBg: "bg-amber-500/20",   activeBorder: "border-amber-500/50",   activeText: "text-amber-300",   dot: "bg-amber-400"   },
                { activeBg: "bg-rose-500/20",    activeBorder: "border-rose-500/50",    activeText: "text-rose-300",    dot: "bg-rose-400"    },
                { activeBg: "bg-violet-500/20",  activeBorder: "border-violet-500/50",  activeText: "text-violet-300",  dot: "bg-violet-400"  },
              ];



              return (
                <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl overflow-hidden">

                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="font-black text-white">Monthly Presets</div>
                      <div className="text-xs text-zinc-500 mt-0.5">Create configurations and tap months to assign them. Inherits location and timezone from above.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {presetsSaved && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          Saved
                        </span>
                      )}
                      <button onClick={handleSavePresets}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${theme.btn} hover:scale-[1.01]`}>
                        Save
                      </button>
                      <button onClick={handleAddPreset}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/80 border border-white/[0.07] text-sm font-black text-zinc-300 hover:text-white hover:border-white/15 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        New Preset
                      </button>
                    </div>
                  </div>

                  {/* Preset list */}
                  {prayerPresets.length === 0 ? (
                    <div className="px-6 py-12 text-center text-zinc-600 text-sm">
                      No presets yet — create one above to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {prayerPresets.map((preset, pi) => {
                        const color = PRESET_COLORS[pi % PRESET_COLORS.length];
                        const isCustom = preset.method === "Other";
                        const methodAngles = METHOD_ANGLES[preset.method] ?? METHOD_ANGLES.Other;
                        const angleVal = (n: number | null) => n === null ? "" : String(n);
                        const disabledAngleCls = `${inputClsBase} opacity-40 cursor-not-allowed ${theme.inputFocus}`;
                        return (
                          <div key={preset.id} className="p-5 space-y-4">

                            {/* Row 1: color dot + delete */}
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                              <span className={`text-xs font-black uppercase tracking-widest ${color.activeText}`}>Preset {pi + 1}</span>
                              {prayerPresets.length > 1 && (
                                <button onClick={() => handleDeletePreset(preset.id)}
                                  className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              )}
                            </div>

                            {/* Row 2: month chips */}
                            <div className="flex gap-1.5 flex-wrap">
                              {MONTHS.map((name, i) => {
                                const month = i + 1;
                                const owner = monthPresetMap[month] ?? "";
                                const isOwned = owner === preset.id;
                                const isTaken = owner !== "" && owner !== preset.id;
                                const takenByIdx = isTaken ? prayerPresets.findIndex(p => p.id === owner) : -1;
                                return (
                                  <button
                                    key={month}
                                    title={isTaken ? `Assigned to Preset ${takenByIdx + 1} — click to move here` : isOwned ? "Click to unassign" : "Click to assign"}
                                    onClick={() => handleSetMonthPreset(month, isOwned ? "" : preset.id)}
                                    className={`px-3 py-1 rounded-lg border text-xs font-black transition-all ${
                                      isOwned
                                        ? `${color.activeBg} ${color.activeBorder} ${color.activeText}`
                                        : isTaken
                                          ? "bg-zinc-800/20 border-white/[0.04] text-zinc-700 hover:text-zinc-400 hover:border-white/10"
                                          : "bg-zinc-800/50 border-white/[0.07] text-zinc-500 hover:text-zinc-200 hover:border-white/15"
                                    }`}>
                                    {name}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Row 3: Calculation method + Asr school */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Calculation Method</label>
                                <Select value={preset.method}
                                  onChange={v => handleUpdatePreset(preset.id, { method: v })}
                                  options={CALC_METHODS} />
                              </div>
                              <div>
                                <label className={labelCls}>Asr School</label>
                                <Select value={preset.madhab}
                                  onChange={v => handleUpdatePreset(preset.id, { madhab: v })}
                                  options={MADHABS} />
                              </div>
                            </div>

                            {/* Row 4: Angles */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={labelCls + " mb-0"}>Angles</span>
                                {!isCustom && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-800/60 border border-white/[0.05] text-zinc-600">Set by method</span>}
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className={labelCls}>Fajr</label>
                                  <LocalInput className={isCustom ? inputCls : disabledAngleCls} type="number" step="0.1"
                                    value={isCustom ? preset.fajrAngle : angleVal(methodAngles.fajr)}
                                    onCommit={v => isCustom && handleUpdatePreset(preset.id, { fajrAngle: v })}
                                    placeholder="—" />
                                </div>
                                <div>
                                  <label className={labelCls}>Isha</label>
                                  <LocalInput className={isCustom ? inputCls : disabledAngleCls} type="number" step="0.1"
                                    value={isCustom ? preset.ishaAngle : angleVal(methodAngles.isha)}
                                    onCommit={v => isCustom && handleUpdatePreset(preset.id, { ishaAngle: v })}
                                    placeholder="—" />
                                </div>
                                <div>
                                  <label className={labelCls}>Isha interval</label>
                                  <LocalInput className={isCustom ? inputCls : disabledAngleCls} type="number" step="1"
                                    value={isCustom ? preset.ishaInterval : angleVal(methodAngles.ishaInterval)}
                                    onCommit={v => isCustom && handleUpdatePreset(preset.id, { ishaInterval: v })}
                                    placeholder="—" />
                                </div>
                                <div>
                                  <label className={labelCls}>Maghrib</label>
                                  <LocalInput className={isCustom ? inputCls : disabledAngleCls} type="number" step="0.1"
                                    value={isCustom ? preset.maghribAngle : angleVal(methodAngles.maghrib)}
                                    onCommit={v => isCustom && handleUpdatePreset(preset.id, { maghribAngle: v })}
                                    placeholder="—" />
                                </div>
                              </div>
                            </div>

                            {/* Row 5: Edge cases + Output side by side */}
                            <div className="grid grid-cols-2 gap-4">

                              {/* Edge cases */}
                              <div className="space-y-3">
                                <span className={labelCls}>Edge Cases</span>
                                <div>
                                  <label className={labelCls}>High Latitude Rule</label>
                                  <Select value={preset.highLatitudeRule}
                                    onChange={v => handleUpdatePreset(preset.id, { highLatitudeRule: v })}
                                    options={HIGH_LATITUDE_RULES} />
                                </div>
                                <div>
                                  <label className={labelCls}>Polar Circle Resolution</label>
                                  <Select value={preset.polarCircleResolution}
                                    onChange={v => handleUpdatePreset(preset.id, { polarCircleResolution: v })}
                                    options={POLAR_CIRCLE_RESOLUTIONS} />
                                </div>
                                <div className={preset.method !== "MoonsightingCommittee" ? "opacity-40" : ""}>
                                  <label className={labelCls}>
                                    Shafaq{preset.method !== "MoonsightingCommittee" && <span className="ml-1 normal-case font-medium tracking-normal text-zinc-600">— Moonsighting only</span>}
                                  </label>
                                  <Select value={preset.shafaq}
                                    disabled={preset.method !== "MoonsightingCommittee"}
                                    onChange={v => handleUpdatePreset(preset.id, { shafaq: v })}
                                    options={SHAFAQ_OPTIONS} />
                                </div>
                              </div>

                              {/* Output */}
                              <div className="space-y-3">
                                <span className={labelCls}>Output</span>
                                <div>
                                  <label className={labelCls}>Time Rounding</label>
                                  <Select value={preset.rounding}
                                    onChange={v => handleUpdatePreset(preset.id, { rounding: v })}
                                    options={ROUNDING_OPTIONS} />
                                </div>
                                <div>
                                  <label className={labelCls}>Minute Adjustments</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {ADJUSTMENTS.map(({ key, label }) => (
                                      <div key={key}>
                                        <label className={labelCls}>{label}</label>
                                        <LocalInput className={inputCls} type="number" step="1"
                                          value={preset[key]}
                                          onCommit={v => handleUpdatePreset(preset.id, { [key]: v })}
                                          placeholder="0" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}


                </div>
              );
            })()}

            {/* Multiple Jamaats — full width */}
            <Card title="Multiple Jamaats" subtitle="Enable additional jamaats for Fajr and Maghrib">
              <div className="grid grid-cols-4 gap-4">
                {([
                  { key: "fajr2" as const,    label: "Fajr",    jamaat: "2nd Jamaat" },
                  { key: "fajr3" as const,    label: "Fajr",    jamaat: "3rd Jamaat" },
                  { key: "maghrib2" as const, label: "Maghrib", jamaat: "2nd Jamaat" },
                  { key: "maghrib3" as const, label: "Maghrib", jamaat: "3rd Jamaat" },
                ]).map(({ key, label, jamaat }) => (
                  <button key={key} onClick={() => setJamaatSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      jamaatSettings[key] ? `${theme.accentBg} ${theme.accentBorder}` : "border-white/[0.07] bg-zinc-800/30 hover:border-white/10"
                    }`}>
                    <div>
                      <div className={`font-black text-sm ${jamaatSettings[key] ? "text-white" : "text-zinc-300"}`}>{label}</div>
                      <div className="text-zinc-500 text-xs">{jamaat}</div>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-all ${jamaatSettings[key] ? theme.accentBg + " border " + theme.accentBorder : "bg-zinc-700"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${jamaatSettings[key] ? theme.dot + " right-0.5" : "bg-zinc-500 left-0.5"}`} />
                    </div>
                  </button>
                ))}
              </div>
            </Card>

          </div>
        )}


      </div>
    </div>
  );
};

export default SettingsTab;
