import React from 'react';
import { Job, JobStage } from '../../../types';
import { JOB_STAGES, STAGE_LABELS } from '../../../constants';
import { Check, Activity } from 'lucide-react';

interface ProductionJourneyProps {
    job: Job;
}

export const ProductionJourney: React.FC<ProductionJourneyProps> = ({ job }) => {
    const currentStageIndex = JOB_STAGES.indexOf(job.currentStage);

    return (
        <div className="bg-[#0B1121] dark:bg-[#0B1121] rounded-[2rem] p-8 mt-6 border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Activity className="text-slate-400" size={20} />
                <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Production Journey</h3>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800"></div>

                <div className="space-y-8 relative z-10">
                    {JOB_STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex || job.isCompleted;
                        const isCurrent = stage === job.currentStage && !job.isCompleted;
                        const isPending = idx > currentStageIndex && !job.isCompleted;

                        return (
                            <div key={stage} className="flex items-start gap-6 group">
                                {/* Indicator Circle */}
                                <div className="flex-none relative">
                                    {isCompleted ? (
                                        <div className="w-10 h-10 rounded-full bg-transparent border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check size={14} className="text-[#0B1121] stroke-[3]" />
                                            </div>
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-10 h-10 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center relative shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                                            <div className="absolute inset-0 rounded-full border border-blue-400 opacity-50 animate-ping"></div>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-800/50 border-2 border-slate-700 text-slate-500 font-black flex items-center justify-center text-xs">
                                            {idx + 1}
                                        </div>
                                    )}
                                </div>

                                {/* Text Info */}
                                <div className={`pt-2 transition-all duration-300 ${isCurrent ? 'translate-x-2' : ''}`}>
                                    <h4 className={`text-sm font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : isCurrent ? 'text-blue-500 text-lg' : 'text-slate-600'}`}>
                                        {STAGE_LABELS[stage]}
                                    </h4>
                                    {isCurrent && (
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider animate-pulse">
                                            Currently in progress
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
