import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    skills: "",
    industry: "",
    location: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/app/dashboard";

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          industry: form.industry,
          location: form.location,
        });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 980, padding: "2rem 0" }}>
      <div className="grid mobile-col" style={{ gridTemplateColumns: "1.05fr 1.2fr", gap: "1rem" }}>
        <aside className="glass stack" style={{ borderRadius: 18, padding: "1.3rem" }}>
          <h2 className="title" style={{ fontSize: "1.5rem" }}>AlumLink Pro</h2>
          <p className="subtitle" style={{ marginTop: 0 }}>
            A complete alumni networking workspace for mentorship, opportunities, and community.
          </p>
          <div className="pill">Career guidance from verified alumni</div>
          <div className="pill">Role-based dashboard and networking</div>
          <div className="pill">Jobs, events, forums, and mentoring in one app</div>
        </aside>

        <div className="glass" style={{ borderRadius: 18, padding: "1.3rem" }}>
          <h1 className="title">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="subtitle">{isLogin ? "Sign in to continue to AlumLink Pro" : "Start networking with your alumni community"}</p>

          <div style={{ display: "flex", gap: 8, margin: "1rem 0" }}>
            <button className={`btn ${isLogin ? "btn-primary" : "btn-soft"}`} onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button className={`btn ${!isLogin ? "btn-primary" : "btn-soft"}`} onClick={() => setIsLogin(false)}>
              Register
            </button>
          </div>

          <form className="grid" onSubmit={onSubmit}>
            {!isLogin && (
              <>
                <input className="input" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                <select className="select" value={form.role} onChange={(e) => update("role", e.target.value)}>
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
                <input className="input" placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => update("skills", e.target.value)} />
                <input className="input" placeholder="Industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
                <input className="input" placeholder="Location" value={form.location} onChange={(e) => update("location", e.target.value)} />
              </>
            )}

            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} required />

            {error && <div style={{ color: "#ff9ca8", fontSize: ".92rem" }}>{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
