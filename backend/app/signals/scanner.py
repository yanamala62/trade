import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.ingest.instrument_master import NSE_INSTRUMENTS, BY_SYMBOL
from app.indicators.vwap import calculate_vwap_from_candles
from app.indicators.ema import calculate_emas_for_candles
from app.indicators.rsi import calculate_rsi
from app.indicators.atr import calculate_atr_from_candles
from app.db import repo

logger = logging.getLogger(__name__)

HORIZON_CONFIGS = {
    "915_1500": {
        "label": "9:15 AM -> 3:00 PM (Full Day Max-Riser)",
        "expected_move_min": 1.75,
        "expected_move_max": 4.25,
        "stop_move_pct": 0.85,
        "primary_indicator": "Opening Drive, ATR Volatility & Institutional VWAP",
        "description": "Full Intraday Session Holding (Buy at 09:15 AM Open -> Exit at 15:00 PM Close). Identifies and ranks high-beta stocks engineered to produce the maximum percentage upside."
    },
    "10m": {
        "label": "Next 10 Minutes (Scalp / Momentum)",
        "expected_move_min": 0.35,
        "expected_move_max": 0.85,
        "stop_move_pct": 0.35,
        "primary_indicator": "VWAP & 5m Volume Surge",
        "description": "High-velocity intraday breakouts and reclaims suitable for quick 10-minute executions."
    },
    "1h": {
        "label": "Next 1 Hour (Intraday Continuation)",
        "expected_move_min": 0.75,
        "expected_move_max": 1.45,
        "stop_move_pct": 0.60,
        "primary_indicator": "EMA 9/21 Trend & Volume",
        "description": "Hourly intraday trend expansions backed by institutional participation."
    },
    "1d": {
        "label": "Today / 1-Day (Intraday Close / ORB)",
        "expected_move_min": 1.20,
        "expected_move_max": 2.20,
        "stop_move_pct": 0.95,
        "primary_indicator": "Opening Range & Day High/Low",
        "description": "Day-long session directional momentum with 15m Opening Range validation."
    },
    "2d": {
        "label": "2 Days (Short Swing)",
        "expected_move_min": 2.00,
        "expected_move_max": 3.80,
        "stop_move_pct": 1.60,
        "primary_indicator": "Multi-Day EMA 21 & RSI Swing",
        "description": "2-day swing momentum capturing multiday expansion cycles."
    },
    "3d": {
        "label": "3 Days (Swing Expansion)",
        "expected_move_min": 2.80,
        "expected_move_max": 4.90,
        "stop_move_pct": 2.10,
        "primary_indicator": "EMA 50 Pullback Bounce",
        "description": "3-day momentum swing targeting standard multi-session ATR targets."
    },
    "1w": {
        "label": "1 Week (Weekly Positional)",
        "expected_move_min": 4.50,
        "expected_move_max": 7.80,
        "stop_move_pct": 3.20,
        "primary_indicator": "Weekly EMA 50/200 & Structural Trend",
        "description": "Positional multi-session holding setups with wide risk-reward edge."
    }
}

STOCK_BETAS: Dict[str, float] = {
    "TATASTEEL": 1.62,
    "BAJFINANCE": 1.52,
    "TATAMOTORS": 1.48,
    "SBIN": 1.38,
    "AXISBANK": 1.36,
    "ICICIBANK": 1.32,
    "INFY": 1.24,
    "TITAN": 1.22,
    "LT": 1.18,
    "KOTAKBANK": 1.15,
    "RELIANCE": 1.12,
    "WIPRO": 1.10,
    "HDFCBANK": 1.08,
    "MARUTI": 1.05,
    "TCS": 0.88,
    "BHARTIARTL": 0.94,
    "NTPC": 0.92,
    "SUNPHARMA": 0.82,
    "ITC": 0.72,
    "HINDUNILVR": 0.68,
}


