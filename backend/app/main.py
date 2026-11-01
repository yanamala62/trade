import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import repo
from app.brokers import get_broker_adapter
from app.ingest.tick_normalizer import TickNormalizer
from app.ingest.candle_builder import CandleBuilder
from app.api.ws_gateway import ws_gateway
from app.api.rest import router as rest_router
from app.alerts.telegram import TelegramNotifier

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("ai_trade_assist")

normalizer = TickNormalizer(divergence_threshold_pct=settings.FEED_DIVERGENCE_THRESHOLD_PCT)
candle_builder = CandleBuilder()
telegram_notifier = TelegramNotifier()
active_broker = None


async def on_candle_completed(candle: Dict[str, Any]) -> None:
    """Callback when a 1m, 5m, or 15m candle closes."""
    try:
        await repo.save_candle(
            symbol=candle["symbol"],
            timeframe=candle["timeframe"],
            timestamp=candle["timestamp"],
            open_p=candle["open"],
            high_p=candle["high"],
            low_p=candle["low"],
            close_p=candle["close"],
            volume=candle["volume"]
        )
        # Broadcast candle update to charts
        await ws_gateway.broadcast({
            "type": "CANDLE_UPDATE",
            "data": {
                "symbol": candle["symbol"],
                "timeframe": candle["timeframe"],
                "timestamp": candle["timestamp"].isoformat(),
                "open": candle["open"],
                "high": candle["high"],
                "low": candle["low"],
                "close": candle["close"],
                "volume": candle["volume"]
            }
        })
    except Exception as e:
        logger.error(f"Error handling completed candle: {e}")


async def on_tick_received(tick) -> None:
    """Processes incoming tick from active broker feed."""
    norm_tick = normalizer.normalize(tick)
    if not norm_tick:
        return

    # Update ongoing candle
    await candle_builder.process_tick(norm_tick)

    # Broadcast live tick to connected browsers
    await ws_gateway.broadcast({
        "type": "TICK",
        "data": {
            "symbol": norm_tick.symbol,
            "ltp": norm_tick.ltp,
            "change_pct": norm_tick.change_pct,
            "volume": norm_tick.volume,
            "day_high": norm_tick.day_high,
            "day_low": norm_tick.day_low,
            "bid": norm_tick.bid,
            "ask": norm_tick.ask,
            "latency_ms": norm_tick.latency_ms,
            "feed_source": norm_tick.feed_source,
            "timestamp": norm_tick.timestamp.isoformat()
        }
    })


@asynccontextmanager
async def lifespan(app: FastAPI):
    global active_broker
    logger.info("Starting AI Trade Assist backend engine...")
    await repo.init_db()

    # Wire candle completion callback
    candle_builder.on_candle_completed(on_candle_completed)

    # Initialize broker adapter
    broker_name = settings.ACTIVE_BROKER
    logger.info(f"Connecting broker adapter: {broker_name}")
    active_broker = get_broker_adapter(broker_name)
    active_broker.register_tick_callback(on_tick_received)
    await active_broker.connect()

    # Subscribe to liquid watchlist + indices
    sub_symbols = list(settings.WATCHLIST_SYMBOLS) + ["NIFTY 50", "BANKNIFTY", "INDIA VIX"]
    await active_broker.subscribe(sub_symbols)

    yield

    logger.info("Shutting down broker connection and resources...")
    if active_broker:
        await active_broker.disconnect()


app = FastAPI(
    title="AI Trade Assist API",
    description="Live NSE Intraday Trading Decision-Support System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rest_router)


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_gateway.connect(websocket)
    try:
        while True:
            # Keep socket open and receive any client ping/subscription requests
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_gateway.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        await ws_gateway.disconnect(websocket)
