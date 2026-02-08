import React from 'react';
import { Scissors, Hammer, Wrench, Box, Droplet, Cpu } from 'lucide-react';
import { Job, JobStage } from '../../../types';
import { STAGE_LABELS } from '../../../constants.tsx';
import { BatchCard } from '../cards/BatchCard';

interface ProductionStageProps {
    stage: JobStage;
    jobs: Job[];
    onMarkComplete?: (id: string) => void;
    onSkip?: (id: string, reason: string) => void;
    onSplitBatch: (jobId: string, batchId: string, qty: number) => void;
    onMoveBatch: (jobId: string, batchId: string) => void;
    onRejectBatch: (jobId: string, batchId: string, reason: string) => void;
    onReprocessBatch: (jobId: string, batchId: string) => void;
}

const STAGE_CONFIG: Record<JobStage, { icon: React.ReactElement; color: string; label: string }> = {
    DESIGN: { icon: <Box />, color: '#3B82F6', label: 'Design' },
    CUTTING: { icon: <Scissors />, color: '#EF4444', label: 'Cutting' },
    BENDING: { icon: <Hammer />, color: '#F59E0B', label: 'Bending' },
    PUNCHING: { icon: <Wrench />, color: '#8B5CF6', label: 'Punching' },
    FABRICATION: { icon: <Box />, color: '#10B981', label: 'Fabrication' },
    POWDER_COATING: { icon: <Droplet />, color: '#EC4899', label: 'Powder Coating' },
    ASSEMBLY: { icon: <Cpu />, color: '#06B6D4', label: 'Assembly' },
    DISPATCH: { icon: <Box />, color: '#6366F1', label: 'Dispatch' },
};

export const ProductionStage: React.FC<ProductionStageProps> = ({ stage, jobs, onSkip, onSplitBatch, onMoveBatch, onRejectBatch, onReprocessBatch }) => {
    const config = STAGE_CONFIG[stage];

    // 1. Find active batches - exclude COMPLETED (awaiting QC) as they show in QC Stage
    const stageBatches = jobs.flatMap(job => {
        if (!job.batches) return [];
        return job.batches
            .filter(b => b.stage === stage && b.status !== 'COMPLETED' && b.status !== 'OK_QUALITY')
            .map(b => ({ batch: b, job }));
    });

    // 2. Find jobs in this stage that have NO active batches (orphan jobs)
    const orphanJobs = jobs.filter(job =>
        job.currentStage === stage &&
        (!job.batches || !job.batches.some(b => b.stage === stage))
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex justify-between items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32" style={{ backgroundColor: `${config.color}20` }}></div>
                <div>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{config.label}</h2>
                    <div className="flex items-center gap-4 mt-3 ml-1">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Active Items</span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{stageBatches.length + orphanJobs.length}</span>
                    </div>
                </div>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg relative z-10" style={{ backgroundColor: config.color }}>
                    {React.cloneElement(config.icon as any, { size: 32 })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                {/* Render Batches */}
                {stageBatches.map(({ batch, job }) => (
                    <BatchCard
                        key={`${job.id}-${batch.id}`}
                        batch={batch}
                        job={job}
                        onSplit={(_id, qty) => onSplitBatch(job.id, batch.id, qty)}
                        onMove={(_id) => onMoveBatch(job.id, batch.id)}
                        onReject={(bid, reason) => onRejectBatch(job.id, bid, reason)}
                        onReprocess={(bid) => onReprocessBatch(job.id, bid)}
                        onSkip={onSkip ? (bid, reason) => onSkip(job.id, reason) : undefined}
                    />
                ))}

                {/* Render Orphan Jobs (Fallback) */}
                {orphanJobs.map(job => (
                    <div key={job.id} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col justify-center items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            {React.cloneElement(config.icon as any, { size: 32, className: 'text-slate-400' })}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">#{job.codeNo}</h3>
                            <p className="text-sm text-slate-500">{job.customer}</p>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-xs font-bold uppercase">
                            Pending Batch Creation
                        </div>
                        <button
                            onClick={() => onMoveBatch(job.id, 'FORCE_INIT')}
                            className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Initialize Production Batch
                        </button>
                    </div>
                ))}

                {stageBatches.length === 0 && orphanJobs.length === 0 && (
                    <div className="col-span-full text-center py-20 opacity-50">
                        <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Active Process in {config.label}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

