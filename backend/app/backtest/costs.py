from typing import Dict, Any


def calculate_indian_equity_costs(
    buy_price: float,
    sell_price: float,
    quantity: int,
    slippage_pct: float = 0.05
) -> Dict[str, float]:
    """
    Computes precise Indian regulatory and brokerage costs for Intraday Cash Equity.
    Rules:
    - Brokerage: ₹20 per executed order or 0.03% (whichever is lower)
    - STT (Securities Transaction Tax): 0.025% on sell side
    - Exchange Transaction Charges: 0.00297% of total turnover
    - GST: 18% on (Brokerage + Exchange Charges)
    - SEBI Charges: 0.0001% (₹10 per crore) of total turnover
    - Stamp Duty: 0.003% on buy turnover
    - Slippage: 0.05% on entry and exit
    """
    if quantity <= 0 or buy_price <= 0 or sell_price <= 0:
        return {
            "brokerage": 0.0,
            "stt": 0.0,
            "exchange_charges": 0.0,
            "gst": 0.0,
            "sebi_charges": 0.0,
            "stamp_duty": 0.0,
            "slippage": 0.0,
            "total_costs": 0.0
        }

    buy_turnover = buy_price * quantity
    sell_turnover = sell_price * quantity
    total_turnover = buy_turnover + sell_turnover

    # 1. Brokerage (capped at ₹20 per leg)
    brok_buy = min(20.0, buy_turnover * 0.0003)
    brok_sell = min(20.0, sell_turnover * 0.0003)
    total_brokerage = brok_buy + brok_sell

    # 2. STT (0.025% on sell side for intraday equity)
    stt = sell_turnover * 0.00025

    # 3. Exchange transaction charges (NSE equity: 0.00297%)
    exchange_charges = total_turnover * 0.0000297

    # 4. GST (18% on Brokerage + Exchange charges)
    gst = (total_brokerage + exchange_charges) * 0.18

    # 5. SEBI turnover charges (₹10 per crore = 0.0001%)
    sebi_charges = total_turnover * 0.000001

    # 6. Stamp duty (0.003% on buy turnover)
    stamp_duty = buy_turnover * 0.00003

    # 7. Slippage
    slippage = total_turnover * (slippage_pct / 100.0)

    total_costs = round(
        total_brokerage + stt + exchange_charges + gst + sebi_charges + stamp_duty + slippage,
        2
    )

    return {
        "brokerage": round(total_brokerage, 2),
        "stt": round(stt, 2),
        "exchange_charges": round(exchange_charges, 2),
        "gst": round(gst, 2),
        "sebi_charges": round(sebi_charges, 2),
        "stamp_duty": round(stamp_duty, 2),
        "slippage": round(slippage, 2),
        "total_costs": total_costs
    }
