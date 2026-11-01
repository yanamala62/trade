import pytest
from datetime import datetime, timedelta
from app.ingest.candle_builder import CandleBuilder
from app.brokers.base import TickData


@pytest.mark.asyncio
async def test_candle_builder_ohlc_aggregation():
    builder = CandleBuilder()
    completed_candles = []

    async def _on_complete(candle):
        completed_candles.append(candle)

    builder.on_candle_completed(_on_complete)

    t0 = datetime(2026, 11, 2, 9, 15, 0)
    
    # 3 ticks in same 5m bucket (9:15)
    tick1 = TickData(symbol="INFY", ltp=1600.0, volume=100, timestamp=t0)
    tick2 = TickData(symbol="INFY", ltp=1610.0, volume=200, timestamp=t0 + timedelta(seconds=30))
    tick3 = TickData(symbol="INFY", ltp=1595.0, volume=350, timestamp=t0 + timedelta(seconds=60))

    await builder.process_tick(tick1)
    await builder.process_tick(tick2)
    await builder.process_tick(tick3)

    curr_5m = builder.get_current_candle("INFY", "5m")
    assert curr_5m is not None
    assert curr_5m["open"] == 1600.0
    assert curr_5m["high"] == 1610.0
    assert curr_5m["low"] == 1595.0
    assert curr_5m["close"] == 1595.0

    # Tick in next 5m bucket (9:20) triggers completion of 9:15 bucket
    tick_next = TickData(symbol="INFY", ltp=1605.0, volume=500, timestamp=t0 + timedelta(minutes=5, seconds=5))
    await builder.process_tick(tick_next)

    # 1m and 5m candles should have completed
    assert len(completed_candles) >= 1
    c5 = next(c for c in completed_candles if c["timeframe"] == "5m")
    assert c5["open"] == 1600.0
    assert c5["high"] == 1610.0
    assert c5["low"] == 1595.0
