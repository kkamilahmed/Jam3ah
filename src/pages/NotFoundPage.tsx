import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 24px 48px",
      fontFamily: "Manrope, system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Islamic dot pattern background */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 480, height: 480,
        background: "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 480, width: "100%" }}>

        {/* Large 404 */}
        <div style={{
          fontSize: "clamp(96px, 22vw, 160px)",
          fontWeight: 900,
          lineHeight: 1,
          color: "var(--surface-high)",
          letterSpacing: "-0.05em",
          userSelect: "none",
          marginBottom: -16,
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          background: "var(--accent-bg)",
          border: "1px solid var(--accent-border)",
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26, color: "var(--accent)" }}>
            location_off
          </span>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: 10,
        }}>
          Page Not Found
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: "clamp(22px, 5vw, 30px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--text-max)",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}>
          This page doesn't exist
        </h1>

        {/* Body */}
        <p style={{
          fontSize: 14,
          color: "var(--text-dim)",
          lineHeight: 1.7,
          margin: "0 0 32px",
          maxWidth: 360,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          The page you're looking for has been moved, deleted, or never existed.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--outline-variant)",
              borderRadius: 2,
              color: "var(--text-dim)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--outline)"; el.style.color = "var(--on-surface)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--outline-variant)"; el.style.color = "var(--text-dim)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
            Go Back
          </button>

          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "10px 22px",
              background: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: 2,
              color: "var(--accent-text)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>dashboard</span>
            Dashboard
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--outline-variant)",
              borderRadius: 2,
              color: "var(--text-dim)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--outline)"; el.style.color = "var(--on-surface)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--outline-variant)"; el.style.color = "var(--text-dim)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>home</span>
            Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;
