from typing import List, Dict, Any, Optional
from datetime import datetime
from app.patterns.orb import detect_orb_pattern
from app.patterns.vwap_reclaim import detect_vwap_reclaim_pattern
from app.patterns.trend_pullback import detect_trend_pullback_pattern
from app.signals.sizing import calculate_position_size
from app.signals.exits import ExitManager
from app.backtest.costs import calculate_indian_equity_costs
from app.backtest.metrics import compute_performance_metrics


class BacktestReplayEngine:
    """
    Replays historical candles through the identical signal, risk, and exit rules used live.
    Deducts full Indian regulatory taxes, exchange fees, brokerage, and slippage.
    """
    def __init__(self, capital: float = 500000.0, max_risk_pct: float = 1.0):
        self.capital = capital
        self.max_risk_pct = max_risk_pct
        self.exit_manager = ExitManager()

    def run_backtest(
        self, candles: List[Dict[str, Any]], setup_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        if len(candles) < 30:
            return compute_performance_metrics([], self.capital)

        trades: List[Dict[str, Any]] = []
        i = 25  # Warm-up window for indicators
        total_len = len(candles)

        while i < total_len - 5:
            window = candles[:i + 1]
            curr_candle = window[-1]

            # Test setups
            candidate = None
            if not setup_filter or setup_filter == "ORB":
                candidate = detect_orb_pattern(window[-15:])
            if not candidate and (not setup_filter or setup_filter == "VWAP_RECLAIM"):
                candidate = detect_vwap_reclaim_pattern(window)
            if not candidate and (not setup_filter or setup_filter == "TREND_PULLBACK"):
                candidate = detect_trend_pullback_pattern(window)

            if not candidate:
                i += 1
                continue

            entry_price = candidate["entry"]
            stop_loss = candidate["stop_loss"]
            target_1 = candidate["target_1"]
            target_2 = candidate["target_2"]
            side = candidate["side"]

            qty, risk_amount = calculate_position_size(
                capital=self.capital,
                max_risk_pct=self.max_risk_pct,
                entry=entry_price,
                stop_loss=stop_loss
            )

            if qty <= 0:
                i += 1
                continue

            # Forward simulate subsequent candles for trade outcome
            exit_price = entry_price
            exit_reason = "TIME_EXIT"
            trailing_stop = None
            j = i + 1

            while j < min(i + 40, total_len):
                future_bar = candles[j]
                high = float(future_bar["high"])
                low = float(future_bar["low"])
                close = float(future_bar["close"])

                # Check high/low for touches
                check_price = high if side == "BUY" else low
                eval_res = self.exit_manager.evaluate_exit(
                    side=side,
                    entry=entry_price,
                    stop_loss=stop_loss,
                    target_1=target_1,
                    target_2=target_2,
                    current_price=check_price,
                    trailing_stop=trailing_stop
                )

                if eval_res["action"] == "PARTIAL_EXIT":
                    trailing_stop = eval_res.get("new_trailing_stop", entry_price)

                # Check adverse touch
                adverse_price = low if side == "BUY" else high
                adverse_res = self.exit_manager.evaluate_exit(
                    side=side,
                    entry=entry_price,
                    stop_loss=stop_loss,
                    target_1=target_1,
                    target_2=target_2,
                    current_price=adverse_price,
                    trailing_stop=trailing_stop
                )

                if adverse_res["action"] == "EXIT_ALL":
                    exit_price = adverse_res["exit_price"]
                    exit_reason = adverse_res["reason"]
                    break
                elif eval_res["action"] == "EXIT_ALL":
                    exit_price = eval_res["exit_price"]
                    exit_reason = eval_res["reason"]
                    break

                exit_price = close
                j += 1

            # Calculate PnL and Indian transaction costs
            buy_p = entry_price if side == "BUY" else exit_price
            sell_p = exit_price if side == "BUY" else entry_price
            cost_details = calculate_indian_equity_costs(buy_p, sell_p, qty)

            gross_pnl = (sell_p - buy_p) * qty
            net_pnl = round(gross_pnl - cost_details["total_costs"], 2)
            pnl_r = round(net_pnl / risk_amount, 2) if risk_amount > 0 else 0.0

            trades.append({
                "setup": candidate["setup"],
                "side": side,
                "entry": entry_price,
                "exit": exit_price,
                "quantity": qty,
                "risk_amount": risk_amount,
                "gross_pnl": gross_pnl,
                "costs": cost_details["total_costs"],
                "pnl": net_pnl,
                "pnl_r": pnl_r,
                "exit_reason": exit_reason,
                "outcome": "WIN" if net_pnl > 0 else "LOSS"
            })

            i = j + 2  # Jump forward after trade closure

        return compute_performance_metrics(trades, self.capital)
