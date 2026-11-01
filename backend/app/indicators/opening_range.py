from datetime import datetime, time
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd


def calculate_opening_range(
    candles: List[Dict[str, Any]], range_minutes: int = 15
) -> Optional[Tuple[float, float, float]]:
    """
    Computes Opening Range High, Low, and Midpoint from the first N minutes of the trading day.
    Assumes standard NSE market opening at 09:15 IST.
    Returns: (or_high, or_low, or_mid) or None if insufficient candles.
    """
    if not candles:
        return None

    # Sort candles by timestamp
    sorted_candles = sorted(candles, key=lambda x: x["timestamp"])
    
    # Take first candles up to range_minutes
    or_high = -float("inf")
    or_low = float("inf")
    accumulated_minutes = 0

    for c in sorted_candles:
        # Determine timeframe interval if available, default to 5m
        tf = c.get("timeframe", "5m")
        interval = 1 if tf == "1m" else (5 if tf == "5m" else 15)
        
        or_high = max(or_high, float(c["high"]))
        or_low = min(or_low, float(c["low"]))
        accumulated_minutes += interval

        if accumulated_minutes >= range_minutes:
            break

    if or_high == -float("inf") or or_low == float("inf"):
        return None

    or_mid = round((or_high + or_low) / 2.0, 2)
    return (round(or_high, 2), round(or_low, 2), or_mid)
