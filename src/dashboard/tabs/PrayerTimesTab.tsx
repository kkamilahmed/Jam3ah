import React from "react";
import type { PrayerTime, BatchCell, BatchCell2, BatchConfig, Month } from "../types";
import { THEMES, type ThemeKey } from "../themes";
import { to12h, formatTimeInput } from "../utils";
import BatchControl from "../components/BatchControl";
import DatePicker from "../components/DatePicker";
import LocalInput from "../components/LocalInput";
import Select from "../components/Select";
import useIsMobile from "../../hooks/useIsMobile";

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
  extraTimings: { fajr: string[]; maghrib: string[]; jummah: string[]; jummahSlots: [boolean, boolean, boolean]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } };
  setExtraTimings: React.Dispatch<React.SetStateAction<{ fajr: string[]; maghrib: string[]; jummah: string[]; jummahSlots: [boolean, boolean, boolean]; weekendIsha: { enabled: boolean; days: string[]; iqama: string } }>>;
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
  theme: _theme,
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
  const isMobile = useIsMobile();
  const [batchOpen, setBatchOpen] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(false);

  const buildSummary = () => {
    const lines: { label: string; value: string; skip?: boolean }[] = [];
    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
    const labels: Record<string, string> = { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };
    for (const p of prayers) {
      const aCell = (batchAdhan as unknown as Record<string, BatchCell>)[p];
      const iCell = (batchIqama as unknown as Record<string, BatchCell>)[p];
      const adhanEmpty = aCell.mode === "fixed" && !aCell.fixed;
      const iqamaEmpty = iCell.mode === "fixed" && !iCell.fixed;
      lines.push({
        label: `${labels[p]} Adhan`,
        value: adhanEmpty ? "—" : aCell.mode === "fixed" ? aCell.fixed : aCell.offset === 0 ? "No change (+0 min)" : `+${aCell.offset} min`,
        skip: adhanEmpty,
      });
      lines.push({
        label: `${labels[p]} Iqama`,
        value: iqamaEmpty ? "—" : iCell.mode === "fixed" ? iCell.fixed : `+${iCell.offset} min from adhan`,
        skip: iqamaEmpty,
      });
    }
    const jummahLines = (["1st", "2nd", "3rd"] as const)
      .map((lbl, i) => extraTimings.jummahSlots[i] ? { label: `Jummah ${lbl}`, value: extraTimings.jummah[i] || "—", skip: !extraTimings.jummah[i] } : null)
      .filter(Boolean) as { label: string; value: string; skip: boolean }[];
    const wishaActive = extraTimings.weekendIsha.iqama && extraTimings.weekendIsha.days.length > 0;
    const dayCount = Object.values(prayerTimesByMonth).flat().filter(d => d.date >= batchFrom && d.date <= batchTo).length;
    return { lines, jummahLines, wishaActive, dayCount };
  };

  return (
    <div style={{ padding: isMobile ? "20px 16px 80px" : "40px 32px", fontFamily: "Manrope, sans-serif", background: "var(--surface-low)", minHeight: "100%" }}>

      {/* ── Batch Apply Summary Modal ── */}
      {showSummary && (() => {
        const { lines, jummahLines, wishaActive, dayCount } = buildSummary();
        const hasAnything = lines.some(l => !l.skip) || jummahLines.some(l => !l.skip) || wishaActive;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} onClick={() => setShowSummary(false)}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: 4, width: 480, maxWidth: "90vw", maxHeight: "80vh", overflow: "auto", fontFamily: "Manrope, sans-serif" }} onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--outline-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 4 }}>Confirm</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Prayer Schedule Builder</div>
                </div>
                <button onClick={() => setShowSummary(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
              {/* Date range summary */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--outline-subtle)", display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", marginBottom: 2 }}>Date range</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{batchFrom || "—"} → {batchTo || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", marginBottom: 2 }}>Days affected</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{dayCount}</div>
                </div>
              </div>
              {/* Changes list */}
              <div style={{ padding: "16px 24px" }}>
                {!hasAnything ? (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-ghost)" }}>No changes to apply — all fields are empty.</p>
                ) : (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", marginBottom: 10 }}>Changes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {lines.filter(l => !l.skip).map((l, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--surface-mid)", borderRadius: 2, border: "1px solid var(--surface-high)" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" }}>{l.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{l.value}</span>
                        </div>
                      ))}
                      {jummahLines.filter(l => !l.skip).map((l, i) => (
                        <div key={`j${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--surface-mid)", borderRadius: 2, border: "1px solid var(--accent-border)" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" }}>{l.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{l.value}</span>
                        </div>
                      ))}
                      {wishaActive && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--surface-mid)", borderRadius: 2, border: "1px solid var(--surface-high)" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" }}>Weekend Isha ({extraTimings.weekendIsha.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")})</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{extraTimings.weekendIsha.iqama}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Footer buttons */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--outline-subtle)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowSummary(false)}
                  style={{ padding: "8px 20px", borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: "Manrope, sans-serif", background: "transparent", border: "1px solid var(--outline)", color: "var(--on-surface-variant)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button disabled={!hasAnything || applyingBatch} onClick={() => { setShowSummary(false); handleBatchApply(); }}
                  style={{ padding: "8px 20px", borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: "Manrope, sans-serif", background: hasAnything ? "var(--accent)" : "var(--surface-high)", border: "none", color: hasAnything ? "var(--accent-text)" : "var(--text-ghost)", cursor: hasAnything ? "pointer" : "not-allowed" }}>
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ── Header ── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: isMobile ? 20 : 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Management</div>
          <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "var(--text-max)", margin: 0, letterSpacing: "-0.02em" }}>Prayer Times</h1>
        </div>
        {/* Source toggle */}
        <div style={{ display: "flex", alignItems: "center", background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 3, gap: 2 }}>
          {([{ k: "backend" as const, label: isMobile ? "Auto" : "Auto-calculate" }, { k: "excel" as const, label: isMobile ? "Excel" : "Upload Excel" }]).map(opt => (
            <button key={opt.k}
              onClick={() => opt.k !== prayerSource && setPendingSource(opt.k)}
              style={{
                padding: isMobile ? "6px 12px" : "6px 14px",
                borderRadius: 2,
                fontSize: isMobile ? 12 : 13,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                border: prayerSource === opt.k ? "1px solid var(--accent-border)" : "1px solid transparent",
                background: prayerSource === opt.k ? "var(--accent-bg)" : "transparent",
                color: prayerSource === opt.k ? "var(--accent)" : "var(--text-ghost)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Prayer Times ── */}
      {(() => {
        return (
          <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3 }}>Today</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-max)" }}>
                  {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-phantom)", fontWeight: 600 }}>
                {todayRow ? "" : "No times loaded"}
              </div>
            </div>
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)", gap: isMobile ? 8 : 10 }}>
              {PRAYER_META.map((p) => {
                const row = todayRow as unknown as Record<string,string> | undefined;
                const adhanT = row ? (row[`${p.key}_adhan`] || row[p.key] || "—") : "—";
                const iqamaT = row ? (row[`${p.key}_iqama`] || "—") : "—";
                return isMobile ? (
                  <div key={p.key} style={{ background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, display: "flex", alignItems: "center", padding: "10px 14px", gap: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--text-max)", fontSize: 14, letterSpacing: "-0.02em", width: 68, flexShrink: 0 }}>{p.label}</div>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                      {[
                        { label: "Adhan", val: to12h(adhanT) },
                        { label: "Iqama", val: to12h(iqamaT) },
                      ].map(({ label, val }, idx) => (
                        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", borderLeft: idx === 1 ? "1px solid var(--surface-high)" : "none" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--text-max)" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={p.key} style={{ background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 12px 12px", borderBottom: "1px solid var(--surface-high)" }}>
                      <div style={{ fontWeight: 800, color: "var(--text-max)", fontSize: 16, letterSpacing: "-0.02em" }}>{p.label}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>
                      {[
                        { label: "Adhan", val: to12h(adhanT) },
                        { label: "Iqama", val: to12h(iqamaT) },
                      ].map(({ label, val }, idx) => (
                        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 6px", borderLeft: idx === 1 ? "1px solid var(--surface-high)" : "none" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 6 }}>{label}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums", textAlign: "center", color: "var(--text-max)" }}>{val}</div>
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

      {/* ── Prayer Schedule Builder ── */}
      {(() => {
        return (
          <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, marginBottom: 32, overflow: "hidden" }}>

            {/* ── Header ── */}
            <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: batchOpen ? "1px solid var(--surface-high)" : "none", cursor: "pointer" }}
              onClick={() => setBatchOpen(o => !o)}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", transition: "transform 0.2s", transform: batchOpen ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>chevron_right</span>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-max)", margin: 0, letterSpacing: "-0.02em" }}>Prayer Schedule Builder</h2>
                    {!isMobile && <p style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 400, marginTop: 4, marginBottom: 0 }}>Set offsets or fixed times per prayer, then apply to a date range</p>}
                  </div>
                </div>
                {/* Date range + Apply — hidden on mobile (shown below) */}
                {batchOpen && !isMobile && <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "right" }}>From</span>
                      <DatePicker value={batchFrom} onChange={setBatchFrom} placeholder="Start date" align="left" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "right" }}>To</span>
                      <DatePicker value={batchTo} onChange={setBatchTo} placeholder="End date" align="right" rangeStart={batchFrom} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "transparent" }}>Btn</span>
                      <button onClick={() => setShowSummary(true)} disabled={applyingBatch || !batchFrom || !batchTo}
                        style={(() => {
                          const inactive = applyingBatch || !batchFrom || !batchTo;
                          return {
                            display: "flex", alignItems: "center", gap: 6, padding: "7px 18px",
                            borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: "Manrope, sans-serif",
                            height: 38, transition: "all 0.15s",
                            cursor: applyingBatch ? "wait" : inactive ? "not-allowed" : "pointer",
                            background: batchApplied ? "var(--accent-bg)" : inactive ? "var(--surface-high)" : "var(--accent)",
                            border: batchApplied ? "1px solid var(--accent-border)" : inactive ? "1px solid var(--surface-mid)" : "1px solid var(--accent)",
                            color: batchApplied ? "var(--accent)" : inactive ? "var(--text-ghost)" : "var(--accent-text)",
                          };
                        })()}>
                        {applyingBatch
                          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Applying…</>
                          : batchApplied ? <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> Applied</>
                          : "Apply"
                        }
                      </button>
                    </div>
                  </div>
                  {batchError && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#f87171" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0 }}>warning</span>
                      {batchError}
                    </div>
                  )}
                </div>}
              </div>
              {/* Mobile: date range + apply stacked below title */}
              {batchOpen && isMobile && (
                <div onClick={e => e.stopPropagation()} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>From</span>
                      <DatePicker value={batchFrom} onChange={setBatchFrom} placeholder="Start" align="left" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>To</span>
                      <DatePicker value={batchTo} onChange={setBatchTo} placeholder="End" align="right" rangeStart={batchFrom} />
                    </div>
                  </div>
                  <button onClick={() => setShowSummary(true)} disabled={applyingBatch || !batchFrom || !batchTo}
                    style={(() => {
                      const inactive = applyingBatch || !batchFrom || !batchTo;
                      return {
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 0", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: "Manrope, sans-serif",
                        cursor: applyingBatch ? "wait" : inactive ? "not-allowed" : "pointer",
                        background: batchApplied ? "var(--accent-bg)" : inactive ? "var(--surface-high)" : "var(--accent)",
                        border: batchApplied ? "1px solid var(--accent-border)" : inactive ? "1px solid var(--surface-mid)" : "1px solid var(--accent)",
                        color: batchApplied ? "var(--accent)" : inactive ? "var(--text-ghost)" : "var(--accent-text)",
                      };
                    })()}>
                    {applyingBatch ? "Applying…" : batchApplied ? "Applied ✓" : "Apply"}
                  </button>
                  {batchError && <div style={{ fontSize: 11, fontWeight: 600, color: "#f87171" }}>{batchError}</div>}
                </div>
              )}
            </div>

            {batchOpen && (<>
            {isMobile ? (
              /* ── Mobile: vertical per-prayer cards ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {PRAYER_META.map(p => {
                  const show2nd = (p.key === "fajr" && jamaatSettings.fajr2) || (p.key === "maghrib" && jamaatSettings.maghrib2);
                  const show3rd = (p.key === "fajr" && jamaatSettings.fajr3) || (p.key === "maghrib" && jamaatSettings.maghrib3);
                  const k = p.key as "fajr" | "maghrib";
                  return (
                    <div key={p.key} style={{ borderBottom: "1px solid var(--surface-high)" }}>
                      {/* Prayer name header */}
                      <div style={{ padding: "8px 16px", background: "var(--surface-mid)" }}>
                        <span style={{ fontWeight: 800, color: "var(--text-max)", fontSize: 13, letterSpacing: "-0.02em" }}>{p.label}</span>
                      </div>
                      {/* Adhan */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--surface-high)" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", width: 68, flexShrink: 0 }}>Adhan</span>
                        <div style={{ flex: 1 }}>
                          <BatchControl
                            cell={(batchAdhan as unknown as Record<string, BatchCell>)[p.key]}
                            onUpdate={patch => setBatchAdhan(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                            placeholder="6:00 AM" accentBg="" accent="" />
                        </div>
                      </div>
                      {/* Iqama */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--surface-high)" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", width: 68, flexShrink: 0 }}>Iqama</span>
                        <div style={{ flex: 1 }}>
                          <BatchControl
                            cell={(batchIqama as unknown as Record<string, BatchCell>)[p.key]}
                            onUpdate={patch => setBatchIqama(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                            placeholder="6:30 AM" accentBg="" accent="" />
                        </div>
                      </div>
                      {/* 2nd Jamaat */}
                      {show2nd && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--surface-high)" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", width: 68, flexShrink: 0 }}>2nd Jam.</span>
                          <div style={{ flex: 1 }}>
                            <BatchControl cell={batchIqama2[k]}
                              onUpdate={patch => setBatchIqama2(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                              placeholder="7:00 AM" accentBg="" accent="" />
                          </div>
                        </div>
                      )}
                      {/* 3rd Jamaat */}
                      {show3rd && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--surface-high)" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", width: 68, flexShrink: 0 }}>3rd Jam.</span>
                          <div style={{ flex: 1 }}>
                            <BatchControl cell={batchIqama3[k]}
                              onUpdate={patch => setBatchIqama3(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                              placeholder="7:30 AM" accentBg="" accent="" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
              {/* ── Desktop: Column headers ── */}
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                <div style={{ padding: "10px 18px" }} />
                {PRAYER_META.map(p => (
                  <div key={p.key} style={{ padding: "10px 18px", borderLeft: "1px solid var(--surface-high)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, color: "var(--text-max)", fontSize: 13, letterSpacing: "-0.02em" }}>{p.label}</span>
                  </div>
                ))}
              </div>

              {/* ── Adhan row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>Adhan</span>
                </div>
                {PRAYER_META.map(p => (
                  <div key={p.key} style={{ padding: "14px 18px", borderLeft: "1px solid var(--surface-high)" }}>
                    <BatchControl
                      cell={(batchAdhan as unknown as Record<string, BatchCell>)[p.key]}
                      onUpdate={patch => setBatchAdhan(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                      placeholder="6:00 AM" accentBg="" accent="" />
                  </div>
                ))}
              </div>

              {/* ── Iqama row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>Iqama</span>
                </div>
                {PRAYER_META.map(p => (
                  <div key={p.key} style={{ padding: "14px 18px", borderLeft: "1px solid var(--surface-high)" }}>
                    <BatchControl
                      cell={(batchIqama as unknown as Record<string, BatchCell>)[p.key]}
                      onUpdate={patch => setBatchIqama(prev => ({ ...prev, [p.key]: { ...(prev as unknown as Record<string, BatchCell>)[p.key], ...patch } }))}
                      placeholder="6:30 AM" accentBg="" accent="" />
                  </div>
                ))}
              </div>

              {/* ── 2nd Jamaat row (fajr + maghrib only) ── */}
              {(jamaatSettings.fajr2 || jamaatSettings.maghrib2) && (
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>2nd Jamaat</span>
                  </div>
                  {PRAYER_META.map(p => {
                    const show = (p.key === "fajr" && jamaatSettings.fajr2) || (p.key === "maghrib" && jamaatSettings.maghrib2);
                    const k = p.key as "fajr" | "maghrib";
                    return (
                      <div key={p.key} style={{ padding: "14px 18px", borderLeft: "1px solid var(--surface-high)" }}>
                        {show ? <BatchControl cell={batchIqama2[k]}
                          onUpdate={patch => setBatchIqama2(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                          placeholder="7:00 AM" accentBg="" accent="" />
                        : <span style={{ color: "var(--text-phantom)", fontSize: 12 }}>—</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── 3rd Jamaat row (fajr + maghrib only) ── */}
              {(jamaatSettings.fajr3 || jamaatSettings.maghrib3) && (
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--surface-high)" }}>
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>3rd Jamaat</span>
                  </div>
                  {PRAYER_META.map(p => {
                    const show = (p.key === "fajr" && jamaatSettings.fajr3) || (p.key === "maghrib" && jamaatSettings.maghrib3);
                    const k = p.key as "fajr" | "maghrib";
                    return (
                      <div key={p.key} style={{ padding: "14px 18px", borderLeft: "1px solid var(--surface-high)" }}>
                        {show ? <BatchControl cell={batchIqama3[k]}
                          onUpdate={patch => setBatchIqama3(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))}
                          placeholder="7:30 AM" accentBg="" accent="" />
                        : <span style={{ color: "var(--text-phantom)", fontSize: 12 }}>—</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            )}{/* end desktop grid */}
            {/* ── Jummah + Weekend Isha ── */}
            <div style={{ padding: isMobile ? "14px 16px" : "20px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>

              {/* Jummah */}
              {extraTimings.jummahSlots.some(Boolean) && (
                <div style={{ background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 18 }}>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-max)" }}>Jummah</span>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 400, marginTop: 2, marginBottom: 0 }}>Applied to Fridays in the date range</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["1st", "2nd", "3rd"] as const).map((label, i) => extraTimings.jummahSlots[i] ? (
                      <div key={i} style={{ flex: 1, background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: 10 }}>
                        <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 8 }}>Khutbah {label}</span>
                        <LocalInput value={extraTimings.jummah[i] ?? ""}
                          onCommit={v => { const u = [...extraTimings.jummah]; u[i] = formatTimeInput(v); setExtraTimings(prev => ({ ...prev, jummah: u })); }}
                          placeholder="1:15 PM"
                          style={{ width: "100%", background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "6px 10px", fontSize: 15, fontWeight: 800, color: "var(--text-max)", outline: "none", fontFamily: "Manrope, sans-serif" } as React.CSSProperties} />
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Weekend Isha — always shown, spans full width when no Jummah */}
              <div style={{ gridColumn: extraTimings.jummahSlots.some(Boolean) ? undefined : "1 / -1", background: "var(--surface-mid)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-max)" }}>Weekend Isha</span>
                  <p style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 400, marginTop: 2, marginBottom: 0 }}>Override Isha iqama on selected days</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ id: "fri", label: "Fri" }, { id: "sat", label: "Sat" }, { id: "sun", label: "Sun" }].map(d => {
                      const active = extraTimings.weekendIsha.days.includes(d.id);
                      return (
                        <button key={d.id}
                          onClick={() => setExtraTimings(prev => ({ ...prev, weekendIsha: { ...prev.weekendIsha, days: active ? prev.weekendIsha.days.filter(x => x !== d.id) : [...prev.weekendIsha.days, d.id] } }))}
                          style={{ flex: 1, padding: "7px 0", borderRadius: 2, fontSize: 12, fontWeight: 700, fontFamily: "Manrope, sans-serif", border: active ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)", background: active ? "var(--accent-bg)" : "transparent", color: active ? "var(--accent)" : "var(--text-phantom)", cursor: "pointer", transition: "all 0.15s" }}>
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 6 }}>Iqama Time</div>
                    <LocalInput value={extraTimings.weekendIsha.iqama}
                      onCommit={v => setExtraTimings(prev => ({ ...prev, weekendIsha: { ...prev.weekendIsha, iqama: formatTimeInput(v) } }))}
                      placeholder="10:00 PM"
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 800, color: "var(--text-max)", fontFamily: "Manrope, sans-serif" } as React.CSSProperties} />
                  </div>
                </div>
              </div>

            </div>
            </>)}
          </div>
        );
      })()}


      {/* ── Source switch confirmation modal ── */}
      {pendingSource && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.75)" }}>
          <div style={{ width: "100%", maxWidth: 440, background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }}>

            {/* Top band */}
            <div style={{
              padding: "24px 28px 18px",
              background: pendingSource === "excel" ? "rgba(239,68,68,0.06)" : "var(--surface-low)",
              borderBottom: pendingSource === "excel" ? "1px solid rgba(239,68,68,0.15)" : "1px solid var(--surface-high)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: pendingSource === "excel" ? "rgba(239,68,68,0.06)" : "var(--surface-mid)",
                  border: pendingSource === "excel" ? "1px solid rgba(239,68,68,0.15)" : "1px solid var(--surface-high)",
                }}>
                  {pendingSource === "excel"
                    ? <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#f87171" }}>delete</span>
                    : <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent)" }}>refresh</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 3 }}>Switching source</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>
                    {pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}
                  </div>
                </div>
              </div>

              {/* Before / After */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 2, background: "var(--surface-mid)", border: "1px solid var(--surface-high)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.12em" }}>From</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)" }}>{prayerSource === "backend" ? "Auto-calculate" : "Upload Excel"}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-phantom)", flexShrink: 0 }}>arrow_forward</span>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 2, textAlign: "center",
                  background: pendingSource === "excel" ? "rgba(239,68,68,0.06)" : "var(--accent-bg)",
                  border: pendingSource === "excel" ? "1px solid rgba(239,68,68,0.15)" : "1px solid var(--accent-bg)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.12em", color: pendingSource === "excel" ? "rgba(248,113,113,0.7)" : "var(--accent)" }}>To</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: pendingSource === "excel" ? "#f87171" : "var(--accent)" }}>{pendingSource === "excel" ? "Upload Excel" : "Auto-calculate"}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 28px" }}>
              <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {pendingSource === "excel"
                  ? <><span style={{ color: "#f87171", fontWeight: 700 }}>All prayer times will be deleted</span> from the database. You'll need to upload an Excel file to add them back.</>
                  : <><span style={{ color: "var(--text-max)", fontWeight: 700 }}>Prayer times will be recalculated</span> for the full year using your location and method settings, overwriting any existing data.</>
                }
              </p>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 28px 28px", display: "flex", gap: 10 }}>
              <button onClick={() => setPendingSource(null)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 2, fontWeight: 600, fontSize: 13, fontFamily: "Manrope, sans-serif", color: "var(--text-ghost)", border: "1px solid var(--outline-variant)", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                Cancel
              </button>
              <button onClick={handleConfirmSourceSwitch}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: "Manrope, sans-serif", cursor: "pointer", transition: "all 0.15s",
                  background: pendingSource === "excel" ? "rgba(239,68,68,0.06)" : "var(--accent)",
                  color: pendingSource === "excel" ? "#f87171" : "var(--accent-text)",
                  border: pendingSource === "excel" ? "1px solid rgba(239,68,68,0.15)" : "1px solid var(--accent)",
                }}>
                {pendingSource === "excel" ? "Delete & Switch" : "Generate & Switch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Month + Action bar ── */}
      <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, padding: "12px 16px", marginBottom: 20 }}>
        {isMobile ? (
          /* Mobile: month + year dropdowns */
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Select
                value={selectedMonth}
                onChange={v => { setSelectedMonth(v); setScheduleEdited(false); }}
                options={months.map(m => ({ value: m.value, label: m.label.split(" ")[0] + (prayerTimesByMonth[m.value] ? " ●" : "") }))}
                style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
              />
            </div>
            <div style={{ width: 100 }}>
              <Select
                value={String(selectedYear)}
                onChange={v => setSelectedYear(Number(v))}
                options={[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(y => ({ value: String(y), label: String(y) }))}
                style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
              />
            </div>
            {prayerSource === "excel" && (
              <div>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-bar-mobile" />
                <label htmlFor="file-upload-bar-mobile" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: uploadFile ? "var(--accent-bg)" : "transparent", border: uploadFile ? "1px solid var(--accent-border)" : "1px dashed var(--outline-variant)", borderRadius: 2, cursor: "pointer", color: uploadFile ? "var(--accent)" : "var(--text-ghost)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                </label>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Month pills */}
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {months.map((m) => {
                const hasData = !!prayerTimesByMonth[m.value];
                const isActive = selectedMonth === m.value;
                return (
                  <button key={m.value} onClick={() => { setSelectedMonth(m.value); setScheduleEdited(false); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "6px 0", borderRadius: 2, fontWeight: 700, fontSize: 12,
                      fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.15s",
                      background: isActive ? "var(--accent-bg)" : "var(--surface-mid)",
                      border: isActive ? "1px solid var(--accent-border)" : "1px solid var(--surface-high)",
                      color: isActive ? "var(--accent)" : "var(--text-ghost)",
                    }}>
                    {m.label.split(" ")[0]}
                    {hasData && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "var(--accent)" : "var(--outline)" }} />}
                  </button>
                );
              })}
            </div>
            {/* Action */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {prayerSource === "backend" ? (
            switchLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "var(--text-ghost)" }}>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating…
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setSelectedYear(y => y - 1)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-max)", width: 40, textAlign: "center" }}>{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )
          ) : (
            <>
              <div>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-bar" />
                <label htmlFor="file-upload-bar" style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 2, fontWeight: 700, fontSize: 12,
                  fontFamily: "Manrope, sans-serif", cursor: "pointer", transition: "all 0.15s",
                  border: uploadFile ? "1px solid var(--accent-border)" : "1px dashed var(--outline-variant)",
                  background: uploadFile ? "var(--accent-bg)" : "transparent",
                  color: uploadFile ? "var(--accent)" : "var(--text-ghost)",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                  {uploadFile ? uploadFile.name : "Select .xlsx"}
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setSelectedYear(y => y - 1)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-max)", width: 40, textAlign: "center" }}>{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
          </div>
        )}
      </div>

      {/* Feedback messages */}
      {uploadSuccess && (
        <div style={{ marginBottom: 14, padding: "12px 16px", background: "var(--accent-bg)", border: "1px solid var(--accent-bg)", borderRadius: 2, display: "flex", alignItems: "center", gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0 }}>check</span>
          <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13, margin: 0 }}>{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div style={{ marginBottom: 14, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 2 }}>
          <p style={{ color: "#f87171", fontWeight: 600, fontSize: 13, margin: 0 }}>{uploadError}</p>
        </div>
      )}

      {/* ── Schedule table ── */}
      {prayerLoading ? (
        <div style={{ border: "1px dashed var(--outline-variant)", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 0" }}>
          <svg className="animate-spin h-10 w-10 mb-4" style={{ color: "var(--text-ghost)" }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div style={{ fontSize: 13, color: "var(--text-ghost)", fontWeight: 600 }}>Loading prayer times…</div>
        </div>
      ) : !prayerTimesByMonth[selectedMonth] ? (
        <div style={{ border: "1px dashed var(--outline-variant)", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 0" }}>
          {(() => {
            const yearHasData = months.some(m => !!prayerTimesByMonth[m.value]);
            const isGenerating = generatingYear === selectedYear;
            if (prayerSource === "backend" && !yearHasData) {
              return (
                <>
                  <div style={{ width: 52, height: 52, borderRadius: 2, background: "var(--surface-mid)", border: "1px solid var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--text-ghost)" }}>add</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, color: "var(--text-max)", letterSpacing: "-0.02em" }}>No prayer times for {selectedYear}</div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24 }}>Generate the full year using your location and preset settings</div>
                  <button
                    disabled={isGenerating}
                    onClick={() => handleGenerateYear(selectedYear)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 2, fontWeight: 700, fontSize: 13,
                      fontFamily: "Manrope, sans-serif", cursor: isGenerating ? "wait" : "pointer", transition: "all 0.15s",
                      background: isGenerating ? "var(--surface-low)" : "var(--accent)",
                      border: isGenerating ? "1px solid var(--surface-mid)" : "1px solid var(--accent)",
                      color: isGenerating ? "var(--outline)" : "var(--accent-text)",
                    }}>
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
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--outline-variant)", display: "block", marginBottom: 16 }}>schedule</span>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, color: "var(--text-ghost)", letterSpacing: "-0.02em" }}>
                  No schedule for {months.find(m => m.value === selectedMonth)?.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {prayerSource === "backend" ? "Use the Adhan & Iqama panel to apply times" : "Select a file and click Upload above"}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div style={{ background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--surface-high)" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 4 }}>Monthly Schedule</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-max)", margin: 0, letterSpacing: "-0.02em" }}>
                {months.find((m) => m.value === selectedMonth)?.label}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {scheduleEdited && !savingSchedule && (
                <button onClick={handleDiscardChanges}
                  style={{ padding: "7px 14px", borderRadius: 2, fontWeight: 600, fontSize: 13, fontFamily: "Manrope, sans-serif", color: "var(--text-ghost)", border: "1px solid var(--outline-variant)", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                  Discard
                </button>
              )}
              {(scheduleEdited || savingSchedule || savedSchedule) && (
                <button onClick={handleSaveSchedule} disabled={savingSchedule}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: "Manrope, sans-serif",
                    cursor: savingSchedule ? "wait" : "pointer", transition: "all 0.15s",
                    background: savedSchedule ? "var(--accent-bg)" : savingSchedule ? "var(--surface-low)" : "var(--accent)",
                    border: savedSchedule ? "1px solid var(--accent-border)" : savingSchedule ? "1px solid var(--surface-mid)" : "1px solid var(--accent)",
                    color: savedSchedule ? "var(--accent)" : savingSchedule ? "var(--outline)" : "var(--accent-text)",
                  }}>
                  {savingSchedule
                    ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
                    : savedSchedule ? <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> Saved</>
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
              const jummahCount = extraTimings.jummahSlots.filter(Boolean).length;
              const totalCols = 1 + PRAYER_META.reduce((s, p) => s + 3 + extraCols[p.key].length, 0) + jummahCount;
              const compact = totalCols > 17;
              const tdPx = compact ? "1px 4px" : "1px 8px";
              const thPx = compact ? "6px 6px" : "8px 12px";
              const txtSz = compact ? 11 : 13;
              const tableCellInputStyle: React.CSSProperties = {
                width: "100%", background: "transparent", border: "1px solid transparent", borderRadius: 2,
                padding: compact ? "2px 4px" : "3px 6px", fontSize: txtSz, color: "#ffffff",
                fontFamily: "Manrope, sans-serif", outline: "none", textAlign: "center", transition: "border-color 0.15s",
              };
              const todayStr = new Date().toISOString().split("T")[0];
              const days = prayerTimesByMonth[selectedMonth];

              if (isMobile) {
                return (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {days.map((day, i) => {
                      const d = day as unknown as Record<string, string>;
                      const isFriday = new Date(day.date + "T12:00:00").getDay() === 5;
                      const isToday = day.date === todayStr;
                      const [, mm, dd] = day.date.split("-");
                      const weekday = new Date(day.date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short" });
                      return (
                        <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--surface-mid)" : undefined, background: isToday ? "rgba(52,211,153,0.04)" : undefined }}>
                          {/* Date header */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px", borderLeft: isToday ? "3px solid var(--accent)" : "3px solid transparent", background: isToday ? "rgba(52,211,153,0.06)" : "var(--surface-mid)" }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: isToday ? "var(--accent)" : "var(--text-max)" }}>{dd}/{mm}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-ghost)" }}>{weekday}</span>
                            {isToday && <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, padding: "1px 5px" }}>Today</span>}
                          </div>
                          {/* Prayer rows */}
                          {PRAYER_META.map((p, pi) => {
                            const start = day[p.key] as string;
                            return (
                              <div key={p.key} style={{ borderTop: "1px solid var(--surface-mid)" }}>
                                {/* Column label row — only on first prayer */}
                                {pi === 0 && (
                                  <div style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr 1fr", padding: "3px 14px 1px" }}>
                                    <span />
                                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-ghost)", textAlign: "center" }}>Start</span>
                                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", textAlign: "center" }}>Adhan</span>
                                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", textAlign: "center" }}>Iqama</span>
                                  </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr 1fr", alignItems: "center", padding: "3px 14px" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-ghost)" }}>{p.label}</span>
                                  <span style={{ fontSize: 10, color: "var(--text-phantom)", textAlign: "center" }}>{to12h(start)}</span>
                                  <LocalInput value={to12h(d[`${p.key}_adhan`] || "")} onCommit={v => handleEditCell(day.date, `${p.key}_adhan`, formatTimeInput(v))} placeholder="—" className="" style={{ ...tableCellInputStyle, fontSize: 10 }} />
                                  <LocalInput value={to12h(d[`${p.key}_iqama`] || "")} onCommit={v => handleEditCell(day.date, `${p.key}_iqama`, formatTimeInput(v))} placeholder="—" className="" style={{ ...tableCellInputStyle, fontSize: 10 }} />
                                </div>
                              </div>
                            );
                          })}
                          {/* Jummah rows — Fridays only */}
                          {isFriday && extraTimings.jummahSlots.some(Boolean) && (
                            <div style={{ display: "flex", gap: 8, padding: "6px 14px", borderTop: "1px solid var(--surface-mid)", background: "rgba(52,211,153,0.03)" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", width: 64, flexShrink: 0 }}>Jummah</span>
                              {extraTimings.jummahSlots.map((on, j) => on ? (
                                <div key={j} style={{ flex: 1 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", marginBottom: 2, textAlign: "center" }}>{j + 1}</div>
                                  <LocalInput value={d[`jummah_${j + 1}`] || ""} onCommit={v => handleEditCell(day.date, `jummah_${j + 1}`, formatTimeInput(v))} placeholder="—" className="" style={{ ...tableCellInputStyle, fontSize: 11, color: "var(--accent)", fontWeight: 700 }} />
                                </div>
                              ) : null)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                      <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center", width: compact ? 52 : 72 }}>Date</th>
                      {PRAYER_META.map((p) => (
                        <th key={p.key} colSpan={3 + extraCols[p.key].length}
                          style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center", borderLeft: "1px solid var(--surface-high)" }}>
                          {p.label}
                        </th>
                      ))}
                      {jummahCount > 0 && (
                        <th colSpan={jummahCount}
                          style={{ padding: thPx, fontSize: txtSz, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center", borderLeft: "1px solid var(--surface-high)" }}>
                          Jummah
                        </th>
                      )}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--surface-high)", background: "var(--surface-mid)" }}>
                      <th />
                      {PRAYER_META.map((p) => (
                        <React.Fragment key={p.key}>
                          <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-phantom)" }}>Start</th>
                          <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", color: "var(--text-phantom)" }}>Adhan</th>
                          <th style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", color: "var(--text-phantom)" }}>Iqama</th>
                          {extraCols[p.key].map(n => (
                            <th key={n} style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", color: "var(--text-phantom)" }}>{n} Jamaat</th>
                          ))}
                        </React.Fragment>
                      ))}
                      {extraTimings.jummahSlots.map((on, i) => on ? (
                        <th key={i} style={{ padding: thPx, fontSize: txtSz, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--surface-high)", color: "var(--text-phantom)" }}>
                          Khutbah {i + 1}
                        </th>
                      ) : null)}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, i) => {
                      const d = day as unknown as Record<string, string>;
                      const isFriday = new Date(day.date + "T12:00:00").getDay() === 5;
                      const isToday = day.date === todayStr;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--surface-mid)", background: isToday ? "rgba(52,211,153,0.05)" : i % 2 === 0 ? "var(--surface-low)" : "var(--surface)" }}>
                          <td style={{ padding: compact ? "5px 6px" : "6px 8px", fontWeight: 700, fontSize: txtSz, color: "var(--text-max)", textAlign: "center" }}>
                            {day.date.split("-").slice(1).join("/")}
                          </td>
                          {PRAYER_META.map((p) => {
                            const start = day[p.key] as string;
                            return (
                              <React.Fragment key={p.key}>
                                <td style={{ padding: tdPx, borderLeft: "1px solid var(--surface-mid)", fontWeight: 600, fontSize: txtSz, color: "var(--text-phantom)", textAlign: "center" }}>
                                  {to12h(start)}
                                </td>
                                <td style={{ padding: tdPx, textAlign: "center" }}>
                                  <LocalInput value={to12h(d[`${p.key}_adhan`] || "")} onCommit={v => handleEditCell(day.date, `${p.key}_adhan`, formatTimeInput(v))} placeholder="—" className="" style={tableCellInputStyle} />
                                </td>
                                <td style={{ padding: tdPx, textAlign: "center" }}>
                                  <LocalInput value={to12h(d[`${p.key}_iqama`] || "")} onCommit={v => handleEditCell(day.date, `${p.key}_iqama`, formatTimeInput(v))} placeholder="—" className="" style={tableCellInputStyle} />
                                </td>
                                {extraCols[p.key].map((n) => {
                                  const field = `${p.key}_iqama_${n === "2nd" ? 2 : 3}`;
                                  return (
                                    <td key={n} style={{ padding: tdPx, textAlign: "center" }}>
                                      <LocalInput value={to12h(d[field] || "")} onCommit={v => handleEditCell(day.date, field, formatTimeInput(v))} placeholder="—" className="" style={tableCellInputStyle} />
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                          {extraTimings.jummahSlots.map((on, j) => on ? (() => {
                            const field = `jummah_${j + 1}`;
                            const val = d[field] || "";
                            return (
                              <td key={j} style={{ padding: tdPx, borderLeft: "1px solid var(--surface-mid)" }}>
                                {isFriday ? (
                                  <LocalInput value={to12h(val)} onCommit={v => handleEditCell(day.date, field, formatTimeInput(v))} placeholder="—" className="" style={{ ...tableCellInputStyle, color: "var(--accent)", fontWeight: 700 }} />
                                ) : null}
                              </td>
                            );
                          })() : null)}
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
            style={{ width: "100%", background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "6px 10px", fontSize: 12, color: "var(--text-max)", fontFamily: "Manrope, sans-serif", outline: "none", appearance: "none" }}
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
          <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.88)" }}>
            <div style={{ width: "100%", maxWidth: "64rem", background: "var(--surface-low)", border: "1px solid var(--surface-mid)", borderRadius: 2, boxShadow: "0 25px 60px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", overflow: "hidden", height: "90vh" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 28px", borderBottom: "1px solid var(--surface-high)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 2, background: "var(--accent-bg)", border: "1px solid var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent)" }}>upload_file</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-max)", margin: 0, letterSpacing: "-0.02em" }}>Map Columns</h2>
                  <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2, marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadFile?.name}</p>
                </div>
                {xlsxPreview.sheets.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--surface-low)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 3 }}>
                    {xlsxPreview.sheets.map(s => (
                      <button key={s} onClick={() => {
                        const newRows = xlsxPreview.sheetRows[s];
                        const keywords = ["fajr","dhuhr","zuhr","asr","maghrib","isha","date","day"];
                        const hi = newRows.findIndex(r => r.some(c => keywords.some(k => String(c ?? "").toLowerCase().includes(k))));
                        setXlsxPreview(p => p ? { ...p, selectedSheet: s, headerRowIdx: Math.max(0, hi) } : p);
                        if (hi >= 0) autoMapColumns(newRows[hi].map(h => String(h ?? "").trim()));
                      }} style={{
                        padding: "5px 12px", borderRadius: 2, fontSize: 12, fontWeight: 700, fontFamily: "Manrope, sans-serif", cursor: "pointer", transition: "all 0.15s",
                        background: xlsxPreview.selectedSheet === s ? "var(--accent-bg)" : "transparent",
                        border: xlsxPreview.selectedSheet === s ? "1px solid var(--accent-border)" : "1px solid transparent",
                        color: xlsxPreview.selectedSheet === s ? "var(--accent)" : "var(--text-ghost)",
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>Header row</span>
                  <input type="number" min={1} max={rows.length}
                    value={xlsxPreview.headerRowIdx + 1}
                    onChange={e => {
                      const idx = Math.max(0, parseInt(e.target.value) - 1);
                      setXlsxPreview(p => p ? { ...p, headerRowIdx: idx } : p);
                      autoMapColumns((rows[idx] ?? []).map(h => String(h ?? "").trim()));
                    }}
                    style={{ width: 52, background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, padding: "5px 8px", fontSize: 13, color: "var(--text-max)", textAlign: "center", outline: "none", fontFamily: "Manrope, sans-serif" }}
                  />
                </div>
                <button onClick={() => { setXlsxPreview(null); }} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, color: "var(--text-ghost)", background: "transparent", border: "1px solid var(--surface-high)", cursor: "pointer", flexShrink: 0 }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

                {/* Top half: data preview */}
                <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--surface-high)", flex: "0 0 40%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px 6px", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)" }}>Data Preview</span>
                    <span style={{ fontSize: 10, color: "var(--text-phantom)", fontWeight: 600 }}>· first 5 rows after header</span>
                  </div>
                  {headers.length > 0 ? (
                    <div style={{ overflow: "auto", flex: 1, padding: "0 16px 14px" }}>
                      <table style={{ fontSize: 11, borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
                        <thead>
                          <tr>
                            {headers.map((h, i) => {
                              const label = colLabel(h);
                              return (
                                <th key={i} style={{
                                  padding: "7px 14px", textAlign: "left", whiteSpace: "nowrap",
                                  borderBottom: label ? "1px solid var(--accent-bg)" : "1px solid var(--surface-high)",
                                  background: label ? "var(--accent-bg)" : "transparent",
                                }}>
                                  <div style={{ fontWeight: 700, color: label ? "var(--accent)" : "var(--text-ghost)" }}>{h}</div>
                                  {label && <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2, opacity: 0.7, color: "var(--accent)" }}>{label}</div>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--surface-low)" : "var(--surface)" }}>
                              {headers.map((h, ci) => (
                                <td key={ci} style={{ padding: "5px 14px", whiteSpace: "nowrap", borderBottom: "1px solid var(--surface-mid)", color: mappedSet.has(h) ? "var(--text-max)" : "var(--text-phantom)", fontWeight: mappedSet.has(h) ? 600 : 400 }}>
                                  {String(row[ci] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-ghost)", fontSize: 13, padding: "0 24px" }}>
                      No headers found at row {xlsxPreview.headerRowIdx + 1} — try a different header row number.
                    </div>
                  )}
                </div>

                {/* Bottom half: column mapping */}
                <div style={{ flex: 1, padding: "14px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>

                  {/* Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                    <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 4, height: 12, borderRadius: 2, background: "rgba(96,165,250,0.5)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-max)" }}>Date</span>
                    </div>
                    <div style={{ width: 200 }}>{sel("date")}</div>
                    <span style={{ fontSize: 10, color: "var(--text-phantom)", fontWeight: 600 }}>YYYY-MM-DD · DD/MM/YYYY · Excel serial</span>
                  </div>

                  <div style={{ borderTop: "1px solid var(--surface-high)", marginBottom: 10 }} />

                  {/* Prayer rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    <div style={{ display: "grid", gap: 10, alignItems: "center", marginBottom: 4, gridTemplateColumns: "90px 1fr 1fr" }}>
                      <div />
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center" }}>Adhan / Start</div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", textAlign: "center" }}>Iqama</div>
                    </div>
                    {PRAYER_ROWS.map(p => (
                      <div key={p.key} style={{ display: "grid", gap: 10, alignItems: "center", gridTemplateColumns: "90px 1fr 1fr" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-max)", lineHeight: 1.2 }}>{p.label}</div>
                          </div>
                        </div>
                        {sel(p.key)}
                        {sel(p.iqama)}
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid var(--surface-high)", marginBottom: 10 }} />

                  {/* Jummah */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 4, height: 12, borderRadius: 2, background: "rgba(251,191,36,0.4)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-max)" }}>Jummah</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, flex: 1 }}>
                      {JUMMAH_FIELDS.map(f => (
                        <div key={f.key} style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginBottom: 4, display: "block" }}>{f.label}</label>
                          {sel(f.key)}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 28px", borderTop: "1px solid var(--surface-high)" }}>
                {uploadError
                  ? <p style={{ color: "#f87171", fontSize: 13, fontWeight: 600, flex: 1, margin: 0 }}>{uploadError}</p>
                  : <p style={{ color: "var(--text-ghost)", fontSize: 11, flex: 1, margin: 0 }}>Highlighted columns will be imported. Unmapped prayers use auto-calculated defaults.</p>
                }
                <button onClick={() => { setXlsxPreview(null); }} style={{ padding: "8px 18px", borderRadius: 2, fontWeight: 600, fontSize: 13, fontFamily: "Manrope, sans-serif", border: "1px solid var(--outline-variant)", color: "var(--text-ghost)", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                  Cancel
                </button>
                <button onClick={handleConfirmImport} disabled={isUploading || !colMap.date}
                  style={{
                    padding: "8px 26px", borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: "Manrope, sans-serif", cursor: isUploading || !colMap.date ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
                    background: isUploading || !colMap.date ? "var(--surface-low)" : "var(--accent)",
                    border: isUploading || !colMap.date ? "1px solid var(--surface-mid)" : "1px solid var(--accent)",
                    color: isUploading || !colMap.date ? "var(--outline)" : "var(--accent-text)",
                  }}>
                  {isUploading
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Importing…</>
                    : <>Import <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
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
