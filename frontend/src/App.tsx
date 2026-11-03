import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Zap,
  Activity,
  History,
  Award,
  BookOpen,
  ListFilter,
  BarChart2,
  Target,
} from 'lucide-react';
import { Header } from './components/Header';
import { Watchlist } from './components/Watchlist';
import { LiveChart } from './components/LiveChart';
import { SignalsPanel } from './components/SignalsPanel';
import { TimeMachineView } from './components/TimeMachineView';
import { AccuracyScoreboard } from './components/AccuracyScoreboard';
import { TradeJournal } from './components/TradeJournal';
import { SettingsModal } from './components/SettingsModal';
import { OpportunityRadar } from './components/OpportunityRadar';
import { fetchHealth, fetchSignals, getWebSocketUrl } from './services/api';
import { TickData, SignalSuggestion } from './types';

// Default initial watchlist symbols
const INITIAL_WATCHLIST: Record<string, TickData> = {
  'NIFTY 50': {
    symbol: 'NIFTY 50',
    ltp: 24350.2,
    change_pct: 0.42,
    volume: 18500000,
    day_high: 24410.0,
    day_low: 24290.5,
    bid: 24349.5,
    ask: 24350.5,
    latency_ms: 120,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  BANKNIFTY: {
    symbol: 'BANKNIFTY',
    ltp: 51820.75,
    change_pct: -0.18,
    volume: 9800000,
    day_high: 52050.0,
    day_low: 51680.0,
    bid: 51819.0,
    ask: 51822.0,
    latency_ms: 125,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  RELIANCE: {
    symbol: 'RELIANCE',
    ltp: 2980.5,
    change_pct: 0.85,
    volume: 4200000,
    day_high: 2995.0,
    day_low: 2955.0,
    bid: 2980.0,
    ask: 2980.5,
    latency_ms: 118,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  TCS: {
    symbol: 'TCS',
    ltp: 4120.0,
    change_pct: 0.35,
    volume: 1800000,
    day_high: 4145.0,
    day_low: 4095.0,
    bid: 4119.5,
    ask: 4120.5,
    latency_ms: 130,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    ltp: 1685.25,
    change_pct: -0.45,
    volume: 6500000,
    day_high: 1702.0,
    day_low: 1678.0,
    bid: 1685.0,
    ask: 1685.5,
    latency_ms: 115,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  INFY: {
    symbol: 'INFY',
    ltp: 1845.0,
    change_pct: 1.15,
    volume: 3800000,
    day_high: 1855.0,
    day_low: 1822.0,
    bid: 1844.5,
    ask: 1845.5,
    latency_ms: 122,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  ICICIBANK: {
    symbol: 'ICICIBANK',
    ltp: 1260.4,
    change_pct: 0.52,
    volume: 4900000,
    day_high: 1268.0,
    day_low: 1250.0,
    bid: 1260.0,
    ask: 1260.5,
    latency_ms: 125,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
  TATAMOTORS: {
    symbol: 'TATAMOTORS',
    ltp: 875.3,
    change_pct: 1.84,
    volume: 5200000,
    day_high: 882.0,
    day_low: 858.0,
    bid: 875.0,
    ask: 875.5,
    latency_ms: 119,
    feed_source: 'NSE_PRIMARY',
    timestamp: new Date().toISOString(),
  },
};

export function App() {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'TERMINAL' | 'SIGNALS' | 'TIME_MACHINE' | 'SCOREBOARD' | 'JOURNAL'>('RADAR');
  const [mobileTerminalView, setMobileTerminalView] = useState<'CHART' | 'WATCHLIST'>('CHART');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [ticks, setTicks] = useState<Record<string, TickData>>(INITIAL_WATCHLIST);
  const [signals, setSignals] = useState<SignalSuggestion[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('OFFLINE');
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // 1. Initial Health and Signals Fetch
  useEffect(() => {
    fetchHealth().then((h) => {
      setSystemHealth(h);
      if (h.status === 'ONLINE') setConnectionStatus('CONNECTED');
    });

    fetchSignals().then((sigList) => {
      if (sigList && sigList.length > 0) setSignals(sigList);
    });
  }, []);

  // 2. Real-Time WebSocket Connection
  useEffect(() => {
    let isCancelled = false;

    function connectWs() {
      const wsUrl = getWebSocketUrl();
      console.log('[WebSocket] Connecting to:', wsUrl);
      setConnectionStatus('RECONNECTING');

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCancelled) return;
          console.log('[WebSocket] Connected successfully');
          setConnectionStatus('CONNECTED');
        };

        ws.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TICK' && msg.data) {
              const tick: TickData = msg.data;
              setTicks((prev) => {
                const prevTick = prev[tick.symbol];
                const direction = prevTick
                  ? tick.ltp > prevTick.ltp
                    ? 'up'
                    : tick.ltp < prevTick.ltp
                    ? 'down'
                    : prevTick.direction
                  : 'neutral';

                return {
                  ...prev,
                  [tick.symbol]: { ...tick, direction },
                };
              });
            } else if (msg.type === 'SIGNAL' && msg.data) {
              setSignals((prev) => [msg.data, ...prev.slice(0, 40)]);
            }
          } catch (err) {
            console.warn('[WebSocket] Error parsing event:', err);
          }
        };

        ws.onclose = () => {
          if (isCancelled) return;
          console.log('[WebSocket] Disconnected. Reconnecting in 3s...');
          setConnectionStatus('OFFLINE');
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Socket error:', err);
          ws.close();
        };
      } catch (err) {
        if (!isCancelled) {
          setConnectionStatus('OFFLINE');
          reconnectTimeoutRef.current = setTimeout(connectWs, 4000);
        }
      }
    }

    connectWs();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const currentTick = ticks[selectedSymbol] || null;
  const currentSignal = signals.find((s) => s.symbol === selectedSymbol) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. Universal Top Header */}
      <Header
        connectionStatus={connectionStatus}
        systemHealth={systemHealth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        latencyMs={currentTick?.latency_ms || 120}
        isStale={Boolean(systemHealth?.is_stale)}
      />

      {/* 2. Desktop Tab Bar Navigation */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('RADAR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'RADAR'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">AI Predictions</span>
          </button>
          <button
            onClick={() => setActiveTab('TERMINAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'TERMINAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Live Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('SIGNALS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'SIGNALS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Signals Engine ({signals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TIME_MACHINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'TIME_MACHINE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Time Machine Replay</span>
          </button>
          <button
            onClick={() => setActiveTab('SCOREBOARD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'SCOREBOARD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Accuracy Scoreboard</span>
          </button>
          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'JOURNAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Trade Journal & Bridge</span>
          </button>
        </div>

        {/* Selected Symbol Status Quick Pill */}
        {currentTick && (
          <div className="flex items-center gap-3 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <span className="font-bold text-white font-sans">{selectedSymbol}</span>
            <span className="text-white font-semibold">₹{currentTick.ltp.toFixed(2)}</span>
            <span
              className={`font-semibold ${
                currentTick.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentTick.change_pct >= 0 ? '+' : ''}
              {currentTick.change_pct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* VIEW RADAR: AI OPPORTUNITY RADAR & FULL LIVE CHART */}
        {activeTab === 'RADAR' && (
          <div className="h-full w-full">
            <OpportunityRadar
              ticks={ticks}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              onNavigateToTerminal={() => setActiveTab('TERMINAL')}
              onNavigateToReplay={() => setActiveTab('TIME_MACHINE')}
            />
          </div>
        )}

        {/* VIEW A: TERMINAL */}
        {activeTab === 'TERMINAL' && (
          <div className="flex flex-col md:flex-row h-full w-full">
            {/* Left Column: Watchlist (Desktop 280px / Mobile Toggle) */}
            <div
              className={`md:w-72 lg:w-80 md:flex flex-col shrink-0 border-r border-slate-800 ${
                mobileTerminalView === 'WATCHLIST' ? 'flex flex-1' : 'hidden'
              }`}
            >
              <Watchlist
                ticks={ticks}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  setMobileTerminalView('CHART');
                }}
              />
            </div>

            {/* Center: Live Chart */}
            <div
              className={`flex-1 flex flex-col min-w-0 ${
                mobileTerminalView === 'CHART' ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Mobile Watchlist / Chart toggle bar */}
              <div className="flex md:hidden items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
                <button
                  onClick={() =>
                    setMobileTerminalView(mobileTerminalView === 'CHART' ? 'WATCHLIST' : 'CHART')
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-medium"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>{mobileTerminalView === 'CHART' ? 'Switch to Watchlist' : 'Back to Chart'}</span>
                </button>
                <div className="font-mono text-white font-bold">
                  {selectedSymbol}: ₹{currentTick?.ltp.toFixed(2) || '---'}
                </div>
              </div>

              <div className="flex-1 relative">
                <LiveChart
                  symbol={selectedSymbol}
                  activeSignal={currentSignal}
                  latestTick={currentTick}
                />
              </div>
            </div>

            {/* Right Column: Live Signals Panel (Desktop only side panel) */}
            <div className="hidden xl:flex flex-col w-96 shrink-0 border-l border-slate-800 bg-slate-900">
              <SignalsPanel
                signals={signals}
                onSelectSignalStock={(sym) => setSelectedSymbol(sym)}
                onTradeTracked={() => {}}
              />
            </div>
          </div>
        )}

        {/* VIEW B: SIGNALS (Mobile & Fullscreen) */}
        {activeTab === 'SIGNALS' && (
          <div className="h-full w-full max-w-4xl mx-auto">
            <SignalsPanel
              signals={signals}
              onSelectSignalStock={(sym) => {
                setSelectedSymbol(sym);
                setActiveTab('TERMINAL');
                setMobileTerminalView('CHART');
              }}
              onTradeTracked={() => {}}
            />
          </div>
        )}

        {/* VIEW C: TIME MACHINE */}
        {activeTab === 'TIME_MACHINE' && (
          <div className="h-full w-full">
            <TimeMachineView initialSymbol={selectedSymbol} />
          </div>
        )}

        {/* VIEW D: SCOREBOARD */}
        {activeTab === 'SCOREBOARD' && (
          <div className="h-full w-full">
            <AccuracyScoreboard />
          </div>
        )}

        {/* VIEW E: JOURNAL */}
        {activeTab === 'JOURNAL' && (
          <div className="h-full w-full">
            <TradeJournal ticks={ticks} />
          </div>
        )}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Capacitor Safe-Area Aware) */}
      <nav className="flex md:hidden items-center justify-around bg-slate-900/95 border-t border-slate-800 pb-safe pt-2 backdrop-blur-md z-40">
        <button
          onClick={() => setActiveTab('RADAR')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
            activeTab === 'RADAR' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5 text-amber-400" />
          <span>Predictions</span>
        </button>
        <button
          onClick={() => setActiveTab('TERMINAL')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
            activeTab === 'TERMINAL' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span>Chart</span>
        </button>
        <button
          onClick={() => setActiveTab('SIGNALS')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium relative transition ${
            activeTab === 'SIGNALS' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span>Signals</span>
          {signals.length > 0 && (
            <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('TIME_MACHINE')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
            activeTab === 'TIME_MACHINE' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span>Replay</span>
        </button>
        <button
          onClick={() => setActiveTab('SCOREBOARD')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
            activeTab === 'SCOREBOARD' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span>Accuracy</span>
        </button>
        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
            activeTab === 'JOURNAL' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Journal</span>
        </button>
      </nav>

      {/* 5. Settings Modal (Android APK Backend host IP & System info) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemHealth={systemHealth}
      />
    </div>
  );
}

export default App;
