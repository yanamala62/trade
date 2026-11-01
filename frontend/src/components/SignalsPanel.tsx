import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SignalSuggestion } from '../types';
import { trackNewTrade } from '../services/api';

interface SignalsPanelProps {
  signals: SignalSuggestion[];
  onSelectSignalStock?: (symbol: string) => void;
  onTradeTracked?: () => void;
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({
  signals,
  onSelectSignalStock,
  onTradeTracked,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  const handleTrackTrade = async (sig: SignalSuggestion) => {
    if (trackedIds.has(sig.id)) return;

    const success = await trackNewTrade({
      symbol: sig.symbol,
      signal_id: sig.id,
      side: sig.side,
      entry_price: sig.entry,
      quantity: sig.quantity,
      stop_loss: sig.stop_loss,
      target_1: sig.target_1,
      target_2: sig.target_2,
      current_price: sig.entry,
    });

    if (success) {
      setTrackedIds((prev) => new Set([...prev, sig.id]));
      if (onTradeTracked) onTradeTracked();
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'B':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Trade Suggestions
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
          {signals.length} active
        </span>
      </div>

      {/* Signals Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-2">
        {signals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p>Scanning NSE live data against 4 deterministic setups...</p>
            <p className="text-[11px] text-slate-600">
              Only high-probability setups passing hard risk gates are emitted.
            </p>
          </div>
        ) : (
          signals.map((sig) => {
            const isPassed = !sig.risk_gate || sig.risk_gate.status === 'PASS';
            const isBuy = sig.side === 'BUY';
            const isExpanded = expandedId === sig.id;
            const isTracked = trackedIds.has(sig.id);
            const rawReasons: any = sig.reasons;
            const reasonsList: string[] = Array.isArray(rawReasons)
              ? rawReasons
              : (typeof rawReasons === 'string' && rawReasons.startsWith('[')
                ? (() => { try { return JSON.parse(rawReasons); } catch { return [rawReasons]; } })()
                : (rawReasons ? [String(rawReasons)] : []));

            return (
              <div
                key={sig.id}
                className={`rounded-xl border p-3.5 transition ${
                  isPassed
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-indigo-500/40'
                    : 'bg-rose-950/10 border-rose-900/30 opacity-75'
                }`}
              >
                {/* Header row: Symbol, Setup, Side, Grade */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSignalStock && onSelectSignalStock(sig.symbol)}
                      className="font-bold text-sm text-white hover:text-indigo-400 transition"
                    >
                      {sig.symbol}
                    </button>
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {sig.side}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-slate-800 text-slate-300 font-medium">
                      {sig.setup.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getGradeBadge(
                        sig.confidence_grade
                      )}`}
                    >
                      Grade {sig.confidence_grade}
                    </span>
                  </div>
                </div>

                {/* Risk Gate Status */}
                <div className="mb-3 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {isPassed ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Risk Gate: PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> Risk Gate: BLOCKED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">R:R {sig.reward_risk}</span>
                </div>

                {/* Numbers Grid: Entry, Stop Loss, Target 1, Target 2, Qty */}
                <div className="grid grid-cols-4 gap-2 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 mb-3 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Entry</div>
                    <div className="text-xs font-mono font-bold text-sky-400">₹{sig.entry}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Stop Loss</div>
                    <div className="text-xs font-mono font-bold text-rose-400">₹{sig.stop_loss}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Target 1</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">₹{sig.target_1}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Qty</div>
                    <div className="text-xs font-mono font-bold text-amber-300">{sig.quantity}</div>
                  </div>
                </div>

                {/* Reasons List */}
                {reasonsList.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {reasonsList.map((r, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* If Blocked, show failed checks */}
                {!isPassed && (sig.risk_gate?.reasons?.length ?? 0) > 0 && (
                  <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] space-y-0.5 mb-2">
                    {sig.risk_gate?.reasons?.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expandable LLM Plain-Language Explanation */}
                {sig.llm_explanation && (
                  <div className="mt-2 border-t border-slate-800/70 pt-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sig.id)}
                      className="w-full flex items-center justify-between text-[11px] text-indigo-300 hover:text-indigo-200"
                    >
                      <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        AI Explanation & Context
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded && (
                      <p className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                        {sig.llm_explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Action button */}
                {isPassed && (
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => handleTrackTrade(sig)}
                      disabled={isTracked}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isTracked
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      }`}
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      {isTracked ? 'Tracking in Journal' : 'Track Position'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
