# 🚀 Deployment Guide

## 1. Admin App (Windows Desktop .exe)
The Admin app is already configured for Desktop deployment.

### Build Command
Run this in your **Admin App** terminal:
```powershell
npm run build
```

### Output
- The installer (setup file) will be created in:  
  `dist-release\` (or `release\` depending on configuration)
- Look for a file named like `ProTrack Admin Setup 1.0.0.exe`.

---

## 2. Worker App (Android .apk)
The Worker app needs **Capacitor** to run on mobile.

### Setup Instructions
Run these commands in your **Worker App** terminal (`Desktop\WORKERAPP`):

1. **Install Capacitor:**
   ```powershell
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Initialize App:**
   ```powershell
   npx cap init "ProTrack Worker" com.protrack.worker --web-dir=dist
   ```

3. **Add Android Platform:**
   ```powershell
   npm run build
   npx cap add android
   ```

4. **Sync Changes:**
   ```powershell
   npx cap sync
   ```

### How to Build APK
You have two options:

**Option A: Open in Android Studio (Recommended)**
```powershell
npx cap open android
```
- Wait for Android Studio to open.
- Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
- Locate the APK in `app/build/outputs/apk/debug/app-debug.apk`.

**Option B: Command Line (if Android SDK is configured)**
```powershell
cd android
./gradlew assembleDebug
```
- The APK will be in `android/app/build/outputs/apk/debug/`.
