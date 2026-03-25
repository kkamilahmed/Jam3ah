import React from "react";
import type { PrayerTime, BatchCell, BatchCell2, BatchConfig, Month } from "../types";
import { THEMES, type ThemeKey } from "../themes";
import { to12h, formatTimeInput } from "../utils";
import { Icon } from "../components/Icon";
import BatchControl from "../components/BatchControl";
import DatePicker from "../components/DatePicker";
import LocalInput from "../components/LocalInput";

const PRAYER_META = [
  { key: "fajr" as keyof PrayerTime,    label: "Fajr",    arabic: "الفجر" },
  { key: "dhuhr" as keyof PrayerTime,   label: "Dhuhr",   arabic: "الظهر" },
  { key: "asr" as keyof PrayerTime,     label: "Asr",     arabic: "العصر" },
  { key: "maghrib" as keyof PrayerTime, label: "Maghrib", arabic: "المغرب" },
  { key: "isha" as keyof PrayerTime,    label: "Isha",    arabic: "العشاء" },
];

interface PrayerTimesTabProps {
  theme: typeof THEMES[ThemeKey];
  todayRow: PrayerTime | undefined;
  prayerSource: "excel" | "backend";
  setPendingSource: (s: "excel" | "backend" | null) => void;
  pendingSource: "excel" | "backend" | null;
  prayerLoading: boolean;
  prayerTimesByMonth: Record<string, PrayerTime[]>;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  months: Month[];
  scheduleEdited: boolean;
  setScheduleEdited: (v: boolean) => void;
  savingSchedule: boolean;
  savedSchedule: boolean;
  switchLoading: boolean;
  uploadFile: File | null;
  uploadSuccess: string;
  uploadError: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveSchedule: () => void;
  handleDiscardChanges: () => void;
  handleEditCell: (date: string, field: string, value: string) => void;
  handleConfirmSourceSwitch: () => void;
  batchFrom: string;
  setBatchFrom: (v: string) => void;
  batchTo: string;
  setBatchTo: (v: string) => void;
  batchAdhan: BatchConfig;
  setBatchAdhan: React.Dispatch<React.SetStateAction<BatchConfig>>;
  batchIqama: BatchConfig;
  setBatchIqama: React.Dispatch<React.SetStateAction<BatchConfig>>;
  batchIqama2: { fajr: BatchCell2; maghrib: BatchCell2 };
  setBatchIqama2: React.Dispatch<React.SetStateAction<{ fajr: BatchCell2; maghrib: BatchCell2 }>>;
  batchIqama3: { fajr: BatchCell2; maghrib: BatchCell2 };
  setBatchIqama3: React.Dispatch<React.SetStateAction<{ fajr: BatchCell2; maghrib: BatchCell2 }>>;
  applyingBatch: boolean;
  batchApplied: boolean;
  batchError: string;
  handleBatchApply: () => void;
  jamaatSettings: { fajr2: boolean; fajr3: boolean; maghrib2: boolean; maghrib3: boolean };
  extraTimings: { fajr: string[]; maghrib: string[]; jummah: string[]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } };
  setExtraTimings: React.Dispatch<React.SetStateAction<{ fajr: string[]; maghrib: string[]; jummah: string[]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } }>>;
  // Excel column mapping modal state
  xlsxPreview: {
    sheets: string[];
    sheetRows: Record<string, string[][]>;
    selectedSheet: string;
    headerRowIdx: number;
  } | null;
  setXlsxPreview: React.Dispatch<React.SetStateAction<{
    sheets: string[];
    sheetRows: Record<string, string[][]>;
    selectedSheet: string;
    headerRowIdx: number;
  } | null>>;
  colMap: Record<string, string>;
  setColMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  autoMapColumns: (headers: string[]) => void;
  handleConfirmImport: () => void;
  isUploading: boolean;
  handleGenerateYear: (year: number) => void;
  generatingYear: number | null;
}

