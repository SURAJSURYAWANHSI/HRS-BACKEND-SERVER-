import React, { useState } from 'react';
import { CheckCircle2, FastForward, HelpCircle } from 'lucide-react';
import { Job } from '../../../types';

interface ProductionJobCardProps {
    job: Job;
    onMarkComplete: (id: string) => void;
    onSkip: (id: string, reason: string) => void;
}

export const ProductionJobCard: React.FC<ProductionJobCardProps> = ({ job, onMarkComplete, onSkip }) => {
    const [isSkipping, setIsSkipping] = useState(false);
    const [skipReason, setSkipReason] = useState('');

    const handleSkip = () => {
        if (skipReason) {
            onSkip(job.id, skipReason);
            setIsSkipping(false);
            setSkipReason('');
        }
    };

    return (
        <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800/50 shadow-2xl space-y-8 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{job.customer}</h3>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">{job.panelSize}</div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-8">{job.description}</p>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600">
                        <span>Total Qty</span>
                        <span className="text-slate-900 dark:text-white">{job.totalQty} Units</span>
                    </div>
                    {/* Add more details as needed */}
                </div>
            </div>

            <div className="space-y-3">
                {!isSkipping ? (
                    <>
                        <button
                            onClick={() => onMarkComplete(job.id)}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                        >
                            <CheckCircle2 size={16} /> Mark Completed
                        </button>
                        <button
                            onClick={() => setIsSkipping(true)}
                            className="w-full py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <FastForward size={14} /> Skip Stage
                        </button>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-amber-500 mb-1">
                            <HelpCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Reason for Skipping</span>
                        </div>
                        <input
                            value={skipReason}
                            onChange={(e) => setSkipReason(e.target.value)}
                            placeholder="e.g. Not Required, Outsourced"
                            className="w-full bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsSkipping(false)}
                                className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!skipReason}
                                onClick={handleSkip}
                                className="flex-1 py-3 bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
