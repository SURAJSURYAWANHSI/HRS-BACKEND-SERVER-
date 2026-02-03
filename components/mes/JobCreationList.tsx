import React, { useState, useEffect } from 'react';
import { Job, Worker, JobStage } from '../../types';
import { Save, Play, Users, Calendar, Clock, Box, FileText, Hash, ArrowLeft } from 'lucide-react';
import { getColorFromRAL, isValidRAL } from '../../utils/ralColors';

interface JobCreationListProps {
    workers: Worker[];
    onSaveJob: (job: Job, startNow: boolean) => void;
    onBack: () => void;
}

export const JobCreationList: React.FC<JobCreationListProps> = ({ workers, onSaveJob, onBack }) => {
    const [customer, setCustomer] = useState('');
    const [jobType, setJobType] = useState<'AUTO' | 'MANUAL'>('AUTO');
    const [manualCode, setManualCode] = useState('');
    const [description, setDescription] = useState('');
    const [totalQty, setTotalQty] = useState(1);
    const [batchQty, setBatchQty] = useState(1);
    const [panelSize, setPanelSize] = useState('');
    const [color, setColor] = useState('');
    const [ralCode, setRalCode] = useState('');
    const [dispatchDate, setDispatchDate] = useState('');
    const [dispatchTime, setDispatchTime] = useState('');
    const [session, setSession] = useState<'Morning' | 'Evening' | 'Night'>('Morning');
    const [maxTime, setMaxTime] = useState(12);
    const [estTime, setEstTime] = useState(10);
    const [assignedWorkers, setAssignedWorkers] = useState<string[]>([]);

    // Auto-detect RAL color code and fill color picker
    useEffect(() => {
        if (ralCode) {
            const detectedColor = getColorFromRAL(ralCode);
            if (detectedColor) {
                setColor(detectedColor);
            }
        }
    }, [ralCode]);

    const handleSubmit = (startNow: boolean) => {
        const jobCode = jobType === 'AUTO' ? `JOB-${Date.now().toString().slice(-6)}` : manualCode;

        const newJob: Job = {
            id: `JOB-${Date.now()}`,
            srNo: Date.now(),
            customer,
            codeNo: jobCode,
            description,
            totalQty,
            batchQty,
            goodQty: 0,
            rejectQty: 0,
            pendingQty: batchQty,
            dispatchedQty: 0,
            panelSize,
            color,
            ralCode,
            currentStage: 'DESIGN',
            qcStatus: 'PENDING',
            skippedStages: [],
            stageStatus: {},
            history: [],
            batches: [], // Empty batches, will be initialized when design approved
            dispatchDate,
            dispatchTime,
            session,
            maxCompletionTime: maxTime,
            expectedWorkingTime: estTime,
            followUpDate: dispatchDate,
            startTime: Date.now(),
            lastUpdated: Date.now(),
            isCompleted: false,
            assignedWorkers,
            remark: 'Job Created'
        };

        onSaveJob(newJob, startNow);
    };

    const toggleWorker = (name: string) => {
        setAssignedWorkers(prev => prev.includes(name) ? prev.filter(w => w !== name) : [...prev, name]);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0B1121] text-slate-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1E293B] transition-colors duration-500">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ArrowLeft /></button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Create New Job</h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Production Entry Protocol</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleSubmit(false)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors text-slate-600 dark:text-white">
                        <Save size={16} /> Save as Draft
                    </button>
                    <button onClick={() => handleSubmit(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 text-white transition-colors">
                        <Play size={16} /> Save & Start Pipeline
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Section 1: Basic Info */}
                    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 transition-colors duration-500 shadow-xl dark:shadow-none">
                        <div className="flex items-center gap-3 text-blue-500 mb-2">
                            <FileText />
                            <h3 className="text-lg font-black uppercase tracking-widest">Job Essentials</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Name</label>
                                <input value={customer} onChange={e => setCustomer(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-white" placeholder="Enter Client Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Job Number Assignment</label>
                                <div className="flex gap-2">
                                    <div className="flex bg-slate-50 dark:bg-[#0F172A] rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                        <button onClick={() => setJobType('AUTO')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${jobType === 'AUTO' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Auto</button>
                                        <button onClick={() => setJobType('MANUAL')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${jobType === 'MANUAL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Manual</button>
                                    </div>
                                    {jobType === 'MANUAL' && (
                                        <input value={manualCode} onChange={e => setManualCode(e.target.value)} className="flex-1 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-white" placeholder="Enter Job Code" />
                                    )}
                                    {jobType === 'AUTO' && (
                                        <div className="flex-1 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                            <Hash size={16} /> System Generated
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition-colors resize-none text-slate-900 dark:text-white" placeholder="Detailed job description..." />
                        </div>
                    </div>

                    {/* Section 2: Specifications */}
                    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 transition-colors duration-500 shadow-xl dark:shadow-none">
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <Box />
                            <h3 className="text-lg font-black uppercase tracking-widest">Specifications</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Batch Quantity</label>
                                <input type="number" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Total Quantity</label>
                                <input type="number" value={totalQty} onChange={e => setTotalQty(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Panel Size (mm)</label>
                                <input value={panelSize} onChange={e => setPanelSize(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white" placeholder="HxWxD" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Color Code</label>
                                <input value={color} onChange={e => setColor(e.target.value)} type="color" className="w-full h-[54px] bg-slate-50 dark:bg-[#0F172A] p-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">RAL Code / Spec</label>
                                <div className="relative">
                                    <input
                                        value={ralCode}
                                        onChange={e => setRalCode(e.target.value)}
                                        className={`w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border-2 outline-none transition-all text-slate-900 dark:text-white ${ralCode && isValidRAL(ralCode)
                                            ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                                            }`}
                                        placeholder="RAL 7035 / Texture"
                                    />
                                    {ralCode && isValidRAL(ralCode) && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-lg border-2 border-white shadow-lg"
                                                style={{ backgroundColor: getColorFromRAL(ralCode) || '#000' }}
                                            ></div>
                                            <span className="text-xs font-black text-emerald-500">✓ Valid</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Timeline & Workers */}
                    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 transition-colors duration-500 shadow-xl dark:shadow-none">
                        <div className="flex items-center gap-3 text-purple-500 mb-2">
                            <Calendar />
                            <h3 className="text-lg font-black uppercase tracking-widest">Timeline & Assignment</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dispatch Date</label>
                                <input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dispatch Time</label>
                                <input type="time" value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Session</label>
                                <select value={session} onChange={e => setSession(e.target.value as any)} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 transition-colors text-slate-900 dark:text-white">
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Max Days</label>
                                <input type="number" value={maxTime} onChange={e => setMaxTime(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Est. Work Days</label>
                                <input type="number" value={estTime} onChange={e => setEstTime(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 transition-colors text-slate-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Assign Team Members</label>
                            <div className="flex flex-wrap gap-2">
                                {workers.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => toggleWorker(w.name)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border ${assignedWorkers.includes(w.name)
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                                            : 'bg-slate-50 dark:bg-[#0F172A] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                            }`}
                                    >
                                        <Users size={14} /> {w.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
