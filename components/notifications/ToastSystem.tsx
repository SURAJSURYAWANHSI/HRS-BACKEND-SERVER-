import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
    CheckCircle2, AlertTriangle, Info, X, Bell, MessageCircle,
    Video, Briefcase, Shield, Megaphone, Zap, Phone
} from 'lucide-react';
import { notificationSound, NotificationSoundType } from '../../services/notificationSound';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'message' | 'call' | 'job' | 'qc' | 'announcement';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose?: () => void;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

// Toast Context
const ToastContext = createContext<ToastContextValue | null>(null);

// Toast configurations
const TOAST_CONFIG: Record<ToastType, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    soundType: NotificationSoundType;
}> = {
    success: {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        soundType: 'success'
    },
    error: {
        icon: AlertTriangle,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/30',
        soundType: 'error'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        soundType: 'warning'
    },
    info: {
        icon: Info,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        soundType: 'job_update'
    },
    message: {
        icon: MessageCircle,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10 border-indigo-500/30',
        soundType: 'message'
    },
    call: {
        icon: Video,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10 border-green-500/30',
        soundType: 'video_call'
    },
    job: {
        icon: Briefcase,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        soundType: 'stage_complete'
    },
    qc: {
        icon: Shield,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/30',
        soundType: 'qc_alert'
    },
    announcement: {
        icon: Megaphone,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        soundType: 'announcement'
    }
};

