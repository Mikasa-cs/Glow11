// src/pages/EffectsPage.jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
import { Card, SectionTitle, TT } from "../components/Shared";

const EFFECT_ICONS = ["💡", "⏳", "🔬", "💧", "🌿", "🧘", "🌞", "💦", "🫧", "🎯"];

export default function EffectsPage() {
  return (
    <div>
      <SectionTitle icon="✨" title="Effects Analysis" sub="Most demanded product effects across the catalogue" />

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: C.text, marginBottom: 4 }}>Effect Frequency Ranking</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={DATA.effects}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
            <Tooltip content={<TT />} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {DATA.effects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {DATA.effects.slice(0, 6).map((e, i) => (
          <div key={i} style={{ background: C.bg2, borderRadius: 10, padding: "0.9rem 1.1rem", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: COLORS[i % COLORS.length] + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: COLORS[i % COLORS.length],
            }}>
              {EFFECT_ICONS[i]}
            </div>
            <div>
              <div style={{ color: C.text, fontWeight: 600 }}>{e.name}</div>
              <div style={{ color: C.muted, fontSize: "0.78rem" }}>{e.value} products</div>
            </div>
            <div style={{ marginLeft: "auto", color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: "1.1rem" }}>
              {((e.value / 1224) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
