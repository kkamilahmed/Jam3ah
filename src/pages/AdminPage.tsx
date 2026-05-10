import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabaseAdmin } from "../lib/supabase";

interface Registration {
  id: string;
  masjid_name: string;
  address: string;
  masjid_phone: string;
  masjid_email: string;
  incharge_name: string;
  incharge_phone: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface Masjid {
  id: string;
  user_id: string;
  masjid_name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  masjid_email: string;
  masjid_phone: string;
  incharge_name: string;
  incharge_phone?: string;
  status: "active" | "suspended";
  theme?: string;
  subdomain?: string;
  website_enabled?: boolean;
  onboarding_complete?: boolean;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
  website_url?: string;
  created_at: string;
  latitude?: string;
  longitude?: string;
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const F = "Manrope, sans-serif";

const card: React.CSSProperties = {
  background: "var(--surface-low)",
  border: "1px solid var(--surface-high)",
  borderRadius: 2,
  overflow: "hidden",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.15em", color: "var(--text-faint)", fontFamily: F,
};

const RED       = "#f87171";
const RED_BG    = "rgba(248,113,113,0.1)";
const RED_BORDER = "rgba(248,113,113,0.25)";

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "9px 20px", background: "var(--accent)", color: "var(--accent-text)",
  border: "none", borderRadius: 2, fontFamily: F, fontSize: 13, fontWeight: 700,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "9px 18px", background: "transparent",
  border: "1px solid var(--outline-variant)", borderRadius: 2,
  fontFamily: F, fontSize: 13, fontWeight: 700,
  color: "var(--on-surface-variant)", cursor: "pointer",
};

const CrescentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
  </svg>
);

