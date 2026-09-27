import React from "react";

export interface Fact {
  label: string;
  value?: string | null;
  numeric?: boolean;
}

// A label and value grid. Empty values read "Not given" instead of a bare symbol.
const Facts: React.FC<{ items: Fact[]; columns?: 2 | 3 | 4 }> = ({ items, columns = 2 }) => (
  <dl className={`admin-facts admin-facts--${columns}`}>
    {items.map(f => (
      <div key={f.label} className="admin-fact">
        <dt>{f.label}</dt>
        <dd className={f.value ? (f.numeric ? "is-numeric" : undefined) : "is-empty"}>{f.value || "Not given"}</dd>
      </div>
    ))}
  </dl>
);

export default Facts;
