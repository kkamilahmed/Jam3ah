import React, { useCallback, useEffect, useMemo, useState } from "react";

// A short guided tour of the dashboard. Rendered inside the dashboard so it uses its colours and type.

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  tab?: string;
}

interface Props {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const CARD_W = 380;
const GAP = 16;
const SPOT_PAD = 6;

const TutorialOverlay: React.FC<Props> = ({ onClose, setActiveTab }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = useMemo((): TourStep[] => [
    {
      target: null,
      title: "Assalamu alaikum",
      description: "This is where you look after your masjid's prayer times, announcements and events. This short tour takes about a minute.",
    },
    {
      target: "[data-tour='nav-tabs']",
      title: "Moving around",
      description: "Use these buttons to move between pages. Home is where you start each time.",
      tab: "overview",
    },
    {
      target: "[data-tour='tab-overview']",
      title: "Home",
      description: "Today's prayer times. Press Change next to any iqama to update it. The TV screen and the app follow automatically.",
      tab: "overview",
    },
    {
      target: "[data-tour='tab-prayer-times']",
      title: "Prayer times",
      description: "Decide when iqama happens for each prayer, see the whole month, change a single day, or plan changes ahead.",
      tab: "prayer-times",
    },
    {
      target: "[data-tour='tab-events']",
      title: "Announcements & events",
      description: "Post a message or add an event. It appears on the TV screen and in the app.",
      tab: "events",
    },
    {
      target: "[data-tour='tab-settings']",
      title: "Settings",
      description: "Your masjid's details, where it is on the map, and how adhan times are worked out.",
      tab: "settings",
    },
    {
      target: "[data-tour='tour-btn']",
      title: "Need this again?",
      description: "Press this question mark any time to see the tour again.",
      tab: "overview",
    },
  ], []);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const measure = useCallback(() => {
    const el = current.target ? document.querySelector(current.target) : null;
    const r = el?.getBoundingClientRect();
    // Hidden targets (for example the top menu on a phone) fall back to a centred card.
    setRect(r && r.width > 0 && r.height > 0 ? r : null);
  }, [current.target]);

  useEffect(() => {
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [measure]);

  const go = useCallback((next: number) => {
    const s = steps[next];
    if (s.tab) setActiveTab(s.tab);
    setStep(next);
  }, [steps, setActiveTab]);

  const goNext = useCallback(() => (isLast ? onClose() : go(step + 1)), [isLast, onClose, go, step]);
  const goPrev = useCallback(() => { if (step > 0) go(step - 1); }, [step, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  const width = Math.min(CARD_W, window.innerWidth - 32);
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    const cx = rect.left + rect.width / 2;
    const left = Math.min(Math.max(cx - width / 2, 16), window.innerWidth - width - 16);
    const below = rect.bottom + GAP + 260 < window.innerHeight;
    cardStyle = below ? { top: rect.bottom + GAP, left } : { bottom: window.innerHeight - rect.top + GAP, left };
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      <div style={{ position: "fixed", inset: 0, zIndex: 9990 }} onClick={onClose} />
      {rect ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: rect.top - SPOT_PAD,
            left: rect.left - SPOT_PAD,
            width: rect.width + SPOT_PAD * 2,
            height: rect.height + SPOT_PAD * 2,
            borderRadius: "var(--d-r-btn)",
            boxShadow: "0 0 0 9999px var(--d-overlay), 0 0 0 3px var(--d-accent)",
            pointerEvents: "none",
            zIndex: 9991,
            transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
          }}
        />
      ) : (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, background: "var(--d-overlay)", zIndex: 9991, pointerEvents: "none" }} />
      )}

      <div className="d-card d-card-pad d-stack" style={{ position: "fixed", zIndex: 9995, width, gap: 14, boxShadow: "var(--d-shadow-pop)", ...cardStyle }}>
        <div className="d-row" style={{ justifyContent: "space-between" }}>
          <span className="d-faint d-small d-strong">Step {step + 1} of {steps.length}</span>
          <button type="button" className="d-btn d-btn--ghost d-btn--icon" onClick={onClose} aria-label="Close the tour">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <h2 id="tour-title" className="d-h2">{current.title}</h2>
        <p id="tour-body" style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{current.description}</p>
        <div className="d-row" style={{ justifyContent: "space-between", paddingTop: 4 }}>
          <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={onClose}>Skip the tour</button>
          <div className="d-row" style={{ gap: 8 }}>
            {step > 0 && <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={goPrev}>Back</button>}
            <button type="button" className="d-btn d-btn--primary d-btn--sm" onClick={goNext} autoFocus>{isLast ? "Finish" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
