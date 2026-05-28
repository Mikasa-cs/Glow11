// src/pages/OverviewPage.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS } from "../theme/colors";
const fmtRp = (n) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
import { Card, SectionTitle, StatCard, TT } from "../components/Shared";

export default function OverviewPage() {
  const d = DATA.overview;
  return (
    <div>
      <SectionTitle icon="📊" title="Overview Dashboard" sub="Complete analytics snapshot of the Indonesian skincare market" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard icon="🧴" value={d.totalProducts.toLocaleString()} label="Total Products" color={C.accent} />
        <StatCard icon="🏷️" value={d.totalBrands}  label="Unique Brands"  color={C.accent2} />
        <StatCard icon="📦" value={d.totalTypes}   label="Product Types"  color={C.accent3} />
        <StatCard icon="💰" value={fmtRp(d.avgPrice)}   label="Avg Price"      color={C.accent4} />
        <StatCard icon="📈" value={fmtRp(d.maxPrice)}   label="Highest Price"  color={C.warning} />
        <StatCard icon="📉" value={fmtRp(d.minPrice)}   label="Lowest Price"   color={C.danger}  />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Product Type Distribution</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Share by category</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={DATA.productTypes} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {DATA.productTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Top Effects Demand</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Most requested product effects</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DATA.effects.slice(0, 7)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: C.muted, fontSize: 11 }} width={90} />
              <Tooltip content={<TT />} />
              <Bar dataKey="value" fill={C.accent2} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
