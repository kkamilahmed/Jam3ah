import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Icon, Spinner } from "../dashboard/ui";
import { useDashTheme } from "../dashboard/theme";
import PublicHeader from "./PublicHeader";
import "./PublicPages.css";

// Supabase error text is written for developers; say the same thing in plain words.
const friendlyError = (message: string) =>
  message === "Invalid login credentials"
    ? "That email and password do not match. Please check them and try again."
    : message;

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { dark, toggle, themeAttr } = useDashTheme();

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError("");
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    if (!formData.email || !formData.password) {
      setError("Please enter your email address and your password.");
      setIsLoading(false);
      return;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw new Error(authError.message);
      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", authData.session!.access_token);
      storage.setItem("user_id", authData.user!.id);
      const { data: masjid, error: masjidError } = await supabase
        .from("masjids")
        .select("id, masjid_name, status, onboarding_complete")
        .eq("user_id", authData.user!.id)
        .single();
      if (masjidError || !masjid) throw new Error("We could not find a masjid for this account. Please check your email address, or register your masjid.");
      if (masjid.status === "suspended") throw new Error("Your masjid's account has been paused. Please contact Jam3ah support.");
      storage.setItem("masjid_id", masjid.id);
      storage.setItem("masjid_name", masjid.masjid_name);
      storage.setItem("user_email", authData.user!.email ?? "");
      navigate(masjid.onboarding_complete ? "/home" : "/onboarding");
    } catch (err: unknown) {
      setError((err as Error).message || "Sign in did not work. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dash" data-dash-theme={themeAttr}>
      <a href="#main" className="d-sr-only">Skip to content</a>
      <PublicHeader dark={dark} onToggleTheme={toggle}>
        <Link to="/signup" className="d-btn d-btn--secondary d-btn--sm">
          <span className="pub-hide-mobile">Register your masjid</span>
          <span className="d-only-mobile">Register</span>
        </Link>
      </PublicHeader>

      <main id="main" className="pub-auth">
        <div className="pub-auth-inner">
          <div className="d-stack" style={{ gap: 8 }}>
            <h1 className="d-h1">Welcome back</h1>
            <p className="d-sub">Sign in to update your masjid's prayer times, events and news.</p>
          </div>

          <form
            className="d-card d-card-pad pub-form"
            noValidate
            onSubmit={e => { e.preventDefault(); handleLogin(); }}
          >
            <div className="d-field">
              <label className="d-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email" className="d-input" type="email" name="email" autoComplete="email"
                value={formData.email} onChange={handleChange} placeholder="you@yourmasjid.org"
              />
            </div>

            <div className="d-field">
              <label className="d-label" htmlFor="login-password">Password</label>
              <div className="pub-password">
                <input
                  id="login-password" className="d-input" type={showPassword ? "text" : "password"} name="password"
                  autoComplete="current-password" value={formData.password} onChange={handleChange}
                />
                <button
                  type="button"
                  className="d-btn d-btn--ghost pub-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} />
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="pub-check" htmlFor="rememberMe">
              <input type="checkbox" id="rememberMe" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
              Keep me signed in on this device
            </label>

            {error && (
              <div className="d-notice d-notice--danger" role="alert">
                <Icon name="error" />
                <span>{friendlyError(error)}</span>
              </div>
            )}

            <button type="submit" className="d-btn d-btn--primary pub-btn-full" disabled={isLoading}>
              {isLoading ? <><Spinner />Signing in...</> : "Sign in"}
            </button>
          </form>

          <div className="d-stack pub-center" style={{ gap: 10 }}>
            <p className="d-muted" style={{ margin: 0 }}>
              New to Jam3ah? <Link to="/signup" className="d-link">Register your masjid</Link>
            </p>
            <p className="d-faint d-small" style={{ margin: 0 }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
