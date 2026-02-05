import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { socketService } from './socket';

class NotificationService {
    private hasPermission = false;

    public async initialize() {
        if (!Capacitor.isNativePlatform()) {
            console.log('[NotificationService] Not native platform, skipping init');
            return;
        }

        // Listen for app state changes
        App.addListener('appStateChange', ({ isActive }) => {
            console.log('[NotificationService] App state changed. Is active:', isActive);
        });

        // Push Notification Listeners - SAFE GUARD
        try {
            this.setupPushListeners();
        } catch (e) {
            console.warn('[NotificationService] Failed to setup push listeners:', e);
        }

        // Local Notification Listeners
        this.setupLocalListeners();
    }

    private setupPushListeners() {
        try {
            PushNotifications.addListener('registration', (token) => {
                console.log('[NotificationService] Push Notification Token:', token.value);
                // Register as ADMIN
                if (socketService.isConnected()) {
                    socketService.sendMessage('notification:register_token', { token: token.value, platform: 'android' });
                } else {
                    socketService.onConnect(() => {
                        socketService.sendMessage('notification:register_token', { token: token.value, platform: 'android' });
                    });
                }
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('[NotificationService] Push Registration Error:', error);
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[NotificationService] Push Received:', notification);
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('[NotificationService] Push Action Performed:', notification);
                // Navigation logic can be handled here or via events
            });
        } catch (e) {
            console.warn('[NotificationService] Push listeners could not be attached:', e);
        }
    }

    private setupLocalListeners() {
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            console.log('[NotificationService] Local Action Performed:', notification);
            if (notification.notification.extra?.type === 'CALL') {
                window.dispatchEvent(new CustomEvent('notification:call', {
                    detail: notification.notification.extra
                }));
            }
        });
    }

    async requestPermissions(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return false;

        try {
            // Local Notifications
            const localStatus = await LocalNotifications.checkPermissions();
            if (localStatus.display !== 'granted') {
                const result = await LocalNotifications.requestPermissions();
                if (result.display !== 'granted') return false;
            }

            // Push Notifications
            try {
                const pushStatus = await PushNotifications.checkPermissions();
                if (pushStatus.receive !== 'granted') {
                    const result = await PushNotifications.requestPermissions();
                    if (result.receive !== 'granted') {
                        console.warn('[NotificationService] Push permission denied');
                    }
                }

                if (pushStatus.receive === 'granted' || (await PushNotifications.checkPermissions()).receive === 'granted') {
                    await PushNotifications.register();
                    this.hasPermission = true;
                }
            } catch (pushError) {
                console.warn('[NotificationService] Push Notifications not available:', pushError);
            }

            return true;
        } catch (error) {
            console.error('[NotificationService] Permission request failed:', error);
            return false;
        }
    }

    async scheduleCallNotification(callerName: string, callId: string) {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title: 'Incoming Call',
                    body: `${callerName} is calling you...`,
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 100) },
                    sound: 'ringtone.wav',
                    actionTypeId: 'CALL_ANSWER',
                    extra: {
                        type: 'CALL',
                        callId,
                        callerName
                    }
                }]
            });
        } catch (error) {
            console.error('[NotificationService] Failed to schedule notification:', error);
        }
    }
}

export const notificationService = new NotificationService();
