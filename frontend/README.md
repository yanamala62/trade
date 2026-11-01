# AI Trade Assist - Standalone Frontend & Android App

Modern React 19 + TypeScript + Vite + Tailwind CSS trading terminal and Android APK for live NSE market analysis, AI Opportunity Radar, and Interactive Candlestick Charts.

---

## 1. Local Web Development

### Prerequisites
* Node.js 18+
* npm

### Setup Steps
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set backend URL in .env
cp .env.example .env

# 3. Start development server
npm run dev
```
Local dev app runs at: `http://localhost:5173`

---

## 2. Standalone Web Deployment

### A. Deploy to Vercel / Netlify / Cloudflare Pages
1. Push this `frontend` directory as its own GitHub repository (or select root directory as `frontend` in your cloud dashboard).
2. Configure build settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. In Environment Variables, set:
   * `VITE_BACKEND_URL`: `https://your-deployed-backend-url.com`
4. Deploy!

*(Note: Users can also update the backend host anytime directly inside the app by clicking the ⚙️ Settings icon in the header).*

---

### B. Deploy with Docker & Nginx
```bash
# Build standalone frontend container
docker build -t ai-trade-frontend .

# Run container on port 80
docker run -d --name trade-frontend -p 80:80 ai-trade-frontend
```

---

## 3. Building the Android APK

This frontend is equipped with **Capacitor Android** in `./android`.

### Step 1: Sync Web Assets to Android
```bash
npm run cap:sync
```
*(Builds the Vite production bundle and updates Android native assets in ~2 seconds).*

### Step 2: Build APK via Android Studio
1. Open the Android project in Android Studio:
   ```bash
   npm run cap:open
   ```
2. In Android Studio top menu:
   Click **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)**.
3. The generated APK will be at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Step 3: Build APK via Command Line (Gradle)
```bash
cd android
.\gradlew.bat assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. Connecting the Android App to your Backend
1. Install `app-debug.apk` on your phone.
2. Open the app and tap the **⚙️ Settings** icon in the header.
3. Enter your backend host:
   * For local Wi-Fi testing: `http://192.168.x.x:8000`
   * For cloud deployment: `https://your-backend.onrender.com`
4. Tap **Save & Reconnect**.
