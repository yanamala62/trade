from typing import List, Dict, Optional, Any

# Top liquid NSE instruments with broker tokens and metadata
NSE_INSTRUMENTS: List[Dict[str, Any]] = [
    {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Ltd",
        "sector": "Energy / Conglomerate",
        "market_cap": "Large Cap",
        "lot_size": 250,
        "tick_size": 0.05,
        "angel_token": "2885",
        "fyers_symbol": "NSE:RELIANCE-EQ",
        "yfinance_symbol": "RELIANCE.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "TCS",
        "name": "Tata Consultancy Services Ltd",
        "sector": "Information Technology",
        "market_cap": "Large Cap",
        "lot_size": 175,
        "tick_size": 0.05,
        "angel_token": "11536",
        "fyers_symbol": "NSE:TCS-EQ",
        "yfinance_symbol": "TCS.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Ltd",
        "sector": "Banking & Financials",
        "market_cap": "Large Cap",
        "lot_size": 550,
        "tick_size": 0.05,
        "angel_token": "1333",
        "fyers_symbol": "NSE:HDFCBANK-EQ",
        "yfinance_symbol": "HDFCBANK.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "INFY",
        "name": "Infosys Ltd",
        "sector": "Information Technology",
        "market_cap": "Large Cap",
        "lot_size": 400,
        "tick_size": 0.05,
        "angel_token": "1594",
        "fyers_symbol": "NSE:INFY-EQ",
        "yfinance_symbol": "INFY.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "ICICIBANK",
        "name": "ICICI Bank Ltd",
        "sector": "Banking & Financials",
        "market_cap": "Large Cap",
        "lot_size": 700,
        "tick_size": 0.05,
        "angel_token": "4963",
        "fyers_symbol": "NSE:ICICIBANK-EQ",
        "yfinance_symbol": "ICICIBANK.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "SBIN",
        "name": "State Bank of India",
        "sector": "Public Sector Banking",
        "market_cap": "Large Cap",
        "lot_size": 750,
        "tick_size": 0.05,
        "angel_token": "3045",
        "fyers_symbol": "NSE:SBIN-EQ",
        "yfinance_symbol": "SBIN.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "BHARTIARTL",
        "name": "Bharti Airtel Ltd",
        "sector": "Telecommunications",
        "market_cap": "Large Cap",
        "lot_size": 475,
        "tick_size": 0.05,
        "angel_token": "10604",
        "fyers_symbol": "NSE:BHARTIARTL-EQ",
        "yfinance_symbol": "BHARTIARTL.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "ITC",
        "name": "ITC Ltd",
        "sector": "FMCG / Tobacco",
        "market_cap": "Large Cap",
        "lot_size": 1600,
        "tick_size": 0.05,
        "angel_token": "1660",
        "fyers_symbol": "NSE:ITC-EQ",
        "yfinance_symbol": "ITC.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "KOTAKBANK",
        "name": "Kotak Mahindra Bank Ltd",
        "sector": "Banking & Financials",
        "market_cap": "Large Cap",
        "lot_size": 400,
        "tick_size": 0.05,
        "angel_token": "1922",
        "fyers_symbol": "NSE:KOTAKBANK-EQ",
        "yfinance_symbol": "KOTAKBANK.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "LT",
        "name": "Larsen & Toubro Ltd",
        "sector": "Engineering & Construction",
        "market_cap": "Large Cap",
        "lot_size": 150,
        "tick_size": 0.05,
        "angel_token": "11483",
        "fyers_symbol": "NSE:LT-EQ",
        "yfinance_symbol": "LT.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "AXISBANK",
        "name": "Axis Bank Ltd",
        "sector": "Banking & Financials",
        "market_cap": "Large Cap",
        "lot_size": 625,
        "tick_size": 0.05,
        "angel_token": "5900",
        "fyers_symbol": "NSE:AXISBANK-EQ",
        "yfinance_symbol": "AXISBANK.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "HINDUNILVR",
        "name": "Hindustan Unilever Ltd",
        "sector": "FMCG",
        "market_cap": "Large Cap",
        "lot_size": 300,
        "tick_size": 0.05,
        "angel_token": "1394",
        "fyers_symbol": "NSE:HINDUNILVR-EQ",
        "yfinance_symbol": "HINDUNILVR.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "TATAMOTORS",
        "name": "Tata Motors Ltd",
        "sector": "Automobile",
        "market_cap": "Large Cap",
        "lot_size": 1400,
        "tick_size": 0.05,
        "angel_token": "3456",
        "fyers_symbol": "NSE:TATAMOTORS-EQ",
        "yfinance_symbol": "TATAMOTORS.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "BAJFINANCE",
        "name": "Bajaj Finance Ltd",
        "sector": "NBFC / Financials",
        "market_cap": "Large Cap",
        "lot_size": 125,
        "tick_size": 0.05,
        "angel_token": "317",
        "fyers_symbol": "NSE:BAJFINANCE-EQ",
        "yfinance_symbol": "BAJFINANCE.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "MARUTI",
        "name": "Maruti Suzuki India Ltd",
        "sector": "Automobile",
        "market_cap": "Large Cap",
        "lot_size": 50,
        "tick_size": 0.05,
        "angel_token": "10999",
        "fyers_symbol": "NSE:MARUTI-EQ",
        "yfinance_symbol": "MARUTI.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "TITAN",
        "name": "Titan Company Ltd",
        "sector": "Consumer Goods / Luxury",
        "market_cap": "Large Cap",
        "lot_size": 175,
        "tick_size": 0.05,
        "angel_token": "3506",
        "fyers_symbol": "NSE:TITAN-EQ",
        "yfinance_symbol": "TITAN.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "SUNPHARMA",
        "name": "Sun Pharmaceutical Industries Ltd",
        "sector": "Pharmaceuticals",
        "market_cap": "Large Cap",
        "lot_size": 350,
        "tick_size": 0.05,
        "angel_token": "3351",
        "fyers_symbol": "NSE:SUNPHARMA-EQ",
        "yfinance_symbol": "SUNPHARMA.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "TATASTEEL",
        "name": "Tata Steel Ltd",
        "sector": "Metals & Mining",
        "market_cap": "Large Cap",
        "lot_size": 5500,
        "tick_size": 0.05,
        "angel_token": "3499",
        "fyers_symbol": "NSE:TATASTEEL-EQ",
        "yfinance_symbol": "TATASTEEL.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "WIPRO",
        "name": "Wipro Ltd",
        "sector": "Information Technology",
        "market_cap": "Large Cap",
        "lot_size": 1500,
        "tick_size": 0.05,
        "angel_token": "3787",
        "fyers_symbol": "NSE:WIPRO-EQ",
        "yfinance_symbol": "WIPRO.NS",
        "segment": "NSE_EQ"
    },
    {
        "symbol": "NTPC",
        "name": "NTPC Ltd",
        "sector": "Power Generation",
        "market_cap": "Large Cap",
        "lot_size": 1500,
        "tick_size": 0.05,
        "angel_token": "11630",
        "fyers_symbol": "NSE:NTPC-EQ",
        "yfinance_symbol": "NTPC.NS",
        "segment": "NSE_EQ"
    },
    # Indices
    {
        "symbol": "NIFTY 50",
        "name": "Nifty 50 Index",
        "sector": "Benchmark Index",
        "market_cap": "Index",
        "lot_size": 25,
        "tick_size": 0.05,
        "angel_token": "99926000",
        "fyers_symbol": "NSE:NIFTY50-INDEX",
        "yfinance_symbol": "^NSEI",
        "segment": "INDEX"
    },
    {
        "symbol": "BANKNIFTY",
        "name": "Nifty Bank Index",
        "sector": "Banking Index",
        "market_cap": "Index",
        "lot_size": 15,
        "tick_size": 0.05,
        "angel_token": "99926009",
        "fyers_symbol": "NSE:NIFTYBANK-INDEX",
        "yfinance_symbol": "^NSEBANK",
        "segment": "INDEX"
    },
    {
        "symbol": "INDIA VIX",
        "name": "India Volatility Index",
        "sector": "Volatility Index",
        "market_cap": "Index",
        "lot_size": 1,
        "tick_size": 0.01,
        "angel_token": "99926017",
        "fyers_symbol": "NSE:INDIAVIX-INDEX",
        "yfinance_symbol": "^INDIAVIX",
        "segment": "INDEX"
    }
]

# Lookup dictionaries for O(1) retrieval
BY_SYMBOL = {inst["symbol"]: inst for inst in NSE_INSTRUMENTS}
BY_ANGEL_TOKEN = {inst["angel_token"]: inst for inst in NSE_INSTRUMENTS}
BY_FYERS_SYMBOL = {inst["fyers_symbol"]: inst for inst in NSE_INSTRUMENTS}
BY_YFINANCE_SYMBOL = {inst["yfinance_symbol"]: inst for inst in NSE_INSTRUMENTS}


def search_instruments(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Autocomplete search by symbol or company name."""
    q = query.strip().upper()
    results = []
    for inst in NSE_INSTRUMENTS:
        if q in inst["symbol"].upper() or q in inst["name"].upper():
            results.append(inst)
            if len(results) >= limit:
                break
    return results


def get_instrument_by_symbol(symbol: str) -> Optional[Dict[str, Any]]:
    return BY_SYMBOL.get(symbol.upper())
