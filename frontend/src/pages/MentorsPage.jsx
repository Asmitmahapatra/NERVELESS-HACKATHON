import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiRequest("/mentor/mentors");
        setMentors(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function book(mentorId) {
    if (!date) {
      alert("Select a date first");
      return;
    }
    try {
      await apiRequest("/mentor/book", {
        method: "POST",
        body: {
          mentorId,
          date,
          time: "10:00 AM",
          topic: "Mentorship Session",
        },
      });
      alert("Session booked");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid">
      <section className="card" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong>Select session date:</strong>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 240 }} />
      </section>

      {loading ? (
        <Loader label="Loading mentors..." />
      ) : (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {mentors.map((mentor) => (
            <article className="card" key={mentor._id}>
              <h3 style={{ marginTop: 0 }}>{mentor.name}</h3>
              <p className="muted">{mentor.industry || "Alumni Mentor"}</p>
              <p>{(mentor.skills || []).slice(0, 4).join(" • ")}</p>
              <button className="btn btn-primary" onClick={() => book(mentor._id)}>Book Session</button>
            </article>
          ))}
          {!mentors.length && <div className="card muted">No mentors available right now.</div>}
        </section>
      )}
    </div>
  );
}
