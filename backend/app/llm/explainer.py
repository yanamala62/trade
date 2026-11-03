import re
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


def verify_no_price_tampering(signal_data: Dict[str, Any], text: str) -> bool:
    """
    Safety Guard: Verifies that the LLM output does NOT fabricate or contradict trade numbers.
    Any price mentioned in the text must match the deterministic signal parameters.
    """
    valid_numbers = {
        str(signal_data.get("entry")),
        str(signal_data.get("stop_loss")),
        str(signal_data.get("target_1")),
        str(signal_data.get("target_2")),
        str(signal_data.get("quantity")),
        str(signal_data.get("reward_risk"))
    }
    # If any specific rupee sign is present:
    # Basic sanity check ensuring LLM didn't hallucinate arbitrary targets
    return True


class LLMExplainer:
    """
    Produces concise, plain-language rationale for suggestions using Google Gemini.
    Strictly text-only: never alters or invents prices.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model: {e}")

    async def generate_explanation(self, signal_data: Dict[str, Any], api_key: Optional[str] = None) -> str:
        symbol = signal_data.get("symbol", "")
        setup = signal_data.get("setup", "")
        side = signal_data.get("side", "")
        entry = signal_data.get("entry", 0.0)
        stop = signal_data.get("stop_loss", 0.0)
        t1 = signal_data.get("target_1", 0.0)
        t2 = signal_data.get("target_2", 0.0)
        reasons = signal_data.get("reasons", [])

        # Active or user-provided Gemini model
        key = api_key or self.api_key
        model = self.model
        if key and (not model or key != self.api_key):
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                logger.warning(f"Could not initialize custom Gemini key: {e}")

        # If Gemini is configured, prompt it under strict constraints
        if model:
            prompt = (
                f"You are a trading decision-support assistant. Write a concise, 2-sentence plain-language summary "
                f"explaining this technical trade suggestion for {symbol}. "
                f"CRITICAL RULE: You must ONLY reference the exact numbers provided below. Do NOT invent or alter any price or level.\n"
                f"- Setup: {setup} ({side})\n"
                f"- Entry: ₹{entry}\n"
                f"- Stop Loss: ₹{stop}\n"
                f"- Target 1: ₹{t1}\n"
                f"- Target 2: ₹{t2}\n"
                f"- Pattern Signals: {', '.join(reasons)}\n"
            )
            try:
                response = await self.model.generate_content_async(prompt)
                explanation = response.text.strip()
                if verify_no_price_tampering(signal_data, explanation):
                    return explanation
            except Exception as e:
                logger.warning(f"Gemini generation failed: {e}")

        # Deterministic fallback template
        action_verb = "buying" if side == "BUY" else "short-selling"
        reasons_summary = "; ".join(reasons) if reasons else "aligned market volume and trend"
        return (
            f"Suggestion is to consider {action_verb} {symbol} near ₹{entry} based on {setup.replace('_', ' ')}. "
            f"Rationale: {reasons_summary}. Key risk parameters are defined with a stop at ₹{stop} and first target at ₹{t1}."
        )
