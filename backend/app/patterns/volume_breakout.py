from typing import List, Dict, Any, Optional
import pandas as pd
from app.indicators.volume import calculate_volume_metrics


def detect_volume_breakout_pattern(
    candles_intraday: List[Dict[str, Any]],
    prev_day_high: float,
    prev_day_low: float
) -> Optional[Dict[str, Any]]:
    """
    Detects breakout above Previous Day's High (PDH) or breakdown below Previous Day's Low (PDL)
    with a volume surge >= 1.4x 20-period average volume.
    """
    if len(candles_intraday) < 5 or prev_day_high <= 0 or prev_day_low <= 0:
        return None

    latest = candles_intraday[-1]
    curr_close = float(latest["close"])
    curr_high = float(latest["high"])
    curr_low = float(latest["low"])

    vol_stats = calculate_volume_metrics(candles_intraday)
    rvol = vol_stats["rvol"]

    # PDH Breakout
    if curr_close > prev_day_high and rvol >= 1.3:
        stop_loss = round(prev_day_high * 0.995, 2)
        risk = curr_close - stop_loss
        if risk <= 0:
            return None
        target_1 = round(curr_close + 1.5 * risk, 2)
        target_2 = round(curr_close + 2.5 * risk, 2)
        return {
            "setup": "PDH_BREAKOUT_LONG",
            "side": "BUY",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Breakout above Previous Day High (₹{prev_day_high:.2f})",
                f"Heavy volume confirmation: RVOL = {rvol}x average",
                f"Stop-loss placed just below breakout level (₹{stop_loss:.2f})"
            ]
        }

    # PDL Breakdown
    if curr_close < prev_day_low and rvol >= 1.3:
        stop_loss = round(prev_day_low * 1.005, 2)
        risk = stop_loss - curr_close
        if risk <= 0:
            return None
        target_1 = round(curr_close - 1.5 * risk, 2)
        target_2 = round(curr_close - 2.5 * risk, 2)
        return {
            "setup": "PDL_BREAKDOWN_SHORT",
            "side": "SELL",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Breakdown below Previous Day Low (₹{prev_day_low:.2f})",
                f"High volume selling confirmation: RVOL = {rvol}x average",
                f"Stop-loss placed just above breakdown level (₹{stop_loss:.2f})"
            ]
        }

    return None
