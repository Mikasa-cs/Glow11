# skin_analysis_endpoint.py  —  Groq / Llama 4 Scout edition
# ─────────────────────────────────────────────────────────────────────────────
# FREE API — uses Groq (meta-llama/llama-4-scout-17b-16e-instruct)
# No credit card. Get your free key at: https://console.groq.com
#
# Key differences from the Anthropic version:
#   • Uses openai SDK pointed at Groq base URL (fully compatible)
#   • response_format={"type":"json_object"} — guaranteed valid JSON back
#   • Image passed as image_url with full data:image/...;base64,... string
#   • Error types: openai.AuthenticationError, openai.RateLimitError, etc.
#
# Add to server.py:
#   from skin_analysis_endpoint import router as skin_router
#   app.include_router(skin_router)
#
# Install:
#   pip install openai        ← Groq is fully OpenAI SDK compatible
#
# Set env var:
#   Windows PowerShell:  $env:GROQ_API_KEY = "gsk_..."
#   Windows CMD:         set GROQ_API_KEY=gsk_...
#   .env file:           GROQ_API_KEY=gsk_...
#
# Free tier limits (as of 2026):
#   • 30 requests/minute
#   • 14,400 requests/day
#   • No credit card required
# ─────────────────────────────────────────────────────────────────────────────

import os
import re
import json
import base64
import logging
from typing import Optional

import openai                           # pip install openai  (works with Groq)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from recommendation_engine import load_data, get_filtered_recommendations
from skin_vision_prompt import get_prompt, GROQ_MODEL, GROQ_BASE_URL

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Valid values — mirror recommendation_engine.py ────────────────────────────

VALID_SKIN_TYPES = {"Oily", "Dry", "Combination", "Sensitive", "Normal"}
VALID_CONCERNS   = {"Acne", "Brightening", "Anti-Aging", "Pore-Care", "Moisturizing", "Soothing"}
VALID_BUDGETS    = {"Under Rs 100", "Rs 100–200", "Rs 200–500", "Rs 500+"}
VALID_MEDIA_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}

CSV_PATH = r"C:\Users\shivi\Downloads\glow10\Skin_Care.csv"   # ← update if moved


# ── Pydantic models ───────────────────────────────────────────────────────────

class SkinAnalysisRequest(BaseModel):
    image_data : str              # base64 string — NO data:... prefix
    media_type : str = "image/jpeg"
    budget     : Optional[str] = ""
    top_n      : int = 15
    prompt_tier: str = "standard"  # "minimal" | "standard" | "detailed"

    @field_validator("media_type")
    @classmethod
    def check_media_type(cls, v):
        v = v.lower().strip()
        if v == "image/jpg": v = "image/jpeg"
        if v not in VALID_MEDIA_TYPES:
            raise ValueError(f"Unsupported media type '{v}'.")
        return v

    @field_validator("image_data")
    @classmethod
    def check_base64(cls, v):
        v = v.strip()
        if v.startswith("data:"):
            v = v.split(",", 1)[-1]   # strip prefix if frontend sent it
        if not re.fullmatch(r"[A-Za-z0-9+/=\n\r]+", v):
            raise ValueError("image_data is not valid base64.")
        try:
            base64.b64decode(v, validate=True)
        except Exception:
            raise ValueError("image_data cannot be decoded as base64.")
        return v

    @field_validator("budget")
    @classmethod
    def check_budget(cls, v):
        if v and v not in VALID_BUDGETS:
            raise ValueError(f"Invalid budget. Choose from: {', '.join(sorted(VALID_BUDGETS))}")
        return v or ""

    @field_validator("top_n")
    @classmethod
    def check_top_n(cls, v):
        return max(1, min(v, 50))


class SkinAnalysisResult(BaseModel):
    skin_type  : str
    concerns   : list[str]
    confidence : float
    tip        : str


class SkinAnalysisResponse(BaseModel):
    ok            : bool
    analysis      : SkinAnalysisResult
    products      : list[dict]
    product_count : int
    model_used    : str
    low_confidence: bool = False
    fallback_used : bool = False
    warnings      : list[str] = []


# ── Groq client (lazy singleton) ──────────────────────────────────────────────

_groq_client: openai.OpenAI | None = None

def get_groq_client() -> openai.OpenAI:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "\n\n❌ GROQ_API_KEY environment variable not set.\n"
                "   Get your free key at https://console.groq.com\n"
                "   Then: export GROQ_API_KEY='gsk_...'\n"
            )
        _groq_client = openai.OpenAI(
            api_key  = api_key,
            base_url = GROQ_BASE_URL,    # point OpenAI SDK at Groq
        )
    return _groq_client


# ── Parse and validate Groq's JSON response ───────────────────────────────────

