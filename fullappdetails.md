AI Trading Suggestion App: Plan, Architecture and Antigravity Master Prompt
NSE / India intraday decision-support tool with live data display. Built with Antigravity. Suggestions only; no automatic orders by default.
1. Goal
Build a web app that streams live NSE market data through a broker API, runs deterministic pattern and indicator logic, and shows you clear trade suggestions: what to enter, where to put the stop-loss, where to take profit, how many shares, and when to exit. An LLM adds news summaries and plain-language explanations only. It never decides prices or quantities.
2. Design principles (borrowed from the day-trader-skill repo)
1. Numbers come from code, not from the LLM. Entry, stop, target, probability and position size are computed by tested Python functions.
2. A risk gate sits in front of every suggestion. Max loss per trade, daily loss limit, trades per day, minimum reward-to-risk, no-trade time windows, capital check. If any check fails, the suggestion is blocked.
3. Replay before risk. Every rule must be backtested on historical intraday candles, including costs, before it is shown live.
4. Human approval for orders. The default mode is suggestion-only. Order placement, if ever added, needs a manual confirmation and is off by default.
5. Broker-agnostic. All broker code sits behind one adapter interface.
Note: that repo targets US stocks only, so reuse the ideas and structure, not the data or broker code. Check its license before copying any code.
3. Architecture
 Broker API (WebSocket + REST)        NSE announcements / news RSS
            |                                   |
   +--------v---------+               +---------v----------+
   | Broker Adapter   |               | News/Filings       |
   | (Kite/Upstox/    |               | Ingestor           |
   |  Angel/Dhan/Mock)|               +---------+----------+
   +--------+---------+                         |
            | ticks                             |
   +--------v---------+                         |
   | Tick Normalizer  |                         |
   | + Candle Builder |                         |
   | (1m, 5m, 15m)    |                         |
   +----+--------+----+                         |
        |        |                              |
        |   +----v-----------+                  |
        |   | Redis (latest  |                  |
        |   | ticks, pubsub) |                  |
        |   +----+-----------+                  |
   +----v--------v----+                         |
   | TimescaleDB /    |                         |
   | PostgreSQL       |<------------------------+
   +----+-------------+
        |
   +----v-----------------+     +------------------+
   | Indicator + Pattern  |---->| Signal Engine    |
   | Library (pure funcs) |     | entry/stop/target|
   +----------------------+     +--------+---------+
                                         |
                                +--------v---------+
                                | Risk Gate        |
                                | (PASS / BLOCK)   |
                                +--------+---------+
                                         |
        +--------------------------------+----------------+
        |                                                 |
+-------v--------+                              +---------v--------+
| FastAPI REST   |                              | WebSocket / SSE  |
| (history,      |                              | Live Gateway     |
|  signals, cfg) |                              | (ticks, candles, |
+-------+--------+                              |  signals)        |
        |                                       +---------+--------+
        +------------------+--------------------------+
                           |
                  +--------v---------+        +-----------------+
                  | Next.js Frontend |        | LLM Explainer   |
                  | live charts,     |<-------| (news summary,  |
                  | watchlist,       |        |  why-this-trade)|
                  | signals, journal |        +-----------------+
                  +------------------+
                           |
                  Telegram / push alerts
