import React from 'react';
import { Job, RejectionReason } from '../../../types';
import { QCJobCard } from '../cards/QCJobCard';
import { QCBatchCard } from '../cards/QCBatchCard';

interface QCStageProps {
    jobs: Job[];
    onApprove: (id: string, user: string) => void;
    onReject: (id: string, user: string, reason: RejectionReason) => void;
    onApproveBatch: (jobId: string, batchId: string) => void;
    onRejectBatch: (jobId: string, batchId: string, reason: string) => void;
    currentUser: string;
}

export const QCStage: React.FC<QCStageProps> = ({ jobs, onApprove, onReject, onApproveBatch, onRejectBatch, currentUser }) => {
    // 1. Find jobs waiting for FULL QC
    const jobsPendingQC = jobs.filter(j => j.qcStatus === 'READY_FOR_QC');

    // 2. Find BATCHES waiting for QC (Status = COMPLETED)
    const batchesPendingQC = jobs.flatMap(job => {
        if (!job.batches) return [];
        return job.batches
            .filter(b => b.status === 'COMPLETED')
            .map(b => ({ batch: b, job }));
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter relative z-10">Quality Control</h2>
                <div className="flex items-center gap-4 mt-3 ml-1 relative z-10">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Pending Validations</p>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">{jobsPendingQC.length + batchesPendingQC.length}</span>
                </div>
            </div>

            {/* BATCH QC SECTION */}
            {batchesPendingQC.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight ml-4 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Production Batches Awaiting QC
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {batchesPendingQC.map(({ batch, job }) => (
                            <QCBatchCard
                                key={`${job.id}-${batch.id}`}
                                batch={batch}
                                job={job}
                                onApprove={(bid) => onApproveBatch(job.id, bid)}
                                onReject={(bid, reason) => onRejectBatch(job.id, bid, reason)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* JOB QC SECTION (Legacy/Full Stage) */}
            {jobsPendingQC.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight ml-4 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Full Stage Approvals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {jobsPendingQC.map(job => (
                            <QCJobCard
                                key={job.id}
                                job={job}
                                onApprove={onApprove}
                                onReject={onReject}
                                user={currentUser}
                            />
                        ))}
                    </div>
                </div>
            )}

            {batchesPendingQC.length === 0 && jobsPendingQC.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Items Pending QC</p>
                </div>
            )}
        </div>
    );
};
