export interface TickData {
  symbol: string;
  ltp: number;
  change_pct: number;
  volume: number;
  day_high: number;
  day_low: number;
  bid: number;
  ask: number;
  latency_ms: number;
  feed_source: string;
  timestamp: string;
  direction?: 'up' | 'down' | 'neutral';
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RiskGateResult {
  status: 'PASS' | 'BLOCK';
  checks_passed: string[];
  checks_failed: string[];
  reasons: string[];
}

export interface SignalSuggestion {
  id: string;
  symbol: string;
  setup: 'ORB_LONG' | 'ORB_SHORT' | 'VWAP_RECLAIM_LONG' | 'VWAP_REJECT_SHORT' | 'TREND_PULLBACK_LONG' | 'TREND_PULLBACK_SHORT' | 'VOLUME_BREAKOUT_LONG' | 'VOLUME_BREAKOUT_SHORT' | string;
  side: 'BUY' | 'SELL';
  entry: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  quantity: number;
  reward_risk: number;
  confidence_grade: 'A' | 'B' | 'C';
  reasons: string[];
  risk_gate: RiskGateResult;
  timestamp: string;
  llm_explanation?: string;
}

export interface TimeMachineStats {
  similar_regimes_found: number;
  empirical_win_rate: number;
  empirical_profit_factor: number;
  median_days_to_target: number;
  monte_carlo_p5: number;
  monte_carlo_p25: number;
  monte_carlo_p50: number;
  monte_carlo_p75: number;
  monte_carlo_p95: number;
  confidence_grade: string;
}

export interface AnalysisResponse {
  symbol: string;
  name: string;
  sector: string;
  verdict: 'BUY' | 'SELL_SHORT' | 'NO_TRADE';
  snapshot: {
    ltp: number;
    day_high: number;
    day_low: number;
    vwap: number;
    rsi: number;
    atr: number;
    ema_9: number;
    ema_21: number;
    ema_50: number;
    ema_200: number;
  };
  suggestion?: SignalSuggestion | null;
  news_summary: string;
  time_machine: TimeMachineStats;
  disclaimer: string;
}

export interface AccuracySetupBreakdown {
  setup: string;
  sample_size: number;
  win_rate: number;
  profit_factor: number;
  expectancy_inr: number;
  expectancy_r: number;
  status: 'ACTIVE' | 'DOWNGRADED' | 'DISABLED';
}

export interface AccuracyData {
  overall: {
    total_suggestions: number;
    trades_taken: number;
    win_rate: number;
    profit_factor: number;
    expectancy_inr: number;
    expectancy_r: number;
    max_drawdown_pct: number;
    longest_losing_streak: number;
  };
  by_setup: AccuracySetupBreakdown[];
}

export interface TrackedTrade {
  id: string;
  symbol: string;
  signal_id?: string;
  side: string;
  entry_price: number;
  quantity: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  current_price: number;
  trailing_stop?: number;
  pnl: number;
  pnl_pct: number;
  status: 'WATCHING' | 'TRIGGERED' | 'TARGET_1_HIT' | 'TARGET_2_HIT' | 'STOPPED_OUT' | 'SQUARED_OFF';
  timestamp: string;
}
