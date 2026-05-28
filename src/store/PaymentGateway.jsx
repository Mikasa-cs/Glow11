import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";

// ── Themes ──────────────────────────────────────────────────────────────────
const THEMES = {
  blossom: {
    name: "Blossom",
    swatch: ["#fcd5ce", "#f8a5c2", "#c77dff"],
    light: {
      bg: "#fff5f7", surface: "#ffffff", card: "#ffffff",
      border: "#fcd5ce", borderStrong: "#f4a0bb",
      accent: "#e879a0", accentSoft: "#fce7f3",
      accentGrad: "linear-gradient(135deg, #f8a5c2 0%, #c77dff 100%)",
      text: "#3d1a26", textMid: "#8c4a6e", textSoft: "#c985aa",
      success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
      chip: "#fce7f3", chipText: "#be185d",
    },
    dark: {
      bg: "#1a0d12", surface: "#2a1520", card: "#231018",
      border: "#5a2040", borderStrong: "#8b3060",
      accent: "#f472b6", accentSoft: "#4a1530",
      accentGrad: "linear-gradient(135deg, #db2777 0%, #9333ea 100%)",
      text: "#fde8f0", textMid: "#e8a0c8", textSoft: "#a06080",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#4a1530", chipText: "#f9a8d4",
    },
  },
  lavender: {
    name: "Lavender",
    swatch: ["#e9d5ff", "#a78bfa", "#7c3aed"],
    light: {
      bg: "#f5f3ff", surface: "#ffffff", card: "#ffffff",
      border: "#e9d5ff", borderStrong: "#c4b5fd",
      accent: "#7c3aed", accentSoft: "#ede9fe",
      accentGrad: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      text: "#1e1145", textMid: "#5b21b6", textSoft: "#9c85c8",
      success: "#059669", warning: "#d97706", danger: "#dc2626",
      chip: "#ede9fe", chipText: "#6d28d9",
    },
    dark: {
      bg: "#0f0a1e", surface: "#1a1230", card: "#160e28",
      border: "#3b2770", borderStrong: "#6d28d9",
      accent: "#a78bfa", accentSoft: "#2d1b6b",
      accentGrad: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      text: "#ede9fe", textMid: "#c4b5fd", textSoft: "#7c6aa8",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#2d1b6b", chipText: "#c4b5fd",
    },
  },
  peach: {
    name: "Peach",
    swatch: ["#fed7aa", "#fb923c", "#f97316"],
    light: {
      bg: "#fff7ed", surface: "#ffffff", card: "#ffffff",
      border: "#fed7aa", borderStrong: "#fdba74",
      accent: "#ea6c1a", accentSoft: "#fff0e0",
      accentGrad: "linear-gradient(135deg, #fdba74 0%, #f97316 100%)",
      text: "#3d1a08", textMid: "#9a3412", textSoft: "#c47c50",
      success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
      chip: "#fff0e0", chipText: "#c2410c",
    },
    dark: {
      bg: "#1a0d05", surface: "#2a1508", card: "#231008",
      border: "#5a2508", borderStrong: "#9a3412",
      accent: "#fb923c", accentSoft: "#4a1b05",
      accentGrad: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
      text: "#fff0e0", textMid: "#fdba74", textSoft: "#9a6040",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#4a1b05", chipText: "#fdba74",
    },
  },
  mint: {
    name: "Mint",
    swatch: ["#a7f3d0", "#34d399", "#059669"],
    light: {
      bg: "#f0fdf8", surface: "#ffffff", card: "#ffffff",
      border: "#a7f3d0", borderStrong: "#6ee7b7",
      accent: "#059669", accentSoft: "#ecfdf5",
      accentGrad: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
      text: "#022c22", textMid: "#065f46", textSoft: "#6ab89a",
      success: "#059669", warning: "#d97706", danger: "#dc2626",
      chip: "#ecfdf5", chipText: "#065f46",
    },
    dark: {
      bg: "#051a10", surface: "#0d2b1e", card: "#082318",
      border: "#1a5c3a", borderStrong: "#059669",
      accent: "#34d399", accentSoft: "#0a3020",
      accentGrad: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
      text: "#ecfdf5", textMid: "#6ee7b7", textSoft: "#4a9070",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#0a3020", chipText: "#6ee7b7",
    },
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCard(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
function formatCVV(v) {
  return v.replace(/\D/g, "").slice(0, 4);
}
function detectBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return null;
}

const CART_ITEMS = [
  { id: 1, name: "LANEIGE Lip Sleeping Mask", brand: "LANEIGE", qty: 1, price: 185000, img: "https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/laneige-lip-sleeping-mask-berry-20g.jpg" },
  { id: 2, name: "Some By Mi Toner", brand: "SOME BY MI", qty: 2, price: 125000, img: "https://images.soco.id/8f08ced0-344d-41f4-a15e-9e45c898f92d-.jpg" },
  { id: 3, name: "COSRX Snail Mucin Essence", brand: "COSRX", qty: 1, price: 240000, img: "https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/COSRX_Advanced_Snail_96_Mucin_Power_Essence.jpg" },
];

function fmtRs(n) {
  return "Rs " + Math.round(n).toLocaleString("id-ID");
}

function parsePriceValue(price) {
  if (typeof price === "number") return price;
  return parseInt(String(price || "0").replace(/[^0-9]/g, ""), 10) || 0;
}

function normalizeCartItems(items) {
  const source = items?.length ? items : CART_ITEMS;
  return source.map((item, index) => ({
    id: item.id ?? item.product_id ?? `${item.name || item.product_name || "item"}-${index}`,
    name: item.name || item.product_name || "Skincare item",
    brand: item.brand || "",
    qty: item.qty || 1,
    price: item.isSample || item.price === "FREE" ? 0 : parsePriceValue(item.price ?? item.price_num),
    img: item.img || item.picture_src || "",
  }));
}

// ── Keyframe injection ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=Playfair+Display:wght@500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: 'DM Sans', sans-serif; }

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes slideRight {
  from { transform: translateX(-10px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes cardFlip {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
}
@keyframes cardFlipBack {
  0%   { transform: rotateY(180deg); }
  100% { transform: rotateY(0deg); }
}
@keyframes checkPop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes orb1 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(30px,-20px) scale(1.1); }
}
@keyframes orb2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(-20px,30px) scale(0.9); }
}
@keyframes pulseRing {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes progressFill {
  from { width: 0%; }
  to   { width: var(--progress-w); }
}
@keyframes spinLoader {
  to { transform: rotate(360deg); }
}

.pg-root input, .pg-root select { outline: none; }
.pg-root input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft) !important; }

