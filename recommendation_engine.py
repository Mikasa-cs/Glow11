"""
Skincare Recommendation Engine — Python Backend
================================================
Fixes applied:
  #1  Semantic concern matching (sentence-transformers) with keyword fallback
  #2  Click history wired into scoring (log-scaled boost)
  #3  low_sell_probability refreshed from real orders table when available
  #5  Brand/type diversity cap on final results
  #6  Budget filter: graceful fallback instead of silent empty result
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import sqlite3
import os
import warnings
warnings.filterwarnings("ignore")

# ── Semantic model (optional — falls back to keywords if unavailable) ─────────

_sem_model = None
_product_embeddings = None   # np array (n_products, 384), indexed same as df
_embed_product_ids  = None   # list of product_ids matching rows in _product_embeddings

def _load_sem_model():
    global _sem_model
    if _sem_model is not None:
        return _sem_model
    try:
        from sentence_transformers import SentenceTransformer
        _sem_model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        _sem_model = None
    return _sem_model

def build_embeddings(df: pd.DataFrame):
    """Call once after load_data(). Silently skips if model unavailable."""
    global _product_embeddings, _embed_product_ids
    model = _load_sem_model()
    if model is None:
        return
    texts = (df["notable_effects"].fillna("") + " " +
             df["description"].fillna("")).tolist()
    _product_embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    _embed_product_ids  = df["product_id"].tolist()

def _semantic_scores(df: pd.DataFrame, concern: str) -> pd.Series:
    """Returns a Series (indexed like df) with cosine-similarity scores * 3."""
    model = _load_sem_model()
    if model is None or _product_embeddings is None:
        return pd.Series(0.0, index=df.index)
    q = model.encode([concern], normalize_embeddings=True)[0]
    # Map df rows → embedding rows via product_id
    pid_to_idx = {pid: i for i, pid in enumerate(_embed_product_ids)}
    idxs = [pid_to_idx.get(pid, -1) for pid in df["product_id"]]
    sims = np.array([_product_embeddings[i] @ q if i >= 0 else 0.0 for i in idxs])
    return pd.Series(sims * 3, index=df.index)


# ──────────────────────────────────────────────
# 1. DATA LOADING & CLEANING
# ──────────────────────────────────────────────

def load_data(csv_path: str = "Skin_Care.csv") -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    def parse_price(val):
        if pd.isna(val):
            return np.nan
        s = str(val).strip()
        s = s.replace("Rs   ", "").replace("Rs  ", "").replace("Rs ", "").replace("Rs", "").strip()
        s = s.split()[0] if s else s
        s = s.split("-")[0]
        dot_count   = s.count(".")
        comma_count = s.count(",")
        try:
            if dot_count == 0 and comma_count == 0:
                return float(s)
            elif dot_count == 1 and comma_count == 0:
                parts = s.split(".")
                if len(parts[1]) == 3:
                    return float(s.replace(".", ""))
                else:
                    return float(s)
            elif dot_count >= 2:
                return float(s.replace(".", ""))
            elif comma_count == 1 and dot_count == 0:
                return float(s.replace(",", "."))
            else:
                return float(s.replace(".", "").replace(",", "."))
        except Exception:
            return np.nan

    df["price_num"] = df["price"].apply(parse_price)

    for col in ["manufacture_date", "expiry_date"]:
        df[col] = pd.to_datetime(df[col], dayfirst=True, errors="coerce")

    today = pd.Timestamp.today().normalize()
    df["days_to_expiry"] = (df["expiry_date"] - today).dt.days
    df["product_id"] = df.index.astype(str)
    return df


# ──────────────────────────────────────────────
# FIX #3 — Refresh low_sell_probability from real orders
# ──────────────────────────────────────────────

def refresh_sell_probabilities(df: pd.DataFrame,
                                db_path: str = "skincare_clicks.db") -> pd.DataFrame:
    """
    Override low_sell_probability with values derived from the orders table
    (last 90 days). If the orders table doesn't exist, original CSV values
    are kept unchanged.
    """
    try:
        con = sqlite3.connect(db_path)
        orders = pd.read_sql("""
            SELECT product_id, COUNT(*) as cnt
            FROM orders
            WHERE order_date >= date('now','-90 days')
            GROUP BY product_id
        """, con)
        con.close()
        if orders.empty:
            return df
        max_cnt = max(orders["cnt"].max(), 1)
        orders["sell_prob"] = 1.0 - (orders["cnt"] / max_cnt).clip(0, 1)
        merged = df.merge(orders[["product_id", "sell_prob"]],
                          on="product_id", how="left")
        df = df.copy()
        df["low_sell_probability"] = merged["sell_prob"].fillna(1.0).values
    except Exception:
        pass   # orders table absent — silently keep CSV values
    return df


# ──────────────────────────────────────────────
# 2. LOW-SELLING PRODUCT WARNING
# ──────────────────────────────────────────────

LOW_SELL_THRESHOLD = 0.35

def get_low_selling_products(df: pd.DataFrame) -> pd.DataFrame:
    low = df[df["low_sell_probability"] >= LOW_SELL_THRESHOLD].copy()
    low["warning_message"] = (
        "📦 This product is slow-moving! Try a FREE SAMPLE — "
        "share your review and help it find its fans."
    )
    low["badge"] = "FREE SAMPLE"
    low = low.sort_values("low_sell_probability", ascending=False)
    return low[[
        "product_id", "product_name", "brand", "product_type",
        "price", "price_num", "low_sell_probability",
        "warning_message", "badge", "picture_src"
    ]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 3. SEASONAL RECOMMENDATIONS
# ──────────────────────────────────────────────

SEASON_MAP = {
    "rainy":  ["November-February (Rainy Season)"],
    "dry":    ["June-October (Dry Season)", "June-August (Humidity Peak)"],
    "stable": ["Year-Round (stable)", "Year-Round (slight peak Jul-Aug)"],
}

def detect_current_season() -> str:
    month = datetime.today().month
    if month in [11, 12, 1, 2]:
        return "rainy"
    elif month in [6, 7, 8, 9, 10]:
        return "dry"
    else:
        return "stable"

def get_seasonal_recommendations(df, season=None, top_n=12):
    if season is None:
        season = detect_current_season()
    targets = SEASON_MAP.get(season, SEASON_MAP["stable"])
    if season != "stable":
        targets += SEASON_MAP["stable"]
    mask = df["peak_season"].isin(targets)
    recs = df[mask].copy()
    recs = recs.sort_values(
        ["low_sell_probability", "price_num"], ascending=[True, True]
    ).head(top_n)
    recs["recommended_badge"] = True
    recs["season_label"] = season.capitalize()
    return recs[[
        "product_id", "product_name", "brand", "product_type",
        "price", "price_num", "peak_season", "skintype",
        "notable_effects", "description", "picture_src",
        "recommended_badge", "season_label"
    ]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 4. NEAR-EXPIRY OFFERS
# ──────────────────────────────────────────────

EXPIRY_WARNING_DAYS = 365
MAX_OFFER_ORDERS    = 999

def get_near_expiry_offers(df: pd.DataFrame) -> pd.DataFrame:
    near = df[
        (df["days_to_expiry"] >= 0) &
        (df["days_to_expiry"] <= EXPIRY_WARNING_DAYS)
    ].copy()
    near["offer_badge"]  = "BUY 2 GET 3 FREE"
    near["offer_detail"] = (
        f"⏰ Expires soon! Buy 2 Get 3 FREE — "
        f"offer valid up to {MAX_OFFER_ORDERS} orders."
    )
    near["urgency_level"] = pd.cut(
        near["days_to_expiry"],
        bins=[-1, 90, 180, 365],
        labels=["Critical (<90 days)", "High (90-180 days)", "Moderate (180-365 days)"]
    )
    near = near.sort_values("days_to_expiry", ascending=True)
    return near[[
        "product_id", "product_name", "brand", "product_type",
        "price", "price_num", "days_to_expiry", "expiry_date",
        "offer_badge", "offer_detail", "urgency_level", "picture_src"
    ]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 5. CLICK TRACKING (SQLite)
# ──────────────────────────────────────────────

DB_PATH = "skincare_clicks.db"

def init_click_db(db_path: str = DB_PATH):
    con = sqlite3.connect(db_path)
    con.execute("""
        CREATE TABLE IF NOT EXISTS product_clicks (
            session_id   TEXT NOT NULL,
            product_id   TEXT NOT NULL,
            product_name TEXT,
            click_time   TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (session_id, product_id, click_time)
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS click_summary (
            product_id   TEXT PRIMARY KEY,
            product_name TEXT,
            total_clicks INTEGER DEFAULT 0
        )
    """)
    con.commit()
    con.close()

def record_click(session_id, product_id, product_name, db_path=DB_PATH):
    con = sqlite3.connect(db_path)
    con.execute(
        "INSERT OR IGNORE INTO product_clicks (session_id, product_id, product_name) "
        "VALUES (?,?,?)",
        (session_id, product_id, product_name)
    )
    con.execute("""
        INSERT INTO click_summary (product_id, product_name, total_clicks)
        VALUES (?, ?, 1)
        ON CONFLICT(product_id) DO UPDATE SET total_clicks = total_clicks + 1
    """, (product_id, product_name))
    con.commit()
    con.close()

def get_session_clicks(session_id: str, db_path: str = DB_PATH) -> dict:
    try:
        con = sqlite3.connect(db_path)
        rows = con.execute(
            "SELECT product_id, COUNT(*) as cnt FROM product_clicks "
            "WHERE session_id=? GROUP BY product_id",
            (session_id,)
        ).fetchall()
        con.close()
        return {r[0]: r[1] for r in rows}
    except Exception:
        return {}

def get_top_clicked_products(df, session_id, threshold=2, db_path=DB_PATH):
    session_clicks = get_session_clicks(session_id, db_path)
    hot_ids = [pid for pid, cnt in session_clicks.items() if cnt > threshold]
    if not hot_ids:
        return pd.DataFrame()
    hot = df[df["product_id"].isin(hot_ids)].copy()
    hot["click_count"]     = hot["product_id"].map(session_clicks)
    hot["reminder_banner"] = "👀 You keep coming back to this! Ready to add it to cart?"
    hot = hot.sort_values("click_count", ascending=False)
    return hot[[
        "product_id", "product_name", "brand", "product_type",
        "price", "price_num", "click_count",
        "reminder_banner", "picture_src", "description"
    ]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 6. PERSONALISED FILTERING  (fixes #1 #2 #5 #6)
# ──────────────────────────────────────────────

BUDGET_RANGES = {
    "Under Rs 100": (0,   100),
    "Rs 100–200":   (100, 200),
    "Rs 200–500":   (200, 500),
    "Rs 500+":      (500, float("inf")),
}

CONCERN_KEYWORDS = {
    "Acne":         ["acne", "acne-free", "pimple", "blemish", "anti-acne"],
    "Brightening":  ["brightening", "bright", "glow", "radiance", "whitening",
                     "luminous", "cerah", "mencerahkan"],   # Indonesian synonyms
    "Anti-Aging":   ["anti-aging", "anti aging", "wrinkle", "aging", "firming", "collagen"],
    "Pore-Care":    ["pore", "pore-care", "pore minimizing", "blackhead"],
    "Moisturizing": ["moisturizing", "moisturizer", "hydrating", "hydration", "moisture",
                     "lembab", "melembabkan"],
    "Soothing":     ["soothing", "soothe", "calming", "sensitive", "gentle"],
}

SKIN_TYPE_KEYWORDS = {
    "Oily":        ["oily", "oily skin"],
    "Dry":         ["dry", "dry skin"],
    "Combination": ["combination", "combination skin"],
    "Sensitive":   ["sensitive", "sensitive skin"],
    "Normal":      ["normal", "normal skin", "all skin"],
}

_RETURN_COLS = [
    "product_id", "product_name", "brand", "product_type",
    "price", "price_num", "price_display",
    "skintype", "notable_effects", "description",
    "low_sell_probability", "match_score", "picture_src",
]


def _diversify(df: pd.DataFrame, top_n: int,
               max_per_brand: int = 2, max_per_type: int = 3) -> pd.DataFrame:
    """FIX #5: cap results per brand and product_type."""
    brand_counts: dict = {}
    type_counts:  dict = {}
    kept = []
    for _, row in df.iterrows():
        b = row.get("brand", "") or ""
        t = row.get("product_type", "") or ""
        if brand_counts.get(b, 0) >= max_per_brand:
            continue
        if type_counts.get(t, 0) >= max_per_type:
            continue
        kept.append(row)
        brand_counts[b] = brand_counts.get(b, 0) + 1
        type_counts[t]  = type_counts.get(t, 0) + 1
        if len(kept) == top_n:
            break
    return pd.DataFrame(kept).reset_index(drop=True) if kept else pd.DataFrame(columns=df.columns)


def get_filtered_recommendations(
    df: pd.DataFrame,
    skin_type: str = "",
    concerns: list = None,
    budget: str = "",
    top_n: int = 50,
    session_id: str = "",      # FIX #2
    db_path: str = DB_PATH,    # FIX #2: allow test override
) -> pd.DataFrame:
    if concerns is None:
        concerns = []

    filtered = df.copy()
    budget_relaxed = False

    # ── FIX #6: Budget — graceful fallback ───────────────────────────────────
    if budget and budget in BUDGET_RANGES:
        lo, hi = BUDGET_RANGES[budget]
        in_budget = filtered[
            (filtered["price_num"] >= lo) & (filtered["price_num"] <= hi)
        ]
        if len(in_budget) >= 3:
            filtered = in_budget
        else:
            budget_relaxed = True   # caller receives this via the _budget_relaxed col

    # ── Scoring ──────────────────────────────────────────────────────────────
    scores = pd.Series(0.0, index=filtered.index)

    # Skin type
    if skin_type:
        st_keywords  = SKIN_TYPE_KEYWORDS.get(skin_type, [skin_type.lower()])
        skintype_col = filtered["skintype"].fillna("").str.lower()
        for kw in st_keywords:
            scores += skintype_col.str.contains(kw, na=False).astype(float) * 2

    # Concerns — FIX #1: semantic + keyword combined
    if concerns:
        effects_col = filtered["notable_effects"].fillna("").str.lower()
        desc_col    = filtered["description"].fillna("").str.lower()
        for concern in concerns:
            # Semantic similarity (no-op if model unavailable)
            scores += _semantic_scores(filtered, concern)
            # Keyword matching kept as additional boost
            keywords = CONCERN_KEYWORDS.get(concern, [concern.lower()])
            for kw in keywords:
                scores += effects_col.str.contains(kw, na=False).astype(float) * 3
                scores += desc_col.str.contains(kw, na=False).astype(float) * 1

    # Prefer well-selling products
    scores += (filtered["low_sell_probability"].fillna(1) < 0.35).astype(float) * 1

    # FIX #2: click boost (log-scaled so 10 clicks ≠ 10× advantage)
    if session_id:
        clicks   = get_session_clicks(session_id, db_path)
        click_map = filtered["product_id"].map(clicks).fillna(0)
        scores   += np.log1p(click_map) * 2

    filtered = filtered.copy()
    filtered["match_score"]     = scores
    filtered["_budget_relaxed"] = budget_relaxed

    filtered = filtered.sort_values(
        ["match_score", "price_num"], ascending=[False, True]
    )

    # FIX #5: diversity cap before head(top_n)
    filtered = _diversify(filtered, top_n * 2)   # over-fetch then cap
    filtered = filtered.head(top_n)

    def fmt_price(row):
        try:
            v = float(row["price_num"])
            return f"Rs {v:,.0f}" if v >= 1000 else f"Rs {v:.2f}"
        except Exception:
            return str(row.get("price", "—"))

    filtered["price_display"] = filtered.apply(fmt_price, axis=1)

    return filtered[_RETURN_COLS + ["_budget_relaxed"]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 7. MASTER RECOMMENDATION FUNCTION
# ──────────────────────────────────────────────

def build_recommendation_payload(df, session_id="demo_session",
                                  season=None, db_path=DB_PATH) -> dict:
    init_click_db(db_path)
    return {
        "current_season":          season or detect_current_season(),
        "seasonal_recommendations": get_seasonal_recommendations(df, season).to_dict("records"),
        "low_selling_samples":      get_low_selling_products(df).head(8).to_dict("records"),
        "near_expiry_offers":       get_near_expiry_offers(df).head(8).to_dict("records"),
        "top_clicked_products":     get_top_clicked_products(df, session_id, db_path=db_path).to_dict("records"),
        "generated_at":             datetime.now().isoformat(),
    }


# ──────────────────────────────────────────────
# DEMO RUN
# ──────────────────────────────────────────────

if __name__ == "__main__":
    df = load_data("Skin_Care.csv")
    print(f"✅ Loaded {len(df)} products")
    df = refresh_sell_probabilities(df)
    build_embeddings(df)
    print("✅ Embeddings ready (or keyword fallback active)")

    init_click_db()
    for _ in range(3):
        record_click("demo_session", df["product_id"].iloc[0], df["product_name"].iloc[0])

    payload = build_recommendation_payload(df, session_id="demo_session")
    print(f"Season: {payload['current_season']}")

    recs = get_filtered_recommendations(
        df, skin_type="Oily", concerns=["Acne", "Brightening"],
        budget="Rs 100–200", session_id="demo_session"
    )
    budget_relaxed = recs["_budget_relaxed"].any() if "_budget_relaxed" in recs.columns else False
    print(f"Recs: {len(recs)}  budget_relaxed={budget_relaxed}")
    print(recs[["product_name", "brand", "price_display", "match_score"]].head(10).to_string())