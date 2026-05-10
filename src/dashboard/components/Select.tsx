import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, disabled, className = "", style }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    reposition();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const triggerStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: "var(--surface-low)",
    border: `1px solid ${open ? "var(--outline)" : "var(--outline-variant)"}`,
    borderRadius: 2, textAlign: "left", fontFamily: "Manrope, sans-serif",
    fontSize: 13, fontWeight: 500, color: disabled ? "var(--outline)" : "var(--on-surface)",
    cursor: disabled ? "not-allowed" : "pointer", display: "flex",
    alignItems: "center", justifyContent: "space-between", gap: 8,
    outline: "none", transition: "border-color 0.15s", opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <div className={className} style={{ position: "relative" }}>
      <button ref={triggerRef} type="button" disabled={disabled} onClick={openDropdown} style={triggerStyle}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.label ?? "—"}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-phantom)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>expand_more</span>
      </button>

      {open && createPortal(
        <div ref={dropdownRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", overflow: "hidden" }}>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {options.map(opt => (
              <button key={opt.value} type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{ width: "100%", padding: "9px 12px", textAlign: "left", fontSize: 13, fontFamily: "Manrope, sans-serif", fontWeight: opt.value === value ? 600 : 500, color: opt.value === value ? "var(--on-surface)" : "var(--text-faint)", background: opt.value === value ? "var(--surface-mid)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", transition: "background 0.1s, color 0.1s" }}
                onMouseEnter={e => { if (opt.value !== value) { (e.currentTarget as HTMLElement).style.background = "var(--accent-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; } }}
                onMouseLeave={e => { if (opt.value !== value) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-faint)"; } }}>
                <span>{opt.label}</span>
                {opt.value === value && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text-ghost)" }}>check</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Select;
