from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Awaitable, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TickData(BaseModel):
    symbol: str
    ltp: float
    volume: float = 0.0
    bid: float = 0.0
    ask: float = 0.0
    day_high: float = 0.0
    day_low: float = 0.0
    day_open: float = 0.0
    prev_close: float = 0.0
    change_pct: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    exchange_timestamp: Optional[datetime] = None
    feed_source: str = "UNKNOWN"
    latency_ms: float = 0.0


class BrokerAdapter(ABC):
    def __init__(self, name: str):
        self.name = name
        self.is_connected = False
        self.tick_callbacks: List[Callable[[TickData], Awaitable[None]]] = []
        self.subscribed_symbols: List[str] = []

    def register_tick_callback(self, callback: Callable[[TickData], Awaitable[None]]) -> None:
        self.tick_callbacks.append(callback)

    async def emit_tick(self, tick: TickData) -> None:
        for cb in self.tick_callbacks:
            try:
                await cb(tick)
            except Exception as e:
                pass

    @abstractmethod
    async def connect(self) -> bool:
        """Establishes connection and handles authentication/sessions."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Gracefully shuts down sockets/sessions."""
        pass

    @abstractmethod
    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribes to live market data ticks for given symbols."""
        pass

    @abstractmethod
    async def unsubscribe(self, symbols: List[str]) -> None:
        """Unsubscribes from given symbols."""
        pass

    @abstractmethod
    async def get_historical_candles(
        self, symbol: str, timeframe: str, days: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Fetches historical OHLCV candles.
        Returns list of dicts with: timestamp, open, high, low, close, volume.
        """
        pass