def parse_groq_response(raw: str) -> SkinAnalysisResult:
    """
    With Groq JSON mode active, raw should always be valid JSON.
    We still validate every field to guard against unexpected values.
    """
    clean = raw.strip().lstrip("```json").rstrip("```").strip()

    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Groq returned non-JSON: {e}\nRaw: {raw[:200]}")

    # skin_type
    skin_type = str(parsed.get("skin_type", "Normal")).strip().title()
    if skin_type not in VALID_SKIN_TYPES:
        skin_type = next(
            (v for v in VALID_SKIN_TYPES if v.lower() in skin_type.lower()),
            "Normal"
        )

    # concerns — keep only valid values
    concerns = []
    for c in (parsed.get("concerns") or []):
        c = str(c).strip()
        match = c if c in VALID_CONCERNS else next(
            (v for v in VALID_CONCERNS if v.lower() == c.lower()), None
        )
        if match and match not in concerns:
            concerns.append(match)

    # confidence
    try:
        confidence = max(0.0, min(1.0, float(parsed.get("confidence", 0.75))))
    except (TypeError, ValueError):
        confidence = 0.75

    # tip
    tip = str(parsed.get("tip", "")).strip() or f"Use products suited to {skin_type.lower()} skin."

    return SkinAnalysisResult(
        skin_type=skin_type, concerns=concerns,
        confidence=confidence, tip=tip,
    )


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/api/analyze-skin", response_model=SkinAnalysisResponse)
async def analyze_skin(body: SkinAnalysisRequest):
    """
    POST /api/analyze-skin

    Accepts base64 selfie → calls Groq Llama 4 Scout vision →
    validates JSON → feeds into get_filtered_recommendations() →
    returns analysis + products in one response.

    FREE — uses Groq free tier (no credit card required).
    """
    client   = get_groq_client()
    warnings = []

    # Build the full data-URL Groq expects
    data_url = f"data:{body.media_type};base64,{body.image_data}"

    # Get prompts (system + user split for Llama)
    system_prompt, user_prompt = get_prompt(body.prompt_tier)

    # ── 1. Call Groq vision ────────────────────────────────────────────────
    try:
        response = client.chat.completions.create(
            model   = GROQ_MODEL,
            messages = [
                {
                    "role"   : "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type"     : "image_url",
                            "image_url": { "url": data_url },   # full data-URL
                        },
                        {
                            "type": "text",
                            "text": user_prompt,
                        },
                    ],
                },
            ],
            response_format = { "type": "json_object" },  # guaranteed JSON back
            temperature     = 0.1,    # low temp = consistent structured output
            max_tokens      = 512,
        )
    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid GROQ_API_KEY.")
    except openai.RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Groq free tier rate limit hit. Wait a moment and try again. "
                   "Free limit: 30 req/min, 14,400 req/day."
        )
    except openai.BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"Bad request to Groq: {str(e)}")
    except openai.APIError as e:
        logger.exception("Groq API error")
        raise HTTPException(status_code=502, detail=f"Groq API error: {str(e)}")

    # ── 2. Parse response ─────────────────────────────────────────────────
    raw_text = response.choices[0].message.content or ""

    try:
        analysis = parse_groq_response(raw_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Could not parse skin analysis: {e}")

    # Low confidence warning
    low_confidence = analysis.confidence < 0.45
    if low_confidence:
        warnings.append(
            f"Low confidence ({analysis.confidence:.0%}). "
            "Ask user to retake in better lighting."
        )

    # FIX #7: skin-type fallback map for low-confidence results
    SKIN_TYPE_FALLBACK = {
        "Oily":        ["Oily", "Combination"],
        "Dry":         ["Dry", "Sensitive"],
        "Combination": ["Combination", "Oily", "Normal"],
        "Sensitive":   ["Sensitive", "Dry"],
        "Normal":      ["Normal", "Combination"],
    }

    # ── 3. Get product recommendations ────────────────────────────────────
    fallback_used = False
    try:
        import pandas as _pd
        df = load_data(CSV_PATH)

        confidence = analysis.confidence
        primary_st = analysis.skin_type

        if confidence < 0.45:
            candidate_types = SKIN_TYPE_FALLBACK.get(primary_st, [primary_st])
            frames = [
                get_filtered_recommendations(
                    df=df, skin_type=st, concerns=analysis.concerns,
                    budget=body.budget, top_n=body.top_n * 2,
                )
                for st in candidate_types
            ]
            products_df = (
                _pd.concat(frames)
                   .drop_duplicates("product_id")
                   .sort_values("match_score", ascending=False)
                   .head(body.top_n)
                   .reset_index(drop=True)
            )
            warnings.append(
                f"Low confidence ({confidence:.0%}). Showing results for "
                f"{' and '.join(candidate_types)} skin types. "
                "Retake selfie in bright, even lighting for better accuracy."
            )
        elif confidence >= 0.85:
            products_df = get_filtered_recommendations(
                df=df, skin_type=primary_st, concerns=analysis.concerns,
                budget=body.budget, top_n=body.top_n,
            )
            products_df = products_df[products_df["match_score"] > 0].reset_index(drop=True)
        else:
            products_df = get_filtered_recommendations(
                df=df, skin_type=primary_st, concerns=analysis.concerns,
                budget=body.budget, top_n=body.top_n,
            )

        # FIX #6: surface budget-relaxed flag from engine
        if "_budget_relaxed" in products_df.columns and products_df["_budget_relaxed"].any():
            fallback_used = True
            warnings.append(
                f"Fewer than 3 products found under '{body.budget}'. "
                "Showing closest alternatives."
            )

        skip_cols = {"_budget_relaxed"}
        products = [
            {k: (float(v) if hasattr(v, "item") else v)
             for k, v in row.items()
             if k not in skip_cols and v is not None and str(v) != "nan"}
            for row in products_df.to_dict("records")
        ]

    except Exception as e:
        logger.exception("Recommendation engine error")
        products = []
        warnings.append(f"Could not load products: {str(e)}")

    return SkinAnalysisResponse(
        ok            = True,
        analysis      = analysis,
        products      = products,
        product_count = len(products),
        model_used    = response.model,
        low_confidence = low_confidence,
        fallback_used = fallback_used,
        warnings      = warnings,
    )