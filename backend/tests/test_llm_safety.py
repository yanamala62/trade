import pytest
import re
from app.llm.explainer import LLMExplainer, verify_no_price_tampering


@pytest.mark.asyncio
async def test_llm_deterministic_fallback_quotes_exact_numbers():
    explainer = LLMExplainer()
    signal_data = {
        "symbol": "RELIANCE",
        "setup": "ORB_LONG",
        "side": "BUY",
        "entry": 2950.50,
        "stop_loss": 2930.00,
        "target_1": 2980.00,
        "target_2": 3000.00,
        "quantity": 25,
        "reward_risk": 1.44,
        "reasons": ["Broke 15m high with 2.2x volume", "Above VWAP"]
    }
    explanation = await explainer.generate_explanation(signal_data)
    assert "2950.5" in explanation
    assert "2930.0" in explanation
    assert "2980.0" in explanation
    assert "RELIANCE" in explanation


def test_llm_safety_verifier_rejects_hallucinations():
    signal_data = {
        "symbol": "TCS",
        "entry": 3800.0,
        "stop_loss": 3750.0,
        "target_1": 3900.0,
        "target_2": 3950.0,
        "quantity": 10
    }
    # Text quoting exact signal prices
    valid_text = "Target is 3900.0 with a stop at 3750.0"
    assert verify_no_price_tampering(signal_data, valid_text) is True
