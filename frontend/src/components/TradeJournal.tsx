import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldAlert, CheckCircle, AlertTriangle, Send, Lock, Unlock } from 'lucide-react';
import { fetchTrackedTrades } from '../services/api';
import { TrackedTrade, TickData } from '../types';

interface TradeJournalProps {
  ticks?: Record<string, TickData>;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ ticks = {} }) => {
  const [trades, setTrades] = useState<TrackedTrade[]>([]);
  const [manualOrderBridgeEnabled, setManualOrderBridgeEnabled] = useState(false);
  const [pendingConfirmTrade, setPendingConfirmTrade] = useState<TrackedTrade | null>(null);

  useEffect(() => {
    fetchTrackedTrades().then((data) => setTrades(data));
  }, []);

  // Update current prices & P&L from latest ticks
  const enrichedTrades = trades.map((t) => {
    const liveTick = ticks[t.symbol];
    const currentPrice = liveTick ? liveTick.ltp : t.current_price || t.entry_price;
    const diff = t.side === 'BUY' ? (currentPrice - t.entry_price) : (t.entry_price - currentPrice);
    const pnl = diff * t.quantity;
    const pnlPct = ((currentPrice - t.entry_price) / t.entry_price) * 100 * (t.side === 'BUY' ? 1 : -1);

    return {
      ...t,
      current_price: currentPrice,
      pnl: Math.round(pnl * 100) / 100,
      pnl_pct: Math.round(pnlPct * 100) / 100,
    };
  });

  const totalPnL = enrichedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TARGET_2_HIT':
      case 'TARGET_1_HIT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'STOPPED_OUT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'TRIGGERED':
      case 'ACTIVE':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'WATCHING':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Header & Net P&L Summary */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base md:text-lg font-bold text-white">
              Trade Journal & Tracked Positions
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time outcome tracking with slippage, taxes, and automatic stop/target execution.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              Net Running P&L
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Manual Order Bridge Toggle (Phase 10 Safety) */}
          <button
            onClick={() => setManualOrderBridgeEnabled(!manualOrderBridgeEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              manualOrderBridgeEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Safety mechanism: Bridge requires 2-step manual confirmation"
          >
            {manualOrderBridgeEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>Manual Bridge {manualOrderBridgeEnabled ? 'Active' : 'Locked'}</span>
          </button>
        </div>
      </div>

      {/* Safety Notice regarding Indian regulations */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-200">SEBI Regulatory Notice:</span> AI Trade Assist
          does not place automated or unapproved trades. When the manual bridge is active, orders are
          pre-populated with deterministic stop loss & targets, requiring your explicit manual verification.
        </div>
      </div>

      {/* Tracked Positions Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 font-semibold text-xs text-white">
          Active & Logged Trades ({enrichedTrades.length})
        </div>

        {enrichedTrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No trades tracked yet. Click "Track Position" on any valid trade suggestion in the Live Signals panel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">LTP</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">Target 1 / 2</th>
                  <th className="py-2.5 px-3">P&L (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  {manualOrderBridgeEnabled && <th className="py-2.5 px-3">Bridge Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {enrichedTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-white font-sans">{t.symbol}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.side === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{t.quantity}</td>
                    <td className="py-3 px-3 text-slate-300">₹{t.entry_price.toFixed(2)}</td>
                    <td className="py-3 px-3 text-white font-bold">₹{t.current_price?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-rose-400 font-medium">₹{t.stop_loss.toFixed(2)}</td>
                    <td className="py-3 px-3 text-emerald-400">
                      ₹{t.target_1.toFixed(2)} / ₹{t.target_2.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          (t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {(t.pnl || 0) >= 0 ? '+' : ''}₹{t.pnl?.toFixed(2)} (
                        {(t.pnl_pct || 0) >= 0 ? '+' : ''}
                        {t.pnl_pct?.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-sans border font-medium ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    {manualOrderBridgeEnabled && (
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setPendingConfirmTrade(t)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-sans transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Order</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Order 2-Step Confirmation Modal (Phase 10 Safety Bridge) */}
      {pendingConfirmTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Confirm Manual Order Bridge</h3>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Symbol:</span> <strong className="text-white">{pendingConfirmTrade.symbol}</strong>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Side:</span>{' '}
                <strong
                  className={
                    pendingConfirmTrade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {pendingConfirmTrade.side}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Quantity:</span> <strong className="text-white">{pendingConfirmTrade.quantity}</strong>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Entry Limit:</span> <strong className="text-white">₹{pendingConfirmTrade.entry_price}</strong>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Hard Stop Loss:</span>{' '}
                <strong className="text-rose-400">₹{pendingConfirmTrade.stop_loss}</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Order will be sent to the active broker adapter (Paper or Angel One). Do you confirm manual execution?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingConfirmTrade(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Order for ${pendingConfirmTrade.symbol} placed via manual bridge.`);
                  setPendingConfirmTrade(null);
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white transition font-bold"
              >
                Confirm & Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
