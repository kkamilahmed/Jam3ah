import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, []);

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
      setError("Please fill in all fields");
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
      if (masjidError || !masjid) throw new Error("No masjid linked to this account.");
      if (masjid.status === "suspended") throw new Error("Your masjid has been suspended. Contact support.");
      storage.setItem("masjid_id", masjid.id);
      storage.setItem("masjid_name", masjid.masjid_name);
      storage.setItem("user_email", authData.user!.email ?? "");
      navigate(masjid.onboarding_complete ? "/home" : "/onboarding");
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 12px 11px 44px", background: "var(--surface-low)",
    border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--on-surface)",
    fontFamily: "Manrope, sans-serif", fontSize: 14, fontWeight: 500,
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--surface-high)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: 28, height: 28, background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--on-surface)" }}>mosque</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)" }}>jam3ah</span>
        </div>
        <button
          onClick={() => navigate("/signup")}
          style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--outline-variant)", borderRadius: 2, color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          Register Masjid
        </button>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 2, fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              Masjid Admin
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-surface)", margin: "0 0 6px" }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "var(--text-ghost)", margin: 0 }}>Sign in to your dashboard</p>
          </div>

          {/* Card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-high)", borderRadius: 2, padding: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 7, letterSpacing: "0.02em" }}>Email address</label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--text-phantom)", pointerEvents: "none" }}>mail</span>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={inp} placeholder="admin@yourmasjid.com"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 7 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--text-phantom)", pointerEvents: "none" }}>lock</span>
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ ...inp, paddingRight: 44 }} placeholder="Enter your password"
                    onFocus={e => { e.target.style.borderColor = "var(--text-ghost)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--outline-variant)"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text-phantom)" }}>{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange}
                  style={{ width: 15, height: 15, accentColor: "#c6c6c7", cursor: "pointer" }} id="rememberMe" />
                <label htmlFor="rememberMe" style={{ fontSize: 13, color: "var(--text-faint)", cursor: "pointer", fontWeight: 500 }}>Remember me</label>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2 }}>
                  <p style={{ color: "#f87171", fontSize: 13, margin: 0, fontWeight: 500 }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleLogin} disabled={isLoading}
                style={{ width: "100%", padding: "12px", background: isLoading ? "var(--surface-mid)" : "var(--accent)", border: "1px solid transparent", borderRadius: 2, color: isLoading ? "var(--text-ghost)" : "var(--accent-text)", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 14, cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span>
                    Signing in...
                  </>
                ) : "Sign in"}
              </button>

              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-phantom)" }}>
                Don't have an account?{" "}
                <button onClick={() => navigate("/signup")} style={{ background: "none", border: "none", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
                  Register your masjid
                </button>
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "var(--outline-variant)", marginTop: 24 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
