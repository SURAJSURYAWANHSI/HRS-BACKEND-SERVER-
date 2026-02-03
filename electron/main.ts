import { app, BrowserWindow, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// __dirname is '.../dist-electron'
// We want APP_ROOT to be '.../'
const APP_ROOT = path.join(__dirname, '..');

// Path to the renderer (React) build output
const RENDERER_DIST = path.join(APP_ROOT, 'dist');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? path.join(APP_ROOT, 'public')
    : RENDERER_DIST;

let win: BrowserWindow | null = null;
// Preload script is in the same directory as main.js in the output
const preload = path.join(__dirname || process.cwd(), 'preload.mjs'); // vite-plugin-electron uses .mjs for module output

const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
    win = new BrowserWindow({
        title: 'ProTrack Admin',
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        icon: path.join(process.env.VITE_PUBLIC || '', 'icon.ico'),
        webPreferences: {
            preload, // Use the variable we defined properly
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
    });

    // Handle permission requests
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'fullscreen'];
        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Handle permission check requests
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'fullscreen'];
        return allowedPermissions.includes(permission);
    });

    // Handle device permissions
    session.defaultSession.setDevicePermissionHandler((details) => {
        // Allow media devices, block others by default
        if (['camera', 'microphone'].includes(details.deviceType)) {
            return true;
        }
        return false;
    });


    if (url) {
        win.loadURL(url);
        // win.webContents.openDevTools();
    } else {
        win.loadFile(indexHtml);
    }

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
});