const PrayerTimesTab: React.FC<PrayerTimesTabProps> = ({
  theme,
  todayRow,
  prayerSource,
  setPendingSource,
  pendingSource,
  prayerLoading,
  prayerTimesByMonth,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  months,
  scheduleEdited,
  setScheduleEdited,
  savingSchedule,
  savedSchedule,
  switchLoading,
  uploadFile,
  uploadSuccess,
  uploadError,
  handleFileChange,
  handleSaveSchedule,
  handleDiscardChanges,
  handleEditCell,
  handleConfirmSourceSwitch,
  batchFrom,
  setBatchFrom,
  batchTo,
  setBatchTo,
  batchAdhan,
  setBatchAdhan,
  batchIqama,
  setBatchIqama,
  batchIqama2,
  setBatchIqama2,
  batchIqama3,
  setBatchIqama3,
  applyingBatch,
  batchApplied,
  batchError,
  handleBatchApply,
  jamaatSettings,
  extraTimings,
  setExtraTimings,
  xlsxPreview,
  setXlsxPreview,
  colMap,
  setColMap,
  autoMapColumns,
  handleConfirmImport,
  isUploading,
  handleGenerateYear,
  generatingYear,
}) => {
  return (
    <div className="px-8 py-10">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Management</div>
          <h1 className="text-4xl font-black">Prayer Times</h1>
        </div>
        <div className="flex items-center bg-zinc-900/60 border border-white/8 rounded-xl p-1 gap-1 mb-1">
          {([{ k: "backend" as const, label: "Auto-calculate" }, { k: "excel" as const, label: "Upload Excel" }]).map(opt => (
            <button key={opt.k}
              onClick={() => opt.k !== prayerSource && setPendingSource(opt.k)}
              className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${
                prayerSource === opt.k ? `${theme.accentBg} ${theme.accent}` : "text-zinc-500 hover:text-white"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Prayer Times ── */}
      {(() => {
        return (
          <div className="rounded-2xl bg-zinc-900/60 border border-white/5 mb-5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${theme.label}`}>Today</div>
                <div className="text-base font-black text-white">
                  {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <div className="text-xs text-zinc-600 font-bold">
                {todayRow ? "" : "No times loaded"}
              </div>
            </div>
            <div className="p-5 grid grid-cols-5 gap-3">
              {PRAYER_META.map((p) => {
                const row = todayRow as unknown as Record<string,string> | undefined;
                const adhanT = row ? (row[`${p.key}_adhan`] || row[p.key] || "—") : "—";
                const iqamaT = row ? (row[`${p.key}_iqama`] || "—") : "—";
                return (
                  <div key={p.key} className="relative bg-zinc-800/60 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex flex-col items-center pt-5 pb-4 px-4 border-b border-white/5">
                      <div className={`text-xl mb-1`} style={{ fontFamily: "serif", color: "inherit" }}>
                        <span className={theme.accent}>{p.arabic}</span>
                      </div>
                      <div className="font-black text-white text-2xl tracking-tight">{p.label}</div>
                    </div>
                    {/* Times */}
                    <div className="grid grid-cols-2 divide-x divide-white/5 flex-1">
                      {[
                        { label: "Adhan", val: to12h(adhanT) },
                        { label: "Iqama", val: to12h(iqamaT) },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex flex-col items-center justify-center py-5 px-2">
                          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">{label}</div>
                          <div className={`text-xl font-black tabular-nums text-center ${theme.accent}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Adhan & Iqama Schedule ── */}
      {(() => {
        return (
          <div className="rounded-2xl bg-zinc-900/60 border border-white/5 mb-8 overflow-hidden">

            {/* ── Header ── */}
            <div className="px-7 py-5 border-b border-white/5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-xl font-black text-white">Adhan &amp; Iqama</h2>
                  <p className="text-xs text-zinc-500 font-bold mt-1">Set offsets or fixed times per prayer, then apply to a date range</p>
                </div>
                {/* Date range + Apply */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">From</span>
                      <DatePicker value={batchFrom} onChange={setBatchFrom} placeholder="Start date" align="left" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">To</span>
                      <DatePicker value={batchTo} onChange={setBatchTo} placeholder="End date" align="left" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 opacity-0">Btn</span>
                      <button onClick={handleBatchApply} disabled={applyingBatch}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all h-[38px] ${
                          batchApplied ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                            : applyingBatch ? "bg-zinc-800 text-zinc-500 cursor-wait border border-white/5"
                            : `${theme.btn}`
                        }`}>
                        {applyingBatch
                          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Applying…</>
                          : batchApplied ? <><Icon d="M5 13l4 4L19 7" className="w-4 h-4" /> Applied</>
                          : "Apply"
                        }
                      </button>
                    </div>
                  </div>
                  {batchError && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                      <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-3.5 h-3.5 shrink-0" />
                      {batchError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Column headers ── */}
            <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5 bg-zinc-950/30">
              <div className="px-5 py-2.5" />
              {PRAYER_META.map(p => (
                <div key={p.key} className="px-5 py-2.5 border-l border-white/5 flex items-center gap-2">
                  <span className="font-black text-white text-sm">{p.label}</span>
                  <span className={`text-xs ${theme.accent}`} style={{ fontFamily: "serif" }}>{p.arabic}</span>
                </div>
              ))}
            </div>

            {/* ── Adhan row ── */}
            <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
              <div className="px-5 py-4 flex items-center">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Adhan</span>
              </div>
              {PRAYER_META.map(p => (
                <div key={p.key} className="px-5 py-4 border-l border-white/5">
                  <BatchControl
                    cell={(batchAdhan as unknown as Record<string, BatchCell>)[p.key]}
                    onUpdate={patch => setBatchAdhan(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                    placeholder="6:00 AM" accentBg={theme.accentBg} accent={theme.accent} />
                </div>
              ))}
            </div>

            {/* ── Iqama row ── */}
            <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
              <div className="px-5 py-4 flex items-center">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Iqama</span>
              </div>
              {PRAYER_META.map(p => (
                <div key={p.key} className="px-5 py-4 border-l border-white/5">
                  <BatchControl
                    cell={(batchIqama as unknown as Record<string, BatchCell>)[p.key]}
                    onUpdate={patch => setBatchIqama(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                    placeholder="6:30 AM" accentBg={theme.accentBg} accent={theme.accent} />
                </div>
              ))}
            </div>

            {/* ── 2nd Jamaat row (fajr + maghrib only) ── */}
            {(jamaatSettings.fajr2 || jamaatSettings.maghrib2) && (
              <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                <div className="px-5 py-4 flex items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500">2nd Jamaat</span>
                </div>
                {PRAYER_META.map(p => {
                  const show = (p.key === "fajr" && jamaatSettings.fajr2) || (p.key === "maghrib" && jamaatSettings.maghrib2);
                  const k = p.key as "fajr" | "maghrib";
                  return (
                    <div key={p.key} className="px-5 py-4 border-l border-white/5">
                      {show ? <BatchControl cell={batchIqama2[k]}
                        onUpdate={patch => setBatchIqama2(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                        placeholder="7:00 AM" accentBg={theme.accentBg} accent={theme.accent} />
                      : <span className="text-zinc-700 text-xs">—</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 3rd Jamaat row (fajr + maghrib only) ── */}
            {(jamaatSettings.fajr3 || jamaatSettings.maghrib3) && (
              <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5">
                <div className="px-5 py-4 flex items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500">3rd Jamaat</span>
                </div>
                {PRAYER_META.map(p => {
                  const show = (p.key === "fajr" && jamaatSettings.fajr3) || (p.key === "maghrib" && jamaatSettings.maghrib3);
                  const k = p.key as "fajr" | "maghrib";
                  return (
                    <div key={p.key} className="px-5 py-4 border-l border-white/5">
                      {show ? <BatchControl cell={batchIqama3[k]}
                        onUpdate={patch => setBatchIqama3(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                        placeholder="7:30 AM" accentBg={theme.accentBg} accent={theme.accent} />
                      : <span className="text-zinc-700 text-xs">—</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Jummah + Weekend Isha ── */}
            <div className="px-7 py-5 grid grid-cols-2 gap-5">

              {/* Jummah */}
              <div className="bg-zinc-800/30 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Jummah</span>
                      <span className={`text-sm ${theme.accent}`} style={{ fontFamily: "serif" }}>الجمعة</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Applied to Fridays in the date range</p>
                  </div>
                  {extraTimings.jummah.length < 3 && (
                    <button onClick={() => setExtraTimings(prev => ({ ...prev, jummah: [...prev.jummah, ""] }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black ${theme.subtleBtn}`}>+ Add</button>
                  )}
                </div>
                {extraTimings.jummah.length === 0 ? (
                  <div className="text-xs text-zinc-600 font-bold py-5 text-center border border-dashed border-white/8 rounded-xl">
                    No Jummah times yet
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {extraTimings.jummah.map((t, i) => (
                      <div key={i} className="flex-1 bg-zinc-900/60 border border-white/8 rounded-xl p-3 hover:border-white/15 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${theme.label}`}>Khutbah {i + 1}</span>
                          <button onClick={() => setExtraTimings(prev => ({ ...prev, jummah: prev.jummah.filter((_, j) => j !== i) }))}
                            className="text-zinc-600 hover:text-rose-400 text-xs font-black transition-colors">×</button>
                        </div>
                        <LocalInput
                          value={t}
                          onCommit={v => { const u = [...extraTimings.jummah]; u[i] = formatTimeInput(v); setExtraTimings(prev => ({ ...prev, jummah: u })); }}
                          placeholder="1:15 PM"
                          className="w-full bg-zinc-800/60 border border-white/8 rounded-lg px-3 py-2 text-lg font-black text-white focus:outline-none focus:border-white/20" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weekend Isha */}
              <div className="bg-zinc-800/30 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Weekend Isha</span>
                      <span className={`text-sm ${theme.accent}`} style={{ fontFamily: "serif" }}>العشاء</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Override Isha iqama on selected days</p>
                  </div>
                  <button
                    onClick={() => setExtraTimings(prev => ({ ...prev, weekendIsha: { ...prev.weekendIsha, enabled: !prev.weekendIsha.enabled } }))}
                    className={`w-10 h-6 rounded-full relative transition-all shrink-0 border ${extraTimings.weekendIsha.enabled ? `${theme.accentBg} ${theme.accentBorder}` : "bg-zinc-700 border-transparent"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${extraTimings.weekendIsha.enabled ? `${theme.dot} right-0.5` : "bg-zinc-500 left-0.5"}`} />
                  </button>
                </div>
                {extraTimings.weekendIsha.enabled ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[{ id: "fri", label: "Fri" }, { id: "sat", label: "Sat" }, { id: "sun", label: "Sun" }].map(d => {
                        const active = extraTimings.weekendIsha.days.includes(d.id);
                        return (
                          <button key={d.id}
                            onClick={() => setExtraTimings(prev => ({
                              ...prev,
                              weekendIsha: {
                                ...prev.weekendIsha,
                                days: active ? prev.weekendIsha.days.filter(x => x !== d.id) : [...prev.weekendIsha.days, d.id],
                              },
                            }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                              active ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "bg-zinc-900/60 border-white/8 text-zinc-500 hover:border-white/15"
                            }`}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Iqama Time</div>
                      <LocalInput
                        value={extraTimings.weekendIsha.iqama}
                        onCommit={v => setExtraTimings(prev => ({ ...prev, weekendIsha: { ...prev.weekendIsha, iqama: formatTimeInput(v) } }))}
                        placeholder="10:00 PM"
                        className="w-full bg-transparent border-none outline-none text-lg font-black text-white focus:outline-none" />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600 font-bold py-5 text-center border border-dashed border-white/8 rounded-xl">
                    Enable to set a weekend override
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}


      {/* ── Source switch confirmation modal ── */}
      {pendingSource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md bg-zinc-900 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

            {/* Top band */}
            <div className={`px-7 pt-7 pb-5 ${pendingSource === "excel" ? "bg-red-500/5 border-b border-red-500/10" : `bg-zinc-800/40 border-b border-white/5`}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${pendingSource === "excel" ? "bg-red-500/15 border border-red-500/25" : `${theme.iconBg}`}`}>
                  {pendingSource === "excel"
                    ? <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5 text-red-400" />
                    : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className={`w-5 h-5 ${theme.iconColor}`} />
                  }
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-0.5">Switching source</div>
                  <div className="text-lg font-black text-white">
                    {pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}
                  </div>
                </div>
              </div>

              {/* Before / After */}
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/80 border border-white/8 text-center">
                  <div className="text-xs text-zinc-600 font-bold mb-0.5 uppercase tracking-wider">From</div>
                  <div className="text-sm font-black text-zinc-300">{prayerSource === "backend" ? "Auto-calculate" : "Upload Excel"}</div>
                </div>
                <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" className="w-4 h-4 text-zinc-600 shrink-0" />
                <div className={`flex-1 px-4 py-3 rounded-xl border text-center ${pendingSource === "excel" ? "bg-red-500/10 border-red-500/20" : `${theme.accentBg} ${theme.accentBorder}`}`}>
                  <div className={`text-xs font-bold mb-0.5 uppercase tracking-wider ${pendingSource === "excel" ? "text-red-500/70" : theme.label}`}>To</div>
                  <div className={`text-sm font-black ${pendingSource === "excel" ? "text-red-400" : theme.accent}`}>{pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-5">
              <p className="text-zinc-400 text-sm leading-relaxed">
                {pendingSource === "excel"
                  ? <><span className="text-red-400 font-bold">All prayer times will be deleted</span> from the database. You'll need to upload an Excel file to add them back.</>
                  : <><span className={`${theme.accent} font-bold`}>Prayer times will be recalculated</span> for the full year using your location and method settings, overwriting any existing data.</>
                }
              </p>
            </div>

            {/* Actions */}
            <div className="px-7 pb-7 flex gap-3">
              <button onClick={() => setPendingSource(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-zinc-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleConfirmSourceSwitch}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  pendingSource === "excel" ? "bg-red-500 hover:bg-red-400 text-white" : `${theme.btn} hover:opacity-90`
                }`}>
                {pendingSource === "excel" ? "Delete & Switch" : "Generate & Switch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Month + Action bar ── */}
      <div className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-6 border bg-zinc-900/60 border-white/5">
        {/* Month pills */}
        <div className="flex gap-2 flex-1 overflow-x-auto pb-0.5 scrollbar-none">
          {months.map((m) => {
            const hasData = !!prayerTimesByMonth[m.value];
            const isActive = selectedMonth === m.value;
            return (
              <button key={m.value} onClick={() => { setSelectedMonth(m.value); setScheduleEdited(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                  isActive ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}` : "border-white/5 bg-zinc-800/30 hover:border-white/10 text-zinc-500 hover:text-white"
                }`}>
                {m.label.split(" ")[0]}
                {hasData && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? theme.dot : "bg-zinc-500"}`} />}
              </button>
            );
          })}
        </div>

        {/* Action */}
        <div className="flex items-center gap-3 shrink-0">
          {prayerSource === "backend" ? (
            switchLoading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating…
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-black text-white w-10 text-center">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )
          ) : (
            <>
              <div>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-bar" />
                <label htmlFor="file-upload-bar" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm cursor-pointer transition-all border-2 border-dashed ${
                  uploadFile ? `${theme.accentBorder} ${theme.accentBg} ${theme.accent}` : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                }`}>
                  <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="w-4 h-4" />
                  {uploadFile ? uploadFile.name : "Select .xlsx"}
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-black text-white w-10 text-center">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feedback messages */}
      {uploadSuccess && (
        <div className="mb-4 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-3">
          <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 font-bold text-sm">{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div className="mb-4 p-4 bg-red-500/15 border border-red-500/40 rounded-xl">
          <p className="text-red-400 font-bold text-sm">{uploadError}</p>
        </div>
      )}

      {/* ── Schedule table ── */}
      {prayerLoading ? (
        <div className="rounded-2xl border-2 border-dashed border-white/8 flex flex-col items-center justify-center text-center py-20">
          <svg className="animate-spin h-10 w-10 mb-4 text-zinc-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-sm text-zinc-600 font-bold">Loading prayer times…</div>
        </div>
      ) : !prayerTimesByMonth[selectedMonth] ? (
        <div className="rounded-2xl border-2 border-dashed border-white/8 flex flex-col items-center justify-center text-center py-20">
          {(() => {
            const yearHasData = months.some(m => !!prayerTimesByMonth[m.value]);
            const isGenerating = generatingYear === selectedYear;
            if (prayerSource === "backend" && !yearHasData) {
              return (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                    <Icon d="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="font-black text-lg mb-1 text-white">No prayer times for {selectedYear}</div>
                  <div className="text-sm text-zinc-500 mb-6">Generate the full year using your location and preset settings</div>
                  <button
                    disabled={isGenerating}
                    onClick={() => handleGenerateYear(selectedYear)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
                      isGenerating ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-wait" : "bg-emerald-500 hover:bg-emerald-400 text-black"
                    }`}>
                    {isGenerating
                      ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
                      : <>Generate {selectedYear}</>
                    }
                  </button>
                </>
              );
            }
            return (
              <>
                <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 mb-4 text-zinc-700" />
                <div className="font-black text-lg mb-2 text-zinc-500">
                  No schedule for {months.find(m => m.value === selectedMonth)?.label}
                </div>
                <div className="text-sm text-zinc-700">
                  {prayerSource === "backend" ? "Use the Adhan & Iqama panel to apply times" : "Select a file and click Upload above"}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="rounded-2xl border-2 bg-zinc-900/60 border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.label}`}>Monthly Schedule</div>
              <h2 className="text-xl font-black text-white">
                {months.find((m) => m.value === selectedMonth)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {scheduleEdited && !savingSchedule && (
                <button onClick={handleDiscardChanges}
                  className="px-4 py-2 rounded-xl font-black text-sm transition-all text-zinc-500 hover:text-white border border-white/5 hover:border-white/15">
                  Discard
                </button>
              )}
              {(scheduleEdited || savingSchedule || savedSchedule) && (
                <button onClick={handleSaveSchedule} disabled={savingSchedule}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all ${
                    savedSchedule ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      : savingSchedule ? "bg-zinc-800 text-zinc-500 cursor-wait border border-white/5"
                      : `${theme.btn}`
                  }`}>
                  {savingSchedule
                    ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
                    : savedSchedule ? <><Icon d="M5 13l4 4L19 7" className="w-3.5 h-3.5" /> Saved</>
                    : "Save"
                  }
                </button>
              )}
            </div>
          </div>
          <div>
            {(() => {
              const extraCols: Record<string, string[]> = {
                fajr:    [...(jamaatSettings.fajr2 ? ["2nd"] : []), ...(jamaatSettings.fajr3 ? ["3rd"] : [])],
                dhuhr:   [],
                asr:     [],
                maghrib: [...(jamaatSettings.maghrib2 ? ["2nd"] : []), ...(jamaatSettings.maghrib3 ? ["3rd"] : [])],
                isha:    [],
              };
              const jummahCount = extraTimings.jummah.length;
              const totalCols = 1 + PRAYER_META.reduce((s, p) => s + 3 + extraCols[p.key].length, 0) + jummahCount;
              const compact = totalCols > 17;
              const tdPx = compact ? "px-1" : "px-2";
              const thPx = compact ? "px-1.5" : "px-3";
              const txtSz = compact ? "text-xs" : "text-sm";
              const tableCellInputCls = `w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/25 rounded px-1 py-0.5 ${txtSz} text-zinc-400 focus:text-white focus:outline-none transition-all placeholder-zinc-700`;
              return (
                <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className={`py-3 px-3 ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-left`} style={{ width: compact ? "52px" : "72px" }}>Date</th>
                      {PRAYER_META.map((p) => (
                        <th key={p.key} colSpan={3 + extraCols[p.key].length}
                          className={`py-3 ${thPx} ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-center border-l border-white/8`}>
                          {p.label}
                        </th>
                      ))}
                      {jummahCount > 0 && (
                        <th colSpan={jummahCount}
                          className={`py-3 ${thPx} ${txtSz} font-black uppercase tracking-widest text-zinc-500 text-center border-l border-white/8`}>
                          Jummah
                        </th>
                      )}
                    </tr>
                    <tr className="border-b-2 border-white/10">
                      <th />
                      {PRAYER_META.map((p) => (
                        <React.Fragment key={p.key}>
                          <th className={`py-2 ${thPx} ${txtSz} font-bold text-center border-l border-white/8 text-zinc-600`}>Start</th>
                          <th className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>Adhan</th>
                          <th className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>Iqama</th>
                          {extraCols[p.key].map(n => (
                            <th key={n} className={`py-2 ${thPx} ${txtSz} font-bold text-center text-zinc-600`}>{n} Jamaat</th>
                          ))}
                        </React.Fragment>
                      ))}
                      {Array.from({ length: jummahCount }, (_, i) => (
                        <th key={i} className={`py-2 ${thPx} ${txtSz} font-bold text-center border-l border-white/8 text-zinc-600`}>
                          Khutbah {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prayerTimesByMonth[selectedMonth].map((day, i) => {
                      const d = day as unknown as Record<string, string>;
                      const isFriday = new Date(day.date + "T12:00:00").getDay() === 5;
                      return (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                          <td className={`py-2 px-2 font-black ${txtSz} text-white`}>
                            {day.date.split("-").slice(1).join("/")}
                          </td>
                          {PRAYER_META.map((p) => {
                            const start = day[p.key] as string;
                            return (
                              <React.Fragment key={p.key}>
                                {/* Start time — read-only */}
                                <td className={`py-2 ${tdPx} border-l border-white/5 font-bold ${txtSz} text-zinc-400 text-center`}>
                                  {to12h(start)}
                                </td>
                                {/* Adhan */}
                                <td className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                  <LocalInput
                                    value={d[`${p.key}_adhan`] || ""}
                                    onCommit={v => handleEditCell(day.date, `${p.key}_adhan`, formatTimeInput(v))}
                                    placeholder="—"
                                    className={tableCellInputCls + " text-center"}
                                  />
                                </td>
                                {/* Iqama */}
                                <td className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                  <LocalInput
                                    value={d[`${p.key}_iqama`] || ""}
                                    onCommit={v => handleEditCell(day.date, `${p.key}_iqama`, formatTimeInput(v))}
                                    placeholder="—"
                                    className={tableCellInputCls + " text-center"}
                                  />
                                </td>
                                {/* Extra jamaats */}
                                {extraCols[p.key].map((n) => {
                                  const field = `${p.key}_iqama_${n === "2nd" ? 2 : 3}`;
                                  return (
                                    <td key={n} className={`py-2 ${tdPx} ${txtSz} text-center`}>
                                      <LocalInput
                                        value={d[field] || ""}
                                        onCommit={v => handleEditCell(day.date, field, formatTimeInput(v))}
                                        placeholder="—"
                                        className={tableCellInputCls + " text-center"}
                                      />
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                          {/* Jummah cells — editable on Fridays only */}
                          {Array.from({ length: jummahCount }, (_, j) => {
                            const field = `jummah_${j + 1}`;
                            const val = d[field] || "";
                            return (
                              <td key={j} className={`py-2 ${tdPx} ${txtSz} border-l border-white/5`}>
                                {isFriday ? (
                                  <LocalInput
                                    value={val}
                                    onCommit={v => handleEditCell(day.date, field, formatTimeInput(v))}
                                    placeholder="—"
                                    className={`w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/25 rounded px-1 py-0.5 ${txtSz} font-bold focus:outline-none transition-all placeholder-zinc-700 text-center ${theme.accent}`}
                                  />
                                ) : (
                                  <span className="text-zinc-700 px-1">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Excel Column Mapping Modal ── */}
      {xlsxPreview && (() => {
        const rows = xlsxPreview.sheetRows[xlsxPreview.selectedSheet];
        const headers = rows[xlsxPreview.headerRowIdx]?.map(h => String(h ?? "").trim()) ?? [];
        const previewRows = rows.slice(xlsxPreview.headerRowIdx + 1).filter(r => r.some(c => c)).slice(0, 5);
        const colOpts = ["", ...headers];

        const JUMMAH_FIELDS = [
          { key: "jummah1", label: "Jummah 1" },
          { key: "jummah2", label: "Jummah 2" },
          { key: "jummah3", label: "Jummah 3" },
        ];

        const sel = (key: string) => (
          <select
            className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors appearance-none"
            value={colMap[key] ?? ""}
            onChange={e => setColMap(m => ({ ...m, [key]: e.target.value }))}
          >
            {colOpts.map(o => <option key={o} value={o}>{o || "— none —"}</option>)}
          </select>
        );

        const PRAYER_ROWS = [
          { key: "fajr",    label: "Fajr",    arabic: "الفجر",   iqama: "fajr_iqama" },
          { key: "dhuhr",   label: "Dhuhr",   arabic: "الظهر",   iqama: "dhuhr_iqama" },
          { key: "asr",     label: "Asr",     arabic: "العصر",   iqama: "asr_iqama" },
          { key: "maghrib", label: "Maghrib", arabic: "المغرب",  iqama: "maghrib_iqama" },
          { key: "isha",    label: "Isha",    arabic: "العشاء",   iqama: "isha_iqama" },
        ];

        const mappedSet = new Set(Object.values(colMap).filter(Boolean));
        const colLabel = (h: string) => {
          const entry = Object.entries(colMap).find(([, v]) => v === h);
          if (!entry) return null;
          const labels: Record<string, string> = {
            date: "Date", day: "Day #", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr",
            maghrib: "Maghrib", isha: "Isha", fajr_iqama: "Fajr Iqama",
            dhuhr_iqama: "Dhuhr Iqama", asr_iqama: "Asr Iqama",
            maghrib_iqama: "Maghrib Iqama", isha_iqama: "Isha Iqama",
            jummah1: "Jummah 1", jummah2: "Jummah 2", jummah3: "Jummah 3",
          };
          return labels[entry[0]] ?? entry[0];
        };

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.88)" }}>
            <div className="w-full max-w-5xl bg-zinc-900 border border-white/8 rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "90vh" }}>

              {/* Header */}
              <div className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className={`w-5 h-5 ${theme.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black">Map Columns</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{uploadFile?.name}</p>
                </div>
                {xlsxPreview.sheets.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-zinc-800/60 border border-white/8 rounded-xl p-1">
                    {xlsxPreview.sheets.map(s => (
                      <button key={s} onClick={() => {
                        const newRows = xlsxPreview.sheetRows[s];
                        const keywords = ["fajr","dhuhr","zuhr","asr","maghrib","isha","date","day"];
                        const hi = newRows.findIndex(r => r.some(c => keywords.some(k => String(c ?? "").toLowerCase().includes(k))));
                        setXlsxPreview(p => p ? { ...p, selectedSheet: s, headerRowIdx: Math.max(0, hi) } : p);
                        if (hi >= 0) autoMapColumns(newRows[hi].map(h => String(h ?? "").trim()));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${xlsxPreview.selectedSheet === s ? `${theme.accentBg} ${theme.accent}` : "text-zinc-500 hover:text-white"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 font-bold">Header row</span>
                  <input type="number" min={1} max={rows.length}
                    value={xlsxPreview.headerRowIdx + 1}
                    onChange={e => {
                      const idx = Math.max(0, parseInt(e.target.value) - 1);
                      setXlsxPreview(p => p ? { ...p, headerRowIdx: idx } : p);
                      autoMapColumns((rows[idx] ?? []).map(h => String(h ?? "").trim()));
                    }}
                    className="w-14 bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
                <button onClick={() => { setXlsxPreview(null); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/8 transition-all shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">

                {/* Top half: data preview */}
                <div className="flex flex-col border-b border-white/5" style={{ flex: "0 0 40%" }}>
                  <div className="flex items-center gap-2 px-7 pt-3 pb-2 shrink-0">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Data Preview</span>
                    <span className="text-[10px] text-zinc-700 font-bold">· first 5 rows after header</span>
                  </div>
                  {headers.length > 0 ? (
                    <div className="overflow-auto flex-1 px-5 pb-4">
                      <table className="text-xs border-collapse w-max min-w-full">
                        <thead>
                          <tr>
                            {headers.map((h, i) => {
                              const label = colLabel(h);
                              return (
                                <th key={i} className={`px-4 py-2 text-left whitespace-nowrap border-b ${label ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/5"}`}>
                                  <div className={`font-black ${label ? theme.accent : "text-zinc-500"}`}>{h}</div>
                                  {label && <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-60 ${theme.accent}`}>{label}</div>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? "" : "bg-white/[0.02]"}>
                              {headers.map((h, ci) => (
                                <td key={ci} className={`px-4 py-1.5 whitespace-nowrap border-b border-white/[0.03] ${mappedSet.has(h) ? "text-white font-semibold" : "text-zinc-600"}`}>
                                  {String(row[ci] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm px-7">
                      No headers found at row {xlsxPreview.headerRowIdx + 1} — try a different header row number.
                    </div>
                  )}
                </div>

                {/* Bottom half: column mapping */}
                <div className="flex-1 px-7 py-4 flex flex-col justify-between">

                  {/* Date */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <div className="w-1.5 h-3 rounded-full bg-blue-400/60 shrink-0"></div>
                      <span className="text-xs font-black text-zinc-300">Date</span>
                    </div>
                    <div className="w-52">{sel("date")}</div>
                    <span className="text-[10px] text-zinc-700 font-bold">YYYY-MM-DD · DD/MM/YYYY · Excel serial</span>
                  </div>

                  <div className="border-t border-white/5 mb-3" />

                  {/* Prayer rows */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    <div className="grid gap-3 items-center mb-1" style={{ gridTemplateColumns: "96px 1fr 1fr" }}>
                      <div />
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">Adhan / Start</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">Iqama</div>
                    </div>
                    {PRAYER_ROWS.map(p => (
                      <div key={p.key} className="grid gap-3 items-center" style={{ gridTemplateColumns: "96px 1fr 1fr" }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-3 rounded-full bg-emerald-400/60 shrink-0"></div>
                          <div>
                            <div className="text-sm font-black text-white leading-tight">{p.label}</div>
                            <div className="text-[10px] text-zinc-600" style={{ fontFamily: "serif" }}>{p.arabic}</div>
                          </div>
                        </div>
                        {sel(p.key)}
                        {sel(p.iqama)}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 mb-3" />

                  {/* Jummah */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <div className="w-1.5 h-3 rounded-full bg-amber-400/60 shrink-0"></div>
                      <span className="text-xs font-black text-zinc-300">Jummah</span>
                    </div>
                    <div className="flex gap-3 flex-1">
                      {JUMMAH_FIELDS.map(f => (
                        <div key={f.key} className="flex-1">
                          <label className="text-[10px] font-bold text-zinc-600 mb-1 block">{f.label}</label>
                          {sel(f.key)}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-8 py-3 border-t border-white/5">
                {uploadError
                  ? <p className="text-red-400 text-sm font-bold flex-1">{uploadError}</p>
                  : <p className="text-zinc-600 text-xs flex-1">Highlighted columns will be imported. Unmapped prayers use auto-calculated defaults.</p>
                }
                <button onClick={() => { setXlsxPreview(null); }} className="px-5 py-2.5 rounded-xl font-bold border border-white/8 text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-sm">
                  Cancel
                </button>
                <button onClick={handleConfirmImport} disabled={isUploading || !colMap.date}
                  className={`px-7 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${isUploading || !colMap.date ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : `${theme.btn} hover:scale-[1.02]`}`}>
                  {isUploading
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Importing…</>
                    : <>Import <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default PrayerTimesTab;
