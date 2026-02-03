
import React, { useState, useEffect, Suspense } from 'react';
import { socketService } from './services/socket';
import { Job, Worker, JobStage, RejectionReason, Notification, Announcement, InventoryItem, Equipment, Shift } from './types';
import { STAGE_LABELS, DEFAULT_DESIGN_SUBTASKS } from './constants';
import {
    Loader2, Database, LogOut, LayoutDashboard, Plus, Search,
    PenTool, Scissors, Hammer, Wrench, ClipboardCheck, Megaphone,
    Users, Activity, Bell, Radio, Truck, X, MessageCircle
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCall } from './contexts/CallContext';

// Legacy / Existing Components
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

// New MES Components
import { JobCreationList } from './components/mes/JobCreationList';
import { WorkflowEngine } from './services/workflow';
import { Header } from './components/admin/layout/Header';
import { StageNavbar } from './components/admin/layout/StageNavbar';
import { TeamsView } from './components/admin/TeamsView';

// New Feature Views
import { AnalyticsView } from './components/admin/views/AnalyticsView';
import { ReportsView } from './components/admin/views/ReportsView';
import { UserManagement } from './components/admin/views/UserManagement';
import { InventoryTracker } from './components/admin/views/InventoryTracker';
import { EquipmentStatusView } from './components/admin/views/EquipmentStatusView';
import { ShiftScheduler } from './components/admin/views/ShiftScheduler';
import { AnnouncementBoard } from './components/admin/widgets/AnnouncementBoard';

// Notification System
import { ToastProvider, useToast, IncomingCallOverlay, ActiveCallOverlay, toast } from './components/notifications/ToastSystem';
import { notificationSound } from './services/notificationSound';

// -- MOCK DATA --
const INITIAL_WORKERS: Worker[] = [
    { id: 'W0', name: 'Admin User', role: 'ADMIN', joinedDate: Date.now() },
    { id: 'W1', name: 'Amit Kumar', role: 'WORKER', joinedDate: Date.now() },
    { id: 'W2', name: 'Sandeep Singh', role: 'WORKER', joinedDate: Date.now() },
    { id: 'W3', name: 'Rahul Sharma', role: 'WORKER', joinedDate: Date.now() },
    { id: 'W4', name: 'Vijay Vishwakarma', role: 'WORKER', joinedDate: Date.now() },
    { id: 'W5', name: 'Ravi Prajapati', role: 'QC', joinedDate: Date.now() },
    { id: 'W6', name: 'Manoj Yadav', role: 'WORKER', joinedDate: Date.now() }
];

// Demo data removed for production persistence
const DEMO_JOBS: Job[] = [];

type ViewState =
    | { type: 'LOGIN' }
    | { type: 'ADMIN_DASHBOARD'; subView?: string }
    | { type: 'ADMIN_CREATE_JOB' }
    | { type: 'TEAMS' }
    | { type: 'ALERTS' }
    | { type: 'ANALYTICS' }
    | { type: 'REPORTS' }
    | { type: 'USER_MANAGEMENT' }
    | { type: 'INVENTORY' }
    | { type: 'EQUIPMENT' }
    | { type: 'SHIFTS' }
    | { type: 'ANNOUNCEMENTS' };

