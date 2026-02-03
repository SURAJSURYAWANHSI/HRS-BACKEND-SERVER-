import React from 'react';
import {
    Activity, PenTool, Scissors, Hammer, Wrench, ClipboardCheck,
    Truck, Megaphone, Search, Radio, CheckCircle2, RotateCcw
} from 'lucide-react';
import { JobStage } from '../../../types';

// Define the production flow order (excluding Dashboard, QC Audit, Alerts which are not stages)
const STAGE_ORDER: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

interface StageNavbarProps {
    currentView: any;
    setCurrentView: (view: any) => void;
    selectedJobStage?: JobStage; // The current stage of the selected job
}

export const StageNavbar: React.FC<StageNavbarProps> = ({ currentView, setCurrentView, selectedJobStage }) => {

    // Check if a stage is completed (before the current job stage)
    const isStageCompleted = (stageSubView: string): boolean => {
        if (!selectedJobStage) return false;
        const stageIdx = STAGE_ORDER.indexOf(stageSubView as JobStage);
        const currentIdx = STAGE_ORDER.indexOf(selectedJobStage);
        if (stageIdx === -1 || currentIdx === -1) return false;
        return stageIdx < currentIdx;
    };

    // Check if a stage is the current active stage for the job
    const isCurrentJobStage = (stageSubView: string): boolean => {
        return selectedJobStage === stageSubView;
    };

    return (
        <div className="flex justify-center w-full py-2">
            <div className="bg-white/60 dark:bg-[#0B1121]/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-full p-1.5 flex items-center gap-1 shadow-2xl mx-auto overflow-x-auto no-scrollbar max-w-full">
                {[
                    { label: 'Dashboard', icon: <Activity size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' }, isStage: false },
                    { label: 'Design', icon: <PenTool size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'DESIGN' }, isStage: true },
                    { label: 'Cutting', icon: <Scissors size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'CUTTING' }, isStage: true },
                    { label: 'Bending', icon: <Scissors size={13} className="rotate-90" />, view: { type: 'ADMIN_DASHBOARD', subView: 'BENDING' }, isStage: true },
                    { label: 'Punching', icon: <Radio size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'PUNCHING' }, isStage: true },
                    { label: 'Fabrication', icon: <Hammer size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'FABRICATION' }, isStage: true },
                    { label: 'Coating', icon: <Search size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'POWDER_COATING' }, isStage: true },
                    { label: 'Assembly', icon: <Wrench size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'ASSEMBLY' }, isStage: true },
                    { label: 'QC Audit', icon: <ClipboardCheck size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'QUALITY' }, isStage: false },
                    { label: 'Dispatch', icon: <Truck size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'DISPATCH' }, isStage: true },
                    { label: 'Returns', icon: <RotateCcw size={13} />, view: { type: 'ADMIN_DASHBOARD', subView: 'RETURNS' }, isStage: false }
                ].map((item, idx) => {
                    const isActive =
                        JSON.stringify(currentView) === JSON.stringify(item.view) ||
                        (currentView.type === 'ADMIN_DASHBOARD' && item.view.type === 'ADMIN_DASHBOARD' && (currentView as any).subView === (item.view as any).subView);

                    const completed = item.isStage && isStageCompleted((item.view as any).subView);
                    const isCurrent = item.isStage && isCurrentJobStage((item.view as any).subView);

                    // Determine styling
                    let buttonClass = '';
                    if (isActive) {
                        buttonClass = 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/50';
                    } else if (completed) {
                        buttonClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30';
                    } else if (isCurrent) {
                        buttonClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 animate-pulse';
                    } else {
                        buttonClass = 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60';
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => setCurrentView(item.view as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${buttonClass}`}
                        >
                            {completed ? <CheckCircle2 size={13} className="text-emerald-500" /> : item.icon}
                            <span className={isActive ? 'opacity-100' : 'opacity-80'}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
