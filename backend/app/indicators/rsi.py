import numpy as np
import pandas as pd
from typing import List, Union


def calculate_rsi(series: Union[pd.Series, List[float]], period: int = 14) -> pd.Series:
    """
    Computes Wilder's Relative Strength Index (RSI).
    """
    if isinstance(series, list):
        series = pd.Series(series, dtype=float)

    if len(series) < period + 1:
        return pd.Series([50.0] * len(series), index=series.index)

    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)

    # Wilder's exponential smoothing
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()

    # When avg_loss == 0, if avg_gain > 0, RSI is 100.0; if avg_gain == 0, RSI is 50.0
    with np.errstate(divide='ignore', invalid='ignore'):
        rs = avg_gain / avg_loss
        rsi = 100.0 - (100.0 / (1.0 + rs))
        # Handle zero loss: if loss is 0 and gain > 0, RSI is 100
        rsi = rsi.where(avg_loss != 0, np.where(avg_gain > 0, 100.0, 50.0))
        # Warmup period before min_periods
        return rsi.fillna(50.0)
