export default function EmptyState({ title, detail }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "1.3rem" }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {detail ? <div className="muted" style={{ marginTop: 6 }}>{detail}</div> : null}
    </div>
  );
}
