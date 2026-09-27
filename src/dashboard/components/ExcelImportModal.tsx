import React from "react";
import { Modal, Spinner } from "../ui";

export interface XlsxPreview {
  sheets: string[];
  sheetRows: Record<string, string[][]>;
  selectedSheet: string;
  headerRowIdx: number;
}

interface ExcelImportModalProps {
  fileName: string;
  preview: XlsxPreview;
  setPreview: React.Dispatch<React.SetStateAction<XlsxPreview | null>>;
  colMap: Record<string, string>;
  setColMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  autoMapColumns: (headers: string[]) => void;
  onImport: () => void;
  importing: boolean;
  error: string;
}

const HEADER_KEYWORDS = ["fajr", "dhuhr", "zuhr", "asr", "maghrib", "isha", "date", "day"];

const PRAYER_ROWS = [
  { key: "fajr", label: "Fajr", iqama: "fajr_iqama" },
  { key: "dhuhr", label: "Dhuhr", iqama: "dhuhr_iqama" },
  { key: "asr", label: "Asr", iqama: "asr_iqama" },
  { key: "maghrib", label: "Maghrib", iqama: "maghrib_iqama" },
  { key: "isha", label: "Isha", iqama: "isha_iqama" },
];

const FIELD_LABELS: Record<string, string> = {
  date: "Date", day: "Day number", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
  fajr_iqama: "Fajr iqama", dhuhr_iqama: "Dhuhr iqama", asr_iqama: "Asr iqama", maghrib_iqama: "Maghrib iqama",
  isha_iqama: "Isha iqama", jummah1: "Jumu'ah 1", jummah2: "Jumu'ah 2", jummah3: "Jumu'ah 3",
};

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  fileName, preview, setPreview, colMap, setColMap, autoMapColumns, onImport, importing, error,
}) => {
  const rows = preview.sheetRows[preview.selectedSheet] ?? [];
  const headers = rows[preview.headerRowIdx]?.map(h => String(h ?? "").trim()) ?? [];
  const previewRows = rows.slice(preview.headerRowIdx + 1).filter(r => r.some(c => c)).slice(0, 4);
  const options = ["", ...headers.filter(Boolean)];
  const mapped = new Set(Object.values(colMap).filter(Boolean));
  const labelFor = (h: string) => {
    const hit = Object.entries(colMap).find(([, v]) => v === h);
    return hit ? FIELD_LABELS[hit[0]] ?? hit[0] : null;
  };

  const column = (key: string, label: string) => (
    <div className="d-field">
      <label className="d-label" htmlFor={`col-${key}`} style={{ fontSize: 16 }}>{label}</label>
      <select id={`col-${key}`} className="d-select" value={colMap[key] ?? ""} onChange={e => setColMap(m => ({ ...m, [key]: e.target.value }))}>
        {options.map(o => <option key={o} value={o}>{o || "Not in my file"}</option>)}
      </select>
    </div>
  );

  const pickSheet = (s: string) => {
    const sheetRows = preview.sheetRows[s];
    const hi = sheetRows.findIndex(r => r.some(c => HEADER_KEYWORDS.some(k => String(c ?? "").toLowerCase().includes(k))));
    setPreview(p => (p ? { ...p, selectedSheet: s, headerRowIdx: Math.max(0, hi) } : p));
    if (hi >= 0) autoMapColumns(sheetRows[hi].map(h => String(h ?? "").trim()));
  };

  return (
    <Modal
      size="xwide"
      title="Match your timetable's columns"
      subtitle={<>We read <strong>{fileName}</strong>. Check that each prayer points at the right column, then import.</>}
      onClose={() => setPreview(null)}
      footer={
        <>
          {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: "0 auto 0 0" }}>{error}</p>}
          <button type="button" className="d-btn d-btn--secondary" onClick={() => setPreview(null)} disabled={importing}>Cancel</button>
          <button type="button" className="d-btn d-btn--primary" onClick={onImport} disabled={importing || !colMap.date}>
            {importing && <Spinner />}
            Import these times
          </button>
        </>
      }
    >
      <div className="d-row d-row--wrap" style={{ gap: 20 }}>
        {preview.sheets.length > 1 && (
          <div className="d-field" style={{ minWidth: 220 }}>
            <label className="d-label" htmlFor="xl-sheet" style={{ fontSize: 16 }}>Sheet</label>
            <select id="xl-sheet" className="d-select" value={preview.selectedSheet} onChange={e => pickSheet(e.target.value)}>
              {preview.sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="d-field" style={{ width: 200 }}>
          <label className="d-label" htmlFor="xl-header" style={{ fontSize: 16 }}>Headings are on row</label>
          <input
            id="xl-header"
            type="number"
            className="d-input"
            min={1}
            max={rows.length}
            value={preview.headerRowIdx + 1}
            onChange={e => {
              const idx = Math.max(0, parseInt(e.target.value || "1", 10) - 1);
              setPreview(p => (p ? { ...p, headerRowIdx: idx } : p));
              autoMapColumns((rows[idx] ?? []).map(h => String(h ?? "").trim()));
            }}
          />
        </div>
      </div>

      <div className="d-card d-card--clip" style={{ overflowX: "auto" }}>
        {headers.length ? (
          <table className="d-mtable" style={{ minWidth: "100%", width: "max-content" }}>
            <thead>
              <tr>
                {headers.map((h, i) => {
                  const l = labelFor(h);
                  return (
                    <th key={i} style={{ position: "static", background: l ? "var(--d-accent-soft)" : undefined, textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 15 }}>{h || "—"}</span>
                      {l && <span className="d-small" style={{ color: "var(--d-accent-soft-text)" }}>{l}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, ri) => (
                <tr key={ri}>
                  {headers.map((h, ci) => (
                    <td key={ci} style={{ textAlign: "left", color: mapped.has(h) ? "var(--d-text)" : "var(--d-text-3)", fontSize: 15 }}>{String(r[ci] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="d-muted" style={{ padding: 20, margin: 0 }}>No headings found on row {preview.headerRowIdx + 1}. Try a different row number.</p>
        )}
      </div>

      <div className="d-grid-3">{column("date", "Date column")}</div>
      <div className="d-stack" style={{ gap: 12 }}>
        {PRAYER_ROWS.map(p => (
          <div key={p.key} className="d-grid-3" style={{ alignItems: "end" }}>
            <span className="d-h3" style={{ paddingBottom: 12 }}>{p.label}</span>
            {column(p.key, "Adhan or start time")}
            {column(p.iqama, "Iqama time")}
          </div>
        ))}
      </div>
      <div className="d-grid-3">
        {column("jummah1", "Jumu'ah, 1st khutbah")}
        {column("jummah2", "Jumu'ah, 2nd khutbah")}
        {column("jummah3", "Jumu'ah, 3rd khutbah")}
      </div>
      <p className="d-help">Any iqama column you leave out is filled in automatically (30 minutes after adhan, 3 minutes for Maghrib). You can change it afterwards.</p>
    </Modal>
  );
};

export default ExcelImportModal;
