from typing import List, Dict, Any, Optional
import pandas as pd
from app.indicators.ema import calculate_ema
from app.indicators.rsi import calculate_rsi
from app.indicators.atr import calculate_atr


def detect_trend_pullback_pattern(
    candles: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Detects Trend Pullback to EMA (9 or 21) with RSI filter.
    Long setup: Strong uptrend (EMA 9 > EMA 21 > EMA 50), price tests EMA 21, RSI resets between 40-55.
    Short setup: Strong downtrend (EMA 9 < EMA 21 < EMA 50), price tests EMA 21, RSI resets between 45-60.
    """
    if len(candles) < 52:
        return None

    df = pd.DataFrame(candles)
    ema9 = calculate_ema(df["close"], 9)
    ema21 = calculate_ema(df["close"], 21)
    ema50 = calculate_ema(df["close"], 50)
    rsi14 = calculate_rsi(df["close"], 14)
    atr14 = calculate_atr(df, 14)

    curr_close = float(df["close"].iloc[-1])
    curr_low = float(df["low"].iloc[-1])
    curr_high = float(df["high"].iloc[-1])
    
    e9 = float(ema9.iloc[-1])
    e21 = float(ema21.iloc[-1])
    e50 = float(ema50.iloc[-1])
    rsi = float(rsi14.iloc[-1])
    atr = float(atr14.iloc[-1])

    # Bullish Trend Pullback
    if e9 > e21 > e50:
        # Price pulled back near EMA 21 (within 0.3% or low pierced EMA 21) and closed above
        near_ema21 = curr_low <= e21 * 1.003 and curr_close >= e21 * 0.998
        if near_ema21 and (38.0 <= rsi <= 55.0):
            stop_loss = round(e21 - 1.2 * atr, 2)
            risk = curr_close - stop_loss
            if risk <= 0:
                return None
            target_1 = round(curr_close + 1.5 * risk, 2)
            target_2 = round(curr_close + 2.5 * risk, 2)
            return {
                "setup": "TREND_PULLBACK_LONG",
                "side": "BUY",
                "entry": curr_close,
                "stop_loss": stop_loss,
                "target_1": target_1,
                "target_2": target_2,
                "reasons": [
                    f"Pullback to EMA 21 (₹{e21:.2f}) in established uptrend (EMA9 > EMA21 > EMA50)",
                    f"RSI cooled off to healthy pullback zone ({rsi:.1f})",
                    f"Stop-loss placed 1.2 ATR below EMA 21 (ATR=₹{atr:.2f})"
                ]
            }

    # Bearish Trend Pullback
    if e9 < e21 < e50:
        near_ema21 = curr_high >= e21 * 0.997 and curr_close <= e21 * 1.002
        if near_ema21 and (45.0 <= rsi <= 62.0):
            stop_loss = round(e21 + 1.2 * atr, 2)
            risk = stop_loss - curr_close
            if risk <= 0:
                return None
            target_1 = round(curr_close - 1.5 * risk, 2)
            target_2 = round(curr_close - 2.5 * risk, 2)
            return {
                "setup": "TREND_PULLBACK_SHORT",
                "side": "SELL",
                "entry": curr_close,
                "stop_loss": stop_loss,
                "target_1": target_1,
                "target_2": target_2,
                "reasons": [
                    f"Pullback to EMA 21 (₹{e21:.2f}) in established downtrend (EMA9 < EMA21 < EMA50)",
                    f"RSI rebound to resistance zone ({rsi:.1f})",
                    f"Stop-loss placed 1.2 ATR above EMA 21 (ATR=₹{atr:.2f})"
                ]
            }

    return None