// ── Status badges ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    pending:   { bg: "rgba(251,191,36,0.08)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)"  },
    approved:  { bg: "rgba(52,211,153,0.08)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
    rejected:  { bg: "rgba(248,113,113,0.08)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
    active:    { bg: "rgba(52,211,153,0.08)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
    suspended: { bg: "rgba(251,146,60,0.08)",  color: "#fb923c", border: "rgba(251,146,60,0.25)"  },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      fontFamily: F, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 2,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>{status}</span>
  );
};

// ── Masjids map ───────────────────────────────────────────────────────────────

const pinIcon = (active: boolean) => L.divIcon({
  className: "jam3ah-admin-pin",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;">
    <div style="width:14px;height:14px;background:${active ? "#34d399" : "#fb923c"};border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 12px ${active ? "rgba(52,211,153,0.6)" : "rgba(251,146,60,0.6)"};"></div>
  </div>`,
});

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) { map.setView(positions[0], 13); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
  }, []);
  return null;
};

const MasjidsMap: React.FC<{ masjids: Masjid[] }> = ({ masjids }) => {
  const withCoords = masjids.filter(m => m.latitude && m.longitude &&
    !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude)));
  const positions: [number, number][] = withCoords.map(m => [parseFloat(m.latitude!), parseFloat(m.longitude!)]);
  const center: [number, number] = positions.length ? positions[0] : [43.651070, -79.347015];

  return (
    <div style={{ height: "calc(100vh - 73px - 160px)", minHeight: 400, borderRadius: 2, overflow: "hidden", border: "1px solid var(--surface-high)", isolation: "isolate" }}>
      <style>{`
        .leaflet-container { background: #09090b; }
        .jam3ah-admin-pin { background: transparent !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          background: #18181b !important; border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 4px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #18181b !important; }
        .leaflet-popup-close-button { color: #71717a !important; top: 8px !important; right: 8px !important; font-size: 16px !important; }
        .leaflet-popup-close-button:hover { color: #fff !important; }
        .leaflet-control-zoom { border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 4px !important; overflow: hidden; box-shadow: none !important; }
        .leaflet-control-zoom a { background: #18181b !important; color: #a1a1aa !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; width: 32px !important; height: 32px !important; line-height: 32px !important; font-size: 16px !important; }
        .leaflet-control-zoom a:hover { background: #27272a !important; color: #fff !important; }
        .leaflet-control-zoom-out { border-bottom: none !important; }
      `}</style>
      <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }} attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FitBounds positions={positions} />
        {withCoords.map(m => (
          <Marker key={m.id} position={[parseFloat(m.latitude!), parseFloat(m.longitude!)]} icon={pinIcon(m.status === "active")}>
            <Popup minWidth={220} maxWidth={280}>
              <div style={{ fontFamily: "Manrope, sans-serif", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{m.masjid_name}</div>
                  <StatusBadge status={m.status} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", minWidth: 20 }}>LAT</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", fontFamily: "monospace" }}>{parseFloat(m.latitude!).toFixed(6)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", minWidth: 20 }}>LNG</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", fontFamily: "monospace" }}>{parseFloat(m.longitude!).toFixed(6)}</span>
                  </div>
                  {m.address && (
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 1.4 }}>{m.address}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{m.masjid_email}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "masjid" | "registration" } | null>(null);
  const [masjidsView, setMasjidsView] = useState<"list" | "map">("list");
  const [expandedMasjid, setExpandedMasjid] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const [regResult, masjidResult] = await Promise.all([
      supabaseAdmin.from("masjid_registrations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("masjids").select("id, user_id, masjid_name, address, city, province, postal_code, country, masjid_email, masjid_phone, incharge_name, incharge_phone, status, theme, subdomain, website_enabled, onboarding_complete, instagram, facebook, twitter, youtube, whatsapp, website_url, created_at, prayer_settings(latitude, longitude)").order("created_at", { ascending: false }),
    ]);
    if (regResult.data)    setRegistrations(regResult.data);
    if (masjidResult.data) setMasjids(masjidResult.data.map((m: Record<string, unknown>) => {
      const ps = m.prayer_settings as { latitude?: string; longitude?: string } | null;
      return { ...m, latitude: ps?.latitude, longitude: ps?.longitude } as Masjid;
    }));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (reg: Registration) => {
    setActionLoading(reg.id);
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: reg.masjid_email, password: "12345", email_confirm: true,
      });
      if (userError) throw new Error(userError.message);
      const { error: masjidError } = await supabaseAdmin.from("masjids").insert({
        registration_id: reg.id, user_id: userData.user!.id,
        masjid_name: reg.masjid_name, address: reg.address,
        masjid_phone: reg.masjid_phone, masjid_email: reg.masjid_email,
        incharge_name: reg.incharge_name, incharge_phone: reg.incharge_phone, status: "active",
      });
      if (masjidError) throw new Error(masjidError.message);
      await supabaseAdmin.from("masjid_registrations").update({ status: "approved" }).eq("id", reg.id);
      showToast(`${reg.masjid_name} approved! Login: ${reg.masjid_email} / 12345`);
      loadData();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    } finally { setActionLoading(null); }
  };

  const handleReject = async (reg: Registration) => {
    setActionLoading(reg.id);
    await supabaseAdmin.from("masjid_registrations").update({ status: "rejected" }).eq("id", reg.id);
    showToast(`${reg.masjid_name} rejected.`);
    loadData();
    setActionLoading(null);
  };

  const handleToggleSuspend = async (masjid: Masjid) => {
    const newStatus = masjid.status === "active" ? "suspended" : "active";
    await supabaseAdmin.from("masjids").update({ status: newStatus }).eq("id", masjid.id);
    showToast(`${masjid.masjid_name} ${newStatus}.`);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      if (deleteTarget.type === "masjid") {
        const id = deleteTarget.id;
        await supabaseAdmin.from("questions").delete().eq("masjid_id", id);
        await supabaseAdmin.from("events").delete().eq("masjid_id", id);
        await supabaseAdmin.from("prayer_times").delete().eq("masjid_id", id);
        await supabaseAdmin.from("prayer_settings").delete().eq("masjid_id", id);
        const { error } = await supabaseAdmin.from("masjids").delete().eq("id", id);
        if (error) throw new Error(error.message);
        const masjid = masjids.find(m => m.id === id);
        if (masjid?.user_id) await supabaseAdmin.auth.admin.deleteUser(masjid.user_id);
      } else {
        const { error } = await supabaseAdmin.from("masjid_registrations").delete().eq("id", deleteTarget.id);
        if (error) throw new Error(error.message);
      }
      showToast(`${deleteTarget.name} deleted.`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    } finally { setActionLoading(null); }
  };

  const pending          = registrations.filter(r => r.status === "pending");
  const approved         = registrations.filter(r => r.status === "approved");
  const rejected         = registrations.filter(r => r.status === "rejected");
  const activeMasjids    = masjids.filter(m => m.status === "active");
  const suspendedMasjids = masjids.filter(m => m.status === "suspended");
  const filteredMasjids  = masjids.filter(m =>
    m.masjid_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.masjid_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = [
    { id: "overview", label: "Overview",             icon: "grid_view"     },
    { id: "pending",  label: "Pending",              icon: "pending_actions", badge: pending.length },
    { id: "masjids",  label: "Masjids",              icon: "mosque"        },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: F, color: "var(--on-surface)" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 100,
          padding: "10px 18px", borderRadius: 2, fontFamily: F, fontSize: 13, fontWeight: 700,
          background: toast.type === "success" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
          color: toast.type === "success" ? "#34d399" : "#f87171",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 73,
        background: "var(--bg)", borderBottom: "1px solid var(--outline-subtle)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 2,
            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)",
          }}>
            <CrescentIcon />
          </div>
          <div>
            <div style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>
              Jam3ah <span style={{ color: "var(--accent)" }}>Admin</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>Super Admin Panel</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {pending.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 2,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} />
              <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>{pending.length} pending</span>
            </div>
          )}
          <button
            onClick={() => navigate("/home")}
            style={{ ...btnGhost, padding: "7px 14px", fontSize: 12 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>dashboard</span>
            Dashboard
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside style={{
        position: "fixed", top: 73, left: 0, bottom: 0, width: 220, zIndex: 40,
        background: "var(--bg)", borderRight: "1px solid var(--outline-subtle)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 2, border: "none",
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-ghost)",
                fontFamily: F, fontSize: 13, fontWeight: 700, cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, flexShrink: 0 }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {tab.badge ? (
                  <span style={{
                    fontFamily: F, fontSize: 10, fontWeight: 800,
                    padding: "2px 7px", borderRadius: 2,
                    background: "rgba(251,191,36,0.12)", color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,0.25)",
                  }}>{tab.badge}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sidebar footer stats */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--outline-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Total",     value: masjids.length,          color: "var(--on-surface)"  },
            { label: "Active",    value: activeMasjids.length,    color: "#34d399"            },
            { label: "Pending",   value: pending.length,          color: "#fbbf24"            },
            { label: "Suspended", value: suspendedMasjids.length, color: "#fb923c"            },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>{s.label}</span>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 220, paddingTop: 73, minHeight: "100vh" }}>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
            <span style={{ fontFamily: F, fontSize: 13, color: "var(--text-ghost)", fontWeight: 600 }}>Loading…</span>
          </div>
        )}

        {/* ── Overview ── */}
        {!loading && activeTab === "overview" && (
          <div style={{ padding: "32px 32px" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>Platform</div>
              <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>System Overview</div>
            </div>

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Masjids",     value: masjids.length,          icon: "mosque",             color: "var(--accent)",  bg: "var(--accent-bg)",              border: "var(--accent-border)"              },
                { label: "Active",            value: activeMasjids.length,    icon: "check_circle",       color: "#34d399",        bg: "rgba(52,211,153,0.08)",         border: "rgba(52,211,153,0.2)"              },
                { label: "Suspended",         value: suspendedMasjids.length, icon: "block",              color: "#fb923c",        bg: "rgba(251,146,60,0.08)",         border: "rgba(251,146,60,0.2)"              },
                { label: "Pending Approvals", value: pending.length,          icon: "pending_actions",    color: "#fbbf24",        bg: "rgba(251,191,36,0.08)",         border: "rgba(251,191,36,0.2)"              },
                { label: "Approved Total",    value: approved.length,         icon: "verified",           color: "#60a5fa",        bg: "rgba(96,165,250,0.08)",         border: "rgba(96,165,250,0.2)"              },
                { label: "Rejected",          value: rejected.length,         icon: "cancel",             color: "#f87171",        bg: "rgba(248,113,113,0.08)",        border: "rgba(248,113,113,0.2)"             },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: "20px 24px" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 2, marginBottom: 14,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: s.color,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "var(--text-ghost)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent registrations */}
            <div style={card}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--outline-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Recent Registrations</div>
                <button onClick={() => setActiveTab("pending")} style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                  View Pending →
                </button>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {registrations.length === 0 ? (
                  <div style={{ fontFamily: F, fontSize: 13, color: "var(--text-ghost)", padding: "16px 0" }}>No registrations yet.</div>
                ) : registrations.slice(0, 5).map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2 }}>
                    <div>
                      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: "var(--text-max)", marginBottom: 2 }}>{r.masjid_name}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "var(--text-faint)" }}>{r.masjid_email} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Pending ── */}
        {!loading && activeTab === "pending" && (
          <div style={{ padding: "32px 32px" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>Approvals</div>
              <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Pending Registrations</div>
              <div style={{ fontFamily: F, fontSize: 13, color: "var(--text-ghost)", marginTop: 4 }}>Review and approve masjid registration requests</div>
            </div>

            {pending.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--text-faint)", display: "block", marginBottom: 12 }}>check_circle</span>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "var(--text-ghost)" }}>No pending registrations</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pending.map(reg => (
                  <div key={reg.id} style={card}>
                    <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: "var(--text-max)" }}>{reg.masjid_name}</div>
                          <StatusBadge status="pending" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 32px", marginBottom: 10 }}>
                          {[
                            { label: "Email",      value: reg.masjid_email   },
                            { label: "Phone",      value: reg.masjid_phone || "—" },
                            { label: "Address",    value: reg.address || "—" },
                            { label: "In-charge",  value: reg.incharge_name || "—" },
                          ].map(f => (
                            <div key={f.label} style={{ fontFamily: F, fontSize: 12, color: "var(--text-dim)" }}>
                              <span style={{ color: "var(--text-faint)", fontWeight: 700 }}>{f.label}: </span>{f.value}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "var(--text-faint)" }}>Submitted {new Date(reg.created_at).toLocaleString()}</div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => handleApprove(reg)} disabled={actionLoading === reg.id} style={{ ...btnPrimary, opacity: actionLoading === reg.id ? 0.5 : 1, cursor: actionLoading === reg.id ? "not-allowed" : "pointer" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                          {actionLoading === reg.id ? "Approving…" : "Approve"}
                        </button>
                        <button onClick={() => handleReject(reg)} disabled={actionLoading === reg.id} style={{ ...btnGhost, color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
                          Reject
                        </button>
                        <button onClick={() => { setDeleteTarget({ id: reg.id, name: reg.masjid_name, type: "registration" }); setShowDeleteModal(true); }} style={{ ...btnGhost, fontSize: 12, padding: "7px 14px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rejected section */}
            {rejected.length > 0 && (
              <div style={{ marginTop: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ ...sectionLabel }}>Rejected</div>
                  <div style={{ flex: 1, height: 1, background: "var(--outline-subtle)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rejected.map(reg => (
                    <div key={reg.id} style={{ ...card, opacity: 0.55, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: "var(--text-max)" }}>{reg.masjid_name}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "var(--text-faint)" }}>{reg.masjid_email}</div>
                      </div>
                      <StatusBadge status="rejected" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Masjids ── */}
        {!loading && activeTab === "masjids" && (
          <div style={{ padding: "32px 32px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16 }}>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 6 }}>Management</div>
                <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: "var(--text-max)", letterSpacing: "-0.02em" }}>Masjids</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "var(--text-ghost)", marginTop: 4 }}>Manage all approved masjids on the platform</div>
              </div>
              {/* View toggle */}
              <div style={{ display: "flex", background: "var(--surface-low)", border: "1px solid var(--outline-variant)", borderRadius: 2, overflow: "hidden", flexShrink: 0, marginTop: 4 }}>
                {(["list", "map"] as const).map(v => (
                  <button key={v} onClick={() => setMasjidsView(v)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                    background: masjidsView === v ? "var(--surface-high)" : "transparent",
                    border: "none", fontFamily: F, fontSize: 12, fontWeight: 700,
                    color: masjidsView === v ? "var(--on-surface)" : "var(--text-ghost)", cursor: "pointer",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{v === "list" ? "format_list_bulleted" : "map"}</span>
                    {v === "list" ? "List" : "Map"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search — list only */}
            {masjidsView === "list" && (
            <div style={{ position: "relative", marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-ghost)", pointerEvents: "none" }}>search</span>
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px 10px 38px",
                  background: "var(--surface-low)", border: "1px solid var(--outline-variant)",
                  borderRadius: 2, fontFamily: F, fontSize: 13, color: "var(--on-surface)",
                  outline: "none",
                }}
              />
            </div>
            )}

            {/* Map view */}
            {masjidsView === "map" && <MasjidsMap masjids={masjids} />}

            {/* List view */}
            {masjidsView === "list" && (filteredMasjids.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", fontFamily: F, fontSize: 13, fontWeight: 600, color: "var(--text-ghost)" }}>
                {masjids.length === 0 ? "No approved masjids yet. Approve a registration first." : "No results found."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredMasjids.map(masjid => {
                    const expanded = expandedMasjid === masjid.id;
                    const socials = [
                      { icon: "link", label: "Website",   value: masjid.website_url },
                      { icon: "tag",  label: "Instagram", value: masjid.instagram   },
                      { icon: "tag",  label: "Facebook",  value: masjid.facebook    },
                      { icon: "tag",  label: "Twitter",   value: masjid.twitter     },
                      { icon: "tag",  label: "YouTube",   value: masjid.youtube     },
                      { icon: "tag",  label: "WhatsApp",  value: masjid.whatsapp    },
                    ].filter(s => s.value);
                    return (
                      <div key={masjid.id} style={card}>
                        {/* Main row */}
                        <div style={{ padding: "18px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "var(--text-max)" }}>{masjid.masjid_name}</div>
                              <StatusBadge status={masjid.status} />
                              {masjid.onboarding_complete && (
                                <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, background: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>Onboarded</span>
                              )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 32px" }}>
                              {[
                                { label: "Email",     value: masjid.masjid_email        },
                                { label: "Phone",     value: masjid.masjid_phone || "—" },
                                { label: "Address",   value: masjid.address || "—"      },
                                { label: "In-charge", value: masjid.incharge_name || "—"},
                              ].map(f => (
                                <div key={f.label} style={{ fontFamily: F, fontSize: 12, color: "var(--text-dim)" }}>
                                  <span style={{ color: "var(--text-faint)", fontWeight: 700 }}>{f.label}: </span>{f.value}
                                </div>
                              ))}
                            </div>
                            <div style={{ fontFamily: F, fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>Joined {new Date(masjid.created_at).toLocaleDateString()}</div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setExpandedMasjid(expanded ? null : masjid.id)} style={{ ...btnGhost, fontSize: 12, padding: "7px 14px" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
                              {expanded ? "Less" : "More"}
                            </button>
                            <button onClick={() => handleToggleSuspend(masjid)} style={{
                              ...btnGhost, fontSize: 12, padding: "7px 14px",
                              color: masjid.status === "active" ? "#fb923c" : "#34d399",
                              borderColor: masjid.status === "active" ? "rgba(251,146,60,0.3)" : "rgba(52,211,153,0.3)",
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{masjid.status === "active" ? "block" : "check_circle"}</span>
                              {masjid.status === "active" ? "Suspend" : "Reactivate"}
                            </button>
                            <button onClick={() => { setDeleteTarget({ id: masjid.id, name: masjid.masjid_name, type: "masjid" }); setShowDeleteModal(true); }} style={{ ...btnGhost, fontSize: 12, padding: "7px 14px", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Expanded panel */}
                        {expanded && (
                          <div style={{ borderTop: "1px solid var(--outline-subtle)", background: "var(--surface-mid)", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Location */}
                            <div>
                              <div style={{ ...sectionLabel, marginBottom: 10 }}>Location</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 20px" }}>
                                {[
                                  { label: "City",        value: masjid.city        },
                                  { label: "Province",    value: masjid.province    },
                                  { label: "Postal Code", value: masjid.postal_code },
                                  { label: "Country",     value: masjid.country     },
                                  { label: "Latitude",    value: masjid.latitude    },
                                  { label: "Longitude",   value: masjid.longitude   },
                                ].map(f => (
                                  <div key={f.label} style={{ fontFamily: F, fontSize: 12, color: "var(--text-dim)" }}>
                                    <span style={{ color: "var(--text-faint)", fontWeight: 700, display: "block", marginBottom: 2, fontSize: 10 }}>{f.label}</span>
                                    <span style={{ fontFamily: f.label === "Latitude" || f.label === "Longitude" ? "monospace" : F }}>{f.value || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Contact */}
                            <div>
                              <div style={{ ...sectionLabel, marginBottom: 10 }}>Contact</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 20px" }}>
                                {[
                                  { label: "In-charge Phone", value: masjid.incharge_phone },
                                  { label: "Masjid Email",    value: masjid.masjid_email   },
                                  { label: "Masjid Phone",    value: masjid.masjid_phone   },
                                ].map(f => (
                                  <div key={f.label} style={{ fontFamily: F, fontSize: 12, color: "var(--text-dim)" }}>
                                    <span style={{ color: "var(--text-faint)", fontWeight: 700, display: "block", marginBottom: 2, fontSize: 10 }}>{f.label}</span>
                                    {f.value || "—"}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Platform */}
                            <div>
                              <div style={{ ...sectionLabel, marginBottom: 10 }}>Platform</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px 20px" }}>
                                {[
                                  { label: "Theme",            value: masjid.theme                           },
                                  { label: "Subdomain",        value: masjid.subdomain                       },
                                  { label: "Website Enabled",  value: masjid.website_enabled  ? "Yes" : "No" },
                                  { label: "Onboarding Done",  value: masjid.onboarding_complete ? "Yes" : "No" },
                                ].map(f => (
                                  <div key={f.label} style={{ fontFamily: F, fontSize: 12, color: "var(--text-dim)" }}>
                                    <span style={{ color: "var(--text-faint)", fontWeight: 700, display: "block", marginBottom: 2, fontSize: 10 }}>{f.label}</span>
                                    {f.value || "—"}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Social */}
                            {socials.length > 0 && (
                              <div>
                                <div style={{ ...sectionLabel, marginBottom: 10 }}>Social & Web</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {socials.map(s => (
                                    <a key={s.label} href={s.value!.startsWith("http") ? s.value! : `https://${s.value!}`} target="_blank" rel="noreferrer"
                                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--surface-high)", border: "1px solid var(--outline-subtle)", borderRadius: 2, fontFamily: F, fontSize: 11, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
                                      {s.label}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* IDs */}
                            <div>
                              <div style={{ ...sectionLabel, marginBottom: 10 }}>Reference</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {[
                                  { label: "Masjid ID", value: masjid.id      },
                                  { label: "User ID",   value: masjid.user_id },
                                ].map(f => (
                                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: "var(--text-faint)", minWidth: 64 }}>{f.label}</span>
                                    <code style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-ghost)", background: "var(--surface-high)", padding: "2px 8px", borderRadius: 2 }}>{f.value}</code>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteModal && deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
             onClick={e => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteTarget(null); } }}>
          <div style={{ width: "100%", maxWidth: 420, margin: "0 16px", ...card, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

            <div style={{ padding: "24px 24px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 2, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#f87171" }}>delete_forever</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: "var(--text-max)", marginBottom: 6 }}>Delete {deleteTarget.type}?</div>
              <div style={{ fontFamily: F, fontSize: 13, color: "var(--text-ghost)" }}>This action cannot be undone.</div>
            </div>

            <div style={{ margin: "0 24px 20px", padding: "12px 14px", background: "var(--surface-mid)", border: "1px solid var(--outline-subtle)", borderRadius: 2 }}>
              <div style={{ ...sectionLabel, marginBottom: 4 }}>{deleteTarget.type}</div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: "var(--text-max)" }}>{deleteTarget.name}</div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--outline-subtle)", display: "flex", gap: 10 }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} style={{ ...btnGhost, flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading === deleteTarget?.id} style={{ flex: 1, ...btnPrimary, opacity: actionLoading === deleteTarget?.id ? 0.5 : 1, cursor: actionLoading === deleteTarget?.id ? "not-allowed" : "pointer" }}>
                {actionLoading === deleteTarget?.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
