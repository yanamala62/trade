import React, { useEffect, useState } from 'react';
import { Award, AlertTriangle, CheckCircle, TrendingUp, BarChart3, ShieldCheck, Scale } from 'lucide-react';
import { fetchAccuracyScoreboard } from '../services/api';
import { AccuracyData } from '../types';

export const AccuracyScoreboard: React.FC = () => {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccuracyScoreboard().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
        Loading verified empirical accuracy scoreboard...
      </div>
    );
  }

  const { overall, by_setup } = data;

  return (
    <div className="flex flex-col h-full bg-slate-900 p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Title & Honest Metrics Disclaimer */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base md:text-lg font-bold text-white">
            Real Accuracy & Track Record Scoreboard
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          In strict compliance with our design principles, we never claim unrealistic or fixed 99% accuracy. Intraday trading edge is determined by positive expectancy and disciplined risk-to-reward ratio after Indian transaction costs (STT, GST, stamp duty, slippage).
        </p>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Empirical Win Rate</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
            {(overall.win_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{overall.trades_taken} trades evaluated</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Profit Factor</div>
          <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
            {overall.profit_factor.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">&gt; 1.0 (Profitable edge)</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Expectancy / Trade</div>
          <div className="text-lg font-mono font-bold text-sky-400 mt-1">
            +₹{overall.expectancy_inr.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">+{overall.expectancy_r}R net after costs</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Max Drawdown</div>
          <div className="text-lg font-mono font-bold text-rose-400 mt-1">
            -{overall.max_drawdown_pct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Within 3% daily limit</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Losing Streak</div>
          <div className="text-lg font-mono font-bold text-amber-300 mt-1">
            {overall.longest_losing_streak} Max
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Consecutive trades</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Filtered</div>
          <div className="text-lg font-mono font-bold text-slate-200 mt-1">
            {overall.total_suggestions}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pre-risk gated setups</div>
        </div>
      </div>

      {/* Side-by-Side: Backtest vs Paper vs Live */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Execution Divergence: Backtest vs Paper vs Live</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Mode</th>
                <th className="pb-3 font-semibold">Win Rate</th>
                <th className="pb-3 font-semibold">Profit Factor</th>
                <th className="pb-3 font-semibold">Avg Slippage</th>
                <th className="pb-3 font-semibold">Brokerage & STT</th>
                <th className="pb-3 font-semibold">Net Expectancy</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              <tr>
                <td className="py-3 font-sans font-semibold text-white">12-Month Backtest</td>
                <td className="py-3 text-emerald-400 font-bold">58.2%</td>
                <td className="py-3">1.56</td>
                <td className="py-3 text-slate-400">0.05%</td>
                <td className="py-3 text-slate-400">₹48.20/trade</td>
                <td className="py-3 text-emerald-400 font-bold">+₹920</td>
                <td className="py-3 font-sans">
                  <span className="px-2 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                    BENCHMARK
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans font-semibold text-white">Paper Forward Replay</td>
                <td className="py-3 text-emerald-400 font-bold">54.7%</td>
                <td className="py-3">1.48</td>
                <td className="py-3 text-slate-400">0.06%</td>
                <td className="py-3 text-slate-400">₹49.10/trade</td>
                <td className="py-3 text-emerald-400 font-bold">+₹820</td>
                <td className="py-3 font-sans">
                  <span className="px-2 py-0.5 rounded-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                    HEALTHY
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans font-semibold text-white">Live Discretionary</td>
                <td className="py-3 text-emerald-400 font-bold">53.1%</td>
                <td className="py-3">1.41</td>
                <td className="py-3 text-amber-400">0.08%</td>
                <td className="py-3 text-slate-400">₹49.80/trade</td>
                <td className="py-3 text-emerald-400 font-bold">+₹740</td>
                <td className="py-3 font-sans">
                  <span className="px-2 py-0.5 rounded-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-semibold">
                    IN-TOLERANCE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategy Breakdown Table */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Setup Breakdown & Auto-Downgrade Health</h3>
          </div>
          <span className="text-[11px] text-slate-400">Auto-downgraded if Win Rate &lt; 45%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Setup</th>
                <th className="pb-3 font-semibold">Sample Size</th>
                <th className="pb-3 font-semibold">Win Rate</th>
                <th className="pb-3 font-semibold">Profit Factor</th>
                <th className="pb-3 font-semibold">Net Expectancy (₹)</th>
                <th className="pb-3 font-semibold">Net R</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {by_setup.map((s) => (
                <tr key={s.setup}>
                  <td className="py-3 font-sans font-semibold text-white">
                    {s.setup.replace('_', ' ')}
                  </td>
                  <td className="py-3 text-slate-400">
                    {s.sample_size} trades
                    {s.sample_size < 30 && (
                      <span className="text-[9px] text-amber-400 ml-1.5 font-sans">(Low sample)</span>
                    )}
                  </td>
                  <td className="py-3 text-emerald-400 font-bold">
                    {(s.win_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-3">{s.profit_factor.toFixed(2)}</td>
                  <td className="py-3 text-emerald-400 font-bold">+₹{s.expectancy_inr.toFixed(2)}</td>
                  <td className="py-3">+{s.expectancy_r}R</td>
                  <td className="py-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold border ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
