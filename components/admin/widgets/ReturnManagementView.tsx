import React, { useState } from 'react';
import { Job, Batch, JobStage } from '../../../types';
import { RotateCcw, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { STAGE_COLORS } from '../../../constants';

interface ReturnManagementViewProps {
    jobs: Job[];
    onReprocess: (jobId: string, batchId: string, targetStage: JobStage) => void;
    onScrap: (jobId: string, batchId: string, reason: string) => void;
}

const ALL_STAGES: JobStage[] = ['CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const ReturnManagementView: React.FC<ReturnManagementViewProps> = ({ jobs, onReprocess, onScrap }) => {
    // Flatten all RETURNED batches
    const returnedBatches = jobs.flatMap(job =>
        job.batches
            .filter(b => b.status === 'RETURNED')
            .map(b => ({ job, batch: b }))
    );

    const [selectedAction, setSelectedAction] = useState<{ type: 'REPROCESS' | 'SCRAP', batchId: string } | null>(null);
    const [targetStage, setTargetStage] = useState<JobStage | ''>('');
    const [scrapReason, setScrapReason] = useState('');

    const handleConfirm = () => {
        if (!selectedAction) return;
        const { type, batchId } = selectedAction;
        const item = returnedBatches.find(x => x.batch.id === batchId);
        if (!item) return;

        if (type === 'REPROCESS' && targetStage) {
            onReprocess(item.job.id, batchId, targetStage as JobStage);
        } else if (type === 'SCRAP' && scrapReason) {
            onScrap(item.job.id, batchId, scrapReason);
        }

        // Reset
        setSelectedAction(null);
        setTargetStage('');
        setScrapReason('');
    };

    if (returnedBatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">No Returns Pending</h3>
                <p className="text-sm font-semibold mt-2">All dispatched items are good!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center">
                    <RotateCcw size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Customer Returns</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{returnedBatches.length} items requiring action</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {returnedBatches.map(({ job, batch }) => (
                    <div key={batch.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-amber-200 dark:border-amber-900/50 shadow-xl relative overflow-hidden group">

                        {/* Status Strip */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>

                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">#{job.codeNo}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Returned
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">{job.customer}</h3>
                            <p className="text-xs text-slate-500 font-bold">{batch.quantity} Units</p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 mb-6">
                            <p className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest mb-1">Return Reason</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{batch.rejectionReason}</p>
                            {batch.returnOriginStage && (
                                <p className="text-[9px] font-bold text-slate-400 mt-2">Origin: <span className="uppercase">{batch.returnOriginStage}</span></p>
                            )}
                        </div>

                        {selectedAction?.batchId === batch.id ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                {selectedAction.type === 'REPROCESS' ? (
                                    <>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Select Target Stage</p>
                                        <select
                                            value={targetStage}
                                            onChange={e => setTargetStage(e.target.value as JobStage)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 text-xs font-bold p-2 rounded-lg outline-none border border-slate-200 dark:border-slate-700"
                                        >
                                            <option value="">-- Choose Stage --</option>
                                            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Scrap Reason</p>
                                        <input
                                            value={scrapReason}
                                            onChange={e => setScrapReason(e.target.value)}
                                            placeholder="Why scrapping?"
                                            className="w-full bg-slate-50 dark:bg-slate-800 text-xs font-bold p-2 rounded-lg outline-none border border-slate-200 dark:border-slate-700"
                                        />
                                    </>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedAction(null)}
                                        className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
                                    >Cancel</button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={(selectedAction.type === 'REPROCESS' && !targetStage) || (selectedAction.type === 'SCRAP' && !scrapReason)}
                                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg text-white disabled:opacity-50 ${selectedAction.type === 'REPROCESS' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                                    >Confirm</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setSelectedAction({ type: 'REPROCESS', batchId: batch.id }); setTargetStage(batch.returnOriginStage || ''); }}
                                    className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={14} /> Reprocess
                                </button>
                                <button
                                    onClick={() => setSelectedAction({ type: 'SCRAP', batchId: batch.id })}
                                    className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Trash2 size={14} /> Scrap
                                </button>
                            </div>
                        )}

                    </div>
                ))}
            </div>
        </div>
    );
};

import { CheckCircle2 } from 'lucide-react';
