import pytest
from app.backtest.costs import calculate_indian_equity_costs
from app.backtest.metrics import compute_performance_metrics


def test_indian_equity_cost_calculation():
    # Buy 100 shares @ ₹2000, sell @ ₹2020 (Turnover = 200,000 + 202,000 = 402,000)
    costs = calculate_indian_equity_costs(
        buy_price=2000.0,
        sell_price=2020.0,
        quantity=100,
        slippage_pct=0.05
    )
    # Total costs must include brokerage (₹40), STT, exchange charges, GST, stamp duty, slippage
    assert costs["brokerage"] == 40.0
    assert costs["stt"] > 0
    assert costs["exchange_charges"] > 0
    assert costs["gst"] > 0
    assert costs["stamp_duty"] > 0
    assert costs["total_costs"] > 100.0


def test_performance_metrics():
    trades = [
        {"pnl": 1500.0, "pnl_r": 1.5, "outcome": "WIN"},
        {"pnl": -1000.0, "pnl_r": -1.0, "outcome": "LOSS"},
        {"pnl": 2000.0, "pnl_r": 2.0, "outcome": "WIN"},
        {"pnl": -1000.0, "pnl_r": -1.0, "outcome": "LOSS"}
    ]
    metrics = compute_performance_metrics(trades, initial_capital=500000.0)
    assert metrics["total_trades"] == 4
    assert metrics["wins"] == 2
    assert metrics["losses"] == 2
    assert metrics["win_rate"] == 0.50
    assert metrics["net_pnl"] == 1500.0
    # Gross profit = 3500, Gross loss = 2000 -> PF = 1.75
    assert metrics["profit_factor"] == 1.75
    # Expectancy in R: (1.5 - 1.0 + 2.0 - 1.0) / 4 = 1.5 / 4 = 0.38
    assert metrics["expectancy_r"] == 0.38
