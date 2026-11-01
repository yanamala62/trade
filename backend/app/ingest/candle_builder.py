from datetime import datetime
from typing import Dict, Any, Optional, Callable, Awaitable, List
from app.brokers.base import TickData


def _bucket_time(dt: datetime, minutes: int) -> datetime:
    """Rounds down a datetime to the nearest N-minute interval."""
    total_minutes = dt.minute
    bucketed_minute = (total_minutes // minutes) * minutes
    return dt.replace(minute=bucketed_minute, second=0, microsecond=0)


class CandleBuilder:
    """
    Constructs 1m, 5m, and 15m OHLCV candles from incoming ticks.
    Notifies listeners when a candle completes.
    """
    TIMEFRAMES = {"1m": 1, "5m": 5, "15m": 15}

    def __init__(self):
        # Current active candle per (symbol, timeframe)
        self.active_candles: Dict[str, Dict[str, Any]] = {}
        self.completed_candle_callbacks: List[Callable[[Dict[str, Any]], Awaitable[None]]] = []

    def on_candle_completed(self, callback: Callable[[Dict[str, Any]], Awaitable[None]]) -> None:
        self.completed_candle_callbacks.append(callback)

    async def process_tick(self, tick: TickData) -> None:
        now = tick.timestamp
        for tf_str, minutes in self.TIMEFRAMES.items():
            key = f"{tick.symbol}_{tf_str}"
            bucket = _bucket_time(now, minutes)
            curr = self.active_candles.get(key)

            if curr is None:
                # First candle
                self.active_candles[key] = {
                    "symbol": tick.symbol,
                    "timeframe": tf_str,
                    "timestamp": bucket,
                    "open": tick.ltp,
                    "high": tick.ltp,
                    "low": tick.ltp,
                    "close": tick.ltp,
                    "volume": tick.volume
                }
            elif curr["timestamp"] == bucket:
                # Update ongoing candle
                curr["high"] = max(curr["high"], tick.ltp)
                curr["low"] = min(curr["low"], tick.ltp)
                curr["close"] = tick.ltp
                curr["volume"] += max(0.0, tick.volume - curr.get("_last_tick_vol", tick.volume))
                curr["_last_tick_vol"] = tick.volume
            else:
                # Completed candle!
                completed = dict(curr)
                completed.pop("_last_tick_vol", None)
                
                # Start new bucket
                self.active_candles[key] = {
                    "symbol": tick.symbol,
                    "timeframe": tf_str,
                    "timestamp": bucket,
                    "open": tick.ltp,
                    "high": tick.ltp,
                    "low": tick.ltp,
                    "close": tick.ltp,
                    "volume": 0.0,
                    "_last_tick_vol": tick.volume
                }

                # Emit completed candle to subscribers
                for cb in self.completed_candle_callbacks:
                    try:
                        await cb(completed)
                    except Exception:
                        pass

    def get_current_candle(self, symbol: str, timeframe: str = "5m") -> Optional[Dict[str, Any]]:
        key = f"{symbol}_{timeframe}"
        candle = self.active_candles.get(key)
        if candle:
            c = dict(candle)
            c.pop("_last_tick_vol", None)
            return c
        return None
