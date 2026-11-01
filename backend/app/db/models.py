import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, Index
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class CandleModel(Base):
    __tablename__ = "candles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(32), index=True, nullable=False)
    timeframe = Column(String(8), index=True, nullable=False)  # '1m', '5m', '15m', '1d'
    timestamp = Column(DateTime, index=True, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, default=0.0)

    __table_args__ = (
        Index("idx_candle_sym_tf_time", "symbol", "timeframe", "timestamp", unique=True),
    )


class SignalModel(Base):
    __tablename__ = "signals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(32), index=True, nullable=False)
    setup = Column(String(64), nullable=False)  # ORB_LONG, VWAP_RECLAIM, etc.
    side = Column(String(8), nullable=False)   # BUY, SELL
    segment = Column(String(16), default="CASH")
    style = Column(String(16), default="INTRADAY")
    
    entry = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    target_1 = Column(Float, nullable=False)
    target_2 = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    risk_amount = Column(Float, nullable=False)
    reward_risk = Column(Float, nullable=False)
    
    status = Column(String(32), default="PENDING", index=True)  # PENDING, TRIGGERED, TARGET_HIT, STOPPED, EXPIRED
    confidence_grade = Column(String(4), default="B")          # A, B, C
    backtest_win_rate = Column(Float, default=0.0)
    backtest_expectancy_r = Column(Float, default=0.0)
    backtest_samples = Column(Integer, default=0)

    risk_gate_status = Column(String(16), default="PASS")       # PASS, BLOCK
    risk_gate_checks = Column(Text, default="[]")               # JSON list of check details
    reasons = Column(Text, default="[]")                        # JSON list of pattern rationale
    llm_explanation = Column(Text, default="")                  # Deterministically verified summary

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    valid_until = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    exit_price = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)


class TrackedTradeModel(Base):
    __tablename__ = "tracked_trades"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(32), index=True, nullable=False)
    signal_id = Column(String(36), nullable=True)
    side = Column(String(8), default="BUY")
    entry_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    stop_loss = Column(Float, nullable=False)
    target_1 = Column(Float, nullable=False)
    target_2 = Column(Float, nullable=False)
    trailing_stop = Column(Float, nullable=True)
    
    status = Column(String(32), default="WATCHING", index=True) # WATCHING, ENTERED, PARTIAL, EXITED, STOPPED, EXPIRED
    current_price = Column(Float, default=0.0)
    current_pnl = Column(Float, default=0.0)
    pnl_pct = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)


class TradeEventModel(Base):
    __tablename__ = "trade_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trade_id = Column(String(36), index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    details = Column(Text, default="")
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class SystemHealthModel(Base):
    __tablename__ = "system_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_feed_status = Column(String(32), default="DISCONNECTED")
    secondary_feed_status = Column(String(32), default="DISCONNECTED")
    feed_latency_ms = Column(Float, default=0.0)
    last_tick_age_sec = Column(Float, default=0.0)
    price_divergence_pct = Column(Float, default=0.0)
    is_stale = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
