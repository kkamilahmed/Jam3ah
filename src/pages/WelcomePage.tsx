import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { generateYearPrayerTimes } from "../lib/prayerTimes";

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const THEMES = [
  { key: "emerald", label: "Emerald", hex: "#34d399" },
  { key: "amber",   label: "Gold",    hex: "#f59e0b" },
  { key: "sky",     label: "Ocean",   hex: "#38bdf8" },
  { key: "violet",  label: "Royal",   hex: "#a78bfa" },
  { key: "rose",    label: "Ruby",    hex: "#fb7185" },
];

const CALC_METHODS = [
  { value: "ISNA",     label: "ISNA – Islamic Society of North America" },
  { value: "MWL",      label: "MWL – Muslim World League" },
  { value: "Egyptian", label: "Egyptian – Egyptian General Authority" },
  { value: "Makkah",   label: "Makkah – Umm Al-Qura" },
  { value: "Karachi",  label: "Karachi – Univ. of Islamic Sciences" },
];

const TIMEZONES = [
  "America/Toronto","America/New_York","America/Chicago","America/Denver",
  "America/Los_Angeles","America/Vancouver","Europe/London","Europe/Istanbul",
  "Asia/Karachi","Asia/Dubai","Asia/Riyadh","Asia/Dhaka","Africa/Cairo","Australia/Sydney",
];

const TOTAL_STEPS = 5;

const StepDots = ({ current }: { current: number }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div key={i} className="rounded-full transition-all duration-300" style={{
        width: i === current ? 32 : i < current ? 24 : 8,
        height: 8,
        backgroundColor: i <= current ? "#34d399" : "rgba(255,255,255,0.08)",
      }} />
    ))}
  </div>
);

