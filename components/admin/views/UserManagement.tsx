import React, { useState } from 'react';
import {
    Users, Plus, Edit2, Trash2, Search, Shield, Wrench, CheckCircle,
    X, User, Mail, Phone, Calendar, Award, Save
} from 'lucide-react';
import { Worker, ExtendedWorker, JobStage, ShiftType } from '../../../types';

interface UserManagementProps {
    workers: Worker[];
    onAddWorker: (worker: Omit<ExtendedWorker, 'id' | 'joinedDate'>) => void;
    onUpdateWorker: (id: string, updates: Partial<ExtendedWorker>) => void;
    onDeleteWorker: (id: string) => void;
}

const ROLE_OPTIONS = ['ADMIN', 'WORKER', 'QC'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
const SHIFT_OPTIONS: ShiftType[] = ['MORNING', 'EVENING', 'NIGHT'];
const SKILL_OPTIONS: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const UserManagement: React.FC<UserManagementProps> = ({
    workers,
    onAddWorker,
    onUpdateWorker,
    onDeleteWorker
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'WORKER',
        email: '',
        phone: '',
        skills: [] as JobStage[],
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE',
        shift: 'MORNING' as ShiftType
    });

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = () => {
        if (!formData.name.trim()) return;

        if (editingWorker) {
            onUpdateWorker(editingWorker.id, formData);
        } else {
            onAddWorker(formData);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            role: 'WORKER',
            email: '',
            phone: '',
            skills: [],
            status: 'ACTIVE',
            shift: 'MORNING'
        });
        setShowForm(false);
        setEditingWorker(null);
    };

    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            role: worker.role as string,
            email: '',
            phone: '',
            skills: [],
            status: 'ACTIVE',
            shift: 'MORNING'
        });
        setShowForm(true);
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return Shield;
            case 'QC': return CheckCircle;
            default: return Wrench;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'from-purple-500 to-purple-600';
            case 'QC': return 'from-amber-500 to-orange-600';
            default: return 'from-blue-500 to-blue-600';
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage team members and their roles</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Worker
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search workers..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500"
                />
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700">
                            <h2 className="text-lg font-bold text-white">
                                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                            </h2>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Name *</label>
                                <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3">
                                    <User size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter name"
                                        className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        {ROLE_OPTIONS.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
                                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3">
                                        <Mail size={16} className="text-slate-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email"
                                            className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Phone</label>
                                    <div className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3">
                                        <Phone size={16} className="text-slate-400" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Phone"
                                            className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Default Shift</label>
                                <div className="flex gap-2">
                                    {SHIFT_OPTIONS.map(shift => (
                                        <button
                                            key={shift}
                                            onClick={() => setFormData({ ...formData, shift })}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formData.shift === shift
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                                }`}
                                        >
                                            {shift}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
                            <button
                                onClick={resetForm}
                                className="px-5 py-2.5 text-slate-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                <Save size={16} />
                                {editingWorker ? 'Save Changes' : 'Add Worker'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkers.map((worker) => {
                    const RoleIcon = getRoleIcon(worker.role as string);
                    return (
                        <div
                            key={worker.id}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRoleColor(worker.role as string)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                    {worker.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-white">{worker.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <RoleIcon size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-400">{worker.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                <Calendar size={12} />
                                <span>Joined {new Date(worker.joinedDate).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">
                                    ACTIVE
                                </span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(worker)}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteWorker(worker.id)}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
