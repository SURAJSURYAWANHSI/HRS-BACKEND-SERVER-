import React, { useState } from 'react';
import { CloudUpload, CheckCircle2, FastForward, HelpCircle, XCircle, ChevronLeft, ChevronRight, Eye, Trash2, CircleDot, Circle, CheckCircle } from 'lucide-react';
import { Job, DesignSubTaskType, DesignSubTaskStatus } from '../../../types';
import { DEFAULT_DESIGN_SUBTASKS } from '../../../constants';
import { StageTimeTracker } from '../widgets/StageTimeTracker';

interface DesignJobCardProps {
    job: Job;
    onApproveSpec: (id: string) => void;
    onUploadBlueprint: (id: string, files: FileList | null) => void;
    onRemoveBlueprint: (id: string, index: number) => void;
    onSkip?: (id: string, reason: string) => void;
    onDeleteJob?: (id: string) => void;
    onUpdateDesignSubTask?: (jobId: string, taskId: DesignSubTaskType, status: DesignSubTaskStatus) => void;
    onViewDetails?: (job: Job) => void;
}

export const DesignJobCard: React.FC<DesignJobCardProps> = React.memo(({ job, onApproveSpec, onUploadBlueprint, onRemoveBlueprint, onSkip, onDeleteJob, onUpdateDesignSubTask, onViewDetails }) => {
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [skipReason, setSkipReason] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initialize design sub-tasks if not present - ALWAYS ensure we have tasks
    const designSubTasks = job.designSubTasks && job.designSubTasks.length > 0
        ? job.designSubTasks
        : DEFAULT_DESIGN_SUBTASKS;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUploadBlueprint(job.id, e.dataTransfer.files);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUploadBlueprint(job.id, e.target.files);
        }
    };

    const triggerUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Filter out invalid/empty blueprint URLs - only show actual uploaded images
    const activeBlueprints = (job.blueprints || []).filter(bp =>
        bp && bp.trim() !== '' && (bp.startsWith('blob:') || bp.startsWith('http') || bp.startsWith('data:'))
    );

    return (
        <>
            <div
                className={`bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 ${isDragging ? 'border-blue-500 shadow-blue-500/30 shadow-2xl scale-[1.01]' : 'border-slate-200 dark:border-slate-700 shadow-xl'} transition-all duration-300 w-full relative overflow-hidden`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 z-10 flex items-center justify-center backdrop-blur-sm rounded-3xl">
                        <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-base shadow-xl animate-bounce">
                            Drop Files Here
                        </div>
                    </div>
                )}

                {/* Header Row */}
                <div className="absolute top-6 left-6 flex items-center gap-4 z-20">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md">
                        #{job.codeNo}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight leading-none">{job.customer}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">Design Specs</span>
                    </div>
                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ml-2">
                        {activeBlueprints.length} Files
                    </div>
                    <StageTimeTracker
                        currentStageStartTime={job.currentStageStartTime}
                        stageName="Design"
                        estimatedHours={job.expectedWorkingTime || 24}
                    />
                    <button
                        onClick={() => activeBlueprints.length > 0 && setFullScreenImage(activeBlueprints[0])}
                        disabled={activeBlueprints.length === 0}
                        title="Preview Designs"
                    >
                        <Eye size={16} />
                    </button>
                    {onViewDetails && (
                        <button
                            onClick={() => onViewDetails(job)}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-md ml-2"
                            title="View Process & Details"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                            <span className="sr-only">Details</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        </button>
                    )}
                </div>

                {/* Main Content: Two Column Layout - Upload LEFT, Workflow RIGHT */}
                {/* MAIN GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-6 mt-16">
                    {/* LEFT: Upload Area */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Upload Designs</h3>
                            <button
                                onClick={triggerUpload}
                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                            >
                                <CloudUpload size={14} /> Add Design
                            </button>
                        </div>

                        {activeBlueprints.length === 0 ? (
                            <div
                                onClick={triggerUpload}
                                className="border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all min-h-[400px] group"
                            >
                                <CloudUpload size={64} className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                                <p className="text-slate-600 dark:text-slate-400 font-bold text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    Click or Drag & Drop<br />to Upload Blueprints
                                </p>
                                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs shadow-lg group-hover:bg-blue-500 transition-all">
                                    Select Files
                                </button>
                                <p className="text-xs text-slate-500">Supports: PDF, PNG, JPG</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {activeBlueprints.map((blueprint, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                        {blueprint.match(/application\/pdf|pdf/i) ? (
                                            <div
                                                className="w-full h-32 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => window.open(blueprint, '_blank')}
                                            >
                                                <div className="bg-red-500/10 p-3 rounded-lg text-red-500 mb-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">PDF Document</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={blueprint}
                                                alt={`Blueprint ${idx + 1}`}
                                                className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                onClick={() => setFullScreenImage(blueprint)}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setFullScreenImage(blueprint)}
                                                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveBlueprint(job.id, idx);
                                                }}
                                                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                                title="Remove Design"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* RIGHT: Design Progress Tracker */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Design Components & Workflow</h3>
                        <p className="text-xs font-bold text-slate-400 -mt-2">Track completion of individual design parts</p>
                        <div className="space-y-3">
                            {designSubTasks.map(task => {
                                const isCompleted = task.status === 'COMPLETED';
                                const isInProgress = task.status === 'IN_PROGRESS';

                                const handleTaskClick = () => {
                                    if (!onUpdateDesignSubTask) return;

                                    let newStatus: DesignSubTaskStatus;
                                    if (task.status === 'PENDING') newStatus = 'IN_PROGRESS';
                                    else if (task.status === 'IN_PROGRESS') newStatus = 'COMPLETED';
                                    else newStatus = 'PENDING';

                                    onUpdateDesignSubTask(job.id, task.id, newStatus);
                                };

                                return (
                                    <button
                                        key={task.id}
                                        onClick={handleTaskClick}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-800 border-2 border-slate-200 dark:border-slate-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <div className="flex-none">
                                            {isCompleted ? (
                                                <CheckCircle className="text-emerald-500" size={24} />
                                            ) : isInProgress ? (
                                                <CircleDot className="text-blue-500 animate-pulse" size={24} />
                                            ) : (
                                                <Circle className="text-slate-300 dark:text-slate-600" size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-base font-black ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : isInProgress ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {task.label}
                                            </p>
                                        </div>
                                        <div className="flex-none">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                isInProgress ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="w-full flex justify-center gap-4 mt-8">
                    {job.currentStage !== 'DESIGN' ? (
                        <div className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                                Currently in {job.currentStage} Stage
                            </span>
                        </div>
                    ) : (
                        <>
                            {onSkip && !isSkipping && (
                                <button
                                    onClick={() => setIsSkipping(true)}
                                    className="px-6 py-4 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2"
                                >
                                    <FastForward size={16} /> Skip Design
                                </button>
                            )}

                            {isSkipping ? (
                                <div className="w-full bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 animate-in fade-in">
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Skip Reason:</p>
                                    <input
                                        type="text"
                                        value={skipReason}
                                        onChange={(e) => setSkipReason(e.target.value)}
                                        placeholder="e.g., Client doesn't need spec approval"
                                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-700 outline-none mb-3"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setIsSkipping(false); setSkipReason(''); }}
                                            className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (skipReason && onSkip) {
                                                    onSkip(job.id, skipReason);
                                                    setIsSkipping(false);
                                                    setSkipReason('');
                                                }
                                            }}
                                            disabled={!skipReason}
                                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                                        >
                                            Confirm Skip
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onApproveSpec(job.id)}
                                    disabled={activeBlueprints.length === 0}
                                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-sm tracking-wide transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    Approve Spec
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Full Screen Preview Modal */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const idx = activeBlueprints.indexOf(fullScreenImage);
                            const prevIdx = idx > 0 ? idx - 1 : activeBlueprints.length - 1;
                            setFullScreenImage(activeBlueprints[prevIdx]);
                        }}
                        className="absolute left-10 text-white/50 hover:text-white p-4 rounded-full hover:bg-white/10 transition-all z-[160]"
                    >
                        <ChevronLeft size={48} />
                    </button>

                    <img src={fullScreenImage} alt="Full Screen Blueprint" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl z-[155]" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const idx = activeBlueprints.indexOf(fullScreenImage);
                            const nextIdx = idx < activeBlueprints.length - 1 ? idx + 1 : 0;
                            setFullScreenImage(activeBlueprints[nextIdx]);
                        }}
                        className="absolute right-10 text-white/50 hover:text-white p-4 rounded-full hover:bg-white/10 transition-all z-[160]"
                    >
                        <ChevronRight size={48} />
                    </button>

                    <button onClick={() => setFullScreenImage(null)} className="absolute top-10 right-10 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all z-[160]">
                        <XCircle size={32} />
                    </button>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold uppercase tracking-widest">
                        Tap anywhere to close
                    </div>
                    {/* Close on background click */}
                    <div className="absolute inset-0 z-[150]" onClick={() => setFullScreenImage(null)}></div>
                </div>
            )}
        </>
    );
});
