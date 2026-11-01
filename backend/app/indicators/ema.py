import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union


def calculate_ema(series: Union[pd.Series, List[float]], period: int) -> pd.Series:
    """
    Computes Exponential Moving Average (EMA) with span=period.
    """
    if isinstance(series, list):
        series = pd.Series(series, dtype=float)

    if series.empty or len(series) < 1:
        return pd.Series(dtype=float)

    return series.ewm(span=period, adjust=False).mean()


def calculate_emas_for_candles(candles: List[Dict[str, Any]]) -> Dict[str, List[float]]:
    """Calculates EMA 9, 21, 50, and 200 for a list of candles."""
    if not candles:
        return {"ema_9": [], "ema_21": [], "ema_50": [], "ema_200": []}

    df = pd.DataFrame(candles)
    closes = df["close"]
    return {
        "ema_9": calculate_ema(closes, 9).tolist(),
        "ema_21": calculate_ema(closes, 21).tolist(),
        "ema_50": calculate_ema(closes, 50).tolist(),
        "ema_200": calculate_ema(closes, 200).tolist()
    }
