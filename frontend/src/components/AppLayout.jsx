import React from "react";
import { LogOut, Users, BriefcaseBusiness, CalendarDays, MessageSquare, Sparkles } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: Users },
  { to: "/app/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/forum", label: "Forum", icon: MessageSquare },
  { to: "/app/mentors", label: "Mentors", icon: Sparkles },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: "1.2rem 0 1.8rem" }}>
      <header className="glass" style={{ borderRadius: 16, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800 }}>AlumLink Pro</div>
            <div className="muted" style={{ fontSize: ".9rem" }}>Welcome back, {user?.name}</div>
          </div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="btn btn-soft"
                style={({ isActive }) => ({
                  opacity: isActive ? 1 : 0.8,
                  border: isActive ? "1px solid rgba(124,140,255,0.55)" : "1px solid transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                {React.createElement(item.icon, { size: 16 })}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="btn btn-soft"
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
