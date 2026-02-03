import React, { useState } from 'react';
import { Package, Play, CheckCircle, ArrowRight, XCircle, FastForward } from 'lucide-react';
import { Batch, Job } from '../../../types';

interface BatchCardProps {
    batch: Batch;
    job: Job;
    onSplit: (batchId: string, doneQty: number) => void;
    onMove: (batchId: string) => void;
    onReject: (batchId: string, reason: string) => void;
    onReprocess?: (batchId: string) => void;
    onSkip?: (batchId: string, reason: string) => void;
}

export const BatchCard: React.FC<BatchCardProps> = React.memo(({ batch, job, onSplit, onMove, onReject, onReprocess, onSkip }) => {
    const isLate = job.maxCompletionTime && (Date.now() - job.startTime) > (job.maxCompletionTime * 24 * 60 * 60 * 1000);
    // Change to string | number to support empty state
    const [doneQty, setDoneQty] = useState<number | string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [skipReason, setSkipReason] = useState('');

    // Sync state if prop updates (Critical for Split updates)
    React.useEffect(() => {
        setDoneQty(''); // Reset to empty to show placeholder of new max
    }, [batch.quantity]);

    const handleAction = () => {
        if (batch.status === 'PENDING') {
            // ...
        }

        if (batch.status === 'COMPLETED') {
            return; // Waiting for QC
        }

        // Default to full batch if empty
        const finalQty = doneQty === '' ? batch.quantity : Number(doneQty);

        if (finalQty > batch.quantity) return; // Error
        if (finalQty <= 0) return; // Prevent 0/negative splits

        onSplit(batch.id, finalQty);
    };

    const isCompleted = batch.status === 'COMPLETED';
    const isRejected = batch.status === 'REJECTED';
    const isOkQuality = batch.status === 'OK_QUALITY';
    const isPending = batch.status === 'PENDING';

    // Pending Time Logic
    const getPendingDuration = () => {
        if (!batch.pendingSince) return null;
        const days = Math.floor((Date.now() - batch.pendingSince) / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days}d` : 'Today';
    };
    const pendingDuration = getPendingDuration();

    return (
        <div className={`
            relative p-6 rounded-2xl border transition-all duration-300
            ${isCompleted
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/50'
                : isRejected
                    ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-700/50'
                    : isOkQuality
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700/50'
                        : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800' // Default / Pending
            }
            ${isPending ? 'border-l-4 border-l-amber-400' : ''} 
            hover:shadow-xl
        `}>
            {/* Pending Timer Badge */}
            {(batch.status === 'PENDING' || batch.status === 'OK_QUALITY') && pendingDuration && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 shadow-sm z-10">
                    Pending: {pendingDuration}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg
                        ${isCompleted ? 'bg-emerald-500 shadow-emerald-500/30' : isRejected ? 'bg-rose-500 shadow-rose-500/30' : 'bg-blue-600 shadow-blue-600/30'}
                    `}>
                        {batch.id}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{job.customer}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{job.codeNo}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`
                        px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                        ${isCompleted
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                            : isRejected
                                ? 'bg-rose-100 text-rose-600 border-rose-200'
                                : isOkQuality
                                    ? 'bg-blue-100 text-blue-600 border-blue-200'
                                    : 'bg-amber-50 text-amber-600 border-amber-200' // Distinct Pending
                        }
                    `}>
                        {batch.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {isRejected && (
                <div className="mb-4 p-3 bg-white dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-800">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-rose-200">{batch.rejectionReason}</p>
                </div>
            )}

            {batch.reprocessCount && batch.reprocessCount > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-600">
                        {batch.reprocessCount}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Reprocessed</span>
                </div>
            )}

            <div className="flex items-center justify-between mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {isPending ? 'To Process' : 'Total'}
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{batch.quantity}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Action</p>
                    {isCompleted ? (
                        <p className="text-xs font-bold text-emerald-500 uppercase">Ready to Move</p>
                    ) : isRejected ? (
                        <p className="text-xs font-bold text-rose-500 uppercase">Action Required</p>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={doneQty}
                                max={batch.quantity}
                                min={1}
                                placeholder={batch.quantity.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDoneQty(val === '' ? '' : Number(val));
                                }}
                                className="w-16 p-1 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            />
                            <span className="text-[10px] font-bold text-slate-400">/ {batch.quantity}</span>
                        </div>
                    )}
                </div>
            </div>

            {isSkipping ? (
                <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Skip this stage completely?</p>
                    <input
                        type="text"
                        value={skipReason}
                        onChange={(e) => setSkipReason(e.target.value)}
                        placeholder="e.g., Not required for this batch"
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-700 outline-none mb-3"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsSkipping(false); setSkipReason(''); }}
                            className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (skipReason && onSkip) {
                                    onSkip(batch.id, skipReason);
                                    setIsSkipping(false);
                                    setSkipReason('');
                                }
                            }}
                            disabled={!skipReason}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                        >
                            Confirm Skip
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="flex gap-3">
                {/* Skip Button - Only show if not completed/rejected */}
                {onSkip && !isCompleted && !isRejected && (
                    <button
                        onClick={() => setIsSkipping(true)}
                        className="flex-none py-3 px-4 bg-amber-50 text-amber-600 rounded-xl font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
                        title="Skip this stage"
                    >
                        <FastForward size={18} />
                    </button>
                )}

                {/* Only show Reject button if not already rejected/completed */}
                {!isCompleted && !isRejected && (
                    <button
                        onClick={() => onReject(batch.id, 'Standard Rejection')} // TODO: Add reason input
                        className="flex-none py-3 px-4 bg-rose-50 text-rose-500 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-colors"
                        title="Reject Batch"
                    >
                        <XCircle size={18} />
                    </button>
                )}

                {isRejected ? (
                    <button
                        onClick={() => onReprocess && onReprocess(batch.id)}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Play size={14} /> Reprocess Batch
                    </button>
                ) : (
                    isCompleted ? (
                        <button
                            disabled
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} /> Sent to QC
                        </button>
                    ) : (
                        <button
                            onClick={handleAction}
                            className={`
                                flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2
                                ${isCompleted
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                                }
                            `}
                        >
                            {(doneQty === '' ? batch.quantity : Number(doneQty)) < batch.quantity ? 'Split & Complete' : 'Complete Work'} <CheckCircle size={14} />
                        </button>
                    )
                )}
            </div>
        </div >
    );
});
