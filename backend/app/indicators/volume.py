import pandas as pd
from typing import List, Dict, Any


def calculate_volume_metrics(candles: List[Dict[str, Any]], ma_period: int = 20) -> Dict[str, float]:
    """
    Computes volume moving average and Relative Volume (RVOL).
    """
    if not candles:
        return {"current_vol": 0.0, "avg_vol": 0.0, "rvol": 1.0}

    df = pd.DataFrame(candles)
    vols = df["volume"]
    if len(vols) == 0:
        return {"current_vol": 0.0, "avg_vol": 0.0, "rvol": 1.0}

    curr_vol = float(vols.iloc[-1])
    avg_vol = float(vols.rolling(window=min(len(vols), ma_period)).mean().iloc[-1])
    
    rvol = round(curr_vol / avg_vol, 2) if avg_vol > 0 else 1.0
    return {
        "current_vol": curr_vol,
        "avg_vol": round(avg_vol, 1),
        "rvol": rvol
    }
