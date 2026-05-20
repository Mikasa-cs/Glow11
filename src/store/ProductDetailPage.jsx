// src/store/ProductDetailPage.jsx
// Full-screen product detail page — image left, info right
import { useState } from "react";
import { C } from "../theme/colors";

function parsePrice(str) {
  return parseInt((str || "0").replace(/[^0-9]/g, ""), 10) || 0;
}

// Generate a stable fake rating from product name
function fakeRating(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return 3.5 + (Math.abs(h) % 15) / 10; // 3.5 – 5.0
}
function fakeReviewCount(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 3) + name.charCodeAt(i)) | 0;
  return 42 + (Math.abs(h) % 958); // 42 – 1000
}

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half   = !filled && rating >= i - 0.5;
    stars.push(
      <span key={i} style={{ color: filled || half ? "#fbbf24" : "#2e2b45", fontSize: 18 }}>
        {filled ? "★" : half ? "⭑" : "☆"}
      </span>
    );
  }
  return <span>{stars}</span>;
}

export default function ProductDetailPage({ product, onBack, onAddToCart }) {
  const [qty, setQty]       = useState(1);
  const [imgErr, setImgErr] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");

  const rating      = fakeRating(product.name || product.product_name || "");
  const reviewCount = fakeReviewCount(product.name || product.product_name || "");
  const name        = product.name || product.product_name || "Unknown Product";
  const brand       = product.brand || "–";
  const type        = product.type || product.product_type || "–";
  const price       = product.price || "–";
  const effects     = product.effects || product.notable_effects || "–";
  const skin        = product.skin || product.skintype || "–";
  const description = product.description || `A premium ${type} by ${brand} designed to deliver ${effects} benefits for ${skin} skin types. Formulated with high-quality ingredients for effective and gentle daily use.`;
  const imgSrc      = product.picture_src || product.img || "";
  const tier        = product.tier || "";

  const handleAdd = () => {
    onAddToCart({ ...product, name, qty });
    setAddedMsg("✓ Added to cart!");
    setTimeout(() => setAddedMsg(""), 2000);
  };

  const handleBuyNow = () => {
    onAddToCart({ ...product, name, qty });
    alert("Checkout coming soon! Item added to cart.");
  };

  const TIER_COLOR = { Budget: C.accent4, "Mid-Range": "#86efac", Premium: C.accent2, Luxury: C.warning };
  const tierColor = TIER_COLOR[tier] || C.muted;

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Inter', sans-serif", color: C.text,
    }}>
      {/* Back nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg2 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 2rem", height: 56,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "6px 14px",
          color: C.muted, cursor: "pointer", fontSize: "0.82rem",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Back to Shop
        </button>
        <span style={{ color: C.muted, fontSize: "0.78rem" }}>
          {brand} / <span style={{ color: C.text }}>{name.slice(0, 40)}{name.length > 40 ? "…" : ""}</span>
        </span>
      </div>

      {/* Main layout */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        minHeight: "calc(100vh - 56px)",
      }}>

        {/* LEFT — Product image (full height) */}
        <div style={{
          flex: "0 0 50%", minWidth: 320,
          background: C.bg2,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "sticky", top: 56,
          height: "calc(100vh - 56px)",
          overflow: "hidden",
        }}>
          {imgSrc && !imgErr ? (
            <img
              src={imgSrc}
              alt={name}
              onError={() => setImgErr(true)}
              style={{
                maxWidth: "75%", maxHeight: "75%",
                objectFit: "contain",
                borderRadius: 16,
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
              }}
            />
          ) : (
            <div style={{
              width: 200, height: 200,
              background: C.card,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 80,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}>🧴</div>
          )}
          {/* Glow behind image */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${C.accent2}0a, transparent 70%)`,
            pointerEvents: "none",
          }} />
        </div>

        {/* RIGHT — Product info */}
        <div style={{
          flex: "1 1 360px",
          padding: "3rem 3rem 4rem",
          overflowY: "auto",
          maxHeight: "calc(100vh - 56px)",
          borderLeft: `1px solid ${C.border}`,
        }}>
          {/* Brand + type + tier */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ color: C.muted, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {brand}
            </span>
            <span style={{ color: C.border }}>·</span>
            <span style={{
              background: C.accent2 + "22", color: C.accent2,
              padding: "2px 10px", borderRadius: 6,
              fontSize: "0.72rem", fontWeight: 700,
            }}>{type}</span>
            {tier && (
              <span style={{
                background: tierColor + "22", color: tierColor,
                padding: "2px 10px", borderRadius: 6,
                fontSize: "0.72rem", fontWeight: 700,
              }}>{tier}</span>
            )}
          </div>

          {/* Product name */}
          <h1 style={{
            fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.25,
            color: C.text, margin: "0 0 16px 0",
          }}>{name}</h1>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <StarRating rating={rating} />
            <span style={{ color: C.warning, fontWeight: 700, fontSize: "0.9rem" }}>
              {rating.toFixed(1)}
            </span>
            <span style={{ color: C.muted, fontSize: "0.8rem" }}>
              ({reviewCount.toLocaleString()} reviews)
            </span>
          </div>

          {/* Price */}
          <div style={{
            fontSize: "1.8rem", fontWeight: 800, color: C.accent4,
            marginBottom: 24,
          }}>{price}</div>

          {/* Description */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: C.text, fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Description
            </h3>
            <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
              {description}
            </p>
          </div>

          {/* Details */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 28,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {effects && effects !== "–" && (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: C.accent, fontWeight: 600, fontSize: "0.8rem", minWidth: 70 }}>Effects</span>
                <span style={{ color: C.text, fontSize: "0.82rem" }}>{effects}</span>
              </div>
            )}
            {skin && skin !== "–" && (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: C.accent3, fontWeight: 600, fontSize: "0.8rem", minWidth: 70 }}>Skin Type</span>
                <span style={{ color: C.text, fontSize: "0.82rem" }}>{skin}</span>
              </div>
            )}
          </div>

          {/* Quantity picker */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: C.text, fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quantity
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{
                  width: 40, height: 40, borderRadius: "8px 0 0 8px",
                  border: `1px solid ${C.border}`, borderRight: "none",
                  background: C.card, color: C.text,
                  fontSize: "1.2rem", cursor: "pointer", fontWeight: 700,
                }}>−</button>
              <div style={{
                width: 56, height: 40, background: C.bg2,
                border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.text, fontWeight: 700, fontSize: "1rem",
              }}>{qty}</div>
              <button
                onClick={() => setQty(q => q + 1)}
                style={{
                  width: 40, height: 40, borderRadius: "0 8px 8px 0",
                  border: `1px solid ${C.border}`, borderLeft: "none",
                  background: C.card, color: C.text,
                  fontSize: "1.2rem", cursor: "pointer", fontWeight: 700,
                }}>+</button>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, minWidth: 160,
                padding: "14px 20px", borderRadius: 12,
                border: `1px solid ${C.accent2}`,
                background: C.accent2 + "18",
                color: C.accent2,
                fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.accent2 + "30"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.accent2 + "18"; }}
            >
              🛒 Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              style={{
                flex: 1, minWidth: 160,
                padding: "14px 20px", borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
                color: "#fff",
                fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              ⚡ Buy Now
            </button>
          </div>

          {/* Add success message */}
          {addedMsg && (
            <div style={{
              background: C.accent4 + "18", border: `1px solid ${C.accent4}44`,
              borderRadius: 8, padding: "10px 14px",
              color: C.accent4, fontWeight: 700, fontSize: "0.85rem",
              textAlign: "center",
            }}>
              {addedMsg}
            </div>
          )}

          {/* Note for adding your own product */}
          <div style={{
            marginTop: 32, padding: "1rem 1.25rem",
            background: C.bg2, border: `1px dashed ${C.border}`,
            borderRadius: 12,
          }}>
            <p style={{ color: C.muted, fontSize: "0.75rem", margin: 0, lineHeight: 1.6 }}>
              💡 <strong style={{ color: C.text }}>Add your own product:</strong> Update <code style={{ color: C.accent2 }}>src/data/products.js</code> with your dataset. Each product needs: <code style={{ color: C.accent3, fontSize: "0.7rem" }}>name, brand, type, price, tier, effects, skin</code>. Optionally add <code style={{ color: C.accent3, fontSize: "0.7rem" }}>description</code> and <code style={{ color: C.accent3, fontSize: "0.7rem" }}>picture_src</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
