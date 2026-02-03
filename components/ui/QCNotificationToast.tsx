import React from 'react';
import { createPortal } from 'react-dom';
import { BellRing, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface NotificationToastProps {
    count?: number; // Legacy support
    message?: string;
    type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
    targetView?: string;
    onViewClick?: (view: string) => void;
    onClose: () => void;
}

export const QCNotificationToast: React.FC<NotificationToastProps> = ({ count, message, type = 'INFO', onClose, targetView, onViewClick }) => {

    // Determine content
    let displayMessage = message;
    let title = 'Notification';
    let Icon = Info;
    let colorClass = 'border-blue-500';
    let iconBg = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500';

    if (count !== undefined && !message) {
        displayMessage = `${count} job(s) marked as Ready for QC.`;
        title = 'QC Attention Needed';
        Icon = BellRing;
        colorClass = 'border-orange-500';
        iconBg = 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500';
    } else {
        switch (type) {
            case 'SUCCESS':
                Icon = CheckCircle;
                title = 'Success';
                colorClass = 'border-emerald-500';
                iconBg = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500';
                break;
            case 'ERROR':
                Icon = XCircle;
                title = 'Error';
                colorClass = 'border-rose-500';
                iconBg = 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500';
                break;
            case 'WARNING':
                Icon = AlertTriangle;
                title = 'Warning';
                colorClass = 'border-amber-500';
                iconBg = 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500';
                break;
            default:
                break;
        }
    }

    const handleClick = () => {
        if (targetView && onViewClick) {
            onViewClick(targetView);
        } else {
            onClose();
        }
    };

    return createPortal(
        <div className="fixed top-6 right-6 z-[500] animate-in slide-in-from-right duration-500 cursor-pointer" onClick={handleClick}>
            <div className={`bg-white dark:bg-[#1E293B] border-l-4 ${colorClass} rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm ring-1 ring-slate-200 dark:ring-slate-800`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
                    <Icon size={22} />
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-none">{title}</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {displayMessage}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
