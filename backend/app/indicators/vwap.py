import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union


def calculate_vwap(df: pd.DataFrame) -> pd.Series:
    """
    Computes intraday Volume Weighted Average Price (VWAP).
    Requires DataFrame with columns: 'high', 'low', 'close', 'volume'.
    """
    if df.empty or len(df) == 0:
        return pd.Series(dtype=float)

    # Calculate typical price
    typical_price = (df["high"] + df["low"] + df["close"]) / 3.0
    tp_vol = typical_price * df["volume"]

    # If datetime index is available, group by date, else cumulative sum
    cum_tp_vol = tp_vol.cumsum()
    cum_vol = df["volume"].cumsum()

    # Avoid zero division
    cum_vol_safe = cum_vol.replace(0, np.nan)
    vwap = cum_tp_vol / cum_vol_safe
    return vwap.ffill().fillna(typical_price)


def calculate_vwap_from_candles(candles: List[Dict[str, Any]]) -> List[float]:
    """Helper accepting list of candle dicts."""
    if not candles:
        return []
    df = pd.DataFrame(candles)
    return calculate_vwap(df).tolist()
