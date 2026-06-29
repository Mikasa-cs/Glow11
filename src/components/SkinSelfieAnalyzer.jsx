/**
 * SkinSelfieAnalyzer.jsx  —  Groq / Llama 4 Scout edition
 * ──────────────────────────────────────────────────────────
 * FREE API: uses Groq (meta-llama/llama-4-scout-17b-16e-instruct)
 * Get your free key at https://console.groq.com  (no credit card)
 *
 * Key differences from the Anthropic version:
 *  • API URL: https://api.groq.com/openai/v1/chat/completions
 *  • Image format: { type:"image_url", image_url:{ url:"data:image/jpeg;base64,..." } }
 *  • response_format: { type:"json_object" } — guaranteed JSON, no parsing tricks
 *  • Messages: system prompt + user prompt (separate roles)
 *  • No anthropic-version header needed
 *
 * OPTION A — call Groq directly from the browser (simplest, for dev/demo):
 *   Set VITE_GROQ_API_KEY in your .env file.
 *   ⚠ Never expose your key in production — use Option B for prod.
 *
 * OPTION B — route through your FastAPI server (recommended for production):
 *   Set USE_SERVER = true and point SERVER_URL at your /api/analyze-skin endpoint.
 *   The server holds the key; the browser never sees it.
 */

import { useState, useRef, useCallback } from "react";

// ─── Config ────────────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";  // .env: VITE_GROQ_API_KEY=gsk_...
const GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

// Set true to route through your FastAPI server instead of calling Groq directly
const USE_SERVER   = false;
const SERVER_URL   = "http://localhost:8000/api/analyze-skin";
// ───────────────────────────────────────────────────────────────────────────

const SKIN_TYPE_COLORS = {
  Oily:        { accent: "#D4537E" },
  Dry:         { accent: "#5B7FD4" },
  Combination: { accent: "#8B5BD4" },
  Sensitive:   { accent: "#D4735B" },
  Normal:      { accent: "#5BD48B" },
};

