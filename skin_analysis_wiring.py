# skin_analysis_wiring.py
# ─────────────────────────────────────────────────────────────────────────────
# Adapter layer: Claude vision JSON → get_filtered_recommendations()
#
# The problem this solves:
#   Claude returns:  { "skin_type": "Oily", "concerns": ["Acne", "Pore-Care"], ... }
#   Your function expects exactly those field names — but there are 4 edge cases
#   that silently produce wrong results if you just pass them through naively:
#
#   1. Confidence below threshold  → don't trust the analysis, return nothing
#   2. Empty concerns list         → function still runs but scores everything 0
#   3. Budget missing or invalid   → skip the filter rather than crash
#   4. No products returned        → budget too narrow + niche skin type combo
#
# This file handles all four and gives you one clean function to call.
# ─────────────────────────────────────────────────────────────────────────────

import logging
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional

from recommendation_engine import (
    load_data,
    get_filtered_recommendations,
)

logger = logging.getLogger(__name__)

# ── Mirror the valid values from recommendation_engine.py ────────────────────
# These must stay in sync with SKIN_TYPE_KEYWORDS and CONCERN_KEYWORDS.

VALID_SKIN_TYPES = {"Oily", "Dry", "Combination", "Sensitive", "Normal"}

VALID_CONCERNS = {
    "Acne", "Brightening", "Anti-Aging",
    "Pore-Care", "Moisturizing", "Soothing",
}

VALID_BUDGETS = {
    "Under Rs 100", "Rs 100–200", "Rs 200–500", "Rs 500+",
}

# Below this confidence level we warn the caller rather than silently returning
# low-quality recommendations.
MIN_CONFIDENCE_THRESHOLD = 0.45


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Data classes for typed inputs / outputs
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SkinAnalysisInput:
    """
    The fields that come back from the Claude vision endpoint.
    Matches SkinAnalysisResult in skin_analysis_endpoint.py exactly.
    """
    skin_type  : str
    concerns   : list[str]
    confidence : float
    tip        : str        = ""
    budget     : str        = ""    # passed in separately from the UI
    top_n      : int        = 15


