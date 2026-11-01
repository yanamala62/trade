from typing import List, Dict, Any, Optional
import pandas as pd
from app.indicators.vwap import calculate_vwap
from app.indicators.ema import calculate_ema


def detect_vwap_reclaim_pattern(
    candles: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Detects VWAP Reclaim (Long) or Rejection (Short) aligned with EMA9/EMA21 trend.
    """
    if len(candles) < 22:
        return None

    df = pd.DataFrame(candles)
    vwap_series = calculate_vwap(df)
    ema9_series = calculate_ema(df["close"], 9)
    ema21_series = calculate_ema(df["close"], 21)

    curr_close = float(df["close"].iloc[-1])
    prev_close = float(df["close"].iloc[-2])
    curr_vwap = float(vwap_series.iloc[-1])
    prev_vwap = float(vwap_series.iloc[-2])
    
    curr_ema9 = float(ema9_series.iloc[-1])
    curr_ema21 = float(ema21_series.iloc[-1])

    # Bullish VWAP Reclaim: Previous close was below/at VWAP, current close crosses above VWAP
    # with EMA 9 > EMA 21 (bullish trend filter)
    if prev_close <= prev_vwap and curr_close > curr_vwap and curr_ema9 > curr_ema21:
        stop_loss = round(min(float(df["low"].iloc[-1]), curr_vwap * 0.996), 2)
        risk = curr_close - stop_loss
        if risk <= 0:
            return None
        target_1 = round(curr_close + 1.5 * risk, 2)
        target_2 = round(curr_close + 2.5 * risk, 2)
        return {
            "setup": "VWAP_RECLAIM_LONG",
            "side": "BUY",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Price crossed above VWAP (₹{curr_vwap:.2f}) from below",
                f"Trend aligned: EMA 9 (₹{curr_ema9:.2f}) > EMA 21 (₹{curr_ema21:.2f})",
                f"Stop-loss anchored under candle low / VWAP level"
            ]
        }

    # Bearish VWAP Rejection / Breakdown: Price drops below VWAP with EMA 9 < EMA 21
    if prev_close >= prev_vwap and curr_close < curr_vwap and curr_ema9 < curr_ema21:
        stop_loss = round(max(float(df["high"].iloc[-1]), curr_vwap * 1.004), 2)
        risk = stop_loss - curr_close
        if risk <= 0:
            return None
        target_1 = round(curr_close - 1.5 * risk, 2)
        target_2 = round(curr_close - 2.5 * risk, 2)
        return {
            "setup": "VWAP_REJECTION_SHORT",
            "side": "SELL",
            "entry": curr_close,
            "stop_loss": stop_loss,
            "target_1": target_1,
            "target_2": target_2,
            "reasons": [
                f"Price rejected below VWAP (₹{curr_vwap:.2f})",
                f"Trend aligned: EMA 9 (₹{curr_ema9:.2f}) < EMA 21 (₹{curr_ema21:.2f})",
                f"Stop-loss anchored above candle high / VWAP resistance"
            ]
        }

    return None
