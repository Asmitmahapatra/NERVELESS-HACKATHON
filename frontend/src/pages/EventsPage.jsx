import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { apiRequest } from "../lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await apiRequest("/events");
      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  }

  async function rsvp(id) {
    try {
      await apiRequest(`/events/${id}/rsvp`, { method: "POST" });
      alert("RSVP confirmed");
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <Loader label="Loading upcoming events..." />;

  return (
    <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
      {events.map((evt) => (
        <article key={evt._id} className="card">
          <h3 style={{ marginTop: 0 }}>{evt.title}</h3>
          <p className="muted">{new Date(evt.date).toLocaleString()}</p>
          <p>{evt.description}</p>
          <div className="muted" style={{ marginBottom: 10 }}>{evt.isOnline ? "Online" : evt.location}</div>
          <button className="btn btn-primary" onClick={() => rsvp(evt._id)}>
            RSVP
          </button>
        </article>
      ))}
      {!events.length && <div className="card muted">No upcoming events yet.</div>}
    </section>
  );
}