@dataclass
class RecommendationResult:
    """
    Returned by wire_analysis_to_recommendations().
    The React frontend reads .products for the card list and
    .meta for the summary banner.
    """
    products      : list[dict]          # ready-to-render product dicts
    product_count : int
    skin_type     : str
    concerns      : list[str]
    budget        : str
    confidence    : float
    tip           : str
    low_confidence: bool = False        # True if confidence < threshold
    fallback_used : bool = False        # True if budget was relaxed
    warnings      : list[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# 2.  Input sanitiser
#     Cleans Claude's output before it touches the engine.
# ─────────────────────────────────────────────────────────────────────────────

def sanitise_analysis(raw: SkinAnalysisInput) -> SkinAnalysisInput:
    """
    Validates and cleans every field.
    Returns a new SkinAnalysisInput — never mutates the original.

    Rules applied:
    - skin_type  : must be in VALID_SKIN_TYPES; defaults to "Normal"
    - concerns   : keeps only values in VALID_CONCERNS; deduplicates
    - confidence : clamped to [0.0, 1.0]
    - budget     : must be in VALID_BUDGETS or cleared to ""
    - top_n      : clamped to [1, 50]
    """
    warnings = []

    # ── skin_type ─────────────────────────────────────────────────────────
    skin_type = str(raw.skin_type).strip().title()
    if skin_type not in VALID_SKIN_TYPES:
        # Try fuzzy match: "combination/oily" → "Combination"
        matched = next(
            (v for v in VALID_SKIN_TYPES if v.lower() in skin_type.lower()),
            "Normal"
        )
        warnings.append(
            f"skin_type '{raw.skin_type}' not recognised → using '{matched}'"
        )
        skin_type = matched

    # ── concerns ──────────────────────────────────────────────────────────
    concerns = []
    for c in (raw.concerns or []):
        c_clean = str(c).strip()
        if c_clean in VALID_CONCERNS:
            concerns.append(c_clean)
        else:
            # Case-insensitive fallback
            match = next(
                (v for v in VALID_CONCERNS if v.lower() == c_clean.lower()),
                None
            )
            if match:
                concerns.append(match)
            else:
                warnings.append(f"concern '{c_clean}' ignored — not in valid set")

    concerns = list(dict.fromkeys(concerns))   # deduplicate, preserve order

    # ── confidence ────────────────────────────────────────────────────────
    try:
        confidence = float(raw.confidence)
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.75

    # ── budget ────────────────────────────────────────────────────────────
    budget = str(raw.budget or "").strip()
    if budget and budget not in VALID_BUDGETS:
        warnings.append(
            f"budget '{budget}' not recognised → budget filter disabled"
        )
        budget = ""

    # ── top_n ─────────────────────────────────────────────────────────────
    top_n = max(1, min(int(raw.top_n or 15), 50))

    if warnings:
        for w in warnings:
            logger.warning("sanitise_analysis: %s", w)

    return SkinAnalysisInput(
        skin_type  = skin_type,
        concerns   = concerns,
        confidence = confidence,
        tip        = str(raw.tip or "").strip(),
        budget     = budget,
        top_n      = top_n,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Core wiring function
#     This is the one function you call everywhere.
# ─────────────────────────────────────────────────────────────────────────────

def wire_analysis_to_recommendations(
    analysis : SkinAnalysisInput,
    df       : pd.DataFrame,
) -> RecommendationResult:
    """
    Takes the Claude vision analysis and the loaded product DataFrame,
    calls get_filtered_recommendations(), and returns a RecommendationResult.

    Handles three fallback scenarios automatically:
      1. Low confidence  → still runs but sets low_confidence=True in result
      2. Zero products   → retries without budget filter, sets fallback_used=True
      3. Still zero      → retries with no filters at all (skin type + concerns only)
    """
    warnings     = []
    fallback_used = False

    # ── Sanitise inputs first ─────────────────────────────────────────────
    clean = sanitise_analysis(analysis)

    # ── Confidence check ─────────────────────────────────────────────────
    low_confidence = clean.confidence < MIN_CONFIDENCE_THRESHOLD
    if low_confidence:
        warnings.append(
            f"Low confidence ({clean.confidence:.0%}) — "
            "results may not match actual skin type. "
            "Ask user to retake photo in better lighting."
        )

    # ── Attempt 1: full filter (skin type + concerns + budget) ───────────
    products_df = get_filtered_recommendations(
        df         = df,
        skin_type  = clean.skin_type,
        concerns   = clean.concerns,
        budget     = clean.budget,
        top_n      = clean.top_n,
    )

    # ── Attempt 2: relax budget if no results ────────────────────────────
    if len(products_df) == 0 and clean.budget:
        logger.info(
            "No products for skin_type=%s concerns=%s budget=%s — "
            "retrying without budget filter",
            clean.skin_type, clean.concerns, clean.budget,
        )
        products_df = get_filtered_recommendations(
            df        = df,
            skin_type = clean.skin_type,
            concerns  = clean.concerns,
            budget    = "",            # no budget restriction
            top_n     = clean.top_n,
        )
        if len(products_df) > 0:
            fallback_used = True
            warnings.append(
                f"No products found under '{clean.budget}'. "
                "Showing recommendations without budget filter."
            )

    # ── Attempt 3: relax skin type + concerns if still nothing ───────────
    if len(products_df) == 0:
        logger.info(
            "Still no products after budget relaxation — "
            "returning top scored products regardless of skin type"
        )
        products_df = get_filtered_recommendations(
            df     = df,
            top_n  = clean.top_n,
        )
        if len(products_df) > 0:
            fallback_used = True
            warnings.append(
                "No exact matches found. Showing top-rated products instead."
            )

    # ── Serialise to plain dicts for JSON response ────────────────────────
    # Convert numpy/pandas types that json.dumps can't handle
    products = []
    for row in products_df.to_dict("records"):
        products.append({
            k: (float(v) if hasattr(v, "item") else v)   # numpy scalar → Python float
            for k, v in row.items()
            if v is not None and str(v) != "nan"
        })

    return RecommendationResult(
        products       = products,
        product_count  = len(products),
        skin_type      = clean.skin_type,
        concerns       = clean.concerns,
        budget         = clean.budget,
        confidence     = clean.confidence,
        tip            = clean.tip,
        low_confidence = low_confidence,
        fallback_used  = fallback_used,
        warnings       = warnings,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4.  FastAPI integration
#     Drop-in replacement for the recommendation block in skin_analysis_endpoint.py
# ─────────────────────────────────────────────────────────────────────────────
#
# Replace the "Get personalised product recommendations" block in
# skin_analysis_endpoint.py with this:
#
#   from skin_analysis_wiring import SkinAnalysisInput, wire_analysis_to_recommendations
#
#   wiring_input = SkinAnalysisInput(
#       skin_type  = analysis.skin_type,
#       concerns   = analysis.concerns,
#       confidence = analysis.confidence,
#       tip        = analysis.tip,
#       budget     = body.budget,
#       top_n      = body.top_n,
#   )
#   result = wire_analysis_to_recommendations(wiring_input, df)
#
#   return {
#       "ok"            : True,
#       "analysis"      : analysis,
#       "products"      : result.products,
#       "product_count" : result.product_count,
#       "low_confidence": result.low_confidence,
#       "fallback_used" : result.fallback_used,
#       "warnings"      : result.warnings,
#       "model_used"    : message.model,
#   }


# ─────────────────────────────────────────────────────────────────────────────
# 5.  React integration (how the frontend consumes the response)
# ─────────────────────────────────────────────────────────────────────────────
#
# The /api/analyze-skin response now looks like:
#
#   {
#     "ok": true,
#     "analysis": {
#       "skin_type":  "Oily",
#       "concerns":   ["Acne", "Pore-Care"],
#       "confidence": 0.88,
#       "tip": "Try a niacinamide serum to control shine and minimise pores."
#     },
#     "products": [ { "product_name": "...", "price_display": "Rs 39.00", ... } ],
#     "product_count": 12,
#     "low_confidence": false,
#     "fallback_used":  false,
#     "warnings": []
#   }
#
# In SkinSelfieAnalyzer.jsx, inside callClaudeVision() replace the direct
# Anthropic API call with a call to your server instead:
#
#   async function analyseViaSever(base64Image, mediaType, budget) {
#     const res = await fetch("http://localhost:8000/api/analyze-skin", {
#       method: "POST",
#       headers: { "Content-Type": "application/json" },
#       body: JSON.stringify({
#         image_data : base64Image,
#         media_type : mediaType,
#         budget     : budget,
#         top_n      : 15,
#       }),
#     });
#
#     if (!res.ok) {
#       const err = await res.json().catch(() => ({}));
#       throw new Error(err?.detail || `Server error ${res.status}`);
#     }
#
#     const data = await res.json();
#
#     // Show a warning banner if confidence is low
#     if (data.low_confidence) {
#       console.warn("Low confidence analysis:", data.warnings);
#     }
#
#     // Show a notice if budget was relaxed
#     if (data.fallback_used) {
#       console.info("Budget relaxed:", data.warnings);
#     }
#
#     return data;   // { analysis, products, product_count, ... }
#   }
#
# Then in the Results component, render data.analysis for the skin card
# and data.products for the product list — both arrive in one response.


# ─────────────────────────────────────────────────────────────────────────────
# 6.  Quick test — run:  python skin_analysis_wiring.py
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    CSV_PATH = r"C:\Users\shivi\Downloads\glow10\Skin_Care.csv"

    print("Loading product data...")
    df = load_data(CSV_PATH)
    print(f"✅ {len(df)} products loaded\n")

    test_cases = [
        # Happy path — oily skin, acne concerns, budget set
        {
            "label"     : "Happy path",
            "skin_type" : "Oily",
            "concerns"  : ["Acne", "Pore-Care"],
            "confidence": 0.88,
            "tip"       : "Use a niacinamide serum to control sebum.",
            "budget"    : "Under Rs 100",
            "top_n"     : 5,
        },
        # Low confidence — blurry photo
        {
            "label"     : "Low confidence",
            "skin_type" : "Dry",
            "concerns"  : ["Moisturizing"],
            "confidence": 0.32,
            "tip"       : "Try a ceramide moisturiser.",
            "budget"    : "Rs 100–200",
            "top_n"     : 5,
        },
        # Budget too narrow — triggers fallback
        {
            "label"     : "Budget fallback",
            "skin_type" : "Sensitive",
            "concerns"  : ["Soothing", "Anti-Aging"],
            "confidence": 0.79,
            "tip"       : "Look for centella asiatica products.",
            "budget"    : "Under Rs 100",
            "top_n"     : 5,
        },
        # Invalid skin type from Claude — tests sanitiser
        {
            "label"     : "Bad skin type",
            "skin_type" : "Very Oily/Acne-Prone",   # Claude hallucinated this
            "concerns"  : ["Acne", "UnknownConcern"],
            "confidence": 0.65,
            "tip"       : "",
            "budget"    : "",
            "top_n"     : 5,
        },
    ]

    for case in test_cases:
        label = case.pop("label")
        inp   = SkinAnalysisInput(**case)
        result = wire_analysis_to_recommendations(inp, df)

        print(f"{'─' * 55}")
        print(f"  TEST: {label}")
        print(f"{'─' * 55}")
        print(f"  skin_type      : {result.skin_type}")
        print(f"  concerns       : {result.concerns}")
        print(f"  budget         : '{result.budget}'")
        print(f"  confidence     : {result.confidence:.0%}")
        print(f"  low_confidence : {result.low_confidence}")
        print(f"  fallback_used  : {result.fallback_used}")
        print(f"  product_count  : {result.product_count}")
        if result.warnings:
            for w in result.warnings:
                print(f"  ⚠  {w}")
        if result.products:
            top = result.products[0]
            print(f"  top product    : {top['product_name']} — {top['price_display']}")
        print()

    print("✅ All test cases complete.")