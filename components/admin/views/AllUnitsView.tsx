import React from 'react';
import { Package, Box, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Job } from '../../../types';

interface AllUnitsViewProps {
    jobs: Job[];
}

export const AllUnitsView: React.FC<AllUnitsViewProps> = ({ jobs }) => {
    // Calculate total units across all jobs and batches
    const totalUnits = jobs.reduce((sum, job) => sum + job.totalQty, 0);
    const completedUnits = jobs.reduce((sum, job) => sum + job.goodQty, 0);
    const rejectedUnits = jobs.reduce((sum, job) => sum + job.rejectQty, 0);
    const pendingUnits = jobs.reduce((sum, job) => sum + job.pendingQty, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800/50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="bg-purple-600 p-5 rounded-3xl shadow-2xl">
                        <Package size={32} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">All Units</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">Complete Production Overview</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <Box className="text-blue-100" size={24} />
                        <span className="text-blue-100 text-xs font-black uppercase">Total</span>
                    </div>
                    <p className="text-4xl font-black text-white">{totalUnits}</p>
                    <p className="text-blue-100 text-sm font-bold mt-1">Units</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="text-emerald-100" size={24} />
                        <span className="text-emerald-100 text-xs font-black uppercase">Completed</span>
                    </div>
                    <p className="text-4xl font-black text-white">{completedUnits}</p>
                    <p className="text-emerald-100 text-sm font-bold mt-1">Good Units</p>
                </div>

                <div className="bg-gradient-to-br from-rose-600 to-rose-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <XCircle className="text-rose-100" size={24} />
                        <span className="text-rose-100 text-xs font-black uppercase">Rejected</span>
                    </div>
                    <p className="text-4xl font-black text-white">{rejectedUnits}</p>
                    <p className="text-rose-100 text-sm font-bold mt-1">Defective</p>
                </div>

                <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="text-orange-100" size={24} />
                        <span className="text-orange-100 text-xs font-black uppercase">Pending</span>
                    </div>
                    <p className="text-4xl font-black text-white">{pendingUnits}</p>
                    <p className="text-orange-100 text-sm font-bold mt-1">In Progress</p>
                </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800/50 shadow-2xl">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-6">All Jobs</h3>
                <div className="space-y-3">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-black">{job.codeNo}</span>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white">{job.customer}</h4>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.description}</p>
                                </div>
                                <div className="flex gap-8 text-center">
                                    <div>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{job.totalQty}</p>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-600">{job.goodQty}</p>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Good</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-rose-600">{job.rejectQty}</p>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Reject</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-orange-600">{job.pendingQty}</p>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