const App: React.FC = () => {
    // -- GLOBAL STATE --
    const [jobs, setJobs] = useState<Job[]>([]);
    const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
    // Initialize directly with Admin user
    const [currentUser, setCurrentUser] = useState<Worker | null>(INITIAL_WORKERS[0]);
    // Start directly on Dashboard
    const [currentView, setCurrentView] = useState<ViewState>({ type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' });
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJobStage, setSelectedJobStage] = useState<JobStage | undefined>(undefined);
    const [showFloatingChat, setShowFloatingChat] = useState(false);

    // Global Call Context
    const { incomingCall, answerCall, rejectCall, isInCall, isCalling, callType, endCall, localStream, remoteStream } = useCall();

    // New Feature States
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Feature Handlers
    const handleAddAnnouncement = (announcement: Omit<Announcement, 'id' | 'timestamp'>) => {
        const newAnnouncement: Announcement = {
            ...announcement,
            id: `ANN-${Date.now()}`,
            timestamp: Date.now()
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);
    };

    const handleDeleteAnnouncement = (id: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const handleAddWorker = (worker: any) => {
        const newWorker: Worker = {
            ...worker,
            id: `W${Date.now()}`,
            joinedDate: Date.now()
        };
        setWorkers(prev => [...prev, newWorker]);
    };

    const handleUpdateWorker = (id: string, updates: Partial<Worker>) => {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    const handleDeleteWorker = (id: string) => {
        setWorkers(prev => prev.filter(w => w.id !== id));
    };

    const handleAddInventoryItem = (item: any) => {
        const status = item.quantity === 0 ? 'OUT_OF_STOCK'
            : item.quantity <= item.minStock ? 'LOW_STOCK'
                : 'IN_STOCK';
        const newItem: InventoryItem = {
            ...item,
            id: `INV-${Date.now()}`,
            status
        };
        setInventory(prev => [...prev, newItem]);
    };

    const handleUpdateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
        setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const handleDeleteInventoryItem = (id: string) => {
        setInventory(prev => prev.filter(i => i.id !== id));
    };

    const handleAddEquipment = (eq: any) => {
        const newEquipment: Equipment = {
            ...eq,
            id: `EQ-${Date.now()}`
        };
        setEquipment(prev => [...prev, newEquipment]);
    };

    const handleUpdateEquipment = (id: string, updates: Partial<Equipment>) => {
        setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const handleDeleteEquipment = (id: string) => {
        setEquipment(prev => prev.filter(e => e.id !== id));
    };

    const handleAddShift = (shift: any) => {
        const newShift: Shift = {
            ...shift,
            id: `SH-${Date.now()}`
        };
        setShifts(prev => [...prev, newShift]);
    };

    const handleUpdateShift = (id: string, updates: Partial<Shift>) => {
        setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleDeleteShift = (id: string) => {
        setShifts(prev => prev.filter(s => s.id !== id));
    };

    // Notification Handlers
    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClearAllNotifications = () => {
        setNotifications([]);
    };

    const handleNotificationClick = (notification: Notification) => {
        // Navigate based on notification type
        if (notification.type === 'QC_ALERT') {
            setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'QUALITY' });
        } else if (notification.type === 'ANNOUNCEMENT') {
            setCurrentView({ type: 'ANNOUNCEMENTS' });
        } else if (notification.type === 'JOB_UPDATE' && notification.jobId) {
            // Find job stage
            const job = jobs.find(j => j.id === notification.jobId);
            if (job) {
                setSearchTerm(job.codeNo);
                setSelectedJobStage(job.currentStage);
                setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' }); // Or specific stage view
            }
        }
    };

    // -- INIT --
    useEffect(() => {
        const savedJobs = localStorage.getItem('hrs_jobs_v5');
        if (savedJobs) {
            setJobs(JSON.parse(savedJobs));
        } else {
            // Start with empty state for Production
            setJobs([]);
        }
        document.documentElement.classList.add('dark'); // Force Dark Mode for now

        // Connect to Real-Time Server
        socketService.connect();

        // AUTO-SYNC: Send all current jobs to server to sync workers
        socketService.onConnect(() => {
            const currentJobs = localStorage.getItem('hrs_jobs_v5');
            if (currentJobs) {
                console.log("Connected! Auto-Syncing all jobs to server...");
                socketService.sendMessage('job:sync_all_from_admin', JSON.parse(currentJobs));
            }
        });

        return () => socketService.disconnect();
    }, []);

    useEffect(() => {
        if (jobs.length > 0) {
            // Batch Migration: Ensure all jobs have at least one batch
            const batchedJobs = jobs.map(j => {
                if (!j.batches || j.batches.length === 0) {
                    return { ...j, batches: WorkflowEngine.createInitialBatch(j) };
                }
                return j;
            });

            if (JSON.stringify(batchedJobs) !== JSON.stringify(jobs)) {
                setJobs(batchedJobs);
                return;
            }

            localStorage.setItem('hrs_jobs_v5', JSON.stringify(jobs));
        }
    }, [jobs]);

    // -- REAL-TIME LISTENER FOR JOB UPDATES --
    useEffect(() => {
        const handleJobUpdate = (data: { jobId: string, updates: Partial<Job> }) => {
            console.log("Admin Received Job Update:", data);
            setJobs(prevJobs => prevJobs.map(job =>
                job.id === data.jobId ? { ...job, ...data.updates } : job
            ));

            // Optional: Show notification since Admin probably wasn't the one who updated it
            // if (document.hidden) ...
        };

        const handleNewJob = (newJob: Job) => {
            console.log("Admin Received New Job:", newJob);
            setJobs(prev => {
                if (prev.some(j => j.id === newJob.id)) return prev;
                return [newJob, ...prev];
            });
        };

        const handleGlobalMessage = (msg: any) => {
            // Only show toast if we are NOT in the Teams View or if the chat is hidden (floating)
            // We can check currentView
            if (currentView.type !== 'TEAMS' && !showFloatingChat) {
                if (msg.receiver_id === 'ADMIN') {
                    // Play sound
                    notificationSound.play('message');
                    // Show Toast
                    toast.message(`New message from ${msg.sender_id}`, msg.content);
                }
            }
        };

        socketService.onMessage('job:update', handleJobUpdate);
        socketService.onMessage('job:new', handleNewJob);
        socketService.onMessage('message:receive', handleGlobalMessage);

        return () => {
            socketService.off('job:update', handleJobUpdate);
            socketService.off('job:new', handleNewJob);
            socketService.off('message:receive', handleGlobalMessage);
        };
    }, [currentView, showFloatingChat]);

    const handleAddDemoJobs = () => {
        // Feature Disabled for Production
        toast.error("Demo mode is disabled");
    };

    // -- AUTH HANDLERS (REMOVED) --
    const handleLogout = () => {
        // For now, logout just refreshes the dashboard state or could confirm exit
        // Since we removed login, we'll just reset view
        setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' });
    };

    // -- WORKFLOW HANDLERS --
    const updateJob = (updatedJob: Job) => {
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        socketService.sendMessage('job:update_status', {
            jobId: updatedJob.id,
            status: updatedJob.currentStage,
            updates: updatedJob
        });
    };

    const handleCreateJob = (newJob: Job, startNow: boolean) => {
        setJobs(prev => [newJob, ...prev]);
        socketService.sendMessage('job:create', newJob);

        if (startNow) {
            const startedJob = WorkflowEngine.startStage(newJob, currentUser?.name || 'Admin');
            updateJob(startedJob);
        }

        // Auto-redirect to Design Stage and filter by this job
        setSearchTerm(newJob.codeNo); // Filter by the new job name
        setSelectedJobStage('DESIGN');
        setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'DESIGN' });
    };

    const handleClearAllData = () => {
        if (confirm("⚠️ DANGER ZONE ⚠️\n\nThis will PERMANENTLY DELETE ALL JOBS and production data.\nAll connected workers' apps will also be reset.\n\nAre you sure you want to proceed?")) {
            setJobs([]);
            localStorage.removeItem('hrs_jobs_v5');
            socketService.sendMessage('job:sync_all_from_admin', []); // Sync empty array to workers

            // Trigger Toast instead of Alert
            setTimeout(() => {
                toast.success("System has been reset successfully");
            }, 500); // Small delay to ensure Dashboard processes it

            setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' });
        }
    };

    // -- RENDERERS --

    return (
        <ErrorBoundary>
            <ToastProvider>
                <div className="min-h-screen bg-slate-50 dark:bg-[#0B1121] text-slate-900 dark:text-white flex flex-col relative transition-colors duration-500">
                    {/* GLOBAL HEADER */}
                    <Header
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onClearData={handleClearAllData}
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllRead={handleMarkAllRead}
                        onClearNotification={handleClearNotification}
                        onClearAll={handleClearAllNotifications}
                        onNotificationClick={handleNotificationClick}
                    />

                    <IncomingCallOverlay
                        isVisible={!!incomingCall}
                        callerName={incomingCall?.callerName || 'Worker'}
                        callType={incomingCall?.type || 'AUDIO'}
                        onAccept={answerCall}
                        onDecline={rejectCall}
                    />

                    <ActiveCallOverlay
                        isOpen={isInCall || isCalling}
                        isInCall={isInCall}
                        callerName={incomingCall?.callerName || 'Worker'}
                        callType={incomingCall?.type || callType}
                        onEndCall={endCall}
                        localStream={localStream}
                        remoteStream={remoteStream}
                    />

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 relative bg-slate-50 dark:bg-[#0B1121] transition-colors duration-500">
                        <StageNavbar currentView={currentView} setCurrentView={setCurrentView} selectedJobStage={selectedJobStage} />

                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-800 dark:text-white" size={48} /></div>}>

                            {currentView.type === 'ADMIN_DASHBOARD' && (
                                <AdminDashboard
                                    currentView={(currentView as any).subView || 'DASHBOARD'}
                                    setView={(view: any) => setCurrentView(prev => ({ ...prev, subView: view }))}
                                    jobs={jobs}
                                    setJobs={setJobs} // Pass setJobs if AdminDashboard supports it
                                    messages={[]}
                                    setMessages={() => { }}
                                    workers={workers}
                                    setWorkers={setWorkers}
                                    onCall={() => { }}
                                    onDeleteJob={(id: string) => setJobs(prev => prev.filter(j => j.id !== id))}
                                    onAddDemoJobs={handleAddDemoJobs}
                                    searchTerm={searchTerm}
                                    onJobSelect={(stage) => setSelectedJobStage(stage)}
                                    onCreateJobClick={() => setCurrentView({ type: 'ADMIN_CREATE_JOB' })}
                                />
                            )}


                            {currentView.type === 'ADMIN_CREATE_JOB' && (
                                <JobCreationList
                                    workers={workers}
                                    onSaveJob={handleCreateJob}
                                    onBack={() => setCurrentView({ type: 'ADMIN_DASHBOARD', subView: 'DASHBOARD' })}
                                />
                            )}

                            {currentView.type === 'TEAMS' && (
                                <TeamsView workers={workers} currentUser={currentUser} />
                            )}

                            {currentView.type === 'ALERTS' && (
                                <div className="p-12 text-center space-y-6">
                                    <div className="w-24 h-24 bg-rose-100 dark:bg-rose-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-rose-600 dark:text-rose-500">
                                        <Bell size={48} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">System Alerts</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Real-time production and quality notifications</p>
                                </div>
                            )}

                            {currentView.type === 'ANALYTICS' && (
                                <AnalyticsView jobs={jobs} workers={workers} />
                            )}

                            {currentView.type === 'REPORTS' && (
                                <ReportsView jobs={jobs} workers={workers} />
                            )}

                            {currentView.type === 'USER_MANAGEMENT' && (
                                <UserManagement
                                    workers={workers}
                                    onAddWorker={handleAddWorker}
                                    onUpdateWorker={handleUpdateWorker}
                                    onDeleteWorker={handleDeleteWorker}
                                />
                            )}

                            {currentView.type === 'INVENTORY' && (
                                <InventoryTracker
                                    inventory={inventory}
                                    onAddItem={handleAddInventoryItem}
                                    onUpdateItem={handleUpdateInventoryItem}
                                    onDeleteItem={handleDeleteInventoryItem}
                                />
                            )}

                            {currentView.type === 'EQUIPMENT' && (
                                <EquipmentStatusView
                                    equipment={equipment}
                                    onAddEquipment={handleAddEquipment}
                                    onUpdateEquipment={handleUpdateEquipment}
                                    onDeleteEquipment={handleDeleteEquipment}
                                />
                            )}

                            {currentView.type === 'SHIFTS' && (
                                <ShiftScheduler
                                    workers={workers}
                                    shifts={shifts}
                                    onAddShift={handleAddShift}
                                    onUpdateShift={handleUpdateShift}
                                    onDeleteShift={handleDeleteShift}
                                />
                            )}

                            {currentView.type === 'ANNOUNCEMENTS' && (
                                <div className="p-6">
                                    <AnnouncementBoard
                                        announcements={announcements}
                                        onAddAnnouncement={handleAddAnnouncement}
                                        onDeleteAnnouncement={handleDeleteAnnouncement}
                                        currentUserName={currentUser?.name || 'Admin'}
                                        currentUserId={currentUser?.id || 'W0'}
                                        isAdmin={true}
                                    />
                                </div>
                            )}
                        </Suspense>
                    </main>

                    {/* FLOATING CHAT BUTTON - Visible on smaller screens */}
                    {currentView.type !== 'TEAMS' && (
                        <button
                            onClick={() => setShowFloatingChat(true)}
                            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 lg:hidden"
                            title="Team Chat"
                        >
                            <MessageCircle size={24} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
                        </button>
                    )}

                    {/* FLOATING CHAT MODAL */}
                    {showFloatingChat && (
                        <div className="fixed inset-0 z-[100] lg:hidden bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 pt-safe flex items-center justify-between z-20 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Team Chat</h2>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time communication</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFloatingChat(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                                >
                                    <X size={20} className="text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Teams View Content */}
                            <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                                <TeamsView workers={workers} currentUser={currentUser} />
                            </div>
                        </div>
                    )}
                </div>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;