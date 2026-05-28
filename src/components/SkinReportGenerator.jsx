// src/components/SkinReportGenerator.jsx

import { useState } from "react";

const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const CONCERNS   = ["Acne", "Brightening", "Anti-Aging", "Pore-Care", "Moisturizing", "Soothing"];
const BUDGETS    = ["Under Rs 100", "Rs 100–200", "Rs 200–500", "Rs 500+"];

const DEFAULT_THEME = {
  bg: "#fff5f7", surface: "#ffffff", card: "#ffffff",
  border: "#fcd5ce", borderStrong: "#f4a0bb",
  accent: "#e879a0", accentSoft: "#fce7f3",
  accentGrad: "linear-gradient(135deg, #f8a5c2 0%, #c77dff 100%)",
  text: "#3d1a26", textMid: "#8c4a6e", textSoft: "#c985aa",
  success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
  chip: "#fce7f3", chipText: "#be185d",
};

export default function SkinReportGenerator({
  theme = DEFAULT_THEME,
  user = {},
  chatHistory = [],
  recommendedProducts = [],   // kept for backward compat, no longer used for PDF
}) {
  const t = theme;

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name:     user?.name || "",
    age:      "",
    skinType: "",
    concerns: [],
    budget:   "",
  });
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState("");   // "fetching" | "generating" | ""
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [matchCount, setMatchCount] = useState(null);
  const [hoveredBtn,   setHoveredBtn]   = useState(false);
  const [hoveredPopup, setHoveredPopup] = useState(false);

  function toggleConcern(c) {
    setForm((p) => ({
      ...p,
      concerns: p.concerns.includes(c)
        ? p.concerns.filter((x) => x !== c)
        : [...p.concerns, c],
    }));
  }

  async function handleGenerate() {
    if (!form.skinType) { setError("Please select your skin type."); return; }
    setError(null);
    setLoading(true);
    setSuccess(false);
    setMatchCount(null);

    try {
      // ── Step 1: fetch personalised products from ML engine ──────────────
      setStep("fetching");
      const recRes = await fetch("http://localhost:8000/api/report/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType: form.skinType,
          concerns: form.concerns,
          budget:   form.budget,
          top_n:    50,
        }),
      });

      let personalizedProducts = [];
      if (recRes.ok) {
        const recData = await recRes.json();
        personalizedProducts = recData.products || [];
        setMatchCount(personalizedProducts.length);
      }
      // If fetch fails, fall back to empty list — PDF still generates

      // ── Step 2: generate PDF ─────────────────────────────────────────────
      setStep("generating");
      const res = await fetch("http://localhost:8000/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData:            form,
          chatHistory,
          recommendedProducts: personalizedProducts,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Server error generating PDF");
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `GlowIQ-Report-${form.name || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess(true);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  // ── Shared style helpers ──────────────────────────────────────────────────
  const pill = (active) => ({
    padding: "7px 16px", borderRadius: 999, cursor: "pointer",
    border: `1.5px solid ${active ? t.accent : t.border}`,
    background: active ? t.accentSoft : "transparent",
    color: active ? t.accent : t.textSoft,
    fontSize: 13, fontWeight: active ? 700 : 400,
    transition: "all 0.15s", fontFamily: "inherit",
    letterSpacing: active ? 0.2 : 0,
  });

  const fieldLabel = {
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
    textTransform: "uppercase", color: t.textSoft,
    display: "block", marginBottom: 8,
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1.5px solid ${t.border}`, background: t.surface,
    color: t.text, fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  const sectionCard = {
    background: t.card, border: `1px solid ${t.border}`,
    borderRadius: 14, padding: "18px 20px", marginBottom: 12,
  };

  const sectionTitle = {
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    textTransform: "uppercase", color: t.accent, marginBottom: 14,
    display: "flex", alignItems: "center", gap: 7,
  };

  const dot = {
    width: 6, height: 6, borderRadius: "50%",
    background: t.accentGrad, display: "inline-block", flexShrink: 0,
  };

  // Loading step label
  const stepLabel = step === "fetching"
    ? "Finding matching products…"
    : step === "generating"
    ? "Generating PDF…"
    : "Download GlowIQ Report";

  const renderFormContent = () => (
    <div style={{ maxWidth: 520, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: t.accentSoft, borderRadius: 999, padding: "5px 14px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            textTransform: "uppercase", color: t.accent }}>
            GlowIQ Report
          </span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text,
          margin: "0 0 6px", lineHeight: 1.2 }}>
          Your Personalized<br />
          <span style={{ background: t.accentGrad,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Skin Analysis
          </span>
        </h2>
        <p style={{ fontSize: 13, color: t.textSoft, lineHeight: 1.6, margin: 0 }}>
          Products are matched from our full dataset using your skin profile.
          Chat history is included automatically.
        </p>
      </div>

      {/* Name + Age */}
      <div style={sectionCard}>
        <div style={sectionTitle}><span style={dot} /> Personal details</div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={fieldLabel}>Full name</label>
            <input style={inputStyle} placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Age</label>
            <input style={inputStyle} placeholder="e.g. 22"
              value={form.age}
              onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Skin type */}
      <div style={sectionCard}>
        <div style={sectionTitle}>
          <span style={dot} /> Skin type
          <span style={{ color: t.danger, fontWeight: 900 }}>*</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SKIN_TYPES.map((type) => (
            <button key={type} style={pill(form.skinType === type)}
              onClick={() => setForm((p) => ({ ...p, skinType: type }))}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Concerns */}
      <div style={sectionCard}>
        <div style={sectionTitle}>
          <span style={dot} /> Main concerns
          <span style={{ fontSize: 10, fontWeight: 400, color: t.textSoft,
            textTransform: "none", letterSpacing: 0 }}>
            — pick all that apply
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CONCERNS.map((c) => (
            <button key={c} style={pill(form.concerns.includes(c))}
              onClick={() => toggleConcern(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div style={sectionCard}>
        <div style={sectionTitle}><span style={dot} /> Budget range</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BUDGETS.map((b) => (
            <button key={b} style={pill(form.budget === b)}
              onClick={() => setForm((p) => ({ ...p, budget: b }))}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 140,
          background: t.accentSoft, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: "10px 14px",
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>
            {matchCount !== null ? matchCount : "50+"}
          </div>
          <div style={{ fontSize: 11, color: t.textSoft, marginTop: 2 }}>
            {matchCount !== null ? "matched products" : "products scanned"}
          </div>
        </div>
        {chatHistory.length > 0 && (
          <div style={{
            flex: 1, minWidth: 140,
            background: t.accentSoft, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>
              {chatHistory.length}
            </div>
            <div style={{ fontSize: 11, color: t.textSoft, marginTop: 2 }}>
              chat messages included
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: `${t.danger}18`, border: `1px solid ${t.danger}40`,
          borderRadius: 10, padding: "11px 16px", fontSize: 13,
          color: t.danger, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>!</span> {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          background: `${t.success}18`, border: `1px solid ${t.success}40`,
          borderRadius: 10, padding: "11px 16px", fontSize: 13,
          color: t.success, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>✓</span>
          Report downloaded — {matchCount} personalised products included.
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        onMouseEnter={() => setHoveredBtn(true)}
        onMouseLeave={() => setHoveredBtn(false)}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: loading ? t.accentSoft : hoveredBtn ? t.accent : t.accentGrad,
          color: loading ? t.accent : "#fff",
          fontWeight: 800, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s", fontFamily: "inherit", letterSpacing: 0.3,
          boxShadow: !loading && hoveredBtn
            ? `0 6px 24px ${t.accent}50`
            : `0 2px 12px ${t.accent}28`,
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8 }}>
            <span style={{
              width: 14, height: 14, border: `2px solid ${t.accent}`,
              borderTopColor: "transparent", borderRadius: "50%",
              display: "inline-block",
              animation: "glowiq-spin 0.7s linear infinite",
            }} />
            {stepLabel}
          </span>
        ) : (
          "Download GlowIQ Report"
        )}
      </button>

      <style>{`@keyframes glowiq-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setHoveredPopup(true)}
        onMouseLeave={() => setHoveredPopup(false)}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 60, height: 60, borderRadius: "50%", border: "none",
          background: hoveredPopup ? t.accent : t.accentGrad,
          color: "#fff", fontSize: 24, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: hoveredPopup ? `0 8px 32px ${t.accent}60` : `0 4px 16px ${t.accent}40`,
          transition: "all 0.3s ease", zIndex: 999, fontWeight: 800,
        }}
        title="Generate Skin Report"
      >
        📊
      </button>

      {/* Modal */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, fontFamily: "inherit",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: t.bg, borderRadius: 20, padding: 28,
            maxWidth: 600, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            position: "relative", zIndex: 1001,
          }}>
            {/* Close */}
            <button onClick={() => setIsOpen(false)} style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: t.accentSoft, color: t.accent,
              fontSize: 20, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontWeight: 700, transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.target.style.background = t.accent; e.target.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.target.style.background = t.accentSoft; e.target.style.color = t.accent; }}
            >✕</button>

            {renderFormContent()}
          </div>
        </div>
      )}
    </>
  );
}