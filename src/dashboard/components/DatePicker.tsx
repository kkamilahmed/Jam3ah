import React from "react";

const DatePicker: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; align?: "left" | "right"; fullWidth?: boolean }> =
  ({ value, onChange, placeholder = "Pick a date", align = "left", fullWidth = false }) => {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = React.useState(() => parsed ? parsed.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = React.useState(() => parsed ? parsed.getMonth() : new Date().getMonth());
  React.useEffect(() => {
    if (value) { setViewYear(parseInt(value.slice(0, 4))); setViewMonth(parseInt(value.slice(5, 7)) - 1); }
  }, [value]);
  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const dayStr = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);
  const label = parsed ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : placeholder;
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 bg-black/40 border-2 border-white/10 rounded-xl px-4 py-3 text-sm font-medium hover:border-white/20 transition-colors focus:outline-none ${fullWidth ? "w-full" : ""}`}>
        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
        <span className={value ? "text-white" : "text-zinc-500"}>{label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div className={`absolute top-full mt-2 z-[81] bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl w-60 ${align === "right" ? "right-0" : "left-0"}`}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-xs font-black">‹</button>
              <span className="text-sm font-black text-white">{new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-xs font-black">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-zinc-600 py-0.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                const ds = day ? dayStr(day) : "";
                const sel = ds === value;
                const tod = ds === today;
                return (
                  <button key={idx} disabled={!day} onClick={() => { if (day) { onChange(ds); setOpen(false); } }}
                    className={`h-8 w-full rounded-lg text-xs font-bold transition-all ${
                      !day ? "invisible" :
                      sel ? "bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20" :
                      tod ? "border border-emerald-500/40 text-emerald-400 font-black hover:bg-emerald-500/10" :
                      "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}>{day}</button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatePicker;
