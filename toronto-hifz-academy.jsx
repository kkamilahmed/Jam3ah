import { useState, useEffect } from "react";

const PRAYER_TIMES = {
  fajr: "5:47 AM",
  sunrise: "7:14 AM",
  dhuhr: "12:29 PM",
  asr: "3:41 PM",
  maghrib: "5:58 PM",
  isha: "7:28 PM",
};

const CLASSES = [
  {
    id: 1,
    name: "Hifz Program",
    level: "Core",
    age: "6–16",
    schedule: "Mon–Fri",
    time: "4:00 PM – 7:00 PM",
    description:
      "Our flagship Quran memorization program. Students memorize the entire Quran under the guidance of certified Huffaz with decades of teaching experience.",
    spots: 8,
    color: "emerald",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    id: 2,
    name: "Tajweed & Recitation",
    level: "Beginner–Advanced",
    age: "8+",
    schedule: "Sat & Sun",
    time: "10:00 AM – 12:00 PM",
    description:
      "Learn the rules of Tajweed (proper Quranic recitation) from foundational Makharij to advanced rules of Ghunna, Madd, and Waqf.",
    spots: 14,
    color: "amber",
    icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  },
  {
    id: 3,
    name: "Weekend Islamic School",
    level: "All Levels",
    age: "5–14",
    schedule: "Saturdays",
    time: "9:00 AM – 1:00 PM",
    description:
      "A comprehensive Islamic studies curriculum covering Fiqh, Seerah, Aqeedah, and Arabic language — equipping children with a strong Islamic identity.",
    spots: 20,
    color: "sky",
    icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
  },
  {
    id: 4,
    name: "Arabic Language",
    level: "Beginner–Intermediate",
    age: "10+",
    schedule: "Tue & Thu",
    time: "6:30 PM – 8:00 PM",
    description:
      "Classical Arabic (Fusha) instruction for understanding the Quran and Islamic texts. Covers grammar (Nahw), morphology (Sarf), and reading comprehension.",
    spots: 12,
    color: "violet",
    icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
  },
  {
    id: 5,
    name: "Sisters Hifz Circle",
    level: "Core",
    age: "16+",
    schedule: "Mon, Wed & Fri",
    time: "9:30 AM – 11:30 AM",
    description:
      "A dedicated Hifz program for sisters in a nurturing, women-only environment led by experienced female Hafizaat. Morning sessions fit around family schedules.",
    spots: 5,
    color: "rose",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const DONATE_TIERS = [
  { amount: 25, label: "Supporter", perks: "Monthly newsletter + du'a list" },
  { amount: 100, label: "Contributor", perks: "Named in weekly Jummah du'a" },
  { amount: 250, label: "Benefactor", perks: "Certificate of contribution + recognition" },
  { amount: 500, label: "Patron", perks: "Plaque in masjid + annual event invitation" },
];

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
    dot: "bg-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    dot: "bg-amber-400",
  },
  sky: {
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    text: "text-sky-400",
    badge: "bg-sky-500/20 text-sky-400",
    dot: "bg-sky-400",
  },
  violet: {
    bg: "bg-violet-500/15",
    border: "border-violet-500/40",
    text: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-400",
    dot: "bg-violet-400",
  },
  rose: {
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-400",
    dot: "bg-rose-400",
  },
};

// ── Geometric Islamic pattern SVG ──────────────────────────────────────────
const IslamicPattern = ({ opacity = 0.04 }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity }}
  >
    <defs>
      <pattern id="islamic" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#34d399" strokeWidth="0.8">
          <polygon points="40,4 52,16 52,36 40,48 28,36 28,16" />
          <polygon points="40,4 76,22 76,58 40,76 4,58 4,22" />
          <line x1="40" y1="4" x2="40" y2="76" />
          <line x1="4" y1="22" x2="76" y2="58" />
          <line x1="4" y1="58" x2="76" y2="22" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic)" />
  </svg>
);

// ── Crescent Moon Icon ─────────────────────────────────────────────────────
const CrescentIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
  </svg>
);

