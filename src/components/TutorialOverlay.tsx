import React, { useState, useEffect, useCallback, useMemo } from "react";

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  placement: "bottom" | "top" | "center";
  action?: () => void;
  tryCta?: string;
}

interface Props {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const CARD_W = 320;
const GAP = 14;
const SPOT_PAD = 7;

const TutorialOverlay: React.FC<Props> = ({ onClose, setActiveTab }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tryMode, setTryMode] = useState(false);

  const steps = useMemo((): TourStep[] => [
    {
      target: null,
      placement: "center",
      title: "Welcome to Jam3ah",
      description: "Let's take a quick tour of your masjid dashboard. Click Next to begin, or skip to explore on your own.",
    },
    {
      target: "[data-tour='nav-tabs']",
      placement: "bottom",
      title: "Navigation",
      description: "Use these four tabs to move between sections of your dashboard.",
      action: () => setActiveTab("overview"),
      tryCta: "Try clicking a tab",
    },
    {
      target: "[data-tour='tab-overview']",
      placement: "bottom",
      title: "Overview",
      description: "See today's prayer times, upcoming events, and announcements — your daily command center.",
      action: () => setActiveTab("overview"),
    },
    {
      target: "[data-tour='tab-prayer-times']",
      placement: "bottom",
      title: "Prayer Times",
      description: "Set up your full prayer schedule. Auto-calculate using your location, upload from Excel, or edit times individually. Configure adhan, iqama, and multiple jamaats.",
      action: () => setActiveTab("prayer-times"),
      tryCta: "Explore prayer times",
    },
    {
      target: "[data-tour='tab-events']",
      placement: "bottom",
      title: "Events & Announcements",
      description: "Create upcoming events and post pinned announcements that display on your congregation's screens.",
      action: () => setActiveTab("events"),
      tryCta: "Explore events",
    },
    {
      target: "[data-tour='tab-settings']",
      placement: "bottom",
      title: "Settings",
      description: "Update your masjid profile, prayer calculation method, seasonal presets, and jamaat configuration.",
      action: () => setActiveTab("settings"),
      tryCta: "Explore settings",
    },
    {
      target: "[data-tour='tour-btn']",
      placement: "bottom",
      title: "You're all set!",
      description: "You can relaunch this tour any time by clicking this button. Explore at your own pace — may your masjid thrive.",
      action: () => setActiveTab("overview"),
    },
  ], [setActiveTab]);

  const current = steps[step];

