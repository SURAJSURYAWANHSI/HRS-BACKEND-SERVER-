import React, { useState } from 'react';
import { Truck, CheckCircle, XCircle, FileText, AlertTriangle, RotateCcw, DollarSign, Archive } from 'lucide-react';
import { Job, RejectionReason, JobStage, DispatchStatus } from '../../../types';
import { REJECTION_REASONS } from '../../../constants';

interface DispatchJobCardProps {
    job: Job;
    onSetReady: (id: string, vehicle?: string, challan?: string, invoice?: string, dispatcherName?: string) => void;
    onDispatchComplete: (id: string) => void;
    onReject: (id: string, reason: string) => void;
    onCustomerReturn: (jobId: string, batchId: string, returnQty: number, reason: string, originStage: string) => void;
    onInvoiceGenerated?: (id: string, invoiceNo: string, amount: number) => void;
    onPaymentReceived?: (id: string) => void;
    onCloseOrder?: (id: string) => void;
    isQCRequest?: boolean;
}

const ORIGIN_STAGES = ['DESIGN', 'CUTTING', 'PUNCHING', 'BENDING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

// Helper to get dispatch status info
const getDispatchStatusInfo = (status?: DispatchStatus) => {
    switch (status) {
        case 'DISPATCHED':
            return { label: 'Dispatched', color: 'bg-blue-500', textColor: 'text-blue-500' };
        case 'INVOICE_PENDING':
            return { label: 'Invoice Pending', color: 'bg-amber-500', textColor: 'text-amber-500' };
        case 'PAYMENT_PENDING':
            return { label: 'Payment Pending', color: 'bg-purple-500', textColor: 'text-purple-500' };
        case 'CLOSED':
            return { label: 'Closed', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
        default:
            return { label: 'Ready', color: 'bg-slate-500', textColor: 'text-slate-500' };
    }
};

export const DispatchJobCard: React.FC<DispatchJobCardProps> = React.memo(({
    job,
    onSetReady,
    onDispatchComplete,
    onReject,
    onCustomerReturn,
    onInvoiceGenerated,
    onPaymentReceived,
    onCloseOrder,
    isQCRequest
}) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [isAddingInvoice, setIsAddingInvoice] = useState(false);

    // Return State
    const [returnQty, setReturnQty] = useState<number>(0);
    const [returnReason, setReturnReason] = useState('');
    const [returnOrigin, setReturnOrigin] = useState<string>('');

    const [rejectReason, setRejectReason] = useState<RejectionReason | ''>('');
    const [vehicleNo, setVehicleNo] = useState(job.vehicleNumber || '');
    const [challanNo, setChallanNo] = useState(job.challanNumber || '');
    const [invoiceNo, setInvoiceNo] = useState(job.invoiceNumber || '');
    const [invoiceAmount, setInvoiceAmount] = useState((job.invoiceAmount || '').toString());
    const [dispatcherName, setDispatcherName] = useState(job.dispatcherName || '');
    const [isReady, setIsReady] = useState(!!job.vehicleNumber);

    const dispatchStatus = job.dispatchStatus || 'PENDING';
    const statusInfo = getDispatchStatusInfo(job.dispatchStatus);
    const isDispatched = dispatchStatus !== 'PENDING';

    const handleReject = () => {
        if (rejectReason) {
            onReject(job.id, rejectReason);
            setIsRejecting(false);
            setRejectReason('');
        }
    };

    const handleReturn = () => {
        const candidateBatch = job.batches?.find(b => b.status === 'COMPLETED' || b.status === 'PENDING' || b.status === 'IN_PROGRESS');
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
            window.dispatchEvent(new CustomEvent('admin:notification', {
                detail: { message: "Please fill in Vehicle Number and Dispatcher Name", type: 'ERROR' }
            }));
            return;
        }
        onSetReady(job.id, vehicleNo, challanNo, '', dispatcherName);
        setIsReady(true);
    };

    const handleInvoice = () => {
        if (invoiceNo.trim() && invoiceAmount && onInvoiceGenerated) {
            onInvoiceGenerated(job.id, invoiceNo, parseFloat(invoiceAmount));
            setIsAddingInvoice(false);
        }
    };

    // Render different UI based on dispatch status
    const renderActions = () => {
        // Already dispatched - show post-dispatch actions
        if (isDispatched) {
            return (
                <div className="space-y-3">
                    {/* Dispatch Workflow Timeline */}
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center relative">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-0"></div>

                            {/* Stages */}
                            {[
                                { id: 'DISPATCHED', label: 'Dispatched', icon: Truck, date: job.actualDispatchTime },
                                { id: 'INVOICE_PENDING', label: 'Invoice', icon: FileText, date: job.invoiceDate },
                                { id: 'PAYMENT_PENDING', label: 'Payment', icon: DollarSign, date: job.paymentDate },
                                { id: 'CLOSED', label: 'Closed', icon: Archive, date: job.closedDate }
                            ].map((stage, index) => {
                                const isCompleted =
                                    (stage.id === 'DISPATCHED' && (dispatchStatus === 'DISPATCHED' || dispatchStatus === 'INVOICE_PENDING' || dispatchStatus === 'PAYMENT_PENDING' || dispatchStatus === 'CLOSED')) ||
                                    (stage.id === 'INVOICE_PENDING' && (dispatchStatus === 'INVOICE_PENDING' || dispatchStatus === 'PAYMENT_PENDING' || dispatchStatus === 'CLOSED')) ||
                                    (stage.id === 'PAYMENT_PENDING' && (dispatchStatus === 'PAYMENT_PENDING' || dispatchStatus === 'CLOSED')) ||
                                    (stage.id === 'CLOSED' && dispatchStatus === 'CLOSED');

                                const isCurrent = dispatchStatus === stage.id;
                                const Icon = stage.icon;

                                return (
                                    <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                            isCurrent ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 animate-pulse' :
                                                'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400'
                                            }`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isCompleted || isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{stage.label}</p>
                                            {stage.date && <p className="text-[8px] text-slate-500 font-bold">{new Date(stage.date).toLocaleDateString()}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Invoice Input (if not added yet) */}
                    {dispatchStatus === 'DISPATCHED' && isAddingInvoice && (
                        <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 animate-in fade-in">
                            <div className="mb-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Number</label>
                                <input
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="w-full mt-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                                    placeholder="INV-2024-XXXX"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Amount</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={invoiceAmount}
                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                        className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-7 text-xs font-bold text-slate-900 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddingInvoice(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    if (onInvoiceGenerated) {
                                        onInvoiceGenerated(job.id, invoiceNo, Number(invoiceAmount));
                                        setIsAddingInvoice(false);
                                    }
                                }} disabled={!invoiceNo.trim() || !invoiceAmount} className="flex-1 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
                                    Save Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons based on status */}
                    {!isAddingInvoice && (
                        <div className="flex flex-col gap-2">
                            {dispatchStatus === 'DISPATCHED' && (
                                <button
                                    onClick={() => setIsAddingInvoice(true)}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} /> Add Invoice
                                </button>
                            )}
                            {dispatchStatus === 'INVOICE_PENDING' && onPaymentReceived && (
                                <button
                                    onClick={() => onPaymentReceived(job.id)}
                                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={16} /> Mark Payment Received
                                </button>
                            )}
                            {dispatchStatus === 'PAYMENT_PENDING' && onCloseOrder && (
                                <button
                                    onClick={() => onCloseOrder(job.id)}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Archive size={16} /> Close Order
                                </button>
                            )}

                            {/* Return button always available for dispatched items */}
                            <button
                                onClick={() => setIsReturning(true)}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={16} /> Customer Return
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Not yet dispatched - show dispatch form
        if (isRejecting) {
            return (
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
                        <button onClick={() => setIsRejecting(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest">
                            Cancel
                        </button>
                        <button disabled={!rejectReason} onClick={handleReject} className="flex-1 py-3 bg-rose-600 disabled:opacity-50 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">
                            Confirm Reject
                        </button>
                    </div>
                </div>
            );
        }

        if (isReturning) {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 text-amber-500 mb-3">
                        <RotateCcw size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Customer Return Details</span>
                    </div>
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Return Qty</label>
                            <input type="number" value={returnQty} onChange={(e) => setReturnQty(Number(e.target.value))} max={job.totalQty} min={1}
                                className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason</label>
                            <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="e.g. Broken in transit"
                                className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Origin Stage</label>
                            <select value={returnOrigin} onChange={(e) => setReturnOrigin(e.target.value)}
                                className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none">
                                <option value="">-- Select Origin --</option>
                                {ORIGIN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsReturning(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                        <button disabled={!returnQty || !returnReason || !returnOrigin} onClick={handleReturn} className="flex-1 py-3 bg-amber-500 disabled:opacity-50 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Confirm Return</button>
                    </div>
                </div>
            );
        }

        // QC Request Approval UI
        if (isQCRequest && !isDispatched && !isRejecting && !isReturning) {
            return (
                <div className="flex flex-col gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Dispatch Request</h4>
                        </div>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-400">Worker has requested dispatch approval. Review details and approve.</p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => onDispatchComplete(job.id)}
                            className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2">
                            <CheckCircle size={16} /> Approve & Dispatch
                        </button>
                        <button onClick={() => setIsRejecting(true)} className="flex-1 py-4 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 text-rose-600 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <XCircle size={16} /> Reject
                        </button>
                    </div>
                </div>
            );
        }

        // Default: Show dispatch form
        return (
            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <button onClick={handleReady}
                        className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isReady
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/50'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-white'}`}>
                        <CheckCircle size={16} /> {isReady ? 'Marked Ready' : 'Set Ready'}
                    </button>
                    <button onClick={() => setIsRejecting(true)} className="px-6 py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        <XCircle size={18} />
                    </button>
                </div>
                <div className="flex gap-3">
                    <button disabled={!isReady} onClick={() => onDispatchComplete(job.id)}
                        className="flex-[2] py-4 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                        <Truck size={16} /> Dispatch Now
                    </button>
                    <button onClick={() => setIsReturning(true)} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                        <RotateCcw size={16} /> Return
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-white dark:bg-[#1E293B]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border ${isDispatched ? 'border-blue-500/30' : isReady ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-200 dark:border-slate-800/50'} shadow-2xl space-y-6 transition-all`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-600/20">#{job.codeNo}</span>
                        {isDispatched && (
                            <span className={`px-3 py-1 ${statusInfo.color}/10 ${statusInfo.textColor} rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusInfo.color.replace('bg-', 'border-')}/20`}>
                                {statusInfo.label}
                            </span>
                        )}
                        {!isDispatched && isReady && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20 animate-pulse">RFD Active</span>}
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
                    <p className="text-xl font-black text-slate-900 dark:text-white">{job.totalQty} <span className="text-[10px] text-slate-500">PCS</span></p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isDispatched ? 'Dispatched On' : 'Dispatch Due'}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {isDispatched && job.actualDispatchTime
                            ? new Date(job.actualDispatchTime).toLocaleDateString()
                            : job.dispatchDate || 'N/A'}
                    </p>
                </div>
                {job.vehicleNumber && (
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vehicle</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{job.vehicleNumber}</p>
                    </div>
                )}
                {job.invoiceNumber && (
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{job.invoiceNumber}</p>
                    </div>
                )}
            </div>

            {/* Dispatch Inputs (only for not-dispatched) */}
            {!isDispatched && !isRejecting && !isReturning && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Number <span className="text-rose-500">*</span></label>
                            <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}
                                className={`w-full bg-white dark:bg-[#0F172A] border ${!vehicleNo && !isReady ? 'border-rose-200' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white`}
                                placeholder="MH-XX-XX-XXXX" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Challan / Ref No.</label>
                            <input value={challanNo} onChange={(e) => setChallanNo(e.target.value)}
                                className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                                placeholder="CH-2024-XXX" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Dispatcher Name <span className="text-rose-500">*</span></label>
                            <input value={dispatcherName} onChange={(e) => setDispatcherName(e.target.value)}
                                className={`w-full bg-white dark:bg-[#0F172A] border ${!dispatcherName && !isReady ? 'border-rose-200' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white`}
                                placeholder="e.g. Amit Kumar" />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-2">
                {renderActions()}
            </div>
        </div>
    );
});
