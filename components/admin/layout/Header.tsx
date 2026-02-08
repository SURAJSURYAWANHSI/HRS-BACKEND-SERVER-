import React, { useState } from 'react';
import {
    Activity, PenTool, Scissors, Hammer, Wrench, ClipboardCheck,
    Truck, Megaphone, Plus, Search, Radio, LogOut, Moon, Sun,
    User, ChevronDown, Monitor, Palette, Trash2, BarChart3, FileText,
    Users, Package, Calendar, Settings, Bell
} from 'lucide-react';
import { Worker, Notification } from '../../../types';
import { NotificationBell } from '../../notifications/NotificationBell';

interface HeaderProps {
    currentView: any;
    setCurrentView: (view: any) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    currentUser: Worker | null;
    onLogout: () => void;
    onClearData: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClearNotification: (id: string) => void;
    onClearAll: () => void;
    onNotificationClick: (notification: Notification) => void;
}

export const Header: React.FC<HeaderProps> = ({
    currentView, setCurrentView, searchTerm, setSearchTerm, currentUser, onLogout, onClearData,
    notifications, onMarkAsRead, onMarkAllRead, onClearNotification, onClearAll, onNotificationClick
}) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return true;
    });

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        // Apply immediately to DOM
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <header className="sticky top-0 z-[100] flex-none bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 shadow-lg dark:shadow-2xl transition-colors duration-300">
            <div className="max-w-[1920px] mx-auto px-6 py-3">
                <div className="flex justify-between items-center w-full">
                    {/* LEFT: BRANDING */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">ProTrack</h1>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Admin Console</p>
                        </div>
                    </div>

                    {/* CENTER: SEARCH */}
                    <div className="hidden lg:flex items-center gap-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-2.5 w-[280px] focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search production..."
                            className="bg-transparent border-none outline-none text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* RIGHT: ACTION BUTTONS + PROFILE */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentView({ type: 'ADMIN_CREATE_JOB' })}
                            className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md
                                ${currentView.type === 'ADMIN_CREATE_JOB'
                                    ? 'bg-blue-500 text-white shadow-blue-500/30 ring-2 ring-blue-400'
                                    : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500 hover:scale-105'
                                }`}
                        >
                            <Plus size={16} /> <span className="hidden lg:inline">New Order</span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Notification Bell */}
                        <NotificationBell
                            notifications={notifications}
                            onMarkAsRead={onMarkAsRead}
                            onMarkAllRead={onMarkAllRead}
                            onClearNotification={onClearNotification}
                            onClearAll={onClearAll}
                            onNotificationClick={onNotificationClick}
                        />

                        <button
                            onClick={() => setCurrentView({ type: 'TEAMS' })}
                            className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md
                                ${currentView.type === 'TEAMS'
                                    ? 'bg-indigo-500 text-white shadow-indigo-500/30 ring-2 ring-indigo-400'
                                    : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105'
                                }`}
                        >
                            <Radio size={16} /> <span className="hidden lg:inline">Teams</span>
                        </button>

                        {/* UNIFIED ADMIN CONTROL CENTER */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-2 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl transition-all"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                    <User size={16} />
                                </div>
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser?.name || 'Admin'}</p>
                                    <p className="text-[9px] font-medium text-blue-500 leading-tight">Control Center</p>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* UNIFIED DROPDOWN MENU */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-4 flex flex-col max-h-[85vh] overflow-y-auto">

                                        {/* User Info & Main Inbox Action - Side by Side Header */}
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl mb-2">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</h3>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mt-0.5">Admin</span>

                                                {/* Edit/View Profile Link placeholder if needed */}
                                                <button className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-2 flex items-center gap-1 transition-colors">
                                                    Manage Account
                                                </button>
                                            </div>

                                            {/* PROMINENT MAIL ACTION */}
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'EMAILS' }); }}
                                                className="flex flex-col items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
                                                title="Open Inbox"
                                            >
                                                <div className="relative">
                                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                        <Megaphone size={16} />
                                                    </div>
                                                    {/* Optional unread badge logic could go here */}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Inbox</span>
                                            </button>
                                        </div>

                                        {/* Admin Tools Grid */}
                                        <div className="p-2 grid grid-cols-2 gap-2">
                                            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Core Modules</div>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'ANALYTICS' }); }}
                                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors text-blue-600 dark:text-blue-400"
                                            >
                                                <BarChart3 size={20} />
                                                <span className="text-[10px] font-bold">Analytics</span>
                                            </button>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'REPORTS' }); }}
                                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors text-emerald-600 dark:text-emerald-400"
                                            >
                                                <FileText size={20} />
                                                <span className="text-[10px] font-bold">Reports</span>
                                            </button>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'USER_MANAGEMENT' }); }}
                                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-colors text-purple-600 dark:text-purple-400"
                                            >
                                                <Users size={20} />
                                                <span className="text-[10px] font-bold">Users</span>
                                            </button>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'SHIFTS' }); }}
                                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors text-amber-600 dark:text-amber-400"
                                            >
                                                <Calendar size={20} />
                                                <span className="text-[10px] font-bold">Shifts</span>
                                            </button>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />

                                        {/* Resources List */}
                                        <div className="p-2 space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Resources</div>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'INVENTORY' }); }}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                                    <Package size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Inventory</p>
                                                    <p className="text-[9px] text-slate-400">Manage stock & supplies</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'EQUIPMENT' }); }}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                    <Wrench size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Equipment</p>
                                                    <p className="text-[9px] text-slate-400">Status & Maintenance</p>
                                                </div>
                                            </button>

                                            {/* (Removed Email Link here - Moved to Top) */}

                                            <button
                                                onClick={() => { setIsProfileOpen(false); setCurrentView({ type: 'ANNOUNCEMENTS' }); }}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                    <Bell size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Announcements</p>
                                                    <p className="text-[9px] text-slate-400">Broadcast updates</p>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />

                                        {/* System Actions */}
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => { setIsProfileOpen(false); onClearData(); }}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-600 dark:text-rose-400 group"
                                            >
                                                <Trash2 size={16} className="group-hover:animate-pulse" />
                                                <span className="text-xs font-bold">Clear System Data</span>
                                            </button>

                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all text-xs font-bold mt-2"
                                            >
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
