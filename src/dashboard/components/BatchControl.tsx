import React from "react";
import type { BatchCell } from "../types";
import LocalInput from "./LocalInput";
import { formatTimeInput } from "../utils";

const BatchControl = React.memo(({ cell, onUpdate, placeholder = "6:00 AM", accentBg: _accentBg, accent: _accent }: {
  cell: BatchCell;
  onUpdate: (p: Partial<BatchCell>) => void;
  placeholder?: string;
  accentBg: string;
  accent: string;
}) => {
  const [mode, setMode] = React.useState(cell.mode);
  React.useEffect(() => { setMode(cell.mode); }, [cell.mode]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", background: "var(--surface-high)",
    border: "1px solid var(--outline)", borderRadius: 2, color: "#ffffff",
    fontFamily: "Manrope, sans-serif", fontSize: 14, fontWeight: 700,
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", overflow: "hidden", border: "1px solid var(--outline-variant)", borderRadius: 2, width: "fit-content" }}>
        {([{ v: "offset", label: "+Min" }, { v: "fixed", label: "Fixed" }] as const).map(m => (
          <button key={m.v} onClick={() => { setMode(m.v); onUpdate({ mode: m.v }); }}
            style={{ padding: "3px 8px", fontSize: 10, fontWeight: 700, fontFamily: "Manrope, sans-serif", cursor: "pointer", border: "none", background: mode === m.v ? "var(--surface-high)" : "var(--bg)", color: mode === m.v ? "var(--on-surface)" : "var(--text-phantom)", transition: "all 0.1s" }}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === "offset" ? (
        <LocalInput value={String(cell.offset)}
          onCommit={v => { const n = parseInt(v); onUpdate({ offset: isNaN(n) || n < 0 ? 0 : n }); }}
          placeholder="15" style={inp} />
      ) : (
        <LocalInput value={cell.fixed} onCommit={v => onUpdate({ fixed: formatTimeInput(v) })} placeholder={placeholder}
          style={inp} />
      )}
    </div>
  );
});

export default BatchControl;
