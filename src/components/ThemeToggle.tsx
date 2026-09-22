import React from "react";

// Shared light/dark toggle for the pre-dashboard pages (signup, login, onboarding).
// Reuses the same `app_theme` localStorage key + `data-theme` attribute the
// dashboard already uses (see HomePage / main.tsx), so the choice carries through
// the whole app.
const ThemeToggle: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [dark, setDark] = React.useState<boolean>(
    () => localStorage.getItem("app_theme") !== "light",
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("app_theme");
    } else {
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("app_theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-high)", border: "1px solid var(--outline)", borderRadius: 2,
        color: "var(--on-surface-variant)", cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
        ...style,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)"; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
        {dark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;
