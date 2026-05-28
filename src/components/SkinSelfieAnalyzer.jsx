import { useState, useRef, useCallback } from "react";
import SkinResultsPage from "./SkinResultsPage";

{stage === "products" && fullData && (
  <SkinResultsPage
    analysisData={fullData}
    previewUrl={previewUrl}
    onRetry={handleReset}
    onClose={() => setStage("results")}
  />
)}

const SKIN_TYPE_COLORS = {
  Oily:        { bg: "#FFF0F5", accent: "#D4537E", label: "Oily" },
  Dry:         { bg: "#F0F5FF", accent: "#5B7FD4", label: "Dry" },
  Combination: { bg: "#F5F0FF", accent: "#8B5BD4", label: "Combination" },
  Sensitive:   { bg: "#FFF5F0", accent: "#D4735B", label: "Sensitive" },
  Normal:      { bg: "#F0FFF5", accent: "#5BD48B", label: "Normal" },
};

const CONCERN_ICONS = {
  Acne:        "🔴",
  Brightening: "✨",
  "Anti-Aging":"⏳",
  "Pore-Care": "🔬",
  Moisturizing:"💧",
  Soothing:    "🌿",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .ssa-root {
    font-family: 'DM Sans', sans-serif;
    max-width: 480px;
    margin: 0 auto;
    padding: 0;
    --pink-deep:   #C2185B;
    --pink-mid:    #E91E8C;
    --pink-soft:   #F8BBD9;
    --pink-blush:  #FFF0F7;
    --text-dark:   #1A0A12;
    --text-mid:    #6B3654;
    --text-light:  #B07090;
    --border:      #F0C0D8;
    --white:       #FFFFFF;
  }

  .ssa-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 2px 40px rgba(194,24,91,0.07), 0 1px 4px rgba(194,24,91,0.04);
  }

  .ssa-header {
    background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 50%, #FFF0F7 100%);
    padding: 32px 32px 24px;
    border-bottom: 1px solid var(--border);
    text-align: center;
  }

  .ssa-header-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--pink-deep);
    margin-bottom: 8px;
  }

  .ssa-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 300;
    color: var(--text-dark);
    line-height: 1.2;
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }

  .ssa-header-title em {
    font-style: italic;
    color: var(--pink-deep);
  }

  .ssa-header-sub {
    font-size: 13px;
    color: var(--text-mid);
    font-weight: 300;
    line-height: 1.5;
    margin: 0;
  }

  .ssa-body {
    padding: 28px 28px 32px;
  }

  /* ── Drop zone ── */
  .ssa-dropzone {
    border: 1.5px dashed var(--pink-soft);
    border-radius: 18px;
    background: var(--pink-blush);
    padding: 36px 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    position: relative;
    overflow: hidden;
  }

  .ssa-dropzone:hover,
  .ssa-dropzone.drag-over {
    border-color: var(--pink-mid);
    background: #FFF5FB;
  }

  .ssa-dropzone input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    font-size: 0;
  }

  .ssa-drop-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, var(--pink-mid), var(--pink-deep));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 24px;
  }

  .ssa-drop-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 400;
    color: var(--text-dark);
    margin: 0 0 6px;
  }

  .ssa-drop-sub {
    font-size: 12px;
    color: var(--text-light);
    margin: 0 0 18px;
    font-weight: 300;
  }

  .ssa-drop-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--pink-deep);
    color: white;
    border: none;
    border-radius: 100px;
    padding: 10px 22px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    pointer-events: none;
    letter-spacing: 0.01em;
  }

  .ssa-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
  }

  .ssa-divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .ssa-divider-text {
    font-size: 11px;
    color: var(--text-light);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ssa-camera-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 14px 20px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-mid);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
  }

  .ssa-camera-btn:hover {
    border-color: var(--pink-mid);
    background: var(--pink-blush);
    color: var(--pink-deep);
  }

  /* ── Preview state ── */
  .ssa-preview-wrap {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    background: #1A0A12;
    aspect-ratio: 1 / 1;
  }

  .ssa-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter 0.5s;
  }

  .ssa-preview-img.analyzing {
    filter: brightness(0.7) saturate(0.6);
  }

  .ssa-preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(26,10,18,0.45);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .ssa-preview-overlay.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .ssa-preview-change {
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 100px;
    padding: 9px 20px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Scanning animation */
  .ssa-scan-ring {
    width: 100px;
    height: 100px;
    border: 2px solid rgba(232,30,140,0.5);
    border-radius: 50%;
    border-top-color: var(--pink-mid);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ssa-scan-label {
    color: white;
    font-size: 13px;
    font-weight: 400;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    letter-spacing: 0.05em;
  }

  /* progress dots */
  .ssa-dots {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .ssa-dots span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    animation: dot-pulse 1.2s ease-in-out infinite;
  }
  .ssa-dots span:nth-child(2) { animation-delay: 0.2s; }
  .ssa-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40%           { opacity: 1;   transform: scale(1.2); }
  }

  /* ── Analyze button ── */
  .ssa-analyze-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--pink-mid) 0%, var(--pink-deep) 100%);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 15px 24px;
    font-size: 14px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    margin-top: 16px;
    letter-spacing: 0.02em;
    transition: opacity 0.2s, transform 0.15s;
  }
  .ssa-analyze-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .ssa-analyze-btn:disabled { opacity: 0.5; cursor: default; transform: none; }

  /* ── Results ── */
  .ssa-results {
    animation: fade-up 0.4s ease both;
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ssa-result-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }

  .ssa-result-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--border);
    flex-shrink: 0;
  }

  .ssa-result-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssa-result-info { flex: 1; }

  .ssa-result-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 4px;
  }

  .ssa-result-skin-type {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 400;
    color: var(--text-dark);
    line-height: 1;
    margin-bottom: 4px;
  }

  .ssa-confidence {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 300;
  }

  .ssa-confidence strong {
    color: var(--pink-deep);
    font-weight: 500;
  }

  .ssa-concerns-title {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-light);
    margin: 0 0 10px;
  }

  .ssa-concerns-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .ssa-concern-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--pink-blush);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-mid);
    transition: background 0.2s, border-color 0.2s;
  }

  .ssa-concern-chip.highlighted {
    background: #FFF0F7;
    border-color: var(--pink-soft);
    color: var(--pink-deep);
  }

  .ssa-tip {
    background: var(--pink-blush);
    border-left: 3px solid var(--pink-mid);
    border-radius: 0 10px 10px 0;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 12.5px;
    color: var(--text-mid);
    font-style: italic;
    line-height: 1.55;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
  }

  .ssa-cta-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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
  .ssa-cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .ssa-retry-btn {
    width: 100%;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 12px;
    font-size: 13px;
    font-weight: 400;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-light);
    cursor: pointer;
    margin-top: 10px;
    transition: border-color 0.2s, color 0.2s;
  }
  .ssa-retry-btn:hover { border-color: var(--pink-soft); color: var(--text-mid); }

  .ssa-error {
    background: #FFF5F5;
    border: 1px solid #FFD0D0;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13px;
    color: #C0392B;
    text-align: center;
    margin-bottom: 12px;
    font-weight: 300;
  }

  /* ── Tips strip ── */
  .ssa-tips-strip {
    display: flex;
    gap: 6px;
    margin-top: 16px;
  }
  .ssa-tip-pill {
    flex: 1;
    background: var(--pink-blush);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 6px;
    text-align: center;
    font-size: 10px;
    color: var(--text-mid);
    line-height: 1.4;
    font-weight: 300;
  }
  .ssa-tip-pill strong {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
  }
