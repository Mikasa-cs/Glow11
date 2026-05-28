// src/pages/OpportunityPage.jsx
import { useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C, fmtM } from "../theme/colors";
import { Card, SectionTitle, StatCard, Badge } from "../components/Shared";

export default function OpportunityPage() {
  const [sortBy, setSortBy] = useState("potential");

  const sorted = [...DATA.opportunities].sort((a, b) => {
    if (sortBy === "potential")   return b.potential - a.potential;
    if (sortBy === "gap")         return b.gap - a.gap;
    return a.difficulty.localeCompare(b.difficulty);
  });

  return (
    <div>
      <SectionTitle icon="🎯" title="Opportunity Finder Analysis" sub="Underserved market segments with high revenue potential — sorted by priority" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard icon="🚀" value="8"             label="Opportunities Found"  color={C.accent2} />
        <StatCard icon="💎" value="Rs269"       label="Total Potential"      color={C.accent4} />
        <StatCard icon="⚡" value="4 High"        label="High Priority Items"  color={C.warning} />
        <StatCard icon="🎯" value="Male Skincare" label="Biggest Gap (92%)"    color={C.accent}  />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: C.text }}>Market Gap Matrix</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["potential", "gap", "difficulty"].map((s) => (
              <button
                key={s} onClick={() => setSortBy(s)}
                style={{
                  padding: "4px 12px", borderRadius: 8,
                  border: `1px solid ${sortBy === s ? C.accent2 : C.border}`,
                  background: sortBy === s ? C.accent2 + "22" : "none",
                  color: sortBy === s ? C.accent2 : C.muted,
                  cursor: "pointer", fontSize: "0.75rem", textTransform: "capitalize",
                }}
              >
                Sort: {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((opp, i) => (
            <div
              key={i}
              style={{
                background: C.bg2, borderRadius: 10, padding: "1rem 1.25rem",
                border: `1px solid ${opp.priority === "High" ? C.accent2 + "55" : C.border}`,
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                alignItems: "center", gap: 12,
              }}
            >
              <div>
                <div style={{ color: C.text, fontWeight: 600, marginBottom: 2 }}>{opp.segment}</div>
                <div style={{ color: C.muted, fontSize: "0.72rem" }}>Market opportunity segment</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: "0.7rem", marginBottom: 3 }}>Market Gap</div>
                <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${opp.gap}%`, background: opp.gap > 80 ? C.accent2 : opp.gap > 60 ? C.warning : C.accent4, borderRadius: 4, height: 6 }} />
                </div>
                <div style={{ color: C.text, fontSize: "0.8rem", marginTop: 2, fontWeight: 600 }}>{opp.gap}%</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: "0.7rem" }}>Potential</div>
                <div style={{ color: C.accent4, fontWeight: 700 }}>{fmtM(opp.potential)}</div>
              </div>
              <Badge text={opp.difficulty} />
              <Badge text={opp.priority} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ color: C.text, marginBottom: 4 }}>Opportunity Scatter Plot</h3>
        <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Gap size vs Revenue potential</p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="gap"       name="Market Gap %"      tick={{ fill: C.muted, fontSize: 11 }} label={{ value: "Market Gap %", position: "insideBottom", fill: C.muted, fontSize: 11 }} />
            <YAxis dataKey="potential" name="Revenue Potential"  tickFormatter={(v) => `${v / 1000000}M`} tick={{ fill: C.muted, fontSize: 11 }} />
            <ZAxis range={[60, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                    <p style={{ color: C.text, fontWeight: 700, marginBottom: 4 }}>{d.segment}</p>
                    <p style={{ color: C.muted }}>Gap: {d.gap}%</p>
                    <p style={{ color: C.accent4 }}>Potential: {fmtM(d.potential)}</p>
                  </div>
                );
              }}
            />
            <Scatter data={DATA.opportunities} fill={C.accent2} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
