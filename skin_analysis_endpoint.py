# skin_analysis_endpoint.py
# ─────────────────────────────────────────────────────────────────────────────
# Drop this file into your glow10 folder alongside server.py, then add
# one line to server.py to include the router (shown at the bottom).
#
# What this file adds:
#   POST /api/analyze-skin   ← accepts a base64 image, calls Claude vision,
#                               returns skin_type + concerns + confidence + tip
#                               + ready-to-use filtered product recommendations
#
# Dependencies (already in your server.py requirements):
#   pip install fastapi anthropic pydantic
# ─────────────────────────────────────────────────────────────────────────────

import os
import re
import json
import base64
import logging
from typing import Optional

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

# ── Import your existing engine ───────────────────────────────────────────────
try:
    from recommendation_engine import (
        load_data,
        get_filtered_recommendations,
    )
except ImportError as e:
    raise RuntimeError(
        f"\n\n❌ Could not import recommendation_engine.py\n"
        f"   Error: {e}\n"
        "   Make sure skin_analysis_endpoint.py is in the same folder.\n"
    )

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Valid values — must match recommendation_engine.py exactly ────────────────

VALID_SKIN_TYPES = {"Oily", "Dry", "Combination", "Sensitive", "Normal"}

VALID_CONCERNS = {
    "Acne",
    "Brightening",
    "Anti-Aging",
    "Pore-Care",
    "Moisturizing",
    "Soothing",
}

VALID_BUDGETS = {
    "Under Rs 100",
    "Rs 100–200",
    "Rs 200–500",
    "Rs 500+",
}

VALID_MEDIA_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
}

# ── Pydantic models ───────────────────────────────────────────────────────────

class SkinAnalysisRequest(BaseModel):
    """
    Sent by the React component (SkinSelfieAnalyzer.jsx).

    image_data   : raw base64 string — NO "data:image/..." prefix
    media_type   : MIME type of the image
    budget       : optional budget filter passed through to recommendations
    top_n        : how many products to return (default 15)
    """
    image_data : str
    media_type : str = "image/jpeg"
    budget     : Optional[str] = ""
    top_n      : int = 15

    @field_validator("media_type")
    @classmethod
    def check_media_type(cls, v):
        v = v.lower().strip()
        # normalise "image/jpg" → "image/jpeg"
        if v == "image/jpg":
            v = "image/jpeg"
        if v not in VALID_MEDIA_TYPES:
            raise ValueError(f"Unsupported media type '{v}'. Use jpeg, png, gif, or webp.")
        return v

    @field_validator("image_data")
    @classmethod
    def check_base64(cls, v):
        v = v.strip()
        # Strip data-URL prefix if the frontend accidentally included it
        if v.startswith("data:"):
            v = v.split(",", 1)[-1]
        # Quick sanity check — valid base64 only contains these characters
        if not re.fullmatch(r"[A-Za-z0-9+/=\n\r]+", v):
            raise ValueError("image_data does not appear to be valid base64.")
        # Verify it actually decodes without error
        try:
            base64.b64decode(v, validate=True)
        except Exception:
            raise ValueError("image_data is not valid base64-encoded data.")
        return v

    @field_validator("budget")
    @classmethod
    def check_budget(cls, v):
        if v and v not in VALID_BUDGETS:
            raise ValueError(
                f"Invalid budget '{v}'. "
                f"Choose from: {', '.join(sorted(VALID_BUDGETS))}"
            )
        return v or ""

    @field_validator("top_n")
    @classmethod
    def check_top_n(cls, v):
        return max(1, min(v, 50))   # clamp to [1, 50]


class SkinAnalysisResult(BaseModel):
    """Structured result from Claude vision analysis."""
    skin_type  : str
    concerns   : list[str]
    confidence : float
    tip        : str


class SkinAnalysisResponse(BaseModel):
    """Full response returned to the React frontend."""
    ok           : bool
    analysis     : SkinAnalysisResult
    products     : list[dict]
    product_count: int
    model_used   : str


# ── Claude vision prompt ──────────────────────────────────────────────────────

