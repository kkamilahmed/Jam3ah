import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    if (!formData.masjidName || !formData.masjidEmail || !formData.inchargeName) {
      setError("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const { error: dbError } = await supabase.from("masjid_registrations").insert({
        masjid_name:    formData.masjidName,
        address:        formData.address,
        masjid_phone:   formData.masjidPhone,
        masjid_email:   formData.masjidEmail,
        incharge_name:  formData.inchargeName,
        incharge_phone: formData.inchargePhone,
        status: "pending",
      });
      if (dbError) throw new Error(dbError.message);
      setIsSuccess(true);
      setFormData({ masjidName: "", address: "", masjidPhone: "", masjidEmail: "", inchargeName: "", inchargePhone: "" });
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-5xl font-black mb-4">Request Submitted!</h1>
          <p className="text-xl text-zinc-400 mb-8">
            Your registration is pending review. Once approved by the admin, you'll be able to log in with your email and the default password.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setIsSuccess(false)} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all">
              Submit Another
            </button>
            <button onClick={() => navigate("/login")} className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
              </svg>
            </div>
            <span className="text-lg font-black">Jam3ah</span>
          </div>
          <button onClick={() => navigate("/login")} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            Already registered? Login →
          </button>
        </div>
      </nav>

      {/* Form */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <div className="inline-block px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider mb-4">
              Registration
            </div>
            <h1 className="text-5xl font-black mb-3">Register Your Masjid</h1>
            <p className="text-zinc-400 text-lg">Join the Jam3ah network and connect with your community</p>
          </div>

          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 space-y-8">
            {/* Masjid Info */}
            <div>
              <h2 className="text-lg font-black mb-5 flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-black">1</div>
                Masjid Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Masjid Name <span className="text-red-400">*</span></label>
                  <input type="text" name="masjidName" value={formData.masjidName} onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="e.g. Al-Noor Masjid" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                    placeholder="123 Main St, Toronto, ON" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Masjid Phone</label>
                    <input type="tel" name="masjidPhone" value={formData.masjidPhone} onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Masjid Email <span className="text-red-400">*</span></label>
                    <input type="email" name="masjidEmail" value={formData.masjidEmail} onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="info@masjid.ca" />
                  </div>
                </div>
              </div>
            </div>

            {/* Person In Charge */}
            <div>
              <h2 className="text-lg font-black mb-5 flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-black">2</div>
                Person In-Charge
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" name="inchargeName" value={formData.inchargeName} onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="Sheikh Abdullah" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Phone Number</label>
                  <input type="tel" name="inchargePhone" value={formData.inchargePhone} onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 font-bold text-sm">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${isSubmitting ? "bg-zinc-700 cursor-not-allowed text-zinc-400" : "bg-emerald-500 hover:bg-emerald-400 text-black"}`}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : "Submit Registration"}
            </button>

            <p className="text-xs text-center text-zinc-600">
              By submitting, you agree to our terms and conditions. Your registration will be reviewed by the admin team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
