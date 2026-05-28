# skin_vision_prompt.py
# ─────────────────────────────────────────────────────────────────────────────
# Claude vision prompts for skin analysis.
#
# Three prompt tiers — pick based on what your UI needs:
#
#   build_prompt_minimal()   → skin_type + concerns only  (fastest, cheapest)
#   build_prompt_standard()  → + confidence + tip         (recommended, used in endpoint)
#   build_prompt_detailed()  → + routine + ingredients    (for a premium "full report" flow)
#
# All prompts are engineered to return EXACT values that plug into
# recommendation_engine.py without any mapping or translation.
# ─────────────────────────────────────────────────────────────────────────────

# ── Valid values — must match recommendation_engine.py exactly ────────────────

VALID_SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"]

VALID_CONCERNS = [
    "Acne",
    "Brightening",
    "Anti-Aging",
    "Pore-Care",
    "Moisturizing",
    "Soothing",
]

VALID_BUDGETS = ["Under Rs 100", "Rs 100–200", "Rs 200–500", "Rs 500+"]


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TIER 1 — Minimal
# Use when: you only need to feed skin_type + concerns into the engine.
# Output tokens: ~60
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt_minimal() -> str:
    """
    Smallest possible prompt. Returns only the two fields
    get_filtered_recommendations() needs. Use this if speed or
    token cost is your priority.
    """
    skin_types = " | ".join(VALID_SKIN_TYPES)
    concerns   = " | ".join(VALID_CONCERNS)

    return f"""Analyse this facial selfie. Return ONLY a JSON object, no other text.

{{
  "skin_type": "<{skin_types}>",
  "concerns":  ["<pick from: {concerns}>"]
}}

Choose ONE skin_type. Include all concerns you can visibly detect."""


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TIER 2 — Standard  ← recommended default
# Use when: you want confidence + a personalised tip for the UI.
# Output tokens: ~120
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt_standard() -> str:
    """
    The recommended prompt. Adds confidence (so the UI can show
    "88% confident") and a tip (the one human-readable sentence
    shown below the analysis result card).

    Every field maps directly to SkinAnalysisResult in
    skin_analysis_endpoint.py.
    """
    skin_types = " | ".join(VALID_SKIN_TYPES)
    concerns   = ", ".join(VALID_CONCERNS)

    return f"""You are an expert dermatologist AI. Analyse this facial selfie.

Return ONLY a valid JSON object — no markdown fences, no explanation, nothing else.

{{
  "skin_type":  "<exactly one of: {skin_types}>",
  "concerns":   ["<concern1>", "<concern2>"],
  "confidence": <float 0.0–1.0>,
  "tip":        "<one personalised skincare sentence>"
}}

CONCERNS — valid values only, exact spelling, include all you can see:
{concerns}

SKIN TYPE rules:
- Oily        → visible shine, enlarged pores, thick texture
- Dry         → flakiness, tightness, dull or rough patches
- Combination → oily T-zone (forehead/nose/chin), dry cheeks
- Sensitive   → redness, visible capillaries, reactive-looking skin
- Normal      → balanced, even tone, no obvious texture issues

CONFIDENCE rules:
- 0.85–1.0  → face clearly visible, good even lighting
- 0.60–0.84 → acceptable lighting, minor obstructions
- 0.40–0.59 → low light, heavy filter, partially obscured
- 0.10–0.39 → face barely visible; still return best guess

TIP rules:
- One sentence only
- Specific to the detected skin_type and concerns
- Actionable (name an ingredient or routine step)
- No brand names

If no face is visible: skin_type "Normal", empty concerns array,
confidence 0.1, tip "Please upload a clear, well-lit facial photo."

Return ONLY the JSON object."""


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TIER 3 — Detailed  (premium "full report" flow)
# Use when: generating the PDF skin report or a dedicated skin quiz page.
# Output tokens: ~250
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt_detailed() -> str:
    """
    Returns everything in Tier 2 plus:
      - routine_steps: ordered AM/PM routine suggestions
      - key_ingredients: 3 hero ingredients to look for
      - avoid_ingredients: ingredients to avoid for this skin type

    These extra fields power the "Your Routine" section of the PDF report
    but are ignored by get_filtered_recommendations() — that function only
    reads skin_type, concerns, and budget.
    """
    skin_types   = " | ".join(VALID_SKIN_TYPES)
    concerns_str = ", ".join(VALID_CONCERNS)

    return f"""You are an expert dermatologist AI conducting a full skin consultation
from a facial selfie.

Return ONLY a valid JSON object — no markdown, no explanation, nothing else.

{{
  "skin_type": "<exactly one of: {skin_types}>",
  "concerns":  ["<concern1>", "<concern2>"],
  "confidence": <float 0.0–1.0>,
  "tip": "<one personalised sentence>",
  "routine_steps": {{
    "AM": ["<step1>", "<step2>", "<step3>"],
    "PM": ["<step1>", "<step2>", "<step3>"]
  }},
  "key_ingredients":   ["<ingredient1>", "<ingredient2>", "<ingredient3>"],
  "avoid_ingredients": ["<ingredient1>", "<ingredient2>"]
}}

CONCERNS — valid values, exact spelling, include ALL you can observe:
{concerns_str}

SKIN TYPE — pick the single best match:
- Oily:        shine, enlarged pores, thick/greasy texture
- Dry:         flakiness, rough patches, tight appearance, dullness
- Combination: oily T-zone + dry/normal cheeks
- Sensitive:   redness, blotchiness, visible capillaries, uneven tone
- Normal:      balanced, no obvious issues

CONFIDENCE — based on image quality:
0.85–1.0  clear face, even lighting, no filters
0.60–0.84 minor issues (slight shadow, soft focus)
0.40–0.59 noticeable quality problems
0.10–0.39 face barely visible

ROUTINE STEPS — 3 steps per period, in application order:
  AM: cleanser → treatment → SPF (always end AM with SPF)
  PM: cleanser → treatment → moisturiser

KEY INGREDIENTS — 3 hero actives most beneficial for the detected profile.
AVOID INGREDIENTS — 2 ingredients likely to aggravate detected concerns.

TIP — one sentence, actionable, ingredient-specific, no brand names.

If no face is visible: skin_type "Normal", concerns [], confidence 0.1,
tip "Please upload a clear photo", minimal routine and ingredient lists.

Return ONLY the JSON object."""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt selector — convenience function used by the endpoint
# ─────────────────────────────────────────────────────────────────────────────