`;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function buildSkinPrompt() {
  return `You are an expert dermatologist AI. Analyze this facial selfie and determine the person's skin type and key concerns.

Respond ONLY with a valid JSON object — no explanation, no markdown, no extra text.

Required format:
{
  "skin_type": "<one of: Oily | Dry | Combination | Sensitive | Normal>",
  "concerns": ["<concern1>", "<concern2>"],
  "confidence": <0.0 to 1.0>,
  "tip": "<one personalized sentence of skincare advice based on what you see>"
}

Valid concerns (pick all that apply from this exact list):
Acne, Brightening, Anti-Aging, Pore-Care, Moisturizing, Soothing

Base your analysis on visible cues: skin texture, shine, visible pores, redness, dryness, fine lines, uneven tone, blemishes.
If image quality is too low or face is not clearly visible, still return your best estimate with confidence below 0.5.`;
}

async function callClaudeVision(base64Image) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_ANTHROPIC_API_KEY not configured. Please add it to your .env file.");
  }
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64Image },
          },
          { type: "text", text: buildSkinPrompt() },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw  = data.content?.find(b => b.type === "text")?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function UploadZone({ onFile, onCamera }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  return (
    <>
      <div
        className={`ssa-dropzone${dragOver ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        <div className="ssa-drop-icon">📸</div>
        <p className="ssa-drop-title">Drop your selfie here</p>
        <p className="ssa-drop-sub">JPG, PNG or WEBP — clear face, good lighting</p>
        <button className="ssa-drop-btn" type="button">
          ✦ Choose photo
        </button>
      </div>

      <div className="ssa-divider">
        <div className="ssa-divider-line"/>
        <span className="ssa-divider-text">or</span>
        <div className="ssa-divider-line"/>
      </div>

      <button className="ssa-camera-btn" type="button" onClick={onCamera}>
        <span>📷</span> Take a selfie with camera
      </button>

      <div className="ssa-tips-strip">
        {[["💡","Good lighting"], ["😐","Neutral face"], ["🔍","No filters"]].map(([icon, txt]) => (
          <div key={txt} className="ssa-tip-pill">
            <strong>{icon}</strong>{txt}
          </div>
        ))}
      </div>
    </>
  );
}

