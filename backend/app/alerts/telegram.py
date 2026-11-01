import logging
import httpx
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class TelegramNotifier:
    """Dispatches real-time alerts to a configured Telegram bot and chat."""
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.is_enabled = bool(self.bot_token and self.chat_id)

    async def send_message(self, message: str) -> bool:
        if not self.is_enabled:
            return False

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"[Telegram] Failed to dispatch alert: {e}")
            return False

    async def alert_new_suggestion(self, signal_data: dict) -> None:
        msg = (
            f"🎯 *NEW NSE TRADE SUGGESTION*\n"
            f"• *Stock*: `{signal_data.get('symbol')}` ({signal_data.get('setup')})\n"
            f"• *Side*: *{signal_data.get('side')}*\n"
            f"• *Entry*: ₹{signal_data.get('entry')}\n"
            f"• *Stop Loss*: ₹{signal_data.get('stop_loss')}\n"
            f"• *Target 1*: ₹{signal_data.get('target_1')}\n"
            f"• *Target 2*: ₹{signal_data.get('target_2')}\n"
            f"• *Quantity*: {signal_data.get('quantity')} shares\n"
            f"• *Reward:Risk*: {signal_data.get('reward_risk')}\n"
            f"• *Grade*: `{signal_data.get('confidence_grade')}`\n"
            f"_Decision-support only. Not financial advice._"
        )
        await self.send_message(msg)

    async def alert_trade_event(self, symbol: str, event_type: str, price: float, details: str) -> None:
        emoji_map = {
            "TARGET_HIT": "🎉",
            "STOP_HIT": "🛑",
            "TRAILING_STOP_MOVED": "📈",
            "TIME_EXIT": "⏰",
            "SIGNAL_INVALIDATED": "⚠️"
        }
        emoji = emoji_map.get(event_type, "📢")
        msg = (
            f"{emoji} *TRADE UPDATE*: `{symbol}`\n"
            f"• *Event*: {event_type.replace('_', ' ')}\n"
            f"• *Price*: ₹{price}\n"
            f"• *Details*: {details}"
        )
        await self.send_message(msg)
