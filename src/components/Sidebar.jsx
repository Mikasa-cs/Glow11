// src/components/Sidebar.jsx
import { C } from "../theme/colors";
import { NAV } from "../theme/nav";

export default function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: C.bg2,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <h1 style={{
          fontSize: "1.1rem",
          fontWeight: 800,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          ✨ GlowIQ
        </h1>
        <p style={{ fontSize: "0.68rem", color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Admin Dashboard
        </p>
      </div>

      {/* User badge */}
      {user && (
        <div style={{
          margin: "12px 10px 4px",
          padding: "8px 12px",
          background: C.accent2 + "14",
          border: `1px solid ${C.accent2}33`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: C.text, fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name || user.username}
            </div>
            <div style={{ color: C.accent2, fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Admin
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: "8px 10px", flex: 1 }}>
        <NavSection label="Analytics">
          {NAV.slice(0, 6).map((item) => (
            <NavBtn key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
          ))}
        </NavSection>

        <NavSection label="Catalogue">
          {NAV.slice(6, 11).map((item) => (
            <NavBtn key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
          ))}
        </NavSection>

        <div style={{ borderTop: `1px solid ${C.border}`, margin: "10px 0" }} />

        {/* AI button */}
        <button
          onClick={() => setPage("chatbot")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            width: "100%", textAlign: "left",
            border: `1px solid ${page === "chatbot" ? C.accent2 : C.border}`,
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
            background: page === "chatbot"
              ? `linear-gradient(135deg, ${C.accent2}22, ${C.accent}11)`
              : C.card,
            color: page === "chatbot" ? C.accent2 : C.text,
          }}
        >
          <span style={{ fontSize: 16 }}>🤖</span> AI Assistant
        </button>

        <div style={{ borderTop: `1px solid ${C.border}`, margin: "10px 0" }} />

        {/* Admin section label */}
        <div style={{
          fontSize: "0.65rem", color: C.muted,
          padding: "2px 10px 4px",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          Admin
        </div>

        {/* User Management button */}
        <button
          onClick={() => setPage("users")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            width: "100%", textAlign: "left",
            border: `1px solid ${page === "users" ? "#a78bfa" : C.border}`,
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
            background: page === "users"
              ? "linear-gradient(135deg, #a78bfa22, #7c3aed11)"
              : C.card,
            color: page === "users" ? "#a78bfa" : C.text,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 16 }}>👥</span> User Management
        </button>
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ padding: "10px 16px 6px", fontSize: "0.72rem", color: C.muted }}>
          <strong style={{ color: C.text }}>1,224 products</strong>
          <br />Indonesian Market · 2024
        </div>

        {onLogout && (
          <div style={{ padding: "6px 10px 14px" }}>
            <button
              onClick={onLogout}
              style={{
                width: "100%", padding: "9px 12px",
                borderRadius: 10, border: `1px solid ${C.border}`,
                background: "none", color: C.muted,
                cursor: "pointer", fontSize: "0.82rem",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f8717188"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              <span style={{ fontSize: 14 }}>🚪</span> Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavSection({ label, children }) {
  return (
    <>
      <div style={{
        fontSize: "0.65rem", color: C.muted,
        padding: "10px 10px 4px",
        textTransform: "uppercase", letterSpacing: "1px",
      }}>
        {label}
      </div>
      {children}
    </>
  );
}

function NavBtn({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10,
        width: "100%", textAlign: "left",
        border: "none", cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: active ? 700 : 500,
        marginBottom: 2,
        background: active
          ? "linear-gradient(135deg, #e8b4d022, #c084fc22)"
          : "none",
        color: active ? "#f0eef8" : "#8b8aaa",
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      {item.label}
    </button>
  );
}
