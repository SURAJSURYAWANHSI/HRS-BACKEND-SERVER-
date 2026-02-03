import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel: string, ...args: any[]) => {
            ipcRenderer.send(channel, ...args);
        },
        on: (channel: string, func: (...args: any[]) => void) => {
            // Strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        },
        once: (channel: string, func: (...args: any[]) => void) => {
            ipcRenderer.once(channel, (event, ...args) => func(...args));
        },
        invoke: (channel: string, ...args: any[]) => {
            return ipcRenderer.invoke(channel, ...args);
        }
    }
});