// ── Nav ────────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = ["Home", "Classes", "Donate"];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "bg-zinc-950/95 backdrop-blur-xl border-b border-emerald-900/40 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => setPage("Home")} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
            <CrescentIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="text-base font-black tracking-tight text-white leading-tight">Toronto Hifz</div>
            <div className="text-xs text-emerald-500 font-bold tracking-widest uppercase">Academy</div>
          </div>
        </button>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l}
              onClick={() => setPage(l)}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                page === l
                  ? "bg-emerald-500 text-black"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// ── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ setPage }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const prayers = [
    { name: "Fajr", time: PRAYER_TIMES.fajr, arabic: "الفجر" },
    { name: "Dhuhr", time: PRAYER_TIMES.dhuhr, arabic: "الظهر" },
    { name: "Asr", time: PRAYER_TIMES.asr, arabic: "العصر" },
    { name: "Maghrib", time: PRAYER_TIMES.maghrib, arabic: "المغرب" },
    { name: "Isha", time: PRAYER_TIMES.isha, arabic: "العشاء" },
  ];

  // Determine next prayer (simplified)
  const nextPrayer = "Maghrib";

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <IslamicPattern opacity={0.06} />

        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          {/* Arabic */}
          <div className="text-5xl font-black text-emerald-400/60 mb-4 tracking-wider" style={{ fontFamily: "serif", direction: "rtl" }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold mb-6 tracking-widest uppercase">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Toronto, Ontario · Est. 2011
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">
            <span className="text-white">Toronto</span>{" "}
            <span className="text-emerald-400">Hifz</span>
            <br />
            <span className="text-white">Academy</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Nurturing the next generation of Huffaz and Islamic scholars in the heart of Toronto. Join our community of over 300 students.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setPage("Classes")}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all hover:scale-105"
            >
              Explore Classes
            </button>
            <button
              onClick={() => setPage("Donate")}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/10 font-bold rounded-xl transition-all"
            >
              Support Us
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* DATE & CLOCK BAR */}
      <section className="bg-zinc-900/60 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Today</div>
              <div className="text-white font-black text-lg">{dateStr}</div>
            </div>
          </div>
          <div className="text-4xl font-black text-emerald-400 tabular-nums tracking-tight">{timeStr}</div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="text-sm text-zinc-400 font-bold">
              Next: <span className="text-emerald-400">{nextPrayer} · {PRAYER_TIMES.maghrib}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRAYER TIMES */}
      <section className="py-20 px-6 relative">
        <IslamicPattern opacity={0.03} />
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-2">Daily Schedule</div>
              <h2 className="text-4xl font-black">Prayer Times</h2>
            </div>
            <div className="text-right text-zinc-500 text-sm font-medium">
              <div>Toronto, ON</div>
              <div className="text-zinc-600">Calculated: ISNA</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {prayers.map((p, i) => {
              const isNext = p.name === nextPrayer;
              return (
                <div
                  key={p.name}
                  className={`relative rounded-2xl p-6 border-2 transition-all text-center ${
                    isNext
                      ? "bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-500/30"
                      : "bg-zinc-900/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  {isNext && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-xs font-black rounded-full whitespace-nowrap">
                      Next
                    </div>
                  )}
                  <div className="text-2xl mb-2 text-zinc-500" style={{ fontFamily: "serif" }}>{p.arabic}</div>
                  <div className={`text-sm font-bold mb-3 ${isNext ? "text-emerald-400" : "text-zinc-400"}`}>{p.name}</div>
                  <div className={`text-2xl font-black tabular-nums ${isNext ? "text-white" : "text-zinc-200"}`}>{p.time}</div>
                </div>
              );
            })}
          </div>

          {/* Sunrise */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-amber-400 font-bold text-sm">Sunrise: {PRAYER_TIMES.sunrise}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / STATS */}
      <section className="py-20 px-6 bg-zinc-900/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-3">Our Mission</div>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                Preserving the Quran,<br />
                <span className="text-emerald-400">One Heart at a Time</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Toronto Hifz Academy has been a cornerstone of the Muslim community since 2011. Our certified teachers and structured curriculum have produced over 80 Huffaz — each one a living vessel of Allah's words.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                We offer full and part-time Hifz programs, Tajweed classes, Arabic language courses, and weekend Islamic school for all ages.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Huffaz Graduated", value: "80+", color: "emerald" },
                { label: "Active Students", value: "320+", color: "sky" },
                { label: "Years of Service", value: "13", color: "amber" },
                { label: "Certified Teachers", value: "12", color: "violet" },
              ].map((s) => (
                <div key={s.label} className={`p-6 rounded-2xl bg-zinc-900 border-2 border-white/5`}>
                  <div className={`text-4xl font-black mb-2 ${colorMap[s.color]?.text}`}>{s.value}</div>
                  <div className="text-sm text-zinc-500 font-bold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-2">Calendar</div>
          <h2 className="text-4xl font-black mb-10">Upcoming Events</h2>
          <div className="space-y-4">
            {[
              { title: "Hifz Graduation Ceremony 2026", date: "Mar 15, 2026", time: "6:00 PM", tag: "Special Event" },
              { title: "Open House – New Student Registration", date: "Mar 8, 2026", time: "10:00 AM", tag: "Registration" },
              { title: "Tajweed Workshop with Sheikh Yusuf", date: "Mar 22, 2026", time: "2:00 PM", tag: "Workshop" },
              { title: "Sisters Fundraising Dinner", date: "Apr 5, 2026", time: "7:00 PM", tag: "Fundraiser" },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-6 p-5 bg-zinc-900/60 border border-white/5 hover:border-emerald-500/20 rounded-2xl transition-all group">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-all">
                  <div className="text-emerald-400 text-xs font-black uppercase">{ev.date.split(" ")[0]}</div>
                  <div className="text-white text-2xl font-black leading-none">{ev.date.split(" ")[1].replace(",", "")}</div>
                </div>
                <div className="flex-1">
                  <div className="font-black text-lg mb-1">{ev.title}</div>
                  <div className="text-zinc-500 text-sm font-bold">{ev.time}</div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold">
                  {ev.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5" />
        <IslamicPattern opacity={0.06} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">Ready to Begin?</h2>
          <p className="text-zinc-400 text-xl mb-10">Enroll today and become part of a thriving community dedicated to the Quran.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setPage("Classes")} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all hover:scale-105">
              View All Classes
            </button>
            <button onClick={() => setPage("Donate")} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 font-bold rounded-xl transition-all">
              Make a Donation
            </button>
          </div>
        </div>
      </section>

      <Footer setPage={setPage} />
    </div>
  );
};

// ── CLASSES PAGE ──────────────────────────────────────────────────────────
const ClassesPage = ({ setPage }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* Header */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <IslamicPattern opacity={0.05} />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-3">Programs</div>
          <h1 className="text-6xl font-black mb-6">Our Classes</h1>
          <p className="text-zinc-400 text-xl max-w-2xl">
            Programs for every age and level — from young students beginning their Hifz journey to adults deepening their Quranic knowledge.
          </p>
        </div>
      </section>

      {/* Filter pills */}
      <div className="px-6 pb-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-3">
          {["All Programs", "Hifz", "Tajweed", "Arabic", "Weekend School"].map((f) => (
            <button key={f} className={`px-5 py-2.5 rounded-lg font-bold text-sm border-2 transition-all ${
              f === "All Programs" ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Classes grid */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-6">
          {CLASSES.map((cls) => {
            const c = colorMap[cls.color];
            const isOpen = selected === cls.id;
            return (
              <div
                key={cls.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  isOpen ? `${c.border} ${c.bg}` : "border-white/5 bg-zinc-900/60 hover:border-white/10"
                }`}
              >
                <button
                  className="w-full text-left p-7"
                  onClick={() => setSelected(isOpen ? null : cls.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <svg className={`w-7 h-7 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cls.icon} />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-black">{cls.name}</h3>
                          <span className={`px-3 py-1 text-xs font-black rounded-full ${c.badge}`}>{cls.level}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-bold">
                          <span>Ages {cls.age}</span>
                          <span>·</span>
                          <span>{cls.schedule}</span>
                          <span>·</span>
                          <span>{cls.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-sm font-black ${cls.spots < 8 ? "text-amber-400" : "text-emerald-400"}`}>
                          {cls.spots} spots left
                        </div>
                        <div className="text-xs text-zinc-600">Open enrollment</div>
                      </div>
                      <div className={`w-8 h-8 rounded-full ${c.bg} border ${c.border} flex items-center justify-center transition-transform ${isOpen ? "rotate-180" : ""}`}>
                        <svg className={`w-4 h-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-7 pb-7 border-t border-white/5">
                    <p className="text-zinc-300 leading-relaxed mt-6 mb-6 text-lg">{cls.description}</p>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Schedule", value: cls.schedule },
                        { label: "Time", value: cls.time },
                        { label: "Ages", value: cls.age },
                      ].map((d) => (
                        <div key={d.label} className="p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{d.label}</div>
                          <div className="font-black text-white">{d.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button className={`px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all`}>
                        Register Now
                      </button>
                      <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 font-bold rounded-xl transition-all">
                        Contact for Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="py-16 px-6 bg-zinc-900/40 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black mb-2">Have questions about registration?</h3>
            <p className="text-zinc-400">Our admin team is available Sat–Thu, 9 AM – 8 PM.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all">
              Contact Us
            </button>
            <button onClick={() => setPage("Donate")} className="px-6 py-3 bg-white/5 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-all">
              Support a Student
            </button>
          </div>
        </div>
      </section>

      <Footer setPage={setPage} />
    </div>
  );
};

// ── DONATE PAGE ───────────────────────────────────────────────────────────
const DonatePage = () => {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState(DONATE_TIERS[1]);
  const [frequency, setFrequency] = useState("monthly");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;

  const handleSelect = (tier) => {
    setSelectedTier(tier);
    setSelectedAmount(tier.amount);
    setCustomAmount("");
  };

  const handleSubmit = () => {
    if (!name || !email) { alert("Please fill in your name and email."); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-zinc-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-black mb-4">JazakAllah Khair!</h2>
          <p className="text-zinc-400 text-xl mb-2">Your ${finalAmount} {frequency} donation has been received.</p>
          <p className="text-zinc-500 mb-8">May Allah accept your generosity and multiply your reward. 🤲</p>
          <button onClick={() => setSubmitted(false)} className="px-8 py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all">
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* Header */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <IslamicPattern opacity={0.05} />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-3">Sadaqah Jariyah</div>
          <h1 className="text-6xl font-black mb-6">
            Support the<br />
            <span className="text-emerald-400">Quran's Future</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Every dollar you give goes toward scholarships, teacher salaries, and facility upkeep — a continuous charity that earns you reward long after you give.
          </p>
        </div>
      </section>

      {/* Impact stats */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { value: "$25/mo", desc: "Covers materials for one student", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
            { value: "$100/mo", desc: "Sponsors a full scholarship seat", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { value: "$500/mo", desc: "Funds a teacher's monthly salary", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          ].map((s, i) => (
            <div key={i} className="p-6 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
              <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                </svg>
              </div>
              <div className="text-2xl font-black text-emerald-400 mb-2">{s.value}</div>
              <div className="text-zinc-500 text-sm font-bold">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Donation form */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/80 border-2 border-white/10 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-8">Make a Donation</h2>

            {/* Frequency */}
            <div className="mb-8">
              <label className="text-sm font-black text-zinc-400 uppercase tracking-widest block mb-3">Frequency</label>
              <div className="grid grid-cols-2 gap-3">
                {["one-time", "monthly"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${
                      frequency === f ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/10 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {f === "one-time" ? "One-Time" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiers */}
            <div className="mb-8">
              <label className="text-sm font-black text-zinc-400 uppercase tracking-widest block mb-3">Choose Amount</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DONATE_TIERS.map((tier) => (
                  <button
                    key={tier.amount}
                    onClick={() => handleSelect(tier)}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${
                      selectedTier?.amount === tier.amount && !customAmount
                        ? "bg-emerald-500/20 border-emerald-500/60"
                        : "border-white/5 bg-zinc-800/60 hover:border-white/10"
                    }`}
                  >
                    <div className="text-2xl font-black text-white mb-1">${tier.amount}</div>
                    <div className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">{tier.label}</div>
                    <div className="text-xs text-zinc-500 font-medium">{tier.perks}</div>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${customAmount ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/5 bg-zinc-800/60"}`}>
                <span className="text-2xl font-black text-zinc-400">$</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedTier(null); }}
                  className="flex-1 bg-transparent text-white text-xl font-black outline-none placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Personal info */}
            <div className="mb-8 space-y-4">
              <div>
                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest block mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/10 focus:border-emerald-500 rounded-xl text-white font-medium outline-none placeholder-zinc-600 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest block mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/10 focus:border-emerald-500 rounded-xl text-white font-medium outline-none placeholder-zinc-600 transition-all"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-black text-white">
                    ${finalAmount} {frequency}
                  </div>
                  {selectedTier && !customAmount && (
                    <div className="text-xs text-emerald-400 font-bold mt-1">{selectedTier.perks}</div>
                  )}
                </div>
                <div className="text-emerald-400">
                  {frequency === "monthly" ? `$${finalAmount * 12}/yr` : "One-time"}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={finalAmount === 0}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                finalAmount > 0
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.01]"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Donate ${finalAmount || 0} {frequency === "monthly" ? "/ Month" : ""}
            </button>

            <p className="text-center text-zinc-600 text-sm mt-4">
              🔒 Secure payment · Toronto Hifz Academy is a registered charity
            </p>
          </div>

          {/* Hadith */}
          <div className="mt-8 p-6 bg-zinc-900/40 border border-white/5 rounded-2xl text-center">
            <p className="text-zinc-400 italic text-lg leading-relaxed mb-2">
              "The best of you are those who learn the Quran and teach it."
            </p>
            <p className="text-emerald-500 font-bold text-sm">— Prophet Muhammad ﷺ (Sahih al-Bukhari)</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// ── FOOTER ────────────────────────────────────────────────────────────────
const Footer = ({ setPage = () => {} }) => (
  <footer className="bg-zinc-950 border-t border-white/5 py-16 px-6">
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-12 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <CrescentIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-black text-white">Toronto Hifz Academy</div>
              <div className="text-xs text-emerald-500 font-bold tracking-widest">Est. 2011</div>
            </div>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Dedicated to preserving the Book of Allah and nurturing future Huffaz in Toronto and the Greater Toronto Area.
          </p>
        </div>
        <div>
          <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-4">Quick Links</div>
          <div className="space-y-2">
            {["Home", "Classes", "Donate"].map((l) => (
              <button key={l} onClick={() => setPage(l)} className="block text-zinc-400 hover:text-emerald-400 font-bold text-sm transition-colors">
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-4">Contact</div>
          <div className="space-y-2 text-sm text-zinc-400 font-medium">
            <div>📍 123 Islington Ave, Toronto, ON</div>
            <div>📞 (416) 555-0194</div>
            <div>✉️ info@torontohifz.ca</div>
            <div>🕐 Sat–Thu: 9 AM – 8 PM</div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 pt-8 flex items-center justify-between text-zinc-600 text-sm">
        <span>© 2026 Toronto Hifz Academy. All rights reserved.</span>
        <span className="text-emerald-600/50 font-bold">الحمد لله</span>
      </div>
    </div>
  </footer>
);

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Home");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div>
      <Nav page={page} setPage={setPage} />
      {page === "Home" && <HomePage setPage={setPage} />}
      {page === "Classes" && <ClassesPage setPage={setPage} />}
      {page === "Donate" && <DonatePage setPage={setPage} />}
    </div>
  );
}
