import React from 'react';
import { Truck, FileText } from 'lucide-react';
import { Job } from '../../../types';
import { DispatchJobCard } from '../cards/DispatchJobCard';

interface DispatchStageProps {
    jobs: Job[];
    onSetReady: (id: string, vehicle?: string, challan?: string, invoice?: string) => void;
    onDispatchComplete: (id: string) => void;
    onReject: (id: string, reason: string) => void;
    onCustomerReturn: (jobId: string, batchId: string, returnQty: number, reason: string, originStage: string) => void;
    onInvoiceGenerated?: (id: string, invoiceNo: string, amount: number) => void;
    onPaymentReceived?: (id: string) => void;
    onCloseOrder?: (id: string) => void;
}

export const DispatchStage: React.FC<DispatchStageProps> = ({
    jobs,
    onSetReady,
    onDispatchComplete,
    onReject,
    onCustomerReturn,
    onInvoiceGenerated,
    onPaymentReceived,
    onCloseOrder
}) => {
    // QC Requests (Worker requested dispatch)
    const qcRequests = jobs.filter(j =>
        j.currentStage === 'DISPATCH' &&
        j.qcStatus === 'READY_FOR_QC' &&
        !j.isCompleted &&
        (!j.dispatchStatus || j.dispatchStatus === 'PENDING')
    );

    // Jobs waiting for preparation (No QC request yet)
    const pendingPreparation = jobs.filter(j =>
        j.currentStage === 'DISPATCH' &&
        j.qcStatus !== 'READY_FOR_QC' &&
        !j.isCompleted &&
        (!j.dispatchStatus || j.dispatchStatus === 'PENDING')
    );

    // Jobs that are dispatched but not yet closed (awaiting invoice/payment)
    const dispatchedJobs = jobs.filter(j =>
        j.dispatchStatus &&
        j.dispatchStatus !== 'PENDING' &&
        j.dispatchStatus !== 'CLOSED'
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex justify-between items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] -mr-32 -mt-32"></div>
                <div>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Final Dispatch</h2>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1">Shipping Logistics & Closeout</p>
                </div>
                <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)] relative z-10">
                    <Truck size={32} />
                </div>
            </div>

            {/* Section: Dispatch QC Requests */}
            {qcRequests.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-4">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dispatch Approval Requests</h3>
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">{qcRequests.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {qcRequests.map(job => (
                            <DispatchJobCard
                                key={job.id}
                                job={job}
                                onSetReady={onSetReady}
                                onDispatchComplete={onDispatchComplete}
                                onReject={onReject}
                                onCustomerReturn={onCustomerReturn}
                                onInvoiceGenerated={onInvoiceGenerated}
                                onPaymentReceived={onPaymentReceived}
                                onCloseOrder={onCloseOrder}
                                isQCRequest={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Section: Pending Preparation */}
            {pendingPreparation.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-4">
                        <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ready to Dispatch</h3>
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold">{pendingPreparation.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {pendingPreparation.map(job => (
                            <DispatchJobCard
                                key={job.id}
                                job={job}
                                onSetReady={onSetReady}
                                onDispatchComplete={onDispatchComplete}
                                onReject={onReject}
                                onCustomerReturn={onCustomerReturn}
                                onInvoiceGenerated={onInvoiceGenerated}
                                onPaymentReceived={onPaymentReceived}
                                onCloseOrder={onCloseOrder}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Section: Dispatched - Awaiting Invoice/Payment */}
            {dispatchedJobs.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-4">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dispatched - Pending Closure</h3>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{dispatchedJobs.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {dispatchedJobs.map(job => (
                            <DispatchJobCard
                                key={job.id}
                                job={job}
                                onSetReady={onSetReady}
                                onDispatchComplete={onDispatchComplete}
                                onReject={onReject}
                                onCustomerReturn={onCustomerReturn}
                                onInvoiceGenerated={onInvoiceGenerated}
                                onPaymentReceived={onPaymentReceived}
                                onCloseOrder={onCloseOrder}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {qcRequests.length === 0 && pendingPreparation.length === 0 && dispatchedJobs.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Jobs in Dispatch</p>
                </div>
            )}
        </div>
    );
};