def build_vision_prompt() -> str:
    """
    Instructs Claude to return structured JSON using EXACTLY the
    skin_type and concern labels that recommendation_engine.py expects.

    Key design decisions:
    - Lists the exact allowed values so Claude cannot invent new ones.
    - Asks for a confidence float so the UI can communicate uncertainty.
    - Requests a personalised tip as a human-readable string.
    - Explicitly forbids markdown / extra text so JSON.parse never fails.
    """
    skin_types_str = " | ".join(sorted(VALID_SKIN_TYPES))
    concerns_str   = ", ".join(sorted(VALID_CONCERNS))

    return f"""You are an expert dermatologist AI analysing a facial selfie to determine skin type and concerns.

Respond with ONLY a valid JSON object — no markdown, no explanation, no extra text before or after.

Required format:
{{
  "skin_type": "<exactly one of: {skin_types_str}>",
  "concerns": ["<concern1>", "<concern2>"],
  "confidence": <float 0.0–1.0>,
  "tip": "<one personalised skincare sentence based on what you observe>"
}}

Valid concerns — pick all that apply, use EXACT spelling:
{concerns_str}

Analysis rules:
- skin_type: assess shine, texture, pore size, flakiness, redness. Pick ONE.
- concerns: based on visible blemishes, uneven tone, fine lines, enlarged pores,
  dryness patches, redness, dullness. Include only what you can genuinely see.
- confidence: 0.9+ if face is clear and well-lit; 0.5–0.8 for moderate quality;
  below 0.5 if face is partially obscured or very low resolution.
- tip: a single actionable sentence tailored to the detected skin_type and concerns.
- If the image contains no visible face, return skin_type "Normal",
  empty concerns, confidence 0.1, and tip "Please upload a clear facial photo."

Return ONLY the JSON object."""


# ── Response validation & fallback ───────────────────────────────────────────

def parse_and_validate_claude_response(raw: str) -> SkinAnalysisResult:
    """
    Parses Claude's text response and validates every field.
    Falls back gracefully rather than crashing if Claude drifts
    from the requested format.
    """
    # Strip any accidental markdown fences
    clean = raw.strip()
    clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$",          "", clean, flags=re.MULTILINE)
    clean = clean.strip()

    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError as e:
        logger.error("Claude returned non-JSON: %s", raw[:300])
        raise ValueError(f"Claude response was not valid JSON: {e}")

    # ── skin_type ─────────────────────────────────────────────────────────
    skin_type = parsed.get("skin_type", "Normal")
    # Fuzzy match: "combination/oily" → "Combination"
    skin_type = skin_type.strip().title()
    if skin_type not in VALID_SKIN_TYPES:
        for valid in VALID_SKIN_TYPES:
            if valid.lower() in skin_type.lower():
                skin_type = valid
                break
        else:
            logger.warning("Unknown skin_type '%s', defaulting to Normal", skin_type)
            skin_type = "Normal"

    # ── concerns ──────────────────────────────────────────────────────────
    raw_concerns = parsed.get("concerns", [])
    if not isinstance(raw_concerns, list):
        raw_concerns = []

    concerns = []
    for c in raw_concerns:
        c_clean = str(c).strip()
        # Exact match first
        if c_clean in VALID_CONCERNS:
            concerns.append(c_clean)
            continue
        # Case-insensitive match
        match = next(
            (v for v in VALID_CONCERNS if v.lower() == c_clean.lower()), None
        )
        if match:
            concerns.append(match)
        else:
            logger.debug("Ignoring unknown concern: %s", c_clean)

    concerns = list(dict.fromkeys(concerns))   # deduplicate, preserve order

    # ── confidence ────────────────────────────────────────────────────────
    try:
        confidence = float(parsed.get("confidence", 0.75))
        confidence = max(0.0, min(1.0, confidence))   # clamp to [0, 1]
    except (TypeError, ValueError):
        confidence = 0.75

    # ── tip ───────────────────────────────────────────────────────────────
    tip = str(parsed.get("tip", "")).strip()
    if not tip:
        tip = f"Focus on products suited to {skin_type.lower()} skin."

    return SkinAnalysisResult(
        skin_type  = skin_type,
        concerns   = concerns,
        confidence = confidence,
        tip        = tip,
    )


# ── Anthropic client (lazy singleton) ────────────────────────────────────────
# Reads ANTHROPIC_API_KEY from the environment automatically.
# Set it once in your shell:  export ANTHROPIC_API_KEY="sk-ant-..."
# Or add it to a .env file and load with python-dotenv.

_anthropic_client: anthropic.Anthropic | None = None

