import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../dashboard/ui";
import { useDashTheme } from "../dashboard/theme";
import PublicHeader from "./PublicHeader";
import "./PublicPages.css";

const STATS = [
  { value: "120+", label: "Masjids registered" },
  { value: "50K+", label: "Community members" },
  { value: "10K+", label: "Events shared" },
];

const FEATURES = [
  { icon: "schedule", title: "Prayer times", desc: "Upload your monthly timetable or let us work it out from your location. Set iqama times once." },
  { icon: "calendar_month", title: "Events", desc: "Share Friday talks, classes and fundraisers so everyone knows what is on." },
  { icon: "campaign", title: "Announcements", desc: "Post news in a minute and your community sees it straight away." },
  { icon: "tv", title: "TV screen", desc: "Show prayer times and news on a screen in the masjid. It updates by itself." },
  { icon: "group", title: "Your community", desc: "People follow your masjid and get your updates without you chasing them." },
  { icon: "verified", title: "Checked masjids", desc: "We review every masjid before it joins, so people can trust what they see." },
];

const STEPS = [
  { title: "Register your masjid", desc: "Fill in a short form about your masjid. It takes a few minutes." },
  { title: "We check your details", desc: "Our team reviews your request and emails you your sign-in details." },
  { title: "Start sharing", desc: "Sign in, add your prayer times and post your first announcement." },
];

// A sample of what a masjid's page shows. Illustration only.
const SAMPLE = [
  { name: "Fajr", time: "5:52 AM", iqama: "6:22 AM" },
  { name: "Dhuhr", time: "1:09 PM", iqama: "1:39 PM", next: true },
  { name: "Asr", time: "4:26 PM", iqama: "4:56 PM" },
  { name: "Maghrib", time: "7:05 PM", iqama: "7:08 PM" },
  { name: "Isha", time: "8:24 PM", iqama: "8:54 PM" },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { dark, toggle, themeAttr } = useDashTheme();

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  return (
    <div className="dash" data-dash-theme={themeAttr}>
      <a href="#main" className="d-sr-only">Skip to content</a>
      <PublicHeader dark={dark} onToggleTheme={toggle}>
        <Link to="/login" className="d-btn d-btn--secondary d-btn--sm">Sign in</Link>
        <Link to="/signup" className="d-btn d-btn--primary d-btn--sm pub-hide-mobile">Register your masjid</Link>
      </PublicHeader>

      <main id="main">
        <section className="lp-wrap lp-hero" aria-labelledby="lp-title">
          <div className="lp-hero-text">
            <span className="d-badge lp-badge"><Icon name="mosque" />For masjid teams and volunteers</span>
            <h1 id="lp-title" className="d-h1 lp-title">
              Your masjid, <span className="lp-title-accent">in one place.</span>
            </h1>
            <p className="lp-lead">
              Keep prayer times, events and announcements up to date for your whole community. Simple enough for anyone on your team.
            </p>
            <div className="lp-actions">
              <Link to="/signup" className="d-btn d-btn--primary">Register your masjid</Link>
              <Link to="/login" className="d-btn d-btn--secondary">Sign in to your dashboard</Link>
            </div>
          </div>

          <div className="d-card d-card--clip lp-preview" aria-label="Example of the prayer times your community sees">
            <div className="lp-preview-head">
              <span className="d-h3">Today's prayer times</span>
              <span className="d-muted d-small">Example of what your community sees</span>
            </div>
            {SAMPLE.map(p => (
              <div key={p.name} className={`lp-prow${p.next ? " is-next" : ""}`}>
                <div className="d-stack" style={{ gap: 0 }}>
                  <span className="d-pname">{p.name}</span>
                  {p.next && <span className="d-ptag">Next prayer</span>}
                </div>
                <div className="d-stack" style={{ gap: 0, alignItems: "flex-end" }}>
                  <span className="d-ptime d-ptime--strong">{p.iqama}</span>
                  <span className="d-prule">Adhan {p.time}</span>
                </div>
              </div>
            ))}
            <p className="lp-preview-note">
              <Icon name="campaign" />
              <span><strong>Friday talk after Isha.</strong> Everyone is welcome.</span>
            </p>
          </div>
        </section>

        <div className="lp-band">
          <ul className="lp-wrap lp-stats" aria-label="Jam3ah in numbers">
            {STATS.map(s => (
              <li key={s.label}>
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <section className="lp-wrap lp-section" aria-labelledby="lp-features">
          <div className="lp-section-head">
            <h2 id="lp-features" className="d-h2 lp-section-title">Everything your masjid needs</h2>
            <p className="d-sub">One simple dashboard for the jobs you do every week.</p>
          </div>
          <div className="d-grid-3" style={{ gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="d-card d-card-pad lp-feature">
                <div className="pub-icon-chip"><Icon name={f.icon} /></div>
                <h3 className="d-h3">{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-band">
          <section className="lp-wrap lp-section" aria-labelledby="lp-how">
            <div className="lp-section-head">
              <h2 id="lp-how" className="d-h2 lp-section-title">How to get started</h2>
              <p className="d-sub">Most masjids are up and running within a day.</p>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="lp-step">
                  <span className="pub-step" aria-hidden="true">{i + 1}</span>
                  <h3 className="d-h3"><span className="d-sr-only">Step {i + 1}: </span>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="lp-wrap lp-section" aria-labelledby="lp-cta">
          <div className="d-card lp-cta">
            <h2 id="lp-cta" className="d-h2 lp-section-title">Ready to bring your community together?</h2>
            <p className="d-sub">Masjids across North America use Jam3ah to keep everyone informed.</p>
            <div className="lp-actions">
              <Link to="/signup" className="d-btn d-btn--primary">Register your masjid</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="pub-footer">© 2026 Jam3ah · Made for Muslim communities</footer>
    </div>
  );
};

export default LandingPage;
