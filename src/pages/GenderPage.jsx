// src/pages/GenderPage.jsx
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
import { Card, SectionTitle, StatCard, TT } from "../components/Shared";

export default function GenderPage() {
  return (
    <div>
      <SectionTitle icon="👥" title="Gender Segment Analysis" sub="Audience breakdown across product types, skin concerns & price tiers" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {DATA.genderSegment.map((g, i) => (
          <StatCard
            key={g.name}
            icon={g.name === "Female" ? "👩" : g.name === "Male" ? "👨" : "🧑"}
            value={`${g.pct}%`}
            label={`${g.name} — ${g.value} products`}
            color={COLORS[i]}
          />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Gender Split Overview</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Market composition by target gender</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={DATA.genderSegment} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}
                label={({ name, pct }) => `${name} ${pct}%`} labelLine={false}
              >
                {DATA.genderSegment.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Gender by Product Type</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Stacked distribution per category</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.genderByType}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="type" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Bar dataKey="Female" stackId="a" fill={C.accent} />
              <Bar dataKey="Unisex" stackId="a" fill={C.accent2} />
              <Bar dataKey="Male"   stackId="a" fill={C.accent3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 style={{ color: C.text, marginBottom: 4 }}>Gender × Price Tier Penetration</h3>
        <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 16 }}>How gender segments span across price tiers</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {DATA.priceTiers.map((tier, i) => {
            const femPct = tier.name.includes("Luxury") ? 55 : tier.name.includes("Premium") ? 65 : tier.name.includes("Mid") ? 62 : 58;
            const malePct = tier.name.includes("Luxury") ? 12 : tier.name.includes("Mid") ? 7 : 8;
            const uniPct = 100 - femPct - malePct;
            return (
              <div key={i} style={{ background: C.bg2, borderRadius: 10, padding: "1rem", border: `1px solid ${C.border}` }}>
                <div style={{ color: C.muted, fontSize: "0.72rem", marginBottom: 6 }}>{tier.name.split(" ")[0]}</div>
                <div style={{ color: C.text, fontSize: "1rem", fontWeight: 700, marginBottom: 10 }}>{tier.value} products</div>
                {[["Female", femPct, C.accent], ["Unisex", uniPct, C.accent2], ["Male", malePct, C.accent3]].map(([label, pct, color]) => (
                  <div key={label} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: C.muted, marginBottom: 2 }}>
                      <span>{label}</span><span>{pct}%</span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 4, height: 5 }}>
                      <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
