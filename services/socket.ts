import { io, Socket } from 'socket.io-client';

// Force Production Backend for Testing
// const isLocal = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
const SOCKET_URL = 'https://hrs-backend-server.onrender.com';


class SocketService {
    public socket: Socket | null = null;
    private pendingListeners: { event: string, callback: (data: any) => void }[] = [];

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'], // Prioritize WebSocket
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket Server:', this.socket?.id);
                // Attach pending listeners
                this.pendingListeners.forEach(l => {
                    this.socket?.on(l.event, l.callback);
                });
                this.pendingListeners = [];
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket Server');
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(event: string, data: any) {
        if (this.socket && this.socket.connected) {
            console.log(`[Socket] Sending ${event}:`, data);
            this.socket.emit(event, data);
        } else {
            console.warn(`[Socket] Cannot send message. Socket connected: ${this.socket?.connected}. Event: ${event}`, data);
            // Attempt to reconnect
            if (!this.socket) {
                console.log('[Socket] Attempting to reconnect...');
                this.connect();
            }
        }
    }

    onMessage(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        } else {
            // Queue listener if not connected yet
            this.pendingListeners.push({ event, callback });
        }
    }

    off(event: string, callback?: (data: any) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
        // Also remove from pending if present
        this.pendingListeners = this.pendingListeners.filter(l => l.event !== event || (callback && l.callback !== callback));
    }

    onConnect(callback: () => void) {
        if (this.socket) {
            this.socket.on('connect', callback);
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

export const socketService = new SocketService();