const CONCERN_ICONS = {
  Acne: "🔴", Brightening: "✨", "Anti-Aging": "⏳",
  "Pore-Care": "🔬", Moisturizing: "💧", Soothing: "🌿",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .ssa-root {
    font-family: 'DM Sans', sans-serif;
    max-width: 480px; margin: 0 auto;
    --pink-deep:#C2185B; --pink-mid:#E91E8C; --pink-soft:#F8BBD9;
    --pink-blush:#FFF0F7; --text-dark:#1A0A12; --text-mid:#6B3654;
    --text-light:#B07090; --border:#F0C0D8; --white:#FFFFFF;
  }
  .ssa-card { background:var(--white); border:1px solid var(--border); border-radius:24px; overflow:hidden; box-shadow:0 2px 40px rgba(194,24,91,.07); }
  .ssa-header { background:linear-gradient(135deg,#FCE4EC,#F8BBD9,#FFF0F7); padding:32px 32px 24px; border-bottom:1px solid var(--border); text-align:center; }
  .ssa-header-eyebrow { font-size:10px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:var(--pink-deep); margin-bottom:8px; }
  .ssa-header-title { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:300; color:var(--text-dark); line-height:1.2; margin:0 0 8px; }
  .ssa-header-title em { font-style:italic; color:var(--pink-deep); }
  .ssa-header-sub { font-size:13px; color:var(--text-mid); font-weight:300; line-height:1.5; margin:0; }
  .ssa-body { padding:28px 28px 32px; }

  .ssa-badge { display:inline-flex; align-items:center; gap:6px; background:#E8F5E9; border:1px solid #A5D6A7; border-radius:100px; padding:4px 12px; font-size:11px; font-weight:500; color:#2E7D32; margin-bottom:16px; }

  .ssa-dropzone { border:1.5px dashed var(--pink-soft); border-radius:18px; background:var(--pink-blush); padding:36px 24px; text-align:center; cursor:pointer; transition:border-color .2s,background .2s; position:relative; overflow:hidden; }
  .ssa-dropzone:hover,.ssa-dropzone.drag-over { border-color:var(--pink-mid); background:#FFF5FB; }
  .ssa-dropzone input[type="file"] { position:absolute; inset:0; opacity:0; cursor:pointer; font-size:0; }
  .ssa-drop-icon { width:56px; height:56px; background:linear-gradient(135deg,var(--pink-mid),var(--pink-deep)); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; }
  .ssa-drop-title { font-family:'Cormorant Garamond',serif; font-size:18px; color:var(--text-dark); margin:0 0 6px; }
  .ssa-drop-sub { font-size:12px; color:var(--text-light); margin:0 0 18px; font-weight:300; }
  .ssa-drop-btn { display:inline-flex; align-items:center; gap:6px; background:var(--pink-deep); color:white; border:none; border-radius:100px; padding:10px 22px; font-size:13px; font-weight:500; cursor:pointer; pointer-events:none; }

  .ssa-divider { display:flex; align-items:center; gap:12px; margin:18px 0; }
  .ssa-divider-line { flex:1; height:1px; background:var(--border); }
  .ssa-divider-text { font-size:11px; color:var(--text-light); letter-spacing:.08em; text-transform:uppercase; }
  .ssa-camera-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:transparent; border:1.5px solid var(--border); border-radius:14px; padding:14px 20px; font-size:13px; font-weight:500; color:var(--text-mid); cursor:pointer; transition:border-color .2s,background .2s,color .2s; }
  .ssa-camera-btn:hover { border-color:var(--pink-mid); background:var(--pink-blush); color:var(--pink-deep); }

  .ssa-tips-strip { display:flex; gap:6px; margin-top:16px; }
  .ssa-tip-pill { flex:1; background:var(--pink-blush); border:1px solid var(--border); border-radius:10px; padding:8px 6px; text-align:center; font-size:10px; color:var(--text-mid); line-height:1.4; font-weight:300; }
  .ssa-tip-pill strong { display:block; font-size:14px; margin-bottom:2px; }

  .ssa-preview-wrap { position:relative; border-radius:18px; overflow:hidden; background:#1A0A12; aspect-ratio:1/1; }
  .ssa-preview-img { width:100%; height:100%; object-fit:cover; display:block; transition:filter .5s; }
  .ssa-preview-img.analyzing { filter:brightness(.7) saturate(.6); }
  .ssa-preview-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; background:rgba(26,10,18,.45); opacity:0; transition:opacity .3s; pointer-events:none; }
  .ssa-preview-overlay.visible { opacity:1; pointer-events:auto; }
  .ssa-preview-change { background:rgba(255,255,255,.18); backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,.3); border-radius:100px; padding:9px 20px; color:white; font-size:12px; font-weight:500; cursor:pointer; position:absolute; bottom:16px; right:16px; display:flex; align-items:center; gap:6px; }
  .ssa-scan-ring { width:100px; height:100px; border:2px solid rgba(232,30,140,.5); border-radius:50%; border-top-color:var(--pink-mid); animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .ssa-scan-label { color:white; font-size:13px; font-style:italic; font-family:'Cormorant Garamond',serif; }
  .ssa-dots { display:flex; gap:5px; }
  .ssa-dots span { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,.6); animation:dot-pulse 1.2s ease-in-out infinite; }
  .ssa-dots span:nth-child(2) { animation-delay:.2s; }
  .ssa-dots span:nth-child(3) { animation-delay:.4s; }
  @keyframes dot-pulse { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1.2)} }

  .ssa-analyze-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,var(--pink-mid),var(--pink-deep)); color:white; border:none; border-radius:14px; padding:15px 24px; font-size:14px; font-weight:500; cursor:pointer; margin-top:16px; transition:opacity .2s,transform .15s; }
  .ssa-analyze-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
  .ssa-analyze-btn:disabled { opacity:.5; cursor:default; }

  .ssa-results { animation:fade-up .4s ease both; }
  @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .ssa-result-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
  .ssa-result-avatar { width:64px; height:64px; border-radius:50%; overflow:hidden; border:2px solid var(--border); flex-shrink:0; }
  .ssa-result-avatar img { width:100%; height:100%; object-fit:cover; }
  .ssa-result-info { flex:1; }
  .ssa-result-label { font-size:10px; font-weight:500; letter-spacing:.15em; text-transform:uppercase; color:var(--text-light); margin-bottom:4px; }
  .ssa-result-skin-type { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:400; color:var(--text-dark); line-height:1; margin-bottom:4px; }
  .ssa-confidence { font-size:12px; color:var(--text-light); font-weight:300; }
  .ssa-confidence strong { color:var(--pink-deep); font-weight:500; }

  .ssa-concerns-title { font-size:10px; font-weight:500; letter-spacing:.15em; text-transform:uppercase; color:var(--text-light); margin:0 0 10px; }
  .ssa-concerns-grid { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
  .ssa-concern-chip { display:inline-flex; align-items:center; gap:5px; background:var(--pink-blush); border:1px solid var(--pink-soft); border-radius:100px; padding:6px 14px; font-size:12px; color:var(--pink-deep); }

  .ssa-tip { background:var(--pink-blush); border-left:3px solid var(--pink-mid); border-radius:0 10px 10px 0; padding:12px 16px; margin-bottom:20px; font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic; color:var(--text-mid); line-height:1.55; }

  .ssa-cta-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,var(--pink-mid),var(--pink-deep)); color:white; border:none; border-radius:14px; padding:15px 24px; font-size:14px; font-weight:500; cursor:pointer; transition:opacity .2s,transform .15s; }
  .ssa-cta-btn:hover { opacity:.9; transform:translateY(-1px); }
  .ssa-retry-btn { width:100%; background:transparent; border:1.5px solid var(--border); border-radius:14px; padding:12px; font-size:13px; color:var(--text-light); cursor:pointer; margin-top:10px; transition:border-color .2s,color .2s; }
  .ssa-retry-btn:hover { border-color:var(--pink-soft); color:var(--text-mid); }
  .ssa-error { background:#FFF5F5; border:1px solid #FFD0D0; border-radius:12px; padding:14px 16px; font-size:13px; color:#C0392B; text-align:center; margin-bottom:12px; }
  .ssa-warning { background:#FFFDE7; border:1px solid #FFF176; border-radius:12px; padding:10px 14px; font-size:12px; color:#F57F17; margin-bottom:12px; }
`;

// ─── Image utilities ────────────────────────────────────────────────────────

function resizeDataUrl(dataUrl, maxPx, mediaType = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to resize image."));
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxPx && h <= maxPx) { resolve(dataUrl); return; }
      const scale = maxPx / Math.max(w, h);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(mediaType, 0.92));
    };
    img.src = dataUrl;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("FileReader failed."));
    r.onload  = e => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

// ─── Groq skin analysis ─────────────────────────────────────────────────────

const VALID_SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const VALID_CONCERNS   = ["Acne","Brightening","Anti-Aging","Pore-Care","Moisturizing","Soothing"];

function buildPrompts() {
  const skinTypes    = VALID_SKIN_TYPES.join(" | ");
  const concernsList = VALID_CONCERNS.join(", ");
  return {
    system: "You are an expert dermatologist AI. Respond in JSON only.",
    user: `Analyse this facial selfie. Return a JSON object:
{
  "skin_type":  "<one of: ${skinTypes}>",
  "concerns":   ["<from: ${concernsList}>"],
  "confidence": <float 0.0–1.0>,
  "tip":        "<one personalised skincare sentence, no brand names>"
}
Rules: Oily=shine+pores, Dry=flaky+tight, Combination=oily-T+dry-cheeks,
Sensitive=redness+reactive, Normal=balanced.
Confidence: 0.85+ clear face, 0.6–0.84 acceptable, 0.4–0.59 poor quality.
If no face visible: Normal, [], 0.1, "Please upload a clear facial photo."`,
  };
}

async function callGroqVision(file) {
  // Resize to 1024px max — Groq handles this size well
  const rawDataUrl   = await fileToDataUrl(file);
  const mediaType    = file.type || "image/jpeg";
  const dataUrl      = await resizeDataUrl(rawDataUrl, 1024, mediaType);

  const { system, user } = buildPrompts();

  // Option B: route through your FastAPI server
  if (USE_SERVER) {
    const base64 = dataUrl.split(",")[1];   // strip prefix for server
    const res = await fetch(SERVER_URL, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ image_data: base64, media_type: mediaType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || `Server error ${res.status}`);
    }
    const data = await res.json();
    return data.analysis;   // { skin_type, concerns, confidence, tip }
  }

  // Option A: call Groq directly from browser
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY not set. Add VITE_GROQ_API_KEY=gsk_... to your .env file.\n" +
      "Get a free key at https://console.groq.com"
    );
  }

  const res = await fetch(GROQ_URL, {
    method : "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model   : GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },  // full data-URL ← Groq format
            { type: "text", text: user },
          ],
        },
      ],
      response_format: { type: "json_object" },  // guaranteed JSON ← Groq feature
      temperature    : 0.1,
      max_tokens     : 512,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error("Invalid GROQ_API_KEY. Check your .env file.");
    if (res.status === 429) throw new Error("Groq rate limit hit. Wait a moment and try again.");
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const data   = await res.json();
  const raw    = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);   // safe — JSON mode guarantees valid JSON

  // Sanitise values
  const skin_type  = VALID_SKIN_TYPES.includes(parsed.skin_type) ? parsed.skin_type : "Normal";
  const concerns   = (parsed.concerns || []).filter(c => VALID_CONCERNS.includes(c));
  const confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.75));
  const tip        = String(parsed.tip || "").trim();

  return { skin_type, concerns, confidence, tip };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function UploadZone({ onFile, onCamera }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) onFile(f);
  }, [onFile]);

  return (
    <>
      <div className="ssa-badge">⚡ Free · Powered by Groq + Llama 4 Scout</div>
      <div
        className={`ssa-dropzone${dragOver ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <div className="ssa-drop-icon">📸</div>
        <p className="ssa-drop-title">Drop your selfie here</p>
        <p className="ssa-drop-sub">JPG, PNG or WEBP — clear face, good lighting</p>
        <button className="ssa-drop-btn" type="button">✦ Choose photo</button>
      </div>
      <div className="ssa-divider">
        <div className="ssa-divider-line"/>
        <span className="ssa-divider-text">or</span>
        <div className="ssa-divider-line"/>
      </div>
      <button className="ssa-camera-btn" type="button" onClick={onCamera}>
        📷 Take a selfie with camera
      </button>
      <div className="ssa-tips-strip">
        {[["💡","Good lighting"],["😐","Neutral face"],["🔍","No filters"]].map(([icon,txt]) => (
          <div key={txt} className="ssa-tip-pill"><strong>{icon}</strong>{txt}</div>
        ))}
      </div>
    </>
  );
}

function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState("");
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } } }
      );
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch { setError("Camera access denied. Please allow camera permission."); }
  }, []);

  const stop = useCallback(() => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  useState(() => { start(); return stop; });

  const capture = useCallback(() => {
    const video  = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) { stop(); onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" })); }
    }, "image/jpeg", 0.92);
  }, [stop, onCapture]);

  if (error) return (
    <div>
      <div className="ssa-error">{error}</div>
      <button className="ssa-retry-btn" onClick={onCancel}>← Go back</button>
    </div>
  );
  return (
    <div>
      <div className="ssa-preview-wrap" style={{ background: "#0A0A0A" }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",transform:"scaleX(-1)" }} />
        {!ready && (
          <div className="ssa-preview-overlay visible">
            <div className="ssa-scan-ring"/>
            <span className="ssa-scan-label">Starting camera…</span>
          </div>
        )}
      </div>
      <button className="ssa-analyze-btn" style={{ marginTop:14 }} onClick={capture} disabled={!ready}>
        📸 Capture &amp; Analyse
      </button>
      <button className="ssa-retry-btn" onClick={() => { stop(); onCancel(); }}>← Back</button>
    </div>
  );
}

