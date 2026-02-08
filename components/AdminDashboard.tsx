import React, { useState, useEffect } from 'react';
import {
    Activity, Clock, Box, AlertTriangle, RotateCcw, Truck, XCircle, Trash2, PackagePlus, Bell, X
} from 'lucide-react';
import { WorkflowEngine } from '../services/workflow';
import { socketService } from '../services/socket';
import { Job, Message, Worker, JobStage, RejectionReason, QCStatus, JobActionType, Email } from '../types';
import { STAGES, STAGE_LABELS, STAGE_COLORS, DEFAULT_DESIGN_SUBTASKS } from '../constants';

// UI Components
import { Sidebar } from './ui/Sidebar';


// Dashboard Components
import { JobInspector } from './admin/widgets/JobInspector';
import { ProductionJourney } from './admin/widgets/ProductionJourney';
import { StatCard } from './admin/dashboard/StatCard';
import { StatsOverview } from './admin/dashboard/StatsOverview';
import { ProductionInsights } from './admin/dashboard/ProductionInsights';
// import { ChatWidget } from './admin/widgets/ChatWidget'; // Removed

// Stage Components
import { DesignStage } from './admin/stages/DesignStage';
import { ProductionStage } from './admin/stages/ProductionStage';
import { QCStage } from './admin/stages/QCStage';
import { DispatchStage } from './admin/stages/DispatchStage'; // Import DispatchStage
import { ReturnManagementView } from './admin/widgets/ReturnManagementView';
import { AllUnitsView } from './admin/views/AllUnitsView';
import { ProductsView } from './admin/views/ProductsView';
import { EmailInbox } from './admin/views/EmailInbox';

