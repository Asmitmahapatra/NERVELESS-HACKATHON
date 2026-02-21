import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { apiRequest } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Database, FileDown, ShieldCheck, Users } from "lucide-react";

const COLORS = ["#7c8cff", "#10d7b5", "#ff9f43", "#ff6b7d", "#5f7cff"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [exportPreview, setExportPreview] = useState(null);
  const { pushToast } = useToast();

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, exportRes] = await Promise.all([
        apiRequest("/admin/stats"),
        apiRequest("/admin/export"),
      ]);
      setStats(statsRes || null);
      setExportPreview(exportRes || null);
    } catch (err) {
      pushToast({ title: "Admin data load failed", description: err.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  function downloadExport() {
    if (!exportPreview) return;
    const blob = new Blob([JSON.stringify(exportPreview, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alumlink-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast({ title: "Export ready", description: "Admin dataset downloaded.", variant: "success" });
  }

  const kpiCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Total Users", value: stats.users ?? 0, icon: <Users size={18} /> },
      { label: "Active Mentors", value: stats.mentors ?? 0, icon: <ShieldCheck size={18} /> },
      { label: "Total Bookings", value: stats.bookings ?? 0, icon: <Database size={18} /> },
    ];
  }, [stats]);

  const distributionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Jobs", value: stats.jobs || 0 },
      { name: "Events", value: stats.events || 0 },
      { name: "Posts", value: stats.posts || 0 },
      { name: "Bookings", value: stats.bookings || 0 },
    ];
  }, [stats]);

  const dailyData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Users Today", value: stats.usersToday || 0 },
      { name: "Jobs Today", value: stats.jobsToday || 0 },
      { name: "Bookings Today", value: stats.bookingsToday || 0 },
      { name: "Upcoming Events", value: stats.upcomingEvents || 0 },
    ];
  }, [stats]);

  if (loading) return <Loader label="Loading admin command center..." />;
  if (!stats) return <EmptyState title="Admin stats unavailable" detail="Please retry in a few seconds." />;

  return (
    <div className="grid">
      <PageHeader
        title="Admin Command Center"
        subtitle="Monitor growth metrics, content activity, and platform operations in one view."
        action={
          <button className="btn btn-primary" onClick={downloadExport} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FileDown size={16} />
            Export Data
          </button>
        }
      />

      <section className="section-grid">
        {kpiCards.map((card) => (
          <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
        ))}
      </section>

      <section className="grid mobile-col" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <article className="card" style={{ height: 320 }}>
          <h3 style={{ marginTop: 0 }}>Daily Operations</h3>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#a1a1b5" />
              <YAxis stroke="#a1a1b5" />
              <Tooltip />
              <Bar dataKey="value" fill="#7c8cff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card" style={{ height: 320 }}>
          <h3 style={{ marginTop: 0 }}>Content Distribution</h3>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="card stack">
        <h3 style={{ marginTop: 0 }}>System Snapshot</h3>
        <div className="muted">Mode: {exportPreview?.demoMode ? "Demo" : "MongoDB-backed"}</div>
        <div className="muted">Users in export payload: {(exportPreview?.users || []).length}</div>
        <div className="muted">Latest check: {new Date().toLocaleString()}</div>
      </section>
    </div>
  );
}
