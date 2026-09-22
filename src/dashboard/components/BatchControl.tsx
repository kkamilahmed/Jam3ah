import React from "react";
import type { BatchCell } from "../types";
import LocalInput from "./LocalInput";
import { formatTimeInput } from "../utils";

const BatchControl = React.memo(({ cell, onUpdate, placeholder = "6:00 AM", defaultPeriod, allowOffset = true, offsetHint = "Minutes after the calculated start time", accentBg: _accentBg, accent: _accent }: {
  cell: BatchCell;
  onUpdate: (p: Partial<BatchCell>) => void;
  placeholder?: string;
  defaultPeriod?: "AM" | "PM";
  // When false, there's no base time to offset from (e.g. an adhan in the manual
  // flow), so only "Fixed" is offered — avoids offsets that silently do nothing.
  allowOffset?: boolean;
  offsetHint?: string;
  accentBg: string;
  accent: string;
}) => {
  const [mode, setMode] = React.useState(cell.mode);
  React.useEffect(() => { setMode(cell.mode); }, [cell.mode]);
  // Force Fixed when offset isn't meaningful, even if a stale offset mode was stored.
  const effMode = allowOffset ? mode : "fixed";
  React.useEffect(() => { if (!allowOffset && cell.mode === "offset") onUpdate({ mode: "fixed" }); }, [allowOffset, cell.mode, onUpdate]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", background: "var(--surface-high)",
    border: "1px solid var(--outline)", borderRadius: 2, color: "#ffffff",
    fontFamily: "Manrope, sans-serif", fontSize: 14, fontWeight: 700,
    outline: "none",
  };

  const modes: { v: "offset" | "fixed"; label: string }[] = allowOffset
    ? [{ v: "offset", label: "Offset" }, { v: "fixed", label: "Fixed" }]
    : [{ v: "fixed", label: "Fixed" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", overflow: "hidden", border: "1px solid var(--outline-variant)", borderRadius: 2, width: "fit-content" }}>
        {modes.map(m => (
          <button key={m.v} onClick={() => { setMode(m.v); onUpdate({ mode: m.v }); }}
            style={{ padding: "3px 8px", fontSize: 10, fontWeight: 700, fontFamily: "Manrope, sans-serif", cursor: "pointer", border: "none", background: effMode === m.v ? "var(--surface-high)" : "var(--bg)", color: effMode === m.v ? "var(--on-surface)" : "var(--text-phantom)", transition: "all 0.1s" }}>
            {m.label}
          </button>
        ))}
      </div>
      {effMode === "offset" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LocalInput value={String(cell.offset)}
              onCommit={v => { const n = parseInt(v); onUpdate({ offset: isNaN(n) || n < 0 ? 0 : n }); }}
              placeholder="15" style={inp} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", whiteSpace: "nowrap" }}>min</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-ghost)", lineHeight: 1.3 }}>{offsetHint}</span>
        </>
      ) : (
        <>
          <LocalInput value={cell.fixed} onCommit={v => onUpdate({ fixed: formatTimeInput(v, defaultPeriod) })} placeholder={placeholder}
            style={inp} />
          <span style={{ fontSize: 10, color: "var(--text-ghost)", lineHeight: 1.3 }}>Same clock time every day</span>
        </>
      )}
    </div>
  );
});

export default BatchControl;
