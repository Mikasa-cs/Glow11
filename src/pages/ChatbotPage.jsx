// src/pages/ChatbotPage.jsx
import SkinReportGenerator from "../components/SkinReportGenerator";
import { useState, useEffect, useRef } from "react";
import { C } from "../theme/colors";
import { Card, SectionTitle } from "../components/Shared";

const API_URL  = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY  = import.meta.env.VITE_GROQ_API_KEY || "gREMOVED";
const AI_MODEL = "llama-3.3-70b-versatile";

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the GlowIQ Dashboard AI Assistant. You ONLY answer questions about the GlowIQ skincare analytics dashboard data below. Do NOT provide general skincare advice, brand recommendations beyond what's in the data, or any information outside this dashboard.

DASHBOARD DATA SUMMARY:
- Total Products: 1,224 | Brands: 187 | Types: 5 (Serum 307, Toner 255, Moisturizer 248, Sunscreen 212, Face Wash 202)
- Avg Price: Rs226,183 | Price Range: Rs9,000 to Rs2,850,000

GENDER SEGMENT:
- Female: 747 products (61%), Unisex: 388 (32%), Male: 89 (7%)
- Male skincare has 92% market gap — biggest underserved segment

REVIEW ANALYSIS:
- Market avg rating: 4.3/5 | 84% positive sentiment | 74,800 total reviews
- Best rated: INNISFREE (4.5, 91% sentiment) | Most reviewed: WARDAH (18,900 reviews, 86%)
- Best sentiment by effect: Moisturizing (85% positive), Soothing (83%)
- Weakest: Acne-Free (69% positive) — most complaints

CUSTOMER JOURNEY:
- 10,000 start Awareness → 7,200 Discovery (-28%) → 4,800 Consideration (-33%) → 2,900 Intent (-40%) → 1,800 Purchase (-38%) → 1,100 Loyalty (-39%)
- Biggest drop: Intent stage (40%) — price hesitation
- Female segment dominates all stages, Male drops off fastest

REVENUE SIMULATOR:
- Base revenue: Rs276.5M | Highest: Serum (Rs89.2M, +12% growth)
- Sunscreen fastest growing (+22% projected)
- Q4 (Nov-Dec) projected highest: Rs38-42M/month

OPPORTUNITY FINDER:
- Top gaps: Male Skincare (92% gap, Rs45M potential), K-Beauty Premium (82%), Eco/Natural (87%), Luxury+Oily (78%), Sensitive+Moisturizer (71%)
- Easiest wins: Budget Serum & Sensitive+Moisturizer & Combination Toner (Low difficulty + High priority)

TOP BRANDS: SOMETHINC (82 products, Rs118K avg), WARDAH (70, Rs51K), INNISFREE (49, Rs299K), AVOSKIN (41, Rs154K), ERHA (41, Rs118K)

SKIN TYPES: Oily (839 products most covered), Dry (730), Normal (538), Sensitive (500), Combination (441)
TOP EFFECTS: Brightening (507), Anti-Aging (490), Pore-Care (379), Moisturizing (307), Acne-Free (242)

