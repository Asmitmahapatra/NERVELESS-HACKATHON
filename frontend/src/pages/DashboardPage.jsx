import { useEffect, useMemo, useState } from "react";
import { Users, Link2, Gauge } from "lucide-react";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mode, setMode] = useState("matches");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [m, c] = await Promise.all([apiRequest("/users/matches"), apiRequest("/users/connections")]);
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

  if (loading) {
    return <Loader label="Building your personalized dashboard..." />;
  }

  const list = mode === "matches" ? matches : connections;

  return (
    <div className="grid">
      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <StatCard icon={<Users size={18} />} label="Top Matches" value={matches.length} onClick={() => setMode("matches")} />
        <StatCard icon={<Link2 size={18} />} label="Connections" value={connections.length} onClick={() => setMode("connections")} />
        <StatCard icon={<Gauge size={18} />} label="Avg Match Score" value={`${avgScore}%`} onClick={() => setMode("matches")} />
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{mode === "matches" ? "Best Matches for You" : "Your Connections"}</h2>
        {!list.length ? (
          <p className="muted">No {mode} found yet.</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {list.slice(0, 8).map((item) => (
              <article key={item._id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div className="muted" style={{ fontSize: ".9rem" }}>{item.industry || item.role || "Alumni"}</div>
                {mode === "matches" && <div style={{ marginTop: 8 }} className="badge">{item.matchScore || 0}% match</div>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
