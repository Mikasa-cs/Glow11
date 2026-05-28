// src/pages/UsersPage.jsx
// Admin-only: shows all users fetched from backend SQLite, lets admin promote/demote roles.

import { useState, useEffect, useCallback } from "react";

const fmtIST = (s) => s ? new Date(s).toLocaleString("en-IN", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}) + " IST" : "–";
import { dbGetAllUsers, dbSetRole, dbGetLoginLogs } from "../auth/db";
import { useAuth } from "../auth/AuthContext";
import { C } from "../theme/colors";

const MASTER_ADMIN_EMAIL = "shivi5035singh@gmail.com";

export default function UsersPage() {
  const { user } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [tab,      setTab]      = useState("users");
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(false);

  // Admin needs to re-supply password for sensitive ops — stored in session state only
  const [adminPass, setAdminPass] = useState("");
  const [passPrompt, setPassPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const refresh = useCallback(async () => {
    if (!user || !adminPass) return;
    setLoading(true);
    const BACKEND = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const params = new URLSearchParams({ admin_email: user.email, admin_password: adminPass });
    const [usersRes, logsRes, ordersRes] = await Promise.all([
      dbGetAllUsers(user.email, adminPass),
      dbGetLoginLogs(user.email, adminPass),
      fetch(`${BACKEND}/api/admin/orders?${params}`).then(r => r.json()).catch(() => ({ orders: [] })),
    ]);
    if (usersRes.ok) setUsers(usersRes.users);
    else showToast(usersRes.message, false);
    if (logsRes.ok) setLogs(logsRes.logs);
    setOrders(ordersRes.orders || []);
    setLoading(false);
  }, [user, adminPass]);

  useEffect(() => {
    if (adminPass) refresh();
  }, [adminPass, refresh]);

  const toggleRole = (u) => {
    if (u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast("Master admin role cannot be changed.", false);
      return;
    }
    const newRole = u.role === "admin" ? "user" : "admin";
    setPendingAction({ userId: u.id, newRole, userName: u.name });
  };

  const confirmToggle = async () => {
    if (!pendingAction) return;
    const { userId, newRole, userName } = pendingAction;
    setPendingAction(null);
    const result = await dbSetRole(userId, newRole, user.email, adminPass);
    if (result.ok) {
      showToast(`${userName} is now ${newRole}.`);
      refresh();
    } else {
      showToast(result.message, false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // ── Password prompt (shown once) ────────────────────────────────────────
  if (!adminPass) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: C.text }}>🔐 Admin Verification</div>
        <p style={{ color: C.muted, fontSize: "0.85rem", textAlign: "center", maxWidth: 320 }}>
          Enter your admin password to access user management.
        </p>
        <input
          type="password"
          placeholder="Your admin password"
          onKeyDown={(e) => { if (e.key === "Enter" && e.target.value) setAdminPass(e.target.value); }}
          style={{
            padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`,
            background: C.bg2, color: C.text, fontSize: "0.9rem", outline: "none", width: 280,
          }}
          autoFocus
        />
        <button
          onClick={(e) => {
            const input = e.target.previousSibling;
            if (input && input.value) setAdminPass(input.value);
          }}
          style={{
            padding: "9px 24px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
            color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem",
          }}
        >
          Verify
        </button>
      </div>
    );
  }

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
        }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Confirm role change modal */}
      {pendingAction && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "2rem", maxWidth: 340, width: "90%",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.text, marginBottom: 10 }}>
              Confirm Role Change
            </div>
            <p style={{ color: C.muted, fontSize: "0.85rem", marginBottom: 20 }}>
              Make <strong style={{ color: C.text }}>{pendingAction.userName}</strong> a{" "}
              <strong style={{ color: C.accent2 }}>{pendingAction.newRole}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setPendingAction(null)} style={{
                padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg2, color: C.muted, cursor: "pointer", fontWeight: 600,
              }}>Cancel</button>
              <button onClick={confirmToggle} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
                color: "#fff", cursor: "pointer", fontWeight: 700,
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
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
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "8px 18px", borderRadius: 10, border: `1px solid ${C.border}`,
            background: C.bg2, color: C.muted, cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.82rem", fontWeight: 600,
          }}
        >
          {loading ? "⏳ Loading…" : "🔄 Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: "1.75rem" }}>
        {[
          { label: "Total Users",  value: users.length,                              icon: "👤", color: C.accent2 },
          { label: "Admins",       value: users.filter(u => u.role === "admin").length, icon: "🛠️", color: C.warning },
          { label: "Login Logs",   value: logs.length,                                icon: "📋", color: C.accent4 },
          { label: "Total Orders", value: orders.length,                              icon: "🛒", color: C.accent },
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
          { id: "users",    label: "👤 Accounts" },
          { id: "logs",     label: "📋 Login Logs" },
          { id: "purchase", label: "🛒 Purchase History" },
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

          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 2.5fr 1fr 1fr",
              padding: "10px 18px", background: C.bg2,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {["Name", "Email", "Role", "Action"].map((h) => (
                <div key={h} style={{
                  color: C.muted, fontSize: "0.72rem",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                }}>{h}</div>
              ))}
            </div>

            {loading && (
              <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
                ⏳ Loading users…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
                No users found.
              </div>
            )}

            {!loading && filtered.map((u, i) => {
              const isMasterAdmin = u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
              const isAdmin = u.role === "admin";
              return (
                <div key={u.id} style={{
                  display: "grid", gridTemplateColumns: "2fr 2.5fr 1fr 1fr",
                  padding: "13px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  background: isMasterAdmin ? C.accent2 + "08" : "transparent",
                }}>
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
                      <div style={{ color: C.muted, fontSize: "0.7rem" }}>ID #{u.id}</div>
                    </div>
                  </div>

                  <div style={{
                    color: C.muted, fontSize: "0.8rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {u.email}
                  </div>

                  <div>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 6,
                      fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                      background: isAdmin ? C.warning + "20" : C.accent4 + "20",
                      color:      isAdmin ? C.warning       : C.accent4,
                      border: `1px solid ${isAdmin ? C.warning + "44" : C.accent4 + "44"}`,
                    }}>
                      {isAdmin ? "🛠️ Admin" : "👤 User"}
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={isMasterAdmin}
                      style={{
                        padding: "5px 12px", borderRadius: 8,
                        border: `1px solid ${isMasterAdmin ? C.border : isAdmin ? "#e5484d44" : C.accent2 + "44"}`,
                        background: isMasterAdmin ? C.bg2 : isAdmin ? "#e5484d22" : C.accent2 + "22",
                        color: isMasterAdmin ? C.muted : isAdmin ? "#e5484d" : C.accent2,
                        fontSize: "0.75rem", fontWeight: 700,
                        cursor: isMasterAdmin ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
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

          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
              ⏳ Loading logs…
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
              No login attempts recorded yet.
            </div>
          )}

          {!loading && logs.slice(0, 100).map((l, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2.5fr 1fr 2fr",
              padding: "11px 18px",
              borderBottom: i < Math.min(logs.length, 100) - 1 ? `1px solid ${C.border}` : "none",
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
              <div style={{ color: C.muted, fontSize: "0.75rem" }}>{fmtIST(l.logged_at)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "purchase" && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr",
            padding: "10px 18px", background: C.bg2,
            borderBottom: `1px solid ${C.border}`,
          }}>
            {["User", "Order ID", "Total", "Items", "Date (IST)"].map((h) => (
              <div key={h} style={{
                color: C.muted, fontSize: "0.72rem",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              }}>{h}</div>
            ))}
          </div>

          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
              ⏳ Loading orders…
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: C.muted }}>
              No orders found.
            </div>
          )}

          {!loading && orders.slice(0, 200).map((o, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr",
              padding: "11px 18px",
              borderBottom: i < Math.min(orders.length, 200) - 1 ? `1px solid ${C.border}` : "none",
              alignItems: "center",
            }}>
              <div>
                <div style={{ color: C.text, fontSize: "0.82rem", fontWeight: 600 }}>{o.user_name || "—"}</div>
                <div style={{ color: C.muted, fontSize: "0.7rem" }}>{o.user_email}</div>
              </div>
              <div style={{ fontFamily: "monospace", color: C.accent2, fontSize: "0.78rem", fontWeight: 700 }}>{o.order_id}</div>
              <div style={{ color: C.text, fontSize: "0.82rem", fontWeight: 600 }}>
                Rp {Math.round(o.total || 0).toLocaleString("id-ID")}
              </div>
              <div style={{ color: C.muted, fontSize: "0.75rem" }}>
                {(o.items || []).slice(0, 2).map(it => it.name?.slice(0, 18)).join(", ")}
                {(o.items || []).length > 2 ? ` +${(o.items||[]).length - 2} more` : ""}
              </div>
              <div style={{ color: C.muted, fontSize: "0.72rem" }}>{fmtIST(o.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}