Keep answers concise (2-4 sentences), data-driven, and reference specific numbers. If asked something outside this dashboard, say: "I can only answer questions about the GlowIQ dashboard data."`;

// ── Quick suggestion chips ───────────────────────────────────────────────────
const SUGGESTIONS = [
  "What is the biggest market opportunity?",
  "Which brand has the best reviews?",
  "Where is the biggest funnel drop-off?",
  "What does the gender analysis show?",
];

// ── Key status helper ────────────────────────────────────────────────────────
function getKeyStatus() {
  if (!API_KEY)                              return "missing";
  if (API_KEY === "your_groq_api_key_here") return "placeholder";
  return "ok";
}

// ── Setup banner ─────────────────────────────────────────────────────────────
function SetupBanner() {
  const [copied, setCopied] = useState(false);

  const copyLine = () => {
    navigator.clipboard?.writeText("VITE_GROQ_API_KEY=your_key_here").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      background: "#1e1510",
      border: `1px solid ${C.danger}`,
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: 14,
      fontSize: "0.82rem",
      lineHeight: 1.7,
    }}>
      <div style={{ color: C.danger, fontWeight: 700, marginBottom: 8, fontSize: "0.87rem" }}>
        ⚠️ Groq API key not set — chatbot is disabled
      </div>
      <div style={{ color: C.muted }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Step 1</span>
          {" — Get a free key at "}
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
            style={{ color: C.accent2, textDecoration: "underline" }}>
            console.groq.com
          </a>
          {" → API Keys → Create key"}
        </div>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Step 2</span>
          {" — Add it to "}
          <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: "0.78rem" }}>
            glowiq/.env
          </code>
          :
        </div>
        <div style={{
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem",
          color: "#86efac", display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 8,
        }}>
          <span>VITE_GROQ_API_KEY=<em style={{ color: C.muted }}>your_key_here</em></span>
          <button onClick={copyLine} style={{
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 6, padding: "2px 10px",
            cursor: "pointer", fontSize: "0.72rem", transition: "color 0.15s",
          }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div style={{ color: C.muted }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Step 3</span>
          {" — Restart the dev server: "}
          <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: "0.78rem" }}>
            npm run dev
          </code>
          {" (Vite only reads .env at startup)"}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const keyStatus = getKeyStatus();
  const keyOk     = keyStatus === "ok";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your GlowIQ AI analyst. Ask me anything about this dashboard — gender segments, review scores, revenue projections, opportunity gaps, or customer journey insights.",
    },
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading || !keyOk) return;

    setApiError("");
    const userMsg    = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model:      AI_MODEL,
          max_tokens: 512,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newHistory.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`);

      const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that.";
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      setApiError(`❌ ${e.message}`);
      setMessages([...newHistory, { role: "assistant", content: `❌ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <SectionTitle
        icon="🤖"
        title="AI Dashboard Assistant"
        sub="Ask questions about the GlowIQ analytics data · Powered by Groq llama-3.3-70b"
      />

      <Card style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {!keyOk && <SetupBanner />}

        {apiError && keyOk && (
          <div style={{
            background: "#3b1c1c", border: `1px solid ${C.danger}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 12,
            color: C.danger, fontSize: "0.83rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>{apiError}</span>
            <button onClick={() => setApiError("")} style={{
              background: "transparent", border: "none",
              color: C.danger, cursor: "pointer", fontSize: "1rem", lineHeight: 1,
            }}>✕</button>
          </div>
        )}

        {/* ── Message list ── */}
        <div style={{
          flex: 1, overflowY: "auto", display: "flex",
          flexDirection: "column", gap: 12, marginBottom: 12,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 40px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40px)",
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.role === "user" ? C.accent2 + "33" : C.bg2,
                border: `1px solid ${m.role === "user" ? C.accent2 + "55" : C.border}`,
                color: C.text, fontSize: "0.87rem", lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {m.role === "assistant" && (
                  <div style={{ color: C.accent2, fontSize: "0.72rem", marginBottom: 4, fontWeight: 700 }}>
                    🤖 GlowIQ AI
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: "14px 14px 14px 4px", padding: "10px 16px",
                color: C.muted, fontSize: "0.85rem",
              }}>
                <div style={{ color: C.accent2, fontSize: "0.72rem", marginBottom: 6, fontWeight: 700 }}>
                  🤖 GlowIQ AI
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 0.2, 0.4].map((delay, idx) => (
                    <div key={idx} style={{
                      width: 7, height: 7, borderRadius: "50%", background: C.muted,
                      animation: "dotBounce 1.2s infinite", animationDelay: `${delay}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick suggestion chips ── */}
        {messages.length <= 1 && keyOk && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: 8 }}>
              Quick questions:
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)} style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.bg2,
                  color: C.muted, cursor: "pointer", fontSize: "0.78rem",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                  onMouseEnter={e => { e.target.style.borderColor = C.accent2; e.target.style.color = C.text; }}
                  onMouseLeave={e => { e.target.style.borderColor = C.border;  e.target.style.color = C.muted; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input row ── */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={keyOk ? "Ask about the dashboard insights…" : "Add your Groq API key to enable the chatbot"}
            disabled={!keyOk}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.bg2,
              color: keyOk ? C.text : C.muted, fontSize: "0.87rem",
              outline: "none", cursor: keyOk ? "text" : "not-allowed",
              opacity: keyOk ? 1 : 0.6,
            }}
          />
          <button onClick={send} disabled={loading || !input.trim() || !keyOk} style={{
            padding: "10px 20px", borderRadius: 10,
            background: (loading || !input.trim() || !keyOk) ? C.border : C.accent2,
            color:      (loading || !input.trim() || !keyOk) ? C.muted  : C.bg,
            fontWeight: 700, border: "none",
            cursor: (loading || !input.trim() || !keyOk) ? "not-allowed" : "pointer",
            fontSize: "0.87rem", transition: "all 0.15s",
          }}>
            {loading ? "…" : "Send"}
          </button>
        </div>

        {input.length > 200 && (
          <div style={{ textAlign: "right", color: input.length > 450 ? C.danger : C.muted, fontSize: "0.72rem", marginTop: 4 }}>
            {input.length} / 512
          </div>
        )}

      </Card>

      {/* Dot bounce animation */}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1;   }
        }
      `}</style>

      {/* ── Floating skin report generator ── */}
      <SkinReportGenerator
        chatHistory={messages}
      />
    </div>
  );
}