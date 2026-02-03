import React from 'react';
import { PenTool, Plus, CheckCircle2, XCircle, History } from 'lucide-react';
import { Job, DesignSubTaskType, DesignSubTaskStatus } from '../../../types';
import { DesignJobCard } from '../cards/DesignJobCard';

interface DesignStageProps {
    jobs: Job[];
    onApproveSpec: (id: string) => void;
    onSkip: (id: string, reason: string) => void;
    onUploadBlueprint: (id: string, files: FileList | null) => void;
    onRemoveBlueprint: (id: string, index: number) => void;
    onDeleteJob: (id: string) => void;
    onUpdateDesignSubTask: (jobId: string, taskId: DesignSubTaskType, status: DesignSubTaskStatus) => void;
    onNavigateToNewOrder: () => void;
}

export const DesignStage: React.FC<DesignStageProps> = ({
    jobs,
    onApproveSpec,
    onSkip,
    onUploadBlueprint,
    onRemoveBlueprint,
    onDeleteJob,
    onUpdateDesignSubTask,
    onNavigateToNewOrder
}) => {
    // Toggle for History
    const [showHistory, setShowHistory] = React.useState(false);
    const [selectedHistoryJob, setSelectedHistoryJob] = React.useState<Job | null>(null);

    // Filter logic
    const activeDesignJobs = jobs.filter(j => j.currentStage === 'DESIGN' && !j.isCompleted);
    const historyJobs = jobs.filter(j => j.currentStage !== 'DESIGN' || j.isCompleted).sort((a, b) => b.startTime - a.startTime);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex justify-between items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32" style={{ backgroundColor: '#2563EB20' }}></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-blue-600 p-5 rounded-3xl shadow-2xl">
                        <PenTool size={32} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Design Specs</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                                {showHistory ? 'Design History & Archives' : 'Pending Approval Queue'}
                            </p>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all flex items-center gap-2 ${showHistory ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                                {showHistory ? <><CheckCircle2 size={14} /> Showing History</> : 'View History'}
                            </button>
                        </div>
                    </div>
                </div>
                {!showHistory && (
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-blue-600/10 px-6 py-3 rounded-2xl">
                            <span className="text-3xl font-black text-blue-600">
                                {activeDesignJobs.length}
                            </span>
                        </div>
                        <button
                            onClick={onNavigateToNewOrder}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-lg transition-all hover:scale-105"
                            title="Create New Order"
                        >
                            <Plus size={24} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Switcher */}
            {!showHistory ? (
                // ACTIVE CARDS GRID
                <div className="grid grid-cols-1 gap-8 pb-20">
                    {activeDesignJobs.length === 0 ? (
                        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-16 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex flex-col items-center justify-center gap-6 text-center">
                            <div className="p-8 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                <PenTool size={64} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">No Active Designs</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-semibold mb-6">All design specifications have been approved</p>
                                <button onClick={onNavigateToNewOrder} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg">Create New Job</button>
                            </div>
                        </div>
                    ) : (
                        activeDesignJobs.map(job => (
                            <DesignJobCard
                                key={job.id}
                                job={job}
                                onUploadBlueprint={onUploadBlueprint}
                                onRemoveBlueprint={onRemoveBlueprint}
                                onApproveSpec={onApproveSpec}
                                onDeleteJob={onDeleteJob}
                                onUpdateDesignSubTask={onUpdateDesignSubTask}
                                onSkip={onSkip}
                            />
                        ))
                    )}
                </div>
            ) : (
                // HISTORY CARDS GRID
                <div className="grid grid-cols-1 gap-8 pb-20">
                    {historyJobs.length === 0 ? (
                        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-16 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex flex-col items-center justify-center gap-6 text-center">
                            <div className="p-8 rounded-full bg-slate-100 dark:bg-slate-800">
                                <History size={64} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">No History</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-semibold">No past design jobs found.</p>
                            </div>
                        </div>
                    ) : (
                        historyJobs.map(job => (
                            <DesignJobCard
                                key={job.id}
                                job={job}
                                onUploadBlueprint={onUploadBlueprint}
                                onRemoveBlueprint={onRemoveBlueprint}
                                onApproveSpec={onApproveSpec}
                                onDeleteJob={onDeleteJob}
                                onUpdateDesignSubTask={onUpdateDesignSubTask}
                            // No skip needed for history
                            />
                        ))
                    )}
                </div>
            )}

            {/* History Detail Modal */}
            {selectedHistoryJob && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl h-full overflow-y-auto no-scrollbar relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setSelectedHistoryJob(null)}
                            className="absolute top-4 right-4 z-[110] p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-xl hover:scale-110 transition-transform"
                        >
                            <XCircle size={24} />
                        </button>
                        <DesignJobCard
                            job={selectedHistoryJob}
                            onUploadBlueprint={onUploadBlueprint}
                            onRemoveBlueprint={onRemoveBlueprint}
                            onApproveSpec={onApproveSpec}
                            onDeleteJob={onDeleteJob}
                            onUpdateDesignSubTask={onUpdateDesignSubTask}
                            onSkip={onSkip}
                        // No skip/approve allowed in history (Card handles this logic via currentStage check)
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
