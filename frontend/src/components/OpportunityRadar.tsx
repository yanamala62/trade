import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  Target,
  ShieldAlert,
  BarChart2,
  Maximize2,
  Split,
  Eye,
  FileText,
  Info,
  X,
  Compass,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { LiveChart } from './LiveChart';
import { ScreenerResponse, ScreenerCandidate, TickData, SignalSuggestion } from '../types';
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

const ALL_POPULAR_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT',
  'AXISBANK', 'HINDUNILVR', 'TATAMOTORS', 'BAJFINANCE', 'MARUTI',
  'TITAN', 'SUNPHARMA', 'TATASTEEL', 'WIPRO', 'NTPC'
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
  const [layoutMode, setLayoutMode] = useState<'SPLIT' | 'CHART_FOCUS' | 'RADAR_FOCUS'>('SPLIT');
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

  // Active candidate if selectedSymbol matches
  const activeCandidate = allCandidates.find((c) => c.symbol === selectedSymbol);

  // Filtered by search & direction
  const displayCandidates = allCandidates
    .filter((c) => {
      if (filterDirection === 'RISE' && c.direction !== 'RISE') return false;
      if (filterDirection === 'FALL' && c.direction !== 'FALL') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });

  // Handle Tracking a Candidate Trade
  const handleTrackCandidate = async (c: ScreenerCandidate) => {
    const isBuy = c.direction === 'RISE';
    const success = await trackNewTrade({
      symbol: c.symbol,
      side: isBuy ? 'BUY' : 'SELL',
      entry_price: c.ltp,
      quantity: 50,
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

  // Convert ScreenerCandidate to a pseudo-signal for LiveChart overlay
  const activeChartSignal: SignalSuggestion | null = activeCandidate
    ? {
        id: `screener-${activeCandidate.symbol}-${activeCandidate.time_horizon}`,
        symbol: activeCandidate.symbol,
        setup: activeCandidate.setup,
        side: activeCandidate.direction === 'RISE' ? 'BUY' : 'SELL',
        entry: activeCandidate.ltp,
        stop_loss: activeCandidate.stop_loss,
        target_1: activeCandidate.target,
        target_2: activeCandidate.target,
        quantity: 50,
        reward_risk: 2.0,
        confidence_grade: activeCandidate.confidence_grade,
        reasons: activeCandidate.reasons,
      }
    : null;

  const currentTick = ticks[selectedSymbol] || null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. TOP CONTROL BAR: HORIZON SELECTOR & ACTIONS */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Dropdown & Horizon Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Target className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  AI Stock Opportunity Radar
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {data?.horizon_label || horizon}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                09:15 AM Buy to 15:00 PM Square-off strategy. Identifies stocks likely to <span className="text-emerald-400 font-semibold">RISE MORE</span> with full chart analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Dropdown & Timeframe Pills */}
        <div className="flex items-center gap-2">
          {/* Native Dropdown Selector */}
          <div className="relative">
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="appearance-none bg-slate-950 border border-indigo-500/40 text-indigo-300 font-semibold text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-indigo-400 transition"
            >
              {HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.icon} {opt.label} ({opt.badge})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Horizon Pills (Desktop) */}
          <div className="hidden lg:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHorizon(opt.value)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  horizon === opt.value
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.value === '915_1500' ? '🎯 09:15-15:00' : opt.value}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadOpportunities(horizon)}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
            title="Refresh AI Opportunities"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Layout Mode Toggles */}
          <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setLayoutMode('SPLIT')}
              className={`p-1.5 rounded ${layoutMode === 'SPLIT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Split View (Chart + Radar)"
            >
              <Split className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('RADAR_FOCUS')}
              className={`p-1.5 rounded ${layoutMode === 'RADAR_FOCUS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Radar Cards Focus"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('CHART_FOCUS')}
              className={`p-1.5 rounded ${layoutMode === 'CHART_FOCUS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Full Live Chart Focus"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STRATEGY BANNER & HORIZON INSIGHT */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Target Horizon:</span>
            <span className="font-semibold text-white">{data?.horizon_label}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-4">
            <span>Model Strategy:</span>
            <span className="text-indigo-300 font-mono font-medium">
              {horizon === '915_1500'
                ? 'Opening Drive, ATR-14 Volatility & Institutional VWAP'
                : horizon === '10m'
                ? 'VWAP & 5m Volume Surge'
                : horizon === '1h'
                ? 'EMA 9/21 Trend & Volume'
                : 'EMA 21/50 Multi-Session Swing'}
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-4">
            <span className="italic">{data?.description}</span>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data?.bullish_count || 0} Likely to Rise
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {data?.bearish_count || 0} Likely to Fall
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: SPLIT GRID OR FULL CHART */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* PANEL A: OPPORTUNITY RADAR CARDS & SCREENER LIST */}
        <div
          className={`flex flex-col bg-slate-950 border-r border-slate-800 overflow-hidden transition-all ${
            layoutMode === 'CHART_FOCUS'
              ? 'hidden'
              : layoutMode === 'RADAR_FOCUS'
              ? 'w-full'
              : 'lg:w-[50%] xl:w-[46%] w-full h-1/2 lg:h-full'
          }`}
        >
          {/* Sub-header: Search & Direction Filter Tabs */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            {/* Filter Direction Pills */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterDirection('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  filterDirection === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allCandidates.length})
              </button>
              <button
                onClick={() => setFilterDirection('RISE')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                  filterDirection === 'RISE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Rise ({data?.bullish_count || 0})</span>
              </button>
              <button
                onClick={() => setFilterDirection('FALL')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                  filterDirection === 'FALL'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>Fall ({data?.bearish_count || 0})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter stock or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Cards Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs font-medium">Scanning top NSE stocks for {horizon} horizon...</p>
              </div>
            ) : displayCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No opportunities found matching criteria.</p>
              </div>
            ) : (
              displayCandidates.map((candidate, idx) => {
                const isBull = candidate.direction === 'RISE';
                const isSelected = candidate.symbol === selectedSymbol;

                return (
                  <div
                    key={`${candidate.symbol}-${candidate.direction}`}
                    onClick={() => onSelectSymbol(candidate.symbol)}
                    className={`p-3 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? isBull
                          ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg'
                          : 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Top Row: Symbol, Rank, Direction Badge & Expected Move */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {horizon === '915_1500' && isBull && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                              #{idx + 1} MAX RISER
                            </span>
                          )}
                          <span className="font-bold text-white text-sm tracking-wide">
                            {candidate.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            {candidate.sector}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {candidate.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Direction Badge */}
                        <span
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                            isBull
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBull ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isBull ? 'RISE' : 'FALL'} {candidate.expected_pct > 0 ? `+${candidate.expected_pct}%` : `${candidate.expected_pct}%`}
                        </span>

                        {/* Probability Grade */}
                        <div className="text-right font-mono">
                          <span
                            className={`text-xs font-bold ${
                              candidate.probability >= 80
                                ? 'text-emerald-400'
                                : candidate.probability >= 70
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {candidate.probability}%
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            Gr.{candidate.confidence_grade}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Price Metrics & Profile Quick Strip */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs mb-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans uppercase">09:15 Buy</div>
                        <div className="font-bold text-white">₹{candidate.ltp.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400/80 font-sans uppercase">15:00 Target</div>
                        <div className="font-bold text-emerald-400">₹{candidate.target.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-400/80 font-sans uppercase">Stop Loss</div>
                        <div className="font-bold text-rose-400">₹{candidate.stop_loss.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-400/80 font-sans uppercase">Beta / ATR</div>
                        <div className="font-bold text-indigo-300">
                          {candidate.profile?.beta ? `${candidate.profile.beta}β` : '1.1β'}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ₹{candidate.profile?.atr_14 || '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Setup Name & Reasons */}
                    <div className="mb-2.5">
                      <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{candidate.setup}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.reasons.slice(0, 3).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar: Open Chart Analysis Modal */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalCandidate(candidate);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 font-semibold transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chart & Why It Raises</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbol(candidate.symbol);
                          }}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium ml-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Live Chart</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackCandidate(candidate);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                          trackedId === candidate.symbol
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        {trackedId === candidate.symbol ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tracked!</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                            <span>Track Trade</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL B: DEDICATED LIVE FULL CHART & STOCK CHOOSER */}
        <div
          className={`flex-1 flex flex-col bg-slate-900 overflow-hidden ${
            layoutMode === 'RADAR_FOCUS' ? 'hidden' : 'flex'
          }`}
        >
          {/* Chart Header Bar with Stock Picker */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Stock Chooser & Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Stock:</span>
                <div className="relative">
                  <select
                    value={selectedSymbol}
                    onChange={(e) => onSelectSymbol(e.target.value)}
                    className="appearance-none bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    {ALL_POPULAR_SYMBOLS.map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Current Price Ticker */}
              {currentTick && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white font-bold text-sm">₹{currentTick.ltp.toFixed(2)}</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                      currentTick.change_pct >= 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {currentTick.change_pct >= 0 ? '+' : ''}
                    {currentTick.change_pct.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Active Prediction Summary Pill */}
            {activeCandidate && (
              <div
                className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono ${
                  activeCandidate.direction === 'RISE'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <span className="font-bold">
                  {activeCandidate.time_horizon === '915_1500' ? '09:15-15:00 Day Runner' : activeCandidate.time_horizon}: {activeCandidate.direction === 'RISE' ? '▲ RISE' : '▼ FALL'} ({activeCandidate.expected_pct > 0 ? `+${activeCandidate.expected_pct}%` : `${activeCandidate.expected_pct}%`})
                </span>
                <span className="text-slate-400">|</span>
                <span>Tgt: ₹{activeCandidate.target}</span>
                <span className="text-slate-400">|</span>
                <span>SL: ₹{activeCandidate.stop_loss}</span>
                <span className="text-slate-400">|</span>
                <span className="font-bold">{activeCandidate.probability}% Win Prob</span>
              </div>
            )}

            {/* Quick Navigation to Replay / Terminal */}
            <div className="flex items-center gap-2">
              {activeCandidate && (
                <button
                  onClick={() => setModalCandidate(activeCandidate)}
                  className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-900/60 transition flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Profile & Why It Raises</span>
                </button>
              )}
              {onNavigateToReplay && (
                <button
                  onClick={onNavigateToReplay}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  Time Machine Replay
                </button>
              )}
              {onNavigateToTerminal && (
                <button
                  onClick={onNavigateToTerminal}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Open in Terminal
                </button>
              )}
            </div>
          </div>

          {/* Live Chart Container */}
          <div className="flex-1 relative overflow-hidden">
            <LiveChart
              symbol={selectedSymbol}
              activeSignal={activeChartSignal}
              latestTick={currentTick}
            />
          </div>

          {/* Bottom Stock Selector Quick Ribbon */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] text-slate-500 font-semibold px-2 uppercase shrink-0">Quick Select:</span>
            {ALL_POPULAR_SYMBOLS.map((sym) => {
              const tick = ticks[sym];
              const isSelected = sym === selectedSymbol;
              const hasRadarBull = data?.bullish.some((b) => b.symbol === sym);
              const hasRadarBear = data?.bearish.some((b) => b.symbol === sym);

              return (
                <button
                  key={sym}
                  onClick={() => onSelectSymbol(sym)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium shrink-0 flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{sym}</span>
                  {hasRadarBull && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Predicted to Rise"></span>}
                  {hasRadarBear && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Predicted to Fall"></span>}
                  {tick && (
                    <span
                      className={`text-[10px] ${
                        tick.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tick.change_pct >= 0 ? '+' : ''}{tick.change_pct.toFixed(1)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MODAL: FULL STOCK INTRADAY PROFILE & CHART ANALYSIS REPORT */}
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
                    <div className="text-sm font-bold text-emerald-400">{modalCandidate.profile?.risk_reward_ratio || '1:4.5'}</div>
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

              {/* SECTION C: HOW THE AI ANALYZED THE CHART (TECHNICAL BREAKDOWN) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Technical Chart & Indicator Breakdown (How We Analyzed This)</span>
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
                      <span>4. Volume Participation & Intensity</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {modalCandidate.chart_analysis?.volume_intensity || 'Higher institutional participation confirmed via volume burst.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION D: EXACT PRICE LEVELS MATRIX */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className="text-[11px] font-bold text-slate-300 font-sans uppercase mb-2">
                  Key Price Levels Matrix (Execution Parameters)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">09:15 AM Buy Entry</span>
                    <span className="text-white font-bold">₹{modalCandidate.ltp.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-sans block">15:00 PM Square-off Target</span>
                    <span className="text-emerald-400 font-bold">₹{modalCandidate.target.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-rose-400 font-sans block">Stop Loss (Invalidation)</span>
                    <span className="text-rose-400 font-bold">₹{modalCandidate.stop_loss.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-sans block">Session VWAP Floor</span>
                    <span className="text-amber-300 font-bold">₹{modalCandidate.chart_analysis?.key_levels?.vwap_support || '---'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-sky-400 font-sans block">EMA 9 Dynamic Trend</span>
                    <span className="text-sky-300 font-bold">₹{modalCandidate.chart_analysis?.key_levels?.ema_9 || '---'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-purple-400 font-sans block">EMA 21 Base Floor</span>
                    <span className="text-purple-300 font-bold">₹{modalCandidate.chart_analysis?.key_levels?.ema_21 || '---'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION E: 09:15 TO 15:00 EXECUTION TIMELINE */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Intraday Execution Roadmap (09:15 AM to 15:00 PM Timeline)</span>
                </h4>
                <div className="space-y-2.5 font-sans">
                  <div className="flex items-start gap-3">
                    <div className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      09:15 AM - 09:30 AM
                    </div>
                    <div>
                      <p className="font-semibold text-white">Opening Fill & Validation</p>
                      <p className="text-[11px] text-slate-400">
                        {modalCandidate.session_timeline?.phase_0915_entry || `Buy near ₹${modalCandidate.ltp} on 5m opening confirmation above morning tick.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      11:30 AM - 13:00 PM
                    </div>
                    <div>
                      <p className="font-semibold text-white">Midday Consolidation & Trailing Stop</p>
                      <p className="text-[11px] text-slate-400">
                        {modalCandidate.session_timeline?.phase_1130_hold || 'Trail Stop Loss to breakeven or session VWAP once +1% profit is attained.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      14:55 PM - 15:00 PM
                    </div>
                    <div>
                      <p className="font-semibold text-white">Closing Expansion & Square-off Exit</p>
                      <p className="text-[11px] text-slate-400">
                        {modalCandidate.session_timeline?.phase_1500_exit || `Square-off position near ₹${modalCandidate.target} (+${modalCandidate.expected_pct}%) before MIS market close.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                LTP: <span className="font-bold text-white font-mono">₹{modalCandidate.ltp.toFixed(2)}</span>
                <span className="mx-2">•</span>
                Projected Target: <span className="font-bold text-emerald-400 font-mono">₹{modalCandidate.target.toFixed(2)} (+{modalCandidate.expected_pct}%)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectSymbol(modalCandidate.symbol);
                    setModalCandidate(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect on Live Chart</span>
                </button>

                <button
                  onClick={() => {
                    handleTrackCandidate(modalCandidate);
                    setModalCandidate(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Track in Journal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
