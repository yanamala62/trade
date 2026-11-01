import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TickData } from '../types';

interface WatchlistProps {
  ticks: Record<string, TickData>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  ticks,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const tickList = Object.values(ticks);
  const filteredTicks = tickList.filter((t) =>
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NSE Top 20..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Symbol List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredTicks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No instruments found.
          </div>
        ) : (
          filteredTicks.map((tick) => {
            const isSelected = tick.symbol === selectedSymbol;
            const isPositive = tick.change_pct >= 0;
            const isIndex = ['NIFTY 50', 'BANKNIFTY', 'INDIA VIX'].includes(tick.symbol);

            return (
              <div
                key={tick.symbol}
                onClick={() => onSelectSymbol(tick.symbol)}
                className={`p-3 cursor-pointer transition-colors relative flex items-center justify-between hover:bg-slate-800/50 ${
                  isSelected ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''
                } ${
                  tick.direction === 'up'
                    ? 'flash-up'
                    : tick.direction === 'down'
                    ? 'flash-down'
                    : ''
                }`}
              >
                {/* Left side: Symbol & tags */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white tracking-wide">
                      {tick.symbol}
                    </span>
                    {isIndex && (
                      <span className="text-[9px] px-1 py-0.2 rounded-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                        INDEX
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>H: ₹{tick.day_high?.toFixed(2)}</span>
                    <span>L: ₹{tick.day_low?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Right side: Price & % Change */}
                <div className="text-right space-y-0.5">
                  <div className="text-xs font-mono font-bold text-white">
                    ₹{tick.ltp?.toFixed(2)}
                  </div>
                  <div
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{isPositive ? '+' : ''}{tick.change_pct?.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
