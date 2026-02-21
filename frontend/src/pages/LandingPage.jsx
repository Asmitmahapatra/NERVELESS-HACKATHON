import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="container stack" style={{ padding: "2.2rem 0 2.6rem" }}>
      <div className="glass" style={{ borderRadius: 24, padding: "2.2rem" }}>
        <div className="badge" style={{ marginBottom: ".8rem" }}>
          <Sparkles size={14} style={{ marginRight: 6 }} />
          Next-Gen Alumni Network Platform
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
          <Link to="/app/dashboard" className="btn btn-soft" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            Open App
          </Link>
          <a href="/api/health" className="btn btn-soft">
            Backend Health
          </a>
        </div>
      </div>

      <section className="section-grid">
        <article className="card stack">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Users size={18} />
            <strong>Smart Alumni Matching</strong>
          </div>
          <div className="muted">AI-like matching scores by skills, role, and profile relevance.</div>
          <div className="kpi">98%</div>
        </article>

        <article className="card stack">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <BriefcaseBusiness size={18} />
            <strong>Career Opportunities</strong>
          </div>
          <div className="muted">Centralized jobs board with filters and in-app applications.</div>
          <div className="kpi">500+</div>
        </article>

        <article className="card stack">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={18} />
            <strong>Events & Sessions</strong>
          </div>
          <div className="muted">Host webinars, AMAs, and networking sessions with RSVP workflows.</div>
          <div className="kpi">12K</div>
        </article>

        <article className="card stack">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={18} />
            <strong>Community Forums</strong>
          </div>
          <div className="muted">Topic-driven discussions for referrals, advice, and opportunities.</div>
          <div className="kpi">24/7</div>
        </article>
      </section>

      <section className="card" style={{ textAlign: "center" }}>
        <h2 style={{ marginTop: 4, marginBottom: 8 }}>Ready to transform your alumni network?</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          AlumLink Pro is production-ready with modern UI, MongoDB backend, and deployable infrastructure.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <Link to="/login" className="btn btn-primary">Get Started</Link>
          <a href="/api" className="btn btn-soft">Explore API</a>
        </div>
      </section>
    </div>
  );
}
