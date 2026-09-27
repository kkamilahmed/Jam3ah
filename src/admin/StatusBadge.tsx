import React from "react";

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Waiting for review", tone: "d-badge--warn" },
  approved: { label: "Approved", tone: "admin-badge--success" },
  rejected: { label: "Rejected", tone: "d-badge--muted" },
  active: { label: "Active", tone: "admin-badge--success" },
  suspended: { label: "Suspended", tone: "admin-badge--danger" },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS[status] ?? STATUS.pending;
  return <span className={`d-badge ${s.tone}`}>{s.label}</span>;
};

export default StatusBadge;
