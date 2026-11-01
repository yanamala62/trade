import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.brokers.base import BrokerAdapter, TickData
from app.ingest.instrument_master import BY_SYMBOL

logger = logging.getLogger(__name__)


class FyersAdapter(BrokerAdapter):
    """
    Fyers API v3 Adapter (Secondary Cross-Check Feed).
    Fetches real-time market data and historical candles.
    """
    BASE_URL = "https://api-t1.fyers.in/data"

    def __init__(self):
        super().__init__(name="FYERS")
        self.app_id = settings.FYERS_APP_ID
        self.access_token = settings.FYERS_ACCESS_TOKEN
        self._http_client = httpx.AsyncClient(timeout=15.0)

    async def connect(self) -> bool:
        if not (self.app_id and self.access_token):
            logger.info("[Fyers] Credentials not configured. Operating in inactive secondary mode.")
            self.is_connected = False
            return False

        try:
            # Quick profile check
            headers = {"Authorization": f"{self.app_id}:{self.access_token}"}
            res = await self._http_client.get("https://api-t1.fyers.in/api/v3/profile", headers=headers)
            if res.status_code == 200:
                self.is_connected = True
                logger.info("[Fyers] Connected successfully to API v3.")
                return True
            else:
                logger.warning(f"[Fyers] Profile validation failed with status {res.status_code}")
                self.is_connected = False
                return False
        except Exception as e:
            logger.warning(f"[Fyers] Connection check failed: {e}")
            self.is_connected = False
            return False

    async def disconnect(self) -> None:
        await self._http_client.aclose()
        self.is_connected = False
        logger.info("[Fyers] Disconnected.")

    async def subscribe(self, symbols: List[str]) -> None:
        for s in symbols:
            if s not in self.subscribed_symbols:
                self.subscribed_symbols.append(s)

    async def unsubscribe(self, symbols: List[str]) -> None:
        self.subscribed_symbols = [s for s in self.subscribed_symbols if s not in symbols]

    async def get_historical_candles(
        self, symbol: str, timeframe: str, days: int = 5
    ) -> List[Dict[str, Any]]:
        if not self.is_connected:
            return []

        inst = BY_SYMBOL.get(symbol.upper())
        if not inst:
            return []

        resolution = "5" if timeframe == "5m" else ("1" if timeframe == "1m" else ("15" if timeframe == "15m" else "D"))
        now = datetime.now()
        date_format = "%Y-%m-%d"
        from_date = (now - timedelta(days=days)).strftime(date_format)
        to_date = now.strftime(date_format)

        headers = {"Authorization": f"{self.app_id}:{self.access_token}"}
        params = {
            "symbol": inst["fyers_symbol"],
            "resolution": resolution,
            "date_format": "1",
            "range_from": from_date,
            "range_to": to_date,
            "cont_flag": "1"
        }

        try:
            res = await self._http_client.get(f"{self.BASE_URL}/history", headers=headers, params=params)
            data = res.json()
            if data.get("s") == "ok" and "candles" in data:
                candles = []
                for row in data["candles"]:
                    candles.append({
                        "timestamp": datetime.fromtimestamp(row[0]),
                        "open": float(row[1]),
                        "high": float(row[2]),
                        "low": float(row[3]),
                        "close": float(row[4]),
                        "volume": float(row[5])
                    })
                return candles
        except Exception as e:
            logger.error(f"[Fyers] Failed to fetch history: {e}")
        return []
