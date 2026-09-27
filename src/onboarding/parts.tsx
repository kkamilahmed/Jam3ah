import React, { useEffect, useRef, useState } from "react";
import { Icon, Spinner } from "../dashboard/ui";
import { fmt12, parseTypedTime } from "../dashboard/time";

// Title block for a step: "Step 2 of 5" with a progress bar, then the heading.
// The heading takes focus when the step appears so screen readers announce it.
export const StepHeader: React.FC<{
  step?: { index: number; total: number; name: string };
  title: string;
  sub?: React.ReactNode;
}> = ({ step, title, sub }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="d-stack" style={{ gap: 18 }}>
      {step && (
        <div className="wz-progress">
          <span className="wz-progress-label">Step {step.index} of {step.total} <span>· {step.name}</span></span>
          <ol className="wz-progress-bar" aria-hidden="true">
            {Array.from({ length: step.total }, (_, i) => (
              <li key={i} className={i + 1 < step.index ? "is-done" : i + 1 === step.index ? "is-current" : ""} />
            ))}
          </ol>
        </div>
      )}
      <div className="d-stack" style={{ gap: 8 }}>
        <h1 ref={ref} tabIndex={-1} className="d-h1 wz-title">{title}</h1>
        {sub && <p className="d-sub">{sub}</p>}
      </div>
    </div>
  );
};

export const WizardNav: React.FC<{
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  hint?: string;
}> = ({ onBack, onNext, nextLabel = "Continue", nextDisabled, busy, busyLabel, hint }) => (
  <div className="wz-nav">
    {onBack && (
      <button type="button" className="d-btn d-btn--secondary" onClick={onBack} disabled={busy}>
        <Icon name="arrow_back" />Back
      </button>
    )}
    {hint && <span className="wz-nav-hint">{hint}</span>}
    <button type="button" className="d-btn d-btn--primary" onClick={onNext} disabled={nextDisabled || busy}>
      {busy && <Spinner />}
      {busy ? busyLabel ?? nextLabel : nextLabel}
      {!busy && <Icon name="arrow_forward" />}
    </button>
  </div>
);

// A time box that reads what people type ("130pm", "1:30 PM", "13:30") when they leave it.
// Calls onChange with "1:30 PM", or "" when the box is empty, or null when it can't be read.
export const TimeInput: React.FC<{
  id?: string;
  value: string;
  onChange: (v: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}> = ({ id, value, onChange, label, placeholder = "e.g. 1:30 PM", className = "", invalid }) => {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) { setPrev(value); setText(value); }
  return (
    <input
      id={id}
      className={`d-input ${className}`}
      aria-label={label}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={() => {
        if (!text.trim()) { onChange(""); return; }
        const m = parseTypedTime(text);
        if (m === null) { onChange(null); return; }
        setText(fmt12(m));
        onChange(fmt12(m));
      }}
    />
  );
};

export const SelectField: React.FC<{
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  help?: string;
  disabled?: boolean;
}> = ({ id, label, value, options, onChange, help, disabled }) => (
  <div className="d-field">
    <label className="d-label" htmlFor={id}>{label}</label>
    <select id={id} className="d-select" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {help && <p className="d-help">{help}</p>}
  </div>
);

// A "show more" link that reveals extra settings underneath.
export const Disclosure: React.FC<{ label: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = React.useId();
  return (
    <div className="d-stack" style={{ gap: 16 }}>
      <button type="button" className="wz-disclosure" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)} style={{ alignSelf: "flex-start" }}>
        <Icon name="chevron_right" />{label}
      </button>
      {open && <div id={id} className="d-stack" style={{ gap: 20 }}>{children}</div>}
    </div>
  );
};
