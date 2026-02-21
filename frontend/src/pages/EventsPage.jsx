import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import { apiRequest } from "../lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const [data, mine] = await Promise.all([
        apiRequest("/events"),
        apiRequest("/events/my-events").catch(() => []),
      ]);
      setEvents(data.events || []);
      setMyEvents(Array.isArray(mine) ? mine : []);
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

  const list = tab === "upcoming" ? events : myEvents;

  return (
    <div className="grid">
      <PageHeader
        title="Events & Webinars"
        subtitle="Join alumni-led sessions, AMAs, and networking events."
      />

      <section className="card" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className={`btn ${tab === "upcoming" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("upcoming")}>Upcoming</button>
        <button className={`btn ${tab === "my" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("my")}>My Events</button>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {list.map((evt) => (
          <article key={evt._id} className="card stack">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>{evt.title}</h3>
              <span className="badge">{evt.isOnline ? "Online" : "Offline"}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>{new Date(evt.date).toLocaleString()}</p>
            <p style={{ margin: 0 }}>{evt.description}</p>
            <div className="pill" style={{ width: "fit-content" }}>{evt.isOnline ? "Virtual Event" : evt.location || "On-site"}</div>
            {tab === "upcoming" ? (
              <button className="btn btn-primary" onClick={() => rsvp(evt._id)}>
                RSVP
              </button>
            ) : (
              <div className="muted">You're registered as participant/organizer for this event.</div>
            )}
          </article>
        ))}
        {!list.length && (
          <EmptyState
            title={tab === "upcoming" ? "No upcoming events" : "No events joined yet"}
            detail={tab === "upcoming" ? "Check again later for new sessions." : "RSVP to an upcoming event to see it here."}
          />
        )}
      </section>
    </div>
  );
}