function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError("Camera access denied. Please allow camera permission and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) { stop(); onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" })); }
    }, "image/jpeg", 0.92);
  }, [stop, onCapture]);

  // Start camera on mount
  useState(() => { start(); return stop; });
  // clean-up on unmount
  const mounted = useRef(false);
  if (!mounted.current) { mounted.current = true; start(); }

  if (error) return (
    <div>
      <div className="ssa-error">{error}</div>
      <button className="ssa-retry-btn" onClick={onCancel}>← Go back</button>
    </div>
  );

  return (
    <div>
      <div className="ssa-preview-wrap" style={{ background: "#0A0A0A" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
        />
        {!ready && (
          <div className="ssa-preview-overlay visible">
            <div className="ssa-scan-ring"/>
            <span className="ssa-scan-label">Starting camera…</span>
          </div>
        )}
      </div>
      <button className="ssa-analyze-btn" style={{ marginTop: 14 }} onClick={capture} disabled={!ready}>
        📸 Capture &amp; Analyse
      </button>
      <button className="ssa-retry-btn" onClick={() => { stop(); onCancel(); }}>← Back</button>
    </div>
  );
}

function PreviewAnalyze({ file, previewUrl, analyzing, onAnalyze, onRetake }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <div
        className="ssa-preview-wrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={previewUrl}
          alt="Your selfie"
          className={`ssa-preview-img${analyzing ? " analyzing" : ""}`}
        />
        <div className={`ssa-preview-overlay${analyzing || hovered ? " visible" : ""}`}>
          {analyzing ? (
            <>
              <div className="ssa-scan-ring"/>
              <span className="ssa-scan-label">Analysing your skin</span>
              <div className="ssa-dots">
                <span/><span/><span/>
              </div>
            </>
          ) : (
            <button className="ssa-preview-change" onClick={onRetake}>
              ↺ Retake
            </button>
          )}
        </div>
      </div>
      <button
        className="ssa-analyze-btn"
        onClick={onAnalyze}
        disabled={analyzing}
      >
        {analyzing ? "Analysing…" : "✦ Analyse My Skin"}
      </button>
    </div>
  );
}

