// src/pages/JourneyPage.jsx
import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
import { Card, SectionTitle, TT } from "../components/Shared";

const STAGE_DETAILS = {
  Awareness: {
    desc: "Users discover GlowIQ products via social media, ads & word-of-mouth.",
    actions: ["Instagram ads", "Influencer posts", "Google search"],
    tips: "Focus on visual content for female segment (61% of audience).",
  },
  Discovery: {
    desc: "28% drop-off here — users browse but don't engage deeply.",
    actions: ["Category browsing", "Filter by skin type", "Compare brands"],
    tips: "Improve Unisex product visibility — 32% of market underserved.",
  },
  Consideration: {
    desc: "33% drop at consideration — price & effects are key barriers.",
    actions: ["Read reviews", "Check ingredients", "Compare prices"],
    tips: "Highlight Mid-Range products (45% of catalogue) more prominently.",
  },
  Intent: {
    desc: "40% drop-off — significant hesitation before purchase.",
    actions: ["Add to cart", "Check delivery", "Look for promos"],
    tips: "Budget tier (426 products) converts fastest — promote Rp 50-100K range.",
  },
  Purchase: {
    desc: "38% drop — final conversion barrier.",
    actions: ["Complete checkout", "Choose payment", "Confirm order"],
    tips: "WARDAH (Rp 51K avg) & AZARINE (Rp 53K avg) drive budget conversions.",
  },
  Loyalty: {
    desc: "39% churn post-purchase. Retention is the key growth lever.",
    actions: ["Repurchase", "Leave review", "Refer friends"],
    tips: "INNISFREE 91% positive sentiment — highest loyalty potential.",
  },
};

export default function JourneyPage() {
  const [activeStage, setActiveStage] = useState(null);

  return (
    <div>
      <SectionTitle icon="🗺️" title="Live Customer Journey Map" sub="Track user flow from awareness to loyalty — click any stage for deep insights" />

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: C.text, marginBottom: 16 }}>Funnel Drop-off Analysis</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 200, marginBottom: 12 }}>
          {DATA.journeyStages.map((s, i) => {
            const h = (s.users / 10000) * 160;
            const isActive = activeStage === s.stage;
            return (
              <div
                key={i}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
                onClick={() => setActiveStage(isActive ? null : s.stage)}
              >
                <div style={{ fontSize: "0.72rem", color: C.muted, marginBottom: 6 }}>{s.users.toLocaleString()}</div>
                <div style={{
                  width: "100%", height: h,
                  background: isActive ? C.accent2 : COLORS[i % COLORS.length],
                  borderRadius: "6px 6px 0 0",
                  opacity: activeStage && !isActive ? 0.4 : 1,
                  transition: "all 0.2s",
                  border: isActive ? `2px solid ${C.text}` : "none",
                }} />
                <div style={{ fontSize: "0.7rem", color: isActive ? C.text : C.muted, marginTop: 8, textAlign: "center", fontWeight: isActive ? 700 : 400 }}>{s.stage}</div>
                {i > 0 && <div style={{ fontSize: "0.65rem", color: C.danger }}>-{s.dropoff}%</div>}
              </div>
            );
          })}
        </div>

        {activeStage && STAGE_DETAILS[activeStage] && (
          <div style={{ background: C.bg2, borderRadius: 10, padding: "1rem 1.25rem", border: `1px solid ${C.accent2}`, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ color: C.accent2, marginBottom: 4 }}>{activeStage} Stage Insights</h4>
                <p style={{ color: C.muted, fontSize: "0.82rem", marginBottom: 8 }}>{STAGE_DETAILS[activeStage].desc}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {STAGE_DETAILS[activeStage].actions.map((a) => (
                    <span key={a} style={{ background: C.card, color: C.text, padding: "3px 10px", borderRadius: 8, fontSize: "0.75rem", border: `1px solid ${C.border}` }}>{a}</span>
                  ))}
                </div>
                <p style={{ color: C.accent4, fontSize: "0.8rem" }}>💡 {STAGE_DETAILS[activeStage].tips}</p>
              </div>
              <button onClick={() => setActiveStage(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ color: C.text, marginBottom: 4 }}>Journey by Gender Segment</h3>
        <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>How each gender group navigates the purchase journey</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={DATA.journeyByGender}>
            <defs>
              {[["f", C.accent], ["m", C.accent3], ["u", C.accent2]].map(([id, col]) => (
                <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={col} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={col} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="stage" tick={{ fill: C.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
            <Area type="monotone" dataKey="Female" stroke={C.accent}  fill="url(#grad-f)" strokeWidth={2} />
            <Area type="monotone" dataKey="Unisex" stroke={C.accent2} fill="url(#grad-u)" strokeWidth={2} />
            <Area type="monotone" dataKey="Male"   stroke={C.accent3} fill="url(#grad-m)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
