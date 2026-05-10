import React from "react";

const DatePicker: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; align?: "left" | "right"; fullWidth?: boolean; rangeStart?: string }> =
  ({ value, onChange, placeholder = "Pick a date", align = "left", fullWidth = false, rangeStart }) => {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
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

  const btnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
    background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2,
    color: value ? "var(--on-surface)" : "var(--text-phantom)", fontFamily: "Manrope, sans-serif",
    fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none",
    width: fullWidth ? "100%" : "auto", transition: "border-color 0.15s", textAlign: "left",
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={btnStyle}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-phantom)", flexShrink: 0 }}>calendar_month</span>
        <span>{label}</span>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 80 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", zIndex: 81,
            background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 2,
            padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", width: 240,
            ...(align === "right" ? { right: 0 } : { left: 0 }),
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={prevMonth} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--text-ghost)", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                {new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={nextMonth} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--text-ghost)", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--outline-variant)", padding: "2px 0", fontFamily: "Manrope, sans-serif" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((day, idx) => {
                const ds = day ? dayStr(day) : "";
                const sel = ds === value;
                const tod = ds === today;
                const rangeEnd = hovered || value;
                const inRange = !!(rangeStart && rangeEnd && ds && ds > rangeStart && ds < rangeEnd);
                const isRangeStart = !!(rangeStart && ds === rangeStart);
                return (
                  <button key={idx} disabled={!day} onClick={() => { if (day) { onChange(ds); setOpen(false); } }}
                    onMouseEnter={() => { if (day) setHovered(ds); }}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      height: 30, border: "1px solid transparent", borderRadius: 2, fontSize: 12,
                      fontWeight: sel || isRangeStart ? 700 : 500, fontFamily: "Manrope, sans-serif", cursor: day ? "pointer" : "default",
                      visibility: day ? "visible" : "hidden",
                      background: sel ? "var(--accent)" : isRangeStart ? "var(--accent-bg)" : inRange ? "var(--accent-bg)" : tod ? "var(--surface-highest)" : hovered === ds ? "var(--surface-high)" : "transparent",
                      color: sel ? "var(--accent-text)" : inRange || isRangeStart ? "var(--accent)" : tod ? "var(--text-max)" : "var(--text-ghost)",
                      borderColor: inRange || isRangeStart ? "var(--accent-border)" : tod && !sel ? "var(--outline)" : "transparent",
                      transition: "all 0.1s",
                    }}
                  >{day}</button>
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