  const updateRect = useCallback(() => {
    if (!current.target) { setRect(null); return; }
    const el = document.querySelector(current.target);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => setRect(el.getBoundingClientRect()), 200);
  }, [current.target]);

  useEffect(() => {
    setTryMode(false);
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  const goNext = useCallback(() => {
    if (step < steps.length - 1) {
      const next = step + 1;
      steps[next].action?.();
      setStep(next);
    } else {
      onClose();
    }
  }, [step, steps, onClose]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      const prev = step - 1;
      steps[prev].action?.();
      setStep(prev);
    }
  }, [step, steps]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!tryMode) {
        if (e.key === "ArrowRight" || e.key === "Enter") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose, tryMode]);

  // Card + arrow positioning
  let cardStyle: React.CSSProperties;
  let arrowLeft = 0;
  const isLast = step === steps.length - 1;
  const showArrow = !!rect && current.placement !== "center";

  if (current.placement === "center" || !rect) {
    cardStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: CARD_W };
  } else {
    const cx = rect.left + rect.width / 2;
    const cl = Math.min(Math.max(cx - CARD_W / 2, 16), window.innerWidth - CARD_W - 16);
    arrowLeft = Math.min(Math.max(cx - cl - 5, 12), CARD_W - 22);
    if (current.placement === "bottom") {
      cardStyle = { position: "fixed", top: rect.bottom + GAP, left: cl, width: CARD_W };
    } else {
      cardStyle = { position: "fixed", bottom: window.innerHeight - rect.top + GAP, left: cl, width: CARD_W };
    }
  }

  return (
    <>
      {/* Click blocker (lifted during try mode) */}
      {!tryMode && <div style={{ position: "fixed", inset: 0, zIndex: 9990 }} />}

      {/* Dim layer when no spotlight */}
      {!rect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9991, pointerEvents: "none" }} />
      )}

      {/* Spotlight ring */}
      {rect && (
        <div style={{
          position: "fixed",
          top:    rect.top    - SPOT_PAD,
          left:   rect.left   - SPOT_PAD,
          width:  rect.width  + SPOT_PAD * 2,
          height: rect.height + SPOT_PAD * 2,
          borderRadius: 4,
          boxShadow: tryMode
            ? "0 0 0 9999px rgba(0,0,0,0.35), 0 0 0 2px rgba(52,211,153,0.45)"
            : "0 0 0 9999px rgba(0,0,0,0.82), 0 0 0 2px rgba(52,211,153,0.45)",
          pointerEvents: "none",
          zIndex: 9991,
          transition: "top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease, box-shadow 0.3s ease",
        }} />
      )}

      {/* Try-mode floating pill */}
      {tryMode && (
        <div style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9995,
          background: "#111111",
          border: "1px solid rgba(52,211,153,0.35)",
          borderRadius: 40,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "Manrope, sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0, animation: "tour-beacon 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 12.5, color: "#6a6a6a", fontWeight: 600 }}>Exploring freely</span>
          <button
            onClick={() => { setTryMode(false); goNext(); }}
            style={{ padding: "5px 14px", background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 20, color: "#34d399", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Continue →
          </button>
        </div>
      )}

      {/* Main tooltip card */}
      {!tryMode && (
        <div style={{
          ...cardStyle,
          zIndex: 9995,
          background: "#111111",
          border: "1px solid #252525",
          borderRadius: 6,
          padding: "18px 18px 14px",
          fontFamily: "Manrope, sans-serif",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}>

          {/* Arrow pointing UP (card below target) */}
          {showArrow && current.placement === "bottom" && (
            <div style={{
              position: "absolute",
              top: -5,
              left: arrowLeft,
              width: 10,
              height: 10,
              background: "#111111",
              borderTop: "1px solid #252525",
              borderLeft: "1px solid #252525",
              transform: "rotate(45deg)",
            }} />
          )}

          {/* Arrow pointing DOWN (card above target) */}
          {showArrow && current.placement === "top" && (
            <div style={{
              position: "absolute",
              bottom: -5,
              left: arrowLeft,
              width: 10,
              height: 10,
              background: "#111111",
              borderBottom: "1px solid #252525",
              borderRight: "1px solid #252525",
              transform: "rotate(45deg)",
            }} />
          )}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 2,
                background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#34d399" }}>school</span>
              </div>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {steps.map((_, i) => (
                  <div key={i} style={{
                    width: i === step ? 16 : 5,
                    height: 4,
                    borderRadius: 2,
                    background: i === step ? "#34d399" : i < step ? "#2a3a2e" : "#1c1c1c",
                    transition: "width 0.2s, background 0.2s",
                  }} />
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              title="Close tutorial"
              style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#6a6a6a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#3a3a3a")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: "#c6c6c7", marginBottom: 7 }}>{current.title}</div>
          <div style={{ fontSize: 12.5, color: "#5c5c5c", lineHeight: 1.7, marginBottom: 16 }}>{current.description}</div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#383838", fontFamily: "Manrope, sans-serif", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0, letterSpacing: "0.02em" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#5a5a5a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#383838")}
            >
              Skip tour
            </button>
            <div style={{ display: "flex", gap: 7 }}>
              {step > 0 && (
                <button
                  onClick={goPrev}
                  style={{ padding: "7px 13px", background: "#161616", border: "1px solid #252525", borderRadius: 2, color: "#8a8a8a", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#3a3a3a")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#252525")}
                >
                  Back
                </button>
              )}
              {current.tryCta && !isLast && (
                <button
                  onClick={() => setTryMode(true)}
                  style={{ padding: "7px 13px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 2, color: "#34d399", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(52,211,153,0.17)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(52,211,153,0.1)")}
                >
                  {current.tryCta} ↗
                </button>
              )}
              <button
                onClick={goNext}
                style={{
                  padding: "7px 16px",
                  background: isLast ? "rgba(52,211,153,0.18)" : "#c6c6c7",
                  border: isLast ? "1px solid rgba(52,211,153,0.35)" : "1px solid transparent",
                  borderRadius: 2,
                  color: isLast ? "#34d399" : "#0e0e0e",
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {isLast ? "Done" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tour-beacon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.65; }
        }
      `}</style>
    </>
  );
};

export default TutorialOverlay;