// Individual Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isEntering, setIsEntering] = useState(true);
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;

    useEffect(() => {
        // Entry animation
        requestAnimationFrame(() => setIsEntering(false));

        // Auto-dismiss
        if (!toast.persistent && toast.duration !== 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, toast.duration || 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, toast.persistent]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove();
            toast.onClose?.();
        }, 300);
    };

    return (
        <div
            className={`
                relative flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl
                ${config.bgColor}
                transform transition-all duration-300 ease-out
                ${isEntering ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
                ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
                hover:scale-[1.02] cursor-pointer
            `}
            onClick={handleClose}
        >
            {/* Icon with pulse animation */}
            <div className={`flex-shrink-0 ${config.color}`}>
                <div className="relative">
                    <Icon size={24} className="relative z-10" />
                    <div className={`absolute inset-0 ${config.color} opacity-50 blur-md animate-pulse`}>
                        <Icon size={24} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
                )}
                {toast.action && (
                    <button
                        onClick={(e) => { e.stopPropagation(); toast.action?.onClick(); handleClose(); }}
                        className={`mt-2 text-xs font-bold ${config.color} hover:underline`}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X size={16} className="text-slate-400" />
            </button>

            {/* Progress bar */}
            {!toast.persistent && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-2xl overflow-hidden">
                    <div
                        className={`h-full ${config.color.replace('text-', 'bg-')} transition-all ease-linear`}
                        style={{
                            animation: `shrink ${toast.duration || 4000}ms linear forwards`
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// Toast Container Component
export const ToastContainer: React.FC = () => {
    const context = useContext(ToastContext);
    if (!context) return null;

    return (
        <>
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {context.toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem
                            toast={toast}
                            onRemove={() => context.removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

// Incoming Call Toast (Special full-screen overlay)
export const IncomingCallOverlay: React.FC<{
    callerName: string;
    callerAvatar?: string;
    onAccept: () => void;
    onDecline: () => void;
    isVisible: boolean;
}> = ({ callerName, callerAvatar, onAccept, onDecline, isVisible }) => {
    const [ringtoneStopper, setRingtoneStopper] = useState<{ stop: () => void } | null>(null);

    useEffect(() => {
        if (isVisible) {
            const stopper = notificationSound.playRingtone();
            setRingtoneStopper(stopper);
            return () => stopper.stop();
        }
    }, [isVisible]);

    const handleAccept = () => {
        ringtoneStopper?.stop();
        onAccept();
    };

    const handleDecline = () => {
        ringtoneStopper?.stop();
        onDecline();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            {/* Background animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping"
                            style={{ animationDelay: `${i * 0.5}s`, animationDuration: '2s' }}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
                {/* Caller Avatar */}
                <div className="relative mx-auto mb-8 w-32 h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                    <div className="absolute inset-1 bg-slate-800 rounded-full flex items-center justify-center">
                        {callerAvatar ? (
                            <img src={callerAvatar} alt={callerName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-4xl font-black text-white">{callerName.charAt(0)}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <Video size={20} className="text-white" />
                    </div>
                </div>

                {/* Caller Info */}
                <h2 className="text-2xl font-black text-white mb-2">{callerName}</h2>
                <p className="text-slate-400 text-sm mb-8 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Incoming Video Call
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-8">
                    <button
                        onClick={handleDecline}
                        className="w-16 h-16 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 transition-all hover:scale-110 active:scale-95"
                    >
                        <Phone size={28} className="text-white rotate-[135deg]" />
                    </button>
                    <button
                        onClick={handleAccept}
                        className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-110 active:scale-95 animate-pulse"
                    >
                        <Video size={32} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Active Call Overlay (Full Screen)
export const ActiveCallOverlay: React.FC<{
    isOpen: boolean;
    callerName: string;
    onEndCall: () => void;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
}> = ({ isOpen, callerName, onEndCall, localStream, remoteStream }) => {

    // Auto-play streams when they change
    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-bold border border-white/10">
                        {callerName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white shadow-sm">{callerName}</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-emerald-400 text-sm font-medium tracking-wide">Connected</span>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-white/80 font-mono text-sm">00:00</span>
                </div>
            </div>

            {/* Main Video Area (Remote) */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                            <span className="text-4xl">Waiting...</span>
                        </div>
                        <p className="text-slate-500">Connecting video...</p>
                    </div>
                )}
            </div>

            {/* PIP Video Area (Local) */}
            <div className="absolute top-24 right-6 w-32 h-48 bg-slate-800 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-30">
                {localStream ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-xs text-slate-500">
                        No Camera
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 z-20">
                <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                    <Zap size={24} />
                </button>
                <button
                    onClick={onEndCall}
                    className="p-6 bg-rose-500 hover:bg-rose-600 rounded-full text-white shadow-lg shadow-rose-500/40 transition-all hover:scale-110 active:scale-95"
                >
                    <Phone size={32} className="rotate-[135deg]" />
                </button>
                <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                    <MessageCircle size={24} />
                </button>
            </div>
        </div>
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { ...toast, id };

        // Play sound
        const config = TOAST_CONFIG[toast.type];
        if (config) {
            notificationSound.play(config.soundType);
        }

        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    // Listen for custom toast events
    useEffect(() => {
        const handleToastEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            const detail = customEvent.detail;
            addToast({
                type: detail.type,
                title: detail.title,
                message: detail.message,
                duration: detail.duration || 4000
            });
        };

        window.addEventListener('toast', handleToastEvent);
        return () => window.removeEventListener('toast', handleToastEvent);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

// Hook to use toasts
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Shorthand functions
export const toast = {
    success: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'success', title, message } });
        window.dispatchEvent(event);
    },
    error: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'error', title, message } });
        window.dispatchEvent(event);
    },
    warning: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'warning', title, message } });
        window.dispatchEvent(event);
    },
    info: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'info', title, message } });
        window.dispatchEvent(event);
    },
    message: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'message', title, message } });
        window.dispatchEvent(event);
    },
    call: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'call', title, message } });
        window.dispatchEvent(event);
    },
    job: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'job', title, message } });
        window.dispatchEvent(event);
    },
    qc: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'qc', title, message } });
        window.dispatchEvent(event);
    },
    announcement: (title: string, message?: string) => {
        const event = new CustomEvent('toast', { detail: { type: 'announcement', title, message } });
        window.dispatchEvent(event);
    }
};
