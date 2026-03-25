import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, disabled, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    reposition();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      // Don't close when scrolling inside the dropdown list itself
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

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={`w-full px-4 py-3 bg-zinc-900 border-2 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 outline-none
          ${disabled ? "opacity-40 cursor-not-allowed border-white/10 text-zinc-500" : "border-white/10 text-white hover:border-white/20 cursor-pointer"}
          ${open ? "border-white/25" : ""}
        `}>
        <span className="truncate">{selected?.label ?? "—"}</span>
        <svg className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2
                  ${opt.value === value
                    ? "bg-white/[0.06] text-white font-bold"
                    : "text-zinc-300 hover:bg-white/[0.04] hover:text-white font-medium"
                  }`}>
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
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
