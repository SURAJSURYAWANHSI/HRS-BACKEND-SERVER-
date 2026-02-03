import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
    CheckCircle2, AlertTriangle, Info, X, Bell, MessageCircle,
    Video, Briefcase, Shield, Megaphone, Zap, Phone,
    Grid, Mic, MicOff, Volume2, MoreVertical
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
    callType?: 'AUDIO' | 'VIDEO';
    onAccept: () => void;
    onDecline: () => void;
    isVisible: boolean;
}> = ({ callerName, callerAvatar, callType = 'VIDEO', onAccept, onDecline, isVisible }) => {
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
        <div className="fixed inset-0 z-[10000] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center animate-in fade-in duration-300">
            {/* Background animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="absolute inset-0 rounded-full border border-emerald-500/20"
                            style={{
                                animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
                                animationDelay: `${i * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
                {/* Caller Avatar with Ring */}
                <div className="relative mx-auto mb-8 w-36 h-36">
                    {/* Outer pulse */}
                    <div className="absolute inset-0 -m-4 rounded-full bg-emerald-500/10 animate-pulse" />

                    {/* Border ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500" />

                    {/* Avatar */}
                    <div className="absolute inset-1 bg-slate-800 rounded-full flex items-center justify-center">
                        {callerAvatar ? (
                            <img src={callerAvatar} alt={callerName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-5xl font-bold text-white">{callerName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    {/* Call type badge */}
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                        {callType === 'VIDEO' ? (
                            <Video size={24} className="text-white" />
                        ) : (
                            <Phone size={24} className="text-white" />
                        )}
                    </div>
                </div>

                {/* Caller Info */}
                <h2 className="text-4xl font-bold text-white mb-3">{callerName}</h2>
                <p className="text-slate-400 text-lg mb-10 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    {callType === 'VIDEO' ? 'Incoming Video Call' : 'Incoming Voice Call'}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-16">
                    {/* Decline */}
                    <button
                        onClick={handleDecline}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-18 h-18 p-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 group-hover:scale-110 group-active:scale-95 transition-transform">
                            <Phone size={32} className="text-white rotate-[135deg]" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Decline</span>
                    </button>

                    {/* Accept */}
                    <button
                        onClick={handleAccept}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-20 h-20 p-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-110 group-active:scale-95 transition-transform animate-pulse">
                            {callType === 'VIDEO' ? (
                                <Video size={36} className="text-white" />
                            ) : (
                                <Phone size={36} className="text-white" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-emerald-400">
                            {callType === 'VIDEO' ? 'Video' : 'Answer'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Active Call Overlay (Full Screen - Premium Android Style)
export const ActiveCallOverlay: React.FC<{
    isOpen: boolean;
    callerName: string;
    callType?: 'AUDIO' | 'VIDEO';
    onEndCall: () => void;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
}> = ({ isOpen, callerName, callType = 'VIDEO', onEndCall, localStream, remoteStream }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [status, setStatus] = useState('Calling...');
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            setStatus('Connected');
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            }
        } else {
            setStatus('Calling...');
        }
    }, [remoteStream]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setCallDuration(0);
            setStatus('Calling...');
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isOpen]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    const displayStatus = status === 'Connected' ? formatDuration(callDuration) : status;

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col animate-in fade-in duration-300">
            {/* Background */}
            {callType === 'VIDEO' && remoteStream ? (
                <div className="absolute inset-0">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {localStream && (
                        <div className="absolute top-20 right-6 w-32 h-48 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900" />
            )}

            {/* Audio element */}
            {callType === 'AUDIO' && remoteStream && (
                <audio ref={(el) => { if (el) el.srcObject = remoteStream }} autoPlay />
            )}

            {/* Top Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center pt-20 px-8">
                <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    <span className="text-white/80 text-sm font-medium">{displayStatus}</span>
                </div>

                <h1 className="text-5xl font-bold text-white tracking-tight mb-3 text-center">{callerName}</h1>
                <p className="text-white/60 text-lg tracking-wider">{callType === 'VIDEO' ? 'Video Call' : 'Voice Call'}</p>

                {callType === 'AUDIO' && (
                    <div className="mt-auto mb-auto">
                        <div className="relative">
                            {status === 'Calling...' && <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />}
                            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                                <span className="text-7xl font-bold text-white">{callerName.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 bg-slate-900/95 backdrop-blur-xl rounded-t-3xl pt-6 pb-8 px-6">
                <div className="flex justify-around mb-8">
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-active:scale-95 transition-transform">
                            <Grid size={24} className="text-white" />
                        </div>
                        <span className="text-xs text-white/70 font-medium">Keypad</span>
                    </button>

                    <button onClick={toggleMute} className="flex flex-col items-center gap-2 group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-active:scale-95 transition-all ${isMuted ? 'bg-white' : 'bg-slate-800'}`}>
                            {isMuted ? <MicOff size={24} className="text-slate-900" /> : <Mic size={24} className="text-white" />}
                        </div>
                        <span className="text-xs text-white/70 font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    <button onClick={() => setIsSpeaker(!isSpeaker)} className="flex flex-col items-center gap-2 group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-active:scale-95 transition-all ${isSpeaker ? 'bg-white' : 'bg-slate-800'}`}>
                            <Volume2 size={24} className={isSpeaker ? 'text-slate-900' : 'text-white'} />
                        </div>
                        <span className="text-xs text-white/70 font-medium">Speaker</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-active:scale-95 transition-transform">
                            <MoreVertical size={24} className="text-white" />
                        </div>
                        <span className="text-xs text-white/70 font-medium">More</span>
                    </button>
                </div>

                <div className="flex justify-center">
                    <button onClick={onEndCall} className="w-56 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg shadow-red-500/40">
                        <Phone size={28} className="text-white rotate-[135deg]" />
                    </button>
                </div>
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
