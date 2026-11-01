from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "trade_assist_default_secret_key"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Storage
    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_trade_assist.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Broker settings
    # Options: ANGEL_ONE | FYERS | REAL_NSE_PUBLIC | MOCK
    ACTIVE_BROKER: str = "REAL_NSE_PUBLIC"

    # Angel One
    ANGEL_API_KEY: str = ""
    ANGEL_CLIENT_CODE: str = ""
    ANGEL_PIN: str = ""
    ANGEL_TOTP_KEY: str = ""

    # Fyers
    FYERS_APP_ID: str = ""
    FYERS_SECRET_KEY: str = ""
    FYERS_ACCESS_TOKEN: str = ""

    # Feed quality & latency
    FEED_DIVERGENCE_THRESHOLD_PCT: float = 0.25
    STALE_DATA_TIMEOUT_SECONDS: float = 5.0

    # LLM (Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Alerts (Telegram)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # Risk defaults
    CAPITAL: float = 500000.0
    MAX_RISK_PER_TRADE_PCT: float = 1.0
    MAX_DAILY_LOSS_PCT: float = 3.0
    MAX_TRADES_PER_DAY: int = 5
    MIN_REWARD_TO_RISK: float = 1.5
    SQUARE_OFF_TIME_IST: str = "15:15"
    NO_TRADE_OPEN_MINUTES: int = 5
    NO_TRADE_CLOSE_MINUTES: int = 15

    # Default Watchlist symbols (Liquid NSE Equities)
    WATCHLIST_SYMBOLS: List[str] = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
        "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT",
        "AXISBANK", "HINDUNILVR", "TATAMOTORS", "BAJFINANCE", "MARUTI",
        "TITAN", "SUNPHARMA", "TATASTEEL", "WIPRO", "NTPC"
    ]

    # Benchmark Indices
    INDEX_SYMBOLS: List[str] = ["^NSEI", "^NSEBANK", "^INDIAVIX"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
