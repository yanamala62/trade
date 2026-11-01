import React, { useState } from 'react';
import { Search, History, TrendingUp, Sparkles, Activity, AlertCircle, Percent } from 'lucide-react';
import { runDeepAnalysis } from '../services/api';
import { AnalysisResponse } from '../types';

interface TimeMachineViewProps {
  initialSymbol?: string;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({ initialSymbol = 'RELIANCE' }) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [segment, setSegment] = useState<'CASH' | 'FNO'>('CASH');
  const [style, setStyle] = useState<'INTRADAY' | 'SWING'>('INTRADAY');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);

    const res = await runDeepAnalysis(symbol.trim().toUpperCase(), segment, style);
    setLoading(false);

    if (res) {
      setAnalysis(res);
    } else {
      setError(`Unable to run Time Machine replay for ${symbol}. Ensure backend is running.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Search & Style Selector */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter NSE Symbol (e.g., RELIANCE, TCS, INFY)"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {/* Segment Selector */}
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
            >
              <option value="CASH">NSE Cash (Intraday / Positional)</option>
              <option value="FNO">NSE F&O Futures</option>
            </select>

            {/* Style Selector */}
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
            >
              <option value="INTRADAY">Intraday (1-Day)</option>
              <option value="SWING">Swing (3-5 Days)</option>
            </select>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shrink-0 shadow-md shadow-indigo-600/30"
            >
              <History className="w-4 h-4" />
              {loading ? 'Replaying...' : 'Replay Time Machine'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Stock Header & Verdict */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{analysis.symbol}</h2>
                <span className="text-xs text-slate-400">({analysis.name})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-xs bg-slate-800 text-slate-300 font-medium">
                  {analysis.sector}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white mt-1">
                ₹{analysis.snapshot.ltp.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Engine Verdict</div>
                <div
                  className={`text-base font-bold ${
                    analysis.verdict === 'BUY'
                      ? 'text-emerald-400'
                      : analysis.verdict === 'SELL_SHORT'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {analysis.verdict.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Snapshot & Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">VWAP</div>
              <div className="text-xs font-mono font-bold text-amber-400">₹{analysis.snapshot.vwap}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">RSI (14)</div>
              <div className="text-xs font-mono font-bold text-sky-400">{analysis.snapshot.rsi}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">ATR (14)</div>
              <div className="text-xs font-mono font-bold text-indigo-400">₹{analysis.snapshot.atr}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">EMA 9 / 21</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                ₹{analysis.snapshot.ema_9} / ₹{analysis.snapshot.ema_21}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">EMA 50 / 200</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                ₹{analysis.snapshot.ema_50} / ₹{analysis.snapshot.ema_200}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Day Range</div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                ₹{analysis.snapshot.day_low} - ₹{analysis.snapshot.day_high}
              </div>
            </div>
          </div>

          {/* Time Machine: Bootstrap Monte Carlo Fan Chart & Replay */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Historical Regime Replay & Monte Carlo Fan Chart (10,000 Paths)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Grade {analysis.time_machine.confidence_grade}
              </span>
            </div>

            {/* Empirical Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Empirical Win Rate</div>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {(analysis.time_machine.empirical_win_rate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Empirical Profit Factor</div>
                <div className="text-lg font-mono font-bold text-indigo-400">
                  {analysis.time_machine.empirical_profit_factor.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Similar Past Regimes</div>
                <div className="text-lg font-mono font-bold text-amber-300">
                  {analysis.time_machine.similar_regimes_found} occurrences
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Median Time to Target</div>
                <div className="text-lg font-mono font-bold text-sky-400">
                  {analysis.time_machine.median_days_to_target} Day(s)
                </div>
              </div>
            </div>

            {/* Fan Chart Percentile Visualizer */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-medium text-slate-300">
                Projected Price Distribution (Bootstrap Percentiles)
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-400 text-[11px]">95th (Bull)</span>
                  <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[95%]"></div>
                  </div>
                  <span className="w-20 text-right text-emerald-400 font-bold">
                    ₹{analysis.time_machine.monte_carlo_p95}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-400 text-[11px]">75th</span>
                  <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full w-[75%]"></div>
                  </div>
                  <span className="w-20 text-right text-teal-300 font-bold">
                    ₹{analysis.time_machine.monte_carlo_p75}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-400 text-[11px]">50th (Med)</span>
                  <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[50%]"></div>
                  </div>
                  <span className="w-20 text-right text-indigo-300 font-bold">
                    ₹{analysis.time_machine.monte_carlo_p50}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-400 text-[11px]">25th</span>
                  <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[25%]"></div>
                  </div>
                  <span className="w-20 text-right text-amber-300 font-bold">
                    ₹{analysis.time_machine.monte_carlo_p25}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-400 text-[11px]">5th (Bear)</span>
                  <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[5%]"></div>
                  </div>
                  <span className="w-20 text-right text-rose-400 font-bold">
                    ₹{analysis.time_machine.monte_carlo_p50}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Announcements & News Layer */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">NSE Announcements & News Intelligence</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              {analysis.news_summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
