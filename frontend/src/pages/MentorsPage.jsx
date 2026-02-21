import { useCallback, useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import { apiRequest } from "../lib/api";

const slotOptions = ["10:00 AM", "12:30 PM", "3:00 PM", "6:30 PM"];

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(slotOptions[0]);
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");

  const loadMentors = useCallback(async () => {
      setLoading(true);
      try {
        const [data, myBookings] = await Promise.all([
          apiRequest("/mentor/mentors", {
            params: {
              ...(skills.trim() ? { skills: skills.trim() } : {}),
              ...(location.trim() ? { location: location.trim() } : {}),
            },
          }),
          apiRequest("/mentor/bookings").catch(() => []),
        ]);
        setMentors(Array.isArray(data) ? data : []);
        setBookings(Array.isArray(myBookings) ? myBookings : []);
      } finally {
        setLoading(false);
      }
  }, [skills, location]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

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
          time,
          topic: "Mentorship Session",
        },
      });
      alert("Session booked");
      loadMentors();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid">
      <PageHeader
        title="Mentorship Hub"
        subtitle="Find the right mentor, choose a slot, and manage your upcoming sessions."
      />

      <section className="card grid mobile-col" style={{ gridTemplateColumns: "1fr 1fr 1fr auto auto" }}>
        <input className="input" placeholder="Filter by skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <input className="input" placeholder="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="select" value={time} onChange={(e) => setTime(e.target.value)}>
          {slotOptions.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={loadMentors}>Apply</button>
      </section>

      {loading ? (
        <Loader label="Loading mentors..." />
      ) : (
        <>
          <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {mentors.map((mentor) => (
              <article className="card stack" key={mentor._id}>
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>{mentor.name}</h3>
                <p className="muted" style={{ marginTop: 0 }}>{mentor.industry || "Alumni Mentor"}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(mentor.skills || []).slice(0, 5).map((skill) => (
                    <span className="pill" key={`${mentor._id}-${skill}`}>{skill}</span>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => book(mentor._id)}>Book Session</button>
              </article>
            ))}
            {!mentors.length && <EmptyState title="No mentors available" detail="Try relaxing your filters or check back later." />}
          </section>

          <section className="card stack">
            <h3 style={{ marginTop: 0 }}>My Bookings</h3>
            {bookings.length ? (
              bookings.slice(0, 6).map((booking) => (
                <div className="pill" key={booking._id || booking.id}>
                  {new Date(booking.date).toLocaleDateString()} • {booking.time} • {booking.topic || "Mentorship"}
                </div>
              ))
            ) : (
              <div className="muted">No bookings yet. Reserve your first session above.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