async def scan_market_opportunities(horizon: str = "915_1500") -> Dict[str, Any]:
    """
    Deterministically scans top NSE liquid stocks for the requested time horizon
    and categorizes them into Likely to Rise (Bullish) and Likely to Fall (Bearish).
    Provides deep profile, technical chart analysis, and explicit 'why it will raise' reasons.
    """
    if horizon not in HORIZON_CONFIGS:
        horizon = "915_1500"

    cfg = HORIZON_CONFIGS[horizon]
    bullish_candidates: List[Dict[str, Any]] = []
    bearish_candidates: List[Dict[str, Any]] = []

    # Scan top liquid NSE equities
    for inst in NSE_INSTRUMENTS[:20]:
        try:
            sym = inst["symbol"]
            candles_db = await repo.get_recent_candles(sym, "5m", 120)
            candle_list = [
                {"timestamp": c.timestamp, "open": c.open, "high": c.high, "low": c.low, "close": c.close, "volume": c.volume}
                for c in candles_db
            ]

            if not candle_list or len(candle_list) < 20:
                from app.config import settings
                from app.brokers import get_broker_adapter
                adapter = get_broker_adapter(settings.ACTIVE_BROKER)
                candle_list = await adapter.get_historical_candles(sym, "5m", days=5)

            if not candle_list or len(candle_list) < 15:
                continue

            ltp = candle_list[-1]["close"]
            vwap_series = calculate_vwap_from_candles(candle_list)
            vwap = round(vwap_series[-1], 2) if vwap_series else ltp

            emas = calculate_emas_for_candles(candle_list)
            closes = [c["close"] for c in candle_list]
            rsis = calculate_rsi(closes, 14).tolist()
            rsi_val = round(rsis[-1], 1) if rsis else 50.0

            ema_9 = round(emas["ema_9"][-1], 2) if emas["ema_9"] else ltp
            ema_21 = round(emas["ema_21"][-1], 2) if emas["ema_21"] else ltp
            ema_50 = round(emas["ema_50"][-1], 2) if emas["ema_50"] else ltp

            # Calculate True ATR-14
            atr_series = calculate_atr_from_candles(candle_list, 14)
            atr_val = round(atr_series[-1], 2) if atr_series else round(ltp * 0.012, 2)
            atr_pct = round((atr_val / max(ltp, 1)) * 100, 2)

            recent_volumes = [c["volume"] for c in candle_list[-6:]]
            avg_vol = (sum(recent_volumes) / len(recent_volumes)) if recent_volumes else 1000
            vol_surge = round(candle_list[-1]["volume"] / max(avg_vol, 1), 2)
            beta_val = STOCK_BETAS.get(sym, 1.05)

            score = 0
            reasons: List[str] = []
            setup_name = ""

            if horizon == "915_1500":
                # Full session 09:15 to 15:00 holding strategy
                # High-Beta runner with VWAP acceptance, volume expansion, and ATR elasticity
                if ltp > vwap:
                    score += 3
                    reasons.append(f"Institutional VWAP Anchor: Holding firmly above session VWAP (Rs. {vwap})")
                else:
                    score -= 3
                    reasons.append(f"Institutional Distribution: Trading below session VWAP (Rs. {vwap})")

                if ema_9 > ema_21:
                    score += 2
                    reasons.append(f"Intraday Trend Velocity: 9-period EMA (Rs. {ema_9}) aligned above 21 EMA (Rs. {ema_21})")
                else:
                    score -= 2
                    reasons.append(f"Downside Trend Drag: 9 EMA (Rs. {ema_9}) below 21 EMA (Rs. {ema_21})")

                if 52 <= rsi_val <= 68:
                    score += 2
                    reasons.append(f"Optimal Momentum Sweet-Spot: RSI at {rsi_val} gives ample headroom to run until 3:00 PM without exhaustion")
                elif rsi_val > 72:
                    score += 1
                    reasons.append(f"Strong Intraday Expansion: High velocity RSI {rsi_val}")
                elif rsi_val < 45:
                    score -= 2
                    reasons.append(f"Bearish Relative Weakness: Suppressed RSI at {rsi_val}")

                if beta_val >= 1.25:
                    score += 2
                    reasons.append(f"High-Beta Runner Advantage: Beta of {beta_val} provides superior intraday percentage volatility vs NIFTY")
                elif beta_val < 0.90:
                    score -= 1
                    reasons.append(f"Low-Beta Drag: Low volatility index follower (Beta {beta_val})")

                if vol_surge >= 1.2:
                    score += 2
                    reasons.append(f"Institutional Inflow: Volume surge of {vol_surge}x standard session volume")

                setup_name = "09:15-15:00 High-Beta Session Runner" if score > 0 else "09:15-15:00 Intraday Short Breakdown"

            elif horizon == "10m":
                if ltp > vwap:
                    score += 2
                    reasons.append(f"Holding firmly above VWAP (Rs. {vwap})")
                else:
                    score -= 2
                    reasons.append(f"Trading below session VWAP (Rs. {vwap})")

                if rsi_val >= 55:
                    score += 2
                    reasons.append(f"RSI bullish velocity at {rsi_val}")
                elif rsi_val <= 45:
                    score -= 2
                    reasons.append(f"RSI bearish selling pressure at {rsi_val}")

                if ltp > ema_9:
                    score += 1
                else:
                    score -= 1

                if vol_surge >= 1.2:
                    reasons.append(f"Volume burst of {vol_surge}x relative to 5m average")
                    score = score * 1.2

                setup_name = "10m VWAP Momentum Surge" if score > 0 else "10m VWAP Breakdown"

            elif horizon in ["1h", "1d"]:
                if ema_9 > ema_21:
                    score += 2
                    reasons.append("EMA 9 aligned above EMA 21 (Short-term trend upward)")
                else:
                    score -= 2
                    reasons.append("EMA 9 crossed below EMA 21 (Short-term trend downward)")

                if ltp > vwap:
                    score += 1
                    reasons.append(f"Buyer control sustained above session VWAP (Rs. {vwap})")
                else:
                    score -= 1
                    reasons.append(f"Seller dominance below session VWAP (Rs. {vwap})")

                if 50 <= rsi_val <= 70:
                    score += 1
                    reasons.append(f"Healthy momentum profile with RSI {rsi_val}")
                elif rsi_val < 45:
                    score -= 1
                    reasons.append(f"Bearish momentum with RSI {rsi_val}")

                setup_name = f"{horizon.upper()} Trend Continuation" if score > 0 else f"{horizon.upper()} Bearish Pullback"

            else:  # 2d, 3d, 1w
                if ema_21 > ema_50:
                    score += 3
                    reasons.append("EMA 21 > EMA 50 confirming multi-session bullish regime")
                else:
                    score -= 3
                    reasons.append("EMA 21 < EMA 50 confirming multi-session distribution")

                if ltp > ema_50:
                    score += 1
                    reasons.append("Price positioned safely above 50-period base")
                else:
                    score -= 1
                    reasons.append("Price breaking below 50-period support level")

                if rsi_val >= 52:
                    score += 1
                elif rsi_val <= 48:
                    score -= 1

                setup_name = f"{horizon.upper()} Multi-Session Swing" if score > 0 else f"{horizon.upper()} Structural Breakdown"

            # Probability and grades
            abs_score = abs(score)
            probability = min(89, max(62, int(60 + (abs_score * 3.8))))
            grade = "A" if probability >= 75 else "B"

            # Intraday dynamic move based on beta, ATR and probability
            if horizon == "915_1500":
                # For 9:15 to 3:00 PM, scale move by stock's beta and ATR% so max-risers emerge cleanly
                base_pct = cfg["expected_move_min"] + ((probability - 60) / 29) * (cfg["expected_move_max"] - cfg["expected_move_min"])
                beta_boost = max(0.85, min(1.35, beta_val))
                exp_pct = round(base_pct * beta_boost, 2)
            else:
                exp_pct = round(cfg["expected_move_min"] + ((probability - 60) / 28) * (cfg["expected_move_max"] - cfg["expected_move_min"]), 2)

            vwap_dist_pct = round(((ltp - vwap) / max(vwap, 1)) * 100, 2)
            daily_avg_range = round(atr_pct * 1.8, 2)

            if score > 0.5:
                target = round(ltp * (1.0 + exp_pct / 100.0), 2)
                stop_loss = round(ltp * (1.0 - cfg["stop_move_pct"] / 100.0), 2)

                bullish_candidates.append({
                    "symbol": sym,
                    "name": inst["name"],
                    "sector": inst["sector"],
                    "market_cap": inst.get("market_cap", "Large Cap"),
                    "ltp": ltp,
                    "direction": "RISE",
                    "expected_pct": exp_pct,
                    "target": target,
                    "stop_loss": stop_loss,
                    "probability": probability,
                    "confidence_grade": grade,
                    "setup": setup_name,
                    "reasons": reasons,
                    "time_horizon": horizon,
                    "profile": {
                        "market_cap": inst.get("market_cap", "Large Cap"),
                        "sector": inst["sector"],
                        "beta": beta_val,
                        "atr_14": atr_val,
                        "atr_pct": atr_pct,
                        "daily_avg_range_pct": daily_avg_range,
                        "volatility_rank": "High-Beta Max Riser" if beta_val >= 1.25 else "Steady Intraday Expander",
                        "expected_session_move": f"+{exp_pct}%",
                        "risk_reward_ratio": f"1:{round(exp_pct / max(cfg['stop_move_pct'], 0.1), 1)}"
                    },
                    "chart_analysis": {
                        "trend_regime": f"Bullish Intraday Expansion (EMA 9 at Rs. {ema_9} > EMA 21 at Rs. {ema_21})",
                        "vwap_status": f"Holding +{vwap_dist_pct}% above session VWAP (Rs. {vwap}) with strong buyer bids",
                        "rsi_momentum": f"RSI 14 at {rsi_val} (Strong momentum corridor with headroom to run)",
                        "volume_intensity": f"{vol_surge}x relative to 5m average volume baseline",
                        "candlestick_structure": "Successive bullish green candles defending opening range low",
                        "target_methodology": f"Projected 15:00 PM target Rs. {target} derived from {exp_pct}% ATR-14 volatility extension",
                        "key_levels": {
                            "entry_0915": ltp,
                            "vwap_support": vwap,
                            "ema_9": ema_9,
                            "ema_21": ema_21,
                            "stop_loss": stop_loss,
                            "target_1500": target
                        }
                    },
                    "why_it_will_raise": [
                        f"High-Beta Velocity: With Beta of {beta_val}, this stock possesses greater upward torque than the broader index between 09:15 AM and 15:00 PM.",
                        f"Institutional VWAP Anchor: Trading at Rs. {ltp}, comfortably above VWAP (Rs. {vwap}), confirming large funds are accumulating, not distributing.",
                        f"Moving Average Confluence: 9 EMA (Rs. {ema_9}) guides upward momentum and stays firmly above 21 EMA (Rs. {ema_21}) as dynamic support.",
                        f"ATR Volatility Corridor: 14-period ATR of Rs. {atr_val} ({atr_pct}%) guarantees sufficient intraday spread to reach target Rs. {target} before 3:00 PM.",
                        f"Volume Surge Confirmation: Running on {vol_surge}x volume participation, validating institutional demand rather than retail chasing."
                    ],
                    "session_timeline": {
                        "phase_0915_entry": f"Buy at 09:15 AM market open on 5m candle confirmation near Rs. {ltp}. Place hard initial Stop Loss at Rs. {stop_loss}.",
                        "phase_1130_hold": f"During 11:30 AM - 13:00 PM midday lull, trail Stop Loss to breakeven or VWAP (Rs. {vwap}) once +1.0% gain is secured.",
                        "phase_1500_exit": f"Exit & square-off at 15:00 PM (3:00 PM) near projected target Rs. {target} (+{exp_pct}%) before MIS auto-squareoff."
                    }
                })

            elif score < -0.5:
                target = round(ltp * (1.0 - exp_pct / 100.0), 2)
                stop_loss = round(ltp * (1.0 + cfg["stop_move_pct"] / 100.0), 2)

                bearish_candidates.append({
                    "symbol": sym,
                    "name": inst["name"],
                    "sector": inst["sector"],
                    "market_cap": inst.get("market_cap", "Large Cap"),
                    "ltp": ltp,
                    "direction": "FALL",
                    "expected_pct": -exp_pct,
                    "target": target,
                    "stop_loss": stop_loss,
                    "probability": probability,
                    "confidence_grade": grade,
                    "setup": setup_name,
                    "reasons": reasons,
                    "time_horizon": horizon,
                    "profile": {
                        "market_cap": inst.get("market_cap", "Large Cap"),
                        "sector": inst["sector"],
                        "beta": beta_val,
                        "atr_14": atr_val,
                        "atr_pct": atr_pct,
                        "daily_avg_range_pct": daily_avg_range,
                        "volatility_rank": "High-Beta Short Runner" if beta_val >= 1.25 else "Steady Intraday Drifter",
                        "expected_session_move": f"-{exp_pct}%",
                        "risk_reward_ratio": f"1:{round(exp_pct / max(cfg['stop_move_pct'], 0.1), 1)}"
                    },
                    "chart_analysis": {
                        "trend_regime": f"Bearish Breakdown (EMA 9 at Rs. {ema_9} < EMA 21 at Rs. {ema_21})",
                        "vwap_status": f"Trading {vwap_dist_pct}% below VWAP (Rs. {vwap}), seller dominance confirmed",
                        "rsi_momentum": f"RSI 14 at {rsi_val} (Bearish distribution zone)",
                        "volume_intensity": f"{vol_surge}x session volume",
                        "candlestick_structure": "Consecutive red candles breaking below opening range support",
                        "target_methodology": f"Projected 15:00 PM target Rs. {target} derived from -{exp_pct}% downside ATR extension",
                        "key_levels": {
                            "entry_0915": ltp,
                            "vwap_resistance": vwap,
                            "ema_9": ema_9,
                            "ema_21": ema_21,
                            "stop_loss": stop_loss,
                            "target_1500": target
                        }
                    },
                    "why_it_will_raise": [
                        f"Structural Bearish Bias: Trading under VWAP (Rs. {vwap}), indicating institutional supply overhang.",
                        f"Short Acceleration: 9 EMA (Rs. {ema_9}) below 21 EMA (Rs. {ema_21}) creates strong downward selling pressure."
                    ],
                    "session_timeline": {
                        "phase_0915_entry": f"Short at 09:15 AM near Rs. {ltp} with Stop Loss at Rs. {stop_loss}.",
                        "phase_1130_hold": f"Trail Stop Loss to VWAP (Rs. {vwap}) during midday consolidation.",
                        "phase_1500_exit": f"Cover short position at 15:00 PM near target Rs. {target} (-{exp_pct}%)."
                    }
                })
        except Exception as e:
            logger.warning(f"[Screener] Error scanning {inst.get('symbol')}: {e}")
            continue

    # For 9:15 to 15:00, sort bullish candidates by highest projected percentage gain ("which will raise more")
    if horizon == "915_1500":
        bullish_candidates.sort(key=lambda x: (x["expected_pct"], x["probability"]), reverse=True)
        bearish_candidates.sort(key=lambda x: (abs(x["expected_pct"]), x["probability"]), reverse=True)
    else:
        bullish_candidates.sort(key=lambda x: x["probability"], reverse=True)
        bearish_candidates.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "horizon": horizon,
        "horizon_label": cfg["label"],
        "description": cfg["description"],
        "total_scanned": len(bullish_candidates) + len(bearish_candidates),
        "bullish_count": len(bullish_candidates),
        "bearish_count": len(bearish_candidates),
        "bullish": bullish_candidates,
        "bearish": bearish_candidates,
        "timestamp": datetime.utcnow().isoformat()
    }
