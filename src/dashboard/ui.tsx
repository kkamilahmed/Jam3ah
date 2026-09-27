import React, { useEffect, useId, useRef } from "react";

export const Icon: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`} style={size ? { fontSize: size } : undefined}>
    {name}
  </span>
);

export const Spinner: React.FC = () => <span className="d-spinner" aria-hidden="true" />;

interface ModalProps {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "normal" | "wide" | "xwide";
}

export const Modal: React.FC<ModalProps> = ({ title, subtitle, onClose, children, footer, size = "normal" }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
    first?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="d-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`d-modal${size === "wide" ? " d-modal--wide" : size === "xwide" ? " d-modal--xwide" : ""}`}
      >
        <div className="d-modal-head">
          <div className="d-stack" style={{ gap: 6, flex: 1 }}>
            <h2 id={titleId} className="d-h2">{title}</h2>
            {subtitle && <p className="d-sub" style={{ fontSize: 17 }}>{subtitle}</p>}
          </div>
          <button type="button" data-close className="d-btn d-btn--ghost d-btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="d-modal-body">{children}</div>
        {footer && <div className="d-modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({
  checked, onChange, label, disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="d-switch"
    onClick={() => onChange(!checked)}
  />
);

export const ToggleRow: React.FC<{
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ title, body, checked, onChange, disabled }) => (
  <div className="d-toggle-row" style={disabled ? { opacity: 0.55 } : undefined}>
    <div className="d-stack" style={{ gap: 4, flex: 1 }}>
      <span className="d-strong" style={{ fontSize: 18 }}>{title}</span>
      <span className="d-muted" style={{ fontSize: 16 }}>{body}</span>
    </div>
    <span className="d-toggle-state">{checked ? "On" : "Off"}</span>
    <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
  </div>
);

// A large radio option. Only the title and description name the radio; fields inside the card
// (for example a minutes box) have their own labels. Clicking anywhere on the card selects it.
export const Choice: React.FC<{
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ name, checked, onSelect, title, body, children }) => {
  const id = useId();
  return (
    <div className={`d-choice${checked ? " is-selected" : ""}`} onClick={() => { if (!checked) onSelect(); }}>
      <input id={id} type="radio" name={name} checked={checked} onChange={onSelect} aria-describedby={body ? `${id}-body` : undefined} />
      <div className="d-stack" style={{ gap: 8, flex: 1, minWidth: 0 }}>
        <label htmlFor={id} className="d-choice-title">{title}</label>
        {body && <span id={`${id}-body`} className="d-choice-body">{body}</span>}
        {children}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, body, confirmLabel, danger, busy, onConfirm, onCancel }) => (
  <Modal
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button type="button" className="d-btn d-btn--secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={`d-btn ${danger ? "d-btn--danger" : "d-btn--primary"}`} onClick={onConfirm} disabled={busy}>
          {busy && <Spinner />}
          {confirmLabel}
        </button>
      </>
    }
  >
    <div style={{ fontSize: 18, lineHeight: 1.55 }}>{body}</div>
  </Modal>
);

export type ToastState = { message: string; kind: "ok" | "error" } | null;

export const Toast: React.FC<{ toast: ToastState }> = ({ toast }) =>
  toast ? (
    <div role="status" aria-live="polite" className={`d-toast${toast.kind === "error" ? " d-toast--error" : ""}`}>
      <Icon name={toast.kind === "error" ? "error" : "check_circle"} />
      {toast.message}
    </div>
  ) : null;

export const ThemeToggle: React.FC<{ dark: boolean; onToggle: () => void }> = ({ dark, onToggle }) => (
  <button type="button" className="d-btn d-btn--ghost d-btn--icon" onClick={onToggle} aria-label={dark ? "Use light colours" : "Use dark colours"}>
    <Icon name={dark ? "light_mode" : "dark_mode"} />
  </button>
);
