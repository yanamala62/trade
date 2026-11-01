# AI Trade Assist - Standalone Backend API

High-performance FastAPI decision-support engine for live NSE Indian stock trading, quantitative signals, time machine backtesting, and AI market screening.

---

## 1. Quick Start (Standalone Local Run)

### Prerequisites
* Python 3.10 or 3.11
* Pip

### Setup Steps
```bash
# 1. Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at:
* Swagger UI: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/api/health`
* Opportunity Radar: `http://localhost:8000/api/screener?horizon=915_1500`

---

## 2. Docker Deployment (Standalone)

```bash
# Build standalone image
docker build -t ai-trade-backend .

# Run standalone container
docker run -d \
  --name trade-backend \
  -p 8000:8000 \
  -e ACTIVE_BROKER=REAL_NSE_PUBLIC \
  -v $(pwd)/ai_trade_assist.db:/app/ai_trade_assist.db \
  --restart always \
  ai-trade-backend
```

Or using Docker Compose:
```bash
docker compose up -d
```

---

## 3. Cloud Deployment (Render / Railway / Fly.io / AWS)

* **Root Directory**: `backend` (or deploy this entire folder as its own repo)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
* **Environment Variables**:
  * `ACTIVE_BROKER`: `REAL_NSE_PUBLIC`
  * `APP_ENV`: `production`

---

## 4. Key Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | GET | System status, broker feed health, latency |
| `/api/screener` | GET | AI Opportunity Radar (`?horizon=915_1500`, `10m`, `1h`, `1d`, `2d`, `3d`, `1w`) |
| `/api/candles/{symbol}` | GET | OHLCV historical candlestick data |
| `/api/signals` | GET | Active quantitative strategy signals |
| `/api/tracked` | GET | Journal of tracked paper and live trades |
| `/api/track` | POST | Track new opportunity in database |
| `/api/accuracy` | GET | Honest scoreboard out-of-sample metrics |
| `/ws/live` | WebSocket | Real-time tick & candle streaming gateway |
