import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BacktestStats(BaseModel):
    win_rate: float = Field(..., description="Out-of-sample win rate (0.0 to 1.0)")
    expectancy_r: float = Field(..., description="Expectancy in multiples of R")
    samples: int = Field(..., description="Total sample trades evaluated")
    profit_factor: float = Field(default=1.45, description="Gross profit / Gross loss")
    max_drawdown_pct: float = Field(default=4.8, description="Max historical drawdown percentage")


class RiskGateResult(BaseModel):
    status: str = Field(..., description="PASS or BLOCK")
    checks: List[Dict[str, Any]] = Field(default_factory=list, description="List of evaluated risk rules")


class ExpectedPriceRange(BaseModel):
    days: int = 1
    low: float
    base: float
    high: float


class SignalSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    setup: str
    side: str  # BUY or SELL
    segment: str = "CASH"  # CASH or FNO
    style: str = "INTRADAY"  # INTRADAY, SWING, POSITIONAL
    horizon_days: int = 1
    
    entry: float
    stop_loss: float
    target_1: float
    target_2: float
    quantity: int
    risk_amount: float
    reward_risk: float
    
    status: str = "PENDING"
    confidence_grade: str = "B"  # A, B, C
    valid_until: Optional[str] = None
    
    backtest_stats: BacktestStats
    risk_gate: RiskGateResult
    reasons: List[str] = Field(default_factory=list)
    expected_range: Optional[ExpectedPriceRange] = None
    llm_explanation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
