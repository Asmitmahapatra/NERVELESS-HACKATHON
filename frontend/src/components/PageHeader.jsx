export default function PageHeader({ title, subtitle, action }) {
  return (
    <section className="card" style={{ padding: "1.15rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="title" style={{ fontSize: "1.45rem" }}>{title}</h1>
          {subtitle && <p className="subtitle" style={{ margin: "0.35rem 0 0" }}>{subtitle}</p>}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </section>
  );
}
