import { useEffect, useMemo, useState } from "react";
import { Gauge, Link2, Sparkles, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mode, setMode] = useState("matches");
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, m, c] = await Promise.all([
          apiRequest("/auth/profile"),
          apiRequest("/users/matches"),
          apiRequest("/users/connections"),
        ]);
        setProfile(profileRes?.user || null);
        setMatches(Array.isArray(m) ? m : []);
        setConnections(Array.isArray(c) ? c : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgScore = useMemo(() => {
    if (!matches.length) return 0;
    const total = matches.reduce((sum, item) => sum + (Number(item.matchScore) || 0), 0);
    return Math.round(total / matches.length);
  }, [matches]);

  async function connectTo(userId) {
    try {
      await apiRequest(`/users/connect/${userId}`);
      const updated = await apiRequest("/users/connections");
      setConnections(Array.isArray(updated) ? updated : []);
      setMode("connections");
      pushToast({ title: "Connection request sent", variant: "success" });
    } catch (err) {
      pushToast({ title: "Could not connect", description: err.message, variant: "error" });
    }
  }

  const trendData = useMemo(() => {
    const top = matches.slice(0, 6);
    return top.map((item, index) => ({
      name: item.name?.split(" ")[0] || `Match ${index + 1}`,
      score: Number(item.matchScore) || 0,
    }));
  }, [matches]);

  if (loading) {
    return <Loader label="Building your personalized dashboard..." />;
  }

  const list = mode === "matches" ? matches : connections;

  return (
    <div className="grid">
      <PageHeader
        title={`Hi ${profile?.name || "there"}, your network is growing 🚀`}
        subtitle="Track your match quality, expand connections, and convert opportunities into outcomes."
      />

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <StatCard icon={<Users size={18} />} label="Top Matches" value={matches.length} onClick={() => setMode("matches")} />
        <StatCard icon={<Link2 size={18} />} label="Connections" value={connections.length} onClick={() => setMode("connections")} />
        <StatCard icon={<Gauge size={18} />} label="Avg Match Score" value={`${avgScore}%`} onClick={() => setMode("matches")} />
      </section>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>{mode === "matches" ? "Best Matches for You" : "Your Connections"}</h2>
        {!list.length ? (
          <EmptyState title={`No ${mode} found yet`} detail="Complete your profile and keep engaging to improve recommendations." />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {list.slice(0, 8).map((item) => (
              <article key={item._id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div className="muted" style={{ fontSize: ".9rem" }}>{item.industry || item.role || "Alumni"}</div>
                {mode === "matches" && (
                  <>
                    <div style={{ marginTop: 8 }} className="badge">{item.matchScore || 0}% match</div>
                    <button className="btn btn-soft" style={{ marginTop: 10 }} onClick={() => connectTo(item._id)}>
                      Connect
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-grid">
        <article className="card stack">
          <div className="muted">Profile Strength</div>
          <div className="kpi">{Math.min(100, 40 + (profile?.skills?.length || 0) * 10)}%</div>
          <div className="muted">Add skills, location, and industry details to improve matching quality.</div>
        </article>
        <article className="card stack">
          <div className="muted">Network Momentum</div>
          <div className="kpi">{connections.length * 3 + matches.length}</div>
          <div className="muted">Composite score based on active matches and accepted connections.</div>
        </article>
        <article className="card stack">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} />
            <strong>Recommendation</strong>
          </div>
          <div className="muted">
            {matches.length > 3
              ? "You have strong discovery coverage—start converting matches to direct conversations."
              : "Complete profile fields and engage in forum/events to unlock stronger alumni recommendations."}
          </div>
        </article>
      </section>

      <section className="card" style={{ height: 300 }}>
        <h3 style={{ marginTop: 0 }}>Match Quality Trend</h3>
        {trendData.length ? (
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#a1a1b5" />
              <YAxis stroke="#a1a1b5" />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#10d7b5" fill="rgba(16,215,181,0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Not enough match data" detail="Complete profile details to generate richer analytics." />
        )}
      </section>
    </div>
  );
}
