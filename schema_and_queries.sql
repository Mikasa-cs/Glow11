-- ================================================================
--  SKINCARE RECOMMENDATION SYSTEM — SQL Schema & Queries
--  Database: SQLite (compatible with PostgreSQL with minor changes)
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- SCHEMA
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    product_id         TEXT PRIMARY KEY,
    product_href       TEXT,
    product_name       TEXT NOT NULL,
    product_type       TEXT,
    brand              TEXT,
    notable_effects    TEXT,
    skintype           TEXT,
    price              TEXT,
    price_num          REAL,
    description        TEXT,
    picture_src        TEXT,
    tier               TEXT,
    manufacture_date   DATE,
    expiry_date        DATE,
    shelf_life_months  INTEGER,
    pao_months         INTEGER,
    demand_jan         REAL, demand_feb REAL, demand_mar REAL,
    demand_apr         REAL, demand_may REAL, demand_jun REAL,
    demand_jul         REAL, demand_aug REAL, demand_sep REAL,
    demand_oct         REAL, demand_nov REAL, demand_dec REAL,
    peak_season        TEXT,
    low_sell_prob      REAL
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id   TEXT PRIMARY KEY,
    user_agent   TEXT,
    created_at   DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_clicks (
    click_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT    NOT NULL REFERENCES sessions(session_id),
    product_id   TEXT    NOT NULL REFERENCES products(product_id),
    product_name TEXT,
    clicked_at   DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS free_sample_requests (
    request_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT    NOT NULL,
    product_id   TEXT    NOT NULL REFERENCES products(product_id),
    user_email   TEXT,
    requested_at DATETIME DEFAULT (datetime('now')),
    review_left  INTEGER DEFAULT 0   -- 0=pending, 1=reviewed
);

CREATE TABLE IF NOT EXISTS offers (
    offer_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id   TEXT NOT NULL REFERENCES products(product_id),
    offer_type   TEXT,    -- 'BUY_2_GET_3', 'FREE_SAMPLE', 'SEASONAL'
    offer_detail TEXT,
    max_orders   INTEGER DEFAULT 999,
    orders_used  INTEGER DEFAULT 0,
    valid_until  DATE,
    is_active    INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clicks_session  ON product_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_product  ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_expiry          ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_low_sell        ON products(low_sell_prob);
CREATE INDEX IF NOT EXISTS idx_peak_season     ON products(peak_season);


-- ────────────────────────────────────────────────────────────────
-- QUERY 1 — LOW-SELLING PRODUCTS (send free sample warnings)
-- ────────────────────────────────────────────────────────────────
-- Products with high low_sell_probability (>= 0.35) need promotion.
-- Shows product name, brand, probability, and a pre-built warning text.

SELECT
    p.product_id,
    p.product_name,
    p.brand,
    p.product_type,
    p.price,
    p.low_sell_prob,
    '📦 Slow-moving product — offer as FREE SAMPLE to boost visibility!'
        AS warning_message,
    'FREE SAMPLE'                        AS badge
FROM products p
WHERE p.low_sell_prob >= 0.35
ORDER BY p.low_sell_prob DESC
LIMIT 20;


-- ────────────────────────────────────────────────────────────────
-- QUERY 2 — SEASONAL RECOMMENDATIONS
-- Matches product peak_season to the current month's season.
-- Replace :current_season with 'Rainy', 'Dry', etc. at runtime.
-- ────────────────────────────────────────────────────────────────

SELECT
    p.product_id,
    p.product_name,
    p.brand,
    p.product_type,
    p.price,
    p.peak_season,
    p.skintype,
    p.notable_effects,
    1  AS recommended_badge    -- frontend renders "RECOMMENDED" chip
FROM products p
WHERE
    p.peak_season LIKE '%' || :season_keyword || '%'
    OR p.peak_season LIKE '%Year-Round%'
ORDER BY
    p.low_sell_prob ASC,       -- good sellers first
    p.price_num     ASC
LIMIT 12;


-- ────────────────────────────────────────────────────────────────
-- QUERY 3 — NEAR-EXPIRY OFFERS
-- Products expiring within 365 days → Buy 2 Get 3 Free
-- ────────────────────────────────────────────────────────────────

SELECT
    p.product_id,
    p.product_name,
    p.brand,
    p.price,
    p.expiry_date,
    CAST(julianday(p.expiry_date) - julianday('now') AS INTEGER)
        AS days_to_expiry,
    'BUY 2 GET 3 FREE'         AS offer_badge,
    '⏰ Expires soon! Buy 2 Get 3 FREE — valid up to 999 orders.'
        AS offer_detail,
    CASE
        WHEN CAST(julianday(p.expiry_date) - julianday('now') AS INTEGER) < 90
            THEN 'Critical'
        WHEN CAST(julianday(p.expiry_date) - julianday('now') AS INTEGER) < 180
            THEN 'High'
        ELSE 'Moderate'
    END AS urgency_level
FROM products p
WHERE
    p.expiry_date BETWEEN date('now') AND date('now', '+365 days')
ORDER BY days_to_expiry ASC
LIMIT 20;


-- ────────────────────────────────────────────────────────────────
-- QUERY 4A — LOG A CLICK  (run on every product click event)
-- ────────────────────────────────────────────────────────────────

INSERT INTO product_clicks (session_id, product_id, product_name)
VALUES (:session_id, :product_id, :product_name);


-- ────────────────────────────────────────────────────────────────
-- QUERY 4B — GET PRODUCTS CLICKED > 2 TIMES IN SESSION
-- Returns "hot" products to pin at top + show reminder banner.
-- ────────────────────────────────────────────────────────────────

SELECT
    pc.product_id,
    p.product_name,
    p.brand,
    p.product_type,
    p.price,
    p.picture_src,
    COUNT(pc.click_id)  AS click_count,
    '👀 You keep coming back to this — ready to add it to cart?'
        AS reminder_banner
FROM product_clicks pc
JOIN products p ON p.product_id = pc.product_id
WHERE pc.session_id = :session_id
GROUP BY pc.product_id
HAVING COUNT(pc.click_id) > 2
ORDER BY click_count DESC;


-- ────────────────────────────────────────────────────────────────
-- QUERY 5 — GLOBAL CLICK LEADERBOARD (admin/analytics view)
-- ────────────────────────────────────────────────────────────────

SELECT
    pc.product_id,
    p.product_name,
    p.brand,
    COUNT(pc.click_id)       AS total_clicks,
    COUNT(DISTINCT pc.session_id) AS unique_sessions
FROM product_clicks pc
JOIN products p ON p.product_id = pc.product_id
GROUP BY pc.product_id
ORDER BY total_clicks DESC
LIMIT 10;


-- ────────────────────────────────────────────────────────────────
-- QUERY 6 — OFFER AVAILABILITY CHECK (before confirming order)
-- Ensures BUY 2 GET 3 offer hasn't exceeded 999-order cap.
-- ────────────────────────────────────────────────────────────────

SELECT
    o.offer_id,
    o.offer_type,
    o.max_orders,
    o.orders_used,
    (o.max_orders - o.orders_used)  AS remaining_slots,
    CASE
        WHEN o.orders_used < o.max_orders AND o.is_active = 1
            THEN 'AVAILABLE'
        ELSE 'EXPIRED'
    END AS offer_status
FROM offers o
WHERE o.product_id = :product_id
  AND o.offer_type = 'BUY_2_GET_3'
  AND o.is_active  = 1;


-- ────────────────────────────────────────────────────────────────
-- QUERY 7 — SEED OFFERS FOR NEAR-EXPIRY PRODUCTS (run once/daily)
-- Inserts BUY_2_GET_3 offers for any near-expiry products
-- that don't already have an active offer.
-- ────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO offers (product_id, offer_type, offer_detail, max_orders, valid_until)
SELECT
    p.product_id,
    'BUY_2_GET_3',
    '⏰ Expires soon! Buy 2 Get 3 FREE — up to 999 orders.',
    999,
    p.expiry_date
FROM products p
WHERE
    p.expiry_date BETWEEN date('now') AND date('now', '+365 days')
    AND p.product_id NOT IN (
        SELECT product_id FROM offers
        WHERE offer_type = 'BUY_2_GET_3' AND is_active = 1
    );
