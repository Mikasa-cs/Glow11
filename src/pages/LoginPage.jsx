// src/pages/LoginPage.jsx — PaymentGateway-themed Login/Register
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { dbRegister, dbAdminRegister } from "../auth/db";

// PaymentGateway Blossom theme (same as PG default)
const T = {
  bg: "#fff5f7", surface: "#ffffff", card: "#ffffff",
  border: "#fcd5ce", borderStrong: "#f4a0bb",
  accent: "#e879a0", accentSoft: "#fce7f3",
  accentGrad: "linear-gradient(135deg, #f8a5c2 0%, #c77dff 100%)",
  text: "#3d1a26", textMid: "#8c4a6e", textSoft: "#c985aa",
  danger: "#ef4444", success: "#10b981",
  chip: "#fce7f3", chipText: "#be185d",
};

const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes orb1 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(30px,-20px) scale(1.1); } }
@keyframes orb2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-20px,30px) scale(0.9); } }
.lp-input:focus { border-color: #e879a0 !important; box-shadow: 0 0 0 3px #fce7f3 !important; outline: none; }
.lp-tab:hover { opacity: 0.85; }
.lp-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.lp-btn:active { transform: scale(0.97); }
.lp-btn, .lp-tab { transition: all 0.18s ease; }
`;

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
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(()=>{
    const id="lp-css";
    if(!document.getElementById(id)){
      const el=document.createElement("style");
      el.id=id; el.textContent=LOGIN_CSS;
      document.head.appendChild(el);
    }
  },[]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,300));
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
    await new Promise(r=>setTimeout(r,300));
    const reg = await dbRegister(email.trim(), password, name.trim());
    if (!reg.ok) { setError(reg.message); setLoading(false); return; }
    const result = await login(email.trim(), password);
    if (!result.ok) { setSuccess("Account created! Please sign in."); setTab("login"); setPassword(""); }
    setLoading(false);
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim() || !email.trim() || !password || !adminEmail.trim() || !adminPassword) {
      setError("Please fill in all fields."); return;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,300));
    const reg = await dbAdminRegister(email.trim(), password, name.trim(), adminEmail.trim(), adminPassword);
    if (!reg.ok) { setError(reg.message); setLoading(false); return; }
    setSuccess("Admin account created! Please sign in.");
    setTab("login");
    setEmail(""); setPassword(""); setName(""); setAdminEmail(""); setAdminPassword("");
    setLoading(false);
  };

  const inp = (label, type, value, onChange, placeholder, extra={}) => (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", color:T.textMid, fontSize:"0.78rem", fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</label>
      <input
        className="lp-input"
        type={type} value={value}
        onChange={e=>{onChange(e.target.value);setError("");}}
        placeholder={placeholder}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${T.border}`, background:T.surface, color:T.text, fontSize:"0.9rem", transition:"all 0.2s" }}
        {...extra}
      />
    </div>
  );

  const inpPass = (label, value, onChange, placeholder, show, setShow) => (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", color:T.textMid, fontSize:"0.78rem", fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input
          className="lp-input"
          type={show?"text":"password"} value={value}
          onChange={e=>{onChange(e.target.value);setError("");}}
          placeholder={placeholder}
          style={{ width:"100%", padding:"12px 42px 12px 14px", borderRadius:12, border:`1.5px solid ${T.border}`, background:T.surface, color:T.text, fontSize:"0.9rem", transition:"all 0.2s" }}
        />
        <button type="button" onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.textSoft, fontSize:16, padding:0 }}>
          {show?"🙈":"👁️"}
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id:"login", label:"Sign In" },
    { id:"register", label:"Register" },
    { id:"admin-register", label:"Register Admin" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:"1rem", position:"relative" }}>

      {/* Ambient orbs */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:`${T.accent}18`, top:-100, right:-100, filter:"blur(60px)", animation:"orb1 8s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`${T.accent}0a`, bottom:-80, left:-60, filter:"blur(50px)", animation:"orb2 10s ease-in-out infinite" }}/>
      </div>

      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1, animation:"fadeSlideUp 0.5s ease both" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ width:60, height:60, borderRadius:16, background:T.accentGrad, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:`0 12px 40px ${T.accent}40` }}>
            <span style={{ fontSize:28 }}>✨</span>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.2rem", fontWeight:600, color:T.text, margin:0 }}>Dup Glow</h1>
          <p style={{ color:T.textSoft, fontSize:"0.85rem", marginTop:6 }}>Skincare Intelligence Platform</p>
        </div>

        {!dbReady && (
          <div style={{ background:T.accentSoft, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"0.9rem", marginBottom:"1rem", color:T.textMid, fontSize:"0.82rem", textAlign:"center" }}>
            ⏳ Initialising database…
          </div>
        )}

        <div style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:24, padding:"2rem", boxShadow:`0 24px 60px ${T.accent}15` }}>

          {/* Tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:"1.75rem", background:T.accentSoft, borderRadius:14, padding:4 }}>
            {tabs.map(t=>(
              <button key={t.id} className="lp-tab" onClick={()=>{setTab(t.id);setError("");setSuccess("");}} style={{
                flex:1, padding:"9px 8px", borderRadius:10, border:"none",
                background:tab===t.id?T.accentGrad:"transparent",
                color:tab===t.id?"#fff":T.textMid,
                fontSize:"0.78rem", fontWeight:700, cursor:"pointer",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Sign In */}
          {tab==="login" && (
            <form onSubmit={handleLogin}>
              {inp("Email","email",email,setEmail,"Enter your email",{autoComplete:"email",autoFocus:true})}
              {inpPass("Password",password,setPassword,"Enter your password",showPass,setShowPass)}
              {error && <ErrorBox msg={error} T={T}/>}
              {success && <SuccessBox msg={success} T={T}/>}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Sign In →" T={T}/>
            </form>
          )}

          {/* Register */}
          {tab==="register" && (
            <form onSubmit={handleRegister}>
              {inp("Full Name","text",name,setName,"Your display name",{autoFocus:true})}
              {inp("Email","email",email,setEmail,"your@email.com")}
              {inpPass("Password",password,setPassword,"Min. 6 characters",showPass,setShowPass)}
              {error && <ErrorBox msg={error} T={T}/>}
              {success && <SuccessBox msg={success} T={T}/>}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Create Account & Sign In →" T={T}/>
              <p style={{ color:T.textSoft, fontSize:"0.75rem", textAlign:"center", marginTop:14 }}>
                You'll be signed in automatically after registration.
              </p>
            </form>
          )}

          {/* Admin Register */}
          {tab==="admin-register" && (
            <form onSubmit={handleAdminRegister}>
              <div style={{ background:T.accentSoft, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:"1.25rem", fontSize:"0.8rem", color:T.textMid }}>
                ℹ️ Register as Admin (requires existing admin credentials)
              </div>
              {inp("New Admin Name","text",name,setName,"Display name",{autoFocus:true})}
              {inp("New Admin Email","email",email,setEmail,"new@admin.com")}
              {inpPass("New Admin Password",password,setPassword,"Min. 6 characters",showPass,setShowPass)}
              <div style={{ borderTop:`1.5px dashed ${T.border}`, margin:"1.25rem 0" }}/>
              {inp("Existing Admin Email","email",adminEmail,setAdminEmail,"admin@example.com")}
              {inpPass("Existing Admin Password",adminPassword,setAdminPassword,"Admin password",showAdminPass,setShowAdminPass)}
              {error && <ErrorBox msg={error} T={T}/>}
              {success && <SuccessBox msg={success} T={T}/>}
              <SubmitBtn loading={loading} disabled={!dbReady} label="Create Admin Account →" T={T}/>

            </form>
          )}
        </div>

        <p style={{ textAlign:"center", color:T.textSoft, fontSize:"0.72rem", marginTop:"1.25rem" }}>
          🔒 Session saved locally — you'll stay logged in on refresh.
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg, T }) {
  return (
    <div style={{ background:`${T.danger}15`, border:`1px solid ${T.danger}44`, borderRadius:10, padding:"10px 14px", color:T.danger, fontSize:"0.82rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:8 }}>
      <span>⚠️</span> {msg}
    </div>
  );
}

function SuccessBox({ msg, T }) {
  return (
    <div style={{ background:`${T.success}15`, border:`1px solid ${T.success}44`, borderRadius:10, padding:"10px 14px", color:T.success, fontSize:"0.82rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:8 }}>
      <span>✅</span> {msg}
    </div>
  );
}

function SubmitBtn({ loading, disabled, label, T }) {
  return (
    <button type="submit" disabled={loading||disabled} className={loading||disabled?"":"lp-btn"} style={{
      width:"100%", padding:"14px", borderRadius:14, border:"none",
      background:(loading||disabled)?T.border:T.accentGrad,
      color:(loading||disabled)?T.textSoft:"#fff",
      fontSize:"0.95rem", fontWeight:700,
      cursor:(loading||disabled)?"not-allowed":"pointer",
      letterSpacing:"0.3px",
    }}>
      {loading?"Please wait…":label}
    </button>
  );
}
