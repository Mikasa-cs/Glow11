// src/store/StoreFront.jsx — PaymentGateway-themed store
import { useState, useMemo, useRef, useEffect } from "react";
import { ALL_PRODUCTS } from "../data/products";
import { useAuth } from "../auth/AuthContext";
import ProductDetailPage from "./ProductDetailPage";
import PaymentGateway from "./PaymentGateway";
import SkinReportGenerator from "../components/SkinReportGenerator";
import SkinSelfieAnalyzer from "../components/SkinSelfieAnalyzer";
import SkinResultsPage from "../components/SkinResultsPage";

// ── PaymentGateway Theme (same THEMES object) ─────────────────────────────────
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

const STORE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=Playfair+Display:wght@500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes orb1 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(30px,-20px) scale(1.1); } }
@keyframes orb2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-20px,30px) scale(0.9); } }
.sf-btn:hover { opacity:0.85; transform:translateY(-1px); }
.sf-btn:active { transform:scale(0.97); }
.sf-btn { transition:all 0.18s ease; }
.sf-card:hover { transform:translateY(-4px); }
.sf-card { transition:transform 0.2s ease, border-color 0.2s ease; }
.sf-input:focus { border-color: var(--sf-accent) !important; box-shadow: 0 0 0 3px var(--sf-accent-soft) !important; outline: none; }
::-webkit-scrollbar { width:5px; height:5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--sf-border); border-radius:10px; }
`;

const RAW_SEASONAL = {"stable":[{"product_id":"307","product_name":"EMINA Skin Buddy Bubble Up Face Wash","brand":"EMINA","product_type":"Face Wash","price":"Rp 15.75","price_num":15750,"skintype":"Oily, Combination, Sensitive","notable_effects":"Hydrating, Soothing","description":"Pembersih wajah dengan busa lembut.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Emina_Skin_Buddy_Bubble_Up_Face_Wash.jpg"},{"product_id":"880","product_name":"SENKA Perfect Whip Fresh","brand":"SENKA","product_type":"Face Wash","price":"Rp 35.000","price_num":35000,"skintype":"Oily","notable_effects":"Anti-Aging","description":"Perfect Whip Fresh adalah produk unggulan.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/f0.jpg"},{"product_id":"1","product_name":"ACWELL pH Balancing Soothing Cleansing Foam","brand":"ACWELL","product_type":"Face Wash","price":"Rp 181.800","price_num":181800,"skintype":"Normal, Dry, Combination","notable_effects":"Soothing, Balancing","description":"Membersihkan dan menenangkan kulit sensitif.","picture_src":"https://images.soco.id/8f08ced0-344d-41f4-a15e-9e45c898f92d-.jpg"}],"rainy":[{"product_id":"784","product_name":"White Aqua Micelloil Cleansing Water","brand":"PIXY","product_type":"Face Wash","price":"Rp 55.000","price_num":55000,"skintype":"Normal, Dry, Oily, Combination","notable_effects":"Hydrating, Brightening","description":"Pembersih wajah Oil in Micellar Water.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Micell-Oil-Speed-Remove-Close.webp"},{"product_id":"1","product_name":"ACWELL pH Balancing Soothing Cleansing Foam","brand":"ACWELL","product_type":"Face Wash","price":"Rp 181.800","price_num":181800,"skintype":"Normal, Dry, Combination","notable_effects":"Soothing, Balancing","description":"Membersihkan dan menenangkan kulit sensitif.","picture_src":"https://images.soco.id/8f08ced0-344d-41f4-a15e-9e45c898f92d-.jpg"}],"dry":[{"product_id":"252","product_name":"DERMALUZ Hydrate Glow Face Wash","brand":"DERMALUZ","product_type":"Face Wash","price":"Rp 41.650","price_num":41650,"skintype":"Normal, Dry","notable_effects":"Hydrating, Pore-Care, Brightening","description":"Sabun wajah yang membantu membersihkan kulit.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Dermaluz_Hydrate_Glow_Face_Wash.png"},{"product_id":"307","product_name":"EMINA Skin Buddy Bubble Up Face Wash","brand":"EMINA","product_type":"Face Wash","price":"Rp 15.750","price_num":15750,"skintype":"Oily, Combination, Sensitive","notable_effects":"Hydrating, Soothing","description":"Pembersih wajah dengan busa lembut.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Emina_Skin_Buddy_Bubble_Up_Face_Wash.jpg"}]};
const RAW_LOW_SELLING = [{"product_id":"120","product_name":"BANANA BOAT Simply Protect Aqua Daily Moisture Sunscreen SPF50+","brand":"BANANA BOAT","product_type":"Sunscreen","price":"Rp 144.10","price_num":144100,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/BB_SimplyProtectAqua_DailyMoist_800x800pxl.jpg"},{"product_id":"176","product_name":"BIORE UV Tone Up UV Milk SPF 50+/PA++++","brand":"BIORE","product_type":"Sunscreen","price":"Rp 112.500","price_num":112500,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Biore_UV_Tone_Up_UV_Milk_SPF_50%2B_PA.png"},{"product_id":"308","product_name":"Emina Sun Battle SPF 30 PA+++","brand":"EMINA","product_type":"Sunscreen","price":"Rp 29.000","price_num":29000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/74aa43b8-fddf-4980-bd41-03d5702c1dd6-image-0-1624258660370"}];
const RAW_NEAR_EXPIRY = [{"product_id":"11","product_name":"AIZEN SunOrion UV Sunscreen","brand":"AIZEN","product_type":"Sunscreen","price":"Rp 139.00","price_num":139000,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Aizen_SunOrion_UV_Sunscreen.png"},{"product_id":"748","product_name":"Nivea Sun Face Protection Serum SPF50+ PA+++","brand":"NIVEA","product_type":"Sunscreen","price":"Rp 51.000","price_num":51000,"picture_src":"https://s3-ap-southeast-1.amazonaws.com/img-sociolla/img/p/3/3/6/5/7/33657-large_default.jpg"},{"product_id":"308","product_name":"Emina Sun Battle SPF 30 PA+++","brand":"EMINA","product_type":"Sunscreen","price":"Rp 29.000","price_num":29000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/74aa43b8-fddf-4980-bd41-03d5702c1dd6-image-0-1624258660370"}];

const OFFER_IDS = new Set(RAW_NEAR_EXPIRY.map(p => p.product_id));

function detectSeason() {
  const m = new Date().getMonth() + 1;
  if ([11,12,1,2].includes(m)) return "rainy";
  if ([6,7,8,9,10].includes(m)) return "dry";
  return "stable";
}
const SEASON_META = {
  rainy:  { label:"🌧️ Rainy Season", color:"#4A90D9", emoji:"🌧️" },
  dry:    { label:"☀️ Dry Season",   color:"#E6830A", emoji:"☀️" },
  stable: { label:"🌤️ Year-Round",   color:"#059669", emoji:"🌤️" },
};

const PRODUCTS = ALL_PRODUCTS.map((p, i) => ({
  id: String(i),
  name: (p.product_name || p.name || "").trim(),
  brand: (p.brand || "").trim(),
  type: (p.product_type || p.type || "").trim(),
  price: p.price || "",
  tier: p.tier || "",
  effects: (p.notable_effects || p.effects || "").trim(),
  skin: (p.skintype || p.skin || "").trim(),
  img: p.picture_src || p.img || "",
  description: p.description || "",
}));

const TYPES  = ["All","Serum","Toner","Moisturizer","Sunscreen","Face Wash"];
const TIERS  = ["All","Budget","Mid-Range","Premium","Luxury"];
const BRANDS = ["All",...Array.from(new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))).sort()];
const SORT_OPTIONS = [
  {label:"Default",value:"default"},{label:"Price: Low → High",value:"price_asc"},
  {label:"Price: High → Low",value:"price_desc"},{label:"Name A–Z",value:"name_asc"},
];
const PER_PAGE = 24;
const MAX_PRICE = 3930000;
const MIN_PRICE = 10000;
function parsePrice(str){return parseInt((str||"0").replace(/[^0-9]/g,""),10)||0;}

const HOMEPAGE_SECTIONS = [
  { id:"trending", label:"🔥 Trending Now", subtitle:"Most popular this week",
    products:PRODUCTS.filter(p=>p.tier==="Premium").slice(0,10) },
  { id:"budget", label:"💸 Best Value Picks", subtitle:"Affordable skincare that works",
    products:PRODUCTS.filter(p=>p.tier==="Budget").slice(0,10) },
  { id:"serums", label:"✨ Power Serums", subtitle:"Target your skin concerns",
    products:PRODUCTS.filter(p=>p.type==="Serum").slice(0,10) },
  { id:"sun", label:"☀️ Sun Protection", subtitle:"Never skip sunscreen",
    products:PRODUCTS.filter(p=>p.type==="Sunscreen").slice(0,10) },
];

const VIEW_HOME = "home";
const VIEW_CAT = "catalogue";
const VIEW_ORDERS = "orders";
const VIEW_AI_ANALYZER = "ai-analyzer";
const VIEW_AI_RESULTS = "ai-results";

function useThemeState() {
  const [themeName, setThemeName] = useState("blossom");
  const [isDark, setIsDark] = useState(false);
  const theme = THEMES[themeName];
  const T = isDark ? theme.dark : theme.light;
  return { themeName, setThemeName, isDark, setIsDark, T, theme };
}

function ThemePanel({ themeName, setThemeName, isDark, setIsDark, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        padding:"8px 14px", borderRadius:20,
        border:`1.5px solid ${T.border}`, background:T.surface,
        color:T.textMid, fontSize:13, cursor:"pointer",
        display:"flex", alignItems:"center", gap:6,
      }}>🎨 Themes</button>
      {open && (
        <div style={{
          position:"absolute", top:44, right:0, zIndex:200,
          background:T.surface, border:`1.5px solid ${T.border}`,
          borderRadius:16, padding:16, width:220,
          boxShadow:`0 20px 60px -10px rgba(0,0,0,0.25)`,
        }}>
          <div style={{fontSize:11,fontWeight:600,color:T.textSoft,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Palette</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {Object.entries(THEMES).map(([key,theme])=>(
              <div key={key} onClick={()=>{setThemeName(key);setOpen(false);}} style={{
                padding:"10px 10px 8px", borderRadius:10, cursor:"pointer",
                border:`2px solid ${themeName===key?T.accent:T.border}`,
                background:themeName===key?T.accentSoft:T.bg,
              }}>
                <div style={{display:"flex",gap:3,marginBottom:5}}>
                  {theme.swatch.map((c,i)=><div key={i} style={{flex:1,height:8,borderRadius:4,background:c}}/>)}
                </div>
                <div style={{fontSize:12,fontWeight:500,color:themeName===key?T.accent:T.textMid}}>{theme.name}</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textSoft,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Mode</div>
            <div style={{display:"flex",gap:8}}>
              {[false,true].map(dark=>(
                <button key={String(dark)} onClick={()=>setIsDark(dark)} style={{
                  flex:1, padding:"8px", borderRadius:10, cursor:"pointer",
                  border:`1.5px solid ${isDark===dark?T.accent:T.border}`,
                  background:isDark===dark?T.accentSoft:T.bg,
                  color:isDark===dark?T.accent:T.textMid,
                  fontSize:12, fontWeight:500,
                }}>{dark?"🌙 Dark":"☀️ Light"}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProdCard({ product:p, T, isOffer, onAddToCart, onProductClick, cartQty=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const handleAdd=(e)=>{e.stopPropagation();onAddToCart(p);};
  return (
    <div className="sf-card" onClick={()=>onProductClick&&onProductClick(p)} style={{
      background:T.card, border:`1.5px solid ${isOffer?"#ef444433":T.border}`,
      borderRadius:16, padding:"1rem", display:"flex", flexDirection:"column", gap:8,
      cursor:"pointer", position:"relative",
    }}>
      {isOffer && <div style={{position:"absolute",top:10,right:10,background:"#ef4444",color:"#fff",fontSize:"0.6rem",fontWeight:800,padding:"3px 8px",borderRadius:6}}>🔥 BUY 2 GET 3</div>}
      <div style={{height:140,borderRadius:10,overflow:"hidden",background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {p.img&&!imgErr ? <img src={p.img} alt={p.name} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:40}}>🧴</span>}
      </div>
      <div style={{color:T.textSoft,fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:0.5}}>{p.brand}</div>
      <div style={{color:T.text,fontWeight:600,fontSize:"0.85rem",lineHeight:1.3,flex:1}}>{p.name.slice(0,48)}{p.name.length>48?"…":""}</div>
      {p.type && <span style={{background:T.accentSoft,color:T.accent,padding:"3px 10px",borderRadius:20,fontSize:"0.7rem",fontWeight:600,alignSelf:"flex-start"}}>{p.type}</span>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto",paddingTop:8,borderTop:`1px solid ${T.border}`}}>
        <span style={{fontWeight:800,fontSize:"0.95rem",background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          {p.price?.trim() || "–"}
        </span>
        <button className="sf-btn" onClick={handleAdd} style={{
          padding:"7px 14px",borderRadius:10,border:"none",
          background:cartQty>0?T.accentSoft:T.accentGrad,
          color:cartQty>0?T.accent:"#fff",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",gap:5,
        }}>
          {cartQty>0 ? <><span style={{background:T.accent,color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:"0.65rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{cartQty}</span> In Cart</> : "+ Cart"}
        </button>
      </div>
    </div>
  );
}

function MiniCard({ product:p, T, badge, color, onAdd, cartQty=0 }) {
  const [imgErr,setImgErr]=useState(false);
  const handleAdd=(e)=>{e.stopPropagation();onAdd(p);};
  return (
    <div className="sf-card" style={{width:190,flexShrink:0,background:T.card,border:`1.5px solid ${T.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{position:"relative",height:150,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {p.img&&!imgErr?<img src={p.img} alt={p.name||"product"} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:36}}>🧴</span>}
        {badge&&<div style={{position:"absolute",top:8,left:8,background:badge.color,color:"#fff",fontSize:"0.58rem",fontWeight:800,padding:"3px 8px",borderRadius:6}}>{badge.text}</div>}
      </div>
      <div style={{padding:"10px 12px 12px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
        <div style={{color:T.textSoft,fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:0.4}}>{p.brand||""}</div>
        <div style={{color:T.text,fontWeight:600,fontSize:"0.78rem",lineHeight:1.3,flex:1}}>{(p.name||"").slice(0,42)}{(p.name||"").length>42?"…":""}</div>
        <div style={{fontWeight:800,fontSize:"0.85rem",background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          {p.price?.trim() || "–"}
        </div>
        <button className="sf-btn" onClick={handleAdd} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",marginTop:4,background:cartQty>0?T.accentSoft:T.accentGrad,color:cartQty>0?T.accent:"#fff",fontSize:"0.73rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          {cartQty>0 ? <><span style={{background:T.accent,color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:"0.6rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartQty}</span> In Cart</> : "+ Cart"}
        </button>
      </div>
    </div>
  );
}

function HomeRow({ title, subtitle, color, products, badge, onAdd, onViewAll, T, cart=[] }) {
  const ref = useRef(null);
  return (
    <div style={{padding:"2rem 0 0.5rem",borderBottom:`1px solid ${T.border}`}}>
      <div style={{padding:"0 2rem",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{flex:1}}>
          <h3 style={{margin:0,color:T.text,fontWeight:700,fontSize:"1.1rem",fontFamily:"'Playfair Display',serif"}}>{title}</h3>
          {subtitle&&<p style={{margin:"3px 0 0",color:T.textSoft,fontSize:"0.78rem"}}>{subtitle}</p>}
        </div>
        {onViewAll&&<button className="sf-btn" onClick={onViewAll} style={{padding:"7px 18px",borderRadius:20,border:`1.5px solid ${T.border}`,background:T.surface,color:T.textMid,fontSize:"0.8rem",cursor:"pointer",fontWeight:500}}>View All →</button>}
      </div>
      <div style={{position:"relative"}}>
        <button onClick={()=>ref.current?.scrollBy({left:-320,behavior:"smooth"})} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:10,background:T.surface+"ee",border:`1.5px solid ${T.border}`,borderRadius:"50%",width:36,height:36,color:T.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <button onClick={()=>ref.current?.scrollBy({left:320,behavior:"smooth"})} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",zIndex:10,background:T.surface+"ee",border:`1.5px solid ${T.border}`,borderRadius:"50%",width:36,height:36,color:T.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        <div ref={ref} style={{display:"flex",gap:14,overflowX:"auto",padding:"4px 2rem 1.5rem",scrollbarWidth:"none"}}>
          {products.map((p,i)=><MiniCard key={i} product={p} T={T} badge={badge} color={color} onAdd={onAdd} cartQty={cart.filter(c=>c.name===(p.name||p.product_name||"")).reduce((s,c)=>s+c.qty,0)}/>)}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ label, children, T }) {
  return (
    <div>
      <div style={{color:T.textSoft,fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{label}</div>
      {children}
    </div>
  );
}
function SidebarPill({ label, active, T, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 12px",borderRadius:10,fontSize:"0.82rem",cursor:"pointer",
      border:`1.5px solid ${active?T.accent:T.border}`,
      background:active?T.accentSoft:"transparent",
      color:active?T.accent:T.textMid,textAlign:"left",width:"100%",fontWeight:active?600:400,
    }}>{label}</button>
  );
}

function OrdersPage({ T, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    fetch(`${BACKEND}/api/orders?email=${encodeURIComponent(user?.email||"")}`)
      .then(r=>r.json())
      .then(data=>{ setOrders(data.orders||[]); setLoading(false); })
      .catch(()=>{ setLoading(false); });
  }, []);

  const fmtDate = (s) => s ? new Date(s).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}) : "–";

  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"2rem 1.5rem",animation:"fadeSlideUp 0.4s ease both"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,color:T.text,margin:0}}>My Orders</h2>
        <p style={{color:T.textSoft,fontSize:14,marginTop:4}}>All your past purchases in one place</p>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"4rem",color:T.textSoft}}>
          <div style={{fontSize:36,marginBottom:12}}>⏳</div>
          <p>Loading your orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{textAlign:"center",padding:"4rem",background:T.card,borderRadius:20,border:`1.5px solid ${T.border}`}}>
          <div style={{fontSize:48,marginBottom:16}}>🛍️</div>
          <h3 style={{color:T.text,fontFamily:"'Playfair Display',serif",marginBottom:8}}>No orders yet</h3>
          <p style={{color:T.textSoft,fontSize:14}}>Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {orders.map((order,i) => (
            <div key={i} style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:18,padding:"20px 24px",animation:`fadeSlideUp 0.4s ease ${i*0.05}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,paddingBottom:14,borderBottom:`1px dashed ${T.border}`}}>
                <div>
                  <div style={{fontSize:11,color:T.textSoft,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Order ID</div>
                  <div style={{fontFamily:"monospace",fontWeight:700,color:T.accent,fontSize:15}}>{order.order_id}</div>
                  <div style={{fontSize:12,color:T.textSoft,marginTop:4}}>{fmtDate(order.created_at)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:T.textSoft,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Total Paid</div>
                  <div style={{fontWeight:800,fontSize:18,background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    Rp {Math.round(order.total||0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {(order.items||[]).map((item,j)=>(
                  <div key={j} style={{background:T.accentSoft,borderRadius:10,padding:"6px 12px",fontSize:12,color:T.textMid}}>
                    <span style={{fontWeight:600}}>×{item.qty}</span> {item.name?.slice(0,28)}{item.name?.length>28?"…":""}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {[
                  ["📦 Shipping",order.shipping_method||"–"],
                  ["💳 Payment",order.payment_method||"–"],
                  ["📍 Address",order.address?.slice(0,40)||"–"],
                ].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:11,color:T.textSoft,marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,color:T.text,fontWeight:500}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:6,background:"#10b98120",border:"1px solid #10b98133",borderRadius:20,padding:"4px 12px"}}>
                <span style={{color:"#10b981",fontSize:11,fontWeight:700}}>✓ CONFIRMED</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main StoreFront ───────────────────────────────────────────────────────────
export default function StoreFront() {
  const { user, logout } = useAuth();
  const { themeName, setThemeName, isDark, setIsDark, T } = useThemeState();
  const season = detectSeason();
  const sm = SEASON_META[season];

  const [view, setView] = useState(VIEW_HOME);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [aiPreviewUrl, setAiPreviewUrl] = useState("");
  const [samples, setSamples] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(()=>{
    const id="sf-store-css";
    if(!document.getElementById(id)){
      const el=document.createElement("style");
      el.id=id;
      el.textContent=STORE_CSS;
      document.head.appendChild(el);
    }
  },[]);

  const toast=(msg,type="success")=>{
    const id=++toastId.current;
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  };

  const filtered = useMemo(()=>{
    let list=PRODUCTS.filter(p=>{
      const q=search.toLowerCase();
      const ms=!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.effects.toLowerCase().includes(q);
      return ms&&(typeFilter==="All"||p.type===typeFilter)&&(tierFilter==="All"||p.tier===tierFilter)&&(brandFilter==="All"||p.brand===brandFilter)&&parsePrice(p.price)<=priceMax;
    });
    if(sortBy==="price_asc") list=[...list].sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
    if(sortBy==="price_desc") list=[...list].sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));
    if(sortBy==="name_asc") list=[...list].sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  },[search,typeFilter,tierFilter,brandFilter,priceMax,sortBy]);

  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const resetPage=()=>setPage(1);
  const activeFC=[typeFilter!=="All",tierFilter!=="All",brandFilter!=="All",priceMax!==MAX_PRICE].filter(Boolean).length;
  const clearFilters=()=>{setTypeFilter("All");setTierFilter("All");setBrandFilter("All");setPriceMax(MAX_PRICE);resetPage();};

  const addToCart=(product)=>{
    setCart(prev=>{
      const ex=prev.find(c=>c.name===product.name);
      if(ex) return prev.map(c=>c.name===product.name?{...c,qty:c.qty+1}:c);
      return [...prev,{...product,qty:1}];
    });
  };
  const removeFromCart=(name)=>setCart(prev=>prev.filter(c=>c.name!==name));
  const cartCount=cart.reduce((s,c)=>s+c.qty,0);
  const cartTotal=cart.filter(c=>c.price!=="FREE").reduce((s,c)=>s+parsePrice(c.price)*c.qty,0);

  const claimSample=(p)=>{
    const key=p.product_id;
    if(samples.includes(key))return;
    setSamples(prev=>[...prev,key]);
    addToCart({name:p.product_name,brand:p.brand,type:p.product_type,price:"FREE",tier:"",effects:"",skin:"",isSample:true});
    toast("🎁 Free sample added to cart!","warning");
  };

  const startCheckout=()=>{
    if(cart.length===0){toast("Your cart is empty","warning");return;}
    setCartOpen(false);setCheckoutOpen(true);
  };

  const priceLabel=(v)=>"Rp "+Math.round(v).toLocaleString("id-ID");

  const cssVars = {
    "--sf-accent": T.accent,
    "--sf-accent-soft": T.accentSoft,
    "--sf-border": T.border,
  };

  if (selectedProduct) {
    const detailCartQty = cart.filter(c => c.name === (selectedProduct.name || selectedProduct.product_name || "")).reduce((s,c)=>s+c.qty,0);
    return (
      <ProductDetailPage
        product={selectedProduct}
        onBack={()=>setSelectedProduct(null)}
        onAddToCart={(p)=>{addToCart(p);}}
        onBuyNow={()=>{setCartOpen(false);setCheckoutOpen(true);}}
        T={T}
        cartQty={detailCartQty}
      />
    );
  }

  if (checkoutOpen) {
    return (
      <PaymentGateway
        cartItems={cart}
        onBack={()=>setCheckoutOpen(false)}
        onComplete={()=>{
          setCart([]);setCheckoutOpen(false);setView(VIEW_ORDERS);
          toast("Order placed successfully! 🎉");
        }}
      />
    );
  }

  const selStyle = {
    width:"100%", padding:"9px 12px", borderRadius:10,
    border:`1.5px solid ${T.border}`, background:T.surface,
    color:T.text, fontSize:"0.82rem", cursor:"pointer", outline:"none",
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.text,transition:"background 0.4s,color 0.4s",...cssVars}}>

      {/* Ambient orbs */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:`${T.accent}12`,top:-100,right:-100,filter:"blur(60px)",animation:"orb1 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:`${T.accent}0a`,bottom:-80,left:-60,filter:"blur(50px)",animation:"orb2 10s ease-in-out infinite"}}/>
      </div>

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:100,background:T.bg+"ee",backdropFilter:"blur(14px)",borderBottom:`1.5px solid ${T.border}`,padding:"0 2rem",display:"flex",alignItems:"center",gap:16,height:66}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,cursor:"pointer"}} onClick={()=>setView(VIEW_HOME)}>
          <div style={{width:36,height:36,borderRadius:10,background:T.accentGrad,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:18}}>✨</span>
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:T.text,lineHeight:1}}>Dup Glow</div>
            <div style={{fontSize:10,color:T.textSoft,letterSpacing:0.5}}>Skincare Store</div>
          </div>
        </div>

        <nav style={{display:"flex",gap:4}}>
          {[{label:"Home",v:VIEW_HOME},{label:"Catalogue",v:VIEW_CAT},{label:"My Orders",v:VIEW_ORDERS}].map(({label,v})=>(
            <button key={v} onClick={()=>setView(v)} style={{
              background:"none",border:"none",
              color:view===v?T.accent:T.textMid,
              fontWeight:view===v?700:500,fontSize:"0.85rem",cursor:"pointer",
              padding:"6px 14px",borderRadius:8,
              borderBottom:view===v?`2px solid ${T.accent}`:"2px solid transparent",
              transition:"all 0.2s",
            }}>{label}</button>
          ))}
        </nav>

        <div style={{flex:1,maxWidth:440,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textSoft,fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input
            className="sf-input"
            value={search}
            onChange={(e)=>{setSearch(e.target.value);resetPage();if(e.target.value)setView(VIEW_CAT);}}
            placeholder="Search skincare…"
            style={{width:"100%",padding:"9px 14px 9px 36px",borderRadius:12,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:"0.85rem",transition:"all 0.2s"}}
          />
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto",flexShrink:0}}>
          <span style={{color:T.textSoft,fontSize:"0.82rem"}}>Hi, {user?.name} 👋</span>
          <button className="sf-btn" onClick={()=>setCartOpen(!cartOpen)} style={{
            position:"relative",background:cartCount>0?T.accentSoft:T.surface,
            border:`1.5px solid ${cartCount>0?T.accent:T.border}`,
            borderRadius:12,padding:"7px 14px",color:T.text,cursor:"pointer",
            fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:6,
          }}>
            🛒 Cart
            {cartCount>0&&<span style={{background:T.accent,color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:"0.65rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
          </button>
          <ThemePanel themeName={themeName} setThemeName={setThemeName} isDark={isDark} setIsDark={setIsDark} T={T}/>
          <button className="sf-btn" onClick={logout} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:12,padding:"7px 14px",color:T.textMid,cursor:"pointer",fontSize:"0.82rem"}}>Sign out</button>
        </div>
      </header>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-end"}}>
          <div style={{flex:1,background:"rgba(0,0,0,0.4)"}} onClick={()=>setCartOpen(false)}/>
          <div style={{width:380,background:T.surface,borderLeft:`1.5px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto"}}>
            <div style={{padding:"1.25rem 1.5rem",borderBottom:`1.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{color:T.text,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>🛒 Cart ({cartCount})</h3>
              <button onClick={()=>setCartOpen(false)} style={{background:"none",border:"none",color:T.textSoft,cursor:"pointer",fontSize:20}}>✕</button>
            </div>

            {cart.length>0&&(()=>{
              const cartTypes=new Set(cart.map(c=>c.type));
              const suggested=RAW_LOW_SELLING.filter(s=>cartTypes.has(s.product_type)&&!samples.includes(s.product_id)).slice(0,2);
              return suggested.length>0?(
                <div style={{padding:"12px 16px",background:T.accentSoft,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{color:T.accent,fontWeight:700,fontSize:"0.78rem",marginBottom:8}}>🎁 Free Samples — Matched to Your Cart</div>
                  {suggested.map(s=>(
                    <div key={s.product_id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,background:T.card,borderRadius:10,padding:"8px 10px"}}>
                      {s.picture_src&&<img src={s.picture_src} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:6}} onError={e=>e.target.style.display="none"}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:T.textSoft,fontSize:"0.65rem"}}>{s.brand}</div>
                        <div style={{color:T.text,fontSize:"0.74rem",fontWeight:600,lineHeight:1.2}}>{s.product_name.slice(0,30)}…</div>
                      </div>
                      <button className="sf-btn" onClick={()=>claimSample(s)} style={{padding:"5px 10px",borderRadius:8,border:"none",background:T.accentGrad,color:"#fff",fontSize:"0.7rem",fontWeight:700,cursor:"pointer",flexShrink:0}}>Get Free</button>
                    </div>
                  ))}
                </div>
              ):null;
            })()}

            {cart.length===0?(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.textSoft,gap:12}}>
                <span style={{fontSize:40}}>🛒</span><p style={{fontSize:"0.85rem"}}>Your cart is empty</p>
              </div>
            ):(
              <>
                <div style={{flex:1,padding:"1rem 1.5rem",display:"flex",flexDirection:"column",gap:10}}>
                  {cart.map((item,i)=>(
                    <div key={i} style={{background:T.card,borderRadius:12,padding:"0.9rem",border:`1.5px solid ${item.isSample?T.accent+"44":T.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div style={{flex:1}}>
                          {item.isSample&&<div style={{color:T.accent,fontSize:"0.65rem",fontWeight:700,marginBottom:2}}>🎁 FREE SAMPLE</div>}
                          <div style={{color:T.textSoft,fontSize:"0.7rem"}}>{item.brand}</div>
                          <div style={{color:T.text,fontWeight:600,fontSize:"0.82rem",lineHeight:1.3}}>{item.name}</div>
                          <div style={{fontWeight:700,fontSize:"0.85rem",marginTop:4,background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{item.price}</div>
                        </div>
                        <button onClick={()=>removeFromCart(item.name)} style={{background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:14}}>✕</button>
                      </div>
                      {!item.isSample&&<div style={{color:T.textSoft,fontSize:"0.75rem",marginTop:6}}>Qty: {item.qty}</div>}
                    </div>
                  ))}
                </div>
                <div style={{padding:"1.25rem 1.5rem",borderTop:`1.5px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,padding:"12px 16px",background:T.accentSoft,borderRadius:12,border:`1.5px solid ${T.borderStrong}`}}>
                    <span style={{fontWeight:600,color:T.text}}>Total</span>
                    <span style={{fontWeight:800,fontSize:17,background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                      Rp {Math.round(cartTotal).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <button className="sf-btn" onClick={startCheckout} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:T.accentGrad,color:"#fff",fontWeight:700,fontSize:"0.9rem",cursor:"pointer"}}>Checkout →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ VIEWS ══ */}
      <div style={{position:"relative",zIndex:1}}>

        {/* ── ORDERS VIEW ── */}
        {view===VIEW_ORDERS && <OrdersPage T={T} user={user}/>}

        {/* ── HOME VIEW ── */}
        {view===VIEW_HOME && (
          <div>
            <div style={{position:"relative",overflow:"hidden",padding:"5rem 2rem 4rem",borderBottom:`1.5px solid ${T.border}`}}>
              <div style={{position:"absolute",top:-80,right:-60,width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,${T.accent}20,transparent 70%)`,pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-60,left:-40,width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${T.accent}15,transparent 70%)`,pointerEvents:"none"}}/>
              <div style={{maxWidth:680,position:"relative"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.accentSoft,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 14px",marginBottom:20}}>
                  <span>{sm.emoji}</span>
                  <span style={{color:T.accent,fontSize:"0.75rem",fontWeight:700}}>{sm.label} Collection</span>
                </div>
                <h1 style={{fontSize:"3rem",fontWeight:900,lineHeight:1.1,margin:"0 0 16px",color:T.text,fontFamily:"'Playfair Display',serif"}}>
                  Bloom Your{" "}
                  <span style={{background:T.accentGrad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Glow</span>{" "}
                  with Dup Glow
                </h1>
                <p style={{color:T.textSoft,fontSize:"1rem",lineHeight:1.6,marginBottom:28,maxWidth:500}}>
                  Discover personalized skincare — {ALL_PRODUCTS.length.toLocaleString()} curated products, intelligent recommendations.
                </p>
                <div style={{display:"flex",gap:12}}>
                  <button className="sf-btn" onClick={()=>setView(VIEW_CAT)} style={{padding:"13px 28px",borderRadius:30,border:"none",background:T.accentGrad,color:"#fff",fontWeight:700,fontSize:"0.95rem",cursor:"pointer",boxShadow:`0 8px 24px ${T.accent}44`}}>Shop Now →</button>
                  <button className="sf-btn" onClick={()=>setView(VIEW_AI_ANALYZER)} style={{padding:"13px 28px",borderRadius:30,border:`2px solid ${T.accent}`,background:"transparent",color:T.accent,fontWeight:700,fontSize:"0.95rem",cursor:"pointer"}}>🤖 AI Image Analysis</button>
                </div>
                <div style={{display:"flex",gap:32,marginTop:36}}>
                  {[{n:"50K+",l:"Happy Clients"},{n:"200+",l:"Premium Brands"},{n:"99%",l:"Satisfaction"}].map(s=>(
                    <div key={s.l}>
                      <div style={{color:T.text,fontWeight:800,fontSize:"1.5rem",fontFamily:"'Playfair Display',serif"}}>{s.n}</div>
                      <div style={{color:T.textSoft,fontSize:"0.72rem",marginTop:2}}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <HomeRow
              icon={sm.emoji} title={`${sm.label} — Picks for You`} subtitle="Seasonal recommendations"
              color={sm.color} T={T}
              products={(RAW_SEASONAL[season]||RAW_SEASONAL.stable).map(p=>({id:p.product_id,name:p.product_name,brand:p.brand,type:p.product_type,price:p.price,img:p.picture_src,effects:p.notable_effects,skin:p.skintype}))}
              badge={{text:"⭐ SEASONAL",color:sm.color}}
              onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:"",effects:p.effects||"",skin:p.skin||""});toast("🛒 Added!");}}
              onViewAll={()=>setView(VIEW_CAT)}
              cart={cart}
            />

            <HomeRow
              icon="🔥" title="Hot Offers — Buy 2 Get 3 FREE" subtitle="Limited-time deals on select products"
              color="#EF4444" T={T}
              products={RAW_NEAR_EXPIRY.map(p=>({id:p.product_id,name:p.product_name,brand:p.brand,type:p.product_type,price:p.price,img:p.picture_src,effects:"",skin:""}))}
              badge={{text:"🔥 BUY 2 GET 3",color:"#EF4444"}}
              onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:"",effects:"",skin:""});toast("🛒 Added!");}}
              onViewAll={()=>setView(VIEW_CAT)}
              cart={cart}
            />

            {HOMEPAGE_SECTIONS.map(sec=>(
              <HomeRow key={sec.id} title={sec.label} subtitle={sec.subtitle} color={sec.color} T={T}
                products={sec.products}
                onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:p.tier||"",effects:p.effects||"",skin:p.skin||""});toast("🛒 Added!");}}
                onViewAll={()=>{setView(VIEW_CAT);if(sec.id==="serums")setTypeFilter("Serum");if(sec.id==="sun")setTypeFilter("Sunscreen");if(sec.id==="budget")setTierFilter("Budget");if(sec.id==="trending")setTierFilter("Premium");}}
                cart={cart}
              />
            ))}

            <div style={{padding:"3rem 2rem",textAlign:"center",borderTop:`1.5px solid ${T.border}`}}>
              <h3 style={{color:T.text,fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.4rem",marginBottom:8}}>Explore All {ALL_PRODUCTS.length.toLocaleString()} Products</h3>
              <p style={{color:T.textSoft,fontSize:"0.88rem",marginBottom:20}}>Advanced filters, brand search, and more</p>
              <button className="sf-btn" onClick={()=>setView(VIEW_CAT)} style={{padding:"13px 32px",borderRadius:30,border:`1.5px solid ${T.accent}66`,background:T.accentSoft,color:T.accent,fontWeight:700,fontSize:"0.95rem",cursor:"pointer"}}>Browse Full Catalogue →</button>
            </div>
          </div>
        )}

        {/* ── CATALOGUE VIEW ── */}
        {view===VIEW_CAT && (
          <div style={{display:"flex",minHeight:"calc(100vh - 66px)"}}>
            <aside style={{width:sidebarOpen?260:0,flexShrink:0,overflow:"hidden",transition:"width 0.25s ease",background:T.surface,borderRight:`1.5px solid ${T.border}`}}>
              <div style={{width:260,padding:"1.5rem",display:"flex",flexDirection:"column",gap:20,overflowY:"auto",maxHeight:"calc(100vh - 66px)",position:"sticky",top:66}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <h3 style={{color:T.text,fontWeight:700,fontSize:"0.9rem",margin:0,fontFamily:"'Playfair Display',serif"}}>🎛 Filters</h3>
                  {activeFC>0&&<button onClick={clearFilters} style={{background:"none",border:"none",color:T.danger,fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>✕ Clear ({activeFC})</button>}
                </div>
                <FilterSection label="Sort By" T={T}>
                  <select value={sortBy} onChange={e=>{setSortBy(e.target.value);resetPage();}} style={selStyle}>
                    {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FilterSection>
                <FilterSection label="Product Type" T={T}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {TYPES.map(t=><SidebarPill key={t} label={t} active={typeFilter===t} T={T} onClick={()=>{setTypeFilter(t);resetPage();}}/>)}
                  </div>
                </FilterSection>
                <FilterSection label="Price Tier" T={T}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {TIERS.map(t=><SidebarPill key={t} label={t} active={tierFilter===t} T={T} onClick={()=>{setTierFilter(t);resetPage();}}/>)}
                  </div>
                </FilterSection>
                <FilterSection label="Brand" T={T}>
                  <select value={brandFilter} onChange={e=>{setBrandFilter(e.target.value);resetPage();}} style={selStyle}>
                    {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </FilterSection>
                <FilterSection label={`Max Price: ${priceLabel(priceMax)}`} T={T}>
                  <input type="range" min={MIN_PRICE} max={MAX_PRICE} step={5000} value={priceMax} onChange={e=>{setPriceMax(Number(e.target.value));resetPage();}} style={{width:"100%",accentColor:T.accent,cursor:"pointer"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:"0.7rem",color:T.textSoft}}>{priceLabel(MIN_PRICE)}</span>
                    <span style={{fontSize:"0.7rem",color:T.textSoft}}>{priceLabel(MAX_PRICE)}</span>
                  </div>
                </FilterSection>
              </div>
            </aside>

            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{padding:"1rem 1.5rem",borderBottom:`1.5px solid ${T.border}`,background:T.surface+"aa",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <button className="sf-btn" onClick={()=>setSidebarOpen(p=>!p)} style={{
                  padding:"7px 12px",borderRadius:10,border:`1.5px solid ${sidebarOpen?T.accent:T.border}`,
                  background:sidebarOpen?T.accentSoft:"transparent",
                  color:sidebarOpen?T.accent:T.textMid,fontSize:"0.8rem",cursor:"pointer",fontWeight:600,
                }}>
                  {sidebarOpen?"◄ Hide":"► Show"} Filters{activeFC>0?` (${activeFC})`:""}
                </button>
                <span style={{color:T.textSoft,fontSize:"0.82rem"}}><strong style={{color:T.text}}>{filtered.length.toLocaleString()}</strong> products · Page {page} of {totalPages||1}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                  <button disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",color:page===1?T.border:T.textMid,cursor:page===1?"not-allowed":"pointer",fontSize:"0.78rem"}}>← Prev</button>
                  <button disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)} style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",color:page===totalPages?T.border:T.textMid,cursor:page===totalPages?"not-allowed":"pointer",fontSize:"0.78rem"}}>Next →</button>
                </div>
              </div>
              <div style={{padding:"1.25rem 1.5rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14,flex:1}}>
                {paginated.length===0?(
                  <div style={{gridColumn:"1/-1",textAlign:"center",padding:"4rem",color:T.textSoft}}>
                    <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                    <p>No products found. Try adjusting your filters.</p>
                  </div>
                ):paginated.map((p,i)=>(
                  <ProdCard key={i} product={p} T={T} isOffer={OFFER_IDS.has(String(p.id||""))} onAddToCart={addToCart} onProductClick={setSelectedProduct} cartQty={cart.filter(c=>c.name===p.name).reduce((s,c)=>s+c.qty,0)}/>
                ))}
              </div>
              {totalPages>1&&(
                <div style={{display:"flex",justifyContent:"center",gap:6,padding:"1rem 1.5rem 2rem",flexWrap:"wrap",borderTop:`1.5px solid ${T.border}`}}>
                  {Array.from({length:Math.min(totalPages,10)},(_,i)=>{
                    const pg=totalPages<=10?i+1:Math.max(1,Math.min(page-4,totalPages-9))+i;
                    if(pg>totalPages)return null;
                    return <button key={pg} onClick={()=>{setPage(pg);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"6px 12px",borderRadius:10,minWidth:36,border:`1.5px solid ${pg===page?T.accent:T.border}`,background:pg===page?T.accentSoft:"transparent",color:pg===page?T.accent:T.textMid,cursor:"pointer",fontSize:"0.8rem"}}>{pg}</button>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AI ANALYZER VIEW ── */}
        {view===VIEW_AI_ANALYZER && (
          <div style={{position:"relative",zIndex:1,padding:"2rem",maxWidth:600,margin:"0 auto",minHeight:"calc(100vh - 66px)"}}>
            <button className="sf-btn" onClick={()=>setView(VIEW_HOME)} style={{marginBottom:20,padding:"8px 16px",borderRadius:10,border:`1.5px solid ${T.border}`,background:"transparent",color:T.textMid,fontSize:"0.85rem",cursor:"pointer"}}>← Back to Home</button>
            <SkinSelfieAnalyzer
              onAnalysisComplete={(result) => {
                setAiAnalysisData(result);
                setView(VIEW_AI_RESULTS);
              }}
              budget=""
            />
          </div>
        )}

        {/* ── AI RESULTS VIEW ── */}
        {view===VIEW_AI_RESULTS && aiAnalysisData && (
          <div style={{position:"relative",zIndex:1,minHeight:"calc(100vh - 66px)"}}>
            <SkinResultsPage
              analysisData={{
                ok: true,
                analysis: aiAnalysisData,
                products: [],
                product_count: 0,
                model_used: "claude-sonnet-4-20250514"
              }}
              previewUrl={aiPreviewUrl}
              onRetry={() => setView(VIEW_AI_ANALYZER)}
              onClose={() => setView(VIEW_HOME)}
            />
          </div>
        )}

      </div>{/* end views */}

      {/* ── TOASTS ── */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:600,display:"flex",flexDirection:"column",gap:8}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:T.accentGrad,color:"#fff",padding:"11px 18px",borderRadius:12,fontSize:"0.82rem",fontWeight:700,boxShadow:`0 8px 24px ${T.accent}44`,maxWidth:300,animation:"fadeSlideUp 0.3s ease both"}}>{t.msg}</div>
        ))}
      </div>

      {/* ── SKIN REPORT GENERATOR ── */}
      <SkinReportGenerator theme={T} user={user} chatHistory={[]} recommendedProducts={PRODUCTS.slice(0,3)} />

    </div>
  );
}