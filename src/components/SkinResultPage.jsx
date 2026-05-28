// SkinResultsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Step 6 — Results UI
//
// Shows:  skin type badge  •  confidence %  •  concern chips
//         dermatologist tip  •  warning banners (low confidence / fallback)
//         personalised product grid (from /api/analyze-skin)
//
// Props:
//   analysisData  {object}  — full response from POST /api/analyze-skin
//                             OR just { skin_type, concerns, confidence, tip }
//                             if you're calling the server separately
//   previewUrl    {string}  — object URL of the uploaded selfie (optional)
//   onRetry       {fn}      — called when user clicks "Analyse another photo"
//   onClose       {fn}      — called when user dismisses the page (optional)
//
// Usage inside SkinSelfieAnalyzer or as a standalone page:
//
//   import SkinResultsPage from "./SkinResultsPage";
//
//   // In your parent that owns the analyze call:
//   const res = await fetch("http://localhost:8000/api/analyze-skin", { ... });
//   const data = await res.json();
//   // data = { ok, analysis, products, product_count, low_confidence, fallback_used, warnings }
//
//   <SkinResultsPage
//     analysisData={data}
//     previewUrl={previewUrl}
//     onRetry={handleReset}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

// ── Design tokens — match SkinSelfieAnalyzer.jsx ─────────────────────────────
const SKIN_TYPE_COLORS = {
  Oily:        { bg: "#FFF0F5", accent: "#D4537E", ring: "#F4A0BF" },
  Dry:         { bg: "#F0F5FF", accent: "#5B7FD4", ring: "#A0B8F4" },
  Combination: { bg: "#F5F0FF", accent: "#8B5BD4", ring: "#C0A0F4" },
  Sensitive:   { bg: "#FFF5F0", accent: "#D4735B", ring: "#F4B0A0" },
  Normal:      { bg: "#F0FFF5", accent: "#5BD48B", ring: "#A0F4C0" },
};

