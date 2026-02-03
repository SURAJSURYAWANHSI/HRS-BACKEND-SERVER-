# Android Build & Setup Guide (Capacitor)

This guide covers the complete workflow for building `admin-protrack` for Android using Capacitor.

## 1. Project Setup (Completed)
We have initialized Capacitor and added the Android platform.
- **App ID**: `com.protrack.admin`
- **App Name**: `ProTrack Admin`
- **Web Dir**: `dist`
- **Platform Dir**: `android/`

## 2. Android Studio Configuration
To build the APK, you must open the **native Android project** in Android Studio, NOT the root project folder.

### **Step-by-Step Instructions**
1.  **Open Android Studio**.
2.  Click **File > Open**.
3.  Navigate to inside your project: `Desktop\ADMINAPP\android`.
4.  **Select the `android` folder** and click OK.
5.  Wait for **Gradle Sync** to finish (bottom status bar).
    - If asked about "Trust Project", select **Trust**.
    - If asked to update Gradle plugin, it is usually safe to say **Update**, but using the default is also fine.

### **Common Settings (AndroidManifest.xml)**
Located in: `app/src/main/AndroidManifest.xml`
- **Permissions**: The following permissions are ALREADY CONFIGURSED:
  - `INTERNET`
  - `CAMERA`
  - `RECORD_AUDIO`
  - `MODIFY_AUDIO_SETTINGS`
  - `READ/WRITE_EXTERNAL_STORAGE`

## 3. Running on Device / Emulator

### **Emulator**
1.  Open **Device Manager** in Android Studio (Phone icon top-right).
2.  Create a device (e.g., Pixel 6, API 33/34).
3.  Click the **Green Play Button** (Run 'app') in the top toolbar.

### **Real Device**
1.  Enable **Developer Options** & **USB Debugging** on your Android phone.
2.  Connect via USB.
3.  Select your phone in the Android Studio top dropdown.
4.  Click **Run**.

## 4. Generating APKs

### **Debug APK (Testing)**
- **Menu**: Build > Build Bundle(s) / APK(s) > **Build APK(s)**
- **Output**: A notification will appear. Click "locate".
- **Path**: `android/app/build/outputs/apk/debug/app-debug.apk`

### **Release APK (Signed)**
1.  **Menu**: Build > **Generate Signed Bundle / APK**.
2.  Select **APK**.
3.  **Keystore**:
    - If you don't have one, click **Create new...**
    - Path: Save as `release-key.jks` in a safe folder.
    - Password: Set a strong password (remember it!).
    - Alias: `key0` (default) is fine.
4.  Select **release** build variant.
5.  **Finish**.
- **Path**: `android/app/release/app-release.apk`

## 5. Update Workflow (After Code Changes)
Whenever you change your React/Vite code:

1.  **Rebuild Web Assets**:
    ```powershell
    npx vite build
    ```
2.  **Sync to Native**:
    ```powershell
    npx cap sync
    ```
3.  **Run/Build in Android Studio**:
    - If simple UI change: Just press **Run** again.
    - If you installed a *FAST* plugin: You typically need the `cap sync` step.

## Troubleshooting

### White Screen on Launch?
- Ensure `vite.config.ts` has `base: './'` or standard configuration.
- Check Logcat in Android Studio for JS errors.

### Network Traffic Blocked?
- Android blocks HTTP (non-HTTPS) by default. If your local API is HTTP, you must add `android:usesCleartextTraffic="true"` to the `<application>` tag in `AndroidManifest.xml`.
