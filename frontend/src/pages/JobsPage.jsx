import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import { apiRequest } from "../lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: "", type: "" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/jobs", { params: filters });
      setJobs(data.jobs || []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function apply(jobId) {
    try {
      await apiRequest(`/jobs/${jobId}/apply`, { method: "POST" });
      alert("Applied successfully");
    } catch (err) {
      alert(err.message);
    }
  }

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? jobs
      : jobs.filter((job) => {
          const text = `${job.title || ""} ${job.company || ""} ${job.location || ""} ${job.description || ""}`.toLowerCase();
          return text.includes(query);
        });

    const sorted = [...filtered];
    if (sortBy === "title") {
      sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    } else if (sortBy === "company") {
      sorted.sort((a, b) => String(a.company || "").localeCompare(String(b.company || "")));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt || b.postedAt || 0) - new Date(a.createdAt || a.postedAt || 0));
    }
    return sorted;
  }, [jobs, search, sortBy]);

  const title = useMemo(() => `Open Opportunities (${visibleJobs.length})`, [visibleJobs.length]);

  return (
    <div className="grid">
      <PageHeader title="Jobs Marketplace" subtitle="Discover vetted opportunities posted by alumni and apply with one click." />

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div className="grid mobile-col" style={{ gridTemplateColumns: "1.7fr 1.2fr 1fr 1fr 1fr", alignItems: "center" }}>
          <input className="input" placeholder="Search title/company" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" placeholder="Location" value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} />
          <select className="select" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
            <option value="">All types</option>
            <option value="fulltime">Full-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
          <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="title">Title</option>
            <option value="company">Company</option>
          </select>
          <button className="btn btn-primary" onClick={loadJobs}>Filter</button>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading jobs..." />
      ) : (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {visibleJobs.map((job) => (
            <article key={job._id} className="card">
              <h3 style={{ marginTop: 0 }}>{job.title}</h3>
              <p className="muted" style={{ marginTop: -6 }}>{job.company || job.postedBy?.name}</p>
              <div style={{ display: "flex", gap: 10, fontSize: ".9rem" }} className="muted">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={14} />{job.location}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><BriefcaseBusiness size={14} />{job.type}</span>
              </div>
              {job.salary ? <div className="pill" style={{ marginTop: 8, width: "fit-content" }}>{job.salary}</div> : null}
              <p style={{ minHeight: 42 }}>{job.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {(job.skills || []).slice(0, 4).map((skill) => (
                  <span key={skill} className="pill">{skill}</span>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => apply(job._id)}>Apply</button>
            </article>
          ))}
          {!visibleJobs.length && <EmptyState title="No jobs found" detail="Try removing some filters or changing your search query." />}
        </section>
      )}
    </div>
  );
}
