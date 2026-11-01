from typing import Dict, Any, List, Optional
from datetime import datetime, time


def check_max_loss_per_trade(risk_amount: float, capital: float, max_loss_pct: float) -> Dict[str, Any]:
    allowed_max = capital * (max_loss_pct / 100.0)
    passed = risk_amount <= (allowed_max + 1.0)  # minor rounding buffer
    return {
        "rule": "MAX_LOSS_PER_TRADE",
        "passed": passed,
        "detail": f"Risk ₹{risk_amount:.2f} vs Allowed ₹{allowed_max:.2f} ({max_loss_pct}% of capital)"
    }


def check_daily_loss_limit(cumulative_loss_today: float, capital: float, max_daily_loss_pct: float) -> Dict[str, Any]:
    max_loss_allowed = capital * (max_daily_loss_pct / 100.0)
    passed = cumulative_loss_today < max_loss_allowed
    return {
        "rule": "DAILY_LOSS_LIMIT",
        "passed": passed,
        "detail": f"Daily loss so far ₹{cumulative_loss_today:.2f} vs Limit ₹{max_loss_allowed:.2f}"
    }


def check_max_trades_per_day(trades_taken_today: int, max_trades: int) -> Dict[str, Any]:
    passed = trades_taken_today < max_trades
    return {
        "rule": "MAX_TRADES_PER_DAY",
        "passed": passed,
        "detail": f"Trades taken today: {trades_taken_today} / {max_trades}"
    }


def check_reward_to_risk(reward_risk: float, min_rr: float = 1.5) -> Dict[str, Any]:
    passed = reward_risk >= min_rr
    return {
        "rule": "MIN_REWARD_TO_RISK",
        "passed": passed,
        "detail": f"Reward:Risk {reward_risk:.2f} vs Required {min_rr:.2f}"
    }


def check_no_trade_time_window(
    ist_time: datetime, open_min_buffer: int = 5, close_min_buffer: int = 15
) -> Dict[str, Any]:
    t = ist_time.time()
    # Market open: 09:15
    market_open = time(9, 15)
    trade_start = time(9, 15 + open_min_buffer)
    # Market close: 15:30
    trade_stop = time(15, 30 - close_min_buffer)

    if t < trade_start:
        return {
            "rule": "NO_TRADE_TIME_WINDOW",
            "passed": False,
            "detail": f"Current time {t.strftime('%H:%M')} is in market opening buffer (before {trade_start.strftime('%H:%M')})"
        }
    if t > trade_stop:
        return {
            "rule": "NO_TRADE_TIME_WINDOW",
            "passed": False,
            "detail": f"Current time {t.strftime('%H:%M')} is in closing cutoff buffer (after {trade_stop.strftime('%H:%M')})"
        }

    return {
        "rule": "NO_TRADE_TIME_WINDOW",
        "passed": True,
        "detail": f"Time {t.strftime('%H:%M')} is within active trading session window"
    }


def check_stale_data(last_tick_age_seconds: float, max_allowed_seconds: float = 5.0) -> Dict[str, Any]:
    passed = last_tick_age_seconds <= max_allowed_seconds
    return {
        "rule": "STALE_DATA_CHECK",
        "passed": passed,
        "detail": f"Last tick age {last_tick_age_seconds:.2f}s vs max threshold {max_allowed_seconds:.2f}s"
    }


def check_liquidity_and_spread(bid: float, ask: float, max_spread_pct: float = 0.25) -> Dict[str, Any]:
    if bid <= 0 or ask <= 0:
        return {
            "rule": "LIQUIDITY_AND_SPREAD",
            "passed": False,
            "detail": "Invalid bid/ask pricing"
        }
    spread_pct = ((ask - bid) / bid) * 100.0
    passed = spread_pct <= max_spread_pct
    return {
        "rule": "LIQUIDITY_AND_SPREAD",
        "passed": passed,
        "detail": f"Bid-Ask spread {spread_pct:.3f}% vs max allowed {max_spread_pct}%"
    }


def check_consecutive_loss_cooldown(consecutive_losses: int, max_consecutive: int = 3) -> Dict[str, Any]:
    passed = consecutive_losses < max_consecutive
    return {
        "rule": "CONSECUTIVE_LOSS_COOLDOWN",
        "passed": passed,
        "detail": f"Consecutive losses: {consecutive_losses} (cooling off if >= {max_consecutive})"
    }
