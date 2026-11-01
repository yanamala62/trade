import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.engine.url import make_url
from sqlalchemy import select, update, desc, delete
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.config import settings
from app.db.models import (
    Base, CandleModel, SignalModel, TrackedTradeModel, TradeEventModel, SystemHealthModel
)

def _init_engine():
    db_url = settings.DATABASE_URL
    try:
        url = make_url(db_url)
        if url.drivername.startswith("sqlite") and url.database and url.database != ":memory:":
            db_path = Path(url.database).resolve()
            db_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    return create_async_engine(db_url, echo=False)

# Initialize engine & session maker
engine = _init_engine()
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db() -> None:
    """Creates all tables in the database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db_session() -> AsyncSession:
    """Dependency for obtaining an async database session."""
    async with AsyncSessionLocal() as session:
        yield session


# --- Candle Operations ---
async def save_candle(
    symbol: str, timeframe: str, timestamp: datetime,
    open_p: float, high_p: float, low_p: float, close_p: float, volume: float
) -> None:
    """Upserts a single candle."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Check if exists
            stmt = select(CandleModel).where(
                CandleModel.symbol == symbol,
                CandleModel.timeframe == timeframe,
                CandleModel.timestamp == timestamp
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                existing.open = open_p
                existing.high = high_p
                existing.low = low_p
                existing.close = close_p
                existing.volume = volume
            else:
                new_candle = CandleModel(
                    symbol=symbol,
                    timeframe=timeframe,
                    timestamp=timestamp,
                    open=open_p,
                    high=high_p,
                    low=low_p,
                    close=close_p,
                    volume=volume
                )
                session.add(new_candle)


async def get_recent_candles(symbol: str, timeframe: str, limit: int = 200) -> List[CandleModel]:
    """Fetches the latest N candles for a symbol and timeframe, ordered oldest to newest."""
    async with AsyncSessionLocal() as session:
        stmt = (
            select(CandleModel)
            .where(CandleModel.symbol == symbol, CandleModel.timeframe == timeframe)
            .order_by(desc(CandleModel.timestamp))
            .limit(limit)
        )
        result = await session.execute(stmt)
        candles = list(result.scalars().all())
        candles.reverse()  # Return in chronological order
        return candles


# --- Signal Operations ---
async def save_signal(signal_data: Dict[str, Any]) -> SignalModel:
    """Saves a new trade signal suggestion."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            signal = SignalModel(**signal_data)
            session.add(signal)
            await session.flush()
            await session.refresh(signal)
            return signal


async def get_signals(
    limit: int = 50, status: Optional[str] = None, symbol: Optional[str] = None
) -> List[SignalModel]:
    """Retrieves recent trade signals."""
    async with AsyncSessionLocal() as session:
        stmt = select(SignalModel).order_by(desc(SignalModel.created_at))
        if status:
            stmt = stmt.where(SignalModel.status == status)
        if symbol:
            stmt = stmt.where(SignalModel.symbol == symbol)
        stmt = stmt.limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())


async def update_signal_status(signal_id: str, status: str, exit_price: Optional[float] = None, pnl: Optional[float] = None) -> None:
    """Updates a signal's status and outcome."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(SignalModel).where(SignalModel.id == signal_id)
            res = await session.execute(stmt)
            sig = res.scalar_one_or_none()
            if sig:
                sig.status = status
                if exit_price is not None:
                    sig.exit_price = exit_price
                if pnl is not None:
                    sig.pnl = pnl
                if status in ["TARGET_HIT", "STOPPED", "EXPIRED"]:
                    sig.closed_at = datetime.utcnow()


# --- Tracked Trade Operations ---
async def create_tracked_trade(trade_data: Dict[str, Any]) -> TrackedTradeModel:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            trade = TrackedTradeModel(**trade_data)
            session.add(trade)
            await session.flush()
            await session.refresh(trade)
            return trade


async def get_tracked_trades(active_only: bool = False) -> List[TrackedTradeModel]:
    async with AsyncSessionLocal() as session:
        stmt = select(TrackedTradeModel).order_by(desc(TrackedTradeModel.created_at))
        if active_only:
            stmt = stmt.where(TrackedTradeModel.status.in_(["WATCHING", "ENTERED", "PARTIAL"]))
        result = await session.execute(stmt)
        return list(result.scalars().all())


async def log_trade_event(trade_id: str, event_type: str, details: str, price: float) -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            event = TradeEventModel(
                trade_id=trade_id,
                event_type=event_type,
                details=details,
                price=price,
                timestamp=datetime.utcnow()
            )
            session.add(event)