export function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);   // fade-in on mount
  const [leaving, setLeaving] = useState(false);   // fade-out before navigating
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress]   = useState(0);   // 0→100 progress bar on completion
  const [saving, setSaving]       = useState(false);
  const [savingMsg, setSavingMsg] = useState("Saving…");
  const [masjidId, setMasjidId]     = useState<string | null>(null);
  const [masjidName, setMasjidName] = useState("");

  const [wantsWebsite, setWantsWebsite] = useState<boolean | null>(null);
  const [subdomain, setSubdomain]       = useState("");
  const [theme, setTheme]               = useState("emerald");
  const [social, setSocial] = useState({ instagram: "", facebook: "", twitter: "", youtube: "", whatsapp: "" });
  const [prayerSource, setPrayerSource] = useState<"auto" | "excel" | null>(null);
  const [prayerSettings, setPrayerSettings] = useState({
    city: "Toronto", country: "Canada", timezone: "America/Toronto", method: "ISNA",
  });

  useEffect(() => {
    const id   = sessionStorage.getItem("masjid_id")   || localStorage.getItem("masjid_id");
    const name = sessionStorage.getItem("masjid_name") || localStorage.getItem("masjid_name");
    if (!id) { navigate("/login", { replace: true }); return; }
    setMasjidId(id);
    setMasjidName(name || "Your Masjid");
    if (name) setSubdomain(name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20));
    // Fade in
    requestAnimationFrame(() => setTimeout(() => setVisible(true), 20));
  }, []);

  const goTo = (target: string) => {
    setLeaving(true);
    setTimeout(() => navigate(target, { replace: true }), 500);
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    if (!masjidId) return;
    setSaving(true);
    try {
      setSavingMsg("Saving settings…");
      await supabase.from("masjids").update({
        website_enabled:     wantsWebsite ?? false,
        subdomain:           wantsWebsite ? subdomain : null,
        theme,
        instagram:           social.instagram || null,
        facebook:            social.facebook  || null,
        twitter:             social.twitter   || null,
        youtube:             social.youtube   || null,
        whatsapp:            social.whatsapp  || null,
        onboarding_complete: true,
      }).eq("id", masjidId);

      if (prayerSource) {
        await supabase.from("prayer_settings").upsert({
          masjid_id: masjidId,
          source:    prayerSource === "auto" ? "backend" : "excel",
          city:      prayerSettings.city,
          country:   prayerSettings.country,
          timezone:  prayerSettings.timezone,
          method:    prayerSettings.method,
        }, { onConflict: "masjid_id" });
      }

      // Auto-calculate: geocode city → lat/lng → generate 365 days → store in DB
      if (prayerSource === "auto") {
        setSavingMsg("Geocoding location…");
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prayerSettings.city + ", " + prayerSettings.country)}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const geoData = await geo.json();
        if (!geoData || geoData.length === 0) throw new Error("Could not geocode city. Check city/country and try again.");

        const lat  = parseFloat(geoData[0].lat);
        const lng  = parseFloat(geoData[0].lon);
        const year = new Date().getFullYear();

        setSavingMsg("Calculating prayer times for the year…");
        const times = generateYearPrayerTimes(lat, lng, prayerSettings.timezone, prayerSettings.method, year);

        setSavingMsg(`Storing ${times.length} days of prayer times…`);
        // sunrise is excluded — not a column in prayer_times table
        const rows = times.map(({ sunrise: _s, ...t }) => ({ masjid_id: masjidId, ...t }));
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabase.from("prayer_times").upsert(rows.slice(i, i + 100), { onConflict: "masjid_id,date" });
          if (error) throw new Error(error.message);
        }
      }
    } catch (err: unknown) {
      // Still proceed to completion — show error in console, don't block user
      console.error("Onboarding finish error:", (err as Error).message);
    }

    setSaving(false);
    setCompleted(true);

    // Animate progress bar 0→100 over 1.8s
    const start = Date.now();
    const duration = 1800;
    const tick = () => {
      const p = Math.min(((Date.now() - start) / duration) * 100, 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Start collapse animation then navigate
    setTimeout(() => setLeaving(true), 2000);
    setTimeout(() => navigate("/home", { replace: true }), 2500);
  };

  const inputCls  = "w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors";
  const selectCls = "w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl font-medium text-white focus:outline-none focus:border-emerald-500/40 transition-colors";

  // ── Completion screen ──────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Full-page wrapper that collapses upward when leaving */}
        <div
          className="text-center max-w-sm w-full"
          style={{
            opacity:    leaving ? 0 : 1,
            transform:  leaving ? "scale(0.88) translateY(-40px)" : "scale(1) translateY(0)",
            transition: "opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Animated check */}
          <div className="relative w-24 h-24 mx-auto mb-7">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: "1.5s" }} />
            <div className="relative w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: "drawCheck 0.6s ease forwards" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Setup Complete</div>
          <h1 className="text-3xl font-black mb-2">You're all set, {masjidName.split(" ")[0]}!</h1>
          <p className="text-zinc-500 text-sm mb-8">Taking you to your dashboard…</p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main wizard ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6 py-12"
      style={{ opacity: leaving ? 0 : visible ? 1 : 0, transition: "opacity 0.5s ease" }}
    >
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
              </svg>
            </div>
            <span className="font-black text-lg">Jam3ah</span>
          </div>
          <StepDots current={step} />
        </div>

        <div
          className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8"
          style={{ transform: `translateY(${visible ? 0 : 16}px)`, transition: "transform 0.5s ease, opacity 0.5s ease" }}
        >
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
                </svg>
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">Welcome to Jam3ah</div>
              <h1 className="text-3xl font-black mb-3">{masjidName}</h1>
              <p className="text-zinc-400 text-base leading-relaxed mb-8">
                Your account is approved. Let's take 2 minutes to set up your masjid — website, theme, social media, and prayer times.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9", label: "Public Website" },
                  { icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", label: "Theme & Brand" },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Prayer Times" },
                ].map((f, i) => (
                  <div key={i} className="bg-zinc-800/40 border border-white/5 rounded-xl p-3 text-center">
                    <Icon d={f.icon} className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <div className="text-xs font-bold text-zinc-400">{f.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={next} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-lg transition-all">
                Let's Get Started →
              </button>
            </div>
          )}

          {/* ── Step 1: Website ── */}
          {step === 1 && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Step 1 of 4</div>
              <h2 className="text-2xl font-black mb-1">Public Website</h2>
              <p className="text-zinc-400 text-sm mb-6">Would you like a public-facing website for your community?</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { val: true,  label: "Yes, I want a website", sub: "Get a public site at jam3ah.com/yourmasjid", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
                  { val: false, label: "No, dashboard only",   sub: "Just use the admin dashboard for now",       icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" },
                ].map(opt => (
                  <button key={String(opt.val)} onClick={() => setWantsWebsite(opt.val)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${wantsWebsite === opt.val ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/10 bg-zinc-800/30 hover:border-white/20"}`}>
                    <Icon d={opt.icon} className={`w-6 h-6 mb-3 ${wantsWebsite === opt.val ? "text-emerald-400" : "text-zinc-500"}`} />
                    <div className="font-black text-sm mb-1">{opt.label}</div>
                    <div className="text-xs text-zinc-500">{opt.sub}</div>
                  </button>
                ))}
              </div>
              {wantsWebsite && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-zinc-300">Choose your subdomain</label>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold text-sm whitespace-nowrap">jam3ah.com/</span>
                    <input type="text" value={subdomain}
                      onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className={inputCls} placeholder="yourmasjid" />
                  </div>
                  {subdomain && <div className="mt-2 text-xs text-emerald-400 font-bold">✓ jam3ah.com/{subdomain}</div>}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={back} className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">Back</button>
                <button onClick={next} disabled={wantsWebsite === null || (wantsWebsite && !subdomain)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl font-black transition-all">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Theme ── */}
          {step === 2 && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Step 2 of 4</div>
              <h2 className="text-2xl font-black mb-1">Choose Your Theme</h2>
              <p className="text-zinc-400 text-sm mb-6">Pick an accent colour for your dashboard and website.</p>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.key ? "border-white/40 bg-white/5" : "border-white/5 hover:border-white/15"}`}>
                    <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: t.hex }} />
                    <span className="text-xs font-black text-zinc-400">{t.label}</span>
                    {theme === t.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
              <div className="bg-zinc-800/40 border border-white/5 rounded-xl p-4 mb-6">
                <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: THEMES.find(t => t.key === theme)?.hex + "33", border: `1px solid ${THEMES.find(t => t.key === theme)?.hex}55` }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={THEMES.find(t => t.key === theme)?.hex}>
                      <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-black text-sm">{masjidName}</div>
                    <div className="text-xs font-bold" style={{ color: THEMES.find(t => t.key === theme)?.hex }}>
                      {THEMES.find(t => t.key === theme)?.label} theme
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">Back</button>
                <button onClick={next} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black transition-all">Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Social Media ── */}
          {step === 3 && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Step 3 of 4</div>
              <h2 className="text-2xl font-black mb-1">Social Media</h2>
              <p className="text-zinc-400 text-sm mb-6">Add your handles so your community can follow you. All optional.</p>
              <div className="space-y-3 mb-6">
                {[
                  { key: "instagram", label: "Instagram",  placeholder: "@yourmasjid",       icon: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" },
                  { key: "facebook",  label: "Facebook",   placeholder: "yourmasjidpage",    icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { key: "twitter",   label: "X / Twitter",placeholder: "@yourmasjid",       icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                  { key: "youtube",   label: "YouTube",    placeholder: "YourMasjidChannel", icon: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
                  { key: "whatsapp",  label: "WhatsApp",   placeholder: "+1 416-555-0000",   icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
                ].map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800/50 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon d={field.icon} className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input type="text"
                      value={social[field.key as keyof typeof social]}
                      onChange={e => setSocial({ ...social, [field.key]: e.target.value })}
                      className={inputCls}
                      placeholder={`${field.label}: ${field.placeholder}`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">Back</button>
                <button onClick={next} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black transition-all">Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Prayer Times ── */}
          {step === 4 && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Step 4 of 4</div>
              <h2 className="text-2xl font-black mb-1">Prayer Times</h2>
              <p className="text-zinc-400 text-sm mb-6">How would you like to manage prayer times?</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { val: "auto",  label: "Auto-Calculate", sub: "We calculate based on your location and a calculation method of your choice.", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { val: "excel", label: "Upload Excel",   sub: "Upload a spreadsheet with your schedule. Ideal if you already have one prepared.",  icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setPrayerSource(opt.val as "auto" | "excel")}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${prayerSource === opt.val ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/10 bg-zinc-800/30 hover:border-white/20"}`}>
                    <Icon d={opt.icon} className={`w-6 h-6 mb-3 ${prayerSource === opt.val ? "text-emerald-400" : "text-zinc-500"}`} />
                    <div className="font-black text-sm mb-1">{opt.label}</div>
                    <div className="text-xs text-zinc-500 leading-relaxed">{opt.sub}</div>
                  </button>
                ))}
              </div>

              {prayerSource === "auto" && (
                <div className="space-y-3 mb-6 p-4 bg-zinc-800/30 border border-white/5 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">City</label>
                      <input type="text" value={prayerSettings.city}
                        onChange={e => setPrayerSettings({ ...prayerSettings, city: e.target.value })}
                        className={inputCls} placeholder="Toronto" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Country</label>
                      <input type="text" value={prayerSettings.country}
                        onChange={e => setPrayerSettings({ ...prayerSettings, country: e.target.value })}
                        className={inputCls} placeholder="Canada" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Timezone</label>
                    <select value={prayerSettings.timezone}
                      onChange={e => setPrayerSettings({ ...prayerSettings, timezone: e.target.value })}
                      className={selectCls}>
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Calculation Method</label>
                    <select value={prayerSettings.method}
                      onChange={e => setPrayerSettings({ ...prayerSettings, method: e.target.value })}
                      className={selectCls}>
                      {CALC_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {prayerSource === "excel" && (
                <div className="mb-6 p-4 bg-zinc-800/30 border border-white/5 rounded-xl">
                  <p className="text-sm text-zinc-400 mb-2">
                    Upload your Excel sheet from the <span className="text-emerald-400 font-bold">Prayer Times</span> tab in the dashboard anytime.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 shrink-0" />
                    Dashboard → Prayer Times → Upload Excel
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={back} className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">Back</button>
                <button onClick={handleFinish} disabled={saving || prayerSource === null}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl font-black transition-all">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {savingMsg}
                    </span>
                  ) : "Complete Setup →"}
                </button>
              </div>
            </div>
          )}
        </div>

        {step > 0 && !saving && (
          <div className="text-center mt-4">
            <button onClick={() => goTo("/home")} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-bold">
              Skip setup for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomePage;
