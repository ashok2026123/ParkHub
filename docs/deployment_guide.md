# Deployment & Configuration Guide - ParkEasy Chennai

This guide provides the instructions needed to deploy, run, and scale the ParkEasy Chennai Smart Parking Finder platform.

---

## 1. Firebase Backend Integration

ParkEasy Chennai relies on Firebase services for authentication, database, asset storage, and notifications.

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `parkeasy-chennai`.
3. Enable Google Analytics (optional, recommended for production tracking).

### Step 2: Set up Authentication
1. Navigate to **Build > Authentication > Sign-in method**.
2. Enable the following providers:
   - **Email/Password**
   - **Phone**: For OTP validation (ensure SMS quotas are configured).
   - **Google Sign-In**: Configure client credentials for Web & Mobile.

### Step 3: Configure Cloud Firestore
1. Navigate to **Build > Firestore Database**.
2. Click **Create Database** and choose a location (e.g., `asia-south1` for Chennai latency).
3. Select **Start in production mode**.
4. Deploy the security rules file provided in [firestore.rules](file:///c:/Users/Administrator/Desktop/spotpark/shared/firestore.rules).

### Step 4: Configure Cloud Storage
1. Navigate to **Build > Storage**.
2. Enable Storage and set basic rules allowing users to write to `parking_images/{locationId}/` only if authenticated as `owner`.

---

## 2. React Web App Deployment

The frontend dashboard is developed using React and Vite.

### Step 1: Install Dependencies
Run from the `/web` directory:
```bash
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in `/web`:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="parkeasy-chennai.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="parkeasy-chennai"
VITE_FIREBASE_STORAGE_BUCKET="parkeasy-chennai.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

### Step 3: Local Development Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Deploying to Production (Firebase Hosting)
Initialize Firebase CLI in the root directory:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```
- Select `web/dist` as your public directory.
- Configure as a single-page app (Yes).
- Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## 3. Flutter Mobile App Setup

The cross-platform mobile app is written in Dart (Flutter).

### Step 1: Configure Android Configuration
Update `android/app/src/main/AndroidManifest.xml` with Google Maps key:
```xml
<meta-data 
    android:name="com.google.android.geo.API_KEY"
    android:value="your-google-maps-key"/>
```
Request Location permissions:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### Step 2: Configure iOS Configuration
Update `ios/Runner/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ParkEasy Chennai needs access to your location to discover nearby parking spots.</string>
<key>DART_DEFINES</key>
<string>MAPS_API_KEY=your-ios-maps-key</string>
```

### Step 3: Get Packages & Launch
Run from the `/mobile` directory:
```bash
flutter pub get
# Run in debug mode on connected simulator/device
flutter run
```

### Step 4: Build Release Bundles
```bash
# Android App Bundle for Play Store
flutter build appbundle

# iOS Archive for App Store Connect
flutter build ipa
```

---

## 4. CCTV & AI Architectural Extensions

### CCTV Camera Ready Streams
- Each listing in Firestore contains a boolean `cctvEnabled`.
- Real-time video feeds are bound via RTSP/HLS links in the location document:
  ```json
  {
    "cctvStreamUrl": "https://stream.parkeasy.in/live/loc-1_camera_1.m3u8"
  }
  ```
- Integrate `flutter_vlc_player` (Mobile) or HLS.js (Web) to render live feeds directly inside dashboards.

### Future AI Occupancy Prediction
- Data logging schedules in Firebase Functions track occupancy hourly.
- Train an LSTM or XGBoost regression model using hourly historical occupancy metrics.
- Expose prediction forecasts via HTTP endpoint to suggest bookings prior to peak hours:
  ```
  POST /api/predict-occupancy
  Input: { "locationId": "loc-1", "targetTime": "17:00" }
  Output: { "predictedOccupancy": 0.94 }  // 94% chance of being full
  ```

---

## 5. Monorepo Deployment on Render.com

Since ParkHub is structured as a monorepo, you can deploy the backend API and the three web applications separately on Render.com.

### A. Deploy Backend API (Web Service)
1. Go to the **Render Dashboard** and click **New > Web Service**.
2. Connect your GitHub repository: `https://github.com/ashok2026123/ParkHub.git`.
3. Configure the following service settings:
   - **Name:** `parkhub-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Expand **Advanced** and set any environment variables if needed.
5. Click **Create Web Service**. This will deploy your API on a public URL (e.g. `https://parkhub-backend.onrender.com`).

### B. Deploy Web Portals (Static Sites)
You need to deploy three separate static sites: **Customer Portal** (`web-user`), **Owner Portal** (`web-owner`), and **Super Admin Console** (`web-admin`).

For **each** frontend portal, repeat these steps:
1. Click **New > Static Site** on Render.
2. Select your repository.
3. Configure the specific settings:

| Portal | Render Name | Root Directory | Build Command | Publish Directory |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Portal** | `parkhub-customer` | `web-user` | `npm install && npm run build` | `dist` |
| **Owner Portal** | `parkhub-owner` | `web-owner` | `npm install && npm run build` | `dist` |
| **Super Admin Console** | `parkhub-admin` | `web-admin` | `npm install && npm run build` | `dist` |

4. Under **Redirects/Rewrites** settings for each static site, add a rewrite rule to support React Router single-page navigation:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
5. Click **Create Static Site**.

