import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from app.indicators.vwap import calculate_vwap
from app.indicators.ema import calculate_ema
from app.indicators.rsi import calculate_rsi
from app.indicators.atr import calculate_atr
from app.indicators.opening_range import calculate_opening_range
from app.indicators.volume import calculate_volume_metrics


def test_vwap_calculation():
    # 3 periods: typical prices = 10, 20, 30; volumes = 100, 200, 300
    # Cum vol = 100, 300, 600
    # Cum (tp*vol) = 1000, 1000 + 4000 = 5000, 5000 + 9000 = 14000
    # VWAP = 1000/100=10, 5000/300=16.67, 14000/600=23.33
    df = pd.DataFrame({
        "high": [11, 21, 31],
        "low": [9, 19, 29],
        "close": [10, 20, 30],
        "volume": [100, 200, 300]
    })
    vwap = calculate_vwap(df)
    assert len(vwap) == 3
    assert pytest.approx(vwap.iloc[0], 0.01) == 10.0
    assert pytest.approx(vwap.iloc[1], 0.01) == 16.67
    assert pytest.approx(vwap.iloc[2], 0.01) == 23.33


def test_ema_calculation():
    closes = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0]
    ema9 = calculate_ema(closes, period=9)
    assert len(ema9) == 10
    # Last EMA must track upward trend
    assert ema9.iloc[-1] > ema9.iloc[0]
    assert ema9.iloc[-1] < 19.0  # Lags the spot close


def test_rsi_bounds():
    # Continuously rising prices -> RSI approaches 100
    rising = [100 + i * 2 for i in range(30)]
    rsi_rising = calculate_rsi(rising, 14)
    assert rsi_rising.iloc[-1] > 80.0

    # Continuously falling prices -> RSI approaches 0
    falling = [100 - i * 2 for i in range(30)]
    rsi_falling = calculate_rsi(falling, 14)
    assert rsi_falling.iloc[-1] < 20.0


def test_atr_positive():
    df = pd.DataFrame({
        "high": [105, 106, 107, 108, 109],
        "low": [95, 96, 97, 98, 99],
        "close": [100, 101, 102, 103, 104]
    })
    atr = calculate_atr(df, period=3)
    assert len(atr) == 5
    assert (atr > 0).all()


def test_opening_range_calculation():
    now = datetime(2026, 11, 2, 9, 15)
    candles = [
        {"timestamp": now, "high": 105.0, "low": 98.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=5), "high": 110.0, "low": 101.0, "timeframe": "5m"},
        {"timestamp": now + timedelta(minutes=10), "high": 108.0, "low": 96.0, "timeframe": "5m"}
    ]
    or_res = calculate_opening_range(candles, range_minutes=15)
    assert or_res is not None
    or_high, or_low, or_mid = or_res
    assert or_high == 110.0
    assert or_low == 96.0
    assert or_mid == 103.0


def test_volume_metrics():
    candles = [{"volume": 1000.0} for _ in range(19)]
    candles.append({"volume": 3000.0})  # 3x volume surge
    metrics = calculate_volume_metrics(candles, ma_period=20)
    assert metrics["current_vol"] == 3000.0
    assert metrics["rvol"] >= 2.0
