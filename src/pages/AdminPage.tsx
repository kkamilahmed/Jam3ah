import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../lib/supabase";
import { ConfirmDialog, Icon, Spinner, ThemeToggle, Toast, type ToastState } from "../dashboard/ui";
import { useDashTheme } from "../dashboard/theme";
import MasjidCard from "../admin/MasjidCard";
import MasjidsMap from "../admin/MasjidsMap";
import RegistrationCard from "../admin/RegistrationCard";
import StatusBadge from "../admin/StatusBadge";
import { shortDate, type AdminTab, type Masjid, type Registration } from "../admin/types";
import "./AdminPage.css";

const TABS: { id: AdminTab; label: string; short: string; icon: string }[] = [
  { id: "overview", label: "Overview", short: "Overview", icon: "space_dashboard" },
  { id: "pending", label: "Requests", short: "Requests", icon: "inbox" },
  { id: "masjids", label: "Masjids", short: "Masjids", icon: "mosque" },
];

// Shared default password for newly approved masjids. Must be at least 6
// characters (Supabase's minimum) — the old "12345" was 5, so every approval
// failed. Kept as a simple shared value for now; the masjid can change it after
// signing in.
const DEFAULT_PASSWORD = "123456";

// ── Main component ────────────────────────────────────────────────────────────

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { dark, toggle: toggleTheme, themeAttr } = useDashTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "masjid" | "registration" } | null>(null);
  const [masjidsView, setMasjidsView] = useState<"list" | "map">("list");
  const [expandedMasjid, setExpandedMasjid] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, kind: type === "success" ? "ok" : "error" });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = () =>
    Promise.all([
      supabaseAdmin.from("masjid_registrations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("masjids").select("id, user_id, masjid_name, address, city, province, postal_code, country, masjid_email, masjid_phone, incharge_name, incharge_phone, status, theme, subdomain, website_enabled, onboarding_complete, instagram, facebook, twitter, youtube, whatsapp, website_url, created_at, prayer_settings(latitude, longitude)").order("created_at", { ascending: false }),
    ]);

  const applyData = ([regResult, masjidResult]: Awaited<ReturnType<typeof fetchData>>) => {
    if (regResult.data)    setRegistrations(regResult.data);
    if (masjidResult.data) setMasjids(masjidResult.data.map((m: Record<string, unknown>) => {
      const ps = m.prayer_settings as { latitude?: string; longitude?: string } | null;
      return { ...m, latitude: ps?.latitude, longitude: ps?.longitude } as Masjid;
    }));
    setLoading(false);
  };

  const loadData = async () => applyData(await fetchData());

  useEffect(() => {
    fetchData().then(applyData);
    // Loads once on open; later reloads go through loadData.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (reg: Registration) => {
    setActionLoading(reg.id);
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: reg.masjid_email, password: DEFAULT_PASSWORD, email_confirm: true,
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
      showToast(`${reg.masjid_name} is approved. They can sign in with ${reg.masjid_email} and the password ${DEFAULT_PASSWORD}.`);
      loadData();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    } finally { setActionLoading(null); }
  };

  const handleReject = async (reg: Registration) => {
    setActionLoading(reg.id);
    await supabaseAdmin.from("masjid_registrations").update({ status: "rejected" }).eq("id", reg.id);
    showToast(`${reg.masjid_name} was rejected.`);
    loadData();
    setActionLoading(null);
  };

  const handleToggleSuspend = async (masjid: Masjid) => {
    const newStatus = masjid.status === "active" ? "suspended" : "active";
    await supabaseAdmin.from("masjids").update({ status: newStatus }).eq("id", masjid.id);
    showToast(`${masjid.masjid_name} is ${newStatus === "active" ? "active again" : "suspended"}.`);
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
      showToast(`${deleteTarget.name} was deleted.`);
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

  const askDelete = (target: { id: string; name: string; type: "masjid" | "registration" }) => {
    setDeleteTarget(target);
    setShowDeleteModal(true);
  };
  const cancelDelete = () => { setShowDeleteModal(false); setDeleteTarget(null); };

  const stats = [
    { label: "Masjids on Jam3ah", value: masjids.length, icon: "mosque", tone: "accent" },
    { label: "Active", value: activeMasjids.length, icon: "check_circle", tone: "success" },
    { label: "Suspended", value: suspendedMasjids.length, icon: "pause_circle", tone: "danger" },
    { label: "Requests waiting", value: pending.length, icon: "inbox", tone: "warn" },
    { label: "Requests approved", value: approved.length, icon: "verified", tone: "success" },
    { label: "Requests rejected", value: rejected.length, icon: "block", tone: "muted" },
  ];

  const tabLabel = (t: (typeof TABS)[number]) => (
    <>
      <Icon name={t.icon} />
      {t.label}
      {t.id === "pending" && pending.length > 0 && (
        <span className="d-badge d-badge--warn admin-count">
          {pending.length}<span className="d-sr-only"> waiting</span>
        </span>
      )}
    </>
  );

  return (
    <div className="dash admin" data-dash-theme={themeAttr}>
      <a href="#admin-main" className="d-sr-only">Skip to content</a>
      <header className="d-header">
        <div className="d-brand">
          <div className="d-brand-mark" aria-hidden="true"><Icon name="shield_person" /></div>
          <div className="d-stack d-brand-text" style={{ gap: 0, minWidth: 0 }}>
            <span className="d-brand-name">Jam3ah admin</span>
            <span className="d-brand-sub">Every masjid on the platform</span>
          </div>
        </div>

        <nav className="d-nav" aria-label="Admin">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`d-nav-item${activeTab === t.id ? " is-active" : ""}`}
              aria-current={activeTab === t.id ? "page" : undefined}
              onClick={() => setActiveTab(t.id)}
            >
              {tabLabel(t)}
            </button>
          ))}
        </nav>

        <div className="d-header-actions" style={{ marginLeft: "auto" }}>
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => navigate("/home")} aria-label="Go to the masjid dashboard">
            <Icon name="home" /><span className="d-collapse-label">Masjid dashboard</span>
          </button>
        </div>
      </header>

      <main id="admin-main">
        {loading && (
          <div className="d-page admin-page">
            <div className="d-card d-empty" role="status"><Spinner /><span>Loading masjids and requests…</span></div>
          </div>
        )}

        {/* ── Overview ── */}
        {!loading && activeTab === "overview" && (
          <div className="d-page admin-page">
            <div className="d-page-head">
              <div className="d-stack" style={{ gap: 8 }}>
                <h1 className="d-h1">Platform overview</h1>
                <p className="d-sub">How many masjids use Jam3ah, and what needs your review.</p>
              </div>
            </div>

            {pending.length > 0 && (
              <div className="d-notice d-notice--warn" role="status">
                <Icon name="inbox" />
                <div className="d-stack" style={{ gap: 4 }}>
                  <span className="d-strong">
                    {pending.length === 1 ? "1 masjid is" : `${pending.length} masjids are`} waiting for your review
                  </span>
                  <button type="button" className="d-link" style={{ alignSelf: "flex-start" }} onClick={() => setActiveTab("pending")}>Review requests</button>
                </div>
              </div>
            )}

            <section aria-label="Numbers" className="admin-stats">
              {stats.map(s => (
                <div key={s.label} className="d-card admin-stat">
                  <span className={`admin-stat-icon admin-tone--${s.tone}`} aria-hidden="true"><Icon name={s.icon} /></span>
                  <span className="admin-stat-value">{s.value}</span>
                  <span className="admin-stat-label">{s.label}</span>
                </div>
              ))}
            </section>

            <section className="d-card d-card-pad" aria-labelledby="admin-recent-h">
              <div className="d-card-head" style={{ alignItems: "center", marginBottom: 8 }}>
                <h2 id="admin-recent-h" className="d-h2">Latest requests</h2>
                <button type="button" className="d-link" onClick={() => setActiveTab("pending")}>See all requests</button>
              </div>
              {registrations.length === 0 ? (
                <div className="d-empty">
                  <Icon name="inbox" />
                  <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>No requests yet</span>
                  <span>When a masjid signs up, its request shows here.</span>
                </div>
              ) : registrations.slice(0, 5).map(r => (
                <div key={r.id} className="d-list-row admin-row">
                  <div className="d-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <span className="d-strong admin-ellipsis" style={{ fontSize: 19 }}>{r.masjid_name}</span>
                    <span className="d-muted admin-ellipsis">{r.masjid_email} · {shortDate(r.created_at)}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── Requests ── */}
        {!loading && activeTab === "pending" && (
          <div className="d-page admin-page">
            <div className="d-page-head">
              <div className="d-stack" style={{ gap: 8 }}>
                <h1 className="d-h1">Requests to join</h1>
                <p className="d-sub">Approve a masjid to give it an account, or reject the request.</p>
              </div>
            </div>

            <section className="d-stack" aria-labelledby="admin-waiting-h">
              <h2 id="admin-waiting-h" className="d-h2">
                Waiting for review{pending.length > 0 && <span className="d-faint"> ({pending.length})</span>}
              </h2>
              {pending.length === 0 ? (
                <div className="d-card d-empty">
                  <Icon name="task_alt" />
                  <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>You are all caught up</span>
                  <span>There are no requests waiting for review.</span>
                </div>
              ) : pending.map(reg => (
                <RegistrationCard
                  key={reg.id}
                  reg={reg}
                  busy={actionLoading === reg.id}
                  onApprove={() => handleApprove(reg)}
                  onReject={() => handleReject(reg)}
                  onDelete={() => askDelete({ id: reg.id, name: reg.masjid_name, type: "registration" })}
                />
              ))}
            </section>

            {rejected.length > 0 && (
              <section className="d-card d-card-pad" aria-labelledby="admin-rejected-h">
                <h2 id="admin-rejected-h" className="d-h3" style={{ marginBottom: 4 }}>Rejected</h2>
                {rejected.map(reg => (
                  <div key={reg.id} className="d-list-row admin-row">
                    <div className="d-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                      <span className="d-strong admin-ellipsis" style={{ fontSize: 18 }}>{reg.masjid_name}</span>
                      <span className="d-muted admin-ellipsis">{reg.masjid_email}</span>
                    </div>
                    <StatusBadge status="rejected" />
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {/* ── Masjids ── */}
        {!loading && activeTab === "masjids" && (
          <div className="d-page admin-page">
            <div className="d-page-head">
              <div className="d-stack" style={{ gap: 8 }}>
                <h1 className="d-h1">Masjids</h1>
                <p className="d-sub">Every approved masjid. Suspend one to switch it off for a while.</p>
              </div>
              <div className="d-segmented" role="tablist" aria-label="Show masjids as">
                {(["list", "map"] as const).map(v => (
                  <button key={v} type="button" role="tab" aria-selected={masjidsView === v} onClick={() => setMasjidsView(v)}>
                    <Icon name={v === "list" ? "list" : "map"} />
                    {v === "list" ? "List" : "Map"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, list view only */}
            {masjidsView === "list" && (
              <div className="d-field admin-search">
                <label className="d-label" htmlFor="admin-search">Find a masjid</label>
                <div className="admin-search-box">
                  <Icon name="search" />
                  <input
                    id="admin-search"
                    className="d-input"
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Name or email"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {masjidsView === "map" && <MasjidsMap masjids={masjids} dark={dark} />}

            {masjidsView === "list" && (filteredMasjids.length === 0 ? (
              <div className="d-card d-empty">
                <Icon name={masjids.length === 0 ? "mosque" : "search_off"} />
                {masjids.length === 0 ? (
                  <>
                    <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>No masjids yet</span>
                    <span>Approve a request and the masjid shows up here.</span>
                  </>
                ) : (
                  <>
                    <span className="d-strong" style={{ color: "var(--d-text)", fontSize: 18 }}>No masjid matches “{searchQuery}”</span>
                    <span>Check the spelling, or search by email address instead.</span>
                    <button type="button" className="d-btn d-btn--secondary d-btn--sm" onClick={() => setSearchQuery("")}>Clear search</button>
                  </>
                )}
              </div>
            ) : (
              <section className="d-stack" aria-label="Masjid list">
                <p className="d-muted" style={{ margin: 0 }} aria-live="polite">
                  {searchQuery
                    ? `${filteredMasjids.length} of ${masjids.length} masjids`
                    : `${masjids.length} ${masjids.length === 1 ? "masjid" : "masjids"}`}
                </p>
                {filteredMasjids.map(masjid => (
                  <MasjidCard
                    key={masjid.id}
                    masjid={masjid}
                    expanded={expandedMasjid === masjid.id}
                    onToggleExpanded={() => setExpandedMasjid(expandedMasjid === masjid.id ? null : masjid.id)}
                    onToggleSuspend={() => handleToggleSuspend(masjid)}
                    onDelete={() => askDelete({ id: masjid.id, name: masjid.masjid_name, type: "masjid" })}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </main>

      <nav className="d-bottom-nav" aria-label="Admin">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={activeTab === t.id ? "is-active" : undefined}
            aria-current={activeTab === t.id ? "page" : undefined}
            onClick={() => setActiveTab(t.id)}
          >
            <Icon name={t.icon} />
            <span className="admin-bottom-label">
              {t.short}
              {t.id === "pending" && pending.length > 0 && <span className="admin-dot-count">{pending.length}<span className="d-sr-only"> waiting</span></span>}
            </span>
          </button>
        ))}
      </nav>

      {showDeleteModal && deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.type === "masjid" ? "Delete this masjid?" : "Delete this request?"}
          body={deleteTarget.type === "masjid" ? (
            <>“{deleteTarget.name}” will be removed from Jam3ah with its prayer times, events, questions and sign-in account. This cannot be undone.</>
          ) : (
            <>The request from “{deleteTarget.name}” will be removed. This cannot be undone.</>
          )}
          confirmLabel={deleteTarget.type === "masjid" ? "Delete masjid" : "Delete request"}
          danger
          busy={actionLoading === deleteTarget.id}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default AdminPage;
