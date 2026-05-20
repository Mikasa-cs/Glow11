// src/pages/CataloguePage.jsx
import { useState } from "react";
import { ALL_PRODUCTS } from "../data/products";
import { C } from "../theme/colors";
import { SectionTitle, Badge } from "../components/Shared";

const TYPES = ["All", "Serum", "Toner", "Moisturizer", "Sunscreen", "Face Wash"];
const TIERS = ["All", "Budget", "Mid-Range", "Premium", "Luxury"];
const PER_PAGE = 20;

export default function CataloguePage() {
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [page, setPage]           = useState(1);

  const filtered = ALL_PRODUCTS.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.effects.toLowerCase().includes(q);
    const matchType   = typeFilter === "All" || p.type === typeFilter;
    const matchTier   = tierFilter === "All" || p.tier === tierFilter;
    return matchSearch && matchType && matchTier;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const resetPage  = () => setPage(1);

  const FilterBtn = ({ label, active, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 8,
        border: `1px solid ${active ? color : C.border}`,
        background: active ? color + "22" : "none",
        color: active ? color : C.muted,
        cursor: "pointer", fontSize: "0.78rem",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <SectionTitle icon="🛍️" title="Product Catalogue" sub={`Browse all ${ALL_PRODUCTS.length.toLocaleString()} real skincare products`} />

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          placeholder="Search by name, brand or effect..."
          style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2 + "cc", color: C.text, fontSize: "0.85rem", outline: "none" }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: C.muted, fontSize: "0.78rem" }}>Type:</span>
        {TYPES.map((t) => (
          <FilterBtn key={t} label={t} active={typeFilter === t} color={C.accent2} onClick={() => { setTypeFilter(t); resetPage(); }} />
        ))}
        <span style={{ color: C.muted, fontSize: "0.78rem", marginLeft: 8 }}>Tier:</span>
        {TIERS.map((t) => (
          <FilterBtn key={t} label={t} active={tierFilter === t} color={C.warning} onClick={() => { setTierFilter(t); resetPage(); }} />
        ))}
      </div>

      {/* Pagination info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: C.muted, fontSize: "0.8rem" }}>
          {filtered.length.toLocaleString()} products found · Page {page} of {totalPages || 1}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: page === 1 ? C.border : C.muted, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.78rem" }}
          >← Prev</button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: page === totalPages ? C.border : C.muted, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "0.78rem" }}
          >Next →</button>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {paginated.map((p, i) => (
          <div key={i} style={{ background: "#201e30", border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ color: C.muted, fontSize: "0.72rem", marginBottom: 2 }}>{p.brand}</div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.3 }}>{p.name}</div>
              </div>
              <span style={{ background: C.bg2, color: C.accent4, padding: "3px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>{p.price}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <Badge text={p.type} />
              <Badge text={p.tier} />
            </div>
            <div style={{ color: C.muted, fontSize: "0.73rem", marginTop: 6 }}>
              <span style={{ color: C.accent3 }}>Skin: </span>{p.skin || "All"}
            </div>
            <div style={{ color: C.muted, fontSize: "0.73rem", marginTop: 3 }}>
              <span style={{ color: C.accent }}>Effects: </span>{p.effects || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Page numbers */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const pg = totalPages <= 10 ? i + 1 : Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
            if (pg > totalPages) return null;
            return (
              <button
                key={pg} onClick={() => setPage(pg)}
                style={{
                  padding: "5px 10px", borderRadius: 6, minWidth: 34,
                  border: `1px solid ${pg === page ? C.accent2 : C.border}`,
                  background: pg === page ? C.accent2 + "22" : "none",
                  color: pg === page ? C.accent2 : C.muted,
                  cursor: "pointer", fontSize: "0.78rem",
                }}
              >{pg}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
