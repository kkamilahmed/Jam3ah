import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, []);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    masjidName: "",
    address: "",
    masjidPhone: "",
    masjidEmail: "",
    inchargeName: "",
    inchargePhone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    // Validate form
    if (!formData.masjidName || !formData.address || !formData.inchargeName) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
    
      // Supabase configuration
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/masjid_registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            masjid_name: formData.masjidName,
            address: formData.address,
            masjid_phone: formData.masjidPhone,
            masjid_email: formData.masjidEmail,
            incharge_name: formData.inchargeName,
            incharge_phone: formData.inchargePhone,
            status: "pending",
            created_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit registration");
      }

      setIsSuccess(true);
      setFormData({
        masjidName: "",
        address: "",
        masjidPhone: "",
        masjidEmail: "",
        inchargeName: "",
        inchargePhone: "",
      });
    } catch (err) {
      setError("Failed to submit registration. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-6 ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-5xl font-black mb-4">Thank You!</h1>
            <p
              className={`text-xl ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Your registration is under review. We'll contact you soon at the
              provided email address.
            </p>
          </div>
          <button
            onClick={() => setIsSuccess(false)}
            className="px-8 py-4 bg-emerald-500 text-black rounded-lg font-bold transition-all hover:bg-emerald-400 hover:scale-105"
          >
            Submit Another Registration
          </button>
        </div>
      </div>
    );
  }

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

      {/* Registration Form */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-bold uppercase tracking-wider mb-6">
              Registration
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Register Your Masjid
            </h1>
            <p
              className={`text-xl ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Join our network and connect with your community
            </p>
          </div>

          <div
            className={`rounded-3xl p-8 md:p-12 border-2 ${
              isDark
                ? "bg-zinc-900 border-white/10"
                : "bg-zinc-50 border-black/10"
            }`}
          >
            {/* Masjid Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black text-sm font-bold">
                  1
                </div>
                Masjid Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Masjid Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="masjidName"
                    value={formData.masjidName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? "bg-black border-white/10 text-white"
                        : "bg-white border-black/10 text-black"
                    }`}
                    placeholder="Enter masjid name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 resize-none ${
                      isDark
                        ? "bg-black border-white/10 text-white"
                        : "bg-white border-black/10 text-black"
                    }`}
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Masjid Phone Number
                    </label>
                    <input
                      type="tel"
                      name="masjidPhone"
                      value={formData.masjidPhone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                        isDark
                          ? "bg-black border-white/10 text-white"
                          : "bg-white border-black/10 text-black"
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Masjid Email
                    </label>
                    <input
                      type="email"
                      name="masjidEmail"
                      value={formData.masjidEmail}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                        isDark
                          ? "bg-black border-white/10 text-white"
                          : "bg-white border-black/10 text-black"
                      }`}
                      placeholder="masjid@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Person In-Charge Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black text-sm font-bold">
                  2
                </div>
                Person In-Charge
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="inchargeName"
                    value={formData.inchargeName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? "bg-black border-white/10 text-white"
                        : "bg-white border-black/10 text-black"
                    }`}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="inchargePhone"
                    value={formData.inchargePhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? "bg-black border-white/10 text-white"
                        : "bg-white border-black/10 text-black"
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
                <p className="text-red-500 font-bold text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-bold transition-all ${
                isSubmitting
                  ? "bg-zinc-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02]"
              } text-black shadow-lg`}
            >
              {isSubmitting ? (
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
                  Submitting...
                </span>
              ) : (
                "Submit Registration"
              )}
            </button>

            <p
              className={`text-sm text-center mt-6 ${
                isDark ? "text-zinc-500" : "text-zinc-600"
              }`}
            >
              By submitting this form, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
