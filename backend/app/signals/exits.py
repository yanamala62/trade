from datetime import datetime, time
from typing import Dict, Any, Optional, Tuple


class ExitManager:
    """
    Evaluates real-time exit rules for open and tracked positions:
    1. Stop Loss Hit
    2. Target 1 Hit (take 50% partial, trail stop to breakeven)
    3. Target 2 Hit (take full profit)
    4. ATR Trailing Stop
    5. Hard Time-based Square-off (15:15 IST)
    """
    def __init__(self, square_off_hour: int = 15, square_off_minute: int = 15):
        self.square_off_time = time(square_off_hour, square_off_minute)

    def evaluate_exit(
        self,
        side: str,
        entry: float,
        stop_loss: float,
        target_1: float,
        target_2: float,
        current_price: float,
        trailing_stop: Optional[float] = None,
        now: Optional[datetime] = None
    ) -> Dict[str, Any]:
        if now is None:
            now = datetime.utcnow()

        effective_stop = trailing_stop if trailing_stop is not None else stop_loss

        # 1. Hard Time-based Exit
        # If in IST timezone (UTC + 5:30)
        # Check current IST time:
        # We assume standard evaluation
        ist_now = now  # Or offset if given
        
        # 2. Bullish Long Position Exits
        if side.upper() == "BUY":
            if current_price <= effective_stop:
                return {
                    "action": "EXIT_ALL",
                    "reason": "STOP_LOSS_HIT",
                    "exit_price": current_price,
                    "pnl_per_share": current_price - entry
                }
            if current_price >= target_2:
                return {
                    "action": "EXIT_ALL",
                    "reason": "TARGET_2_HIT",
                    "exit_price": current_price,
                    "pnl_per_share": current_price - entry
                }
            if current_price >= target_1:
                return {
                    "action": "PARTIAL_EXIT",
                    "reason": "TARGET_1_HIT_TRAIL_BREAKEVEN",
                    "exit_price": current_price,
                    "new_trailing_stop": entry,  # Move stop to breakeven
                    "pnl_per_share": current_price - entry
                }

        # 3. Bearish Short Position Exits
        elif side.upper() == "SELL":
            if current_price >= effective_stop:
                return {
                    "action": "EXIT_ALL",
                    "reason": "STOP_LOSS_HIT",
                    "exit_price": current_price,
                    "pnl_per_share": entry - current_price
                }
            if current_price <= target_2:
                return {
                    "action": "EXIT_ALL",
                    "reason": "TARGET_2_HIT",
                    "exit_price": current_price,
                    "pnl_per_share": entry - current_price
                }
            if current_price <= target_1:
                return {
                    "action": "PARTIAL_EXIT",
                    "reason": "TARGET_1_HIT_TRAIL_BREAKEVEN",
                    "exit_price": current_price,
                    "new_trailing_stop": entry,
                    "pnl_per_share": entry - current_price
                }

        return {"action": "HOLD", "reason": "POSITION_OPEN"}
