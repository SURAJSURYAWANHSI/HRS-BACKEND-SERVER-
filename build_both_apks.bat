@echo off
echo ==========================================
echo       PREPARING ANDROID APK BUILDS
echo ==========================================

mkdir ..\APKS_OUTPUT 2>nul

echo.
echo [1/2] Building ADMINAPP (Web + Android)...
call npx vite build
if %errorlevel% neq 0 exit /b %errorlevel%

call npx cap sync android
if %errorlevel% neq 0 exit /b %errorlevel%

echo Compiling Admin APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo Error compiling Admin APK
    pause
    exit /b %errorlevel%
)
copy app\build\outputs\apk\debug\app-debug.apk ..\..\APKS_OUTPUT\Admin-Debug.apk
cd ..

echo.
echo [2/2] Building WORKERAPP (Web + Android)...
cd ..\WORKERAPP

if not exist node_modules call npm install

call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

call npx cap sync android
if %errorlevel% neq 0 exit /b %errorlevel%

echo Compiling Worker APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo Error compiling Worker APK
    pause
    exit /b %errorlevel%
)
copy app\build\outputs\apk\debug\app-debug.apk ..\..\APKS_OUTPUT\Worker-Debug.apk
cd ..

echo.
echo ==========================================
echo        BUILDS SUCCESSFUL!
echo ==========================================
echo APKs copied to Desktop/APKS_OUTPUT:
echo 1. Admin-Debug.apk
echo 2. Worker-Debug.apk
echo.
pause
