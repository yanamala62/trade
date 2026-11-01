import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  ISeriesApi,
  IChartApi,
} from 'lightweight-charts';
import { Candle, SignalSuggestion, TickData } from '../types';
import { fetchCandles } from '../services/api';
import { Layers, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface LiveChartProps {
  symbol: string;
  activeSignal?: SignalSuggestion | null;
  latestTick?: TickData | null;
}

export const LiveChart: React.FC<LiveChartProps> = ({
  symbol,
  activeSignal,
  latestTick,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m'>('5m');
  const [showIndicators, setShowIndicators] = useState(true);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch initial candles when symbol or timeframe changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCandles(symbol, timeframe, 120).then((data) => {
      if (isMounted) {
        setCandles(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  // 2. Initialize Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f19' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        vertLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
      },
      autoSize: true,
    });

    chartRef.current = chart;

    // Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#334155',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay volume on same chart
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'VWAP',
    });
    vwapSeriesRef.current = vwapSeries;

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 1,
      title: 'EMA 9',
    });
    ema9SeriesRef.current = ema9Series;

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      title: 'EMA 21',
    });
    ema21SeriesRef.current = ema21Series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // 3. Update Chart Data & Overlays
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    // Format for Lightweight Charts (requires sorted timestamps in seconds)
    const formattedCandles = candles.map((c) => {
      const timeInSec = Math.floor(new Date(c.timestamp).getTime() / 1000);
      return {
        time: timeInSec as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    }).sort((a, b) => (a.time as number) - (b.time as number));

    const formattedVolume = candles.map((c) => {
      const timeInSec = Math.floor(new Date(c.timestamp).getTime() / 1000);
      return {
        time: timeInSec as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      };
    }).sort((a, b) => (a.time as number) - (b.time as number));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current?.setData(formattedVolume);

    // Compute VWAP
    if (showIndicators && vwapSeriesRef.current) {
      let cumVol = 0;
      let cumPV = 0;
      const vwapData = candles.map((c) => {
        const timeInSec = Math.floor(new Date(c.timestamp).getTime() / 1000);
        const typical = (c.high + c.low + c.close) / 3;
        cumVol += c.volume;
        cumPV += typical * c.volume;
        return {
          time: timeInSec as any,
          value: cumVol > 0 ? cumPV / cumVol : c.close,
        };
      }).sort((a, b) => (a.time as number) - (b.time as number));
      vwapSeriesRef.current.setData(vwapData);
    } else {
      vwapSeriesRef.current?.setData([]);
    }

    // Compute EMAs
    if (showIndicators && ema9SeriesRef.current && ema21SeriesRef.current) {
      const calculateEMA = (period: number) => {
        const k = 2 / (period + 1);
        let ema = candles[0]?.close || 0;
        return candles.map((c) => {
          const timeInSec = Math.floor(new Date(c.timestamp).getTime() / 1000);
          ema = c.close * k + ema * (1 - k);
          return { time: timeInSec as any, value: ema };
        }).sort((a, b) => (a.time as number) - (b.time as number));
      };

      ema9SeriesRef.current.setData(calculateEMA(9));
      ema21SeriesRef.current.setData(calculateEMA(21));
    } else {
      ema9SeriesRef.current?.setData([]);
      ema21SeriesRef.current?.setData([]);
    }

    // Add Signal Price Lines if Active
    if (activeSignal && activeSignal.symbol === symbol) {
      candleSeriesRef.current.createPriceLine({
        price: activeSignal.entry,
        color: '#06b6d4',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY (₹${activeSignal.entry})`,
      });
      candleSeriesRef.current.createPriceLine({
        price: activeSignal.stop_loss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `SL (₹${activeSignal.stop_loss})`,
      });
      candleSeriesRef.current.createPriceLine({
        price: activeSignal.target_1,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `T1 (₹${activeSignal.target_1})`,
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, showIndicators, activeSignal, symbol]);

  // 4. Real-Time Tick Update on the active candle
  useEffect(() => {
    if (!latestTick || latestTick.symbol !== symbol || !candleSeriesRef.current || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    const timeInSec = Math.floor(new Date(lastCandle.timestamp).getTime() / 1000);

    candleSeriesRef.current.update({
      time: timeInSec as any,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, latestTick.ltp),
      low: Math.min(lastCandle.low, latestTick.ltp),
      close: latestTick.ltp,
    });
  }, [latestTick, symbol, candles]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800">
      {/* Chart Toolbar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{symbol}</span>
            <span className="text-xs font-mono text-slate-400">
              {candles.length > 0 ? `₹${candles[candles.length - 1].close.toFixed(2)}` : ''}
            </span>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            {(['1m', '5m', '15m'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              showIndicators
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showIndicators ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Indicators</span>
          </button>

          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Reset Chart View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Indicator Legend */}
      {showIndicators && (
        <div className="px-3 py-1 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span> VWAP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span> EMA 9
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-purple-400 inline-block"></span> EMA 21
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="flex-1 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 text-xs text-indigo-300 font-medium">
            Loading {symbol} candles...
          </div>
        )}
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};
