from typing import List, Dict, Any, Optional
import pandas as pd
from app.indicators.opening_range import calculate_opening_range
from app.indicators.volume import calculate_volume_metrics


def detect_orb_pattern(
    candles_5m: List[Dict[str, Any]], prev_close: float = 0.0
) -> Optional[Dict[str, Any]]:
    """
    Detects Opening Range Breakout (ORB) on 5-minute candles.
    Triggers when price closes outside the 15-minute range with above-average volume.
    """
    if len(candles_5m) < 4:  # Need at least first 15m (3 candles) + 1 breakout candle
        return None

    # Calculate 15m range from first 3 candles (15 mins)
    or_result = calculate_opening_range(candles_5m[:3], range_minutes=15)
    if not or_result:
        return None

    or_high, or_low, or_mid = or_result
    latest = candles_5m[-1]
    curr_close = float(latest["close"])
    curr_high = float(latest["high"])
    curr_low = float(latest["low"])

    # Volume check
    vol_stats = calculate_volume_metrics(candles_5m)
    rvol = vol_stats["rvol"]

    # Bullish ORB
    if curr_close > or_high and rvol >= 1.2:
        stop_loss = round(or_mid, 2)
        risk = curr_close - stop_loss
        if risk <= 0:
            return None
        target_1 = round(curr_close + 1.5 * risk, 2)
        target_2 = round(curr_close + 2.5 * risk, 2)
        return {
            "setup": "ORB_LONG",
            "side": "BUY",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Broke 15m Opening Range High (₹{or_high}) with {rvol}x volume surge",
                f"Stop-loss placed at OR Midpoint (₹{or_mid})",
                "High relative volume breakout"
            ]
        }

    # Bearish ORB
    if curr_close < or_low and rvol >= 1.2:
        stop_loss = round(or_mid, 2)
        risk = stop_loss - curr_close
        if risk <= 0:
            return None
        target_1 = round(curr_close - 1.5 * risk, 2)
        target_2 = round(curr_close - 2.5 * risk, 2)
        return {
            "setup": "ORB_SHORT",
            "side": "SELL",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Broke 15m Opening Range Low (₹{or_low}) with {rvol}x volume surge",
                f"Stop-loss placed at OR Midpoint (₹{or_mid})",
                "High relative volume breakdown"
            ]
        }

    return None