4. Recommended tech stack
Layer
Choice
Why
Backend
Python 3.11+, FastAPI, asyncio
Best ecosystem for data and indicators; native WebSocket support
Indicators
pandas, numpy; own pure functions for VWAP, EMA, RSI, ATR, opening range
Easy to unit test; no heavy dependency
Storage
PostgreSQL + TimescaleDB (SQLite for the first prototype)
Time-series candles and signal history
Live cache and fan-out
Redis (pub/sub)
Pushes ticks to many browser clients
Frontend
Next.js + TypeScript + Tailwind
Fast dashboard
Charts
TradingView Lightweight Charts
Free, built for live candlesticks
Alerts
Telegram bot
Simple and reliable
LLM
Gemini API (free tier), used only for text
News summaries and explanations
Infra
Docker Compose
One command to run everything
5. Live data display (what you will see)
• Live watchlist: symbol, LTP, change %, volume, day high/low, colour flashes on tick changes.
• Live candlestick chart: 1m / 5m / 15m, with VWAP, EMA lines, opening-range box, and markers for suggested entry, stop and target.
• Market overview: Nifty 50, Bank Nifty, India VIX, advance/decline.
• Signals panel: live list of current suggestions with status (Pending, Triggered, Hit target, Stopped, Expired).
• Why panel: the pattern, the numbers behind it, and an LLM explanation plus related news.
• Risk panel: capital, risk used today, trades taken, daily loss remaining.
• Connection health: feed status, last tick time, latency. A clear red banner if data is stale.
How live data flows: broker WebSocket, then the backend normalizes ticks, builds candles and publishes to Redis, then a WebSocket gateway pushes updates to the browser. Throttle UI updates to about 4 to 10 per second per symbol so the browser stays smooth.
5A. Real-time feed: best free APIs and what real time means
The best free source is a broker WebSocket, which pushes ticks to your app as they happen. Zero delay is not physically possible: every feed adds network and broker time, and only firms with exchange co-location and paid exchange feeds get close to it. Expect a fraction of a second to about a second in normal conditions (not guaranteed), and let the app measure it instead of assuming.
Priority
API
Cost
Role in this app
1
Angel One SmartAPI WebSocket
Free
Primary live feed and historical candles
2
Fyers API v3 WebSocket
Free
Second feed for cross-checking, free minute-level history
3
Upstox Developer API
Free API (check limits)
Optional third feed
4
Dhan (data pack)
About ₹500 per month
Paid upgrade if the free feeds are not good enough
5
Zerodha Kite Connect
Paid, about ₹2,000 per month quoted
Premium option with a mature binary stream
How to get the lowest delay you can:
• Use WebSocket streaming only. Never poll REST endpoints for live prices.
• Run the backend on a cloud server in the Mumbai region, or at least on a wired connection, not home Wi-Fi.
• Stamp every tick on arrival, and show feed latency (exchange time versus arrival time) and last-tick age in the dashboard.
• Run two feeds (Angel One and Fyers) and flag the symbol when their prices diverge.
• Keep the signal path in memory (asyncio queues and Redis). Write to the database in batches in the background so storage never slows signals.
• Subscribe only to your watchlist, because free feeds cap the number of instruments.
• Remember that broker feeds are typically market snapshots (last price, volume, best bid and ask), not every trade. Signals built on 1-minute and 5-minute candles do not need millisecond data; speed matters most for the live display and stop or target alerts.
5B. User options: segment, style, direction, horizon
The user picks these before suggestions are shown, and can change them any time.
Option
Choices
Notes
Segment
Cash (equity) or F&O
Start with cash. F&O comes in a later phase, with defined-risk strategies only
Style
Intraday, Swing (holds for days), Positional / long-term
Each style has its own candle timeframe, setups and risk rules
Direction
Long or Short
Cash shorting is intraday only. Overnight bearish views use futures or put options
Horizon
Number of days (for example 1, 3, 5, 10)
Output includes an expected price range: low, base and high for that horizon
Risk profile
Capital, risk per trade, daily loss limit
Feeds the risk gate
F&O extras
Index or stock, expiry, lot size, option chain, margin check
Buy options or vertical spreads only; no naked option selling suggestions by default
The expected price range is calculated from volatility (ATR) and the historical outcomes of the same setup. The LLM never produces it.
5C. Tracked trades and live updates
The user can tap Track on any suggestion, or add their own position (symbol, entry price, quantity). Tracked trades live in their own list.
• Live profit and loss, distance to stop and target, and time left for the chosen horizon.
• Updates pushed to the dashboard and Telegram: target hit, stop hit, stop moved up (trailing), signal invalidated, time-based exit, and important news or filings on that stock.
• A clear status for each trade: Watching, Entered, Partially exited, Exited, Stopped, Expired.
• Every event is stored, so a trade journal and per-setup results build up automatically.
5D. Accuracy target: why not 99%
No trading system can honestly promise 99% success. Anyone who does is selling something. A system can show a high win rate only by taking tiny profits with large stops, and then one bad trade wipes out many wins. Markets are noisy, costs eat small edges, and results that look great in a backtest usually shrink live. For F&O the evidence is harsh: a SEBI study found about 93% of individual F&O traders lost money between FY22 and FY24, and the later FY25 and FY26 studies show similar loss shares.
What the app aims for instead:
• Measured confidence, not a promised number. Each suggestion shows the setup's out-of-sample win rate, average reward-to-risk, expectancy after costs, sample size and worst drawdown.
• Selectivity. No trade is a valid output. The app only shows setups that pass strict filters, even if that means few suggestions per day.
• Confidence grades (A, B, C) based on backtest and live paper results. A new setup stays at C until it proves itself.
• Suggested acceptance tests before a setup is enabled (adjust as you learn): at least 300 backtest trades, positive expectancy after all costs, profit factor above 1.3, walk-forward out-of-sample results that match in-sample, and 4+ weeks of paper trading that matches.
• Risk first. Position size is set so one loss is small, which is what keeps you in the game.
5E. User flow: pick one stock, then get the full analysis
The app analyses one stock at a time, on request, instead of scanning everything. This keeps it fast and keeps the load on the free APIs low.
1. Search and pick a stock. The user types a symbol or name (autocomplete from the NSE instrument list).
2. Choose the segment: F&O or Other (cash equity).
3. Choose style, direction and horizon (intraday, swing or positional; long or short; number of days).
4. The app runs the full analysis and shows a report with a clear verdict: Buy / Sell (or Short) / No trade.
5. Track it. One tap adds the stock and the suggested trade to the tracked list for live updates.
What the full analysis report contains
Part
Content
Snapshot
Live price, day range, 52-week range, volume against average, sector, market cap
Trend and levels
Trend on daily, 15-minute and 5-minute charts; support and resistance; VWAP; EMA 9, 21, 50, 200; RSI; ATR
Strength
Performance against Nifty and its sector index; volume and delivery trends
Fundamentals
Key ratios, results history, debt, promoter holding, dividends and results dates. Taken from free sources, so the app shows the source and date and marks missing items
News and filings
NSE announcements, bulk and block deals, and recent news, summarised by the LLM
F&O data (when F&O is chosen)
Lot size, expiry, open interest and its change, put-call ratio, implied volatility, option chain around the price, margin needed
Trade suggestion
Entry, stop-loss, targets, quantity, expected price range for the chosen days, reward-to-risk
Time machine
Historical replay and simulation results (below)
Risk gate
Pass or block, with each check listed
Confidence
Grade A, B or C, with the measured statistics behind it
Time machine analysis
Before the verdict is shown, the app replays the exact suggested trade through history for that stock:
• Historical replay. Take the last 60 to 250 sessions (5-minute candles for intraday, daily candles for swing). Find the moments that looked like now (similar trend, volatility, gap and time of day). Apply the same entry, stop and target rules and record whether the target or the stop came first, how long it took, and the worst move against the trade.
• Simulation. Resample the stock's own past price moves into thousands of possible paths for the remaining session or the chosen days. Report the chance of reaching the target before the stop, and a low, base and high price range.
• Cost and slippage included. Results are shown after brokerage, taxes and slippage.
• Output. A fan chart of simulated paths, a small table of replay results (hit rate, average time to target, worst drawdown, sample size), and one sentence of plain-language reading.
• Rule. If there are too few similar past cases, or the replay shows poor results, the verdict becomes No trade. These figures are estimates from history, not guarantees.
5F. Real Accuracy page: the honest scoreboard
A dedicated page shows how the app's suggestions have actually performed, so you decide what to trust based on data, not claims.
Measure
What it shows
Trades suggested and taken
Count per setup, style (intraday, swing) and segment (cash, F&O)
Win rate
Share of trades that hit the target first
Average win and average loss
Needed to judge whether the win rate matters
Profit factor and expectancy
Gross profit divided by gross loss; average result per trade in rupees and in R (units of risk)
Max drawdown and losing streak
The worst stretch so far
Backtest versus paper versus live
Side by side, with a warning when live results fall well below the backtest
Data and system health
Feed uptime, stale-data blocks, alerts delivered, price mismatches between the two feeds
Behaviour rules:
• Every suggestion's outcome (target hit, stopped, expired, exited by time) is logged automatically, including trades you did not take.
• Results are grouped by setup, stock, time of day and market condition, so weak spots are visible.
• A setup is flagged and switched to grade C or turned off automatically when its recent results drop below its acceptance tests.
• Small samples are labelled as unreliable instead of being shown as a confident percentage.
• The page never shows a single headline accuracy number without the profit factor and sample size beside it.
6. Signal engine (start small)
Build 3 to 4 simple, well-defined setups first and prove them with backtests:
1. Opening Range Breakout (ORB): break of the first 15-minute high or low with volume confirmation.
2. VWAP reclaim / rejection: price crosses VWAP with trend alignment (EMA 9 over EMA 21).
3. Trend pullback: pullback to EMA in an established trend, with RSI filter.
4. Volume spike breakout of the previous day's high or low.
Every signal outputs one structured object:
{
  "id": "uuid",
  "symbol": "RELIANCE",
  "setup": "ORB_LONG",
  "side": "BUY",
  "entry": 2951.50,
  "stop_loss": 2938.00,
  "target_1": 2972.00,
  "target_2": 2990.00,
  "quantity": 37,
  "risk_amount": 499.5,
  "reward_risk": 1.52,
  "valid_until": "2026-11-02T11:30:00+05:30",
  "backtest_stats": {"win_rate": 0.46, "expectancy_r": 0.18, "samples": 412},
  "risk_gate": {"status": "PASS", "checks": []},
  "reasons": ["Broke 15m high on 2.1x avg volume", "Above VWAP", "EMA9 > EMA21"]
}
Exit logic: fixed stop, partial profit at target 1 with stop moved to breakeven, ATR trailing stop, hard time exit before the market close window (square off ahead of 3:15 PM IST to avoid broker auto square-off charges; confirm your broker's cutoff).
7. Risk gate rules (configurable)
• Max loss per trade (for example 0.5 to 1% of capital)
• Daily loss limit (stop suggestions after it is hit)
• Max trades per day
• Minimum reward-to-risk (for example 1.5)
• No-trade windows (first few minutes after open, last 15 minutes)
• Minimum liquidity and spread filter
• Position size capped by available capital and margin
• Cooldown after consecutive losses
• Stale data check: block signals if the last tick is older than N seconds
8. Build phases and acceptance criteria
Phase
Deliverable
Done when
0. Setup
Monorepo, Docker Compose, config, mock feed
docker compose up runs everything with simulated ticks
1. Live data
Broker adapter, tick stream, candle builder, DB
Live ticks for a 20-stock watchlist appear in the DB
2. Live UI
Watchlist, live chart, market overview, health banner
Browser shows live prices updating without refresh
3. Indicators
Pure functions with unit tests
Values match a reference (TradingView or a known library)
4. Signals
3 to 4 setups, structured output
Signals generate on historical replay
5. Backtester
Replay engine with brokerage, STT, slippage
Report with win rate, expectancy, drawdown per setup
6. Risk gate
Rule engine with tests
Every rule has a passing and a blocking test
7. Signals UI + alerts
Signals panel, Telegram alerts, journal
Suggestions appear live and are logged with outcomes
8. LLM layer
News summary, explanations
Explanations never alter numbers (verified by test)
9. Paper trading
4+ weeks of live paper results
Live results compared with the backtest
10. Optional
One-tap order with confirmation
Disabled by default; paper mode first
9. Safety, legal and practical notes
• Most intraday traders lose money, and good backtests often fail live. Treat paper trading as the real test.
• Costs (brokerage, STT, exchange charges, GST, slippage) can erase small edges. The backtester must include them.
• Broker APIs usually restrict redistribution of market data. Use this for personal use. If you plan to offer signals to others, SEBI's research analyst and investment adviser rules likely apply, so get professional advice first.
• Broker and SEBI API rules (registration, static IP, order limits) change. Check your broker's current documentation before enabling order placement.
• Store API keys in environment variables or a secrets manager. Never commit them. Daily access tokens must be refreshed by a login flow.
• This is a decision-support tool, not financial advice.
10. Master prompt for Antigravity (copy everything in the box)
You are a senior full-stack and quantitative engineer. Build a production-quality, open-source-style project called 'ai-trade-assist': a LIVE NSE (India) intraday trading SUGGESTION app. It streams live market data from a broker API, computes deterministic indicators and patterns, produces trade suggestions (entry, stop-loss, targets, quantity, exit rules), displays everything live in a web dashboard, and logs outcomes. It is decision-support only. It must NOT place orders automatically.

## Non-negotiable rules
1. All trade numbers (entry, stop, target, quantity, probabilities) are computed by deterministic, unit-tested Python functions. The LLM is used ONLY for text: news summaries and plain-language explanations. The LLM must never output or modify prices, quantities or levels.
2. Every suggestion passes through a Risk Gate. If any check fails, the suggestion is BLOCKED and shown with the reason.
3. Default mode is SUGGEST_ONLY. Order placement is a separate, disabled-by-default feature behind a config flag, requiring manual confirmation per order, and paper mode first.
4. All broker access goes through a BrokerAdapter interface. Implement MockBroker (simulated ticks, works offline) first. Then implement the real adapter for the broker named in config (primary ANGEL_ONE (SmartAPI, free live and historical data, TOTP login with automatic daily session refresh), secondary FYERS (API v3, free); leave stubs for UPSTOX, DHAN and ZERODHA_KITE. Run primary and secondary feeds together and flag symbols where their prices diverge).
5. No secrets in code. Use .env and provide .env.example. Never log tokens.
6. Every rule and indicator needs unit tests. Strategies need backtests that include brokerage, STT, exchange charges, GST and slippage.
7. Mark the data as stale and block signals if the last tick is older than a configurable number of seconds.
8. Show a clear disclaimer in the UI: decision-support only, not financial advice.

## Tech stack
- Backend: Python 3.11+, FastAPI, asyncio, pandas, numpy, SQLAlchemy, Alembic, pydantic, pytest
- Storage: PostgreSQL with TimescaleDB (SQLite fallback for local dev), Redis for latest ticks and pub/sub
- Frontend: Next.js (App Router), TypeScript, Tailwind, TradingView Lightweight Charts, Zustand or React Query for state
- Transport to browser: WebSocket (preferred) with SSE fallback
- Alerts: Telegram bot
- LLM: Google Gemini API (Flash model, free tier key from Google AI Studio) behind an LLMProvider interface, for explanations and news summaries only
- Infra: Docker Compose (api, worker, db, redis, web), Makefile, GitHub Actions CI (lint, type-check, tests)

## Repository layout
ai-trade-assist/
  docker-compose.yml, Makefile, .env.example, README.md
  backend/
    app/
      main.py
      config.py
      brokers/ (base.py BrokerAdapter, mock.py, kite.py, upstox.py, angel.py, dhan.py)
      ingest/ (tick_normalizer.py, candle_builder.py, instrument_master.py, news_ingestor.py)
      indicators/ (vwap.py, ema.py, rsi.py, atr.py, opening_range.py, volume.py)
      patterns/ (orb.py, vwap_reclaim.py, trend_pullback.py, volume_breakout.py)
      signals/ (engine.py, sizing.py, exits.py, schemas.py)
      risk/ (gate.py, rules.py)
      backtest/ (replay.py, costs.py, metrics.py, report.py)
      llm/ (explainer.py, news_summary.py)  # text only
      api/ (rest.py, ws_gateway.py)
      alerts/ (telegram.py)
      db/ (models.py, repo.py, migrations/)
    tests/
  frontend/
    app/ (dashboard, watchlist, signals, backtests, journal, settings)
    components/ (LiveChart, Watchlist, SignalCard, RiskPanel, MarketOverview, HealthBanner, WhyPanel)
    lib/ (wsClient.ts, store.ts, types.ts)
  docs/ (architecture.md, strategies.md, risk-rules.md, broker-setup.md)

## Live data requirements
- Subscribe to a configurable watchlist (default 20 liquid NSE stocks plus Nifty 50, Bank Nifty, India VIX).
- Normalize ticks to a common schema: symbol, ltp, volume, bid, ask, timestamp (IST).
- Build 1m, 5m, 15m candles in real time and persist them. Handle reconnects, gaps and duplicate ticks.
- Publish ticks, candle updates and signal updates through Redis to the WebSocket gateway. Throttle UI updates to at most 10 per second per symbol.
- Frontend must show: live watchlist with flashing price changes, live candlestick chart with VWAP/EMA overlays and markers for suggested entry/stop/target, market overview (Nifty, Bank Nifty, VIX), connection-health banner (feed status, last tick age, latency), signals panel with live status (Pending, Triggered, Target hit, Stopped, Expired), risk panel (capital, risk used, trades taken, daily loss remaining), and a Why panel (numbers, pattern, LLM explanation, related news).
- Market hours awareness (NSE 9:15 to 15:30 IST, holidays calendar), pre-open and closed states in the UI.

## Signal engine
Implement these setups first, each as a pure function plus config parameters:
1. Opening Range Breakout (first 15 minutes, volume confirmation)
2. VWAP reclaim / rejection with EMA9/EMA21 trend filter
3. Trend pullback to EMA with RSI filter
4. Previous-day high/low breakout with volume spike
Each suggestion returns this JSON schema: id, symbol, setup, side, entry, stop_loss, target_1, target_2, quantity, risk_amount, reward_risk, valid_until, backtest_stats {win_rate, expectancy_r, samples}, risk_gate {status, checks[]}, reasons[].
Exits: fixed stop, partial profit at target 1 then stop to breakeven, ATR trailing stop, mandatory time-based exit suggestion before the configured square-off time (default 15:15 IST).

## Risk gate (all configurable in settings and DB)
Max loss per trade (% of capital), daily loss limit, max trades per day, minimum reward-to-risk, no-trade windows (first N minutes, last 15 minutes), liquidity and spread filter, capital and margin cap on position size, cooldown after N consecutive losses, stale-data block. Return PASS or BLOCK with a list of failed checks.

## Backtester
Replay historical intraday candles through the same signal and risk code used live (no separate logic). Include brokerage, STT, exchange charges, GST, SEBI charges, stamp duty and slippage. Output per setup: trades, win rate, average R, expectancy, profit factor, max drawdown, equity curve, and breakdown by time of day and symbol. A strategy may only be enabled for live suggestions if its backtest passes configurable thresholds.

## LLM layer (text only)
- explainer.py: given the signal JSON, produce a short plain-language explanation. It must quote numbers exactly from the JSON.
- news_summary.py: summarise recent NSE announcements and news headlines for a symbol.
- Add a test that fails if the LLM output contains any price or quantity not present in the input JSON.

## Delivery plan (work in this order, pausing after each phase to run tests and show me a summary)
Phase 0: monorepo, Docker Compose, config, MockBroker producing simulated ticks.
Phase 1: tick pipeline, candle builder, DB, instrument master.
Phase 2: live dashboard (watchlist, chart, market overview, health banner) driven by MockBroker.
Phase 3: indicator library with unit tests.
Phase 4: pattern and signal engine.
Phase 5: backtester with costs and reports.
Phase 6: risk gate with tests.
Phase 7: signals UI, risk panel, Telegram alerts, trade journal with outcome tracking.
Phase 8: LLM explainer and news summary.
Phase 9: real broker adapters (Angel One first, then Fyers), token-refresh flow, reconnect handling, paper-trading mode.
Phase 10 (optional, off by default): manual-confirmation order placement in paper mode.

## Reuse of day-trader-skill ideas
If you can access https://github.com/Jakeschincariol/day-trader-skill, read it and check its license first. Reuse its design (deterministic Python calculators for numbers, a risk check that must pass before any order, a replay step before risking money, human approval for orders, one module per task such as scanner, news, entry, exit, timemachine, risk, budget, alerts). Port the logic to NSE data and rules. Do not copy US-specific data, broker or market-hour code. Map: scanner to signals/scanner, news to llm/news_summary plus NSE announcements, entry and exit to signals/engine and exits, timemachine to backtest/replay, risk and budget to risk/gate and sizing, alerts to alerts/telegram. Drop the US congressional trades skill; use NSE bulk and block deals and insider filings instead.

## User options
The user chooses: SEGMENT (CASH or FNO), STYLE (INTRADAY, SWING, POSITIONAL), DIRECTION (LONG or SHORT), HORIZON in days (1 to 30), capital and risk profile. Each style has its own timeframe, setups and risk limits. CASH shorting is intraday only; overnight bearish ideas use futures or puts. FNO is a later phase (Phase 11): instrument master with lot sizes and expiries, option chain view, margin check, and defined-risk strategies only (long calls or puts, vertical spreads, futures). No naked option selling suggestions. Every suggestion also returns expected_range {days, low, base, high} computed from ATR and the empirical outcome distribution of the same setup, never from the LLM.

## Tracked trades
Add a Track button on every suggestion and a form to add the user's own position (symbol, entry, quantity). Tables: tracked_trades and trade_events. For each tracked trade stream live P&L, distance to stop and target, and time left in the horizon. Push events to the dashboard and Telegram: target hit, stop hit, trailing stop moved, signal invalidated, time exit, important news or filing. Status values: WATCHING, ENTERED, PARTIAL, EXITED, STOPPED, EXPIRED. Feed outcomes into per-setup statistics and the journal.

## Accuracy policy
Never display or claim a fixed success percentage such as 99%. Show per suggestion: out-of-sample win rate, average reward-to-risk, expectancy after costs, sample size, worst drawdown, and a confidence grade A, B or C. NO_TRADE is a valid output. A setup is enabled only if it passes configurable acceptance tests (defaults: at least 300 backtest trades, positive expectancy after all costs, profit factor above 1.3, walk-forward out-of-sample results consistent with in-sample, paper trading consistent with the backtest). New setups start at grade C.

## User flow and full stock analysis (build as Phase 5A, after the backtester, reusing it)
The app analyses ONE stock at a time on request, not the whole market. Flow: (1) search and pick a stock with autocomplete from the NSE instrument master; (2) choose SEGMENT (FNO or OTHER/cash); (3) choose STYLE, DIRECTION and HORIZON in days; (4) the backend runs the analysis pipeline and returns a report with verdict BUY, SELL_SHORT or NO_TRADE; (5) a Track button adds it to the tracked list. Cache each report briefly and rate-limit analysis requests to respect free API limits.
Analysis report sections: snapshot (live price, day range, 52-week range, volume vs average, sector, market cap); trend and levels (daily, 15m, 5m trend, support and resistance, VWAP, EMA 9/21/50/200, RSI, ATR); relative strength vs Nifty and sector index; fundamentals (key ratios, results history, debt, promoter holding, dividends, upcoming results date) from free sources with source name and as-of date, marking missing data instead of guessing; news and filings (NSE announcements, bulk and block deals, news headlines) summarised by the LLM; F&O data when FNO is chosen (lot size, expiry, open interest and change, put-call ratio, implied volatility, option chain near the price, margin); the trade suggestion (entry, stop, targets, quantity, expected_range, reward_risk); time machine results; risk gate result; confidence grade and the statistics behind it.
Time machine module (backtest/time_machine.py): (a) historical replay: take the last 60 to 250 sessions (5-minute candles for intraday, daily candles for swing), find past moments similar to the current state (trend, volatility regime, gap, time of day), apply the exact suggested entry, stop and target, and record target-before-stop rate, average time to target, max adverse excursion, max favourable excursion and sample size; (b) simulation: bootstrap the stock's own historical returns into at least 10,000 price paths for the remaining session or the chosen days, and report probability of hitting target before stop and a low, base and high price range; (c) include brokerage, taxes and slippage; (d) output a fan-chart data series and a results table; (e) if the number of similar past cases is below a configurable minimum, or the results fail the acceptance tests, force the verdict to NO_TRADE. State clearly in the UI that results are historical estimates, not guarantees. All statistics are computed in Python and unit-tested; the LLM only writes the plain-language reading and must quote numbers exactly from the computed JSON.
UI: an Analyse page with stock search, segment and style selectors, then the report with a live chart, the time machine fan chart, the verdict card and a Track button.

## Real Accuracy page (build as Phase 7A, after signals UI and journal)
Build a page that shows the real track record of the app. Log the outcome of every suggestion automatically (TARGET_HIT, STOPPED, EXPIRED, TIME_EXIT), including suggestions the user did not take. Show per setup, style, segment, stock, time of day and market condition: trades count, win rate, average win, average loss, profit factor, expectancy in rupees and in R, max drawdown, longest losing streak, and sample size. Show backtest, paper and live results side by side and warn when live results fall well below the backtest. Show system health: feed uptime, stale-data blocks, alert delivery, price mismatches between the primary and secondary feeds. Automatically downgrade a setup to grade C, or disable it, when its recent results fall below the acceptance tests. Label small samples as unreliable. Never show a headline win rate without profit factor and sample size beside it. Add unit tests for every metric against hand-calculated examples. Never display or claim a fixed accuracy such as 99%.

## Quality bar
Type hints everywhere, ruff and mypy clean, pytest coverage above 80% for indicators, signals, risk and backtest, ESLint and TypeScript strict on the frontend, a README with a 5-minute quickstart using MockBroker, and docs for each strategy and risk rule. Ask me before making assumptions about broker choice, capital size or watchlist. Start with Phase 0 now and show the plan before writing code.
11. Follow-up prompts to use later
• Broker adapter: Implement the Angel One SmartAPI adapter with TOTP login and daily session refresh, WebSocket reconnect with backoff, and subscription limits handling. Add integration tests using recorded ticks.
• Strategy review: Run the backtester on the last 12 months of 5-minute data for my watchlist. Report each setup's expectancy after costs and recommend which to disable.
• Hardening: Add structured logging, Prometheus metrics, a kill switch that stops all suggestions, and a daily PDF or HTML summary of signals and outcomes.
• Paper trading: Add a paper-trading simulator that fills at the next tick, applies costs and slippage, and compares results against the backtest.
