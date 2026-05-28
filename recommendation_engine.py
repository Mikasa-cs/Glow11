"""
Skincare Recommendation Engine — Python Backend
================================================
Features:
  1. Low-selling product detection → free sample warning system
  2. Season-based recommendations
  3. Near-expiry product offers (Buy 2 Get 3 Free, max order 999)
  4. Click-tracking → surface top-clicked products
  5. Personalised filtering by skin type, concerns, budget → report products
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import sqlite3
import os
import warnings
warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────
# 1. DATA LOADING & CLEANING
# ──────────────────────────────────────────────

def load_data(csv_path: str = "Skin_Care.csv") -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # Strip whitespace from column names
    df.columns = df.columns.str.strip()

    # Clean price → numeric
    # Indonesian format: "Rs   1,035.00" (dots = thousand sep) or "Rs   139.00" (dot = decimal)
    # Strategy: strip prefix, then detect format and parse correctly
    def parse_price(val):
        if pd.isna(val):
            return np.nan
        s = str(val).strip()
        # Remove currency prefix
        s = s.replace("Rs   ", "").replace("Rs  ", "").replace("Rs ", "").replace("Rs", "").strip()
        # Remove any trailing text after space (e.g. "78.540-16%(22)")
        s = s.split()[0] if s else s
        # Remove dashes and percent junk
        s = s.split("-")[0]
        # Count dots and commas
        dot_count   = s.count(".")
        comma_count = s.count(",")
        try:
            if dot_count == 0 and comma_count == 0:
                # Plain integer: "139"
                return float(s)
            elif dot_count == 1 and comma_count == 0:
                # Could be decimal "139.00" or thousand-sep "1.035"
                parts = s.split(".")
                if len(parts[1]) == 3:
                    # Thousand separator: "1.035" → 1035
                    return float(s.replace(".", ""))
                else:
                    # Decimal: "139.00" → 139.0
                    return float(s)
            elif dot_count >= 2:
                # Multiple dots = all thousand separators: "1.035.000" → 1035000
                return float(s.replace(".", ""))
            elif comma_count == 1 and dot_count == 0:
                # Comma as decimal: "139,00" → 139.0
                return float(s.replace(",", "."))
            else:
                return float(s.replace(".", "").replace(",", "."))
        except Exception:
            return np.nan

    df["price_num"] = df["price"].apply(parse_price)

    # Parse dates
    for col in ["manufacture_date", "expiry_date"]:
        df[col] = pd.to_datetime(df[col], dayfirst=True, errors="coerce")

    # Days until expiry
    today = pd.Timestamp.today().normalize()
    df["days_to_expiry"] = (df["expiry_date"] - today).dt.days

    # Product ID (short slug)
    df["product_id"] = df.index.astype(str)

    return df


# ──────────────────────────────────────────────
# 2. LOW-SELLING PRODUCT WARNING
# ──────────────────────────────────────────────

LOW_SELL_THRESHOLD = 0.35   # products with probability >= this are flagged

def get_low_selling_products(df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns products with high low_sell_probability.
    These get a 'Free Sample' badge and a warning message.
    """
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

