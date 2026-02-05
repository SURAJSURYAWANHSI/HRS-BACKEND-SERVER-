# Android Build & Setup Guide (Admin App)

This guide covers how to build the **Admin App** for Android Tablets.

## 1. Quick Build
We have prepared a ONE-CLICK script to build everything for you.
1.  Go to `Desktop\ADMINAPP` (Parent folder).
2.  Run `build_both_apks.bat`.
3.  Calculated APKs will appear in `Desktop\APKS_OUTPUT`.

---

## 2. Permissions
**STATUS: READY**
Configured in `android/app/src/main/AndroidManifest.xml`:
- `RECORD_AUDIO` / `CAMERA` (Calls)
- `INTERNET` / `ACCESS_NETWORK_STATE` (Connectivity)
- `WAKE_LOCK` (Screen On)
- `BLUETOOTH` (Headsets)

## 3. Manual Build
1.  **Open Android Studio**.
2.  **File > Open...**
3.  Select `Desktop\ADMINAPP\android`.
4.  Wait for Gradle Sync.
5.  **Build Menu**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
