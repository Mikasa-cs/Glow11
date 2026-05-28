"""
Skincare Recommendation Engine — Python Backend
================================================
Features:
  1. Low-selling product detection → free sample warning system
  2. Season-based recommendations
  3. Near-expiry product offers (Buy 2 Get 3 Free, max order 999)
  4. Click-tracking → surface top-clicked products
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

    # Clean price → numeric (remove "Rs   " and ".")
    df["price_num"] = (
        df["price"]
        .str.replace("Rs   ", "", regex=False)
        .str.replace(".", "", regex=False)
        .str.replace(",", "", regex=False)
        .pipe(pd.to_numeric, errors="coerce")
    )

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
    Each result includes 'recommended_badge' = True so the UI can show the pop-up chip.
    """
    if season is None:
        season = detect_current_season()

    targets = SEASON_MAP.get(season, SEASON_MAP["stable"])
    # also include year-round products
    if season != "stable":
        targets += SEASON_MAP["stable"]

    mask = df["peak_season"].isin(targets)
    recs = df[mask].copy()

    # Rank by low_sell_probability ASC (good sellers first) then price ASC
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

EXPIRY_WARNING_DAYS = 365   # products expiring within 1 year get an offer
MAX_OFFER_ORDERS    = 999

def get_near_expiry_offers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Products expiring within EXPIRY_WARNING_DAYS get:
      'Buy 2 Get 3 Free — up to {MAX_OFFER_ORDERS} orders!'
    """
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
    """Create SQLite table for click tracking."""
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
    """Log one click and update summary."""
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
    """Return click count per product for this session."""
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
    """
    Returns products the session clicked > threshold times.
    These bubble to top + show a 'Reminder: You kept checking this!' banner.
    """
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
# 6. MASTER RECOMMENDATION FUNCTION
# ──────────────────────────────────────────────

def build_recommendation_payload(
    df: pd.DataFrame,
    session_id: str = "demo_session",
    season: str = None,
    db_path: str = DB_PATH,
) -> dict:
    """
    Assembles the full payload for the frontend.
    """
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

    # Demo clicks
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

    # Save payload as JSON for other services
    with open("recommendation_payload.json", "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print("\n💾 Saved recommendation_payload.json")
