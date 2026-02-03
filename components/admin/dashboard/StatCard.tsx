import React from 'react';

interface StatCardProps {
    icon: React.ReactElement;
    label: string;
    value: number | string;
    filterKey: string;
    iconBg: string;
    iconColor: string;
    activeStatFilter: string | null;
    onClick: (filterKey: string) => void;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, filterKey, iconBg, iconColor, activeStatFilter, onClick }) => (
    <button
        onClick={() => onClick(filterKey)}
        className={`text-center p-8 rounded-[3rem] border transition-all duration-500 group relative overflow-hidden flex flex-col items-center justify-between min-h-[320px] ${activeStatFilter === filterKey
            ? 'bg-white dark:bg-[#1E293B] border-blue-500 ring-4 ring-blue-500/20 shadow-[0_30px_60px_rgba(59,130,246,0.15)] scale-105'
            : 'bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40'
            }`}
    >
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-opacity duration-500 group-hover:opacity-20 ${iconColor.replace('text-', 'bg-')}`} />

        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 ${iconBg} ${iconColor} border border-black/5 dark:border-white/5 shadow-2xl`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
        </div>

        <div className="space-y-4 w-full">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            <div className="flex flex-col items-center gap-1">
                <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</p>
                {activeStatFilter === filterKey && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mt-2" />}
            </div>
        </div>
    </button>
);
