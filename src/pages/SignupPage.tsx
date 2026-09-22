import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "var(--surface-low)",
  border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--on-surface)",
  fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 500,
  outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-faint)",
  marginBottom: 6, letterSpacing: "0.02em",
};

const errText: React.CSSProperties = {
  color: "#f87171", fontSize: 11.5, fontWeight: 500, margin: "5px 0 0", lineHeight: 1.4,
};

// ── Validation ──────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
// Accepts +, spaces, dashes, parens; requires 7–15 digits (ITU E.164 range).
const isValidPhone = (v: string) => {
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    masjidName: "", street: "", city: "", state: "", postalCode: "", country: "",
    masjidPhone: "", masjidEmail: "", inchargeName: "", inchargePhone: "",
  });
  // Which fields the user has interacted with — errors surface under a field only
  // after it's been touched (or after a submit attempt), never all at once up-front.
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    setError("");
  };
  const markTouched = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  // Per-field validation message ("" = valid). Recomputed each render so the
  // message clears the moment the user fixes the field.
  const errorFor = (field: string): string => {
    const v = (formData as Record<string, string>)[field] ?? "";
    switch (field) {
      case "masjidName":    return v.trim() ? "" : "Masjid name is required.";
      case "inchargeName":  return v.trim() ? "" : "Full name is required.";
      case "masjidEmail":   return !v.trim() ? "Masjid email is required." : isValidEmail(v) ? "" : "Enter a valid email (e.g. info@masjid.ca).";
      case "masjidPhone":   return v && !isValidPhone(v) ? "Enter a valid phone number (7–15 digits)." : "";
      case "inchargePhone": return v && !isValidPhone(v) ? "Enter a valid phone number (7–15 digits)." : "";
      default: return "";
    }
  };
  const showErr = (field: string) => touched[field] ? errorFor(field) : "";
  const fieldErr = (field: string) => { const m = showErr(field); return m ? <p style={errText}>{m}</p> : null; };
  // Inputs turn red once touched-and-invalid; border logic lives here so focus/blur respect it.
  const fieldBorder = (field: string) => showErr(field) ? "#f87171" : "var(--outline-variant)";

  const handleSubmit = async () => {
    const validated = ["masjidName", "masjidEmail", "inchargeName", "masjidPhone", "inchargePhone"];
    if (validated.some(f => errorFor(f))) {
      // Reveal every field's inline error rather than a single bottom message.
      setTouched(t => ({ ...t, ...Object.fromEntries(validated.map(f => [f, true])) }));
      return;
    }
    setIsSubmitting(true);
    setError("");
    const address = [formData.street, formData.city, formData.state, formData.postalCode, formData.country].filter(Boolean).join(", ");
    try {
      const { error: dbError } = await supabase.from("masjid_registrations").insert({
        masjid_name: formData.masjidName, address,
        masjid_phone: formData.masjidPhone, masjid_email: formData.masjidEmail,
        incharge_name: formData.inchargeName, incharge_phone: formData.inchargePhone,
        status: "pending",
      });
      if (dbError) throw new Error(dbError.message);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--on-surface)" }}>check</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12, color: "var(--on-surface)" }}>Request Submitted</h1>
          <p style={{ fontSize: 14, color: "var(--text-ghost)", lineHeight: 1.65, marginBottom: 32 }}>
            Your registration is pending review. Once approved, you'll receive login credentials via email.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setIsSuccess(false)} style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Submit Another
            </button>
            <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", background: "var(--on-surface)", border: "1px solid var(--on-surface)", borderRadius: 2, color: "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Go to Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--surface-high)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: 28, height: 28, background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--on-surface)" }}>mosque</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)" }}>jam3ah</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Already registered?{" "}
            <span style={{ color: "var(--on-surface)", fontWeight: 700 }}>Sign in →</span>
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
            Registration
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Register Your Masjid</h1>
          <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>Join the jam3ah network and connect your community</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 28, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Masjid Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--surface-mid)" }}>
              <div style={{ width: 24, height: 24, background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-ghost)" }}>1</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface-variant)" }}>Masjid Information</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Masjid Name <span style={{ color: "#f87171" }}>*</span></label>
                <input type="text" value={formData.masjidName} onChange={set("masjidName")} style={{ ...inp, borderColor: fieldBorder("masjidName") }} placeholder="e.g. Al-Noor Islamic Centre"
                  onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { markTouched("masjidName"); e.target.style.borderColor = fieldBorder("masjidName"); }} />
                {fieldErr("masjidName")}
              </div>
              <div>
                <label style={lbl}>Street Address</label>
                <input type="text" value={formData.street} onChange={set("street")} style={inp} placeholder="20 Overlea Blvd"
                  onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>City</label>
                  <input type="text" value={formData.city} onChange={set("city")} style={inp} placeholder="Toronto"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                </div>
                <div>
                  <label style={lbl}>Province / State</label>
                  <input type="text" value={formData.state} onChange={set("state")} style={inp} placeholder="Ontario"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Postal / ZIP Code</label>
                  <input type="text" value={formData.postalCode} onChange={set("postalCode")} style={inp} placeholder="M4H 1B1"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                </div>
                <div>
                  <label style={lbl}>Country</label>
                  <input type="text" value={formData.country} onChange={set("country")} style={inp} placeholder="Canada"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Masjid Phone</label>
                  <input type="tel" value={formData.masjidPhone} onChange={set("masjidPhone")} style={{ ...inp, borderColor: fieldBorder("masjidPhone") }} placeholder="+1 (555) 000-0000"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { markTouched("masjidPhone"); e.target.style.borderColor = fieldBorder("masjidPhone"); }} />
                  {fieldErr("masjidPhone")}
                </div>
                <div>
                  <label style={lbl}>Masjid Email <span style={{ color: "#f87171" }}>*</span></label>
                  <input type="email" value={formData.masjidEmail} onChange={set("masjidEmail")} style={{ ...inp, borderColor: fieldBorder("masjidEmail") }} placeholder="info@masjid.ca"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { markTouched("masjidEmail"); e.target.style.borderColor = fieldBorder("masjidEmail"); }} />
                  {fieldErr("masjidEmail")}
                </div>
              </div>
            </div>
          </div>

          {/* Person In Charge */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--surface-mid)" }}>
              <div style={{ width: 24, height: 24, background: "var(--surface-mid)", border: "1px solid var(--outline-variant)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-ghost)" }}>2</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface-variant)" }}>Person In-Charge</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Full Name <span style={{ color: "#f87171" }}>*</span></label>
                <input type="text" value={formData.inchargeName} onChange={set("inchargeName")} style={{ ...inp, borderColor: fieldBorder("inchargeName") }} placeholder="Sheikh Abdullah"
                  onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { markTouched("inchargeName"); e.target.style.borderColor = fieldBorder("inchargeName"); }} />
                {fieldErr("inchargeName")}
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input type="tel" value={formData.inchargePhone} onChange={set("inchargePhone")} style={{ ...inp, borderColor: fieldBorder("inchargePhone") }} placeholder="+1 (555) 000-0000"
                  onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }} onBlur={e => { markTouched("inchargePhone"); e.target.style.borderColor = fieldBorder("inchargePhone"); }} />
                {fieldErr("inchargePhone")}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2 }}>
              <p style={{ color: "#f87171", fontSize: 13, margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={isSubmitting}
            style={{ width: "100%", padding: "12px", background: isSubmitting ? "var(--surface-mid)" : "var(--accent)", border: "1px solid transparent", borderRadius: 2, color: isSubmitting ? "var(--text-phantom)" : "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 14, cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
            onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}>
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span>
                Submitting...
              </>
            ) : "Submit Registration"}
          </button>

          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
            By submitting, you agree to our{" "}
            {/* TODO: point href to the real Terms & Conditions page when it exists */}
            <a href="/terms" onClick={e => e.preventDefault()}
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" }}>
              terms
            </a>. Your registration will be reviewed by the admin team.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SignupPage;
