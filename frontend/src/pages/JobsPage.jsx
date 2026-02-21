import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: "", type: "" });

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

  const title = useMemo(() => `Open Opportunities (${jobs.length})`, [jobs.length]);

  return (
    <div className="grid">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div className="grid" style={{ gridTemplateColumns: "2fr 2fr 1fr", alignItems: "center" }}>
          <input className="input" placeholder="Location" value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} />
          <select className="select" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
            <option value="">All types</option>
            <option value="fulltime">Full-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
          <button className="btn btn-primary" onClick={loadJobs}>Filter</button>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading jobs..." />
      ) : (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {jobs.map((job) => (
            <article key={job._id} className="card">
              <h3 style={{ marginTop: 0 }}>{job.title}</h3>
              <p className="muted" style={{ marginTop: -6 }}>{job.company || job.postedBy?.name}</p>
              <div style={{ display: "flex", gap: 10, fontSize: ".9rem" }} className="muted">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={14} />{job.location}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><BriefcaseBusiness size={14} />{job.type}</span>
              </div>
              <p style={{ minHeight: 42 }}>{job.description}</p>
              <button className="btn btn-primary" onClick={() => apply(job._id)}>Apply</button>
            </article>
          ))}
          {!jobs.length && <div className="card muted">No jobs found for these filters.</div>}
        </section>
      )}
    </div>
  );
}
