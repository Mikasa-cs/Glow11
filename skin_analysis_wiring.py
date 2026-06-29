# skin_analysis_wiring.py  —  Groq / Llama 4 Scout edition
# ─────────────────────────────────────────────────────────────────────────────
# Adapter: Claude/Groq JSON output → get_filtered_recommendations()
# No API calls here — pure data transformation and fallback logic.
# The Groq API call happens in skin_analysis_endpoint.py.
# ─────────────────────────────────────────────────────────────────────────────

import logging
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional

from recommendation_engine import load_data, get_filtered_recommendations

logger = logging.getLogger(__name__)

VALID_SKIN_TYPES = {"Oily", "Dry", "Combination", "Sensitive", "Normal"}
VALID_CONCERNS   = {"Acne", "Brightening", "Anti-Aging", "Pore-Care", "Moisturizing", "Soothing"}
VALID_BUDGETS    = {"Under Rs 100", "Rs 100–200", "Rs 200–500", "Rs 500+"}
MIN_CONFIDENCE   = 0.45


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class SkinAnalysisInput:
    """Matches what Groq returns, plus budget + top_n from the request."""
    skin_type  : str
    concerns   : list[str]
    confidence : float
    tip        : str        = ""
    budget     : str        = ""
    top_n      : int        = 15


@dataclass
class RecommendationResult:
    products      : list[dict]
    product_count : int
    skin_type     : str
    concerns      : list[str]
    budget        : str
    confidence    : float
    tip           : str
    low_confidence: bool = False
    fallback_used : bool = False
    warnings      : list[str] = field(default_factory=list)


# ── Sanitiser ────────────────────────────────────────────────────────────────

def sanitise_analysis(raw: SkinAnalysisInput) -> SkinAnalysisInput:
    """
    Validates and normalises every field before passing to the engine.
    Groq JSON mode keeps outputs clean, but this guards edge cases.
    """
    warnings = []

    # skin_type
    skin_type = str(raw.skin_type).strip().title()
    if skin_type not in VALID_SKIN_TYPES:
        matched = next((v for v in VALID_SKIN_TYPES if v.lower() in skin_type.lower()), "Normal")
        warnings.append(f"skin_type '{raw.skin_type}' → fallback to '{matched}'")
        skin_type = matched

    # concerns — keep only valid, deduplicate
    concerns = []
    for c in (raw.concerns or []):
        c = str(c).strip()
        match = c if c in VALID_CONCERNS else next(
            (v for v in VALID_CONCERNS if v.lower() == c.lower()), None
        )
        if match and match not in concerns:
            concerns.append(match)
        elif not match:
            warnings.append(f"Ignored unknown concern: '{c}'")

    # confidence
    try:
        confidence = max(0.0, min(1.0, float(raw.confidence)))
    except (TypeError, ValueError):
        confidence = 0.75

    # budget
    budget = str(raw.budget or "").strip()
    if budget and budget not in VALID_BUDGETS:
        warnings.append(f"Budget '{budget}' not recognised — filter disabled.")
        budget = ""

    # top_n
    top_n = max(1, min(int(raw.top_n or 15), 50))

    for w in warnings:
        logger.warning("sanitise_analysis: %s", w)

    return SkinAnalysisInput(
        skin_type=skin_type, concerns=concerns,
        confidence=confidence, tip=str(raw.tip or "").strip(),
        budget=budget, top_n=top_n,
    )


# ── Core wiring function ──────────────────────────────────────────────────────

def wire_analysis_to_recommendations(
    analysis : SkinAnalysisInput,
    df       : pd.DataFrame,
) -> RecommendationResult:
    """
    Main entry point. Pass the Groq analysis + product DataFrame.
    Handles 3 fallback levels automatically:
      1. Low confidence  → flag it, still run
      2. Zero results    → relax budget, retry
      3. Still zero      → return top products regardless of skin type
    """
    warnings      = []
    fallback_used = False
    clean         = sanitise_analysis(analysis)

    low_confidence = clean.confidence < MIN_CONFIDENCE
    if low_confidence:
        warnings.append(
            f"Low confidence ({clean.confidence:.0%}) — "
            "results may not reflect actual skin type."
        )

    # Attempt 1: full filter
    products_df = get_filtered_recommendations(
        df=df, skin_type=clean.skin_type,
        concerns=clean.concerns, budget=clean.budget, top_n=clean.top_n,
    )

    # Attempt 2: relax budget
    if len(products_df) == 0 and clean.budget:
        products_df = get_filtered_recommendations(
            df=df, skin_type=clean.skin_type,
            concerns=clean.concerns, budget="", top_n=clean.top_n,
        )
        if len(products_df) > 0:
            fallback_used = True
            warnings.append(
                f"No products under '{clean.budget}'. Showing without budget filter."
            )

    # Attempt 3: relax everything
    if len(products_df) == 0:
        products_df = get_filtered_recommendations(df=df, top_n=clean.top_n)
        if len(products_df) > 0:
            fallback_used = True
            warnings.append("No exact matches. Showing top-rated products.")

    # Serialise
    products = [
        { k: (float(v) if hasattr(v, "item") else v)
          for k, v in row.items()
          if v is not None and str(v) != "nan" }
        for row in products_df.to_dict("records")
    ]

    return RecommendationResult(
        products=products, product_count=len(products),
        skin_type=clean.skin_type, concerns=clean.concerns,
        budget=clean.budget, confidence=clean.confidence,
        tip=clean.tip, low_confidence=low_confidence,
        fallback_used=fallback_used, warnings=warnings,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Quick test — run: python skin_analysis_wiring.py
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    CSV_PATH = r"C:\Users\shivi\Downloads\glow10\Skin_Care.csv"
    print("Loading data...")
    df = load_data(CSV_PATH)
    print(f"✅ {len(df)} products loaded\n")

    tests = [
        {"label": "Happy path",    "skin_type": "Oily",    "concerns": ["Acne","Pore-Care"],      "confidence": 0.88, "tip": "", "budget": "Under Rs 100", "top_n": 5},
        {"label": "Low confidence","skin_type": "Dry",     "concerns": ["Moisturizing"],           "confidence": 0.32, "tip": "", "budget": "Rs 100–200",   "top_n": 5},
        {"label": "Budget fallback","skin_type": "Sensitive","concerns": ["Soothing","Anti-Aging"],"confidence": 0.79, "tip": "", "budget": "Under Rs 100", "top_n": 5},
        {"label": "Bad skin type", "skin_type": "Very Oily/Combo","concerns": ["Acne","Unknown"],  "confidence": 0.65, "tip": "", "budget": "",             "top_n": 5},
    ]

    for t in tests:
        label = t.pop("label")
        result = wire_analysis_to_recommendations(SkinAnalysisInput(**t), df)
        print(f"{'─'*50}")
        print(f"  TEST:          {label}")
        print(f"  skin_type:     {result.skin_type}")
        print(f"  concerns:      {result.concerns}")
        print(f"  products:      {result.product_count}")
        print(f"  low_conf:      {result.low_confidence}")
        print(f"  fallback:      {result.fallback_used}")
        for w in result.warnings: print(f"  ⚠  {w}")
        if result.products:
            print(f"  top product:   {result.products[0].get('product_name')} — {result.products[0].get('price_display')}")
        print()

    print("✅ Done.")