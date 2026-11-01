import numpy as np
import pandas as pd
from typing import List, Dict, Any


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """
    Computes Average True Range (ATR) using Wilder's smoothing.
    Requires DataFrame with columns: 'high', 'low', 'close'.
    """
    if df.empty or len(df) == 0:
        return pd.Series(dtype=float)

    high = df["high"]
    low = df["low"]
    prev_close = df["close"].shift(1)

    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    atr = true_range.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    return atr.bfill().fillna(0.0)


def calculate_atr_from_candles(candles: List[Dict[str, Any]], period: int = 14) -> List[float]:
    if not candles:
        return []
    df = pd.DataFrame(candles)
    return calculate_atr(df, period).tolist()
