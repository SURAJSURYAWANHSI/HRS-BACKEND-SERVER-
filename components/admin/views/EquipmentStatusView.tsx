import React, { useState } from 'react';
import {
    Wrench, Plus, Search, Edit2, AlertTriangle, CheckCircle,
    Clock, Calendar, Settings, X, Save, Activity, PauseCircle
} from 'lucide-react';
import { Equipment, EquipmentStatus, JobStage } from '../../../types';
import { STAGE_LABELS } from '../../../constants';

interface EquipmentStatusViewProps {
    equipment: Equipment[];
    onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
    onUpdateEquipment: (id: string, updates: Partial<Equipment>) => void;
    onDeleteEquipment: (id: string) => void;
}

const getStatusConfig = (status: EquipmentStatus) => {
    switch (status) {
        case 'OPERATIONAL':
            return { label: 'Operational', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle };
        case 'MAINTENANCE':
            return { label: 'Maintenance', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Settings };
        case 'DOWN':
            return { label: 'Down', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertTriangle };
        case 'IDLE':
            return { label: 'Idle', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: PauseCircle };
        default:
            return { label: status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Settings };
    }
};

const STAGE_OPTIONS: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];
const STATUS_OPTIONS: EquipmentStatus[] = ['OPERATIONAL', 'MAINTENANCE', 'DOWN', 'IDLE'];

export const EquipmentStatusView: React.FC<EquipmentStatusViewProps> = ({
    equipment,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        station: '',
        stage: 'CUTTING' as JobStage,
        status: 'OPERATIONAL' as EquipmentStatus,
        lastMaintenance: Date.now(),
        nextMaintenance: Date.now() + 30 * 24 * 60 * 60 * 1000,
        hoursUsed: 0,
        notes: ''
    });

    const filteredEquipment = equipment.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const operationalCount = equipment.filter(e => e.status === 'OPERATIONAL').length;
    const maintenanceCount = equipment.filter(e => e.status === 'MAINTENANCE').length;
    const downCount = equipment.filter(e => e.status === 'DOWN').length;

    const handleSubmit = () => {
        if (!formData.name.trim()) return;

        if (editingEquipment) {
            onUpdateEquipment(editingEquipment.id, formData);
        } else {
            onAddEquipment(formData);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            station: '',
            stage: 'CUTTING',
            status: 'OPERATIONAL',
            lastMaintenance: Date.now(),
            nextMaintenance: Date.now() + 30 * 24 * 60 * 60 * 1000,
            hoursUsed: 0,
            notes: ''
        });
        setShowForm(false);
        setEditingEquipment(null);
    };

    const handleEdit = (eq: Equipment) => {
        setEditingEquipment(eq);
        setFormData({
            name: eq.name,
            type: eq.type,
            station: eq.station,
            stage: eq.stage,
            status: eq.status,
            lastMaintenance: eq.lastMaintenance,
            nextMaintenance: eq.nextMaintenance,
            hoursUsed: eq.hoursUsed,
            notes: eq.notes || ''
        });
        setShowForm(true);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Equipment Status</h1>
                    <p className="text-sm text-slate-400 mt-1">Monitor machine status and maintenance</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Equipment
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Wrench size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{equipment.length}</p>
                            <p className="text-xs text-slate-400">Total Equipment</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Activity size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-emerald-400">{operationalCount}</p>
                            <p className="text-xs text-slate-400">Operational</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Settings size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-400">{maintenanceCount}</p>
                            <p className="text-xs text-slate-400">Maintenance</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-rose-400">{downCount}</p>
                            <p className="text-xs text-slate-400">Down</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search equipment..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500"
                />
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700">
                            <h2 className="text-lg font-bold text-white">
                                {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                            </h2>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="CNC Machine 1"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Type</label>
                                    <input
                                        type="text"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        placeholder="CNC, Press, etc."
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Stage</label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        {STAGE_OPTIONS.map(stage => (
                                            <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                                        ))}
                                    </select>
                                </div>
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
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {STATUS_OPTIONS.map(status => {
                                        const { label, color } = getStatusConfig(status);
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setFormData({ ...formData, status })}
                                                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${formData.status === status ? color : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Hours Used</label>
                                <input
                                    type="number"
                                    value={formData.hoursUsed}
                                    onChange={(e) => setFormData({ ...formData, hoursUsed: Number(e.target.value) })}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any additional notes..."
                                    rows={2}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
                            <button onClick={resetForm} className="px-5 py-2.5 text-slate-400 hover:text-white font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                <Save size={16} />
                                {editingEquipment ? 'Save Changes' : 'Add Equipment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipment.map((eq) => {
                    const { label, color, icon: StatusIcon } = getStatusConfig(eq.status);
                    const needsMaintenance = eq.nextMaintenance < Date.now();

                    return (
                        <div
                            key={eq.id}
                            className={`bg-slate-800/50 border rounded-2xl p-5 transition-all hover:border-slate-600/50 ${needsMaintenance ? 'border-amber-500/50' : 'border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <Wrench size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{eq.name}</h3>
                                        <p className="text-xs text-slate-400">{eq.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(eq)}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Status</span>
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${color}`}>
                                        <StatusIcon size={12} />
                                        {label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Stage</span>
                                    <span className="text-white font-medium">{STAGE_LABELS[eq.stage]}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Station</span>
                                    <span className="text-white">{eq.station}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Hours Used</span>
                                    <span className="text-white font-medium">{eq.hoursUsed}h</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock size={12} />
                                    <span>Last maintenance: {formatDate(eq.lastMaintenance)}</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${needsMaintenance ? 'text-amber-400' : 'text-slate-500'}`}>
                                    <Calendar size={12} />
                                    <span>Next maintenance: {formatDate(eq.nextMaintenance)}</span>
                                    {needsMaintenance && <span className="text-[10px] font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">OVERDUE</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
