from typing import Dict, Type
from app.brokers.base import BrokerAdapter
from app.brokers.angel import AngelOneAdapter
from app.brokers.fyers import FyersAdapter
from app.brokers.yfinance_feed import RealNSEPublicAdapter
from app.brokers.mock import MockBroker

_REGISTRY: Dict[str, Type[BrokerAdapter]] = {
    "ANGEL_ONE": AngelOneAdapter,
    "FYERS": FyersAdapter,
    "REAL_NSE_PUBLIC": RealNSEPublicAdapter,
    "MOCK": MockBroker
}


def get_broker_adapter(broker_name: str) -> BrokerAdapter:
    cls = _REGISTRY.get(broker_name.upper())
    if not cls:
        cls = RealNSEPublicAdapter
    return cls()
