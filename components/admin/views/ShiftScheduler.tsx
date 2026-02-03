import React, { useState, useMemo } from 'react';
import {
    Calendar, Plus, ChevronLeft, ChevronRight, Clock, User,
    X, Save, Sun, Moon, Sunset
} from 'lucide-react';
import { Worker, Shift, ShiftType, JobStage } from '../../../types';
import { STAGE_LABELS } from '../../../constants';

interface ShiftSchedulerProps {
    workers: Worker[];
    shifts: Shift[];
    onAddShift: (shift: Omit<Shift, 'id'>) => void;
    onUpdateShift: (id: string, updates: Partial<Shift>) => void;
    onDeleteShift: (id: string) => void;
}

const SHIFT_CONFIG: Record<ShiftType, { label: string; icon: React.ElementType; color: string; time: string }> = {
    MORNING: { label: 'Morning', icon: Sun, color: 'from-amber-400 to-orange-500', time: '06:00 - 14:00' },
    EVENING: { label: 'Evening', icon: Sunset, color: 'from-purple-500 to-pink-500', time: '14:00 - 22:00' },
    NIGHT: { label: 'Night', icon: Moon, color: 'from-blue-600 to-indigo-700', time: '22:00 - 06:00' }
};

const STAGE_OPTIONS: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({
    workers,
    shifts,
    onAddShift,
    onUpdateShift,
    onDeleteShift
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        workerId: '',
        workerName: '',
        shiftType: 'MORNING' as ShiftType,
        station: '',
        stage: '' as JobStage | ''
    });

    // Generate week days
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day + 1); // Start from Monday

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return {
                date,
                dateStr: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: date.getDate(),
                isToday: date.toDateString() === new Date().toDateString()
            };
        });
    }, [currentDate]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const getShiftsForDate = (dateStr: string) => {
        return shifts.filter(s => s.date === dateStr);
    };

    const handleSubmit = () => {
        if (!formData.workerId || !selectedDate) return;

        const worker = workers.find(w => w.id === formData.workerId);
        const config = SHIFT_CONFIG[formData.shiftType];
        const [startTime, endTime] = config.time.split(' - ');

        onAddShift({
            workerId: formData.workerId,
            workerName: worker?.name || '',
            date: selectedDate,
            shiftType: formData.shiftType,
            startTime,
            endTime,
            station: formData.station,
            stage: formData.stage as JobStage,
            isConfirmed: true
        });

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            workerId: '',
            workerName: '',
            shiftType: 'MORNING',
            station: '',
            stage: ''
        });
        setShowForm(false);
        setSelectedDate(null);
    };

    const openFormForDate = (dateStr: string) => {
        setSelectedDate(dateStr);
        setShowForm(true);
    };

    const eligibleWorkers = workers.filter(w => w.role !== 'ADMIN');

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Shift Scheduler</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage worker schedules</p>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigateWeek('prev')}
                        className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-white">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-xs text-slate-400">
                            Week of {weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={() => navigateWeek('next')}
                        className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                        const dayShifts = getShiftsForDate(day.dateStr);
                        return (
                            <div
                                key={day.dateStr}
                                className={`rounded-xl border transition-all ${day.isToday
                                        ? 'border-blue-500/50 bg-blue-500/10'
                                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                                    }`}
                            >
                                {/* Day Header */}
                                <div className={`text-center py-3 border-b ${day.isToday ? 'border-blue-500/30' : 'border-slate-700/50'
                                    }`}>
                                    <p className={`text-xs font-medium ${day.isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {day.dayName}
                                    </p>
                                    <p className={`text-lg font-bold ${day.isToday ? 'text-blue-400' : 'text-white'}`}>
                                        {day.dayNum}
                                    </p>
                                </div>

                                {/* Shifts */}
                                <div className="p-2 space-y-2 min-h-[120px]">
                                    {dayShifts.map((shift) => {
                                        const config = SHIFT_CONFIG[shift.shiftType];
                                        const Icon = config.icon;
                                        return (
                                            <div
                                                key={shift.id}
                                                className={`p-2 rounded-lg bg-gradient-to-r ${config.color} group relative`}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Icon size={10} className="text-white/80" />
                                                    <span className="text-[9px] font-medium text-white/80">
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-white truncate">
                                                    {shift.workerName}
                                                </p>
                                                <button
                                                    onClick={() => onDeleteShift(shift.id)}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} className="text-white" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        onClick={() => openFormForDate(day.dateStr)}
                                        className="w-full p-2 border border-dashed border-slate-600/50 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-500/50 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Shift Legend */}
            <div className="flex items-center gap-6">
                {Object.entries(SHIFT_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center`}>
                                <Icon size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">{config.label}</p>
                                <p className="text-[10px] text-slate-400">{config.time}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700">
                            <div>
                                <h2 className="text-lg font-bold text-white">Add Shift</h2>
                                <p className="text-xs text-slate-400">
                                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                                        weekday: 'long', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Worker *</label>
                                <select
                                    value={formData.workerId}
                                    onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                >
                                    <option value="">Select Worker</option>
                                    {eligibleWorkers.map(worker => (
                                        <option key={worker.id} value={worker.id}>{worker.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Shift Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(SHIFT_CONFIG) as ShiftType[]).map((type) => {
                                        const config = SHIFT_CONFIG[type];
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, shiftType: type })}
                                                className={`p-3 rounded-xl border transition-all ${formData.shiftType === type
                                                        ? `bg-gradient-to-r ${config.color} border-transparent`
                                                        : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
                                                    }`}
                                            >
                                                <Icon size={18} className={formData.shiftType === type ? 'text-white mx-auto' : 'text-slate-400 mx-auto'} />
                                                <p className={`text-xs font-bold mt-1 ${formData.shiftType === type ? 'text-white' : 'text-slate-400'}`}>
                                                    {config.label}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Station</label>
                                    <input
                                        type="text"
                                        value={formData.station}
                                        onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                                        placeholder="Station A"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Stage</label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        <option value="">Any Stage</option>
                                        {STAGE_OPTIONS.map(stage => (
                                            <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
                            <button onClick={resetForm} className="px-5 py-2.5 text-slate-400 hover:text-white font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.workerId}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                <Save size={16} />
                                Add Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
