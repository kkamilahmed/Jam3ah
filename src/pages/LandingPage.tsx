import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CrescentIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 0 0 0 20 8 8 0 0 1 0-16 10 10 0 0 0 0-4z" />
  </svg>
);

const LandingPage: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative ${
        isDark ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"
      }`}
    >
      {/* Islamic geometric pattern background */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: isDark ? 0.035 : 0.045 }}
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lp-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="40" cy="40" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="80" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="0" cy="80" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="80" cy="80" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <line x1="0" y1="40" x2="40" y2="0" stroke="currentColor" strokeWidth="0.3" />
              <line x1="40" y1="0" x2="80" y2="40" stroke="currentColor" strokeWidth="0.3" />
              <line x1="80" y1="40" x2="40" y2="80" stroke="currentColor" strokeWidth="0.3" />
              <line x1="40" y1="80" x2="0" y2="40" stroke="currentColor" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-pattern)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full backdrop-blur-xl border-b z-50 transition-colors ${
          isDark ? "bg-zinc-950/80 border-white/5" : "bg-white/80 border-black/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center">
              <CrescentIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black tracking-tight">
              Masjid<span className="text-emerald-400">Network</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-full transition-all ${
                isDark ? "bg-white/8 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                isDark ? "bg-white/8 hover:bg-white/15 text-zinc-300" : "bg-black/5 hover:bg-black/10 text-zinc-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-black text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              Register Masjid
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-40 pb-12 px-6 text-center overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center top, rgba(52,211,153,0.13) 0%, transparent 65%)" }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
            <CrescentIcon className="w-3 h-3" />
            Connecting Muslim Communities
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.95] tracking-tight">
            Your Masjid,{" "}
            <span className="text-emerald-400">Connected.</span>
          </h1>
          <p className={`text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            One platform to manage prayer times, announce events, and keep your
            community informed — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-500/20"
            >
              Register Your Masjid
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`px-8 py-4 rounded-xl font-black text-lg border-2 transition-all hover:scale-105 ${
                isDark ? "border-white/10 hover:bg-white/5 text-zinc-300" : "border-black/10 hover:bg-black/5 text-zinc-700"
              }`}
            >
              Login to Dashboard
            </button>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.08) 0%, transparent 70%)" }}
            />
            <div className={`relative rounded-2xl border overflow-hidden shadow-2xl ${isDark ? "border-white/8 shadow-black/70" : "border-black/8 shadow-zinc-300/50"}`}>
              {/* Browser chrome */}
              <div className={`px-4 py-3 border-b flex items-center gap-3 ${isDark ? "bg-zinc-900 border-white/5" : "bg-zinc-100 border-black/5"}`}>
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className={`flex-1 rounded-md px-3 py-1 text-xs font-mono ${isDark ? "bg-zinc-800/70 text-zinc-500" : "bg-white text-zinc-400 border border-black/5"}`}>
                  torontohifz.jam3ah.app
                </div>
              </div>
              {/* Dashboard layout */}
              <div className={`flex ${isDark ? "bg-zinc-950" : "bg-zinc-50"}`} style={{ height: "290px" }}>
                {/* Sidebar */}
                <div className={`w-48 shrink-0 border-r p-3 ${isDark ? "bg-zinc-900/90 border-white/5" : "bg-white border-black/5"}`}>
                  <div className="flex items-center gap-2 px-2 py-2 mb-4">
                    <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/40 rounded-md flex items-center justify-center">
                      <CrescentIcon className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className={`text-xs font-black ${isDark ? "text-white" : "text-zinc-900"}`}>Toronto Hifz</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: "Overview", active: true },
                      { label: "Prayer Times", active: false },
                      { label: "Events", active: false },
                      { label: "Notifications", active: false },
                      { label: "Settings", active: false },
                    ].map(({ label, active }) => (
                      <div
                        key={label}
                        className={`px-3 py-2 rounded-lg text-xs font-bold ${
                          active
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                            : isDark ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main content */}
                <div className="flex-1 p-5 overflow-hidden">
                  <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Overview</div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Events", value: "3" },
                      { label: "Subscribers", value: "1.2K" },
                      { label: "Notifs sent", value: "89" },
                    ].map(({ label, value }) => (
                      <div key={label} className={`rounded-xl p-3 border ${isDark ? "bg-zinc-900/60 border-white/5" : "bg-white border-black/5"}`}>
                        <div className="w-6 h-6 bg-emerald-500/15 border border-emerald-500/30 rounded-md mb-2" />
                        <div className={`text-base font-black ${isDark ? "text-white" : "text-zinc-900"}`}>{value}</div>
                        <div className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`rounded-xl p-3 border ${isDark ? "bg-zinc-900/60 border-white/5" : "bg-white border-black/5"}`}>
                    <div className={`text-xs font-black uppercase tracking-widest mb-2.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Today's Prayers</div>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { name: "Fajr", time: "5:45" },
                        { name: "Dhuhr", time: "1:15" },
                        { name: "Asr", time: "4:30" },
                        { name: "Maghrib", time: "7:52" },
                        { name: "Isha", time: "9:20" },
                      ].map(({ name, time }) => (
                        <div key={name} className="text-center">
                          <div className="text-emerald-400 font-black text-xs mb-0.5">{name}</div>
                          <div className={`font-bold text-xs ${isDark ? "text-white" : "text-zinc-900"}`}>{time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`py-16 border-y ${isDark ? "border-white/5 bg-zinc-900/20" : "border-black/5 bg-zinc-50/80"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "120+", label: "Masjids Registered" },
              { value: "50K+", label: "Community Subscribers" },
              { value: "10K+", label: "Events Posted" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl md:text-6xl font-black text-emerald-400 mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className={`font-bold text-sm ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Everything your masjid needs
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              A complete toolkit for masjid administrators to manage and engage
              their community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Prayer Times",
                description: "Upload monthly prayer schedules or generate them automatically from your location. Subscribers always have accurate, up-to-date times.",
              },
              {
                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                title: "Events",
                description: "Create and publish events for your community. From Friday lectures to fundraisers — keep everyone in the loop.",
              },
              {
                icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                title: "Notifications",
                description: "Send instant announcements to all your subscribers. Reach your community whenever it matters most.",
              },
              {
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                title: "Analytics",
                description: "Track subscriber counts, event views, and engagement. Understand your community with clear insights.",
              },
              {
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                title: "Subscribers",
                description: "Your community subscribes to your masjid and receives all updates automatically — no extra setup needed.",
              },
              {
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Verified Network",
                description: "Every masjid is reviewed before joining. A trusted, verified directory your community can rely on.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  isDark
                    ? "bg-zinc-900/60 border-white/5 hover:border-emerald-500/20 hover:shadow-emerald-500/5"
                    : "bg-white border-black/5 hover:border-emerald-500/20 hover:shadow-emerald-500/10"
                }`}
              >
                <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/25 group-hover:border-emerald-500/50 transition-all">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-black mb-2">{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className={`py-24 px-6 border-y ${isDark ? "bg-zinc-900/25 border-white/5" : "bg-zinc-50 border-black/5"}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Up and running in minutes
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "Register your masjid",
                description: "Fill in your masjid's details and submit a registration request. It only takes a few minutes.",
              },
              {
                step: "02",
                title: "Get approved",
                description: "Our admin team reviews your registration and activates your account. You'll hear back quickly.",
              },
              {
                step: "03",
                title: "Start managing",
                description: "Log in to your dashboard, upload prayer times, create events, and send notifications to your subscribers.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex gap-6 items-start p-7 rounded-2xl border transition-all hover:border-emerald-500/20 ${
                  isDark ? "bg-zinc-900/60 border-white/5" : "bg-white border-black/5"
                }`}
              >
                <div className="text-3xl font-black text-emerald-400 shrink-0 w-12 leading-none pt-1">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-black mb-1.5">{item.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-28 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.08) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
            Ready to connect your community?
          </h2>
          <p className={`text-lg mb-10 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            Join the network of masjids already using Masjid Network to stay
            connected with their communities.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-500/20"
          >
            Register Your Masjid — It's Free
          </button>
          <p className={`mt-6 text-sm ${isDark ? "text-zinc-600" : "text-zinc-500"}`}>
            Already registered?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
            >
              Login to your dashboard
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-8 px-6 ${isDark ? "border-white/5" : "border-black/5"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/40 rounded-md flex items-center justify-center">
              <CrescentIcon className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="font-black text-sm">Masjid Network</span>
          </div>
          <p className={`text-xs ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
            © {new Date().getFullYear()} Masjid Network. All rights reserved.
          </p>
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/login")}
              className={`text-xs font-bold transition-colors ${isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-black"}`}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className={`text-xs font-bold transition-colors ${isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-black"}`}
            >
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
