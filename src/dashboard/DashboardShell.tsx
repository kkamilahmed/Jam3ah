import React from "react";
import { Icon, ThemeToggle } from "./ui";

export const DASHBOARD_TABS = [
  { id: "overview", label: "Home", short: "Home", icon: "home" },
  { id: "prayer-times", label: "Prayer times", short: "Prayer", icon: "schedule" },
  { id: "events", label: "Announcements & events", short: "News", icon: "campaign" },
  { id: "settings", label: "Settings", short: "Settings", icon: "settings" },
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number]["id"];

interface DashboardShellProps {
  masjidName: string;
  activeTab: DashboardTab;
  onNavigate: (tab: DashboardTab) => void;
  dark: boolean;
  onToggleTheme: () => void;
  onOpenTv: () => void;
  onHelp: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  masjidName, activeTab, onNavigate, dark, onToggleTheme, onOpenTv, onHelp, onSignOut, children,
}) => (
  <div className="dash" data-dash-theme={dark ? "dark" : "light"}>
    <a href="#dash-main" className="d-sr-only">Skip to content</a>
    <header className="d-header">
      <div className="d-brand">
        <div className="d-brand-mark" aria-hidden="true"><Icon name="mosque" /></div>
        <div className="d-stack d-brand-text" style={{ gap: 0, minWidth: 0 }}>
          <span className="d-brand-name">{masjidName}</span>
          <span className="d-brand-sub">Jam3ah dashboard</span>
        </div>
      </div>

      <nav className="d-nav" aria-label="Main" data-tour="nav-tabs">
        {DASHBOARD_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            data-tour={`tab-${t.id}`}
            className={`d-nav-item${activeTab === t.id ? " is-active" : ""}`}
            aria-current={activeTab === t.id ? "page" : undefined}
            onClick={() => onNavigate(t.id)}
          >
            <Icon name={t.icon} />
            {t.id === "events" ? (
              <>
                <span className="d-nav-label-long">{t.label}</span>
                <span className="d-nav-label-short" aria-hidden="true">{t.short}</span>
              </>
            ) : t.label}
          </button>
        ))}
      </nav>

      <div className="d-header-actions" style={{ marginLeft: "auto" }}>
        <button type="button" className="d-btn d-btn--secondary d-btn--sm d-hide-mobile" onClick={onOpenTv} aria-label="Open the TV screen">
          <Icon name="tv" /><span className="d-collapse-label">TV screen</span>
        </button>
        <button type="button" className="d-btn d-btn--ghost d-btn--icon" data-tour="tour-btn" onClick={onHelp} aria-label="Show me around">
          <Icon name="help" />
        </button>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <button type="button" className="d-btn d-btn--ghost d-btn--sm" onClick={onSignOut} aria-label="Sign out">
          <Icon name="logout" /><span className="d-collapse-label">Sign out</span>
        </button>
      </div>
    </header>

    <main id="dash-main">{children}</main>

    <nav className="d-bottom-nav" aria-label="Main">
      {DASHBOARD_TABS.map(t => (
        <button
          key={t.id}
          type="button"
          className={activeTab === t.id ? "is-active" : undefined}
          aria-current={activeTab === t.id ? "page" : undefined}
          onClick={() => onNavigate(t.id)}
        >
          <Icon name={t.icon} />
          {t.short}
        </button>
      ))}
    </nav>
  </div>
);

export default DashboardShell;