function Results({ result, previewUrl, onRetry, onViewProducts }) {
  const skinColor = SKIN_TYPE_COLORS[result.skin_type] || SKIN_TYPE_COLORS.Normal;
  const pct = Math.round((result.confidence || 0.85) * 100);

  return (
    <div className="ssa-results">
      <div className="ssa-result-header">
        <div className="ssa-result-avatar">
          <img src={previewUrl} alt="Your skin" />
        </div>
        <div className="ssa-result-info">
          <p className="ssa-result-label">Skin type detected</p>
          <p className="ssa-result-skin-type" style={{ color: skinColor.accent }}>
            {result.skin_type}
          </p>
          <p className="ssa-confidence">
            <strong>{pct}%</strong> confidence
          </p>
        </div>
      </div>

      {result.tip && (
        <div className="ssa-tip">"{result.tip}"</div>
      )}

      <p className="ssa-concerns-title">Detected concerns</p>
      <div className="ssa-concerns-grid">
        {(result.concerns || []).length === 0 ? (
          <span className="ssa-concern-chip highlighted">✓ No major concerns</span>
        ) : (
          result.concerns.map(c => (
            <span key={c} className="ssa-concern-chip highlighted">
              {CONCERN_ICONS[c] || "◆"} {c}
            </span>
          ))
        )}
      </div>

      <button className="ssa-cta-btn" onClick={() => onViewProducts(result)}>
        ✦ View My Personalised Products
      </button>
      <button className="ssa-retry-btn" onClick={onRetry}>↺ Try another photo</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function SkinSelfieAnalyzer({ onAnalysisComplete, budget = "" }) {
  const [stage, setStage]         = useState("upload");   // upload | camera | preview | results
  const [file, setFile]           = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");

  const handleFile = useCallback(f => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
    setStage("preview");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const data   = await callClaudeVision(base64);
      setResult(data);
      setStage("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleViewProducts = useCallback(r => {
    // Pass analysis result up to parent (e.g. your main app / recommendation page)
    if (onAnalysisComplete) {
      onAnalysisComplete({
        skin_type: r.skin_type,
        concerns:  r.concerns,
        budget,
      });
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
              and finds your perfect products instantly.
            </p>
          </div>

          <div className="ssa-body">
            {error && <div className="ssa-error">{error}</div>}

            {stage === "upload" && (
              <UploadZone
                onFile={handleFile}
                onCamera={() => setStage("camera")}
              />
            )}

            {stage === "camera" && (
              <CameraCapture
                onCapture={handleFile}
                onCancel={() => setStage("upload")}
              />
            )}

            {stage === "preview" && (
              <PreviewAnalyze
                file={file}
                previewUrl={previewUrl}
                analyzing={analyzing}
                onAnalyze={handleAnalyze}
                onRetake={handleReset}
              />
            )}

            {stage === "results" && result && (
              <Results
                result={result}
                previewUrl={previewUrl}
                onRetry={handleReset}
                onViewProducts={handleViewProducts}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Usage example
// ─────────────────────────────────────────────────────────────
//
// import SkinSelfieAnalyzer from "./SkinSelfieAnalyzer";
//
// function App() {
//   const handleResult = ({ skin_type, concerns, budget }) => {
//     // These map directly into get_filtered_recommendations()
//     console.log("Skin type:", skin_type);   // e.g. "Oily"
//     console.log("Concerns:",  concerns);    // e.g. ["Acne", "Brightening"]
//     // Now call your /api/report endpoint or navigate to the products page
//   };
//
//   return (
//     <SkinSelfieAnalyzer
//       onAnalysisComplete={handleResult}
//       budget="Under Rs 100"
//     />
//   );
// }