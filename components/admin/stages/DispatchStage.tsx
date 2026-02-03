import React from 'react';
import { Truck } from 'lucide-react';
import { Job } from '../../../types';
import { DispatchJobCard } from '../cards/DispatchJobCard';

interface DispatchStageProps {
    jobs: Job[];
    onSetReady: (id: string, vehicle?: string, challan?: string, invoice?: string) => void;
    onDispatchComplete: (id: string) => void;
    onReject: (id: string, reason: string) => void;
    onCustomerReturn: (jobId: string, batchId: string, returnQty: number, reason: string, originStage: string) => void;
}

export const DispatchStage: React.FC<DispatchStageProps> = ({ jobs, onSetReady, onDispatchComplete, onReject, onCustomerReturn }) => (
    <div className="space-y-12 animate-in fade-in duration-700">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {
                jobs.filter(j => j.currentStage === 'DISPATCH' && !j.isCompleted).map(job => (
                    <DispatchJobCard
                        key={job.id}
                        job={job}
                        onSetReady={onSetReady}
                        onDispatchComplete={onDispatchComplete}
                        onReject={onReject}
                        onCustomerReturn={onCustomerReturn}
                    />
                ))
            }
        </div>
    </div>
);
