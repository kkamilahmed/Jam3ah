import React, { useEffect } from "react";
import useIsMobile from "../../hooks/useIsMobile";

export type ToastKind = "success" | "error";

export interface ToastState {
  message: string;
  kind: ToastKind;
  /** Bumped on every showToast call so repeat messages re-trigger the timer. */
  id: number;
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const DURATION = 3000;

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, DURATION);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.kind === "error";
  const accent = isError ? "#f87171" : "var(--accent)";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        // Clear the 60px mobile bottom tab bar.
        bottom: isMobile ? 72 : 24,
        right: isMobile ? 16 : 24,
        left: isMobile ? 16 : "auto",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "var(--surface-high)",
        border: "1px solid var(--outline-variant)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 2,
        fontFamily: "Manrope, sans-serif",
        animation: "toast-in 0.2s ease",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17, color: accent, flexShrink: 0 }}>
        {isError ? "error" : "check_circle"}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-max)" }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          display: "flex",
          alignItems: "center",
          marginLeft: "auto",
          padding: 0,
          background: "none",
          border: "none",
          color: "var(--text-phantom)",
          cursor: "pointer",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
      </button>
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default Toast;
