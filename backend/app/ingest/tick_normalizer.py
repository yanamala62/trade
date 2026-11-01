import logging
from datetime import datetime
from typing import Dict, Optional, Tuple
from app.brokers.base import TickData
from app.config import settings

logger = logging.getLogger(__name__)


class TickNormalizer:
    """
    Validates, deduplicates, and monitors live feed latency and price divergence.
    """
    def __init__(self, divergence_threshold_pct: float = 0.25):
        self.divergence_threshold_pct = divergence_threshold_pct
        self.last_ticks: Dict[str, TickData] = {}
        self.secondary_ticks: Dict[str, TickData] = {}
        self.divergence_flags: Dict[str, bool] = {}

    def normalize(self, tick: TickData) -> Optional[TickData]:
        # Basic sanity check
        if tick.ltp <= 0 or not tick.symbol:
            return None

        # Measure age / latency
        now = datetime.utcnow()
        if tick.exchange_timestamp:
            tick.latency_ms = max(0.0, (now - tick.exchange_timestamp).total_seconds() * 1000.0)

        # Deduplication check: if LTP and volume are identical within 20ms, drop
        last = self.last_ticks.get(tick.symbol)
        if last and last.ltp == tick.ltp and last.volume == tick.volume:
            time_diff = (tick.timestamp - last.timestamp).total_seconds()
            if time_diff < 0.05:
                return None

        self.last_ticks[tick.symbol] = tick
        return tick

    def record_secondary_tick(self, tick: TickData) -> None:
        self.secondary_ticks[tick.symbol] = tick
        primary = self.last_ticks.get(tick.symbol)
        if primary and primary.ltp > 0:
            diff_pct = abs(primary.ltp - tick.ltp) / primary.ltp * 100.0
            is_divergent = diff_pct > self.divergence_threshold_pct
            self.divergence_flags[tick.symbol] = is_divergent
            if is_divergent:
                logger.warning(
                    f"[FeedDivergence] {tick.symbol}: Primary={primary.ltp}, Secondary={tick.ltp} ({diff_pct:.2f}% diff)"
                )

    def is_stale(self, symbol: str, timeout_sec: float) -> bool:
        last = self.last_ticks.get(symbol)
        if not last:
            return True
        age = (datetime.utcnow() - last.timestamp).total_seconds()
        return age > timeout_sec

    def get_latest_tick(self, symbol: str) -> Optional[TickData]:
        return self.last_ticks.get(symbol)
