from typing import Tuple
import math


def calculate_position_size(
    capital: float,
    max_risk_pct: float,
    entry: float,
    stop_loss: float,
    margin_multiplier: float = 5.0  # 5x intraday MIS leverage
) -> Tuple[int, float]:
    """
    Computes position size (quantity) strictly constrained by risk amount and margin limits.
    Returns: (quantity, actual_risk_amount)
    """
    if entry <= 0 or stop_loss <= 0 or entry == stop_loss:
        return 0, 0.0

    risk_per_share = abs(entry - stop_loss)
    max_rupee_risk = capital * (max_risk_pct / 100.0)

    # Risk-based sizing
    qty_by_risk = math.floor(max_rupee_risk / risk_per_share)

    # Capital / Margin cap: Trade value cannot exceed capital * margin_multiplier
    max_purchasable_qty = math.floor((capital * margin_multiplier) / entry)

    # Final bounded quantity
    qty = max(1, min(qty_by_risk, max_purchasable_qty))
    actual_risk = round(qty * risk_per_share, 2)

    return qty, actual_risk