const CONCERN_ICONS = {
  Acne:          "🔴",
  Brightening:   "✨",
  "Anti-Aging":  "⏳",
  "Pore-Care":   "🔬",
  Moisturizing:  "💧",
  Soothing:      "🌿",
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .srp-root {
    font-family: 'DM Sans', sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 16px 60px;
    --pink-deep:  #C2185B;
    --pink-mid:   #E91E8C;
    --pink-soft:  #F8BBD9;
    --pink-blush: #FFF0F7;
    --text-dark:  #1A0A12;
    --text-mid:   #6B3654;
    --text-light: #B07090;
    --border:     #F0C0D8;
    --white:      #FFFFFF;
    --shadow:     0 4px 24px rgba(194,24,91,0.08);
  }

  /* ── Page header ── */
  .srp-page-header {
    background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 50%, #FFF0F7 100%);
    border-radius: 24px;
    padding: 36px 36px 28px;
    margin-bottom: 28px;
    border: 1px solid var(--border);
    display: flex;
    align-items: flex-start;
    gap: 24px;
    position: relative;
    overflow: hidden;
  }
  .srp-page-header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(233,30,140,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .srp-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--white);
    box-shadow: 0 2px 16px rgba(194,24,91,0.18);
    flex-shrink: 0;
  }
  .srp-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .srp-avatar-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, var(--pink-mid), var(--pink-deep));
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
  }

  .srp-header-info { flex: 1; min-width: 0; }

  .srp-eyebrow {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--pink-deep);
    margin-bottom: 6px;
  }

  .srp-skin-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .srp-skin-type-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  .srp-confidence-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-mid);
    white-space: nowrap;
  }
  .srp-confidence-pill .pct { color: var(--pink-deep); font-weight: 600; }

  .srp-concern-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .srp-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 5px 12px;
    font-size: 12px;
    color: var(--text-mid);
    font-weight: 400;
    transition: background 0.2s;
  }
  .srp-chip:hover { background: var(--pink-blush); }
  .srp-chip.no-concerns {
    color: #2E7D32;
    border-color: #A5D6A7;
    background: #F1F8F1;
  }

  /* ── Tip block ── */
  .srp-tip-block {
    background: var(--white);
    border-left: 3px solid var(--pink-mid);
    border-radius: 0 12px 12px 0;
    padding: 13px 18px;
    margin-top: 6px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    color: var(--text-mid);
    font-style: italic;
    line-height: 1.5;
  }

  /* ── Warning banners ── */
  .srp-banner {
    border-radius: 14px;
    padding: 12px 18px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 400;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.5;
  }
  .srp-banner.low-confidence {
    background: #FFF8E1;
    border: 1px solid #FFE082;
    color: #7D5A00;
  }
  .srp-banner.fallback {
    background: #E8F4FD;
    border: 1px solid #90CAF9;
    color: #0D47A1;
  }
  .srp-banner-icon { flex-shrink: 0; margin-top: 1px; }

  /* ── Section header ── */
  .srp-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .srp-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 400;
    color: var(--text-dark);
  }
  .srp-section-count {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 300;
  }

  /* ── Product grid ── */
  .srp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
  }
  @media (max-width: 600px) {
    .srp-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  }
  @media (max-width: 400px) {
    .srp-grid { grid-template-columns: 1fr; }
  }

  /* ── Product card ── */
  .srp-product-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s;
    cursor: default;
    animation: srp-fade-in 0.4s ease both;
  }
  .srp-product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(194,24,91,0.12);
  }

  @keyframes srp-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Stagger children */
  .srp-product-card:nth-child(1)  { animation-delay: 0.05s; }
  .srp-product-card:nth-child(2)  { animation-delay: 0.10s; }
  .srp-product-card:nth-child(3)  { animation-delay: 0.15s; }
  .srp-product-card:nth-child(4)  { animation-delay: 0.20s; }
  .srp-product-card:nth-child(5)  { animation-delay: 0.25s; }
  .srp-product-card:nth-child(6)  { animation-delay: 0.30s; }
  .srp-product-card:nth-child(7)  { animation-delay: 0.35s; }
  .srp-product-card:nth-child(8)  { animation-delay: 0.40s; }

  .srp-product-img-wrap {
    height: 160px;
    background: var(--pink-blush);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .srp-product-img-wrap img {
    max-width: 85%;
    max-height: 85%;
    object-fit: contain;
  }
  .srp-product-img-placeholder {
    font-size: 38px;
    opacity: 0.35;
  }

  .srp-match-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: linear-gradient(135deg, var(--pink-mid), var(--pink-deep));
    color: white;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 100px;
  }

  .srp-product-body {
    padding: 14px 14px 16px;
  }

  .srp-product-brand {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pink-deep);
    margin-bottom: 4px;
  }

  .srp-product-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    font-weight: 400;
    color: var(--text-dark);
    line-height: 1.35;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .srp-product-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .srp-product-price {
    font-size: 15px;
    font-weight: 600;
    color: var(--pink-deep);
    letter-spacing: -0.01em;
  }

  .srp-product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }
  .srp-tag {
    font-size: 9px;
    background: var(--pink-blush);
    color: var(--text-light);
    border-radius: 100px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    white-space: nowrap;
  }

  /* ── Score bar ── */
  .srp-score-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .srp-score-bar-bg {
    flex: 1;
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .srp-score-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--pink-mid), var(--pink-deep));
    border-radius: 2px;
    transition: width 0.8s ease;
  }
  .srp-score-label {
    font-size: 10px;
    color: var(--text-light);
    white-space: nowrap;
  }

  /* ── Empty state ── */
  .srp-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-light);
  }
  .srp-empty-icon { font-size: 40px; margin-bottom: 12px; }
  .srp-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    color: var(--text-mid);
    margin-bottom: 8px;
  }
  .srp-empty-sub { font-size: 13px; font-weight: 300; line-height: 1.5; }

  /* ── Load more ── */
  .srp-load-more {
    display: flex;
    justify-content: center;
    margin-top: 28px;
  }
  .srp-load-more-btn {
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 100px;
    padding: 11px 28px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-mid);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
  }
  .srp-load-more-btn:hover {
    border-color: var(--pink-mid);
    background: var(--pink-blush);
    color: var(--pink-deep);
  }

  /* ── Bottom actions ── */
  .srp-actions {
    display: flex;
    gap: 12px;
    margin-top: 36px;
    flex-wrap: wrap;
  }
  .srp-btn-primary {
    flex: 1;
    min-width: 180px;
    background: linear-gradient(135deg, var(--pink-mid) 0%, var(--pink-deep) 100%);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 15px 24px;
    font-size: 14px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: opacity 0.2s, transform 0.15s;
  }
  .srp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

  .srp-btn-ghost {
    flex: 1;
    min-width: 140px;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 15px 24px;
    font-size: 14px;
    font-weight: 400;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-light);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .srp-btn-ghost:hover { border-color: var(--pink-soft); color: var(--text-mid); }

  /* ── Skeleton loader ── */
  .srp-skeleton {
    background: linear-gradient(90deg, #F5E0EC 0%, #FAF0F5 50%, #F5E0EC 100%);
    background-size: 200% 100%;
    animation: srp-shimmer 1.4s infinite;
    border-radius: 8px;
  }
  @keyframes srp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .srp-skeleton-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
  }
  .srp-skeleton-img  { height: 160px; }
  .srp-skeleton-body { padding: 14px; }
  .srp-skeleton-line { height: 10px; margin-bottom: 8px; }
  .srp-skeleton-line.w60 { width: 60%; }
  .srp-skeleton-line.w80 { width: 80%; }
  .srp-skeleton-line.w40 { width: 40%; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(raw) {
  if (!raw && raw !== 0) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return String(raw);
  return n >= 1000 ? `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `Rs ${n.toFixed(2)}`;
}

function getScore(product) {
  // Try common score column names from recommendation_engine.py
  return product.score ?? product.recommendation_score ?? product.match_score ?? null;
}

function getImage(product) {
  return product.image_url ?? product.image ?? product.img ?? null;
}

function getTags(product) {
  const tags = [];
  if (product.skin_type)    tags.push(product.skin_type);
  if (product.concern)      tags.push(product.concern);
  if (product.concerns)     tags.push(...(Array.isArray(product.concerns) ? product.concerns : [product.concerns]));
  if (product.category)     tags.push(product.category);
  return [...new Set(tags)].slice(0, 3);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="srp-skeleton-card">
      <div className="srp-skeleton srp-skeleton-img" />
      <div className="srp-skeleton-body">
        <div className="srp-skeleton srp-skeleton-line w40" />
        <div className="srp-skeleton srp-skeleton-line w80" />
        <div className="srp-skeleton srp-skeleton-line w60" />
      </div>
    </div>
  );
}

function ProductCard({ product, index }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc  = getImage(product);
  const price   = formatPrice(product.price ?? product.Price ?? product.selling_price ?? product.price_display);
  const score   = getScore(product);
  const tags    = getTags(product);
  const name    = product.product_name ?? product.name ?? "—";
  const brand   = product.brand ?? product.Brand ?? "";

  return (
    <div className="srp-product-card" style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}>
      <div className="srp-product-img-wrap">
        {imgSrc && !imgError ? (
          <img src={imgSrc} alt={name} onError={() => setImgError(true)} />
        ) : (
          <span className="srp-product-img-placeholder">🧴</span>
        )}
        {index < 3 && <span className="srp-match-badge">Top match</span>}
      </div>

      <div className="srp-product-body">
        {brand && <p className="srp-product-brand">{brand}</p>}
        <p className="srp-product-name">{name}</p>

        {tags.length > 0 && (
          <div className="srp-product-tags">
            {tags.map(t => <span key={t} className="srp-tag">{t}</span>)}
          </div>
        )}

        <div className="srp-product-footer">
          {price && <span className="srp-product-price">{price}</span>}
        </div>

        {score != null && (
          <div className="srp-score-row">
            <div className="srp-score-bar-bg">
              <div className="srp-score-bar-fill" style={{ width: `${Math.min(score * 100, 100)}%` }} />
            </div>
            <span className="srp-score-label">{Math.round(score * 100)}% match</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

export default function SkinResultsPage({
  analysisData,
  previewUrl,
  onRetry,
  onClose,
}) {
  // analysisData can be the full /api/analyze-skin response
  // OR just { skin_type, concerns, confidence, tip } with products loaded separately

  const analysis    = analysisData?.analysis ?? analysisData ?? {};
  const allProducts = analysisData?.products ?? [];
  const isLowConf   = analysisData?.low_confidence ?? false;
  const isFallback  = analysisData?.fallback_used  ?? false;
  const warnings    = analysisData?.warnings       ?? [];

  const skinType  = analysis.skin_type  ?? "Normal";
  const concerns  = analysis.concerns   ?? [];
  const confidence= analysis.confidence ?? 0.85;
  const tip       = analysis.tip        ?? "";

  const skinColor = SKIN_TYPE_COLORS[skinType] ?? SKIN_TYPE_COLORS.Normal;
  const pct       = Math.round(confidence * 100);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleProducts = allProducts.slice(0, visibleCount);

  // Animate the confidence bar on mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <>
      <style>{pageStyles}</style>
      <div className="srp-root">

        {/* ── Page header: avatar + skin type + concerns ── */}
        <div className="srp-page-header">
          <div className="srp-avatar">
            {previewUrl
              ? <img src={previewUrl} alt="Your skin" />
              : <div className="srp-avatar-placeholder">🪞</div>
            }
          </div>

          <div className="srp-header-info">
            <p className="srp-eyebrow">Your skin analysis</p>

            <div className="srp-skin-type-badge">
              <span
                className="srp-skin-type-name"
                style={{ color: skinColor.accent }}
              >
                {skinType}
              </span>
              <span className="srp-confidence-pill">
                <span className="pct">{pct}%</span> confidence
              </span>
            </div>

            <div className="srp-concern-chips">
              {concerns.length === 0 ? (
                <span className="srp-chip no-concerns">✓ No major concerns detected</span>
              ) : (
                concerns.map(c => (
                  <span key={c} className="srp-chip">
                    {CONCERN_ICONS[c] ?? "◆"} {c}
                  </span>
                ))
              )}
            </div>

            {tip && <div className="srp-tip-block">"{tip}"</div>}
          </div>
        </div>

        {/* ── Warning banners ── */}
        {isLowConf && (
          <div className="srp-banner low-confidence">
            <span className="srp-banner-icon">⚠️</span>
            <span>
              <strong>Low confidence ({pct}%)</strong> — the photo may be blurry or poorly lit.
              Results are our best estimate. Retaking in better lighting will improve accuracy.
            </span>
          </div>
        )}

        {isFallback && (
          <div className="srp-banner fallback">
            <span className="srp-banner-icon">ℹ️</span>
            <span>
              {warnings.find(w => w.includes("budget") || w.includes("Budget"))
                ?? "No exact matches found. Showing top-rated products for your skin type."}
            </span>
          </div>
        )}

        {/* ── Product section ── */}
        <div className="srp-section-head">
          <h2 className="srp-section-title">
            Your personalised picks
          </h2>
          {allProducts.length > 0 && (
            <span className="srp-section-count">
              {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {allProducts.length === 0 ? (
          <div className="srp-empty">
            <div className="srp-empty-icon">🔍</div>
            <p className="srp-empty-title">No products found</p>
            <p className="srp-empty-sub">
              We couldn't find matching products for your profile.<br />
              Try adjusting your budget or retaking the photo.
            </p>
          </div>
        ) : (
          <>
            <div className="srp-grid">
              {visibleProducts.map((p, i) => (
                <ProductCard
                  key={p.product_id ?? p.id ?? `${p.product_name}-${i}`}
                  product={p}
                  index={i}
                />
              ))}
            </div>

            {visibleCount < allProducts.length && (
              <div className="srp-load-more">
                <button
                  className="srp-load-more-btn"
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                >
                  Show more products ↓
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Bottom actions ── */}
        <div className="srp-actions">
          {onRetry && (
            <button className="srp-btn-primary" onClick={onRetry}>
              📸 Analyse another photo
            </button>
          )}
          {onClose && (
            <button className="srp-btn-ghost" onClick={onClose}>
              ← Back
            </button>
          )}
        </div>

      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// HOW TO WIRE THIS INTO SkinSelfieAnalyzer.jsx
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. In SkinSelfieAnalyzer.jsx, replace callClaudeVision() with a server call:
//
//    async function callClaudeVision(base64Image) {
//      const res = await fetch("http://localhost:8000/api/analyze-skin", {
//        method: "POST",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify({
//          image_data : base64Image,
//          media_type : "image/jpeg",
//          budget     : budget,   // the prop passed to SkinSelfieAnalyzer
//          top_n      : 15,
//        }),
//      });
//      if (!res.ok) {
//        const err = await res.json().catch(() => ({}));
//        throw new Error(err?.detail || `Server error ${res.status}`);
//      }
//      return res.json();
//      // Returns: { ok, analysis, products, product_count, low_confidence, fallback_used, warnings }
//    }
//
// 2. In the main SkinSelfieAnalyzer component, add a new stage "products":
//
//    const [fullData, setFullData] = useState(null);   // full server response
//
//    const handleAnalyze = useCallback(async () => {
//      ...
//      const data = await callClaudeVision(base64);   // now returns full server response
//      setResult(data.analysis);                      // for the Results card
//      setFullData(data);                             // store everything
//      setStage("results");
//    }, [file]);
//
//    const handleViewProducts = useCallback(() => {
//      setStage("products");
//    }, []);
//
// 3. Add the "products" stage to the render:
//
//    import SkinResultsPage from "./SkinResultsPage";
//
//    {stage === "products" && fullData && (
//      <SkinResultsPage
//        analysisData={fullData}
//        previewUrl={previewUrl}
//        onRetry={handleReset}
//        onClose={() => setStage("results")}
//      />
//    )}
//
// 4. In the existing Results component, update the CTA button:
//
//    <button className="ssa-cta-btn" onClick={handleViewProducts}>
//      ✦ View My Personalised Products
//    </button>
//
// ─────────────────────────────────────────────────────────────────────────────