def get_prompt(tier: str = "standard") -> str:
    """
    Returns the prompt for the given tier.

    tier options: "minimal" | "standard" | "detailed"
    Defaults to "standard" for unknown values.
    """
    return {
        "minimal":  build_prompt_minimal,
        "standard": build_prompt_standard,
        "detailed": build_prompt_detailed,
    }.get(tier, build_prompt_standard)()


# ─────────────────────────────────────────────────────────────────────────────
# Prompt testing utility
# Run:  python skin_vision_prompt.py
# Prints all three prompts with token estimates so you can compare them.
# ─────────────────────────────────────────────────────────────────────────────

def _estimate_tokens(text: str) -> int:
    """Rough estimate: ~4 chars per token for English prose."""
    return len(text) // 4


if __name__ == "__main__":
    tiers = [
        ("minimal",  build_prompt_minimal()),
        ("standard", build_prompt_standard()),
        ("detailed", build_prompt_detailed()),
    ]

    for name, prompt in tiers:
        tokens = _estimate_tokens(prompt)
        print(f"\n{'─' * 60}")
        print(f"  TIER: {name.upper()}   (~{tokens} input tokens)")
        print(f"{'─' * 60}")
        print(prompt)

    print("\n\n✅ All prompts rendered. Paste into Claude playground to test.")
    print("   https://console.anthropic.com/workbench")