def get_seasonal_recommendations(
    df: pd.DataFrame,
    season: str = None,
    top_n: int = 12,
) -> pd.DataFrame:
    """
    Return top_n products matching the current (or supplied) season.
    """
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

    near["offer_badge"]   = "BUY 2 GET 3 FREE"
    near["offer_detail"]  = (
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

def record_click(session_id: str, product_id: str, product_name: str,
                 db_path: str = DB_PATH):
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
    con = sqlite3.connect(db_path)
    rows = con.execute(
        "SELECT product_id, COUNT(*) as cnt FROM product_clicks "
        "WHERE session_id=? GROUP BY product_id",
        (session_id,)
    ).fetchall()
    con.close()
    return {r[0]: r[1] for r in rows}

def get_top_clicked_products(
    df: pd.DataFrame,
    session_id: str,
    threshold: int = 2,
    db_path: str = DB_PATH,
) -> pd.DataFrame:
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
# 6. PERSONALISED FILTERING FOR REPORT
# ──────────────────────────────────────────────

# Budget buckets matching the frontend BUDGETS array
BUDGET_RANGES = {
    "Under Rs 100":  (0,     100),    # price_num >= 0  AND <= 100
    "Rs 100–200":    (100,   200),
    "Rs 200–500":    (200,   500),
    "Rs 500+":       (500,   float("inf")),
}

# Map concern labels (from frontend) → keywords searched in notable_effects / description
CONCERN_KEYWORDS = {
    "Acne":         ["acne", "acne-free", "pimple", "blemish", "anti-acne"],
    "Brightening":  ["brightening", "bright", "glow", "radiance", "whitening", "luminous"],
    "Anti-Aging":   ["anti-aging", "anti aging", "wrinkle", "aging", "firming", "collagen"],
    "Pore-Care":    ["pore", "pore-care", "pore minimizing", "blackhead"],
    "Moisturizing": ["moisturizing", "moisturizer", "hydrating", "hydration", "moisture"],
    "Soothing":     ["soothing", "soothe", "calming", "sensitive", "gentle"],
}

# Map skin type labels (frontend) → keywords in skintype column
SKIN_TYPE_KEYWORDS = {
    "Oily":        ["oily", "oily skin"],
    "Dry":         ["dry", "dry skin"],
    "Combination": ["combination", "combination skin"],
    "Sensitive":   ["sensitive", "sensitive skin"],
    "Normal":      ["normal", "normal skin", "all skin"],
}


def get_filtered_recommendations(
    df: pd.DataFrame,
    skin_type: str = "",
    concerns: list = None,
    budget: str = "",
    top_n: int = 50,
) -> pd.DataFrame:
    """
    Filter and score the full dataset by user's skin type, concerns, and budget.
    Returns up to top_n ranked products for the PDF report.

    Scoring (higher = better match):
      +3  per concern keyword match in notable_effects or description
      +2  if skin type matches skintype column
      +1  if product is not low-selling (low_sell_probability < 0.35)
      -99 if price is outside budget (hard filter)
    """
    if concerns is None:
        concerns = []

    filtered = df.copy()

    # ── Budget hard filter ──────────────────────────────────────────────────
    if budget and budget in BUDGET_RANGES:
        lo, hi = BUDGET_RANGES[budget]
        filtered = filtered[
            (filtered["price_num"] >= lo) & (filtered["price_num"] <= hi)
        ]

    # NOTE: If the budget filter returns 0 results we return an empty
    # DataFrame rather than silently falling back to the full dataset,
    # which would show out-of-budget products.
    # The caller / frontend should surface a "No products found for this
    # budget" message instead.

    # ── Scoring ─────────────────────────────────────────────────────────────
    scores = pd.Series(0.0, index=filtered.index)

    # Skin type score
    if skin_type:
        st_keywords = SKIN_TYPE_KEYWORDS.get(skin_type, [skin_type.lower()])
        skintype_col = filtered["skintype"].fillna("").str.lower()
        for kw in st_keywords:
            scores += skintype_col.str.contains(kw, na=False).astype(float) * 2

    # Concern score — search notable_effects and description
    if concerns:
        effects_col = filtered["notable_effects"].fillna("").str.lower()
        desc_col    = filtered["description"].fillna("").str.lower()
        for concern in concerns:
            keywords = CONCERN_KEYWORDS.get(concern, [concern.lower()])
            for kw in keywords:
                scores += effects_col.str.contains(kw, na=False).astype(float) * 3
                scores += desc_col.str.contains(kw, na=False).astype(float) * 1

    # Prefer well-selling products
    scores += (filtered["low_sell_probability"].fillna(1) < 0.35).astype(float) * 1

    filtered = filtered.copy()
    filtered["match_score"] = scores

    # ── Sort: score DESC, then price ASC ───────────────────────────────────
    filtered = filtered.sort_values(
        ["match_score", "price_num"], ascending=[False, True]
    ).head(top_n)

    # ── Format price for display ────────────────────────────────────────────
    def fmt_price(row):
        try:
            v = float(row["price_num"])
            if v >= 1000:
                return f"Rs {v:,.0f}"
            else:
                return f"Rs {v:.2f}"
        except Exception:
            return str(row.get("price", "—"))

    filtered["price_display"] = filtered.apply(fmt_price, axis=1)

    return filtered[[
        "product_id", "product_name", "brand", "product_type",
        "price", "price_num", "price_display",
        "skintype", "notable_effects", "description",
        "low_sell_probability", "match_score", "picture_src",
    ]].reset_index(drop=True)


# ──────────────────────────────────────────────
# 7. MASTER RECOMMENDATION FUNCTION
# ──────────────────────────────────────────────

def build_recommendation_payload(
    df: pd.DataFrame,
    session_id: str = "demo_session",
    season: str = None,
    db_path: str = DB_PATH,
) -> dict:
    init_click_db(db_path)

    return {
        "current_season": season or detect_current_season(),
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
    print(f"✅ Loaded {len(df)} products\n")

    init_click_db()
    for _ in range(3):
        record_click("demo_session", df["product_id"].iloc[0],
                     df["product_name"].iloc[0])

    payload = build_recommendation_payload(df, session_id="demo_session")
    print(f"🌦️  Current season: {payload['current_season']}")
    print(f"🏷️  Seasonal recs : {len(payload['seasonal_recommendations'])} products")
    print(f"📦 Low-sellers   : {len(payload['low_selling_samples'])} products")
    print(f"⏰  Near-expiry   : {len(payload['near_expiry_offers'])} products")
    print(f"👀 Top-clicked   : {len(payload['top_clicked_products'])} products")

    # Test personalised filter
    recs = get_filtered_recommendations(
        df, skin_type="Oily", concerns=["Acne", "Brightening"], budget="Rs 100–200"
    )
    print(f"\n🎯 Personalised recs (Oily, Acne+Brightening, Rs100-200): {len(recs)} products")
    print(recs[["product_name", "brand", "price_display", "match_score"]].head(10).to_string())

    with open("recommendation_payload.json", "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print("\n💾 Saved recommendation_payload.json")