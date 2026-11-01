from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings
from app.risk.rules import (
    check_max_loss_per_trade,
    check_daily_loss_limit,
    check_max_trades_per_day,
    check_reward_to_risk,
    check_no_trade_time_window,
    check_stale_data,
    check_liquidity_and_spread,
    check_consecutive_loss_cooldown
)


class RiskGate:
    """
    Central Risk Gate. Sits in front of every trade suggestion.
    Evaluates risk rules and returns PASS or BLOCK with the exact reasons.
    """
    def __init__(self, config_settings=None):
        self.cfg = config_settings or settings
        self.daily_loss_so_far = 0.0
        self.trades_taken_today = 0
        self.consecutive_losses = 0

    def evaluate_suggestion(
        self,
        risk_amount: float,
        reward_risk: float,
        bid: float = 0.0,
        ask: float = 0.0,
        last_tick_age: float = 0.0,
        evaluation_time: Optional[datetime] = None,
        bypass_market_hours: bool = False
    ) -> Dict[str, Any]:
        eval_time = evaluation_time or datetime.utcnow()
        checks: List[Dict[str, Any]] = []

        # 1. Max loss per trade
        checks.append(check_max_loss_per_trade(
            risk_amount=risk_amount,
            capital=self.cfg.CAPITAL,
            max_loss_pct=self.cfg.MAX_RISK_PER_TRADE_PCT
        ))

        # 2. Daily loss limit
        checks.append(check_daily_loss_limit(
            cumulative_loss_today=self.daily_loss_so_far,
            capital=self.cfg.CAPITAL,
            max_daily_loss_pct=self.cfg.MAX_DAILY_LOSS_PCT
        ))

        # 3. Max trades per day
        checks.append(check_max_trades_per_day(
            trades_taken_today=self.trades_taken_today,
            max_trades=self.cfg.MAX_TRADES_PER_DAY
        ))

        # 4. Minimum reward-to-risk
        checks.append(check_reward_to_risk(
            reward_risk=reward_risk,
            min_rr=self.cfg.MIN_REWARD_TO_RISK
        ))

        # 5. Stale data check
        checks.append(check_stale_data(
            last_tick_age_seconds=last_tick_age,
            max_allowed_seconds=self.cfg.STALE_DATA_TIMEOUT_SECONDS
        ))

        # 6. Liquidity and spread
        if bid > 0 and ask > 0:
            checks.append(check_liquidity_and_spread(bid, ask))

        # 7. Consecutive loss cooldown
        checks.append(check_consecutive_loss_cooldown(
            consecutive_losses=self.consecutive_losses
        ))

        # 8. Time window (skip if in simulated replay/test)
        if not bypass_market_hours:
            checks.append(check_no_trade_time_window(
                ist_time=eval_time,
                open_min_buffer=self.cfg.NO_TRADE_OPEN_MINUTES,
                close_min_buffer=self.cfg.NO_TRADE_CLOSE_MINUTES
            ))

        # Determine overall verdict
        failed_checks = [c for c in checks if not c["passed"]]
        status = "BLOCK" if failed_checks else "PASS"

        return {
            "status": status,
            "passed": status == "PASS",
            "checks": checks,
            "failed_checks": failed_checks,
            "summary": "All risk parameters validated" if status == "PASS" else f"Blocked by {len(failed_checks)} risk rules"
        }
