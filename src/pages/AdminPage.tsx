import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  masjid_email: string;
  masjid_phone: string;
  incharge_name: string;
  status: "active" | "suspended";
  created_at: string;
}

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const CrescentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
  </svg>
);

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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const [regResult, masjidResult] = await Promise.all([
      supabaseAdmin.from("masjid_registrations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("masjids").select("*").order("created_at", { ascending: false }),
    ]);
    if (regResult.data)    setRegistrations(regResult.data);
    if (masjidResult.data) setMasjids(masjidResult.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (reg: Registration) => {
    setActionLoading(reg.id);
    try {
      // 1. Create auth user with password "12345"
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: reg.masjid_email,
        password: "12345",
        email_confirm: true,
      });
      if (userError) throw new Error(userError.message);

      // 2. Insert into masjids table
      const { error: masjidError } = await supabaseAdmin.from("masjids").insert({
        registration_id: reg.id,
        user_id:         userData.user!.id,
        masjid_name:     reg.masjid_name,
        address:         reg.address,
        masjid_phone:    reg.masjid_phone,
        masjid_email:    reg.masjid_email,
        incharge_name:   reg.incharge_name,
        incharge_phone:  reg.incharge_phone,
        status:          "active",
      });
      if (masjidError) throw new Error(masjidError.message);

      // 3. Mark registration as approved
      await supabaseAdmin.from("masjid_registrations").update({ status: "approved" }).eq("id", reg.id);

      showToast(`${reg.masjid_name} approved! Login: ${reg.masjid_email} / 12345`);
      loadData();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
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
        // Delete all related data first (FK constraints)
        await supabaseAdmin.from("questions").delete().eq("masjid_id", id);
        await supabaseAdmin.from("events").delete().eq("masjid_id", id);
        await supabaseAdmin.from("prayer_times").delete().eq("masjid_id", id);
        await supabaseAdmin.from("prayer_settings").delete().eq("masjid_id", id);
        // Delete the masjid row
        const { error } = await supabaseAdmin.from("masjids").delete().eq("id", id);
        if (error) throw new Error(error.message);
        // Delete the Supabase auth user
        const masjid = masjids.find(m => m.id === id);
        if (masjid?.user_id) {
          await supabaseAdmin.auth.admin.deleteUser(masjid.user_id);
        }
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
    } finally {
      setActionLoading(null);
    }
  };

  const pending   = registrations.filter(r => r.status === "pending");
  const approved  = registrations.filter(r => r.status === "approved");
  const rejected  = registrations.filter(r => r.status === "rejected");
  const activeMasjids    = masjids.filter(m => m.status === "active");
  const suspendedMasjids = masjids.filter(m => m.status === "suspended");

  const filteredMasjids = masjids.filter(m =>
    m.masjid_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.masjid_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = [
    { id: "overview",  name: "Overview",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "pending",   name: "Pending",   icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",                                                                                                 badge: pending.length },
    { id: "masjids",   name: "Masjids",   icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-bold text-sm shadow-2xl border transition-all ${
          toast.type === "success"
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : "bg-red-500/20 border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center justify-center">
              <CrescentIcon className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">Jam3ah <span className="text-red-400">Admin</span></div>
              <div className="text-xs text-zinc-500 font-medium">Super Admin Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pending.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-black text-amber-400">{pending.length} pending</span>
              </div>
            )}
            <button onClick={() => navigate("/home")} className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
              Masjid Dashboard →
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-zinc-950 border-r border-white/5 z-40">
        <div className="p-4 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-red-500/20 border border-red-500/40 text-red-400"
                  : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
              }`}>
              <Icon d={tab.icon} className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{tab.name}</span>
              {tab.badge ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 space-y-3">
          {[
            { label: "Total Masjids",   value: masjids.length,       col: "text-red-400"     },
            { label: "Active",          value: activeMasjids.length,  col: "text-emerald-400" },
            { label: "Pending",         value: pending.length,        col: "text-amber-400"   },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-bold">{s.label}</span>
              <span className={`text-sm font-black ${s.col}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 pt-[73px] pb-12 min-h-screen">

        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-zinc-500 font-bold animate-pulse">Loading...</div>
          </div>
        )}

        {/* ════════ OVERVIEW ════════ */}
        {!loading && activeTab === "overview" && (
          <div className="px-8 py-10">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Platform</div>
              <h1 className="text-4xl font-black">System Overview</h1>
            </div>

            <div className="grid grid-cols-3 gap-5 mb-8">
              {[
                { label: "Total Masjids",     value: masjids.length,         bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-400",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { label: "Active",            value: activeMasjids.length,   bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: "Suspended",         value: suspendedMasjids.length, bg: "bg-orange-500/15",  border: "border-orange-500/30",  text: "text-orange-400",  icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
                { label: "Pending Approvals", value: pending.length,         bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-400",   icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: "Approved Total",    value: approved.length,        bg: "bg-sky-500/15",     border: "border-sky-500/30",     text: "text-sky-400",     icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
                { label: "Rejected",          value: rejected.length,        bg: "bg-rose-500/15",    border: "border-rose-500/30",    text: "text-rose-400",    icon: "M6 18L18 6M6 6l12 12" },
              ].map((s, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon d={s.icon} className={`w-5 h-5 ${s.text}`} />
                  </div>
                  <div className="text-3xl font-black mb-1">{s.value}</div>
                  <div className="text-sm text-zinc-500 font-bold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent registrations */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black">Recent Registrations</h2>
                <button onClick={() => setActiveTab("pending")} className="text-xs font-black text-red-400 hover:opacity-70 transition-opacity">
                  View Pending →
                </button>
              </div>
              {registrations.length === 0 ? (
                <p className="text-zinc-600 text-sm italic">No registrations yet.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-white/5">
                      <div>
                        <div className="font-black text-sm">{r.masjid_name}</div>
                        <div className="text-xs text-zinc-600">{r.masjid_email} · {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                        r.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : r.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ PENDING ════════ */}
        {!loading && activeTab === "pending" && (
          <div className="px-8 py-10">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Approvals</div>
              <h1 className="text-4xl font-black">Pending Registrations</h1>
              <p className="text-zinc-500 mt-1">Review and approve masjid registration requests</p>
            </div>

            {pending.length === 0 ? (
              <div className="text-center py-24 text-zinc-600">
                <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <div className="font-bold">No pending registrations</div>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map(reg => (
                  <div key={reg.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-black">{reg.masjid_name}</h3>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">Pending</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-zinc-400">
                          <div><span className="text-zinc-600 font-bold">Email: </span>{reg.masjid_email}</div>
                          <div><span className="text-zinc-600 font-bold">Phone: </span>{reg.masjid_phone || "—"}</div>
                          <div><span className="text-zinc-600 font-bold">Address: </span>{reg.address || "—"}</div>
                          <div><span className="text-zinc-600 font-bold">In-charge: </span>{reg.incharge_name || "—"}</div>
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Submitted: {new Date(reg.created_at).toLocaleString()}</div>
                      </div>

                      <div className="flex flex-col gap-2 ml-6 shrink-0">
                        <button
                          onClick={() => handleApprove(reg)}
                          disabled={actionLoading === reg.id}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black rounded-xl text-sm font-black transition-all"
                        >
                          {actionLoading === reg.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(reg)}
                          disabled={actionLoading === reg.id}
                          className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-black transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => { setDeleteTarget({ id: reg.id, name: reg.masjid_name, type: "registration" }); setShowDeleteModal(true); }}
                          className="px-5 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-xl text-sm font-bold transition-all"
                        >
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
              <div className="mt-10">
                <h2 className="text-lg font-black text-zinc-500 mb-4">Rejected</h2>
                <div className="space-y-3">
                  {rejected.map(reg => (
                    <div key={reg.id} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-white/5 rounded-xl opacity-60">
                      <div>
                        <div className="font-black text-sm">{reg.masjid_name}</div>
                        <div className="text-xs text-zinc-600">{reg.masjid_email}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ MASJIDS ════════ */}
        {!loading && activeTab === "masjids" && (
          <div className="px-8 py-10">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Management</div>
              <h1 className="text-4xl font-black">Active Masjids</h1>
              <p className="text-zinc-500 mt-1">Manage all approved masjids on the platform</p>
            </div>

            <div className="relative mb-6">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/30 transition-colors"
              />
            </div>

            {filteredMasjids.length === 0 ? (
              <div className="text-center py-24 text-zinc-600 font-bold">
                {masjids.length === 0 ? "No approved masjids yet. Approve a registration first." : "No results found."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMasjids.map(masjid => (
                  <div key={masjid.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-black">{masjid.masjid_name}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                            masjid.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-orange-500/15 text-orange-400 border-orange-500/30"
                          }`}>{masjid.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-zinc-400">
                          <div><span className="text-zinc-600 font-bold">Email: </span>{masjid.masjid_email}</div>
                          <div><span className="text-zinc-600 font-bold">Phone: </span>{masjid.masjid_phone || "—"}</div>
                          <div><span className="text-zinc-600 font-bold">Address: </span>{masjid.address || "—"}</div>
                          <div><span className="text-zinc-600 font-bold">In-charge: </span>{masjid.incharge_name || "—"}</div>
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Joined: {new Date(masjid.created_at).toLocaleDateString()}</div>
                      </div>

                      <div className="flex flex-col gap-2 ml-6 shrink-0">
                        <button
                          onClick={() => handleToggleSuspend(masjid)}
                          className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                            masjid.status === "active"
                              ? "bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30"
                              : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {masjid.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => { setDeleteTarget({ id: masjid.id, name: masjid.masjid_name, type: "masjid" }); setShowDeleteModal(true); }}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-black transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-2xl font-black mb-1">Delete?</h2>
              <p className="text-zinc-500 text-sm">This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-xl mb-5">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">{deleteTarget.type}</div>
              <div className="font-black">{deleteTarget.name}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                className="flex-1 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading === deleteTarget?.id}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black transition-all">
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