def get_anthropic_client() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "\n\n❌ ANTHROPIC_API_KEY environment variable not set.\n"
                "   export ANTHROPIC_API_KEY='sk-ant-...'\n"
            )
        _anthropic_client = anthropic.Anthropic(api_key=api_key)
    return _anthropic_client


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/api/analyze-skin", response_model=SkinAnalysisResponse)
async def analyze_skin(body: SkinAnalysisRequest):
    """
    Accepts a base64-encoded selfie from the React frontend,
    calls Claude vision to detect skin type and concerns,
    then returns both the analysis AND filtered product recommendations.

    Flow:
      1. Validate base64 image input
      2. Send to Claude claude-sonnet-4-20250514 with a structured vision prompt
      3. Parse and validate Claude's JSON response
      4. Feed skin_type + concerns + budget into get_filtered_recommendations()
      5. Return everything in one response — frontend needs zero extra calls
    """

    # ── 1. Call Claude vision ─────────────────────────────────────────────
    client = get_anthropic_client()

    try:
        message = client.messages.create(
            model      = "claude-sonnet-4-20250514",
            max_tokens = 512,       # JSON response is always short
            messages   = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type"      : "base64",
                                "media_type": body.media_type,
                                "data"      : body.image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": build_vision_prompt(),
                        },
                    ],
                }
            ],
        )
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code = 401,
            detail      = "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY env var."
        )
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code = 429,
            detail      = "Anthropic rate limit hit. Please wait a moment and try again."
        )
    except anthropic.BadRequestError as e:
        # Usually means the image couldn't be decoded
        raise HTTPException(
            status_code = 400,
            detail      = f"Image rejected by Claude API: {str(e)}"
        )
    except anthropic.APIError as e:
        logger.exception("Anthropic API error")
        raise HTTPException(
            status_code = 502,
            detail      = f"Anthropic API error: {str(e)}"
        )

    # ── 2. Extract text from response ─────────────────────────────────────
    raw_text = "".join(
        block.text for block in message.content
        if hasattr(block, "text")
    )

    # ── 3. Parse + validate Claude's JSON ─────────────────────────────────
    try:
        analysis = parse_and_validate_claude_response(raw_text)
    except ValueError as e:
        logger.error("Failed to parse Claude response: %s", raw_text[:300])
        raise HTTPException(
            status_code = 422,
            detail      = f"Could not parse skin analysis: {str(e)}"
        )

    # ── 4. Get personalised product recommendations ───────────────────────
    try:
        CSV_PATH = r"C:\Users\shivi\Downloads\glow12.0\Skin_Care.csv"
        df = load_data(CSV_PATH)

        recs_df = get_filtered_recommendations(
            df         = df,
            skin_type  = analysis.skin_type,
            concerns   = analysis.concerns,
            budget     = body.budget,
            top_n      = body.top_n,
        )
        products = recs_df.to_dict("records")

    except Exception as e:
        logger.exception("Recommendation engine error")
        # Don't fail the whole request — return the analysis with empty products
        logger.warning("Returning analysis without products due to error: %s", e)
        products = []

    # ── 5. Return combined response ───────────────────────────────────────
    return SkinAnalysisResponse(
        ok            = True,
        analysis      = analysis,
        products      = products,
        product_count = len(products),
        model_used    = message.model,
    )


# ─────────────────────────────────────────────────────────────────────────────
# HOW TO ADD THIS ROUTER TO YOUR EXISTING server.py
# ─────────────────────────────────────────────────────────────────────────────
#
# Open server.py and add two lines:
#
#   # Near the top, after your existing imports:
#   from skin_analysis_endpoint import router as skin_router
#
#   # Right after `app = FastAPI(...)`:
#   app.include_router(skin_router)
#
# That's it. Restart the server and the endpoint is live at:
#   POST http://localhost:8000/api/analyze-skin
#
# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT SETUP
# ─────────────────────────────────────────────────────────────────────────────
#
#   pip install anthropic
#
#   # Windows (PowerShell):
#   $env:ANTHROPIC_API_KEY = "sk-ant-..."
#
#   # Windows (Command Prompt):
#   set ANTHROPIC_API_KEY=sk-ant-...
#
#   # Or create a .env file in glow10/ with:
#   # ANTHROPIC_API_KEY=sk-ant-...
#   # Then add to server.py:  from dotenv import load_dotenv; load_dotenv()
#
# ─────────────────────────────────────────────────────────────────────────────
# MANUAL TEST (curl)
# ─────────────────────────────────────────────────────────────────────────────
#
# Linux/Mac:
#   B64=$(base64 -i /path/to/selfie.jpg | tr -d '\n')
#   curl -X POST http://localhost:8000/api/analyze-skin \
#        -H "Content-Type: application/json" \
#        -d "{\"image_data\":\"$B64\",\"media_type\":\"image/jpeg\",\"budget\":\"Under Rs 100\"}"
#
# Windows PowerShell:
#   $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\selfie.jpg"))
#   Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/analyze-skin `
#     -ContentType "application/json" `
#     -Body "{`"image_data`":`"$b64`",`"media_type`":`"image/jpeg`",`"budget`":`"Under Rs 100`"}"
#
# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE RESPONSE
# ─────────────────────────────────────────────────────────────────────────────
#
# {
#   "ok": true,
#   "analysis": {
#     "skin_type":  "Oily",
#     "concerns":   ["Acne", "Pore-Care"],
#     "confidence": 0.88,
#     "tip": "Look for oil-free, non-comedogenic products with niacinamide to control shine and minimise pores."
#   },
#   "products": [
#     { "product_name": "ACWELL Bubble Free PH Balancing Cleanser", "brand": "ACWELL", "price_display": "Rs 209.00", ... },
#     ...
#   ],
#   "product_count": 12,
#   "model_used": "claude-sonnet-4-20250514"
# }