export default function StatCard({ icon, label, value, onClick }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="muted">{label}</span>
        <span>{icon}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: "1.9rem", fontWeight: 700 }}>{value}</div>
    </button>
  );
}
