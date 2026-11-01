import pytest
from datetime import datetime, timedelta
from app.patterns.orb import detect_orb_pattern
from app.patterns.vwap_reclaim import detect_vwap_reclaim_pattern
from app.patterns.trend_pullback import detect_trend_pullback_pattern


def test_orb_long_detection():
    now = datetime(2026, 11, 2, 9, 15)
    # 3 opening candles: range high = 100.0, range low = 90.0, mid = 95.0
    candles = [
        {"timestamp": now, "high": 98.0, "low": 90.0, "close": 95.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=5), "high": 100.0, "low": 92.0, "close": 97.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=10), "high": 99.0, "low": 94.0, "close": 98.0, "volume": 1000.0, "timeframe": "5m"},
        # 4th candle: breakouts above 100 with surge volume
        {"timestamp": now + timedelta(minutes=15), "high": 105.0, "low": 99.0, "close": 103.0, "volume": 3500.0, "timeframe": "5m"}
    ]
    pattern = detect_orb_pattern(candles)
    assert pattern is not None
    assert pattern["setup"] == "ORB_LONG"
    assert pattern["side"] == "BUY"
    assert pattern["entry"] == 103.0
    assert pattern["stop_loss"] == 95.0
    assert pattern["target_1"] > 103.0


def test_orb_short_detection():
    now = datetime(2026, 11, 2, 9, 15)
    candles = [
        {"timestamp": now, "high": 100.0, "low": 92.0, "close": 95.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=5), "high": 99.0, "low": 90.0, "close": 93.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=10), "high": 95.0, "low": 91.0, "close": 92.0, "volume": 1000.0, "timeframe": "5m"},
        # 4th candle: breakdowns below 90 with surge volume
        {"timestamp": now + timedelta(minutes=15), "high": 91.0, "low": 85.0, "close": 87.0, "volume": 3500.0, "timeframe": "5m"}
    ]
    pattern = detect_orb_pattern(candles)
    assert pattern is not None
    assert pattern["setup"] == "ORB_SHORT"
    assert pattern["side"] == "SELL"
    assert pattern["entry"] == 87.0
    assert pattern["stop_loss"] == 95.0
    assert pattern["target_1"] < 87.0


def test_no_orb_when_range_contained():
    now = datetime(2026, 11, 2, 9, 15)
    # Range is 90 to 100. 4th candle stays at 95.
    candles = [
        {"timestamp": now, "high": 100.0, "low": 90.0, "close": 95.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=5), "high": 98.0, "low": 92.0, "close": 94.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=10), "high": 96.0, "low": 93.0, "close": 95.0, "volume": 1000.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=15), "high": 97.0, "low": 94.0, "close": 95.0, "volume": 1000.0, "timeframe": "5m"}
    ]
    assert detect_orb_pattern(candles) is None
