import { useState, useEffect, useCallback, useRef } from "react";

// ─── BACKEND CONFIG ───────────────────────────────────────────────────────────
// Make sure your FastAPI server.py is running on port 8000 before opening the app.
// Start it with: python server.py
const API_BASE = "http://localhost:8000";

// A unique session ID per browser tab — tracks click history for hot-product detection
const SESSION_ID = (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID()
  : `session-${Date.now()}`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function detectSeason() {
  const m = new Date().getMonth() + 1;
  if ([11,12,1,2].includes(m)) return "rainy";
  if ([6,7,8,9,10].includes(m)) return "dry";
  return "stable";
}

const SEASON_META = {
  rainy:  { label:"🌧️ Rainy Season", color:"#4A90D9", bg:"#EBF4FF", emoji:"🌧️" },
  dry:    { label:"☀️ Dry Season",   color:"#E6830A", bg:"#FFF7ED", emoji:"☀️" },
  stable: { label:"🌤️ Year-Round",   color:"#059669", bg:"#ECFDF5", emoji:"🌤️" },
};

const URGENCY_COLOR = {
  "Critical (<90 days)":    "#EF4444",
  "High (90-180 days)":     "#F59E0B",
  "Moderate (180-365 days)":"#10B981",
};

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, badge, badgeColor, badgeText, reminder, offerDetail, onBadgeClick, onClick, clickCount }) {
  const [imgErr, setImgErr] = useState(false);
  const isHot = clickCount > 2;

  return (
    <div
      onClick={() => onClick(product)}
      style={{
        position:"relative",
        background:"#fff",
        borderRadius:18,
        overflow:"hidden",
        cursor:"pointer",
        boxShadow: isHot
          ? "0 0 0 3px #F59E0B, 0 8px 32px rgba(0,0,0,0.12)"
          : "0 4px 20px rgba(0,0,0,0.08)",
        transition:"all 0.25s ease",
        display:"flex",
        flexDirection:"column",
        animation:"fadeUp 0.4s ease both",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = isHot
          ? "0 0 0 3px #F59E0B, 0 16px 40px rgba(0,0,0,0.18)"
          : "0 12px 36px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = isHot
          ? "0 0 0 3px #F59E0B, 0 8px 32px rgba(0,0,0,0.12)"
          : "0 4px 20px rgba(0,0,0,0.08)";
      }}
    >
      {/* Image */}
      <div style={{ position:"relative", height:170, background:"#F8F7F5", flexShrink:0 }}>
        {!imgErr
          ? <img src={product.picture_src} alt={product.product_name}
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🧴</div>
        }
        {/* Badge */}
        {badge && (
          <div
            onClick={e => { e.stopPropagation(); onBadgeClick && onBadgeClick(product); }}
            style={{
              position:"absolute", top:10, left:10,
              background:badgeColor||"#10B981", color:"#fff",
              fontFamily:"'DM Mono', monospace", fontSize:9, fontWeight:700, letterSpacing:1.5,
              padding:"4px 8px", borderRadius:6, textTransform:"uppercase", cursor:"pointer",
              boxShadow:"0 2px 8px rgba(0,0,0,0.2)", animation:"pulse 2s infinite",
            }}>
            {badgeText || badge}
          </div>
        )}
        {/* Click count bubble */}
        {clickCount > 0 && (
          <div style={{
            position:"absolute", top:10, right:10,
            background:"rgba(0,0,0,0.75)", color:"#fff",
            borderRadius:"50%", width:26, height:26,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:700,
          }}>
            {clickCount}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"14px 16px 16px", flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <div style={{ fontSize:10, color:"#9CA3AF", fontFamily:"'DM Mono', monospace", textTransform:"uppercase", letterSpacing:1 }}>
          {product.brand} · {product.product_type}
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:"#1F2937", lineHeight:1.35, fontFamily:"'Playfair Display', serif" }}>
          {product.product_name.trim().slice(0,50)}{product.product_name.length > 50 ? "…" : ""}
        </div>
        {product.notable_effects && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:2 }}>
            {product.notable_effects.split(",").slice(0,3).map(e => (
              <span key={e} style={{
                background:"#F3F4F6", color:"#374151",
                fontSize:9, padding:"2px 7px", borderRadius:20,
                fontFamily:"'DM Mono', monospace", letterSpacing:0.5,
              }}>
                {e.trim()}
              </span>
            ))}
          </div>
        )}
        {offerDetail && (
          <div style={{ background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:8, padding:"6px 8px", fontSize:11, color:"#92400E", marginTop:4 }}>
            {offerDetail}
          </div>
        )}
        {reminder && (
          <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"6px 8px", fontSize:11, color:"#1E40AF", marginTop:4 }}>
            {reminder}
          </div>
        )}
        <div style={{ marginTop:"auto", paddingTop:8, fontWeight:800, fontSize:16, color:"#111827", fontFamily:"'Playfair Display', serif" }}>
          {product.price?.trim()}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:24 }}>{icon}</span>
        <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display', serif" }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ margin:"4px 0 0 34px", color:"#6B7280", fontSize:13 }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ product, onClose, onAddSample, cartItems, onAddCart }) {
  const [imgErr, setImgErr] = useState(false);
  if (!product) return null;
  const inCart = cartItems.some(c => c.product_id === product.product_id);

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
        zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
        padding:20, backdropFilter:"blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:24, maxWidth:480, width:"100%",
          overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.3)",
          animation:"slideUp 0.3s ease",
        }}
      >
        <div style={{ height:220, background:"#F8F7F5", position:"relative" }}>
          {!imgErr
            ? <img src={product.picture_src} alt={product.product_name} onError={() => setImgErr(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:60 }}>🧴</div>
          }
          <button
            onClick={onClose}
            style={{
              position:"absolute", top:12, right:12,
              background:"rgba(255,255,255,0.9)", border:"none", borderRadius:"50%",
              width:32, height:32, cursor:"pointer", fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>✕</button>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ fontSize:11, color:"#9CA3AF", fontFamily:"'DM Mono', monospace", textTransform:"uppercase", letterSpacing:1.5 }}>
            {product.brand} · {product.product_type}
          </div>
          <h3 style={{ margin:"6px 0 8px", fontSize:20, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display', serif", lineHeight:1.3 }}>
            {product.product_name.trim()}
          </h3>
          {product.skintype && (
            <p style={{ margin:"0 0 4px", fontSize:12, color:"#6B7280" }}><b>Skin type:</b> {product.skintype}</p>
          )}
          {product.notable_effects && (
            <p style={{ margin:"0 0 8px", fontSize:12, color:"#6B7280" }}><b>Effects:</b> {product.notable_effects}</p>
          )}
          {product.description && (
            <p style={{ margin:"0 0 12px", fontSize:13, color:"#374151", lineHeight:1.5 }}>
              {product.description.slice(0,200)}{product.description.length > 200 ? "…" : ""}
            </p>
          )}
          <div style={{ fontSize:22, fontWeight:900, color:"#111827", marginBottom:16, fontFamily:"'Playfair Display', serif" }}>
            {product.price?.trim()}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button
              onClick={() => { onAddCart(product); onClose(); }}
              style={{
                flex:1, padding:"12px 16px",
                background: inCart ? "#6B7280" : "#111827",
                color:"#fff", border:"none", borderRadius:12,
                fontWeight:700, fontSize:14, cursor:"pointer",
              }}>
              {inCart ? "✓ In Cart" : "Add to Cart"}
            </button>
            {product.badge === "FREE SAMPLE" && (
              <button
                onClick={() => { onAddSample(product); onClose(); }}
                style={{
                  flex:1, padding:"12px 16px", background:"#10B981",
                  color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:14, cursor:"pointer",
                }}>
                Get Free Sample
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:2000, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: t.type === "success" ? "#10B981" : t.type === "warning" ? "#F59E0B" : "#3B82F6",
            color:"#fff", padding:"12px 18px", borderRadius:12,
            fontSize:14, fontWeight:600,
            boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
            animation:"slideInRight 0.3s ease", maxWidth:300,
          }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:"100vh", background:"#FAFAF9",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
    }}>
      <div style={{ fontSize:48 }}>✨</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#111827", fontFamily:"'Playfair Display', serif" }}>
        Loading recommendations…
      </div>
      <div style={{ fontSize:13, color:"#6B7280" }}>Fetching live data from your Python engine</div>
      <div style={{
        width:200, height:4, background:"#E5E7EB", borderRadius:4, overflow:"hidden", marginTop:8,
      }}>
        <div style={{
          height:"100%", background:"#111827", borderRadius:4,
          animation:"loading-bar 1.5s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

// ─── ERROR SCREEN ─────────────────────────────────────────────────────────────
function ErrorScreen({ onRetry }) {
  return (
    <div style={{
      minHeight:"100vh", background:"#FAFAF9",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16, padding:24,
    }}>
      <div style={{ fontSize:48 }}>⚠️</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#111827", fontFamily:"'Playfair Display', serif" }}>
        Cannot reach the backend
      </div>
      <div style={{
        background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:12,
        padding:"16px 20px", maxWidth:440, textAlign:"left",
      }}>
        <div style={{ fontWeight:700, color:"#92400E", marginBottom:8 }}>Start your Python server:</div>
        <code style={{
          display:"block", background:"#1F2937", color:"#10B981",
          padding:"10px 14px", borderRadius:8, fontSize:13, fontFamily:"monospace",
        }}>
          cd glowiq<br />
          python server.py
        </code>
        <div style={{ color:"#B45309", fontSize:12, marginTop:10 }}>
          Then make sure it's running at <b>http://localhost:8000</b> and refresh this page.
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{
          background:"#111827", color:"#fff", border:"none",
          padding:"12px 28px", borderRadius:12, fontWeight:700,
          fontSize:14, cursor:"pointer", marginTop:8,
        }}>
        Retry Connection
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function SkincareApp() {
  const season = detectSeason();
  const seasonMeta = SEASON_META[season];

  // ── Live data from FastAPI backend ──
  const [apiData, setApiData]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ── UI state (unchanged from original) ──
  const [tab, setTab]       = useState("seasonal");
  const [clicks, setClicks] = useState({});
  const [modal, setModal]   = useState(null);
  const [cart, setCart]     = useState([]);
  const [samples, setSamples] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // ── Fetch recommendations from Python backend ──
  const fetchData = useCallback(() => {
    setLoading(true);
    setFetchError(false);
    fetch(`${API_BASE}/api/recommendations?session_id=${SESSION_ID}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived data from API response ──
  // The Python engine returns: seasonal_recommendations, low_selling_samples,
  // near_expiry_offers, top_clicked_products, current_season
  const seasonProducts  = apiData?.seasonal_recommendations  ?? [];
  const lowSelling      = apiData?.low_selling_samples        ?? [];
  const nearExpiry      = apiData?.near_expiry_offers         ?? [];
  const serverSeason    = apiData?.current_season             ?? season;

  // ── Toast helper ──
  const addToast = (msg, type = "success") => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  // ── Product click: increment local count + POST to backend ──
  const handleProductClick = useCallback((product) => {
    setClicks(prev => {
      const next = { ...prev, [product.product_id]: (prev[product.product_id] || 0) + 1 };
      if (next[product.product_id] === 3) {
        addToast(`👀 You keep checking "${product.product_name.trim().slice(0,25)}…" — it's pinned for you!`, "warning");
      }
      return next;
    });

    // Record click on backend (fire-and-forget, don't block UI)
    fetch(`${API_BASE}/api/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id:   SESSION_ID,
        product_id:   product.product_id,
        product_name: product.product_name,
      }),
    }).catch(() => {}); // silently ignore if backend is slow

    setModal(product);
  }, []);

  // ── Cart & sample actions ──
  const addCart = (p) => {
    setCart(prev => prev.find(c => c.product_id === p.product_id) ? prev : [...prev, p]);
    addToast(`🛒 Added "${p.product_name.trim().slice(0,25)}…" to cart!`);
  };
  const addSample = (p) => {
    setSamples(prev => [...prev, p]);
    addToast(`🎁 Free sample of "${p.product_name.trim().slice(0,25)}…" requested!`, "warning");
  };

  // ── Hot products: clicked > 2 times, sourced from all API lists ──
  const allProducts = [
    ...seasonProducts,
    ...lowSelling,
    ...nearExpiry,
    ...(apiData?.top_clicked_products ?? []),
  ];
  const seenIds = new Set();
  const uniqueProducts = allProducts.filter(p => {
    if (seenIds.has(p.product_id)) return false;
    seenIds.add(p.product_id);
    return true;
  });

  const hotProducts = Object.entries(clicks)
    .filter(([, c]) => c > 2)
    .map(([id]) => uniqueProducts.find(p => p.product_id === id))
    .filter(Boolean);

  const TABS = [
    { key:"seasonal", label:`${seasonMeta.emoji} Season` },
    { key:"sample",   label:"📦 Free Samples" },
    { key:"expiry",   label:"⏰ Hot Offers" },
    { key:"hot",      label:`🔥 Hot (${hotProducts.length})` },
    { key:"cart",     label:`🛒 Cart (${cart.length})` },
  ];

  // ── Render states ──
  if (loading) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen onRetry={fetchData} />;

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF9", fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes loading-bar { 0%{width:0%} 60%{width:80%} 100%{width:100%} }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"#111827", color:"#fff", padding:"20px 24px 0" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900, fontFamily:"'Playfair Display', serif", letterSpacing:-0.5 }}>
                ✨ SkinCare Studio
              </h1>
              <p style={{ color:"#9CA3AF", fontSize:13, marginTop:2 }}>
                Smart recommendations · Live from Python engine
              </p>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{
                background: seasonMeta.bg, color: seasonMeta.color,
                padding:"6px 14px", borderRadius:20,
                fontSize:12, fontWeight:700, fontFamily:"'DM Mono', monospace",
              }}>
                {seasonMeta.label}
              </div>
              {cart.length > 0 && (
                <div style={{
                  background:"#F59E0B", color:"#fff", borderRadius:"50%",
                  width:32, height:32, display:"flex", alignItems:"center",
                  justifyContent:"center", fontWeight:700, fontSize:14,
                }}>
                  {cart.length}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:0 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: tab === t.key ? "#fff" : "transparent",
                  color: tab === t.key ? "#111827" : "#9CA3AF",
                  border:"none", cursor:"pointer",
                  padding:"10px 18px", borderRadius:"10px 10px 0 0",
                  fontSize:13, fontWeight:700,
                  fontFamily:"'DM Sans', sans-serif",
                  whiteSpace:"nowrap", transition:"all 0.2s",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px" }}>

        {/* Hot products reminder bar */}
        {hotProducts.length > 0 && tab !== "hot" && (
          <div
            onClick={() => setTab("hot")}
            style={{
              background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:14,
              padding:"14px 18px", marginBottom:24,
              display:"flex", alignItems:"center", gap:12, cursor:"pointer",
            }}>
            <span style={{ fontSize:22 }}>🔥</span>
            <div>
              <div style={{ fontWeight:700, color:"#92400E", fontSize:14 }}>
                You've been eyeing {hotProducts.length} product{hotProducts.length > 1 ? "s" : ""}!
              </div>
              <div style={{ color:"#B45309", fontSize:12 }}>
                Click to see your top-viewed picks pinned at the top →
              </div>
            </div>
          </div>
        )}

        {/* ── SEASONAL TAB ── */}
        {tab === "seasonal" && (
          <div>
            <SectionHeader
              icon="🌦️"
              title={`${seasonMeta.emoji} ${serverSeason.charAt(0).toUpperCase() + serverSeason.slice(1)} Season Picks`}
              subtitle={`Best products for ${seasonMeta.label.split(" ").slice(1).join(" ")} — live from your Python engine`}
            />
            {seasonProducts.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#6B7280" }}>
                No seasonal products found. Check that Skin_Care.csv is loaded by the server.
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:18 }}>
                {seasonProducts.map((p, i) => (
                  <div key={p.product_id} style={{ animationDelay:`${i * 0.06}s` }}>
                    <ProductCard
                      product={p}
                      badge="RECOMMENDED"
                      badgeColor={seasonMeta.color}
                      badgeText="⭐ RECOMMENDED"
                      clickCount={clicks[p.product_id] || 0}
                      reminder={clicks[p.product_id] > 2 ? "👀 You keep coming back to this!" : null}
                      onClick={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FREE SAMPLE TAB ── */}
        {tab === "sample" && (
          <div>
            <SectionHeader
              icon="📦"
              title="Free Sample Campaign"
              subtitle="These products need your love! Request a free sample, try it, and leave a review to boost their visibility."
            />
            <div style={{
              background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius:16,
              padding:"16px 20px", marginBottom:24, display:"flex", gap:16, alignItems:"center",
            }}>
              <span style={{ fontSize:32 }}>🎁</span>
              <div>
                <div style={{ fontWeight:800, color:"#065F46", fontSize:16 }}>Help these products shine!</div>
                <div style={{ color:"#047857", fontSize:13, marginTop:2 }}>
                  Click "Get Free Sample" on any card — share your review and increase their sales potential.
                </div>
              </div>
            </div>
            {lowSelling.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#6B7280" }}>
                No low-selling products detected right now.
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:18 }}>
                {lowSelling.map((p, i) => (
                  <div key={p.product_id} style={{ animationDelay:`${i * 0.07}s` }}>
                    <ProductCard
                      product={p}
                      badge="FREE SAMPLE"
                      badgeColor="#10B981"
                      badgeText="🎁 FREE SAMPLE"
                      clickCount={clicks[p.product_id] || 0}
                      reminder={clicks[p.product_id] > 2 ? "👀 You keep checking this — grab it free!" : null}
                      onClick={handleProductClick}
                      onBadgeClick={addSample}
                    />
                  </div>
                ))}
              </div>
            )}

            {samples.length > 0 && (
              <div style={{ marginTop:32 }}>
                <SectionHeader
                  icon="✅"
                  title="Your Sample Requests"
                  subtitle={`${samples.length} sample(s) queued — reviews help boost these products!`}
                />
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {samples.map((s, i) => (
                    <div key={i} style={{
                      background:"#fff", border:"1px solid #D1FAE5", borderRadius:12,
                      padding:"12px 16px", display:"flex", alignItems:"center", gap:14,
                    }}>
                      <span style={{ fontSize:24 }}>🎁</span>
                      <div>
                        <div style={{ fontWeight:700, color:"#111827" }}>{s.product_name.trim()}</div>
                        <div style={{ color:"#6B7280", fontSize:12 }}>
                          Please leave a review after trying · {s.price?.trim()}
                        </div>
                      </div>
                      <div style={{
                        marginLeft:"auto", background:"#D1FAE5", color:"#065F46",
                        padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
                      }}>
                        PENDING REVIEW
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EXPIRY OFFERS TAB ── */}
        {tab === "expiry" && (
          <div>
            <SectionHeader
              icon="⏰"
              title="Buy 2 Get 3 Free Offers"
              subtitle="Near-expiry products with limited-time deals. Up to 999 orders per offer!"
            />
            <div style={{
              background:"linear-gradient(135deg,#FEF3C7,#FDE68A)", borderRadius:16,
              padding:"16px 20px", marginBottom:24, display:"flex", gap:14, alignItems:"center",
            }}>
              <span style={{ fontSize:32 }}>🛍️</span>
              <div>
                <div style={{ fontWeight:800, color:"#92400E", fontSize:16 }}>
                  Limited Time — Buy 2 Get 3 FREE
                </div>
                <div style={{ color:"#B45309", fontSize:13, marginTop:2 }}>
                  These products are expiring soon. Max 999 orders per deal — act fast!
                </div>
              </div>
            </div>
            {nearExpiry.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#6B7280" }}>
                No near-expiry products right now. Check back later!
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:18 }}>
                {nearExpiry.map((p, i) => (
                  <div key={p.product_id} style={{ animationDelay:`${i * 0.07}s` }}>
                    <ProductCard
                      product={p}
                      badge="BUY 2 GET 3"
                      badgeColor={URGENCY_COLOR[p.urgency_level] || "#EF4444"}
                      badgeText="🔥 BUY 2 GET 3"
                      offerDetail={`⏰ ${
                        p.days_to_expiry === 0
                          ? "Expires TODAY"
                          : `Expires in ${p.days_to_expiry} day${p.days_to_expiry !== 1 ? "s" : ""}`
                      } · ${p.urgency_level}`}
                      clickCount={clicks[p.product_id] || 0}
                      reminder={clicks[p.product_id] > 2 ? "👀 You keep checking this deal!" : null}
                      onClick={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HOT / CLICKED TAB ── */}
        {tab === "hot" && (
          <div>
            <SectionHeader
              icon="🔥"
              title="Your Top-Viewed Products"
              subtitle="Products you've clicked more than twice — pinned here so you don't miss them."
            />
            {hotProducts.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#6B7280" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👆</div>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#374151" }}>No hot picks yet</div>
                <div style={{ fontSize:14 }}>
                  Browse the other tabs and click products more than twice — they'll appear here as your personal shortlist.
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:18 }}>
                {hotProducts.map((p, i) => (
                  <div key={p.product_id} style={{ animationDelay:`${i * 0.08}s` }}>
                    <ProductCard
                      product={p}
                      badge="👀 WATCHING"
                      badgeColor="#F59E0B"
                      badgeText={`👀 VIEWED ${clicks[p.product_id]}x`}
                      reminder="Ready to add to cart? You keep coming back!"
                      clickCount={clicks[p.product_id] || 0}
                      onClick={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CART TAB ── */}
        {tab === "cart" && (
          <div>
            <SectionHeader
              icon="🛒"
              title="Your Cart"
              subtitle={cart.length > 0 ? `${cart.length} item(s) ready to checkout` : "Your cart is empty"}
            />
            {cart.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#6B7280" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🛒</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#374151", marginBottom:8 }}>Your cart is empty</div>
                <div style={{ fontSize:14 }}>Browse the other tabs and add products you love!</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:600 }}>
                {cart.map((p, i) => (
                  <div key={i} style={{
                    background:"#fff", borderRadius:14, padding:"14px 18px",
                    display:"flex", alignItems:"center", gap:14,
                    boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ width:56, height:56, borderRadius:10, overflow:"hidden", background:"#F3F4F6", flexShrink:0 }}>
                      <img src={p.picture_src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { e.target.style.display = "none"; }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:"#111827", fontSize:14 }}>
                        {p.product_name.trim().slice(0,40)}
                      </div>
                      <div style={{ color:"#6B7280", fontSize:12 }}>{p.brand} · {p.product_type}</div>
                    </div>
                    <div style={{ fontWeight:800, color:"#111827", fontSize:15, fontFamily:"'Playfair Display', serif" }}>
                      {p.price?.trim()}
                    </div>
                    <button
                      onClick={() => setCart(prev => prev.filter(c => c.product_id !== p.product_id))}
                      style={{
                        background:"#FEE2E2", color:"#DC2626", border:"none",
                        borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:13, fontWeight:600,
                      }}>
                      ✕
                    </button>
                  </div>
                ))}

                {/* Cart total */}
                <div style={{
                  background:"#111827", color:"#fff", borderRadius:14,
                  padding:"14px 20px", display:"flex",
                  justifyContent:"space-between", alignItems:"center", marginTop:8,
                }}>
                  <div>
                    <div style={{ fontSize:12, color:"#9CA3AF" }}>Total ({cart.length} items)</div>
                    <div style={{ fontSize:20, fontWeight:900, fontFamily:"'Playfair Display', serif" }}>
                      Rp {cart.reduce((s, p) => s + (p.price_num || 0), 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button
                    onClick={() => { addToast("🎉 Order placed successfully!"); setCart([]); }}
                    style={{
                      background:"#10B981", color:"#fff", border:"none",
                      padding:"12px 24px", borderRadius:10,
                      fontWeight:700, cursor:"pointer", fontSize:14,
                    }}>
                    Checkout →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal */}
      <Modal
        product={modal}
        onClose={() => setModal(null)}
        onAddSample={addSample}
        cartItems={cart}
        onAddCart={addCart}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}