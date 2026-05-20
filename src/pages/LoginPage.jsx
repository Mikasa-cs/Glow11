// src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { C } from "../theme/colors";
import { dbRegister, dbAdminRegister } from "../auth/db";

export default function LoginPage() {
  const { login, dbReady } = useAuth();
  const [tab,      setTab]      = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Admin registration fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = await login(email.trim(), password);
    if (!result.ok) setError(result.message);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim() || !email.trim() || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    // Register the user
    const reg = await dbRegister(email.trim(), password, name.trim());
    if (!reg.ok) { setError(reg.message); setLoading(false); return; }

    // Auto-login immediately after registration
    const result = await login(email.trim(), password);
    if (!result.ok) {
      setSuccess("Account created! Please sign in.");
      setTab("login");
      setPassword("");
    }
    setLoading(false);
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim() || !email.trim() || !password || !adminEmail.trim() || !adminPassword) { 
      setError("Please fill in all fields."); 
      return; 
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    const reg = await dbAdminRegister(email.trim(), password, name.trim(), adminEmail.trim(), adminPassword);
    if (!reg.ok) { setError(reg.message); setLoading(false); return; }

    setSuccess("Admin account created! Please sign in.");
    setTab("login");
    setEmail("");
    setPassword("");
    setName("");
    setAdminEmail("");
    setAdminPassword("");
    setLoading(false);
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "11px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? C.danger + "88" : C.border}`,
    background: C.bg2, color: C.text,
    fontSize: "0.9rem", outline: "none",
    transition: "border 0.2s", boxSizing: "border-box",
  });

  const labelStyle = {
    display: "block", color: C.muted,
    fontSize: "0.78rem", fontWeight: 600,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", padding: "1rem",
    }}>
      {/* Background glows */}
      <div style={{ position: "fixed", top: "15%", left: "20%", width: 400, height: 400, background: C.accent2 + "18", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "15%", right: "20%", width: 350, height: 350, background: C.accent + "14", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <h1 style={{
            fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>GlowIQ</h1>
          <p style={{ color: C.muted, fontSize: "0.85rem", marginTop: 6 }}>Skincare Intelligence Platform</p>
        </div>

        {!dbReady && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem", marginBottom: "1rem", color: C.muted, fontSize: "0.82rem", textAlign: "center" }}>
            ⏳ Initialising database…
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2rem", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1.75rem", flexWrap: "wrap" }}>
            {["login", "register", "admin-register"].map((t) => {
              const labels = {
                login: "Sign In",
                register: "Register",
                "admin-register": "Register Admin"
              };
              return (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                  style={{
                    flex: "1 1 auto", minWidth: 100, padding: "9px 12px", borderRadius: 10, border: "none",
                    background: tab === t ? `linear-gradient(135deg, ${C.accent2}, ${C.accent})` : C.bg2,
                    color: tab === t ? "#fff" : C.muted,
                    fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s", textTransform: "capitalize",
                  }}>
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Enter your email" autoComplete="email" autoFocus
                  style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password" autoComplete="current-password"
                    style={{ ...inputStyle(!!error), paddingRight: 42 }}
                    onFocus={(e) => e.target.style.borderColor = C.accent2}
                    onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 0 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Sign In" />
            </form>
          ) : tab === "register" ? (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Full Name</label>
                <input type="text" value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Your display name" autoFocus style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com" style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle(!!error), paddingRight: 42 }}
                    onFocus={(e) => e.target.style.borderColor = C.accent2}
                    onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 0 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Create Account & Sign In" />

              <p style={{ color: C.muted, fontSize: "0.75rem", textAlign: "center", marginTop: 14 }}>
                You'll be signed in automatically after registration.
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdminRegister}>
              <div style={{ background: "#a78bfa18", border: `1px solid #a78bfa44`, borderRadius: 8, padding: "10px 12px", marginBottom: "1.5rem", fontSize: "0.8rem", color: C.muted }}>
                ℹ️ Register as Admin (requires existing admin credentials)
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>New Admin Name</label>
                <input type="text" value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Display name" autoFocus style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>New Admin Email</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="new@admin.com" style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>New Admin Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle(!!error), paddingRight: 42 }}
                    onFocus={(e) => e.target.style.borderColor = C.accent2}
                    onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 0 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem", marginBottom: "1.5rem" }} />

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Existing Admin Email</label>
                <input type="email" value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); setError(""); }}
                  placeholder="admin@example.com" style={inputStyle(!!error)}
                  onFocus={(e) => e.target.style.borderColor = C.accent2}
                  onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                />
              </div>
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={labelStyle}>Existing Admin Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showAdminPass ? "text" : "password"} value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setError(""); }}
                    placeholder="Admin password"
                    style={{ ...inputStyle(!!error), paddingRight: 42 }}
                    onFocus={(e) => e.target.style.borderColor = C.accent2}
                    onBlur={(e) => e.target.style.borderColor = error ? C.danger + "88" : C.border}
                  />
                  <button type="button" onClick={() => setShowAdminPass(!showAdminPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 0 }}>
                    {showAdminPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Create Admin Account" />

              <p style={{ color: C.muted, fontSize: "0.75rem", textAlign: "center", marginTop: 14 }}>
                Default admin: shivi5035singh@gmail.com / QWERTY@123
              </p>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", color: C.muted, fontSize: "0.72rem", marginTop: "1.25rem" }}>
          Session is saved in localStorage — you'll stay logged in on refresh.
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: "#e5484d18", border: "1px solid #e5484d44", borderRadius: 8, padding: "9px 12px", color: "#e5484d", fontSize: "0.82rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
      <span>⚠️</span> {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  return (
    <div style={{ background: "#22c55e18", border: "1px solid #22c55e44", borderRadius: 8, padding: "9px 12px", color: "#22c55e", fontSize: "0.82rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
      <span>✅</span> {msg}
    </div>
  );
}

function SubmitBtn({ loading, disabled, label }) {
  return (
    <button type="submit" disabled={loading || disabled}
      style={{
        width: "100%", padding: "12px", borderRadius: 10, border: "none",
        background: (loading || disabled) ? "#2a2a3a" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
        color: (loading || disabled) ? "#666" : "#fff",
        fontSize: "0.95rem", fontWeight: 700,
        cursor: (loading || disabled) ? "not-allowed" : "pointer",
        transition: "all 0.2s", letterSpacing: "0.3px",
      }}>
      {loading ? "Please wait…" : label}
    </button>
  );
}
