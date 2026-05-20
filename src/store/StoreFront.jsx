// src/store/StoreFront.jsx - Revamped store
import { useState, useMemo, useRef } from "react";
import { ALL_PRODUCTS } from "../data/products";
import { useAuth } from "../auth/AuthContext";
import { C } from "../theme/colors";
import ProductDetailPage from "./ProductDetailPage";

const RAW_SEASONAL = {"stable":[{"product_id":"307","product_name":"EMINA Skin Buddy Bubble Up Face Wash","brand":"EMINA","product_type":"Face Wash","price":"Rp 15.750","price_num":15750,"skintype":"Oily, Combination, Sensitive","notable_effects":"Hydrating, Soothing","description":"Pembersih wajah dengan busa lembut yang mampu mengangkat debu dan kotoran, menjadikan kulit bersih dan halus.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Emina_Skin_Buddy_Bubble_Up_Face_Wash.jpg"},{"product_id":"880","product_name":"SENKA Perfect Whip Fresh","brand":"SENKA","product_type":"Face Wash","price":"Rp 35.000","price_num":35000,"skintype":"Oily","notable_effects":"Anti-Aging","description":"Perfect Whip Fresh adalah produk unggulan sekaligus favorit di negara Jepang dan Korea!","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/f0.jpg"},{"product_id":"198","product_name":"BREYLEE Acne Soap Bar 80gr","brand":"BREYLEE","product_type":"Face Wash","price":"Rp 41.650","price_num":41650,"skintype":"Oily, Combination","notable_effects":"Acne-Free, Skin-Barrier","description":"Produk dengan formula Essens Australian Tea Tree Oil.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Breylee_Acne_Soap_Bar.jpg"},{"product_id":"21","product_name":"A'pieu Deep Clean Cleansing Water","brand":"A'PIEU","product_type":"Face Wash","price":"Rp 89.000","price_num":89000,"skintype":"Normal, Dry","notable_effects":"Hydrating, Moisturizing","description":"A'PIEU Cleansing water yang sangat ringan di wajah.","picture_src":"https://www.soco.id/cdn-cgi/image/w=244,format=auto,dpr=1.45/https://images.soco.id/54152740384-1595757295729.png"},{"product_id":"1","product_name":"ACWELL pH Balancing Soothing Cleansing Foam","brand":"ACWELL","product_type":"Face Wash","price":"Rp 181.800","price_num":181800,"skintype":"Normal, Dry, Combination","notable_effects":"Soothing, Balancing","description":"Membersihkan dan menenangkan kulit sensitif.","picture_src":"https://images.soco.id/8f08ced0-344d-41f4-a15e-9e45c898f92d-.jpg"}],"rainy":[{"product_id":"784","product_name":"White Aqua Micelloil Cleansing Water","brand":"PIXY","product_type":"Face Wash","price":"Rp 55.000","price_num":55000,"skintype":"Normal, Dry, Oily, Combination","notable_effects":"Hydrating, Brightening","description":"Pembersih wajah Oil in Micellar Water.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Micell-Oil-Speed-Remove-Close.webp"},{"product_id":"307","product_name":"EMINA Skin Buddy Bubble Up Face Wash","brand":"EMINA","product_type":"Face Wash","price":"Rp 15.750","price_num":15750,"skintype":"Oily, Combination, Sensitive","notable_effects":"Hydrating, Soothing","description":"Pembersih wajah dengan busa lembut.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Emina_Skin_Buddy_Bubble_Up_Face_Wash.jpg"},{"product_id":"1","product_name":"ACWELL pH Balancing Soothing Cleansing Foam","brand":"ACWELL","product_type":"Face Wash","price":"Rp 181.800","price_num":181800,"skintype":"Normal, Dry, Combination","notable_effects":"Soothing, Balancing","description":"Membersihkan dan menenangkan kulit sensitif.","picture_src":"https://images.soco.id/8f08ced0-344d-41f4-a15e-9e45c898f92d-.jpg"}],"dry":[{"product_id":"252","product_name":"DERMALUZ Hydrate Glow Face Wash","brand":"DERMALUZ","product_type":"Face Wash","price":"Rp 41.650","price_num":41650,"skintype":"Normal, Dry","notable_effects":"Hydrating, Pore-Care, Brightening","description":"Sabun wajah yang membantu membersihkan kulit.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Dermaluz_Hydrate_Glow_Face_Wash.png"},{"product_id":"764","product_name":"Npure Marigold Deep Cleansing Foaming","brand":"N'PURE","product_type":"Face Wash","price":"Rp 129.000","price_num":129000,"skintype":"Oily","notable_effects":"Pore-Care, Brightening, Anti-Aging","description":"Pembersih multifungsional 4 fungsi dalam 1 produk.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Face_Wash_Marigold-Calendula_Serieszzzzzzzzzzz.png"},{"product_id":"307","product_name":"EMINA Skin Buddy Bubble Up Face Wash","brand":"EMINA","product_type":"Face Wash","price":"Rp 15.750","price_num":15750,"skintype":"Oily, Combination, Sensitive","notable_effects":"Hydrating, Soothing","description":"Pembersih wajah dengan busa lembut.","picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Emina_Skin_Buddy_Bubble_Up_Face_Wash.jpg"}]};
const RAW_LOW_SELLING = [{"product_id":"120","product_name":"BANANA BOAT Simply Protect Aqua Daily Moisture Sunscreen SPF50+","brand":"BANANA BOAT","product_type":"Sunscreen","price":"Rp 144.100","price_num":144100,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/BB_SimplyProtectAqua_DailyMoist_800x800pxl.jpg"},{"product_id":"102","product_name":"BANANA BOAT Deep Tanning Oil SPF4","brand":"BANANA BOAT","product_type":"Sunscreen","price":"Rp 101.200","price_num":101200,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/60025_BB_DeepTanningOil_spf4-236ml_800x800pxl.jpg"},{"product_id":"176","product_name":"BIORE UV Tone Up UV Milk SPF 50+/PA++++","brand":"BIORE","product_type":"Sunscreen","price":"Rp 112.500","price_num":112500,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Biore_UV_Tone_Up_UV_Milk_SPF_50%2B_PA.png"},{"product_id":"308","product_name":"Emina Sun Battle SPF 30 PA+++","brand":"EMINA","product_type":"Sunscreen","price":"Rp 29.000","price_num":29000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/74aa43b8-fddf-4980-bd41-03d5702c1dd6-image-0-1624258660370"},{"product_id":"942","product_name":"Skin Aqua UV Mild Milk","brand":"SKIN AQUA","product_type":"Sunscreen","price":"Rp 52.470","price_num":52470,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/d26c671b-d4fa-4914-a214-457cba9c3560-image-0-1615972023650"},{"product_id":"97","product_name":"Azarine Hydrashoothe Sunscreen Gel Spf45+++","brand":"AZARINE","product_type":"Sunscreen","price":"Rp 65.000","price_num":65000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=244,format=auto,dpr=1.45/https://images.soco.id/083f16a2-5aeb-4159-af33-c1151a53a5b7-image-0-1609837989120"}];
// Task 2: expiry info stripped — users never see expiry dates
const RAW_NEAR_EXPIRY = [{"product_id":"11","product_name":"AIZEN SunOrion UV Sunscreen","brand":"AIZEN","product_type":"Sunscreen","price":"Rp 139.000","price_num":139000,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/Aizen_SunOrion_UV_Sunscreen.png"},{"product_id":"748","product_name":"Nivea Sun Face Protection Serum SPF50+ PA+++","brand":"NIVEA","product_type":"Sunscreen","price":"Rp 51.000","price_num":51000,"picture_src":"https://s3-ap-southeast-1.amazonaws.com/img-sociolla/img/p/3/3/6/5/7/33657-large_default.jpg"},{"product_id":"308","product_name":"Emina Sun Battle SPF 30 PA+++","brand":"EMINA","product_type":"Sunscreen","price":"Rp 29.000","price_num":29000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/74aa43b8-fddf-4980-bd41-03d5702c1dd6-image-0-1624258660370"},{"product_id":"71","product_name":"Avoskin The Great Shield Sunscreen","brand":"AVOSKIN","product_type":"Sunscreen","price":"Rp 60.500","price_num":60500,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/6c69eb37-9607-4b78-9c27-1a519a3c80e1-image-0-1631685598581"},{"product_id":"938","product_name":"SKIN AQUA Tone Up UV Essence Mint Green","brand":"SKIN AQUA","product_type":"Sunscreen","price":"Rp 69.300","price_num":69300,"picture_src":"https://www.beautyhaul.com/assets/uploads/products/thumbs/800x800/SA_uv_tone_mint_green_packshot_front.png"},{"product_id":"204","product_name":"Carasun Solar Smart UV Cushion Refill","brand":"CARASUN","product_type":"Sunscreen","price":"Rp 115.000","price_num":115000,"picture_src":"https://www.soco.id/cdn-cgi/image/w=73,format=auto,dpr=1.45/https://images.soco.id/5615c28f-f001-43b8-a0e4-1b7bd40a6c2a-.jpg"}];

const OFFER_IDS = new Set(RAW_NEAR_EXPIRY.map(p => p.product_id));
const SAMPLE_IDS = new Set(RAW_LOW_SELLING.map(p => p.product_id));

function detectSeason() {
  const m = new Date().getMonth() + 1;
  if ([11,12,1,2].includes(m)) return "rainy";
  if ([6,7,8,9,10].includes(m)) return "dry";
  return "stable";
}
const SEASON_META = {
  rainy:  { label:"🌧️ Rainy Season", color:"#4A90D9", bg:"rgba(74,144,217,0.1)", emoji:"🌧️" },
  dry:    { label:"☀️ Dry Season",   color:"#E6830A", bg:"rgba(230,131,10,0.1)",  emoji:"☀️" },
  stable: { label:"🌤️ Year-Round",   color:"#059669", bg:"rgba(5,150,105,0.1)",   emoji:"🌤️" },
};
// Normalize raw CSV field names → consistent short names used throughout StoreFront
const PRODUCTS = ALL_PRODUCTS.map((p, i) => ({
  id:      String(i),
  name:    (p.product_name || p.name || "").trim(),
  brand:   (p.brand || "").trim(),
  type:    (p.product_type || p.type || "").trim(),
  price:   p.price || "",
  tier:    p.tier || "",
  effects: (p.notable_effects || p.effects || "").trim(),
  skin:    (p.skintype || p.skin || "").trim(),
  img:     p.picture_src || p.img || "",
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
const MAX_PRICE = 3520000;
function parsePrice(str){return parseInt((str||"0").replace(/[^0-9]/g,""),10)||0;}
const TIER_COLOR={Budget:C.accent4,"Mid-Range":"#86efac",Premium:C.accent2,Luxury:C.warning};
const TIER_BG={Budget:"#122b1e","Mid-Range":"#1e2a10",Premium:"#1a1a30",Luxury:"#2d1a10"};

// Curated homepage sections — not dumping all products
const HOMEPAGE_SECTIONS = [
  { id:"trending", label:"🔥 Trending Now", subtitle:"Most popular this week", color:C.accent2,
    products:PRODUCTS.filter(p=>p.tier==="Premium").slice(0,10) },
  { id:"budget", label:"💸 Best Value Picks", subtitle:"Affordable skincare that works", color:C.accent4,
    products:PRODUCTS.filter(p=>p.tier==="Budget").slice(0,10) },
  { id:"serums", label:"✨ Power Serums", subtitle:"Target your skin concerns", color:C.accent,
    products:PRODUCTS.filter(p=>p.type==="Serum").slice(0,10) },
  { id:"sun", label:"☀️ Sun Protection", subtitle:"Never skip sunscreen", color:C.warning,
    products:PRODUCTS.filter(p=>p.type==="Sunscreen").slice(0,10) },
];

const VIEW_HOME = "home";
const VIEW_CAT = "catalogue";

export default function StoreFront() {
  const {user,logout} = useAuth();
  const season = detectSeason();
  const sm = SEASON_META[season];

  const [view,setView] = useState(VIEW_HOME);
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [search,setSearch] = useState("");
  const [typeFilter,setTypeFilter] = useState("All");
  const [tierFilter,setTierFilter] = useState("All");
  const [brandFilter,setBrandFilter] = useState("All");
  const [priceMax,setPriceMax] = useState(MAX_PRICE);
  const [sortBy,setSortBy] = useState("default");
  const [page,setPage] = useState(1);
  const [cart,setCart] = useState([]);
  const [cartOpen,setCartOpen] = useState(false);
  const [sidebarOpen,setSidebarOpen] = useState(true);
  const [samples,setSamples] = useState([]);
  const [toasts,setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = (msg,type="success") => {
    const id=++toastId.current;
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  };

  const filtered = useMemo(()=>{
    let list = PRODUCTS.filter(p=>{
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
    toast(`🎁 Free sample added to cart!`,"warning");
  };

  const priceLabel=(v)=>v>=1000000?`Rp ${(v/1000000).toFixed(1)}M`:`Rp ${(v/1000).toFixed(0)}K`;

  if(selectedProduct){
    return <ProductDetailPage product={selectedProduct} onBack={()=>setSelectedProduct(null)} onAddToCart={(p)=>{addToCart(p);setSelectedProduct(null);}}/>;
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',sans-serif",color:C.text}}>

      {/* ── HEADER ── Task 1: search in header */}
      <header style={{position:"sticky",top:0,zIndex:100,background:C.bg2+"ee",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.border}`,padding:"0 2rem",display:"flex",alignItems:"center",gap:16,height:64}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,cursor:"pointer"}} onClick={()=>setView(VIEW_HOME)}>
          <span style={{fontSize:22}}>✨</span>
          <span style={{fontSize:"1.1rem",fontWeight:800,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GlowIQ Shop</span>
        </div>
        <nav style={{display:"flex",gap:4}}>
          {[{label:"Home",v:VIEW_HOME},{label:"Catalogue",v:VIEW_CAT}].map(({label,v})=>(
            <button key={v} onClick={()=>setView(v)} style={{background:"none",border:"none",color:view===v?C.accent2:C.muted,fontWeight:view===v?700:500,fontSize:"0.85rem",cursor:"pointer",padding:"6px 14px",borderRadius:8,borderBottom:view===v?`2px solid ${C.accent2}`:"2px solid transparent"}}>{label}</button>
          ))}
        </nav>
        {/* Search bar in header */}
        <div style={{flex:1,maxWidth:440,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={(e)=>{setSearch(e.target.value);resetPage();if(e.target.value)setView(VIEW_CAT);}} placeholder="Search skincare…"
            style={{width:"100%",padding:"9px 14px 9px 34px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:"0.85rem",outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.accent2} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto",flexShrink:0}}>
          <span style={{color:C.muted,fontSize:"0.82rem"}}>Hi, {user.name} 👋</span>
          <button onClick={()=>setCartOpen(!cartOpen)} style={{position:"relative",background:cartCount>0?C.accent2+"22":C.bg2,border:`1px solid ${cartCount>0?C.accent2:C.border}`,borderRadius:10,padding:"7px 14px",color:C.text,cursor:"pointer",fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            🛒 Cart
            {cartCount>0&&<span style={{background:C.accent2,color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:"0.65rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
          </button>
          <button onClick={logout} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",color:C.muted,cursor:"pointer",fontSize:"0.82rem"}}>Sign out</button>
        </div>
      </header>

      {/* ── CART DRAWER ── Task 3: free samples suggested inside cart */}
      {cartOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-end"}}>
          <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={()=>setCartOpen(false)}/>
          <div style={{width:380,background:C.bg2,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto"}}>
            <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{color:C.text,fontWeight:700}}>🛒 Cart ({cartCount})</h3>
              <button onClick={()=>setCartOpen(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            {/* Suggest free samples based on cart items */}
            {cart.length>0&&(()=>{
              const cartTypes=new Set(cart.map(c=>c.type));
              const suggested=RAW_LOW_SELLING.filter(s=>cartTypes.has(s.product_type)&&!samples.includes(s.product_id)).slice(0,2);
              return suggested.length>0?(
                <div style={{padding:"12px 16px",background:"#10B98118",borderBottom:"1px solid #10B98133"}}>
                  <div style={{color:"#10B981",fontWeight:700,fontSize:"0.78rem",marginBottom:8}}>🎁 Free Samples — Matched to Your Cart</div>
                  {suggested.map(s=>(
                    <div key={s.product_id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,background:C.card,borderRadius:8,padding:"8px 10px"}}>
                      {s.picture_src&&<img src={s.picture_src} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:6}} onError={e=>e.target.style.display="none"}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:C.muted,fontSize:"0.65rem"}}>{s.brand}</div>
                        <div style={{color:C.text,fontSize:"0.74rem",fontWeight:600,lineHeight:1.2}}>{s.product_name.slice(0,30)}…</div>
                      </div>
                      <button onClick={()=>claimSample(s)} style={{padding:"5px 10px",borderRadius:7,border:"none",background:"#10B981",color:"#fff",fontSize:"0.7rem",fontWeight:700,cursor:"pointer",flexShrink:0}}>Get Free</button>
                    </div>
                  ))}
                </div>
              ):null;
            })()}
            {cart.length===0?(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.muted,gap:12}}>
                <span style={{fontSize:40}}>🛒</span><p style={{fontSize:"0.85rem"}}>Your cart is empty</p>
              </div>
            ):(
              <>
                <div style={{flex:1,padding:"1rem 1.5rem",display:"flex",flexDirection:"column",gap:10}}>
                  {cart.map((item,i)=>(
                    <div key={i} style={{background:C.card,borderRadius:10,padding:"0.9rem",border:`1px solid ${item.isSample?"#10B98144":C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div style={{flex:1}}>
                          {item.isSample&&<div style={{color:"#10B981",fontSize:"0.65rem",fontWeight:700,marginBottom:2}}>🎁 FREE SAMPLE</div>}
                          <div style={{color:C.muted,fontSize:"0.7rem"}}>{item.brand}</div>
                          <div style={{color:C.text,fontWeight:600,fontSize:"0.82rem",lineHeight:1.3}}>{item.name}</div>
                          <div style={{color:item.isSample?"#10B981":C.accent4,fontWeight:700,fontSize:"0.85rem",marginTop:4}}>{item.price}</div>
                        </div>
                        <button onClick={()=>removeFromCart(item.name)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:14}}>✕</button>
                      </div>
                      {!item.isSample&&<div style={{color:C.muted,fontSize:"0.75rem",marginTop:6}}>Qty: {item.qty}</div>}
                    </div>
                  ))}
                </div>
                <div style={{padding:"1.25rem 1.5rem",borderTop:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{color:C.muted,fontSize:"0.85rem"}}>Total</span>
                    <span style={{color:C.text,fontWeight:800}}>Rp {cartTotal.toLocaleString("id-ID")}</span>
                  </div>
                  <button style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.accent2},${C.accent})`,color:"#fff",fontWeight:700,fontSize:"0.9rem",cursor:"pointer"}}>Checkout (Coming Soon)</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOME VIEW — Task 5: editorial layout, curated sections not a dump */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {view===VIEW_HOME&&(
        <div>
          {/* Hero */}
          <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#1a0d2e 0%,#0f1a2e 40%,#0f0e17 100%)",padding:"5rem 2rem 4rem",borderBottom:`1px solid ${C.border}`}}>
            <div style={{position:"absolute",top:-80,right:-60,width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,${C.accent2}18,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-60,left:-40,width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${C.accent}12,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{maxWidth:680,position:"relative"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.accent2+"18",border:`1px solid ${C.accent2}33`,borderRadius:20,padding:"5px 14px",marginBottom:20}}>
                <span>{sm.emoji}</span>
                <span style={{color:sm.color,fontSize:"0.75rem",fontWeight:700}}>{sm.label} Collection</span>
              </div>
              <h1 style={{fontSize:"3rem",fontWeight:900,lineHeight:1.1,margin:"0 0 16px",color:C.text}}>
                Bloom Your{" "}
                <span style={{background:`linear-gradient(135deg,${C.accent2},${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Style</span>{" "}
                with GlowIQ
              </h1>
              <p style={{color:C.muted,fontSize:"1rem",lineHeight:1.6,marginBottom:28,maxWidth:500}}>
                Discover personalized skincare — {ALL_PRODUCTS.length.toLocaleString()} curated products, intelligent recommendations.
              </p>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setView(VIEW_CAT)} style={{padding:"13px 28px",borderRadius:30,border:"none",background:`linear-gradient(135deg,${C.accent2},${C.accent})`,color:"#fff",fontWeight:700,fontSize:"0.95rem",cursor:"pointer",boxShadow:`0 8px 24px ${C.accent2}44`}}>Shop Now →</button>
                <button onClick={()=>{setView(VIEW_CAT);setTypeFilter("Serum");}} style={{padding:"13px 28px",borderRadius:30,border:`1px solid ${C.border}`,background:"none",color:C.text,fontWeight:600,fontSize:"0.95rem",cursor:"pointer"}}>Browse Serums</button>
              </div>
              <div style={{display:"flex",gap:32,marginTop:36}}>
                {[{n:"50K+",l:"Happy Clients"},{n:"200+",l:"Premium Brands"},{n:"99%",l:"Satisfaction"}].map(s=>(
                  <div key={s.l}><div style={{color:C.text,fontWeight:800,fontSize:"1.5rem"}}>{s.n}</div><div style={{color:C.muted,fontSize:"0.72rem",marginTop:2}}>{s.l.toUpperCase()}</div></div>
                ))}
              </div>
            </div>
          </div>

          {/* Seasonal picks row */}
          <HomeRow
            icon={sm.emoji} title={`${sm.label} — Picks for You`} subtitle="Seasonal recommendations" color={sm.color}
            products={(RAW_SEASONAL[season]||RAW_SEASONAL.stable).map(p=>({id:p.product_id,name:p.product_name,brand:p.brand,type:p.product_type,price:p.price,img:p.picture_src,effects:p.notable_effects,skin:p.skintype}))}
            badge={{text:"⭐ SEASONAL",color:sm.color}}
            onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:"",effects:p.effects||"",skin:p.skin||""});toast(`🛒 Added!`);}}
            onViewAll={()=>setView(VIEW_CAT)}
          />

          {/* Task 4: Offers — just badge products, no separate slider with countdowns */}
          <HomeRow
            icon="🔥" title="Hot Offers — Buy 2 Get 3 FREE" subtitle="Limited-time deals on select products" color="#EF4444"
            products={RAW_NEAR_EXPIRY.map(p=>({id:p.product_id,name:p.product_name,brand:p.brand,type:p.product_type,price:p.price,img:p.picture_src,effects:"",skin:""}))}
            badge={{text:"🔥 BUY 2 GET 3",color:"#EF4444"}}
            onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:"",effects:"",skin:""});toast(`🛒 Added!`);}}
            onViewAll={()=>setView(VIEW_CAT)}
          />

          {/* Curated category rows */}
          {HOMEPAGE_SECTIONS.map(sec=>(
            <HomeRow key={sec.id} title={sec.label} subtitle={sec.subtitle} color={sec.color}
              products={sec.products}
              onAdd={(p)=>{addToCart({name:p.name,brand:p.brand,type:p.type,price:p.price,tier:p.tier||"",effects:p.effects||"",skin:p.skin||""});toast(`🛒 Added!`);}}
              onViewAll={()=>{setView(VIEW_CAT);if(sec.id==="serums")setTypeFilter("Serum");if(sec.id==="sun")setTypeFilter("Sunscreen");if(sec.id==="budget")setTierFilter("Budget");if(sec.id==="trending")setTierFilter("Premium");}}
            />
          ))}

          {/* Bottom CTA */}
          <div style={{padding:"3rem 2rem",textAlign:"center",borderTop:`1px solid ${C.border}`,background:`linear-gradient(180deg,transparent,${C.accent2}08)`}}>
            <h3 style={{color:C.text,fontWeight:800,fontSize:"1.3rem",marginBottom:8}}>Explore All {ALL_PRODUCTS.length.toLocaleString()} Products</h3>
            <p style={{color:C.muted,fontSize:"0.88rem",marginBottom:20}}>Advanced filters, brand search, and more</p>
            <button onClick={()=>setView(VIEW_CAT)} style={{padding:"13px 32px",borderRadius:30,border:`1px solid ${C.accent2}66`,background:C.accent2+"18",color:C.accent2,fontWeight:700,fontSize:"0.95rem",cursor:"pointer"}}>Browse Full Catalogue →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CATALOGUE VIEW — Task 1: filter sidebar on LEFT of product grid   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {view===VIEW_CAT&&(
        <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
          {/* Left filter sidebar */}
          <aside style={{width:sidebarOpen?256:0,flexShrink:0,overflow:"hidden",transition:"width 0.25s ease",background:C.bg2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
            <div style={{width:256,padding:"1.5rem",display:"flex",flexDirection:"column",gap:20,overflowY:"auto",flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h3 style={{color:C.text,fontWeight:700,fontSize:"0.9rem",margin:0}}>🎛 Filters</h3>
                {activeFC>0&&<button onClick={clearFilters} style={{background:"none",border:"none",color:C.danger,fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>✕ Clear ({activeFC})</button>}
              </div>
              <FilterSection label="Sort By">
                <select value={sortBy} onChange={e=>{setSortBy(e.target.value);resetPage();}} style={selStyle}>
                  {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FilterSection>
              <FilterSection label="Product Type">
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {TYPES.map(t=><SidebarPill key={t} label={t} active={typeFilter===t} color={C.accent2} onClick={()=>{setTypeFilter(t);resetPage();}}/>)}
                </div>
              </FilterSection>
              <FilterSection label="Price Tier">
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {TIERS.map(t=><SidebarPill key={t} label={t} active={tierFilter===t} color={C.warning} onClick={()=>{setTierFilter(t);resetPage();}}/>)}
                </div>
              </FilterSection>
              <FilterSection label="Brand">
                <select value={brandFilter} onChange={e=>{setBrandFilter(e.target.value);resetPage();}} style={{...selStyle,borderColor:brandFilter!=="All"?C.accent3:C.border,color:brandFilter!=="All"?C.accent3:C.text}}>
                  {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </FilterSection>
              <FilterSection label={<>Max Price: <span style={{color:C.accent4,fontWeight:800}}>{priceLabel(priceMax)}</span></>}>
                <input type="range" min={15000} max={MAX_PRICE} step={5000} value={priceMax} onChange={e=>{setPriceMax(Number(e.target.value));resetPage();}} style={{width:"100%",accentColor:C.accent4,cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:"0.7rem",color:C.muted}}>Rp 15K</span>
                  <span style={{fontSize:"0.7rem",color:C.muted}}>Rp 3.5M</span>
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* Main content */}
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"1rem 1.5rem",borderBottom:`1px solid ${C.border}`,background:C.bg2+"88",display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setSidebarOpen(p=>!p)} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:sidebarOpen?C.accent2+"18":"none",color:sidebarOpen?C.accent2:C.muted,fontSize:"0.8rem",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                {sidebarOpen?"◄ Hide":"► Show"} Filters{activeFC>0?` (${activeFC})`:""}
              </button>
              <span style={{color:C.muted,fontSize:"0.82rem"}}><strong style={{color:C.text}}>{filtered.length.toLocaleString()}</strong> products · Page {page} of {totalPages||1}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:page===1?C.border:C.muted,cursor:page===1?"not-allowed":"pointer",fontSize:"0.78rem"}}>← Prev</button>
                <button disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:page===totalPages?C.border:C.muted,cursor:page===totalPages?"not-allowed":"pointer",fontSize:"0.78rem"}}>Next →</button>
              </div>
            </div>
            <div style={{padding:"1.25rem 1.5rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14,flex:1}}>
              {paginated.length===0?(
                <div style={{gridColumn:"1/-1",textAlign:"center",padding:"4rem",color:C.muted}}>
                  <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                  <p>No products found. Try adjusting your filters.</p>
                </div>
              ):paginated.map((p,i)=>(
                <ProdCard key={i} product={p} isOffer={OFFER_IDS.has(String(p.id||""))} onAddToCart={addToCart} onProductClick={setSelectedProduct}/>
              ))}
            </div>
            {totalPages>1&&(
              <div style={{display:"flex",justifyContent:"center",gap:6,padding:"1rem 1.5rem 2rem",flexWrap:"wrap",borderTop:`1px solid ${C.border}`}}>
                {Array.from({length:Math.min(totalPages,10)},(_,i)=>{
                  const pg=totalPages<=10?i+1:Math.max(1,Math.min(page-4,totalPages-9))+i;
                  if(pg>totalPages)return null;
                  return <button key={pg} onClick={()=>{setPage(pg);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"6px 12px",borderRadius:8,minWidth:36,border:`1px solid ${pg===page?C.accent2:C.border}`,background:pg===page?C.accent2+"22":"none",color:pg===page?C.accent2:C.muted,cursor:"pointer",fontSize:"0.8rem"}}>{pg}</button>;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toasts */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:600,display:"flex",flexDirection:"column",gap:8}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==="warning"?"#10B981":C.accent4,color:"#0f0e17",padding:"11px 18px",borderRadius:10,fontSize:"0.82rem",fontWeight:700,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",maxWidth:300}}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

const selStyle={width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid #2e2b45`,background:"#201e30",color:"#f0eef8",fontSize:"0.82rem",cursor:"pointer",outline:"none"};

function FilterSection({label,children}){
  return <div><div style={{color:"#8b8aaa",fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{label}</div>{children}</div>;
}
function SidebarPill({label,active,color,onClick}){
  return <button onClick={onClick} style={{padding:"7px 12px",borderRadius:8,fontSize:"0.82rem",cursor:"pointer",border:`1px solid ${active?color:"#2e2b45"}`,background:active?color+"22":"none",color:active?color:"#8b8aaa",textAlign:"left",width:"100%",fontWeight:active?700:400}}>{label}</button>;
}

function HomeRow({icon,title,subtitle,color,products,badge,onAdd,onViewAll}){
  const ref=useRef(null);
  return (
    <div style={{padding:"2rem 0 0.5rem",borderBottom:`1px solid ${C.border}`}}>
      <div style={{padding:"0 2rem",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        {icon&&<div style={{width:40,height:40,borderRadius:"50%",background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>}
        <div style={{flex:1}}>
          <h3 style={{margin:0,color:C.text,fontWeight:800,fontSize:"1.1rem"}}>{title}</h3>
          {subtitle&&<p style={{margin:"3px 0 0",color:C.muted,fontSize:"0.78rem"}}>{subtitle}</p>}
        </div>
        {onViewAll&&<button onClick={onViewAll} style={{padding:"7px 18px",borderRadius:20,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>View All →</button>}
      </div>
      <div style={{position:"relative"}}>
        <button onClick={()=>ref.current?.scrollBy({left:-320,behavior:"smooth"})} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:10,background:C.bg2+"ee",border:`1px solid ${C.border}`,borderRadius:"50%",width:36,height:36,color:C.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <button onClick={()=>ref.current?.scrollBy({left:320,behavior:"smooth"})} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",zIndex:10,background:C.bg2+"ee",border:`1px solid ${C.border}`,borderRadius:"50%",width:36,height:36,color:C.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        <div ref={ref} style={{display:"flex",gap:14,overflowX:"auto",padding:"4px 2rem 1.5rem",scrollbarWidth:"none",msOverflowStyle:"none"}}>
          {products.map((p,i)=><MiniCard key={i} product={p} badge={badge} color={color} onAdd={onAdd}/>)}
        </div>
      </div>
    </div>
  );
}

function MiniCard({product:p,badge,color,onAdd}){
  const [imgErr,setImgErr]=useState(false);
  const [added,setAdded]=useState(false);
  const handleAdd=(e)=>{e.stopPropagation();onAdd(p);setAdded(true);setTimeout(()=>setAdded(false),1200);};
  return (
    <div style={{width:196,flexShrink:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",transition:"transform 0.18s,border-color 0.18s",cursor:"pointer"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=color+"66";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=C.border;}}>
      <div style={{position:"relative",height:155,background:C.bg2}}>
        {p.img&&!imgErr?<img src={p.img} alt={p.name||"product"} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🧴</div>}
        {badge&&<div style={{position:"absolute",top:8,left:8,background:badge.color,color:"#fff",fontSize:"0.6rem",fontWeight:800,padding:"3px 8px",borderRadius:6,letterSpacing:0.5}}>{badge.text}</div>}
      </div>
      <div style={{padding:"10px 12px 12px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
        <div style={{color:C.muted,fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:0.4}}>{p.brand||""}</div>
        <div style={{color:C.text,fontWeight:700,fontSize:"0.8rem",lineHeight:1.3,flex:1}}>{(p.name||"").slice(0,44)}{(p.name||"").length>44?"…":""}</div>
        <div style={{color:C.accent4,fontWeight:800,fontSize:"0.88rem"}}>{p.price||""}</div>
        <button onClick={handleAdd} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",marginTop:4,background:added?C.accent4+"22":`linear-gradient(135deg,${color}cc,${C.accent}cc)`,color:added?C.accent4:"#fff",fontSize:"0.75rem",fontWeight:700,cursor:"pointer"}}>{added?"✓ Added":"+ Cart"}</button>
      </div>
    </div>
  );
}

function ProdCard({product:p,isOffer,onAddToCart,onProductClick}){
  const [added,setAdded]=useState(false);
  const handleAdd=(e)=>{e.stopPropagation();onAddToCart(p);setAdded(true);setTimeout(()=>setAdded(false),1200);};
  const tc=TIER_COLOR[p.tier]||C.muted;
  const tb=TIER_BG[p.tier]||C.bg2;
  return (
    <div onClick={()=>onProductClick&&onProductClick(p)}
      style={{background:C.card,border:`1px solid ${isOffer?"#EF444433":C.border}`,borderRadius:14,padding:"1rem",display:"flex",flexDirection:"column",gap:8,transition:"border-color 0.2s,transform 0.15s",cursor:"pointer",position:"relative"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent2+"66";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=isOffer?"#EF444433":C.border;e.currentTarget.style.transform="translateY(0)";}}>
      {/* Task 4: offer badge on the product card itself, no separate offer slider */}
      {isOffer&&<div style={{position:"absolute",top:10,right:10,background:"#EF4444",color:"#fff",fontSize:"0.6rem",fontWeight:800,padding:"3px 8px",borderRadius:6,letterSpacing:0.5}}>🔥 BUY 2 GET 3</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <span style={{color:C.muted,fontSize:"0.7rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px"}}>{p.brand}</span>
        <span style={{background:tb,color:tc,padding:"2px 8px",borderRadius:6,fontSize:"0.65rem",fontWeight:700,marginRight:isOffer?64:0}}>{p.tier}</span>
      </div>
      <div style={{color:C.text,fontWeight:600,fontSize:"0.87rem",lineHeight:1.35,flex:1}}>{p.name}</div>
      <span style={{background:C.accent2+"18",color:C.accent2,padding:"3px 9px",borderRadius:6,fontSize:"0.7rem",fontWeight:600,alignSelf:"flex-start"}}>{p.type}</span>
      <p style={{color:C.muted,fontSize:"0.72rem",lineHeight:1.4,margin:0}}><span style={{color:C.accent}}>Effects: </span>{p.effects}</p>
      <p style={{color:C.muted,fontSize:"0.72rem",margin:0}}><span style={{color:C.accent3}}>Skin: </span>{p.skin}</p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
        <span style={{color:C.accent4,fontWeight:800,fontSize:"0.95rem"}}>{p.price}</span>
        <button onClick={handleAdd} style={{padding:"7px 14px",borderRadius:8,border:"none",background:added?C.accent4+"22":`linear-gradient(135deg,${C.accent2}cc,${C.accent}cc)`,color:added?C.accent4:"#fff",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>{added?"✓ Added":"+ Cart"}</button>
      </div>
    </div>
  );
}