function PreviewAnalyze({ previewUrl, analyzing, onAnalyze, onRetake }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div>
      <div className="ssa-preview-wrap"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <img src={previewUrl} alt="Your selfie"
          className={`ssa-preview-img${analyzing ? " analyzing" : ""}`} />
        <div className={`ssa-preview-overlay${(analyzing || hovered) ? " visible" : ""}`}>
          {analyzing ? (
            <><div className="ssa-scan-ring"/>
              <span className="ssa-scan-label">Analysing with Groq…</span>
              <div className="ssa-dots"><span/><span/><span/></div>
            </>
          ) : (
            <button className="ssa-preview-change" onClick={onRetake}>↺ Retake</button>
          )}
        </div>
      </div>
      <button className="ssa-analyze-btn" onClick={onAnalyze} disabled={analyzing}>
        {analyzing ? "Analysing…" : "✦ Analyse My Skin (Free)"}
      </button>
    </div>
  );
}

function Results({ result, previewUrl, onRetry, onViewProducts }) {
  const accent = SKIN_TYPE_COLORS[result.skin_type]?.accent || "#C2185B";
  const pct    = Math.round((result.confidence || 0.85) * 100);
  return (
    <div className="ssa-results">
      {result.confidence < 0.45 && (
        <div className="ssa-warning">
          ⚠ Low confidence ({pct}%). Try a clearer photo in better lighting.
        </div>
      )}
      <div className="ssa-result-header">
        <div className="ssa-result-avatar"><img src={previewUrl} alt="skin" /></div>
        <div className="ssa-result-info">
          <p className="ssa-result-label">Skin type detected</p>
          <p className="ssa-result-skin-type" style={{ color: accent }}>{result.skin_type}</p>
          <p className="ssa-confidence"><strong>{pct}%</strong> confidence</p>
        </div>
      </div>
      {result.tip && <div className="ssa-tip">"{result.tip}"</div>}
      <p className="ssa-concerns-title">Detected concerns</p>
      <div className="ssa-concerns-grid">
        {(result.concerns || []).length === 0
          ? <span className="ssa-concern-chip">✓ No major concerns</span>
          : result.concerns.map(c => (
              <span key={c} className="ssa-concern-chip">
                {CONCERN_ICONS[c] || "◆"} {c}
              </span>
            ))
        }
      </div>
      <button className="ssa-cta-btn" onClick={() => onViewProducts(result)}>
        ✦ View My Personalised Products
      </button>
      <button className="ssa-retry-btn" onClick={onRetry}>↺ Try another photo</button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SkinSelfieAnalyzer({ onAnalysisComplete, budget = "" }) {
  const [stage,      setStage]      = useState("upload");
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analyzing,  setAnalyzing]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");

  const handleFile = useCallback(f => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(""); setStage("preview");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true); setError("");
    try {
      const data = await callGroqVision(file);
      setResult(data); setStage("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStage("upload"); setFile(null);
    setPreviewUrl(""); setResult(null); setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleViewProducts = useCallback(r => {
    if (onAnalysisComplete) {
      onAnalysisComplete({ skin_type: r.skin_type, concerns: r.concerns, budget });
    }
  }, [onAnalysisComplete, budget]);

  return (
    <>
      <style>{styles}</style>
      <div className="ssa-root">
        <div className="ssa-card">
          <div className="ssa-header">
            <p className="ssa-header-eyebrow">AI Skin Analysis</p>
            <h2 className="ssa-header-title">Know your <em>skin</em></h2>
            <p className="ssa-header-sub">
              Upload a selfie — our AI reads your skin type &amp; concerns<br/>
              and finds your perfect products instantly. Completely free.
            </p>
          </div>
          <div className="ssa-body">
            {error && <div className="ssa-error">{error}</div>}
            {stage === "upload"   && <UploadZone onFile={handleFile} onCamera={() => setStage("camera")} />}
            {stage === "camera"   && <CameraCapture onCapture={handleFile} onCancel={() => setStage("upload")} />}
            {stage === "preview"  && <PreviewAnalyze previewUrl={previewUrl} analyzing={analyzing} onAnalyze={handleAnalyze} onRetake={handleReset} />}
            {stage === "results" && result && <Results result={result} previewUrl={previewUrl} onRetry={handleReset} onViewProducts={handleViewProducts} />}
          </div>
        </div>
      </div>
    </>
  );
}

// Usage:
// <SkinSelfieAnalyzer
//   onAnalysisComplete={({ skin_type, concerns, budget }) => {
//     navigate("/products", { state: { skin_type, concerns, budget } });
//   }}
//   budget="Under Rs 100"
// />