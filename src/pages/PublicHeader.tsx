import React from "react";
import { Link } from "react-router-dom";
import { Icon, ThemeToggle } from "../dashboard/ui";
import "./PublicPages.css";

// Top bar shared by the landing, sign in, register and not-found pages.
const PublicHeader: React.FC<{ dark: boolean; onToggleTheme: () => void; children?: React.ReactNode }> = ({
  dark, onToggleTheme, children,
}) => (
  <header className="d-header">
    <Link to="/" className="d-brand pub-brand" aria-label="Jam3ah home page">
      <div className="d-brand-mark" aria-hidden="true"><Icon name="mosque" /></div>
      <span className="d-brand-name">Jam3ah</span>
    </Link>
    <div className="d-header-actions pub-header-actions">
      <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      {children}
    </div>
  </header>
);

export default PublicHeader;
