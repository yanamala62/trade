import pytest
from app.risk.gate import RiskGate
from app.risk.rules import (
    check_max_loss_per_trade,
    check_daily_loss_limit,
    check_reward_to_risk,
    check_stale_data,
    check_liquidity_and_spread
)


def test_max_loss_per_trade_rule():
    capital = 500000.0
    max_loss_pct = 1.0  # ₹5,000 max allowed

    # Passing test: risk ₹3,000
    res_pass = check_max_loss_per_trade(3000.0, capital, max_loss_pct)
    assert res_pass["passed"] is True

    # Blocking test: risk ₹7,500
    res_block = check_max_loss_per_trade(7500.0, capital, max_loss_pct)
    assert res_block["passed"] is False


def test_reward_to_risk_rule():
    # Passing test: R:R = 1.8 >= 1.5
    assert check_reward_to_risk(1.8, min_rr=1.5)["passed"] is True
    # Blocking test: R:R = 1.2 < 1.5
    assert check_reward_to_risk(1.2, min_rr=1.5)["passed"] is False


def test_stale_data_rule():
    # Passing test: tick age 1.2s <= 5.0s
    assert check_stale_data(1.2, max_allowed_seconds=5.0)["passed"] is True
    # Blocking test: tick age 8.5s > 5.0s
    assert check_stale_data(8.5, max_allowed_seconds=5.0)["passed"] is False


def test_spread_rule():
    # 0.1% spread -> PASS
    assert check_liquidity_and_spread(bid=100.0, ask=100.10, max_spread_pct=0.25)["passed"] is True
    # 0.8% spread -> BLOCK
    assert check_liquidity_and_spread(bid=100.0, ask=100.80, max_spread_pct=0.25)["passed"] is False


def test_risk_gate_overall_pass_and_block():
    gate = RiskGate()
    
    # PASS condition
    eval_pass = gate.evaluate_suggestion(
        risk_amount=2500.0,
        reward_risk=1.8,
        bid=100.0,
        ask=100.1,
        last_tick_age=1.0,
        bypass_market_hours=True
    )
    assert eval_pass["status"] == "PASS"

    # BLOCK condition: excessive risk
    eval_block = gate.evaluate_suggestion(
        risk_amount=15000.0,  # exceeds 1% of 500k
        reward_risk=1.8,
        bid=100.0,
        ask=100.1,
        last_tick_age=1.0,
        bypass_market_hours=True
    )
    assert eval_block["status"] == "BLOCK"
    assert len(eval_block["failed_checks"]) >= 1
