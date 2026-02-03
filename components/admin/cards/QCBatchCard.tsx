import React, { useState } from 'react';
import { Package, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Batch, Job, RejectionReason } from '../../../types';
import { REJECTION_REASONS } from '../../../constants';

interface QCBatchCardProps {
    batch: Batch;
    job: Job;
    onApprove: (batchId: string) => void;
    onReject: (batchId: string, reason: string) => void;
}

export const QCBatchCard: React.FC<QCBatchCardProps> = ({ batch, job, onApprove, onReject }) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState<string>('');

    const handleReject = () => {
        if (reason) {
            onReject(batch.id, reason);
            setIsRejecting(false);
            setReason('');
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
                        {batch.id}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{job.customer}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">#{job.codeNo}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">{batch.stage}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{batch.quantity}</p>
                </div>
            </div>

            {!isRejecting ? (
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsRejecting(true)}
                        className="flex-1 py-3 px-4 bg-rose-50 text-rose-500 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle size={16} /> Reject
                    </button>
                    <button
                        onClick={() => onApprove(batch.id)}
                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={16} /> QC Passed
                    </button>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                            <AlertTriangle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Select Reason</span>
                        </div>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 text-xs font-bold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                        >
                            <option value="">-- Select Reason --</option>
                            {REJECTION_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRejecting(false)}
                            className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!reason}
                            onClick={handleReject}
                            className="flex-1 py-2 bg-rose-600 disabled:opacity-50 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
