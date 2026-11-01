import React from 'react';
import { Activity, Radio, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  systemHealth: any;
  onOpenSettings: () => void;
  latencyMs?: number;
  isStale?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  systemHealth,
  onOpenSettings,
  latencyMs = 120,
  isStale = false,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 md:px-6 py-2.5 pt-safe flex items-center justify-between">
      {/* Brand & Market Session */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-white tracking-tight">AI Trade Assist</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              NSE India
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Intraday Decision-Support & Risk Gating System
          </p>
        </div>
      </div>

      {/* Live Stream & Health Badges */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Connection status badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            {connectionStatus === 'CONNECTED' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span className="text-[11px] font-medium text-slate-300">
            {connectionStatus === 'CONNECTED' ? 'Live WS' : connectionStatus}
          </span>
        </div>

        {/* Latency & Stale Check */}
        {connectionStatus === 'CONNECTED' && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>{latencyMs}ms</span>
          </div>
        )}

        {isStale && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase">Stale Block</span>
          </div>
        )}

        {/* Risk Gated Pill */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Risk Gated</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
          title="Configure Host / Broker"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
