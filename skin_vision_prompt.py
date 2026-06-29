

VALID_SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"]

VALID_CONCERNS = [
    "Acne", "Brightening", "Anti-Aging",
    "Pore-Care", "Moisturizing", "Soothing",
]

GROQ_MODEL    = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

def build_prompt_standard() -> tuple[str, str]:
    """
    Recommended default. Returns (system_prompt, user_prompt).
    Pass system_prompt as role:system and user_prompt as role:user.

    Because Groq JSON mode is active, the model is guaranteed to
    return valid JSON — no need for "return ONLY JSON" defensiveness.
    """
    skin_types   = " | ".join(VALID_SKIN_TYPES)
    concerns_str = ", ".join(VALID_CONCERNS)

    system = (
        "You are an expert dermatologist AI. "
        "You analyse facial selfies and return structured skin analysis data. "
        "Always respond in JSON format only."
    )

    user = f"""Analyse this facial selfie and detect the person's skin type and concerns.

Return a JSON object with these exact fields:

{{
  "skin_type":  "<one of: {skin_types}>",
  "concerns":   ["<from valid list below>"],
  "confidence": <float 0.0 to 1.0>,
  "tip":        "<one personalised skincare sentence>"
}}

VALID CONCERNS (use exact spelling, include all you can see):
{concerns_str}

SKIN TYPE decision rules:
- Oily:        visible shine, enlarged pores, thick or greasy texture
- Dry:         flakiness, rough patches, tight or dull appearance
- Combination: oily T-zone (forehead, nose, chin) with dry or normal cheeks
- Sensitive:   redness, visible capillaries, blotchy or reactive skin
- Normal:      balanced, even tone, no obvious texture problems

CONFIDENCE scale:
- 0.85–1.0  face clearly visible, good even lighting
- 0.60–0.84 minor issues (soft focus, slight shadow)
- 0.40–0.59 noticeable quality problems
- 0.10–0.39 face barely visible — return best guess anyway

TIP rules:
- One sentence only, actionable, name a specific ingredient or step
- No brand names

If no face is visible: skin_type "Normal", concerns [], confidence 0.1,
tip "Please upload a clear, well-lit facial photo."
"""
    return system, user


def build_prompt_minimal() -> tuple[str, str]:
    """Fastest / cheapest. Returns only skin_type and concerns."""
    skin_types   = " | ".join(VALID_SKIN_TYPES)
    concerns_str = " | ".join(VALID_CONCERNS)

    system = "You are a dermatologist AI. Respond in JSON only."
    user   = f"""Analyse this selfie.

Return JSON:
{{
  "skin_type": "<{skin_types}>",
  "concerns":  ["<from: {concerns_str}>"]
}}

Choose ONE skin_type. List all concerns you can visibly detect."""
    return system, user


def build_prompt_detailed() -> tuple[str, str]:
    """
    Full skin report. Adds routine_steps, key_ingredients, avoid_ingredients.
    Use for the PDF report page.
    """
    skin_types   = " | ".join(VALID_SKIN_TYPES)
    concerns_str = ", ".join(VALID_CONCERNS)

    system = (
        "You are an expert dermatologist AI conducting a full skin consultation. "
        "Respond in JSON only."
    )
    user = f"""Analyse this facial selfie for a full skin consultation report.

Return JSON:
{{
  "skin_type":  "<one of: {skin_types}>",
  "concerns":   ["<from valid list>"],
  "confidence": <float 0.0–1.0>,
  "tip":        "<one personalised sentence>",
  "routine_steps": {{
    "AM": ["<step1>", "<step2>", "<step3>"],
    "PM": ["<step1>", "<step2>", "<step3>"]
  }},
  "key_ingredients":   ["<ingredient1>", "<ingredient2>", "<ingredient3>"],
  "avoid_ingredients": ["<ingredient1>", "<ingredient2>"]
}}

VALID CONCERNS: {concerns_str}

SKIN TYPE rules: Oily=shine+pores, Dry=flaky+tight, Combination=oily-T+dry-cheeks,
Sensitive=redness+reactive, Normal=balanced.

ROUTINE: 3 steps per period in application order.
AM always ends with SPF. PM always ends with moisturiser.
KEY INGREDIENTS: 3 hero actives for detected skin profile.
AVOID INGREDIENTS: 2 ingredients likely to aggravate detected concerns.

If no face visible: skin_type Normal, empty concerns, confidence 0.1.
"""
    return system, user


def get_prompt(tier: str = "standard") -> tuple[str, str]:
    """
    Returns (system_prompt, user_prompt) for the given tier.
    tier: "minimal" | "standard" | "detailed"
    """
    return {
        "minimal":  build_prompt_minimal,
        "standard": build_prompt_standard,
        "detailed": build_prompt_detailed,
    }.get(tier, build_prompt_standard)()


if __name__ == "__main__":
    for tier in ["minimal", "standard", "detailed"]:
        sys_p, usr_p = get_prompt(tier)
        print(f"\n{'─'*55}")
        print(f"  TIER: {tier.upper()}")
        print(f"{'─'*55}")
        print(f"[SYSTEM]\n{sys_p}\n")
        print(f"[USER]\n{usr_p}")
    print("\n✅ All prompts rendered.")