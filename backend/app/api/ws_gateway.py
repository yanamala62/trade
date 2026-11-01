import asyncio
import json
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketGateway:
    """
    Manages active WebSocket browser connections and broadcasts throttled market ticks,
    completed candles, trade signals, and feed health events.
    """
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"[WSGateway] Client connected. Total active: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"[WSGateway] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        if not self.active_connections:
            return

        payload = json.dumps(message, default=str)
        dead_connections = set()

        async with self._lock:
            for ws in self.active_connections:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.add(ws)

            for ws in dead_connections:
                self.active_connections.discard(ws)


ws_gateway = WebSocketGateway()
