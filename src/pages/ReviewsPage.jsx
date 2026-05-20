// src/pages/ReviewsPage.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
} from "recharts";
import { DATA } from "../data/dashboardData";
import { C } from "../theme/colors";
import { Card, SectionTitle, StatCard, TT } from "../components/Shared";

export default function ReviewsPage() {
  return (
    <div>
      <SectionTitle icon="⭐" title="Review Analysis" sub="Sentiment scores, brand ratings & effect-level customer feedback" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard icon="⭐" value="4.3"        label="Avg Market Rating"    color={C.warning} />
        <StatCard icon="😊" value="84%"        label="Positive Sentiment"   color={C.accent4} />
        <StatCard icon="💬" value="74.8K"      label="Total Reviews"        color={C.accent2} />
        <StatCard icon="🏆" value="INNISFREE"  label="Highest Rated Brand"  color={C.accent}  />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Brand Ratings Comparison</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Rating out of 5.0 by brand</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.reviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="brand" tick={{ fill: C.muted, fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[3.8, 4.8]} tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT formatter={(v) => v.toFixed(1)} />} />
              <Bar dataKey="rating" fill={C.warning} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, marginBottom: 4 }}>Sentiment by Effect</h3>
          <p style={{ color: C.muted, fontSize: "0.78rem", marginBottom: 12 }}>Positive / neutral / negative split</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.sentimentByEffect}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="effect" tick={{ fill: C.muted, fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<TT formatter={(v) => `${v}%`} />} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Bar dataKey="positive" stackId="s" fill={C.accent4} />
              <Bar dataKey="neutral"  stackId="s" fill={C.muted}   />
              <Bar dataKey="negative" stackId="s" fill={C.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 style={{ color: C.text, marginBottom: 16 }}>Brand Review Deep Dive</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Brand", "Rating", "Reviews", "Sentiment", "Sentiment Bar"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA.reviewData.map((b, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600 }}>{b.brand}</td>
                  <td style={{ padding: "10px 12px", color: C.warning }}>{"★".repeat(Math.round(b.rating))} {b.rating.toFixed(1)}</td>
                  <td style={{ padding: "10px 12px", color: C.muted }}>{b.reviews.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: b.sentiment >= 85 ? C.accent4 : b.sentiment >= 80 ? C.warning : C.danger }}>{b.sentiment}%</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ background: C.border, borderRadius: 4, height: 8, width: 140 }}>
                      <div style={{ width: `${b.sentiment}%`, background: b.sentiment >= 85 ? C.accent4 : C.warning, borderRadius: 4, height: 8 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