interface AdminDashboardProps {
    currentView: 'DASHBOARD' | 'LEDGER' | 'BROADCAST' | 'QUALITY' | 'RETURNS' | 'ALL_UNITS' | 'PRODUCTS' | 'EMAIL' | JobStage;
    setView: (view: string) => void;
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    workers: Worker[];
    setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
    onCall: (workerName: string, type: 'AUDIO' | 'VIDEO') => void;
    onDeleteJob?: (jobId: string) => void;
    onAddDemoJobs?: () => void;
    searchTerm?: string;
    onJobSelect?: (stage: JobStage | undefined) => void;
    onCreateJobClick?: () => void; // Added this based on the instruction's implied change
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentView, setView, jobs, setJobs, messages, setMessages, workers, setWorkers, onCall, onDeleteJob, onAddDemoJobs, searchTerm = '', onJobSelect, onCreateJobClick }) => {
    const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);

    // Notify parent when selected job changes
    React.useEffect(() => {
        if (onJobSelect) {
            onJobSelect(selectedJobDetail?.currentStage);
        }
    }, [selectedJobDetail, onJobSelect]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
    const [emails, setEmails] = useState<Email[]>([]);

    // Dispatch Specific State
    const [dispatchVehicle, setDispatchVehicle] = useState('');
    const [dispatchChallan, setDispatchChallan] = useState('');



    // Initialize designSubTasks for all jobs if missing
    useEffect(() => {
        setJobs(prev => prev.map(job => {
            if (!job.designSubTasks || job.designSubTasks.length === 0) {
                console.log('Initializing designSubTasks for job:', job.id);
                return {
                    ...job,
                    designSubTasks: DEFAULT_DESIGN_SUBTASKS.map(task => ({ ...task }))
                };
            }
            return job;
        }));
    }, []);

    // -- REAL-TIME SYNC --

    // Sound Notification
    const playNotificationSound = () => {
        try {
            // Valid "Ping" Sound (Base64)
            const audio = new Audio("data:audio/wav;base64,UklGRnQuAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVguAACAP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/");
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed (user interaction needed first):', e));
        } catch (err) {
            console.error(err);
        }
    };

    // AUTO-SYNC: Broadcast jobs whenever they change
    useEffect(() => {
        if (socketService.isConnected() && jobs.length > 0) {
            console.log(`[Admin] Jobs state changed (${jobs.length} jobs). Syncing...`);
            socketService.sendMessage('job:sync_all_from_admin', jobs);
        }
    }, [jobs]);

    // Socket Listener for Notifications
    useEffect(() => {
        // Chat Messages
        socketService.onMessage('message', (msg: Message) => {
            playNotificationSound();
            window.dispatchEvent(new CustomEvent('admin:notification', {
                detail: { message: `New Message from ${msg.sender_id}`, type: 'INFO' }
            }));
        });

        // Job Updates
        socketService.onMessage('job:update', (data: any) => {
            const { jobId, updates } = data;

            setJobs(prevJobs => prevJobs.map(j => {
                if (j.id === jobId) {
                    const cleanUpdates = { ...updates };
                    if (cleanUpdates.qcStatus) cleanUpdates.qcStatus = cleanUpdates.qcStatus as QCStatus;
                    const updated = { ...j, ...cleanUpdates, lastUpdated: Date.now() };

                    // NOTIFICATION LOGIC
                    let notifyMsg = '';
                    let shouldPlay = false;

                    if (updates.qcStatus === 'READY_FOR_QC' && j.qcStatus !== 'READY_FOR_QC') {
                        if (j.currentStage === 'DISPATCH') {
                            notifyMsg = `Job ${j.codeNo}: Dispatch Approval Requested`;
                        } else {
                            notifyMsg = `Job ${j.codeNo} is Ready for QC`;
                        }
                        shouldPlay = true;
                    } else if (updates.currentStage && updates.currentStage !== j.currentStage) {
                        notifyMsg = `Job ${j.codeNo} moved to ${updates.currentStage}`;
                        shouldPlay = true;
                    } else if (updates.isCompleted && !j.isCompleted) {
                        notifyMsg = `Job ${j.codeNo} Dispatched/Completed`;
                        shouldPlay = true;
                    } else if (updates.batches && JSON.stringify(updates.batches) !== JSON.stringify(j.batches)) {
                        // Check for return
                        const newReturn = (updates.batches as any[]).find(b => b.status === 'RETURNED');
                        const oldReturn = j.batches.find(b => b.id === newReturn?.id && b.status === 'RETURNED');
                        if (newReturn && !oldReturn) {
                            notifyMsg = `Return Received for ${j.codeNo}`;
                            shouldPlay = true;
                        }
                    }

                    if (shouldPlay) {
                        playNotificationSound();
                        window.dispatchEvent(new CustomEvent('admin:notification', {
                            detail: { message: notifyMsg, type: 'SUCCESS' }
                        }));
                    }

                    return updated;
                }
                return j;
            }));

        });

        // Email Sync
        socketService.onMessage('email:receive', (email: Email) => {
            setEmails(prev => [email, ...prev]);
            playNotificationSound();
        });

        socketService.onMessage('email:sync_all', (allEmails: Email[]) => {
            console.log(`[Admin] Synced ${allEmails.length} emails`);
            setEmails(allEmails);
        });

        socketService.onMessage('job:request_upload', (data: any) => {
            playNotificationSound();
            const event = new CustomEvent('admin:notification', {
                detail: { message: `Worker ${data.worker} requested blueprint for Job #${data.jobId}`, type: 'warning' }
            });
            window.dispatchEvent(event);
        });

    }, []);

    useEffect(() => {
        setActiveStatFilter(null);
    }, [currentView]);

    // Handle initial stage selection from parent/props
    useEffect(() => {
        if (currentView === 'DASHBOARD' && typeof onJobSelect === 'function' && jobs.length > 0) {
            // Optional: if we want to default to something else
        }
    }, []);

    const openJobDetail = (job: Job) => {
        setSelectedJobDetail(job);
        setDispatchVehicle(job.vehicleNumber || '');
        setDispatchChallan(job.challanNumber || '');
        setIsDetailModalOpen(true);
    };

    // Design Approval
    const handleApproveSpec = (id: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                console.log('Approving design spec for job:', id);
                const nextStage = WorkflowEngine.getNextStage('DESIGN', j.skippedStages);

                // Calculate time spent in DESIGN stage
                const designTimeSpent = j.currentStageStartTime
                    ? Date.now() - j.currentStageStartTime
                    : 0;

                // Initialize batches if moving to a production stage and no batches exist
                // Initialize batches if moving to a production stage
                let batches = j.batches || [];
                // Only create if we are moving to a stage that requires batches (basically any non-design stage)
                if ((!batches || batches.length === 0) && nextStage !== 'COMPLETED' && nextStage !== 'DESIGN') {
                    console.log('Initializing batches for production at stage:', nextStage);
                    batches = WorkflowEngine.createInitialBatch(j);
                    // IMPORTANT: Update batch stage to the NEXT stage (not DESIGN)
                    batches = batches.map(b => ({
                        ...b,
                        stage: nextStage as JobStage
                    }));
                }

                const updatedJob = {
                    ...j,
                    currentStage: nextStage === 'COMPLETED' ? 'DESIGN' : nextStage,
                    qcStatus: 'PENDING' as QCStatus,
                    batches: batches,
                    currentStageStartTime: Date.now(),
                    stageTimes: {
                        ...(j.stageTimes || {}),
                        DESIGN: (j.stageTimes?.DESIGN || 0) + designTimeSpent
                    },
                    lastUpdated: Date.now(),
                    history: [...(j.history || []), {
                        id: Date.now().toString(),
                        jobId: j.id,
                        action: 'QC_APPROVE' as JobActionType,
                        stage: 'DESIGN' as JobStage,
                        timestamp: Date.now(),
                        user: 'Admin',
                        details: `Design approved (${Math.floor(designTimeSpent / 60000)}min), moved to ${nextStage}`
                    }]
                };

                // EMIT SOCKET UPDATE
                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: updatedJob.currentStage,
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handleMarkComplete = (id: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updated = WorkflowEngine.completeStage(j, 'Admin Force Complete');
                socketService.sendMessage('job:update_status', { jobId: id, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleSkipStage = (id: string, reason: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updated = WorkflowEngine.skipStage(j, 'Admin Force Skip', reason);
                socketService.sendMessage('job:update_status', { jobId: id, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleQCApprove = (id: string, user: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updatedJob = WorkflowEngine.approveQC(j, user);

                // Auto-redirect to Dispatch if job moved to DISPATCH stage
                if (updatedJob.currentStage === 'DISPATCH' && !updatedJob.isCompleted) {
                    setTimeout(() => {
                        setView('DISPATCH');
                        // Optionally scroll to the job or highlight it
                    }, 500);
                }

                // EMIT SOCKET UPDATE
                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: updatedJob.currentStage,
                    updates: updatedJob
                });
                return updatedJob;
            }
            return j;
        }));
    };

    const handleQCReject = (id: string, user: string, reason: RejectionReason) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updated = WorkflowEngine.rejectQC(j, user, reason);
                socketService.sendMessage('job:update_status', { jobId: id, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleDispatchSetReady = (id: string, vehicle?: string, challan?: string, invoice?: string, dispatcherName?: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                // Build history details
                const details = [
                    vehicle ? `Vehicle: ${vehicle}` : null,
                    challan ? `Challan: ${challan}` : null,
                    invoice ? `Invoice: ${invoice}` : null,
                    dispatcherName ? `Dispatcher: ${dispatcherName}` : null
                ].filter(Boolean).join(', ');

                const historyEntry = {
                    id: Date.now().toString(),
                    jobId: j.id,
                    action: 'DISPATCH_READY' as const,
                    stage: 'DISPATCH' as const,
                    timestamp: Date.now(),
                    user: 'Admin',
                    details: details || 'Marked Ready for Dispatch (RFD)'
                };

                const updatedJob = {
                    ...j,
                    vehicleNumber: vehicle,
                    challanNumber: challan,
                    invoiceNumber: invoice,
                    dispatcherName,
                    history: [historyEntry, ...(j.history || [])]
                };

                // EMIT SOCKET UPDATE
                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: j.currentStage,
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handleDispatchComplete = (id: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                // Mark as DISPATCHED (not completed yet - awaiting invoice/payment)
                const updatedJob = {
                    ...j,
                    dispatchStatus: 'DISPATCHED' as const,
                    actualDispatchTime: Date.now(),
                    qcStatus: 'APPROVED' as QCStatus, // Clear QC status
                    lastUpdated: Date.now(),
                    history: [...(j.history || []), {
                        id: Date.now().toString(),
                        jobId: j.id,
                        action: 'DISPATCH' as const,
                        stage: 'DISPATCH' as const,
                        timestamp: Date.now(),
                        user: 'Admin',
                        details: `Job dispatched (QC Approved), awaiting invoice`
                    }]
                };

                // EMIT SOCKET UPDATE for Worker sync
                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: 'DISPATCHED',
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handleInvoiceGenerated = (id: string, invoiceNo: string, amount: number) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updatedJob = {
                    ...j,
                    dispatchStatus: 'INVOICE_PENDING' as const,
                    invoiceNumber: invoiceNo,
                    invoiceAmount: amount,
                    invoiceDate: Date.now(),
                    lastUpdated: Date.now(),
                    history: [...(j.history || []), {
                        id: Date.now().toString(),
                        jobId: j.id,
                        action: 'INVOICE_GENERATED' as const,
                        stage: 'DISPATCH' as const,
                        timestamp: Date.now(),
                        user: 'Admin',
                        details: `Invoice generated: ${invoiceNo} (Amount: ₹${amount})`
                    }]
                };

                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: 'INVOICE_PENDING',
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handlePaymentReceived = (id: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updatedJob = {
                    ...j,
                    dispatchStatus: 'PAYMENT_PENDING' as const,
                    paymentDate: Date.now(),
                    lastUpdated: Date.now(),
                    history: [...(j.history || []), {
                        id: Date.now().toString(),
                        jobId: j.id,
                        action: 'PAYMENT_RECEIVED' as const,
                        stage: 'DISPATCH' as const,
                        timestamp: Date.now(),
                        user: 'Admin',
                        details: `Payment received`
                    }]
                };

                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: 'PAYMENT_PENDING',
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handleCloseOrder = (id: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updatedJob = {
                    ...j,
                    dispatchStatus: 'CLOSED' as const,
                    closedDate: Date.now(),
                    isCompleted: true,
                    lastUpdated: Date.now(),
                    history: [...(j.history || []), {
                        id: Date.now().toString(),
                        jobId: j.id,
                        action: 'ORDER_CLOSED' as const,
                        stage: 'DISPATCH' as const,
                        timestamp: Date.now(),
                        user: 'Admin',
                        details: `Order closed and archived`
                    }]
                };

                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: 'CLOSED',
                    updates: updatedJob
                });

                return updatedJob;
            }
            return j;
        }));
    };

    const handleDispatchReject = (id: string, reason: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const updated = WorkflowEngine.rejectQC(j, 'Dispatch Admin', reason as RejectionReason);
                socketService.sendMessage('job:update_status', { jobId: id, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    // -- BATCH HANDLERS --
    const handleSplitBatch = (jobId: string, batchId: string, qty: number) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.splitBatch(j, batchId, qty, 'Admin');
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleMoveBatch = (jobId: string, batchId: string) => {
        if (batchId === 'FORCE_INIT') {
            setJobs(prev => prev.map(j => {
                if (j.id === jobId) {
                    const batches = WorkflowEngine.createInitialBatch(j);
                    // Verify we set stage correctly to current stage
                    const updatedBatches = batches.map(b => ({ ...b, stage: j.currentStage }));
                    const updatedJob = { ...j, batches: updatedBatches, lastUpdated: Date.now() };

                    socketService.sendMessage('job:update_status', {
                        jobId: jobId,
                        status: j.currentStage,
                        updates: updatedJob
                    });

                    return updatedJob;
                }
                return j;
            }));
            return;
        }
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.moveBatchToNextStage(j, batchId, 'Admin');
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleRejectBatch = (jobId: string, batchId: string, reason: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.updateBatchStatus(j, batchId, 'REJECTED', 'Admin', reason);
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleReprocessBatch = (jobId: string, batchId: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.reprocessBatch(j, batchId, 'Admin');
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };


    const handleCustomerReturn = (jobId: string, batchId: string, returnQty: number, reason: string, originStage: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const returnedJob = WorkflowEngine.handleCustomerReturn(j, batchId, returnQty, reason, originStage as any, 'Admin');

                // EMIT SOCKET UPDATE for Worker sync
                socketService.sendMessage('job:update_status', {
                    jobId,
                    status: returnedJob.currentStage,
                    updates: returnedJob
                });

                return returnedJob;
            }
            return j;
        }));
    };

    const handleReprocessReturn = (jobId: string, batchId: string, targetStage: JobStage) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.reprocessReturnBatch(j, batchId, targetStage, 'Admin');
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleScrapReturn = (jobId: string, batchId: string, reason: string) => {
        setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
                const updated = WorkflowEngine.scrapBatch(j, batchId, reason, 'Admin');
                socketService.sendMessage('job:update_status', { jobId, status: updated.currentStage, updates: updated });
                return updated;
            }
            return j;
        }));
    };

    const handleUpdateDesignSubTask = (jobId: string, taskId: import('../types').DesignSubTaskType, status: import('../types').DesignSubTaskStatus) => {
        setJobs(prev => prev.map(j => {
            if (j.id !== jobId) return j;

            const currentSubTasks = j.designSubTasks || DEFAULT_DESIGN_SUBTASKS;

            const updatedSubTasks = currentSubTasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        status,
                        ...(status === 'COMPLETED' ? { completedAt: Date.now() } : {}),
                        ...(status === 'IN_PROGRESS' && !task.startedAt ? { startedAt: Date.now() } : {})
                    }
                    : task
            );

            // EMIT SOCKET UPDATE
            socketService.sendMessage('job:update_status', {
                jobId: jobId,
                status: j.currentStage,
                updates: { designSubTasks: updatedSubTasks, lastUpdated: Date.now() }
            });

            return { ...j, designSubTasks: updatedSubTasks, lastUpdated: Date.now() };
        }));
    };

    const handleUploadBlueprint = (id: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newImages: string[] = [];
        const fileArray = Array.from(files);

        // Convert all files to Base64
        const readers = fileArray.map(file => {
            return new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result && typeof reader.result === 'string') {
                        newImages.push(reader.result);
                    }
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(() => {
            setJobs(prev => prev.map(j => {
                if (j.id === id) {
                    const updatedBlueprints = [...(j.blueprints || []), ...newImages];
                    const updatedJob = { ...j, blueprints: updatedBlueprints, lastUpdated: Date.now() };

                    // Emit socket update
                    socketService.sendMessage('job:update_status', {
                        jobId: id,
                        status: j.currentStage,
                        updates: { blueprints: updatedBlueprints, lastUpdated: Date.now() }
                    });

                    // Trigger local notification just for feedback
                    // setNotification({ message: 'Designs Uploaded', type: 'success' }); // Optional

                    return updatedJob;
                }
                return j;
            }));
        });
    };

    // Existing remove function needs to be checked or added too if missing
    const handleRemoveBlueprint = (id: string, index: number) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id && j.blueprints) {
                const updatedBlueprints = j.blueprints.filter((_, i) => i !== index);
                const updatedJob = { ...j, blueprints: updatedBlueprints, lastUpdated: Date.now() };

                socketService.sendMessage('job:update_status', {
                    jobId: id,
                    status: j.currentStage,
                    updates: { blueprints: updatedBlueprints, lastUpdated: Date.now() }
                });
                return updatedJob;
            }
            return j;
        }));
    };
    const handleDelete = () => {
        if (selectedJobDetail && onDeleteJob) {
            onDeleteJob(selectedJobDetail.id);
            setIsDetailModalOpen(false);
        }
    };

    const getJobsForView = () => {
        let filtered = jobs;

        if (STAGES.includes(currentView as JobStage)) {
            filtered = jobs.filter(j => {
                if (j.isCompleted) return false;

                // Design Stage: Rely on currentStage as batches usually don't exist yet
                if (currentView === 'DESIGN') {
                    return j.currentStage === 'DESIGN';
                }

                // Dispatch Stage: Use currentStage check
                if (currentView === 'DISPATCH') {
                    return j.currentStage === 'DISPATCH';
                }

                // Production Stages: Check if ANY batch is in this stage AND is actively being processed
                // Exclude COMPLETED batches (they show in QC) and OK_QUALITY (they moved on)
                if (j.batches && j.batches.length > 0) {
                    return j.batches.some(b =>
                        b.stage === currentView &&
                        (b.status === 'PENDING' || b.status === 'IN_PROGRESS' || b.status === 'REJECTED')
                    );
                }

                // Fallback (Legacy/No Batches)
                return j.currentStage === currentView;
            });
        } else {
            switch (currentView) {
                case 'QUALITY':
                    // Include jobs that are explicitly Ready for QC OR have batches pending QC
                    filtered = jobs.filter(j =>
                        !j.isCompleted && (
                            j.qcStatus === 'READY_FOR_QC' ||
                            (j.batches && j.batches.some(b => b.status === 'COMPLETED')) // Check for batches waiting for QC
                        )
                    );
                    break;
                case 'DASHBOARD':
                    if (!activeStatFilter || activeStatFilter === 'TOTAL') {
                        filtered = jobs;
                        // ... (rest of dashboard logic)
                    } else if (activeStatFilter === 'PENDING') {
                        filtered = jobs.filter(j => !j.isCompleted);
                    } else if (activeStatFilter === 'IN_PROD') {
                        filtered = jobs.filter(j => !j.isCompleted && j.currentStage !== 'DESIGN' && j.currentStage !== 'DISPATCH');
                    } else if (activeStatFilter === 'QUALITY_REJ') {
                        filtered = jobs.filter(j => j.qcStatus === 'REJECTED');
                    } else if (activeStatFilter === 'DELAYED') {
                        filtered = jobs.filter(j => !j.isCompleted && (Date.now() - j.startTime) > (j.maxCompletionTime * 24 * 60 * 60 * 1000));
                    } else if (activeStatFilter === 'TODAY_DISP') {
                        filtered = jobs.filter(j => j.isCompleted && new Date(j.lastUpdated).toDateString() === new Date().toDateString());
                    } else if (activeStatFilter === 'REJ_RATE') {
                        filtered = jobs.filter(j => j.qcStatus === 'REJECTED');
                    }
                    break;
                case 'LEDGER':
                    filtered = jobs.slice().sort((a, b) => b.startTime - a.startTime);
                    break;
            }
        }
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(j =>
                j.customer.toLowerCase().includes(lowSearch) ||
                j.codeNo.toLowerCase().includes(lowSearch)
            );
        }
        return filtered;
    };

    const displayedJobs = getJobsForView();

    return (
        <div className="w-full h-full px-4 md:px-8 py-6 flex flex-col gap-6 overflow-x-hidden">
            {/* NOTIFICATION POPUP */}

            {currentView === 'DASHBOARD' && (
                <div className="animate-in fade-in slide-in-from-left duration-700">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Live Production Overview</p>
                </div>
            )}
            <div className="flex-none space-y-6">
                {currentView === 'DASHBOARD' && (
                    <StatsOverview jobs={jobs} activeStatFilter={activeStatFilter} setActiveStatFilter={setActiveStatFilter} />
                )}

                {/* Admin Chat Widget Removed - Functionality moved to TeamsView */}
            </div>

            <div className="flex-1" id="main-dashboard-content">
                {currentView === 'DASHBOARD' && (
                    <>
                        <div className="flex items-center gap-4 mb-6 mt-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Orders</h2>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{displayedJobs.length} Orders</span>
                            {onAddDemoJobs && (
                                <button
                                    onClick={onAddDemoJobs}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all flex items-center gap-2"
                                >
                                    <PackagePlus size={16} /> Add Demo Jobs
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 pb-20">
                            {
                                displayedJobs.map(job => (
                                    <div key={job.id} onClick={() => openJobDetail(job)} className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl rounded-[2.5rem] p-7 border border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer group shadow-2xl hover:shadow-xl dark:shadow-2xl">
                                        <div className="flex justify-between items-center mb-8">
                                            <span className="px-4 py-2 bg-slate-100 dark:bg-[#0F172A] text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800/50 shadow-inner group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">#{job.codeNo}</span>
                                            <div className={`w-3 h-3 rounded-full blur-[2px] animate-pulse ${(STAGE_COLORS[job.currentStage] || 'bg-slate-500').split(' ')[0]}`}></div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{job.customer}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${STAGE_COLORS[job.currentStage] || 'bg-slate-500 text-white'} shadow-lg shadow-black/5 dark:shadow-black/20 border border-black/5 dark:border-white/5`}>{STAGE_LABELS[job.currentStage] || job.currentStage}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <ProductionInsights jobs={jobs} />
                    </>
                )}
                {currentView === 'DESIGN' && <DesignStage jobs={displayedJobs} onApproveSpec={handleApproveSpec} onSkip={handleSkipStage} onUploadBlueprint={handleUploadBlueprint} onRemoveBlueprint={handleRemoveBlueprint} onDeleteJob={onDeleteJob} onUpdateDesignSubTask={handleUpdateDesignSubTask} onNavigateToNewOrder={onCreateJobClick} />}
                {currentView === 'CUTTING' && <ProductionStage stage="CUTTING" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'BENDING' && <ProductionStage stage="BENDING" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'PUNCHING' && <ProductionStage stage="PUNCHING" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'FABRICATION' && <ProductionStage stage="FABRICATION" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'POWDER_COATING' && <ProductionStage stage="POWDER_COATING" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'ASSEMBLY' && <ProductionStage stage="ASSEMBLY" jobs={displayedJobs} onMarkComplete={handleMarkComplete} onSkip={handleSkipStage} onSplitBatch={handleSplitBatch} onMoveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} onReprocessBatch={handleReprocessBatch} />}
                {currentView === 'DISPATCH' && <DispatchStage jobs={jobs} onSetReady={handleDispatchSetReady} onDispatchComplete={handleDispatchComplete} onReject={handleDispatchReject} onCustomerReturn={handleCustomerReturn} onInvoiceGenerated={handleInvoiceGenerated} onPaymentReceived={handlePaymentReceived} onCloseOrder={handleCloseOrder} />}
                {currentView === 'QUALITY' && <QCStage jobs={displayedJobs} onApprove={handleQCApprove} onReject={handleQCReject} onApproveBatch={handleMoveBatch} onRejectBatch={handleRejectBatch} currentUser="Admin" />}
                {currentView === 'RETURNS' && <ReturnManagementView jobs={jobs} onReprocess={handleReprocessBatch} onScrap={handleRejectBatch} />}
                {currentView === 'ALL_UNITS' && <AllUnitsView jobs={jobs} />}
                {currentView === 'PRODUCTS' && <ProductsView />}
                {currentView === 'EMAIL' && <EmailInbox emails={emails} onRefresh={() => socketService.sendMessage('email:fetch_now', {})} />}
            </div>

            {/* Job Inspector Modal - Centered */}
            {selectedJobDetail && isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center rounded-t-3xl">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Job Inspector</h2>
                                <p className="text-sm font-bold text-slate-500">#{selectedJobDetail.codeNo}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none mb-2">{selectedJobDetail.customer}</h3>
                                <p className="text-sm font-bold text-slate-500">{selectedJobDetail.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Qty</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedJobDetail.totalQty}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Size</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedJobDetail.panelSize}</p>
                                </div>
                            </div>

                            <ProductionJourney job={selectedJobDetail} />

                            <button onClick={handleDelete} className="w-full py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black uppercase text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Trash2 size={16} /> Delete Job Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
