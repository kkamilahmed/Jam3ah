import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--outline-variant)", position: "fixed", top: 0, width: "100%", zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--on-surface)" }}>mosque</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--on-surface)", letterSpacing: "-0.01em" }}>jam3ah</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/login")}
              style={{ padding: isMobile ? "8px 12px" : "8px 16px", background: "transparent", border: "1px solid var(--outline)", borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--surface-high)"; (e.target as HTMLElement).style.color = "var(--on-surface)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "var(--on-surface-variant)"; }}
            >
              Sign in
            </button>
            {!isMobile && (
              <button
                onClick={() => navigate("/signup")}
                style={{ padding: "8px 16px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--accent)"; }}
              >
                Register Masjid
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: 160, paddingBottom: 80, textAlign: "center", padding: "160px 24px 80px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 32 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>communities</span>
            Connecting Muslim Communities
          </div>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--on-surface)", marginBottom: 24, margin: "0 0 24px" }}>
            Your Masjid,{" "}
            <span style={{ color: "var(--accent)" }}>Connected.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-faint)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.65, fontWeight: 400 }}>
            One platform to manage prayer times, post events, and keep your community informed — all in one place.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/signup")}
              style={{ padding: "12px 28px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--accent-light)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--accent)"; }}
            >
              Register Your Masjid
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{ padding: "12px 28px", background: "transparent", border: "1px solid var(--outline)", borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--surface-high)"; (e.target as HTMLElement).style.color = "var(--on-surface)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "var(--on-surface-variant)"; }}
            >
              Sign in to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ borderTop: "1px solid var(--surface-high)", borderBottom: "1px solid var(--surface-high)", background: "var(--surface)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 24 : 32, textAlign: "center" }}>
          {[
            { value: "120+", label: "Masjids Registered" },
            { value: "50K+", label: "Community Members" },
            { value: "10K+", label: "Events Published" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-ghost)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
              Features
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: 0 }}>
              Everything your masjid needs
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 2 }}>
            {[
              { icon: "schedule", title: "Prayer Times", desc: "Upload monthly schedules or auto-generate from your location. Always accurate." },
              { icon: "calendar_month", title: "Events", desc: "Create and publish events — from Friday lectures to fundraisers." },
              { icon: "campaign", title: "Announcements", desc: "Send instant announcements to all subscribers whenever it matters most." },
              { icon: "analytics", title: "Analytics", desc: "Track engagement with clear insights into your community activity." },
              { icon: "group", title: "Subscribers", desc: "Community subscribes and receives updates automatically." },
              { icon: "verified", title: "Verified Network", desc: "Every masjid is reviewed before joining — a trusted directory." },
            ].map((f, i) => (
              <div key={i} style={{ padding: "32px 28px", background: "var(--surface)", border: "1px solid var(--surface-high)", transition: "border-color 0.15s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-high)"; }}>
                <div style={{ width: 40, height: 40, background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--on-surface-variant)" }}>{f.icon}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-ghost)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "80px 24px", background: "#0a0a0a", borderTop: "1px solid var(--surface-mid)", borderBottom: "1px solid var(--surface-mid)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
              How It Works
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: 0 }}>
              Up and running in minutes
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { step: "01", title: "Register your masjid", desc: "Fill in your masjid details and submit a registration request. Takes a few minutes." },
              { step: "02", title: "Get approved", desc: "Our admin team reviews your registration and activates your account quickly." },
              { step: "03", title: "Start managing", desc: "Log in, upload prayer times, create events, and send announcements to your community." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 24, padding: "28px 24px", background: "var(--surface)", border: "1px solid var(--surface-high)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--outline)", fontVariantNumeric: "tabular-nums", minWidth: 28, paddingTop: 2 }}>{item.step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)", marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-ghost)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", marginBottom: 16 }}>
            Ready to connect your community?
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-ghost)", marginBottom: 32, lineHeight: 1.6 }}>
            Join masjids across North America who trust jam3ah to manage their community.
          </p>
          <button
            onClick={() => navigate("/signup")}
            style={{ padding: "14px 32px", background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--accent-light)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--accent)"; }}
          >
            Register Your Masjid
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--surface-mid)", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--outline)" }}>© 2026 jam3ah · Built for Muslim communities</div>
      </div>
    </div>
  );
};

export default LandingPage;
