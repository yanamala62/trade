import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.brokers.base import BrokerAdapter, TickData

logger = logging.getLogger(__name__)

INITIAL_PRICES = {
    "RELIANCE": 2950.0,
    "TCS": 3880.0,
    "HDFCBANK": 1540.0,
    "INFY": 1620.0,
    "ICICIBANK": 1120.0,
    "SBIN": 830.0,
    "BHARTIARTL": 1340.0,
    "ITC": 435.0,
    "KOTAKBANK": 1780.0,
    "LT": 3650.0,
    "AXISBANK": 1180.0,
    "HINDUNILVR": 2410.0,
    "TATAMOTORS": 980.0,
    "BAJFINANCE": 7150.0,
    "MARUTI": 12400.0,
    "TITAN": 3480.0,
    "SUNPHARMA": 1590.0,
    "TATASTEEL": 155.0,
    "WIPRO": 485.0,
    "NTPC": 375.0,
    "NIFTY 50": 24350.0,
    "BANKNIFTY": 52100.0,
    "INDIA VIX": 13.8
}


class MockBroker(BrokerAdapter):
    """Simulates realistic Brownian motion ticks and candles for offline testing."""
    def __init__(self):
        super().__init__(name="MOCK")
        self.prices: Dict[str, float] = dict(INITIAL_PRICES)
        self.day_highs: Dict[str, float] = {k: v * 1.01 for k, v in INITIAL_PRICES.items()}
        self.day_lows: Dict[str, float] = {k: v * 0.99 for k, v in INITIAL_PRICES.items()}
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def connect(self) -> bool:
        self.is_connected = True
        self._running = True
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._simulate_ticks())
        logger.info("[MockBroker] Connected and streaming simulated ticks.")
        return True

    async def disconnect(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        self.is_connected = False
        logger.info("[MockBroker] Disconnected.")

    async def subscribe(self, symbols: List[str]) -> None:
        for s in symbols:
            if s not in self.subscribed_symbols:
                self.subscribed_symbols.append(s)

    async def unsubscribe(self, symbols: List[str]) -> None:
        self.subscribed_symbols = [s for s in self.subscribed_symbols if s not in symbols]

    async def _simulate_ticks(self) -> None:
        while self._running:
            try:
                for sym in list(self.subscribed_symbols):
                    curr = self.prices.get(sym, 1000.0)
                    step = curr * random.gauss(0, 0.0004)
                    new_p = round(max(1.0, curr + step), 2)
                    self.prices[sym] = new_p
                    
                    self.day_highs[sym] = max(self.day_highs.get(sym, new_p), new_p)
                    self.day_lows[sym] = min(self.day_lows.get(sym, new_p), new_p)
                    
                    base = INITIAL_PRICES.get(sym, new_p)
                    chg_pct = round(((new_p - base) / base) * 100, 2)

                    tick = TickData(
                        symbol=sym,
                        ltp=new_p,
                        volume=random.randint(500, 5000),
                        bid=round(new_p - 0.05, 2),
                        ask=round(new_p + 0.05, 2),
                        day_high=self.day_highs[sym],
                        day_low=self.day_lows[sym],
                        day_open=base,
                        prev_close=base,
                        change_pct=chg_pct,
                        timestamp=datetime.utcnow(),
                        feed_source="MOCK",
                        latency_ms=round(random.uniform(10.0, 45.0), 1)
                    )
                    await self.emit_tick(tick)
                    await asyncio.sleep(0.02)
                await asyncio.sleep(0.5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[MockBroker] Tick error: {e}")
                await asyncio.sleep(1.0)

    async def get_historical_candles(
        self, symbol: str, timeframe: str, days: int = 5
    ) -> List[Dict[str, Any]]:
        base_p = INITIAL_PRICES.get(symbol, 1000.0)
        candles = []
        minutes_step = 1 if timeframe == "1m" else (5 if timeframe == "5m" else 15)
        total_candles = (days * 375) // minutes_step
        now = datetime.utcnow()
        start = now - timedelta(minutes=total_candles * minutes_step)

        p = base_p
        for i in range(total_candles):
            ts = start + timedelta(minutes=i * minutes_step)
            op = p
            hp = round(op + abs(random.gauss(0, base_p * 0.002)), 2)
            lp = round(op - abs(random.gauss(0, base_p * 0.002)), 2)
            cp = round(random.uniform(lp, hp), 2)
            vol = float(random.randint(5000, 50000))
            candles.append({
                "timestamp": ts,
                "open": op,
                "high": hp,
                "low": lp,
                "close": cp,
                "volume": vol
            })
            p = cp
        return candles
