import { TickData, Candle, SignalSuggestion, AnalysisResponse, AccuracyData, TrackedTrade, ScreenerResponse, ScreenerCandidate } from '../types';

const STORAGE_KEY_API_HOST = 'ai_trade_assist_backend_url';

export function getBackendBaseUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY_API_HOST);
  // Respect saved custom host unless it's a stale localhost address while viewing on a deployed host
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (saved && (isLocalHost || !saved.includes('localhost'))) {
    return saved.trim().replace(/\/+$/, '');
  }

  // Check Vite build-time environment variable (e.g. on Netlify, Render, Vercel)
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Live Render production backend by default for web and Android APK
  return 'https://trade-yccn.onrender.com';
}

export function setBackendBaseUrl(url: string): void {
  const cleanUrl = url.replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API_HOST, cleanUrl);
}

export function getWebSocketUrl(): string {
  const base = getBackendBaseUrl();
  const wsProto = base.startsWith('https') ? 'wss' : 'ws';
  const hostPart = base.replace(/^https?:\/\//, '');
  return `${wsProto}://${hostPart}/ws/live`;
}

export async function fetchHealth(): Promise<any> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'OFFLINE', error: String(err) };
  }
}

export async function fetchCandles(symbol: string, timeframe: string = '5m', limit: number = 100): Promise<Candle[]> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/candles/${encodeURIComponent(symbol)}?timeframe=${timeframe}&limit=${limit}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch candles:', err);
    return [];
  }
}

export async function fetchSignals(limit: number = 30): Promise<SignalSuggestion[]> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/signals?limit=${limit}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch signals:', err);
    return [];
  }
}

export async function runDeepAnalysis(symbol: string, segment = 'CASH', style = 'INTRADAY'): Promise<AnalysisResponse | null> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, segment, style, direction: 'LONG', horizon_days: 1 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[API] Deep analysis failed:', err);
    return null;
  }
}

export async function fetchAccuracyScoreboard(): Promise<AccuracyData | null> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/accuracy`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch accuracy scoreboard:', err);
    return null;
  }
}

export async function fetchTrackedTrades(): Promise<TrackedTrade[]> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/tracked`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch tracked trades:', err);
    return [];
  }
}

export async function trackNewTrade(tradeData: Partial<TrackedTrade>): Promise<boolean> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData),
    });
    return res.ok;
  } catch (err) {
    console.error('[API] Failed to track trade:', err);
    return false;
  }
}

export async function fetchScreenerOpportunities(horizon: string = '10m'): Promise<ScreenerResponse | null> {
  const base = getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/api/screener?horizon=${encodeURIComponent(horizon)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch screener data:', err);
    return null;
  }
}

// WebSocket Stream Client
type TickListener = (tick: TickData) => void;
type CandleListener = (candle: { symbol: string; timeframe: string; candle: Candle }) => void;
type ConnectionStatusListener = (status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE') => void;

class LiveStreamManager {
  private ws: WebSocket | null = null;
  private tickListeners: Set<TickListener> = new Set();
  private candleListeners: Set<CandleListener> = new Set();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private reconnectTimer: any = null;
  private isDestroyed = false;

  public connect() {
    this.isDestroyed = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = getWebSocketUrl();
    this.notifyStatus('RECONNECTING');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.notifyStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'TICK' && payload.data) {
            for (const listener of this.tickListeners) {
              listener(payload.data);
            }
          } else if (payload.type === 'CANDLE_UPDATE' && payload.data) {
            for (const listener of this.candleListeners) {
              listener(payload.data);
            }
          }
        } catch (e) {
          // ignore parse error
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.notifyStatus('OFFLINE');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (!this.isDestroyed) {
          this.notifyStatus('OFFLINE');
        }
      };
    } catch (e) {
      this.notifyStatus('OFFLINE');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDestroyed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private notifyStatus(status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE') {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  public onTick(listener: TickListener) {
    this.tickListeners.add(listener);
    return () => { this.tickListeners.delete(listener); };
  }

  public onCandle(listener: CandleListener) {
    this.candleListeners.add(listener);
    return () => { this.candleListeners.delete(listener); };
  }

  public onStatus(listener: ConnectionStatusListener) {
    this.statusListeners.add(listener);
    return () => { this.statusListeners.delete(listener); };
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const liveStream = new LiveStreamManager();
