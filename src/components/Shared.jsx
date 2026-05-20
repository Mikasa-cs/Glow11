// src/components/Shared.jsx
import { C } from "../theme/colors";

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "1.25rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2
        style={{
          color: C.text,
          fontSize: "1.3rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>{icon}</span> {title}
      </h2>
      {sub && (
        <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: 4 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatCard({ icon, value, label, color }) {
  return (
    <div
      style={{
        background: C.bg2,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "1rem 1.25rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: color || C.text }}>
        {value}
      </div>
      <div
        style={{
          fontSize: "0.72rem",
          color: C.muted,
          marginTop: 3,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Badge({ text }) {
  const colors = {
    High:       { bg: "#3b1c1c", text: C.danger },
    Medium:     { bg: "#2d2410", text: C.warning },
    Low:        { bg: "#122b1e", text: C.accent4 },
    Female:     { bg: "#2b1a28", text: C.accent },
    Male:       { bg: "#1a2033", text: C.accent3 },
    Unisex:     { bg: "#1e2030", text: C.accent2 },
    Budget:     { bg: "#122b1e", text: C.accent4 },
    "Mid-Range":{ bg: "#1e2a10", text: "#86efac" },
    Premium:    { bg: "#1a1a30", text: C.accent2 },
    Luxury:     { bg: "#2d1a10", text: C.warning },
  };
  const s = colors[text] || { bg: C.bg2, text: C.muted };
  return (
    <span
      style={{
        background: s.bg,
        color: s.text,
        padding: "2px 9px",
        borderRadius: 8,
        fontSize: "0.72rem",
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

export const TT = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
      }}
    >
      {label && (
        <p style={{ color: C.muted, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.text, margin: "2px 0" }}>
          {p.name}:{" "}
          <strong>{formatter ? formatter(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};
