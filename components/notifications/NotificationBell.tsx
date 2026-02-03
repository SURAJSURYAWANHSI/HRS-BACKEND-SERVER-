import React, { useState, useEffect } from 'react';
import {
    Bell, X, Check, CheckCheck, Trash2, Volume2, VolumeX,
    MessageCircle, Video, Briefcase, Shield, Megaphone, Zap
} from 'lucide-react';
import { Notification, NotificationType } from '../../types';
import { notificationSound } from '../../services/notificationSound';

interface NotificationBellProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClearNotification: (id: string) => void;
    onClearAll: () => void;
    onNotificationClick?: (notification: Notification) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, { icon: React.ElementType; color: string }> = {
    'QC_ALERT': { icon: Shield, color: 'text-orange-400 bg-orange-500/20' },
    'JOB_UPDATE': { icon: Briefcase, color: 'text-blue-400 bg-blue-500/20' },
    'MENTION': { icon: MessageCircle, color: 'text-purple-400 bg-purple-500/20' },
    'ANNOUNCEMENT': { icon: Megaphone, color: 'text-cyan-400 bg-cyan-500/20' },
    'STAGE_COMPLETE': { icon: Check, color: 'text-emerald-400 bg-emerald-500/20' },
    'PRIORITY_CHANGE': { icon: Zap, color: 'text-amber-400 bg-amber-500/20' }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllRead,
    onClearNotification,
    onClearAll,
    onNotificationClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastCount, setLastCount] = useState(0);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Play sound when new notification arrives
    useEffect(() => {
        if (notifications.length > lastCount && soundEnabled) {
            const latestNotification = notifications[0];
            if (latestNotification) {
                switch (latestNotification.type) {
                    case 'QC_ALERT':
                        notificationSound.play('qc_alert');
                        break;
                    case 'JOB_UPDATE':
                        notificationSound.play('job_update');
                        break;
                    case 'ANNOUNCEMENT':
                        notificationSound.play('announcement');
                        break;
                    case 'MENTION':
                        notificationSound.play('message');
                        break;
                    case 'PRIORITY_CHANGE':
                        notificationSound.play('priority_high');
                        break;
                    default:
                        notificationSound.play('job_update');
                }
            }
        }
        setLastCount(notifications.length);
    }, [notifications.length, soundEnabled]);

    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        notificationSound.setEnabled(newState);
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
                <Bell size={18} className={unreadCount > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleSound}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                                >
                                    {soundEnabled ? (
                                        <Volume2 size={14} className="text-slate-400" />
                                    ) : (
                                        <VolumeX size={14} className="text-slate-400" />
                                    )}
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllRead}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck size={14} className="text-slate-400" />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 size={14} className="text-slate-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm text-slate-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {notifications.slice(0, 20).map((notification) => {
                                        const config = NOTIFICATION_ICONS[notification.type];
                                        const Icon = config?.icon || Bell;
                                        const colorClass = config?.color || 'text-slate-400 bg-slate-500/20';

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => {
                                                    onMarkAsRead(notification.id);
                                                    onNotificationClick?.(notification);
                                                }}
                                                className={`
                                                    flex items-start gap-3 p-4 cursor-pointer transition-all duration-200
                                                    ${notification.isRead
                                                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        : 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                                    }
                                                `}
                                            >
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${colorClass.split(' ')[1]} flex items-center justify-center`}>
                                                    <Icon size={18} className={colorClass.split(' ')[0]} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${notification.isRead ? 'text-slate-600 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {notification.message && (
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {formatTime(notification.timestamp)}
                                                    </p>
                                                </div>

                                                {/* Unread indicator */}
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse" />
                                                )}

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onClearNotification(notification.id); }}
                                                    className="flex-shrink-0 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} className="text-slate-400" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0); }
                    25% { transform: rotate(-15deg); }
                    50% { transform: rotate(15deg); }
                    75% { transform: rotate(-10deg); }
                }
            `}</style>
        </div>
    );
};
