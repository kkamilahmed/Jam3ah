import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Masjid {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "suspended";
  registeredDate: string;
  subscriberCount: number;
}

interface Event {
  id: number;
  masjidId: number;
  masjidName: string;
  title: string;
  description: string;
  date: string;
  time: string;
}

interface Post {
  id: number;
  masjidId: number;
  masjidName: string;
  title: string;
  content: string;
  date: string;
  views: number;
}

const AdminPage: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: number;
    name: string;
  } | null>(null);

  const [masjids, setMasjids] = useState<Masjid[]>([
    {
      id: 1,
      name: "Al-Noor Masjid",
      address: "123 Main St, Toronto",
      email: "info@alnoor.com",
      phone: "+1 416-555-0100",
      status: "active",
      registeredDate: "2025-01-01",
      subscriberCount: 1234,
    },
    {
      id: 2,
      name: "Baitul Islam Mosque",
      address: "456 Oak Ave, Mississauga",
      email: "contact@baitul.com",
      phone: "+1 905-555-0200",
      status: "active",
      registeredDate: "2025-01-05",
      subscriberCount: 856,
    },
    {
      id: 3,
      name: "Central Mosque",
      address: "789 Center Blvd, Brampton",
      email: "admin@central.com",
      phone: "+1 647-555-0300",
      status: "pending",
      registeredDate: "2026-01-03",
      subscriberCount: 0,
    },
  ]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      masjidId: 1,
      masjidName: "Al-Noor Masjid",
      title: "Friday Khutbah",
      description: "Special lecture on Islamic finance",
      date: "2026-01-10",
      time: "13:00",
    },
    {
      id: 2,
      masjidId: 1,
      masjidName: "Al-Noor Masjid",
      title: "Youth Program",
      description: "Monthly youth gathering",
      date: "2026-01-15",
      time: "18:00",
    },
    {
      id: 3,
      masjidId: 2,
      masjidName: "Baitul Islam Mosque",
      title: "Ramadan Preparation",
      description: "Community iftar planning",
      date: "2026-01-20",
      time: "19:30",
    },
  ]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      masjidId: 1,
      masjidName: "Al-Noor Masjid",
      title: "New Prayer Time Updates",
      content: "Prayer times have been updated for winter season",
      date: "2026-01-05",
      views: 523,
    },
    {
      id: 2,
      masjidId: 2,
      masjidName: "Baitul Islam Mosque",
      title: "Fundraising Campaign",
      content: "Help us raise funds for mosque expansion",
      date: "2026-01-04",
      views: 892,
    },
  ]);

  const stats = {
    totalMasjids: masjids.length,
    activeMasjids: masjids.filter((m) => m.status === "active").length,
    pendingApprovals: masjids.filter((m) => m.status === "pending").length,
    totalSubscribers: masjids.reduce((sum, m) => sum + m.subscriberCount, 0),
    totalEvents: events.length,
    totalPosts: posts.length,
  };

  const handleDeleteClick = (type: string, id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case "masjid":
        setMasjids(masjids.filter((m) => m.id !== deleteTarget.id));
        setEvents(events.filter((e) => e.masjidId !== deleteTarget.id));
        setPosts(posts.filter((p) => p.masjidId !== deleteTarget.id));
        break;
      case "event":
        setEvents(events.filter((e) => e.id !== deleteTarget.id));
        break;
      case "post":
        setPosts(posts.filter((p) => p.id !== deleteTarget.id));
        break;
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleStatusChange = (id: number, newStatus: Masjid["status"]) => {
    setMasjids(
      masjids.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  const filteredMasjids = masjids.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full backdrop-blur-xl border-b z-50 transition-colors ${
          isDark ? "bg-black/80 border-white/5" : "bg-white/80 border-black/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight">
                Super Admin
              </div>
              <div
                className={`text-xs font-medium ${
                  isDark ? "text-zinc-500" : "text-zinc-600"
                }`}
              >
                System Management
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-full transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-black/5 hover:bg-black/10"
              }`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                isDark
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-black/5 hover:bg-black/10"
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 border-r transition-colors ${
          isDark ? "bg-black/50 border-white/5" : "bg-white/50 border-black/5"
        }`}
      >
        <div className="p-6 space-y-2">
          {[
            {
              id: "overview",
              name: "Overview",
              icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
            },
            {
              id: "masjids",
              name: "Manage Masjids",
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            },
            {
              id: "events",
              name: "All Events",
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            },
            {
              id: "posts",
              name: "All Posts",
              icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-red-500 text-white"
                  : isDark
                  ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                  : "text-zinc-600 hover:bg-black/5 hover:text-black"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={tab.icon}
                />
              </svg>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 pt-24 pb-12 px-8">
        {activeTab === "overview" && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-black mb-2">System Overview</h1>
              <p
                className={`text-lg ${
                  isDark ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Monitor and manage the entire network
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  label: "Total Masjids",
                  value: stats.totalMasjids,
                  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                  color: "emerald",
                },
                {
                  label: "Active Masjids",
                  value: stats.activeMasjids,
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                  color: "green",
                },
                {
                  label: "Pending Approvals",
                  value: stats.pendingApprovals,
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  color: "orange",
                },
                {
                  label: "Total Subscribers",
                  value: stats.totalSubscribers.toLocaleString(),
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  color: "blue",
                },
                {
                  label: "Total Events",
                  value: stats.totalEvents,
                  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                  color: "purple",
                },
                {
                  label: "Total Posts",
                  value: stats.totalPosts,
                  icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
                  color: "pink",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border-2 ${
                    isDark
                      ? "bg-zinc-900 border-white/10"
                      : "bg-zinc-50 border-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}
                    >
                      <svg
                        className={`w-6 h-6 text-${stat.color}-500`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={stat.icon}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-black mb-1">{stat.value}</div>
                  <div
                    className={`text-sm font-bold ${
                      isDark ? "text-zinc-500" : "text-zinc-600"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div
                className={`rounded-2xl p-6 border-2 ${
                  isDark
                    ? "bg-zinc-900 border-white/10"
                    : "bg-zinc-50 border-black/10"
                }`}
              >
                <h2 className="text-2xl font-black mb-6">Recent Masjids</h2>
                <div className="space-y-3">
                  {masjids.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? "bg-black/50 border-white/5"
                          : "bg-white border-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black">{m.name}</h3>
                          <p
                            className={`text-sm ${
                              isDark ? "text-zinc-400" : "text-zinc-600"
                            }`}
                          >
                            {m.address}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            m.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : m.status === "pending"
                              ? "bg-orange-500/20 text-orange-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-2xl p-6 border-2 ${
                  isDark
                    ? "bg-zinc-900 border-white/10"
                    : "bg-zinc-50 border-black/10"
                }`}
              >
                <h2 className="text-2xl font-black mb-6">System Activity</h2>
                <div className="space-y-4">
                  {[
                    {
                      action: "New masjid registered",
                      masjid: "Central Mosque",
                      time: "2 hours ago",
                    },
                    {
                      action: "Event created",
                      masjid: "Al-Noor Masjid",
                      time: "5 hours ago",
                    },
                    {
                      action: "Post published",
                      masjid: "Baitul Islam",
                      time: "1 day ago",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 pb-4 ${
                        i < 2
                          ? `border-b ${
                              isDark ? "border-white/5" : "border-black/5"
                            }`
                          : ""
                      }`}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-bold">{activity.action}</p>
                        <p
                          className={`text-sm ${
                            isDark ? "text-zinc-400" : "text-zinc-600"
                          }`}
                        >
                          {activity.masjid} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "masjids" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black mb-2">Manage Masjids</h1>
                <p
                  className={`text-lg ${
                    isDark ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  View, approve, and manage all registered masjids
                </p>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search masjids..."
                  className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    isDark
                      ? "bg-black border-white/10 focus:border-red-500 text-white"
                      : "bg-white border-black/10 focus:border-red-500 text-black"
                  } outline-none`}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-3 rounded-lg border-2 font-bold transition-all ${
                  isDark
                    ? "bg-black border-white/10 focus:border-red-500 text-white"
                    : "bg-white border-black/10 focus:border-red-500 text-black"
                } outline-none`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredMasjids.map((masjid) => (
                <div
                  key={masjid.id}
                  className={`rounded-2xl p-6 border-2 ${
                    isDark
                      ? "bg-zinc-900 border-white/10"
                      : "bg-zinc-50 border-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black">{masjid.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            masjid.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : masjid.status === "pending"
                              ? "bg-orange-500/20 text-orange-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {masjid.status}
                        </span>
                      </div>
                      <div
                        className={`space-y-1 text-sm ${
                          isDark ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        <p>📍 {masjid.address}</p>
                        <p>📧 {masjid.email}</p>
                        <p>📞 {masjid.phone}</p>
                        <p>
                          👥 {masjid.subscriberCount.toLocaleString()}{" "}
                          subscribers
                        </p>
                        <p>📅 Registered: {masjid.registeredDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {masjid.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange(masjid.id, "active")}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-400 transition-all"
                      >
                        Approve
                      </button>
                    )}
                    {masjid.status === "active" && (
                      <button
                        onClick={() =>
                          handleStatusChange(masjid.id, "suspended")
                        }
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-400 transition-all"
                      >
                        Suspend
                      </button>
                    )}
                    {masjid.status === "suspended" && (
                      <button
                        onClick={() => handleStatusChange(masjid.id, "active")}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition-all"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeleteClick("masjid", masjid.id, masjid.name)
                      }
                      className="px-4 py-2 bg-red-500/20 text-red-500 border-2 border-red-500/50 rounded-lg font-bold hover:bg-red-500/30 transition-all"
                    >
                      Delete Masjid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-black mb-2">All Events</h1>
              <p
                className={`text-lg ${
                  isDark ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Manage events from all masjids
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-2xl p-6 border-2 ${
                    isDark
                      ? "bg-zinc-900 border-white/10"
                      : "bg-zinc-50 border-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-black">{event.title}</h3>
                  </div>
                  <p
                    className={`mb-3 text-sm font-bold ${
                      isDark ? "text-zinc-500" : "text-zinc-600"
                    }`}
                  >
                    {event.masjidName}
                  </p>
                  <p
                    className={`mb-4 ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-bold">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-bold">{event.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteClick("event", event.id, event.title)
                    }
                    className="w-full py-2 rounded-lg font-bold bg-red-500/20 text-red-500 border-2 border-red-500/50 hover:bg-red-500/30 transition-all"
                  >
                    Delete Event
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-black mb-2">All Posts</h1>
              <p
                className={`text-lg ${
                  isDark ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Manage posts and announcements from all masjids
              </p>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-2xl p-6 border-2 ${
                    isDark
                      ? "bg-zinc-900 border-white/10"
                      : "bg-zinc-50 border-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-black mb-2">{post.title}</h3>
                      <p
                        className={`text-sm font-bold mb-3 ${
                          isDark ? "text-zinc-500" : "text-zinc-600"
                        }`}
                      >
                        {post.masjidName}
                      </p>
                      <p
                        className={`mb-4 ${
                          isDark ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {post.content}
                      </p>
                      <div
                        className={`flex items-center gap-4 text-sm ${
                          isDark ? "text-zinc-500" : "text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {post.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {post.views.toLocaleString()} views
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteClick("post", post.id, post.title)
                    }
                    className="w-full py-2 rounded-lg font-bold bg-red-500/20 text-red-500 border-2 border-red-500/50 hover:bg-red-500/30 transition-all"
                  >
                    Delete Post
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-8 ${
              isDark ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black mb-2">Confirm Deletion</h2>
              <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                Are you sure you want to delete this {deleteTarget.type}?
              </p>
            </div>

            <div
              className={`p-4 rounded-lg mb-6 ${
                isDark ? "bg-black/50" : "bg-zinc-100"
              }`}
            >
              <p className="font-bold mb-1">
                {deleteTarget.type.charAt(0).toUpperCase() +
                  deleteTarget.type.slice(1)}
                :
              </p>
              <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                {deleteTarget.name}
              </p>
            </div>

            {deleteTarget.type === "masjid" && (
              <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
                <p className="text-red-500 font-bold text-sm">
                  ⚠️ Warning: This will also delete all events and posts
                  associated with this masjid!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${
                  isDark
                    ? "border-white/10 hover:bg-white/5"
                    : "border-black/10 hover:bg-black/5"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-400 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
