from typing import List, Dict, Any
import numpy as np


def compute_performance_metrics(trades: List[Dict[str, Any]], initial_capital: float = 500000.0) -> Dict[str, Any]:
    """
    Computes rigorous performance statistics from a list of simulated trade records.
    Each trade dict has: pnl (net of costs), pnl_r (multiple of R risk), outcome ("WIN" or "LOSS").
    """
    if not trades:
        return {
            "total_trades": 0,
            "wins": 0,
            "losses": 0,
            "win_rate": 0.0,
            "avg_win": 0.0,
            "avg_loss": 0.0,
            "profit_factor": 0.0,
            "expectancy_inr": 0.0,
            "expectancy_r": 0.0,
            "net_pnl": 0.0,
            "max_drawdown_inr": 0.0,
            "max_drawdown_pct": 0.0,
            "longest_losing_streak": 0,
            "equity_curve": [initial_capital]
        }

    pnls = [t["pnl"] for t in trades]
    pnl_rs = [t.get("pnl_r", 0.0) for t in trades]
    total_trades = len(trades)

    winning_pnls = [p for p in pnls if p > 0]
    losing_pnls = [p for p in pnls if p < 0]

    wins = len(winning_pnls)
    losses = len(losing_pnls)
    win_rate = round(wins / total_trades, 4) if total_trades > 0 else 0.0

    gross_profit = sum(winning_pnls)
    gross_loss = abs(sum(losing_pnls))
    net_pnl = round(sum(pnls), 2)

    avg_win = round(float(np.mean(winning_pnls)), 2) if winning_pnls else 0.0
    avg_loss = round(float(np.mean(losing_pnls)), 2) if losing_pnls else 0.0

    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (99.0 if gross_profit > 0 else 0.0)

    # Expectancy in INR
    loss_rate = 1.0 - win_rate
    expectancy_inr = round((win_rate * avg_win) + (loss_rate * avg_loss), 2)  # avg_loss is negative

    # Expectancy in R
    expectancy_r = round(float(np.mean(pnl_rs)), 2) if pnl_rs else 0.0

    # Drawdown and equity curve calculation
    equity = initial_capital
    equity_curve = [initial_capital]
    peak = initial_capital
    max_dd_inr = 0.0
    max_dd_pct = 0.0

    for p in pnls:
        equity += p
        equity_curve.append(round(equity, 2))
        if equity > peak:
            peak = equity
        dd_inr = peak - equity
        dd_pct = (dd_inr / peak) * 100.0 if peak > 0 else 0.0
        if dd_inr > max_dd_inr:
            max_dd_inr = dd_inr
        if dd_pct > max_dd_pct:
            max_dd_pct = dd_pct

    # Longest losing streak
    longest_losing_streak = 0
    curr_streak = 0
    for p in pnls:
        if p <= 0:
            curr_streak += 1
            if curr_streak > longest_losing_streak:
                longest_losing_streak = curr_streak
        else:
            curr_streak = 0

    return {
        "total_trades": total_trades,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "profit_factor": profit_factor,
        "expectancy_inr": expectancy_inr,
        "expectancy_r": expectancy_r,
        "net_pnl": net_pnl,
        "max_drawdown_inr": round(max_dd_inr, 2),
        "max_drawdown_pct": round(max_dd_pct, 2),
        "longest_losing_streak": longest_losing_streak,
        "equity_curve": equity_curve
    }
