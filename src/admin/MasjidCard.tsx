import React from "react";
import { Icon } from "../dashboard/ui";
import Facts from "./Facts";
import StatusBadge from "./StatusBadge";
import { shortDate, type Masjid } from "./types";

interface MasjidCardProps {
  masjid: Masjid;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleSuspend: () => void;
  onDelete: () => void;
}

const MasjidCard: React.FC<MasjidCardProps> = ({ masjid, expanded, onToggleExpanded, onToggleSuspend, onDelete }) => {
  const active = masjid.status === "active";
  const panelId = `admin-more-${masjid.id}`;
  const socials = [
    { label: "Website", value: masjid.website_url },
    { label: "Instagram", value: masjid.instagram },
    { label: "Facebook", value: masjid.facebook },
    { label: "Twitter", value: masjid.twitter },
    { label: "YouTube", value: masjid.youtube },
    { label: "WhatsApp", value: masjid.whatsapp },
  ].filter(s => s.value);

  return (
    <article className="d-card d-card--clip" aria-labelledby={`admin-m-${masjid.id}`}>
      <div className="admin-item">
        <div className="admin-item-body">
          <div className="d-row d-row--wrap" style={{ gap: 10 }}>
            <h3 id={`admin-m-${masjid.id}`} className="d-h3">{masjid.masjid_name}</h3>
            <StatusBadge status={masjid.status} />
            {masjid.onboarding_complete && <span className="d-badge">Set-up finished</span>}
          </div>
          <Facts items={[
            { label: "Email", value: masjid.masjid_email },
            { label: "Phone", value: masjid.masjid_phone },
            { label: "Address", value: masjid.address },
            { label: "Person in charge", value: masjid.incharge_name },
          ]} />
          <span className="d-faint d-small">Joined {shortDate(masjid.created_at)}</span>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="d-btn d-btn--secondary d-btn--sm"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={onToggleExpanded}
          >
            <Icon name={expanded ? "expand_less" : "expand_more"} />
            {expanded ? "Hide details" : "Show details"}
          </button>
          <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={onToggleSuspend} aria-label={`${active ? "Suspend" : "Reactivate"} ${masjid.masjid_name}`}>
            <Icon name={active ? "pause_circle" : "play_circle"} />
            {active ? "Suspend" : "Reactivate"}
          </button>
          <button type="button" className="d-btn d-btn--ghost d-btn--sm admin-btn-danger" onClick={onDelete} aria-label={`Delete ${masjid.masjid_name}`}>
            <Icon name="delete" />
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div id={panelId} className="admin-more">
          <section className="d-stack" style={{ gap: 12 }}>
            <h4 className="admin-more-h">Location</h4>
            <Facts columns={3} items={[
              { label: "City", value: masjid.city },
              { label: "Province", value: masjid.province },
              { label: "Postal code", value: masjid.postal_code },
              { label: "Country", value: masjid.country },
              { label: "Latitude", value: masjid.latitude, numeric: true },
              { label: "Longitude", value: masjid.longitude, numeric: true },
            ]} />
          </section>

          <section className="d-stack" style={{ gap: 12 }}>
            <h4 className="admin-more-h">Contact</h4>
            <Facts columns={3} items={[
              { label: "Phone of person in charge", value: masjid.incharge_phone },
              { label: "Masjid email", value: masjid.masjid_email },
              { label: "Masjid phone", value: masjid.masjid_phone },
            ]} />
          </section>

          <section className="d-stack" style={{ gap: 12 }}>
            <h4 className="admin-more-h">Platform</h4>
            <Facts columns={4} items={[
              { label: "Theme", value: masjid.theme },
              { label: "Subdomain", value: masjid.subdomain },
              { label: "Website turned on", value: masjid.website_enabled ? "Yes" : "No" },
              { label: "Set-up finished", value: masjid.onboarding_complete ? "Yes" : "No" },
            ]} />
          </section>

          {socials.length > 0 && (
            <section className="d-stack" style={{ gap: 12 }}>
              <h4 className="admin-more-h">Website and social media</h4>
              <div className="d-row d-row--wrap" style={{ gap: 8 }}>
                {socials.map(s => (
                  <a
                    key={s.label}
                    className="admin-chip"
                    href={s.value!.startsWith("http") ? s.value! : `https://${s.value!}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.label}
                    <Icon name="open_in_new" size={18} />
                    <span className="d-sr-only">(opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="d-stack" style={{ gap: 12 }}>
            <h4 className="admin-more-h">Reference numbers</h4>
            <dl className="admin-ids">
              <div><dt>Masjid ID</dt><dd><code className="admin-code">{masjid.id}</code></dd></div>
              <div><dt>User ID</dt><dd><code className="admin-code">{masjid.user_id}</code></dd></div>
            </dl>
          </section>
        </div>
      )}
    </article>
  );
};

export default MasjidCard;
