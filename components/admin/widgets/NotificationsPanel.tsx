import React, { useState } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, MessageSquare, Megaphone, Clock, Check } from 'lucide-react';
import { Notification, NotificationType } from '../../../types';

interface NotificationsPanelProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClear: (id: string) => void;
}

const NotificationIcon: Record<NotificationType, { icon: React.ElementType; color: string }> = {
    'QC_ALERT': { icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/20' },
    'JOB_UPDATE': { icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/20' },
    'MENTION': { icon: MessageSquare, color: 'text-purple-400 bg-purple-500/20' },
    'ANNOUNCEMENT': { icon: Megaphone, color: 'text-amber-400 bg-amber-500/20' },
    'STAGE_COMPLETE': { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/20' },
    'PRIORITY_CHANGE': { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/20' }
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClear
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-blue-500" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm text-slate-500">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const { icon: Icon, color } = NotificationIcon[notification.type];
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {notification.title}
                                                    </p>
                                                    <button
                                                        onClick={() => onClear(notification.id)}
                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatTime(notification.timestamp)}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => onMarkAsRead(notification.id)}
                                                            className="text-[10px] text-blue-500 font-medium hover:underline"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Priority Badge Component
export const PriorityBadge: React.FC<{ priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }> = ({ priority }) => {
    if (!priority) return null;

    const config = {
        LOW: { label: 'Low', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
        MEDIUM: { label: 'Med', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        HIGH: { label: 'High', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        URGENT: { label: 'Urgent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' }
    };

    const { label, color } = config[priority];

    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${color}`}>
            {label}
        </span>
    );
};
