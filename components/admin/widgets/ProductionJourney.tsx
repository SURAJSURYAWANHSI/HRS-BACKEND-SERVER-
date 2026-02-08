import React from 'react';
import { Job, JobStage } from '../../../types';
import { JOB_STAGES, STAGE_LABELS } from '../../../constants';
import { Check, Activity } from 'lucide-react';

interface ProductionJourneyProps {
    job: Job;
}

export const ProductionJourney: React.FC<ProductionJourneyProps> = ({ job }) => {
    const currentStageIndex = JOB_STAGES.indexOf(job.currentStage);

    // Calculate Batches per Stage
    const getStageInfo = (stage: JobStage, idx: number) => {
        if (!job.batches || job.batches.length === 0) return { count: 0, label: null };

        // 1. Batches currently IN this stage
        const activeBatches = job.batches.filter(b => b.stage === stage);
        const activeQty = activeBatches.reduce((sum, b) => sum + b.quantity, 0);

        // 2. Batches that have PASSED this stage (are in a later stage)
        // Find stages that come AFTER this one
        const laterStages = JOB_STAGES.slice(idx + 1);
        const completedBatches = job.batches.filter(b => laterStages.includes(b.stage) || b.status === 'COMPLETED');
        const completedQty = completedBatches.reduce((sum, b) => sum + b.quantity, 0);

        // 3. For the FINAL stage (DISPATCH), we might check isCompleted or accumulated

        return { activeQty, completedQty };
    };

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

                        // Batch Logic
                        const { activeQty, completedQty } = getStageInfo(stage, idx);
                        const hasSplitBatches = job.batches && job.batches.length > 0;

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
                                    ) : activeQty > 0 ? (
                                        // Active Batch in "Past/Future" stage regarding main job status (Wait, if activeQty > 0, it IS current for those batches)
                                        <div className="w-10 h-10 rounded-full bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center relative shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                                            <span className="text-amber-500 font-bold text-xs">{activeQty}</span>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-800/50 border-2 border-slate-700 text-slate-500 font-black flex items-center justify-center text-xs">
                                            {idx + 1}
                                        </div>
                                    )}
                                </div>

                                {/* Text Info */}
                                <div className={`pt-2 transition-all duration-300 ${isCurrent ? 'translate-x-2' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <h4 className={`text-sm font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : isCurrent ? 'text-blue-500 text-lg' : activeQty > 0 ? 'text-amber-500' : 'text-slate-600'}`}>
                                            {STAGE_LABELS[stage]}
                                        </h4>
                                        {/* Batch Count Badge */}
                                        {hasSplitBatches && activeQty > 0 && (
                                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                {activeQty} Units In Process
                                            </span>
                                        )}
                                        {hasSplitBatches && completedQty > 0 && !isCompleted && !isCurrent && activeQty === 0 && (
                                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                {completedQty} Units Completed
                                            </span>
                                        )}
                                    </div>

                                    {isCurrent && (
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider animate-pulse">
                                            Currently in progress {activeQty > 0 && `(${activeQty} Units)`}
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
