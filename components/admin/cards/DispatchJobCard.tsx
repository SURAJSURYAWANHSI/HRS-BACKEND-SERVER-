import React, { useState } from 'react';
import { Truck, CheckCircle, XCircle, FileText, AlertTriangle, RotateCcw } from 'lucide-react';
import { Job, RejectionReason, JobStage } from '../../../types';
import { REJECTION_REASONS } from '../../../constants';

interface DispatchJobCardProps {
    job: Job;
    onSetReady: (id: string, vehicle?: string, challan?: string, invoice?: string, dispatcherName?: string) => void;
    onDispatchComplete: (id: string) => void;
    onReject: (id: string, reason: string) => void;
    onCustomerReturn: (jobId: string, batchId: string, returnQty: number, reason: string, originStage: string) => void;
}

const ORIGIN_STAGES = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const DispatchJobCard: React.FC<DispatchJobCardProps> = React.memo(({ job, onSetReady, onDispatchComplete, onReject, onCustomerReturn }) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReturning, setIsReturning] = useState(false); // New State

    // Return State
    const [returnQty, setReturnQty] = useState<number>(0);
    const [returnReason, setReturnReason] = useState('');
    const [returnOrigin, setReturnOrigin] = useState<string>('');

    const [rejectReason, setRejectReason] = useState<RejectionReason | ''>('');
    const [vehicleNo, setVehicleNo] = useState(job.vehicleNumber || '');
    const [challanNo, setChallanNo] = useState(job.challanNumber || '');
    const [invoiceNo, setInvoiceNo] = useState(job.invoiceNumber || '');
    const [dispatcherName, setDispatcherName] = useState('');
    const [isReady, setIsReady] = useState(false);

    const handleReject = () => {
        if (rejectReason) {
            onReject(job.id, rejectReason);
            setIsRejecting(false);
            setRejectReason('');
        }
    };

    const handleReturn = () => {
        // Find the first DISPATCHED/COMPLETED batch to return against?
        // Or currently we just return against the job?
        // Since input is vague, let's assume we return from the *current* active batch or finding a relevant batch
        // For simplicity, we'll pick the first batch that has quantity >= returnQty
        const candidateBatch = job.batches.find(b => b.status === 'COMPLETED' || b.status === 'PENDING' || b.status === 'IN_PROGRESS');

        if (candidateBatch && returnQty > 0 && returnReason && returnOrigin) {
            onCustomerReturn(job.id, candidateBatch.id, returnQty, returnReason, returnOrigin);
            setIsReturning(false);
            setReturnQty(0);
            setReturnReason('');
            setReturnOrigin('');
        }
    };

    const handleReady = () => {
        if (!vehicleNo.trim() || !dispatcherName.trim()) {
            // Replace alert with custom notification event
            window.dispatchEvent(new CustomEvent('admin:notification', {
                detail: { message: "Please fill in Vehicle Number and Dispatcher Name", type: 'ERROR' }
            }));
            return;
        }
        onSetReady(job.id, vehicleNo, challanNo, '', dispatcherName); // Passing dispatcherName
        setIsReady(true);
    };

    return (
        <div className={`bg-white dark:bg-[#1E293B]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border ${isReady ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-200 dark:border-slate-800/50'} shadow-2xl space-y-6 transition-all`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-600/20">#{job.codeNo}</span>
                        {isReady && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20 animate-pulse">RFD Active</span>}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{job.customer}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{job.description}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Truck size={20} />
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-[#0F172A] rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Items</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{job.totalQty} <span className="text-[10px] text-slate-500 dark:text-slate-600">PCS</span></p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Dispatch Due</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{job.dispatchDate || 'N/A'}</p>
                    <p className="text-sm font-bold text-slate-500">{job.dispatchTime}</p>
                </div>
            </div>

            {/* Dispatch Inputs */}
            {!isRejecting && !isReturning && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Number <span className="text-rose-500">*</span></label>
                            <input
                                value={vehicleNo}
                                onChange={(e) => setVehicleNo(e.target.value)}
                                className={`w-full bg-white dark:bg-[#0F172A] border ${!vehicleNo && !isReady ? 'border-rose-200 dark:border-rose-900' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors`}
                                placeholder="MH-XX-XX-XXXX"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Challan / Ref No.</label>
                            <input
                                value={challanNo}
                                onChange={(e) => setChallanNo(e.target.value)}
                                className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                                placeholder="INV-2024-XXX"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Dispatcher Name <span className="text-rose-500">*</span></label>
                            <input
                                value={dispatcherName}
                                onChange={(e) => setDispatcherName(e.target.value)}
                                className={`w-full bg-white dark:bg-[#0F172A] border ${!dispatcherName && !isReady ? 'border-rose-200 dark:border-rose-900' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors`}
                                placeholder="e.g. Amit Kumar"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-2">
                {!isRejecting && !isReturning ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button
                                onClick={handleReady}
                                className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isReady
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/50'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-white'}`}
                            >
                                <CheckCircle size={16} /> {isReady ? 'Marked Ready (RFD)' : 'Set Ready (RFD)'}
                            </button>
                            <button
                                onClick={() => setIsRejecting(true)}
                                className="px-6 py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button
                                disabled={!isReady}
                                onClick={() => onDispatchComplete(job.id)}
                                className="flex-[2] py-4 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Truck size={16} /> Confirm Dispatch
                            </button>
                            <button
                                onClick={() => setIsReturning(true)}
                                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={16} /> Return
                            </button>
                        </div>
                    </div>
                ) : isReturning ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                        <div className="flex items-center gap-2 text-amber-500 mb-3">
                            <RotateCcw size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Customer Return Details</span>
                        </div>
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Return Qty</label>
                                <input
                                    type="number"
                                    value={returnQty}
                                    onChange={(e) => setReturnQty(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                                    max={job.totalQty}
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason</label>
                                <input
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="e.g. Broken in transit"
                                    className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Origin Stage</label>
                                <select
                                    value={returnOrigin}
                                    onChange={(e) => setReturnOrigin(e.target.value)}
                                    className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                                >
                                    <option value="">-- Select Origin --</option>
                                    {ORIGIN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsReturning(false)}
                                className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!returnQty || !returnReason || !returnOrigin}
                                onClick={handleReturn}
                                className="flex-1 py-3 bg-amber-500 disabled:opacity-50 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Confirm Return
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                        <div className="flex items-center gap-2 text-rose-500 mb-3">
                            <AlertTriangle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Reason for Rejection</span>
                        </div>
                        <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value as RejectionReason)}
                            className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500 mb-4"
                        >
                            <option value="">-- Select Reason --</option>
                            {REJECTION_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsRejecting(false)}
                                className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!rejectReason}
                                onClick={handleReject}
                                className="flex-1 py-3 bg-rose-600 disabled:opacity-50 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
