import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  BarChart2,
  FileText,
  X,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ScreenerResponse, ScreenerCandidate, TickData } from '../types';
import { fetchScreenerOpportunities, trackNewTrade } from '../services/api';

interface OpportunityRadarProps {
  ticks: Record<string, TickData>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTerminal?: () => void;
  onNavigateToReplay?: () => void;
}

const HORIZON_OPTIONS = [
  { value: '915_1500', label: '09:15 AM -> 15:00 PM', badge: 'Full Session Max-Riser', icon: '🎯' },
  { value: '10m', label: 'Next 10 Minutes', badge: 'Scalp / Momentum', icon: '⚡' },
  { value: '1h', label: 'Next 1 Hour', badge: 'Intraday Trend', icon: '⏱️' },
  { value: '1d', label: 'Today (1 Day)', badge: 'Session ORB', icon: '📅' },
  { value: '2d', label: 'Next 2 Days', badge: 'Short Swing', icon: '📈' },
  { value: '3d', label: 'Next 3 Days', badge: 'Swing Expansion', icon: '🚀' },
  { value: '1w', label: 'Next 1 Week', badge: 'Weekly Positional', icon: '📆' },
];

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({
  ticks,
  selectedSymbol,
  onSelectSymbol,
  onNavigateToTerminal,
  onNavigateToReplay,
}) => {
  const [horizon, setHorizon] = useState<string>('915_1500');
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'RISE' | 'FALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [modalCandidate, setModalCandidate] = useState<ScreenerCandidate | null>(null);

  // Fetch opportunities whenever horizon changes
  const loadOpportunities = async (selectedHorizon: string) => {
    setIsLoading(true);
    const result = await fetchScreenerOpportunities(selectedHorizon);
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOpportunities(horizon);
  }, [horizon]);

  // Combined candidates
  const allCandidates: ScreenerCandidate[] = [
    ...(data?.bullish || []),
    ...(data?.bearish || []),
  ];

  // Filtered by search & direction
  const displayCandidates = allCandidates
    .filter((c) => {
      if (filterDirection === 'RISE' && c.direction !== 'RISE') return false;
      if (filterDirection === 'FALL' && c.direction !== 'FALL') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      );
    });

  // Track trade handler
  const handleTrackCandidate = async (c: ScreenerCandidate) => {
    const isBuy = c.direction === 'RISE';
    const success = await trackNewTrade({
      symbol: c.symbol,
      side: isBuy ? 'BUY' : 'SELL',
      entry_price: c.ltp,
      stop_loss: c.stop_loss,
      target_1: c.target,
      target_2: isBuy ? Math.round(c.target * 1.015 * 100) / 100 : Math.round(c.target * 0.985 * 100) / 100,
      current_price: c.ltp,
      status: 'WATCHING',
    });

    if (success) {
      setTrackedId(c.symbol);
      setTimeout(() => setTrackedId(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. TOP HEADER & HORIZON BAR */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md z-10">
        {/* Title & Description */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-amber-500/20 text-amber-400 border border-indigo-500/30">
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                AI Stock Predictions
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" /> Live Market Scanner
              </span>
            </div>
            <p className="text-xs text-slate-400">
              09:15 AM Buy ➔ 15:00 PM Square-off strategy. Identifies high-momentum stocks engineered to rise the most.
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh & Chart Shortcut */}
        <div className="flex items-center gap-2">
          {onNavigateToTerminal && (
            <button
              onClick={onNavigateToTerminal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Open Candlestick Chart View"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open Live Charts</span>
            </button>
          )}

          <button
            onClick={() => loadOpportunities(horizon)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
            title="Scan latest live market data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Scanning...' : 'Refresh Predictions'}</span>
          </button>
        </div>
      </div>

      {/* 2. TIME HORIZON SELECTOR PILLS */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase shrink-0 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" /> Horizon:
        </span>
        {HORIZON_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setHorizon(opt.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition ${
              horizon === opt.value
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Direction Filter Pills */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterDirection('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              filterDirection === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Predictions ({allCandidates.length})
          </button>
          <button
            onClick={() => setFilterDirection('RISE')}
            className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition ${
              filterDirection === 'RISE'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Likely to Rise ({data?.bullish_count || 0})</span>
          </button>
          <button
            onClick={() => setFilterDirection('FALL')}
            className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition ${
              filterDirection === 'FALL'
                ? 'bg-rose-600 text-white'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Likely to Fall ({data?.bearish_count || 0})</span>
          </button>
        </div>

        {/* Search Stock or Sector */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stock or sector (e.g. INFY, Banking, Steel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* 4. MAIN PREDICTIONS GRID (CLEAN, USER-FRIENDLY CARDS) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 gap-3">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Scanning liquid NSE stocks for {data?.horizon_label || horizon}...</p>
            <p className="text-xs text-slate-500">Evaluating institutional VWAP, volume surge, and trend confluence...</p>
          </div>
        ) : displayCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-500 gap-3 bg-slate-900/40 rounded-2xl border border-slate-800 m-4">
            <AlertCircle className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No predictions matching your filter.</p>
            <button
              onClick={() => {
                setFilterDirection('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              Reset filters to show all predictions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {displayCandidates.map((candidate, idx) => {
              const isBull = candidate.direction === 'RISE';
              const liveTick = ticks[candidate.symbol];

              return (
                <div
                  key={`${candidate.symbol}-${candidate.direction}`}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 shadow-lg relative overflow-hidden ${
                    isBull
                      ? 'bg-gradient-to-b from-slate-900/90 to-emerald-950/20 border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-950/20'
                      : 'bg-gradient-to-b from-slate-900/90 to-rose-950/20 border-slate-800 hover:border-rose-500/50 hover:shadow-rose-950/20'
                  }`}
                >
                  {/* Top Card Header: Rank, Symbol, Sector, Live Price */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {horizon === '915_1500' && isBull && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                              #{idx + 1} MAX RISER
                            </span>
                          )}
                          <span className="font-extrabold text-white text-base tracking-wide">
                            {candidate.symbol}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {candidate.sector}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5">
                          {candidate.name}
                        </p>
                      </div>

                      {/* Current Live Tick Price */}
                      <div className="text-right font-mono">
                        <div className="text-sm font-bold text-white">
                          ₹{liveTick ? liveTick.ltp.toFixed(2) : candidate.ltp.toFixed(2)}
                        </div>
                        {liveTick && (
                          <div
                            className={`text-[11px] font-semibold ${
                              liveTick.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {liveTick.change_pct >= 0 ? '+' : ''}
                            {liveTick.change_pct.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prediction Banner: Direction & Win Probability */}
                    <div className="flex items-center justify-between gap-2 my-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wide ${
                          isBull
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isBull ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                        <span>{isBull ? '▲ PREDICTED TO RISE' : '▼ PREDICTED TO FALL'} {candidate.expected_pct > 0 ? `+${candidate.expected_pct}%` : `${candidate.expected_pct}%`}</span>
                      </span>

                      <div className="text-right font-mono flex items-center gap-1 text-xs">
                        <span className="font-bold text-amber-300">{candidate.probability}% Prob</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 font-bold">
                          Gr. {candidate.confidence_grade}
                        </span>
                      </div>
                    </div>

                    {/* Exact Price Matrix (09:15 Buy -> 15:00 Target) */}
                    <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-center mb-3">
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans uppercase font-medium">09:15 Buy</div>
                        <div className="text-xs font-bold text-white mt-0.5">₹{candidate.ltp.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400 font-sans uppercase font-medium">15:00 Target</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">₹{candidate.target.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-400 font-sans uppercase font-medium">Stop Loss</div>
                        <div className="text-xs font-bold text-rose-400 mt-0.5">₹{candidate.stop_loss.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-300 font-sans uppercase font-medium">R : R</div>
                        <div className="text-xs font-bold text-indigo-300 mt-0.5">{candidate.profile?.risk_reward_ratio || '1:2.5'}</div>
                      </div>
                    </div>

                    {/* Why It Will Raise Preview Bullets */}
                    <div className="mb-3 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Why This Stock Was Picked:</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        {candidate.reasons.slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 leading-tight">
                            <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                            <span className="line-clamp-1">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setModalCandidate(candidate)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Why It Raises & Profile</span>
                    </button>

                    <button
                      onClick={() => handleTrackCandidate(candidate)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        trackedId === candidate.symbol
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Save and track this prediction in Trade Journal"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{trackedId === candidate.symbol ? 'Tracked' : 'Track'}</span>
                    </button>

                    {onNavigateToTerminal && (
                      <button
                        onClick={() => {
                          onSelectSymbol(candidate.symbol);
                          onNavigateToTerminal();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                        title="View Candlestick Chart in Terminal"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                        <span className="hidden sm:inline">Chart</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. IN-DEPTH PROFILE & ANALYSIS MODAL */}
      {modalCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Target className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {modalCandidate.symbol} - {modalCandidate.name}
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {modalCandidate.expected_pct > 0 ? `+${modalCandidate.expected_pct}%` : `${modalCandidate.expected_pct}%`} MAX RISE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {modalCandidate.sector} • {modalCandidate.profile?.market_cap || 'Large Cap'} • Strategy: 09:15 AM Buy ➔ 15:00 PM Square-off
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalCandidate(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-200">
              {/* SECTION A: KEY INTRADAY PROFILE STATS */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Stock Profile & Volatility Metrics</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Beta (vs NIFTY)</div>
                    <div className="text-sm font-bold text-amber-400">{modalCandidate.profile?.beta || 1.15}β</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{modalCandidate.profile?.volatility_rank || 'High-Beta Runner'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">ATR-14 Volatility</div>
                    <div className="text-sm font-bold text-white">₹{modalCandidate.profile?.atr_14 || '---'}</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{modalCandidate.profile?.atr_pct}% daily spread</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Risk-Reward Ratio</div>
                    <div className="text-sm font-bold text-emerald-400">{modalCandidate.profile?.risk_reward_ratio || '1:2.5'}</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Asymmetric edge</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Win Probability</div>
                    <div className="text-sm font-bold text-indigo-400">{modalCandidate.probability}%</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Grade {modalCandidate.confidence_grade} Confidence</div>
                  </div>
                </div>
              </div>

              {/* SECTION B: WHY IT WILL RAISE BETWEEN 9:15 AND 15:00 */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Why It Will Raise Between 09:15 AM and 15:00 PM (Data-Backed Reasons)</span>
                </h4>
                <ul className="space-y-2">
                  {(modalCandidate.why_it_will_raise || modalCandidate.reasons).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION C: TECHNICAL BREAKDOWN */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Technical & Indicator Confluence (How We Analyzed This)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      <span>1. Moving Average Confluence & Trend</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {modalCandidate.chart_analysis?.trend_regime || 'EMA 9 > EMA 21 alignment indicates strong buyer control.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>2. Institutional VWAP Dynamic</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {modalCandidate.chart_analysis?.vwap_status || 'Price sustained firmly above volume-weighted average price.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      <span>3. RSI Momentum Corridor</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {modalCandidate.chart_analysis?.rsi_momentum || 'RSI 14 positioned in strong acceleration corridor.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>4. Volume Surge & Institutional Flow</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {modalCandidate.chart_analysis?.volume_intensity || 'Volume exceeds average session participation.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION D: SESSION EXECUTION TIMELINE */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Intraday Execution Plan & Timeline</span>
                </h4>
                <div className="space-y-3 font-mono">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0">
                      09:15 AM
                    </span>
                    <p className="text-[11px] text-slate-300 font-sans">
                      {modalCandidate.session_timeline?.phase_0915_entry || `Buy at 09:15 open near ₹${modalCandidate.ltp}. Initial Stop Loss at ₹${modalCandidate.stop_loss}.`}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] shrink-0">
                      11:30 AM
                    </span>
                    <p className="text-[11px] text-slate-300 font-sans">
                      {modalCandidate.session_timeline?.phase_1130_hold || 'Trail Stop Loss to breakeven once +1.0% gain is secured.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] shrink-0">
                      15:00 PM
                    </span>
                    <p className="text-[11px] text-slate-300 font-sans">
                      {modalCandidate.session_timeline?.phase_1500_exit || `Square-off at 15:00 PM near projected target ₹${modalCandidate.target}.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION E: KEY MATHEMATICAL LEVELS */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className="text-[11px] font-sans font-semibold text-slate-400 mb-2">Key Mathematical Price Levels:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Buy / Entry</span>
                    <span className="font-bold text-white">₹{modalCandidate.chart_analysis?.key_levels?.entry_0915 || modalCandidate.ltp}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-400 block">15:00 Target</span>
                    <span className="font-bold text-emerald-400">₹{modalCandidate.chart_analysis?.key_levels?.target_1500 || modalCandidate.target}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-rose-400 block">Stop Loss</span>
                    <span className="font-bold text-rose-400">₹{modalCandidate.chart_analysis?.key_levels?.stop_loss || modalCandidate.stop_loss}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-indigo-400 block">Session VWAP</span>
                    <span className="font-bold text-indigo-300">₹{modalCandidate.chart_analysis?.key_levels?.vwap_support || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setModalCandidate(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {onNavigateToTerminal && (
                  <button
                    onClick={() => {
                      onSelectSymbol(modalCandidate.symbol);
                      setModalCandidate(null);
                      onNavigateToTerminal();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
                  >
                    <BarChart2 className="w-4 h-4 text-sky-400" />
                    <span>View Candlestick Chart</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleTrackCandidate(modalCandidate);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{trackedId === modalCandidate.symbol ? 'Tracked in Journal!' : 'Track Trade'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
