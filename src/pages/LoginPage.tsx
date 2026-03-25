import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LoginPage: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

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
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);

      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", authData.session!.access_token);
      storage.setItem("user_id", authData.user!.id);

      // 2. Fetch the masjid linked to this user
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full backdrop-blur-xl border-b z-50 transition-colors ${
          isDark ? "bg-black/50 border-white/5" : "bg-white/50 border-black/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg"></div>
            <div className="text-lg font-semibold tracking-tight">
              Masjid Network
            </div>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-full transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20"
                : "bg-black/5 hover:bg-black/10"
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Login Form */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-bold uppercase tracking-wider mb-6">
              Welcome Back
            </div>
            <h1 className="text-5xl font-black mb-3">Login</h1>
            <p
              className={`text-lg ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Access your masjid dashboard
            </p>
          </div>

          {/* Login Card */}
          <div
            className={`rounded-3xl p-8 border-2 ${
              isDark
                ? "bg-zinc-900 border-white/10"
                : "bg-zinc-50 border-black/10"
            }`}
          >
            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg
                      className={`w-5 h-5 ${
                        isDark ? "text-zinc-500" : "text-zinc-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? "bg-black border-white/10 text-white placeholder-zinc-600"
                        : "bg-white border-black/10 text-black placeholder-zinc-400"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-bold mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg
                      className={`w-5 h-5 ${
                        isDark ? "text-zinc-500" : "text-zinc-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-12 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? "bg-black border-white/10 text-white placeholder-zinc-600"
                        : "bg-white border-black/10 text-black placeholder-zinc-400"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg
                        className={`w-5 h-5 ${
                          isDark
                            ? "text-zinc-500 hover:text-zinc-300"
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className={`w-5 h-5 ${
                          isDark
                            ? "text-zinc-500 hover:text-zinc-300"
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-2 accent-emerald-500"
                  />
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
                  <p className="text-red-500 font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`w-full py-4 rounded-lg font-bold transition-all ${
                  isLoading
                    ? "bg-zinc-500 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02]"
                } text-black shadow-lg`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div
                  className={`absolute inset-0 flex items-center ${
                    isDark ? "text-zinc-700" : "text-zinc-300"
                  }`}
                >
                  <div className="w-full border-t-2"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span
                    className={`px-4 font-bold ${
                      isDark
                        ? "bg-zinc-900 text-zinc-500"
                        : "bg-zinc-50 text-zinc-600"
                    }`}
                  >
                    OR
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p
                  className={`text-sm ${
                    isDark ? "text-zinc-500" : "text-zinc-600"
                  }`}
                >
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    Register your masjid
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <p
            className={`text-xs text-center mt-6 ${
              isDark ? "text-zinc-600" : "text-zinc-500"
            }`}
          >
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
