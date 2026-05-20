// src/pages/RevenuePage.jsx
import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
  LineChart, Line,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, fmtM } from "../theme/colors";
import { Card, SectionTitle, StatCard, TT } from "../components/Shared";

export default function RevenuePage() {
  const [growthRate, setGrowthRate] = useState(12);
  const [focusType, setFocusType] = useState("All");

  const base = DATA.revenueSimulator.baseRevenue;
  const simulated = Math.round(base * (1 + growthRate / 100));
  const typeData = DATA.revenueSimulator.byType.map((t) => ({
    ...t,
    simulated: Math.round(t.revenue * (1 + (focusType === t.type ? growthRate * 1.5 : growthRate) / 100)),
  }));

  return (
    <div>
      <SectionTitle icon="💹" title="Future Revenue Simulator" sub="Adjust growth levers to project revenue outcomes across product categories" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard icon="💰" value={fmtM(base)}           label="Current Base Revenue"       color={C.accent3} />
        <StatCard icon="📈" value={fmtM(simulated)}      label={`Projected at +${growthRate}%`} color={C.accent4} />
        <StatCard icon="🎯" value={fmtM(simulated - base)} label="Revenue Delta"             color={C.warning} />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: C.text, marginBottom: 16 }}>Simulation Controls</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <label style={{ color: C.muted, fontSize: "0.8rem", display: "block", marginBottom: 8 }}>
              Market Growth Rate: <strong style={{ color: C.accent4 }}>+{growthRate}%</strong>
            </label>
            <input
              type="range" min={1} max={50} value={growthRate} step={1}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.accent4 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: C.muted }}>
              <span>Conservative (1%)</span><span>Aggressive (50%)</span>
            </div>
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Focus Category (1.5× boost):</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...DATA.revenueSimulator.byType.map((t) => t.type)].map((t) => (
                <button
                  key={t} onClick={() => setFocusType(t)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: `1px solid ${focusType === t ? C.accent2 : C.border}`,
                    background: focusType === t ? C.accent2 + "22" : "none",
                    color: focusType === t ? C.accent2 : C.muted,
                    cursor: "pointer", fontSize: "0.78rem",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Revenue by Category</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Current vs Projected</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="type" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT formatter={fmtM} />} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Bar dataKey="revenue"   name="Current"   fill={C.accent3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="simulated" name="Projected"  fill={C.accent4} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Monthly Revenue Trend</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Actual vs Projected 2024</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={DATA.revenueSimulator.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT formatter={fmtM} />} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Line type="monotone" dataKey="actual"    name="Actual"    stroke={C.accent}  strokeWidth={2} dot={{ fill: C.accent, r: 4 }} connectNulls={false} />
              <Line type="monotone" dataKey="projected" name="Projected" stroke={C.accent4} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
