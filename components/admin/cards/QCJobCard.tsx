import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Job, RejectionReason } from '../../../types';
import { REJECTION_REASONS } from '../../../constants';

interface QCJobCardProps {
    job: Job;
    onApprove: (id: string, user: string) => void;
    onReject: (id: string, user: string, reason: RejectionReason) => void;
    user: string;
}

export const QCJobCard: React.FC<QCJobCardProps> = ({ job, onApprove, onReject, user }) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState<RejectionReason | ''>('');

    const handleReject = () => {
        if (reason) {
            onReject(job.id, user, reason as RejectionReason);
            setIsRejecting(false);
            setReason('');
        }
    };

    return (
        <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800/50 shadow-2xl space-y-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            {/* Header: Origin & ID */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Incoming: {job.currentStage.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">#{job.codeNo}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{job.customer}</h3>
                </div>
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <ClipboardCheck size={20} />
                </div>
            </div>

            {/* Job Order Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="col-span-2">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Description</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-2">{job.description}</p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Size / Dim</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{job.panelSize}</p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Color</p>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: job.color }}></div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{job.ralCode}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Qty</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{job.totalQty} Units</p>
                </div>
                <div className="col-span-2">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">Processed By</p>
                    <div className="flex flex-wrap gap-2">
                        {job.assignedWorkers.length > 0 ? job.assignedWorkers.map((w, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[8px] font-black text-slate-600 dark:text-slate-300">
                                    {w.charAt(0)}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase">{w}</span>
                            </div>
                        )) : <span className="text-xs text-slate-400 font-bold italic">Unassigned</span>}
                    </div>
                </div>
            </div>

            {!isRejecting ? (
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsRejecting(true)}
                        className="flex-1 py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-100 dark:border-transparent"
                    >
                        <XCircle size={16} /> Reject
                    </button>
                    <button
                        onClick={() => onApprove(job.id, user)}
                        className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={16} /> QC Passed
                    </button>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                            <AlertTriangle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Select Rejection Reason</span>
                        </div>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value as RejectionReason)}
                            className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                        >
                            <option value="">-- Select Reason --</option>
                            {REJECTION_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsRejecting(false)}
                            className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!reason}
                            onClick={handleReject}
                            className="flex-1 py-3 bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                        >
                            Confirm Reject
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
