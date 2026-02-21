export default function Loader({ label = "Loading...", fullScreen = false }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: fullScreen ? "100vh" : "180px",
      }}
    >
      <div className="card" style={{ textAlign: "center", minWidth: 220 }}>
        <div
          style={{
            width: 22,
            height: 22,
            margin: "0 auto 0.6rem",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "#7c8cff",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div className="muted">{label}</div>
      </div>
    </div>
  );
}
