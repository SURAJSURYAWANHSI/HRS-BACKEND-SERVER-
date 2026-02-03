# Windows Electron Build Fix: Developer Mode & Symlinks

## The Problem
Electron Builder (specifically the `winCodeSign` tool) needs to create **symbolic links** (symlinks) inside `AppData\Local\electron-builder\Cache` to function correctly.

### Why Admin is Not Enough
On Linux and macOS, symlink creation is a standard user permission. However, **Windows Security Policy** restricts symlink creation by default to:
1.  Users with the specific "Create symbolic links" privilege.
2.  Administrators (but only if "Elevated").

Even when running your terminal as Administrator, the specific API calls used by `node` and `electron-builder` often fail to handshake this privilege correctly with the OS, or the tool attempts to create them in a way that Windows rejects without the global "Developer Mode" flag.

## The Solution: Enable Developer Mode
Enabling **Developer Mode** fundamentally relaxes this restriction, allowing any process running with your user credentials to create symlinks without needing special elevation handling.

### How to Enable Developer Mode

1.  Press **Windows Key**.
2.  Type **"Developer Settings"** and hit Enter.
3.  In the Settings window, find the **"Developer Mode"** toggle.
4.  Switch it to **ON**.
5.  Click **"Yes"** on the confirmation dialog.

> **Note:** You do NOT need to restart your computer. The change is instant.

### Verifying the Fix
Once enabled, retry your build command:
```powershell
npm run build
```
The "Cannot create symbolic link" error should disappear immediately.
