// src/pages/BrandsPage.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, COLORS, fmtRp } from "../theme/colors";
import { Card, SectionTitle, TT } from "../components/Shared";

export default function BrandsPage() {
  return (
    <div>
      <SectionTitle icon="🏷️" title="Brand Intelligence" sub="Market share, pricing and competitive radar" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Top Brands by Product Count</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DATA.brands} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: C.muted, fontSize: 11 }} width={100} />
              <Tooltip content={<TT />} />
              <Bar dataKey="count" fill={C.accent2} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Brand Competitive Radar</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 8 }}>Top 3 brands across 6 dimensions</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={DATA.radarBrands}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 11 }} />
              <Radar name="SOMETHINC" dataKey="SOMETHINC" stroke={C.accent}  fill={C.accent}  fillOpacity={0.2} />
              <Radar name="WARDAH"    dataKey="WARDAH"    stroke={C.accent4} fill={C.accent4} fillOpacity={0.2} />
              <Radar name="INNISFREE" dataKey="INNISFREE" stroke={C.accent2} fill={C.accent2} fillOpacity={0.2} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Tooltip content={<TT />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 style={{ color: C.text, marginBottom: 16 }}>Brand Avg Price vs Product Count</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {DATA.brands.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px 80px", gap: 12, alignItems: "center" }}>
              <span style={{ color: C.text, fontSize: "0.82rem", fontWeight: 600 }}>{b.name}</span>
              <div style={{ background: C.border, borderRadius: 4, height: 8 }}>
                <div style={{ width: `${(b.count / 82) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 4, height: 8 }} />
              </div>
              <span style={{ color: C.muted,   fontSize: "0.78rem" }}>{b.count} products</span>
              <span style={{ color: C.accent4, fontSize: "0.78rem" }}>{fmtRp(b.avgPrice)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
