// src/pages/PricingPage.jsx
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
import { Card, SectionTitle, StatCard, TT } from "../components/Shared";

const TIER_ICONS = ["🟢", "🔵", "🟣", "👑"];

export default function PricingPage() {
  return (
    <div>
      <SectionTitle icon="💰" title="Pricing Analysis" sub="Price tier distribution and market positioning" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {DATA.priceTiers.map((t, i) => (
          <StatCard
            key={t.name}
            icon={TIER_ICONS[i]}
            value={`${t.pct}%`}
            label={`${t.name.split(" ")[0]} — ${t.value} products`}
            color={COLORS[i]}
          />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Price Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={DATA.priceTiers} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}
                label={({ pct }) => `${pct}%`} labelLine={false}
              >
                {DATA.priceTiers.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Tier Volume Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DATA.priceTiers}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {DATA.priceTiers.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
