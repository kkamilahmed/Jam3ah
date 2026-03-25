import React from "react";
import type { BatchCell } from "../types";
import LocalInput from "./LocalInput";
import { formatTimeInput } from "../utils";

const BatchControl = React.memo(({ cell, onUpdate, placeholder = "6:00 AM", accentBg, accent }: {
  cell: BatchCell;
  onUpdate: (p: Partial<BatchCell>) => void;
  placeholder?: string;
  accentBg: string;
  accent: string;
}) => {
  const [mode, setMode] = React.useState(cell.mode);
  React.useEffect(() => { setMode(cell.mode); }, [cell.mode]);
  return (
    <div className="space-y-1.5">
      <div className="flex rounded-md overflow-hidden border border-white/8 w-fit text-[10px] font-black">
        {([{ v: "offset", label: "+Min" }, { v: "fixed", label: "Fixed" }] as const).map(m => (
          <button key={m.v} onClick={() => { setMode(m.v); onUpdate({ mode: m.v }); }}
            className={`px-2 py-0.5 transition-all ${mode === m.v ? `${accentBg} ${accent}` : "text-zinc-600 hover:text-zinc-300 bg-zinc-800/60"}`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === "offset" ? (
        <LocalInput
          value={String(cell.offset)}
          onCommit={v => { const n = parseInt(v); onUpdate({ offset: isNaN(n) || n < 0 ? 0 : n }); }}
          placeholder="15"
          className="w-24 bg-zinc-800/60 border border-white/10 rounded-md px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-white/30 [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <LocalInput value={cell.fixed} onCommit={v => onUpdate({ fixed: formatTimeInput(v) })} placeholder={placeholder}
          className="w-24 bg-zinc-800/60 border border-white/10 rounded-md px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-white/30" />
      )}
    </div>
  );
});

export default BatchControl;
