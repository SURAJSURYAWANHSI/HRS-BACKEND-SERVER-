import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, title, subtitle, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-md h-[100dvh] bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col rounded-l-[2.5rem] border-l border-slate-200 dark:border-slate-800">
                <div className="flex-none px-8 py-6 pt-10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0F172A] z-10 rounded-tl-[2.5rem]">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{title}</h2>
                        {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-500 transition-colors group">
                        <X size={20} className="text-slate-400 dark:text-slate-400 group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth text-slate-700 dark:text-slate-300">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
