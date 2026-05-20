// src/pages/UsersPage.jsx
// Admin-only: shows all users fetched from SQLite, lets admin promote/demote roles.

import { useState, useEffect, useCallback } from "react";
import { dbGetAllUsers, dbSetRole, dbGetLoginLogs } from "../auth/db";
import { C } from "../theme/colors";

const ADMIN_EMAIL = "shivi5035singh@gmail.com";

export default function UsersPage() {
  const [users,    setUsers]    = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [tab,      setTab]      = useState("users"); // "users" | "logs"
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState("");

  const refresh = useCallback(() => {
    setUsers(dbGetAllUsers());
    setLogs(dbGetLoginLogs());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const toggleRole = (u) => {
    if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showToast("Master admin role cannot be changed.", false);
      return;
    }
    const newRole = u.role === "admin" ? "user" : "admin";
    const result = dbSetRole(u.id, newRole);
    if (result.ok) {
      showToast(`${u.name} is now ${newRole}.`);
      refresh();
    } else {
      showToast(result.message, false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div style={{ position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? "#22c55e22" : "#e5484d22",
          border: `1px solid ${toast.ok ? "#22c55e" : "#e5484d"}`,
          borderRadius: 12, padding: "12px 18px",
          color: toast.ok ? "#22c55e" : "#e5484d",
          fontSize: "0.85rem", fontWeight: 600,
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          animation: "fadeIn .2s ease",
        }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 800, color: C.text,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 4,
        }}>
          👥 User Management
        </h2>
        <p style={{ color: C.muted, fontSize: "0.85rem" }}>
          All registered accounts — promote or demote roles instantly.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: "1.75rem" }}>
        {[
          { label: "Total Users",  value: users.length,                          icon: "👤", color: C.accent2 },
          { label: "Admins",       value: users.filter(u => u.role==="admin").length, icon: "🛠️", color: C.warning },
          { label: "Login Logs",   value: logs.length,                            icon: "📋", color: C.accent4 },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "1rem 1.25rem",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: C.muted, fontSize: "0.75rem", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        {[
          { id: "users", label: "👤 Accounts" },
          { id: "logs",  label: "📋 Login Logs" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px", borderRadius: 10, border: "none",
              background: tab === t.id
                ? `linear-gradient(135deg, ${C.accent2}, ${C.accent})`
                : C.bg2,
              color: tab === t.id ? "#fff" : C.muted,
              fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          {/* Search */}
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: "100%", maxWidth: 380, padding: "9px 14px",
              borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.bg2, color: C.text, fontSize: "0.85rem",
              outline: "none", marginBottom: "1rem", boxSizing: "border-box",
            }}
          />

          {/* Table */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 2.5fr 1fr 1fr",
              padding: "10px 18px",
              background: C.bg2,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {["Name", "Email", "Role", "Action"].map((h) => (
                <div key={h} style={{
                  color: C.muted, fontSize: "0.72rem",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
                No users found.
              </div>
            )}

            {filtered.map((u, i) => {
              const isMasterAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
              const isAdmin = u.role === "admin";
              return (
                <div key={u.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2.5fr 1fr 1fr",
                  padding: "13px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  background: isMasterAdmin ? C.accent2 + "08" : "transparent",
                  transition: "background 0.15s",
                }}>
                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
                    }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: C.text, fontSize: "0.85rem", fontWeight: 600 }}>
                        {u.name}
                        {isMasterAdmin && (
                          <span style={{
                            marginLeft: 6, fontSize: "0.62rem", background: C.warning + "22",
                            color: C.warning, borderRadius: 4, padding: "1px 5px", fontWeight: 700,
                          }}>MASTER</span>
                        )}
                      </div>
                      <div style={{ color: C.muted, fontSize: "0.7rem" }}>
                        ID #{u.id}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{
                    color: C.muted, fontSize: "0.8rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {u.email}
                  </div>

                  {/* Role badge */}
                  <div>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 10px", borderRadius: 6,
                      fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                      background: isAdmin ? C.warning + "20" : C.accent4 + "20",
                      color:      isAdmin ? C.warning       : C.accent4,
                      border: `1px solid ${isAdmin ? C.warning + "44" : C.accent4 + "44"}`,
                    }}>
                      {isAdmin ? "🛠️ Admin" : "👤 User"}
                    </span>
                  </div>

                  {/* Toggle button */}
                  <div>
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={isMasterAdmin}
                      title={isMasterAdmin ? "Master admin cannot be changed" : `Make ${isAdmin ? "User" : "Admin"}`}
                      style={{
                        padding: "5px 12px", borderRadius: 8,
                        border: `1px solid ${isMasterAdmin ? C.border : isAdmin ? "#e5484d44" : C.accent2 + "44"}`,
                        background: isMasterAdmin
                          ? C.bg2
                          : isAdmin
                            ? "#e5484d22"
                            : C.accent2 + "22",
                        color: isMasterAdmin
                          ? C.muted
                          : isAdmin
                            ? "#e5484d"
                            : C.accent2,
                        fontSize: "0.75rem", fontWeight: 700,
                        cursor: isMasterAdmin ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}>
                      {isMasterAdmin ? "🔒 Locked" : isAdmin ? "↓ Make User" : "↑ Make Admin"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "logs" && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "2.5fr 1fr 2fr",
            padding: "10px 18px", background: C.bg2,
            borderBottom: `1px solid ${C.border}`,
          }}>
            {["Email", "Result", "Time"].map((h) => (
              <div key={h} style={{
                color: C.muted, fontSize: "0.72rem",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              }}>{h}</div>
            ))}
          </div>

          {logs.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
              No login attempts recorded yet.
            </div>
          )}

          {logs.slice(0, 50).map((l, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2.5fr 1fr 2fr",
              padding: "11px 18px",
              borderBottom: i < Math.min(logs.length, 50) - 1 ? `1px solid ${C.border}` : "none",
              alignItems: "center",
            }}>
              <div style={{ color: C.text, fontSize: "0.82rem" }}>{l.email}</div>
              <div>
                <span style={{
                  padding: "2px 8px", borderRadius: 5,
                  fontSize: "0.7rem", fontWeight: 700,
                  background: l.success ? "#22c55e20" : "#e5484d20",
                  color: l.success ? "#22c55e" : "#e5484d",
                }}>
                  {l.success ? "✅ OK" : "❌ Fail"}
                </span>
              </div>
              <div style={{ color: C.muted, fontSize: "0.75rem" }}>{l.logged_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
