import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Icon, Spinner } from "../dashboard/ui";
import { useDashTheme } from "../dashboard/theme";
import PublicHeader from "./PublicHeader";
import "./PublicPages.css";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  help?: string;
  error?: string;
}

const Field: React.FC<FieldProps> = ({ id, label, value, onChange, onBlur, type = "text", placeholder, autoComplete, required, help, error }) => (
  <div className="d-field">
    <label className="d-label" htmlFor={id}>
      {label}
      {!required && <span className="pub-optional"> (optional)</span>}
    </label>
    <input
      id={id} className="d-input" type={type} value={value} onChange={onChange} onBlur={onBlur}
      placeholder={placeholder} autoComplete={autoComplete} aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
      style={error ? { borderColor: "var(--d-danger)" } : undefined}
    />
    {error
      ? <p id={`${id}-error`} className="d-help" style={{ color: "var(--d-danger)" }}>{error}</p>
      : help && <p id={`${id}-help`} className="d-help">{help}</p>}
  </div>
);

// A valid email and a phone number with 7–15 digits (ITU E.164 range).
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v: string) => { const d = v.replace(/\D/g, ""); return d.length >= 7 && d.length <= 15; };

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { dark, toggle, themeAttr } = useDashTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    masjidName: "", street: "", city: "", state: "", postalCode: "", country: "",
    masjidPhone: "", masjidEmail: "", inchargeName: "", inchargePhone: "",
  });
  // Errors surface under a field only once it's been touched (blurred) or after a
  // submit attempt — not up-front while the form is still empty.
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    setError("");
  };
  const markTouched = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  // Per-field validation message ("" = valid); recomputed each render so it clears
  // the moment the field is fixed.
  const errorFor = (field: string): string => {
    const v = (formData as Record<string, string>)[field] ?? "";
    switch (field) {
      case "masjidName":    return v.trim() ? "" : "Please enter your masjid's name.";
      case "inchargeName":  return v.trim() ? "" : "Please enter your full name.";
      case "masjidEmail":   return !v.trim() ? "Please enter the masjid's email." : isValidEmail(v) ? "" : "Please enter a valid email, e.g. info@yourmasjid.org.";
      case "masjidPhone":   return v && !isValidPhone(v) ? "Please enter a valid phone number." : "";
      case "inchargePhone": return v && !isValidPhone(v) ? "Please enter a valid phone number." : "";
      default: return "";
    }
  };
  const showErr = (field: string) => (touched[field] ? errorFor(field) : "");

  const handleSubmit = async () => {
    const validated = ["masjidName", "masjidEmail", "inchargeName", "masjidPhone", "inchargePhone"];
    if (validated.some(f => errorFor(f))) {
      // Reveal each field's own inline error instead of one message at the bottom.
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
      setError((err as Error).message || "We could not send your request. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const header = (
    <PublicHeader dark={dark} onToggleTheme={toggle}>
      <Link to="/login" className="d-btn d-btn--secondary d-btn--sm">
        <span className="pub-hide-mobile">Already registered? Sign in</span>
        <span className="d-only-mobile">Sign in</span>
      </Link>
    </PublicHeader>
  );

  if (isSuccess) {
    return (
      <div className="dash" data-dash-theme={themeAttr}>
        <a href="#main" className="d-sr-only">Skip to content</a>
        {header}
        <main id="main" className="pub-auth">
          <div className="pub-auth-inner pub-auth-inner--mid">
            <div className="d-card nf-card" role="status">
              <div className="pub-icon-chip pub-icon-chip--success"><Icon name="check_circle" /></div>
              <h1 className="d-h1">Thank you, we have your request</h1>
              <p className="d-sub">
                Our team will review your masjid's details. Once it is approved, we will email your sign-in details to the masjid's email address.
              </p>
              <div className="lp-actions">
                <button type="button" className="d-btn d-btn--secondary" onClick={() => setIsSuccess(false)}>
                  Register another masjid
                </button>
                <button type="button" className="d-btn d-btn--primary" onClick={() => navigate("/login")}>
                  Go to sign in
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash" data-dash-theme={themeAttr}>
      <a href="#main" className="d-sr-only">Skip to content</a>
      {header}

      <main id="main" className="pub-auth">
        <div className="pub-auth-inner pub-auth-inner--wide">
          <div className="d-stack" style={{ gap: 8 }}>
            <h1 className="d-h1">Register your masjid</h1>
            <p className="d-sub">
              Tell us about your masjid and who we should contact. We will check your details and email you when you can sign in.
            </p>
          </div>

          {/* Not a <form>: pressing Enter in a field should not send the request by accident. */}
          <div className="d-card d-card-pad pub-form">
            <section className="pub-section" aria-labelledby="su-masjid">
              <div className="pub-section-head">
                <span className="pub-step" aria-hidden="true">1</span>
                <h2 id="su-masjid" className="d-h2">About your masjid</h2>
              </div>
              <Field id="su-name" label="Masjid name" required value={formData.masjidName} onChange={set("masjidName")}
                onBlur={() => markTouched("masjidName")} error={showErr("masjidName")}
                placeholder="Al-Noor Islamic Centre" autoComplete="organization" />
              <Field id="su-street" label="Street address" value={formData.street} onChange={set("street")}
                placeholder="20 Overlea Blvd" autoComplete="street-address" />
              <div className="d-grid-2">
                <Field id="su-city" label="City" value={formData.city} onChange={set("city")}
                  placeholder="Toronto" autoComplete="address-level2" />
                <Field id="su-state" label="Province or state" value={formData.state} onChange={set("state")}
                  placeholder="Ontario" autoComplete="address-level1" />
              </div>
              <div className="d-grid-2">
                <Field id="su-postal" label="Postal or ZIP code" value={formData.postalCode} onChange={set("postalCode")}
                  placeholder="M4H 1B1" autoComplete="postal-code" />
                <Field id="su-country" label="Country" value={formData.country} onChange={set("country")}
                  placeholder="Canada" autoComplete="country-name" />
              </div>
              <div className="d-grid-2">
                <Field id="su-phone" label="Masjid phone" type="tel" value={formData.masjidPhone} onChange={set("masjidPhone")}
                  onBlur={() => markTouched("masjidPhone")} error={showErr("masjidPhone")}
                  placeholder="+1 555 000 0000" autoComplete="tel" />
                <Field id="su-email" label="Masjid email" type="email" required value={formData.masjidEmail} onChange={set("masjidEmail")}
                  onBlur={() => markTouched("masjidEmail")} error={showErr("masjidEmail")}
                  placeholder="info@yourmasjid.org" autoComplete="email" help="We will send your sign-in details here." />
              </div>
            </section>

            <section className="pub-section" aria-labelledby="su-contact">
              <div className="pub-section-head">
                <span className="pub-step" aria-hidden="true">2</span>
                <h2 id="su-contact" className="d-h2">Who should we contact?</h2>
              </div>
              <div className="d-grid-2">
                <Field id="su-contact-name" label="Your full name" required value={formData.inchargeName} onChange={set("inchargeName")}
                  onBlur={() => markTouched("inchargeName")} error={showErr("inchargeName")}
                  placeholder="Abdullah Khan" autoComplete="name" />
                <Field id="su-contact-phone" label="Your phone number" type="tel" value={formData.inchargePhone} onChange={set("inchargePhone")}
                  onBlur={() => markTouched("inchargePhone")} error={showErr("inchargePhone")}
                  placeholder="+1 555 000 0000" autoComplete="tel" />
              </div>
            </section>

            {error && (
              <div className="d-notice d-notice--danger" role="alert">
                <Icon name="error" />
                <span>{error}</span>
              </div>
            )}

            <button type="button" className="d-btn d-btn--primary pub-btn-full" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Spinner />Sending your request...</> : "Send registration request"}
            </button>

            <p className="d-help pub-center">
              By sending this request, you agree to our terms. Our team reviews every request before a masjid can sign in.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
