import React from 'react';
import { Trash2 } from 'lucide-react';
import { Job } from '../../../types';
import { ProductionJourney } from './ProductionJourney';

interface JobInspectorProps {
    job: Job;
    onDelete: () => void;
}

export const JobInspector: React.FC<JobInspectorProps> = ({ job, onDelete }) => {
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-none mb-2">{job.customer}</h3>
                <p className="text-sm font-bold text-slate-500">{job.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Qty</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{job.totalQty}</p>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Size</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{job.panelSize}</p>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">RAL Code</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: job.color }}></div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.ralCode || 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Batch Qty</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{job.batchQty}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Production Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dispatch Date</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.dispatchDate || 'Not Set'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Session</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.session || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Max Completion</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.maxCompletionTime} Days</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Assigned Team</h4>
                <div className="flex flex-wrap gap-2">
                    {job.assignedWorkers.map((worker, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                            {worker}
                        </span>
                    ))}
                    {job.assignedWorkers.length === 0 && <span className="text-xs text-slate-400 italic">No workers assigned</span>}
                </div>
            </div>

            <ProductionJourney job={job} />

            <button
                onClick={onDelete}
                className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20 rounded-[1.5rem] font-black uppercase text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 mt-8"
            >
                <Trash2 size={16} /> Delete Job Order
            </button>
        </div>
    );
};
