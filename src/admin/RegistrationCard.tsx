import React from "react";
import { Icon, Spinner } from "../dashboard/ui";
import Facts from "./Facts";
import { dateTime, type Registration } from "./types";

interface RegistrationCardProps {
  reg: Registration;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}

const RegistrationCard: React.FC<RegistrationCardProps> = ({ reg, busy, onApprove, onReject, onDelete }) => (
  <article className="d-card" aria-labelledby={`admin-r-${reg.id}`}>
    <div className="admin-item">
      <div className="admin-item-body">
        <h3 id={`admin-r-${reg.id}`} className="d-h3">{reg.masjid_name}</h3>
        <Facts items={[
          { label: "Email", value: reg.masjid_email },
          { label: "Phone", value: reg.masjid_phone },
          { label: "Address", value: reg.address },
          { label: "Person in charge", value: reg.incharge_name },
        ]} />
        <span className="d-faint d-small">Sent {dateTime(reg.created_at)}</span>
      </div>

      <div className="admin-actions">
        <button type="button" className="d-btn d-btn--primary d-btn--sm" onClick={onApprove} disabled={busy} aria-label={`Approve ${reg.masjid_name}`}>
          {busy ? <Spinner /> : <Icon name="check" />}
          {busy ? "Working…" : "Approve"}
        </button>
        <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={onReject} disabled={busy} aria-label={`Reject ${reg.masjid_name}`}>
          <Icon name="close" />
          Reject
        </button>
        <button type="button" className="d-btn d-btn--ghost d-btn--sm admin-btn-danger" onClick={onDelete} aria-label={`Delete the request from ${reg.masjid_name}`}>
          <Icon name="delete" />
          Delete
        </button>
      </div>
    </div>
  </article>
);

export default RegistrationCard;
