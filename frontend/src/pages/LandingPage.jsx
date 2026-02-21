import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="container" style={{ padding: "4rem 0" }}>
      <div className="glass" style={{ borderRadius: 24, padding: "2.2rem" }}>
        <div className="badge" style={{ marginBottom: ".8rem" }}>
          <Sparkles size={14} style={{ marginRight: 6 }} />
          Next-Gen Alumni Network
        </div>
        <h1 className="title" style={{ fontSize: "2.3rem", maxWidth: 760 }}>
          Build career-changing connections with mentors, events, jobs, and community in one platform.
        </h1>
        <p className="subtitle" style={{ maxWidth: 700, fontSize: "1.02rem" }}>
          AlumLink Pro matches students with the right alumni based on skills and interests, then turns that into real opportunities.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: "1.2rem", flexWrap: "wrap" }}>
          <Link to="/login" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            Launch Platform
            <ArrowRight size={16} />
          </Link>
          <a href="/api/health" className="btn btn-soft">
            Backend Health
          </a>
        </div>
      </div>
    </div>
  );
}
