import logging
from typing import List, Dict, Any
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


class NewsSummarizer:
    """Summarizes NSE announcements and news headlines for a stock."""
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model for news: {e}")

    async def summarize_news(self, symbol: str, news_items: List[Dict[str, Any]]) -> str:
        if not news_items:
            return f"No recent material corporate announcements or exchange filings for {symbol}."

        headlines = [f"- {item.get('headline')} ({item.get('source')})" for item in news_items]
        combined = "\n".join(headlines)

        if self.model:
            prompt = (
                f"Summarize the following recent exchange filings and news headlines for NSE stock {symbol} "
                f"into 2 objective sentences highlighting catalysts or risks. Do not give financial advice:\n"
                f"{combined}"
            )
            try:
                res = await self.model.generate_content_async(prompt)
                return res.text.strip()
            except Exception as e:
                logger.warning(f"Gemini news summarization failed: {e}")

        # Deterministic fallback
        return f"Recent disclosures for {symbol}: {news_items[0].get('headline')} (Source: {news_items[0].get('source')}). Broader sentiment appears stable."