.pg-step-btn:hover  { opacity: 0.85; transform: translateY(-1px); }
.pg-step-btn:active { transform: scale(0.97); }
.pg-step-btn { transition: all 0.18s ease; }

.pg-method-card:hover  { border-color: var(--accent) !important; transform: translateY(-2px); box-shadow: 0 4px 20px -4px var(--accent-soft); }
.pg-method-card { transition: all 0.2s ease; }
.pg-method-card.selected { border-color: var(--accent) !important; background: var(--accent-soft) !important; }

.pg-theme-swatch:hover { transform: scale(1.1); }
.pg-theme-swatch { transition: transform 0.15s ease; }

.pg-input-wrap input:focus ~ .pg-label, .pg-input-wrap input:not(:placeholder-shown) ~ .pg-label {
  top: 6px; font-size: 10px; color: var(--accent);
}
`;

// ── Card Visual ──────────────────────────────────────────────────────────────
function CreditCardVisual({ number, name, expiry, flipped, brand, T }) {
  const displayNum = (number.replace(/\s/g,"") + "0000000000000000").slice(0,16)
    .match(/.{4}/g).join(" ");
  const displayName = name || "YOUR NAME";
  const displayExp  = expiry || "MM/YY";

  const BrandIcon = () => {
    if (brand === "visa") return (
      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 20, color: "#fff", letterSpacing: 1 }}>VISA</span>
    );
    if (brand === "mastercard") return (
      <span style={{ display: "flex", gap: -6 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#eb001b", display: "inline-block" }} />
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#f79e1b", display: "inline-block", marginLeft: -8, opacity: 0.9 }} />
      </span>
    );
    if (brand === "amex") return <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>AMEX</span>;
    return <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>●●●</span>;
  };

  return (
    <div style={{ perspective: 800, width: 320, height: 190, margin: "0 auto" }}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          borderRadius: 18, padding: "22px 24px",
          background: T.accentGrad,
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            {/* Chip */}
            <div style={{ width: 38, height: 28, borderRadius: 5, background: "linear-gradient(135deg, #d4af37, #f5d96e)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: 0 }}>
                {[...Array(9)].map((_,i) => <div key={i} style={{ border: "0.5px solid rgba(0,0,0,0.2)" }} />)}
              </div>
            </div>
            <BrandIcon />
          </div>

          <div style={{ fontFamily: "monospace", fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,0.95)", marginBottom: 16 }}>
            {displayNum}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>Card Holder</div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {displayName.slice(0, 18)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>Expires</div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, letterSpacing: 2 }}>{displayExp}</div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          borderRadius: 18, overflow: "hidden",
          transform: "rotateY(180deg)",
          background: T.accentGrad,
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginTop: 28, height: 42, background: "rgba(0,0,0,0.35)" }} />
          <div style={{ padding: "14px 24px 0" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, height: 36, borderRadius: 5, background: "rgba(255,255,255,0.9)" }} />
              <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: 5, padding: "8px 12px", minWidth: 50, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#666", marginBottom: 2 }}>CVV</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#333", letterSpacing: 3 }}>
                  {"•".repeat(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Summary Panel ───────────────────────────────────────────────────────
function OrderSummary({ T, items }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 15000;
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + shipping + tax;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeSlideUp 0.4s ease both" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500, color: T.text, marginBottom: 16 }}>
        Order Summary
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0,
              border: `1.5px solid ${T.border}`, background: T.surface,
              position: "relative",
            }}>
              <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }} />
              <div style={{
                position: "absolute", top: -5, right: -5,
                width: 18, height: 18, borderRadius: "50%",
                background: T.accent, color: "#fff",
                fontSize: 10, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.qty}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>{item.brand}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, flexShrink: 0 }}>{fmtRs(item.price * item.qty)}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          ["Subtotal", fmtRs(subtotal)],
          ["Shipping", fmtRs(shipping)],
          ["Tax (11% PPN)", fmtRs(tax)],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.textMid }}>{label}</span>
            <span style={{ fontSize: 13, color: T.text }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1.5px solid ${T.borderStrong}`, marginTop: 12, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
        background: T.accentSoft, borderRadius: 12, padding: "14px 16px", marginTop: 16, border: `2px solid ${T.borderStrong}` }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Total Amount</span>
        <span style={{ fontWeight: 800, fontSize: 22, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {fmtRs(total)}
        </span>
      </div>

      {/* Promo code */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input placeholder="Promo code" style={{
          flex: 1, padding: "10px 14px", borderRadius: 10,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.text, fontSize: 13,
          transition: "all 0.2s",
        }} />
        <button style={{
          padding: "10px 16px", borderRadius: 10,
          border: `1.5px solid ${T.accent}`,
          background: T.accentSoft, color: T.accent,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.accent}
          onMouseLeave={e => e.currentTarget.style.background = T.accentSoft}
        >Apply</button>
      </div>

      {/* Trust badges */}
      <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { icon: "🔒", text: "SSL Secured" },
          { icon: "↩️", text: "Easy Returns" },
          { icon: "⚡", text: "Instant Confirm" },
        ].map(b => (
          <div key={b.text} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: 20,
            background: T.chip, border: `1px solid ${T.border}`,
            fontSize: 11, color: T.chipText, fontWeight: 500,
          }}>
            <span>{b.icon}</span><span>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step, T }) {
  const steps = [
    { n: 1, label: "Delivery" },
    { n: 2, label: "Payment" },
    { n: 3, label: "Review" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: step >= s.n ? T.accentGrad : T.surface,
              border: step >= s.n ? "none" : `2px solid ${T.border}`,
              color: step >= s.n ? "#fff" : T.textSoft,
              fontWeight: 600, fontSize: 14,
              transition: "all 0.3s ease",
              boxShadow: step === s.n ? `0 4px 16px -4px ${T.accent}80` : "none",
            }}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 11, color: step >= s.n ? T.accent : T.textSoft, fontWeight: step === s.n ? 600 : 400, transition: "color 0.3s" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 60, height: 2, margin: "0 4px",
              marginBottom: 18,
              background: step > s.n ? T.accent : T.border,
              borderRadius: 2,
              transition: "background 0.4s ease",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Delivery ──────────────────────────────────────────────────────────
function DeliveryStep({ T, data, setData, onNext }) {
  const inp = (label, key, placeholder, half) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: half ? "1 1 45%" : "1 1 100%" }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: T.textMid, letterSpacing: 0.3 }}>{label}</label>
      <input
        value={data[key] || ""}
        onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          padding: "12px 14px", borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.text, fontSize: 14, transition: "all 0.2s",
        }}
      />
    </div>
  );

  const valid = data.firstName && data.lastName && data.email && data.address && data.city;

  return (
    <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 4 }}>Delivery Details</div>
        <div style={{ fontSize: 13, color: T.textSoft }}>Where should we send your skincare goodies?</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {inp("First Name", "firstName", "Siti", true)}
        {inp("Last Name", "lastName", "Rahayu", true)}
        {inp("Email Address", "email", "siti@example.com")}
        {inp("Phone Number", "phone", "+62 812 3456 7890")}
        {inp("Street Address", "address", "Jl. Sudirman No. 45")}
        {inp("City", "city", "Jakarta", true)}
        {inp("Postal Code", "postal", "12190", true)}
      </div>

      {/* Shipping options */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.textMid, marginBottom: 12 }}>Shipping Method</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "regular", label: "Regular", sub: "3-5 business days", price: "Rs 15.000", icon: "📦" },
            { id: "express", label: "Express", sub: "1-2 business days", price: "Rs 35.000", icon: "⚡" },
            { id: "sameday", label: "Same Day", sub: "Order before 12pm", price: "Rs 55.000", icon: "🚀" },
          ].map(opt => (
            <div
              key={opt.id}
              className="pg-method-card"
              onClick={() => setData(p => ({ ...p, shipping: opt.id }))}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 14,
                border: `1.5px solid ${data.shipping === opt.id ? T.accent : T.border}`,
                background: data.shipping === opt.id ? T.accentSoft : T.surface,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>{opt.sub}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{opt.price}</div>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${data.shipping === opt.id ? T.accent : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {data.shipping === opt.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="pg-step-btn"
        onClick={onNext}
        disabled={!valid}
        style={{
          width: "100%", marginTop: 28, padding: "16px",
          borderRadius: 14, border: "none",
          background: valid ? T.accentGrad : T.border,
          color: valid ? "#fff" : T.textSoft,
          fontSize: 15, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed",
          letterSpacing: 0.3,
        }}
      >
        Continue to Payment →
      </button>
    </div>
  );
}

// ── Step 2: Payment ───────────────────────────────────────────────────────────
function PaymentStep({ T, data, setData, onNext, onBack }) {
  const [cardFlipped, setCardFlipped] = useState(false);

  const paymentMethods = [
    { id: "card", label: "Credit / Debit Card", icon: "💳" },
    { id: "bca", label: "BCA Virtual Account", icon: "🏦" },
    { id: "mandiri", label: "Mandiri ClickPay", icon: "🔵" },
    { id: "gopay", label: "GoPay", icon: "🟢" },
    { id: "ovo", label: "OVO", icon: "🟣" },
    { id: "dana", label: "DANA", icon: "💙" },
  ];

  const brand = detectBrand(data.cardNum || "");

  const inp = (label, key, placeholder, format, onFocus, onBlur) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: T.textMid, letterSpacing: 0.3 }}>{label}</label>
      <input
        value={data[key] || ""}
        onChange={e => setData(p => ({ ...p, [key]: format ? format(e.target.value) : e.target.value }))}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          padding: "12px 14px", borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.text, fontSize: 14, transition: "all 0.2s",
          fontFamily: key === "cardNum" ? "monospace" : "inherit",
          letterSpacing: key === "cardNum" ? 2 : 0,
        }}
      />
    </div>
  );

  return (
    <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 4 }}>Payment Method</div>
        <div style={{ fontSize: 13, color: T.textSoft }}>All transactions are encrypted & secure</div>
      </div>

      {/* Payment method selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {paymentMethods.map(m => (
          <div
            key={m.id}
            className={`pg-method-card ${data.payMethod === m.id ? "selected" : ""}`}
            onClick={() => setData(p => ({ ...p, payMethod: m.id }))}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, padding: "14px 8px", borderRadius: 14,
              border: `1.5px solid ${data.payMethod === m.id ? T.accent : T.border}`,
              background: data.payMethod === m.id ? T.accentSoft : T.surface,
              cursor: "pointer", textAlign: "center",
            }}
          >
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: data.payMethod === m.id ? T.accent : T.textMid, lineHeight: 1.3 }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Card form */}
      {data.payMethod === "card" && (
        <div style={{ animation: "scaleIn 0.3s ease both" }}>
          <div style={{ marginBottom: 24 }}>
            <CreditCardVisual
              number={data.cardNum || ""}
              name={data.cardName || ""}
              expiry={data.cardExp || ""}
              flipped={cardFlipped}
              brand={brand}
              T={T}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {inp("Card Number", "cardNum", "4242 4242 4242 4242", formatCard)}
            {inp("Cardholder Name", "cardName", "SITI RAHAYU")}
            <div style={{ display: "flex", gap: 14 }}>
              {inp("Expiry Date", "cardExp", "MM/YY", formatExpiry)}
              {inp("CVV", "cardCvv", "•••",
                formatCVV,
                () => setCardFlipped(true),
                () => setCardFlipped(false)
              )}
            </div>
          </div>
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 10,
            background: T.chip, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>🔒</span>
            <span style={{ fontSize: 12, color: T.chipText }}>Your card data is encrypted. We never store raw card numbers.</span>
          </div>
        </div>
      )}

      {/* E-wallet / bank transfer */}
      {["bca", "mandiri"].includes(data.payMethod) && (
        <div style={{ animation: "scaleIn 0.3s ease both", padding: "20px", borderRadius: 14, background: T.accentSoft, border: `1.5px solid ${T.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏦</div>
          <div style={{ fontWeight: 600, color: T.text, fontSize: 15, marginBottom: 6 }}>Virtual Account will be generated</div>
          <div style={{ fontSize: 13, color: T.textSoft }}>You'll receive a virtual account number to complete payment via {data.payMethod === "bca" ? "BCA" : "Mandiri"} mobile banking or ATM.</div>
        </div>
      )}

      {["gopay","ovo","dana"].includes(data.payMethod) && (
        <div style={{ animation: "scaleIn 0.3s ease both", padding: "20px", borderRadius: 14, background: T.accentSoft, border: `1.5px solid ${T.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📱</div>
          <div style={{ fontWeight: 600, color: T.text, fontSize: 15, marginBottom: 6 }}>Scan QR to Pay</div>
          {/* Fake QR */}
          <div style={{ width: 100, height: 100, margin: "12px auto", borderRadius: 8, background: T.surface, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, width: 70, height: 70 }}>
              {[...Array(49)].map((_, i) => (
                <div key={i} style={{ borderRadius: 1, background: (i * 31 + i * 7) % 3 === 0 ? T.accent : "transparent" }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textSoft }}>QR Code will be generated after you click continue. Valid for 15 minutes.</div>
        </div>
      )}

      {!data.payMethod && (
        <div style={{ padding: "30px", borderRadius: 14, background: T.surface, border: `1.5px dashed ${T.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👆</div>
          <div style={{ color: T.textSoft, fontSize: 14 }}>Select a payment method above</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="pg-step-btn" onClick={onBack} style={{
          flex: 1, padding: "14px", borderRadius: 14,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.textMid, fontSize: 14, fontWeight: 500, cursor: "pointer",
        }}>← Back</button>
        <button className="pg-step-btn" onClick={onNext} disabled={!data.payMethod} style={{
          flex: 2, padding: "14px", borderRadius: 14, border: "none",
          background: data.payMethod ? T.accentGrad : T.border,
          color: data.payMethod ? "#fff" : T.textSoft,
          fontSize: 15, fontWeight: 600, cursor: data.payMethod ? "pointer" : "not-allowed",
          letterSpacing: 0.3,
        }}>
          Review Order →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Review ────────────────────────────────────────────────────────────
function ReviewStep({ T, data, items, onBack, onPay }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 15000;
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + shipping + tax;
  const Section = ({ title, children }) => (
    <div style={{
      padding: "16px 20px", borderRadius: 14,
      border: `1.5px solid ${T.border}`, background: T.surface, marginBottom: 14,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, val }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: T.textSoft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{val}</span>
    </div>
  );

  const SHIP_LABEL = { regular: "📦 Regular (3-5 days)", express: "⚡ Express (1-2 days)", sameday: "🚀 Same Day" };
  const PAY_LABEL = { card: "💳 Credit / Debit Card", bca: "🏦 BCA Virtual Account", mandiri: "🔵 Mandiri ClickPay", gopay: "🟢 GoPay", ovo: "🟣 OVO", dana: "💙 DANA" };

  return (
    <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 4 }}>Review Your Order</div>
        <div style={{ fontSize: 13, color: T.textSoft }}>Please confirm all details before paying</div>
      </div>

      <Section title="Delivery Address">
        <Row label="Name" val={`${data.firstName} ${data.lastName}`} />
        <Row label="Email" val={data.email} />
        <Row label="Address" val={`${data.address}, ${data.city} ${data.postal}`} />
        <Row label="Shipping" val={SHIP_LABEL[data.shipping] || "–"} />
      </Section>

      <Section title="Payment">
        <Row label="Method" val={PAY_LABEL[data.payMethod] || "–"} />
        {data.payMethod === "card" && data.cardNum && (
          <Row label="Card" val={`•••• •••• •••• ${data.cardNum.replace(/\s/g,"").slice(-4)}`} />
        )}
      </Section>

      <Section title="Price Breakdown">
        <Row label="Subtotal" val={fmtRs(subtotal)} />
        <Row label="Shipping" val={fmtRs(shipping)} />
        <Row label="Tax (11% PPN)" val={fmtRs(tax)} />
        <div style={{ borderTop: `1.5px solid ${T.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 17, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmtRs(total)}
          </span>
        </div>
      </Section>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="pg-step-btn" onClick={onBack} style={{
          flex: 1, padding: "14px", borderRadius: 14,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.textMid, fontSize: 14, fontWeight: 500, cursor: "pointer",
        }}>← Back</button>
        <button className="pg-step-btn" onClick={onPay} style={{
          flex: 2, padding: "14px", borderRadius: 14, border: "none",
          background: T.accentGrad,
          color: "#fff",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          letterSpacing: 0.3,
        }}>
          🔒 Pay {fmtRs(total)}
        </button>
      </div>
    </div>
  );
}

// ── Processing Overlay ────────────────────────────────────────────────────────
function ProcessingOverlay({ T }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        background: T.surface, borderRadius: 24, padding: "48px 40px",
        textAlign: "center", maxWidth: 320, width: "90%",
        border: `1.5px solid ${T.border}`,
        animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 24px" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `3px solid ${T.border}`,
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `3px solid transparent`,
            borderTopColor: T.accent,
            animation: "spinLoader 0.8s linear infinite",
          }} />
          <div style={{ position: "absolute", inset: 8, background: T.accentGrad, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>💳</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 500, color: T.text, marginBottom: 8 }}>Processing Payment</div>
        <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6 }}>Please wait while we securely process your transaction...</div>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ T, data, items, onNewOrder }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0) + 15000 + Math.round(items.reduce((s,i)=>s+i.price*i.qty,0)*0.11);
  const orderId = "DG-" + Math.random().toString(36).slice(2, 9).toUpperCase();

  return (
    <div style={{
      textAlign: "center", padding: "40px 20px",
      animation: "fadeSlideUp 0.5s ease both",
    }}>
      {/* Animated check */}
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 24px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: T.accentGrad, opacity: 0.15, animation: "pulseRing 1.5s ease-out infinite" }} />
        <div style={{
          position: "relative", width: 100, height: 100, borderRadius: "50%",
          background: T.accentGrad,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
        }}>
          <span style={{ fontSize: 42, color: "#fff" }}>✓</span>
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: T.text, marginBottom: 8 }}>
        Payment Successful!
      </div>
      <div style={{ fontSize: 14, color: T.textSoft, marginBottom: 28, lineHeight: 1.7 }}>
        Your order is confirmed. You'll receive a confirmation email at<br />
        <span style={{ color: T.accent, fontWeight: 500 }}>{data.email}</span>
      </div>

      <div style={{
        background: T.surface, borderRadius: 18, padding: "20px 24px",
        border: `1.5px solid ${T.border}`, textAlign: "left", marginBottom: 24,
        animation: "slideRight 0.4s ease 0.3s both",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: `1px dashed ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, color: T.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>Order ID</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.accent, fontFamily: "monospace", marginTop: 2 }}>{orderId}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>Amount Paid</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 2 }}>{fmtRs(total)}</div>
          </div>
        </div>

        {items.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: T.textMid }}>× {item.qty} {item.name.split(" ").slice(0,3).join(" ")}…</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{fmtRs(item.price * item.qty)}</span>
          </div>
        ))}

        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: T.accentSoft, display: "flex", gap: 8, alignItems: "center" }}>
          <span>📦</span>
          <span style={{ fontSize: 12, color: T.chipText }}>Estimated delivery: 2-4 business days to {data.city}</span>
        </div>
      </div>

      <button
        className="pg-step-btn"
        onClick={onNewOrder}
        style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "none",
          background: T.accentGrad, color: "#fff",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}
      >
        Continue Shopping ✨
      </button>
    </div>
  );
}

// ── Theme Panel ───────────────────────────────────────────────────────────────
function ThemePanel({ themeName, setThemeName, isDark, setIsDark, T }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "8px 14px", borderRadius: 20,
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: T.textMid, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
      >
        🎨 Themes
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 44, right: 0, zIndex: 100,
          background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: 16, padding: 16, width: 220,
          boxShadow: `0 20px 60px -10px rgba(0,0,0,0.3)`,
          animation: "scaleIn 0.2s ease both",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Palette</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <div
                key={key}
                className="pg-theme-swatch"
                onClick={() => { setThemeName(key); setOpen(false); }}
                style={{
                  padding: "10px 10px 8px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${themeName === key ? T.accent : T.border}`,
                  background: themeName === key ? T.accentSoft : T.bg,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 5 }}>
                  {theme.swatch.map((c, i) => (
                    <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: c }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: themeName === key ? T.accent : T.textMid }}>{theme.name}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Mode</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[false, true].map(dark => (
                <button
                  key={dark}
                  onClick={() => setIsDark(dark)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${isDark === dark ? T.accent : T.border}`,
                    background: isDark === dark ? T.accentSoft : T.bg,
                    color: isDark === dark ? T.accent : T.textMid,
                    fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                  }}
                >
                  {dark ? "🌙 Dark" : "☀️ Light"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentGateway({ cartItems, onBack, onComplete }) {
  const { user } = useAuth();
  const [themeName, setThemeName] = useState("blossom");
  const [isDark, setIsDark] = useState(false);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  // Pre-fill email and name from logged-in user
  const [formData, setFormData] = useState({ shipping: "regular", payMethod: "card", email: user?.email || "", firstName: user?.name?.split(" ")[0] || "", lastName: user?.name?.split(" ").slice(1).join(" ") || "" });

  const theme = THEMES[themeName];
  const T = isDark ? theme.dark : theme.light;
  const items = normalizeCartItems(cartItems);

  const handlePay = async () => {
    setProcessing(true);
    // Save order to backend
    try {
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const shipping = 15000;
      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + shipping + tax;
      const orderId = "DG-" + Math.random().toString(36).slice(2, 9).toUpperCase();
      await fetch((import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          user_email: user?.email || formData.email,
          user_name: user?.name || `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
          items: items.map(i => ({ id: i.id, name: i.name, brand: i.brand, qty: i.qty, price: i.price })),
          subtotal, shipping, tax, total,
          payment_method: formData.payMethod,
          shipping_method: formData.shipping,
          address: `${formData.address || ""}, ${formData.city || ""} ${formData.postal || ""}`.trim(),
        }),
      });
    } catch (e) { console.error("Order save failed:", e); }
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
    }, 2800);
  };

  const reset = () => {
    setStep(1);
    setDone(false);
    setFormData({ shipping: "regular", payMethod: "card" });
    onComplete?.();
  };

  // Inject CSS once
  useEffect(() => {
    const el = document.getElementById("pg-css");
    if (!el) {
      const style = document.createElement("style");
      style.id = "pg-css";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="pg-root" style={{
      minHeight: "100vh",
      background: T.bg,
      transition: "background 0.4s ease, color 0.4s ease",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: isDark ? `${T.accent}18` : `${T.accent}12`,
          top: -100, right: -100, filter: "blur(60px)",
          animation: "orb1 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: isDark ? `${T.accent}14` : `${T.accent}0a`,
          bottom: -80, left: -60, filter: "blur(50px)",
          animation: "orb2 10s ease-in-out infinite",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1.5px solid ${T.border}`, background: T.surface,
                  color: T.textMid, cursor: "pointer", fontSize: 18,
                }}
                aria-label="Back to store"
              >
                ←
              </button>
            )}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentGrad, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>✨</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: T.text, lineHeight: 1 }}>Dup Glow</div>
              <div style={{ fontSize: 11, color: T.textSoft, letterSpacing: 0.5 }}>Skincare Store</div>
            </div>
          </div>
          <ThemePanel themeName={themeName} setThemeName={setThemeName} isDark={isDark} setIsDark={setIsDark} T={T} />
        </div>

        {!done ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28, alignItems: "start" }}>
            {/* Left: checkout */}
            <div style={{
              background: T.card, borderRadius: 24,
              border: `1.5px solid ${T.border}`, padding: "32px 36px",
              transition: "background 0.4s, border-color 0.4s",
            }}>
              <StepIndicator step={step} T={T} />

              {step === 1 && (
                <DeliveryStep T={T} data={formData} setData={setFormData} onNext={() => setStep(2)} />
              )}
              {step === 2 && (
                <PaymentStep T={T} data={formData} setData={setFormData} onNext={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <ReviewStep T={T} data={formData} items={items} onBack={() => setStep(2)} onPay={handlePay} />
              )}
            </div>

            {/* Right: summary */}
            <div style={{
              background: T.card, borderRadius: 24,
              border: `1.5px solid ${T.border}`, padding: "28px 24px",
              transition: "background 0.4s, border-color 0.4s",
            }}>
              <OrderSummary T={T} items={items} />
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{
              background: T.card, borderRadius: 24,
              border: `1.5px solid ${T.border}`, padding: "32px 36px",
            }}>
              <SuccessScreen T={T} data={formData} items={items} onNewOrder={reset} />
            </div>
          </div>
        )}
      </div>

      {processing && <ProcessingOverlay T={T} />}
    </div>
  );
}
