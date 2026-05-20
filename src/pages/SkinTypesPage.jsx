// src/pages/SkinTypesPage.jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
import { Card, SectionTitle, TT } from "../components/Shared";

const SKIN_ICONS = ["🫙", "🌊", "🌿", "🌸", "🔀"];

export default function SkinTypesPage() {
  return (
    <div>
      <SectionTitle icon="🌿" title="Skin Type Coverage" sub="How the catalogue serves different skin types" />

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: C.text, marginBottom: 4 }}>Products per Skin Type</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={DATA.skinTypes}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 12 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
            <Tooltip content={<TT />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {DATA.skinTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {DATA.skinTypes.map((s, i) => (
          <div key={i} style={{ background: C.bg2, borderRadius: 12, padding: "1rem", textAlign: "center", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{SKIN_ICONS[i]}</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>{s.value}</div>
            <div style={{ color: COLORS[i], fontWeight: 600, fontSize: "0.82rem" }}>{s.name}</div>
            <div style={{ color: C.muted, fontSize: "0.72rem", marginTop: 4 }}>{((s.value / 3048) * 100).toFixed(0)}% coverage</div>
          </div>
        ))}
      </div>
    </div>
  );
}
