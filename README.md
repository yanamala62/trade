# AI Trade Assist (NSE India Intraday Decision Support)

Production-grade, NSE (India) decision-support system featuring live WebSocket data ingestion, pure deterministic technical indicators & pattern recognition, automated pre-trade risk gating, historical backtesting with Indian transaction costs (STT, GST, stamp duty, slippage), and an LLM explanatory layer (strictly text-only).

Includes native **Android APK** packaging powered by **Capacitor 8** alongside a responsive Vite + React + TypeScript + Tailwind CSS web dashboard.

---

## 🚀 Key Highlights & Architecture

- **Deterministic Core**: All entry prices, stops, targets, quantity sizing, and expectancy metrics are computed by audited Python math functions.
- **Strict LLM Guardrails**: Google Gemini provides plain-English trade reasoning and news summarization only. An automated unit test asserts that the LLM cannot alter or tamper with numeric trade parameters.
- **Risk Gate Pre-Trade Blockers**: Enforces max risk per trade (1%), daily loss limit (3%), max daily trades (5), min R:R ratio (1.5:1), no-trade opening/closing windows, and stale tick blocking (>3s).
- **Indian Market Cost Engine**: Backtests simulate realistic Indian equity intraday charges including ₹20 flat brokerage, STT (0.025% on sell), Exchange turnover (0.00297%), GST (18%), SEBI turnover, and Stamp duty.
- **Cross-Platform Mobile APK**: Native Android scaffolding with safe-area insets, mobile bottom navigation, dark mode, and configurable backend IP host in Settings.

---

## 🛠 Project Structure

```
trading_app/
├── backend/
│   ├── app/
│   │   ├── alerts/         # Telegram notification dispatcher
│   │   ├── api/            # FastAPI REST & WebSocket endpoints
│   │   ├── backtest/       # Historical replay & Monte Carlo fan-chart
│   │   ├── brokers/        # Angel One, Fyers, RealNSE, MockBroker
│   │   ├── db/             # Async SQLite / PostgreSQL repositories
│   │   ├── indicators/     # Pure Python VWAP, EMA, RSI, ATR, ORB
│   │   ├── ingest/         # Candle builder & tick normalizer
│   │   ├── llm/            # Gemini explainer & news summarizer
│   │   ├── patterns/       # ORB, VWAP Reclaim, Pullback, Volume Breakout
│   │   ├── risk/           # Pre-trade deterministic risk gating
│   │   └── signals/        # Signal schema, sizing & exit rules
│   ├── tests/              # 19 passing unit & integration tests
│   └── requirements.txt
├── frontend/
│   ├── android/            # Capacitor Native Android Project (Ready for APK build)
│   ├── src/
│   │   ├── components/     # Watchlist, LiveChart, SignalsPanel, TimeMachine, Scoreboard, Journal, Settings
│   │   ├── services/       # REST API & WebSocket client with IP selector
│   │   └── types/          # TypeScript contracts
│   ├── capacitor.config.ts # Android scheme & cleartext HTTP config
│   └── package.json
├── docker-compose.yml
├── Makefile
└── fullappdetails.md       # Master specification
```

---

## 📦 Decoupled Architecture & Standalone Deployments

Both the **Backend** and **Frontend** are 100% decoupled and can be deployed to separate servers or repositories independently:

* **Backend (`/backend`)**: Completely self-contained FastAPI server with its own `Dockerfile`, `docker-compose.yml`, `.env.example`, and dependencies. Can be deployed to Render, Railway, AWS, DigitalOcean, or Docker without the frontend.
* **Frontend (`/frontend`)**: Completely self-contained React 19 + Vite web application with its own `Dockerfile`, `nginx.conf`, `.env.example`, and native Android Capacitor project. Can be deployed to Vercel, Netlify, or Docker, and built into an Android APK without the backend source code.

---

## ⚡ Quickstart

### 1. Run the Backend (Standalone)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The REST API will be available at `http://localhost:8000/api` and WebSocket at `ws://localhost:8000/ws/live`.
See [backend/README.md](backend/README.md) for independent Docker, Render, and VPS deployment instructions.

### 2. Run the Frontend (Standalone Web)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
Set `VITE_BACKEND_URL=https://your-deployed-backend.com` in `frontend/.env` to point to a remote backend.
See [frontend/README.md](frontend/README.md) for independent Vercel, Netlify, and Docker deployment instructions.

### 3. Run Backend Test Suite
```bash
cd backend
python -m pytest -v
```
All 19 unit & integration tests pass with 100% success.

---

## 📱 Android APK Generation (Capacitor)

The frontend is already initialized with Capacitor and has an active Android platform configured with `INTERNET` and `usesCleartextTraffic` permissions.

1. **Build the web assets & sync to Android:**
   ```bash
   cd frontend
   npm run build
   npx cap sync
   ```

2. **Generate the APK:**
   - **Option A (Android Studio):**
     ```bash
     npx cap open android
     ```
     In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
     The output `.apk` file will be located at:
     `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

   - **Option B (Command Line with JDK & Android SDK):**
     ```bash
     cd frontend/android
     ./gradlew assembleDebug
     ```

3. **Connecting APK to Your Backend:**
   In the APK, tap the ⚙️ **Settings** gear icon in the top header and enter your computer's local IP address (e.g., `http://192.168.1.5:8000` or `http://10.0.2.2:8000` for Android Emulator).
