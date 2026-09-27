import { useNavigate } from "react-router-dom";
import { Icon } from "../dashboard/ui";
import { useDashTheme } from "../dashboard/theme";
import PublicHeader from "./PublicHeader";
import "./PublicPages.css";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { dark, toggle, themeAttr } = useDashTheme();

  return (
    <div className="dash" data-dash-theme={themeAttr}>
      <a href="#main" className="d-sr-only">Skip to content</a>
      <PublicHeader dark={dark} onToggleTheme={toggle} />

      <main id="main" className="pub-auth">
        <div className="pub-auth-inner pub-auth-inner--mid">
          <div className="d-card nf-card">
            <div className="pub-icon-chip"><Icon name="explore_off" /></div>
            <h1 className="d-h1">We can't find that page</h1>
            <p className="d-sub">
              The link may be old or mistyped. You can go back, or open your dashboard or the home page.
            </p>
            <div className="lp-actions">
              <button type="button" className="d-btn d-btn--secondary" onClick={() => navigate(-1)}>
                <Icon name="arrow_back" />
                Go back
              </button>
              <button type="button" className="d-btn d-btn--primary" onClick={() => navigate("/home")}>
                <Icon name="dashboard" />
                Open my dashboard
              </button>
            </div>
            <button type="button" className="d-link" onClick={() => navigate("/")}>
              Go to the Jam3ah home page
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
