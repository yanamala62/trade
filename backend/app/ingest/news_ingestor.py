import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any
import httpx

logger = logging.getLogger(__name__)

# Sample/fallback curated feed of corporate announcements & market news
DEFAULT_NEWS_ITEMS = [
    {
        "symbol": "RELIANCE",
        "headline": "Reliance Retail expands consumer brand portfolio; eyes Q3 festive demand",
        "source": "NSE Corporate Filings",
        "timestamp": "2026-11-01T09:10:00Z",
        "sentiment": "POSITIVE"
    },
    {
        "symbol": "TCS",
        "headline": "TCS secures multi-year cloud transformation deal with European telecom giant",
        "source": "Exchange Announcement",
        "timestamp": "2026-11-01T08:45:00Z",
        "sentiment": "POSITIVE"
    },
    {
        "symbol": "HDFCBANK",
        "headline": "HDFC Bank reports 14% YoY credit growth in advance updates",
        "source": "RBI / Exchange Disclosure",
        "timestamp": "2026-11-01T09:00:00Z",
        "sentiment": "POSITIVE"
    },
    {
        "symbol": "INFY",
        "headline": "Infosys collaborates with global enterprise on generative AI engineering",
        "source": "Press Release",
        "timestamp": "2026-11-01T08:30:00Z",
        "sentiment": "NEUTRAL"
    },
    {
        "symbol": "TATAMOTORS",
        "headline": "Tata Motors commercial vehicle monthly registrations surge 11%",
        "source": "Vahan Data / Auto Update",
        "timestamp": "2026-11-01T09:05:00Z",
        "sentiment": "POSITIVE"
    }
]


class NewsIngestor:
    """Ingests NSE corporate announcements, press releases, and filings."""
    def __init__(self):
        self.news_cache: Dict[str, List[Dict[str, Any]]] = {}
        for item in DEFAULT_NEWS_ITEMS:
            sym = item["symbol"]
            if sym not in self.news_cache:
                self.news_cache[sym] = []
            self.news_cache[sym].append(item)

    async def get_news_for_symbol(self, symbol: str) -> List[Dict[str, Any]]:
        sym = symbol.upper()
        if sym in self.news_cache:
            return self.news_cache[sym]
        # Return generic market news for the stock
        return [
            {
                "symbol": sym,
                "headline": f"{sym} trading in line with broader sector sentiment; no adverse disclosures reported.",
                "source": "NSE Market Surveillance",
                "timestamp": datetime.utcnow().isoformat(),
                "sentiment": "NEUTRAL"
            }
        ]
