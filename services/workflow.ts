
import { Job, JobStage, StageStatus, Worker, JobHistory, RejectionReason, JobActionType, Batch, BatchStatus } from '../types';
import { JOB_STAGES } from '../constants';

export class WorkflowEngine {

    static getNextStage(currentStage: JobStage, skippedStages: JobStage[]): JobStage | 'COMPLETED' {
        const currentIndex = JOB_STAGES.indexOf(currentStage);
        if (currentIndex === -1 || currentIndex === JOB_STAGES.length - 1) return 'COMPLETED';

        let nextIndex = currentIndex + 1;
        while (nextIndex < JOB_STAGES.length) {
            const nextStage = JOB_STAGES[nextIndex];
            if (!skippedStages.includes(nextStage)) {
                return nextStage;
            }
            nextIndex++;
        }
        return 'COMPLETED';
    }

    static addHistory(job: Job, action: JobActionType, user: string, details?: string): JobHistory[] {
        const newLog: JobHistory = {
            id: Date.now().toString(),
            jobId: job.id,
            action,
            stage: job.currentStage,
            timestamp: Date.now(),
            user,
            details
        };
        return [newLog, ...(job.history || [])];
    }

    static startStage(job: Job, user: string): Job {
        const updatedStageStatus = { ...job.stageStatus };
        const existing = updatedStageStatus[job.currentStage] || { status: 'PENDING', qcStatus: 'PENDING', assignedWorkers: [] };

        updatedStageStatus[job.currentStage] = {
            ...existing,
            status: 'IN_PROGRESS',
            startTime: Date.now(),
            assignedWorkers: [...existing.assignedWorkers, user]
        } as StageStatus;

        return {
            ...job,
            stageStatus: updatedStageStatus,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'START', user, `Started ${job.currentStage}`)
        };
    }

    static pauseStage(job: Job, user: string): Job {
        return {
            ...job,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'PAUSE', user, `Paused ${job.currentStage}`)
        };
    }

    static completeStage(job: Job, user: string): Job {
        const updatedStageStatus = { ...job.stageStatus };
        const existing = updatedStageStatus[job.currentStage] || { status: 'PENDING', qcStatus: 'PENDING', assignedWorkers: [] };

        const isDispatch = job.currentStage === 'DISPATCH';

        updatedStageStatus[job.currentStage] = {
            ...existing,
            status: 'COMPLETED',
            endTime: Date.now()
        } as StageStatus;

        if (isDispatch) {
            return {
                ...job,
                isCompleted: true,
                stageStatus: updatedStageStatus,
                lastUpdated: Date.now(),
                history: this.addHistory(job, 'COMPLETE', user, `Job Dispatched & Completed`)
            };
        }

        // For other stages, proceed to QC
        return {
            ...job,
            qcStatus: 'READY_FOR_QC',
            stageStatus: updatedStageStatus,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'COMPLETE', user, `Completed work in ${job.currentStage}, awaiting QC`)
        };
    }

    static approveQC(job: Job, user: string): Job {
        const nextStage = this.getNextStage(job.currentStage, job.skippedStages);
        const updatedStageStatus = { ...job.stageStatus };
        const existing = updatedStageStatus[job.currentStage] || { status: 'PENDING', qcStatus: 'PENDING', assignedWorkers: [] };

        // Update current stage QC
        updatedStageStatus[job.currentStage] = {
            ...existing,
            qcStatus: 'APPROVED',
            qcBy: user,
            qcDate: Date.now()
        } as StageStatus;

        const isFinished = nextStage === 'COMPLETED';

        return {
            ...job,
            currentStage: isFinished ? job.currentStage : nextStage,
            qcStatus: 'PENDING', // Reset for next stage
            isCompleted: isFinished,
            stageStatus: updatedStageStatus,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'QC_APPROVE', user, isFinished ? 'Job Completed' : `Moved to ${nextStage}`)
        };
    }

    static rejectQC(job: Job, user: string, reason: RejectionReason): Job {
        const updatedStageStatus = { ...job.stageStatus };
        const existing = updatedStageStatus[job.currentStage] || { status: 'PENDING', qcStatus: 'PENDING', assignedWorkers: [] };

        updatedStageStatus[job.currentStage] = {
            ...existing,
            status: 'PENDING', // Reset to pending to restart work
            qcStatus: 'PENDING' // Reset to PENDING so worker sees it in Active tab for reprocessing
        } as StageStatus;

        return {
            ...job,
            qcStatus: 'PENDING', // IMPORTANT: Reset to PENDING so job is visible to worker for rework
            rejectionReason: reason, // Keep the reason so worker knows why it was rejected
            stageStatus: updatedStageStatus,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'QC_REJECT', user, `Rejected: ${reason} - Sent back to worker for reprocessing`)
        };
    }

    static skipStage(job: Job, user: string, reason: string): Job {
        const nextStage = this.getNextStage(job.currentStage, job.skippedStages);
        // Add to skipped list if not already there (though logic handled by getNextStage mostly, but we should record it)
        const updatedSkipped = [...job.skippedStages, job.currentStage];
        const isFinished = nextStage === 'COMPLETED';

        return {
            ...job,
            currentStage: isFinished ? job.currentStage : nextStage, // Move to next
            skippedStages: updatedSkipped,
            qcStatus: 'PENDING',
            isCompleted: isFinished,
            lastUpdated: Date.now(),
            history: this.addHistory(job, 'SKIP', user, `Skipped ${job.currentStage}: ${reason}`)
        };
    }

    // -- BATCH MANAGEMENT SYSTEM --

    static createInitialBatch(job: Job): Batch[] {
        if (job.batches && job.batches.length > 0) return job.batches;

        // If no batches exist, create default B1 with total quantity
        return [{
            id: 'B1',
            jobId: job.id,
            stage: job.currentStage,
            quantity: job.totalQty,
            status: 'PENDING',
            createdDate: Date.now(),
            updatedDate: Date.now(),
            history: []
        }];
    }

    static updateBatchStatus(job: Job, batchId: string, status: BatchStatus, user: string, reason?: string): Job {
        const updatedBatches = job.batches.map(b => {
            if (b.id === batchId) {
                const newStatus = status;
                let updates: Partial<Batch> = {
                    status: newStatus,
                    updatedDate: Date.now(),
                    rejectionReason: reason || b.rejectionReason
                };

                // Logic for Pending Timer
                if (newStatus === 'PENDING' || newStatus === 'OK_QUALITY') {
                    updates.pendingSince = Date.now();
                    // Set next Reminder to tomorrow 9 AM
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    updates.nextReminder = tomorrow.getTime();
                }

                return {
                    ...b,
                    ...updates,
                    history: [...b.history, {
                        id: Date.now().toString(),
                        jobId: job.id,
                        stage: b.stage,
                        action: status === 'COMPLETED' ? 'COMPLETE' : status === 'REJECTED' ? 'QC_REJECT' : status === 'OK_QUALITY' ? 'QC_APPROVE' : 'START',
                        timestamp: Date.now(),
                        user: user,
                        details: reason
                    } as JobHistory]
                };
            }
            return b;
        });

        return { ...job, batches: updatedBatches, lastUpdated: Date.now() };
    }

    // Reprocess a Rejected Batch
    static reprocessBatch(job: Job, batchId: string, user: string): Job {
        const batch = job.batches.find(b => b.id === batchId);
        if (!batch) return job;

        // Reset to PENDING (In Progress)
        // Increment reprocess count
        const updatedBatches = job.batches.map(b => {
            if (b.id === batchId) {
                return {
                    ...b,
                    status: 'PENDING',
                    reprocessCount: (b.reprocessCount || 0) + 1,
                    updatedDate: Date.now(),
                    pendingSince: Date.now(),
                    history: [...b.history, {
                        id: Date.now().toString(),
                        jobId: job.id,
                        stage: b.stage,
                        action: 'START',
                        timestamp: Date.now(),
                        user: user,
                        details: 'Reprocessing Initiated'
                    } as JobHistory]
                } as Batch;
            }
            return b;
        });

        return { ...job, batches: updatedBatches, lastUpdated: Date.now() };
    }

    // Split a batch into Done and Pending
    static splitBatch(job: Job, batchId: string, doneQty: number, user: string): Job {
        const batch = job.batches.find(b => b.id === batchId);
        if (!batch) return job;

        if (doneQty >= batch.quantity) {
            // Fully done, just mark status
            return this.updateBatchStatus(job, batchId, 'COMPLETED', user, 'Full Batch Completed');
        }

        const pendingQty = batch.quantity - doneQty;

        // B1 (Done)
        const completedBatch: Batch = {
            ...batch,
            quantity: doneQty,
            status: 'COMPLETED',
            updatedDate: Date.now(),
            history: [...batch.history, {
                id: Date.now().toString(),
                jobId: job.id,
                stage: batch.stage,
                action: 'COMPLETE',
                timestamp: Date.now(),
                user: user,
                details: `Split Completion: ${doneQty} units`
            } as JobHistory]
        };

        // B2 (Pending) - Need to find next ID
        const currentIds = job.batches.map(b => {
            const match = b.id.match(/^B(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });
        const maxId = Math.max(...currentIds, 0);
        const nextIdNum = maxId + 1;
        const newBatch: Batch = {
            id: `B${nextIdNum}`,
            jobId: job.id,
            stage: batch.stage,
            quantity: pendingQty,
            status: 'PENDING',
            createdDate: Date.now(),
            updatedDate: Date.now(),
            history: [{
                id: Date.now().toString(),
                jobId: job.id,
                stage: batch.stage,
                action: 'CREATE',
                timestamp: Date.now(),
                user: user,
                details: `Created from split of ${batch.id}`
            } as JobHistory]
        };

        const otherBatches = job.batches.filter(b => b.id !== batchId);

        return {
            ...job,
            batches: [...otherBatches, completedBatch, newBatch].sort((a, b) => a.id.localeCompare(b.id)),
            lastUpdated: Date.now()
        };
    }

    // Mark batch work as complete (Ready for QC)
    static completeBatchWork(job: Job, batchId: string, user: string): Job {
        return this.updateBatchStatus(job, batchId, 'COMPLETED', user, 'Work Completed - Awaiting QC');
    }

    static moveBatchToNextStage(job: Job, batchId: string, user: string): Job {
        const batch = job.batches.find(b => b.id === batchId);
        if (!batch) return job;

        const nextStage = this.getNextStage(batch.stage, job.skippedStages);
        if (nextStage === 'COMPLETED') {
            // Batch Finished
            return this.updateBatchStatus(job, batchId, 'COMPLETED', user, 'Process Finished');
        }

        const updatedBatches = job.batches.map(b => {
            if (b.id === batchId) {
                return {
                    ...b,
                    stage: nextStage, // Move stage
                    status: 'PENDING', // Reset status in new stage
                    pendingSince: Date.now(),
                    updatedDate: Date.now(),
                    history: [...b.history, {
                        id: Date.now().toString(),
                        jobId: job.id,
                        stage: batch.stage,
                        action: 'QC_APPROVE', // Changed from COMPLETE to QC_APPROVE since this IS the approval step
                        timestamp: Date.now(),
                        user: user,
                        details: `QC Approved: Moved from ${batch.stage} to ${nextStage}`
                    } as JobHistory]
                } as Batch;
            }
            return b;
        });

        // Update job's currentStage to the most advanced batch stage
        const allStages = updatedBatches.map(b => b.stage);
        const mostAdvancedStage = JOB_STAGES.reduce((latest, stage) => {
            return allStages.includes(stage) ? stage : latest;
        }, job.currentStage);

        return {
            ...job,
            batches: updatedBatches,
            currentStage: mostAdvancedStage,
            lastUpdated: Date.now()
        };
    }
    // -- RETURN & SCRAP MANAGEMENT --

    static handleCustomerReturn(job: Job, batchId: string, returnQty: number, reason: string, originStage: JobStage, user: string): Job {
        const batch = job.batches.find(b => b.id === batchId);
        if (!batch) return job;

        // If returned quantity equals full batch, just mark it returned
        if (returnQty >= batch.quantity) {
            const updatedBatches = job.batches.map(b => {
                if (b.id === batchId) {
                    return {
                        ...b,
                        status: 'RETURNED',
                        returnOriginStage: originStage,
                        returnDate: Date.now(),
                        rejectionReason: reason,
                        updatedDate: Date.now(),
                        history: [...b.history, {
                            id: Date.now().toString(),
                            jobId: job.id,
                            stage: 'DISPATCH',
                            action: 'QC_REJECT',
                            timestamp: Date.now(),
                            user: user,
                            details: `Full Customer Return: ${reason}`
                        }]
                    } as Batch;
                }
                return b;
            });
            return { ...job, batches: updatedBatches, lastUpdated: Date.now() };
        }

        const remainingQty = batch.quantity - returnQty;

        // Keep original batch as COMPLETED / DISPATCHED (Remaining Good Qty)
        const updatedGoodBatch: Batch = {
            ...batch,
            quantity: remainingQty,
            updatedDate: Date.now(),
            history: [...batch.history, {
                id: Date.now().toString(),
                jobId: job.id,
                stage: batch.stage,
                action: 'COMPLETE',
                timestamp: Date.now(),
                user: user,
                details: `Partial Customer Return: ${returnQty} units returned`
            }]
        };

        // Create New Return Batch
        const currentIds = job.batches.map(b => {
            const match = b.id.match(/^B(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });
        const maxId = Math.max(...currentIds, 0);
        const nextIdNum = maxId + 1;
        const returnBatchId = `B${nextIdNum}-R`;

        const returnBatch: Batch = {
            id: returnBatchId,
            jobId: job.id,
            stage: 'DISPATCH', // Initially at dispatch, waiting for routing
            quantity: returnQty,
            status: 'RETURNED',
            returnOriginStage: originStage,
            returnDate: Date.now(),
            rejectionReason: reason,
            createdDate: Date.now(),
            updatedDate: Date.now(),
            reprocessCount: 0,
            history: [{
                id: Date.now().toString(),
                jobId: job.id,
                stage: 'DISPATCH',
                action: 'QC_REJECT',
                timestamp: Date.now(),
                user: user,
                details: `Customer Return: ${reason} (Origin: ${originStage})`
            }]
        };

        const otherBatches = job.batches.filter(b => b.id !== batchId);

        return {
            ...job,
            batches: [...otherBatches, updatedGoodBatch, returnBatch].sort((a, b) => a.id.localeCompare(b.id)),
            lastUpdated: Date.now()
        };
    }

    static reprocessReturnBatch(job: Job, batchId: string, targetStage: JobStage, user: string): Job {
        const updatedBatches = job.batches.map(b => {
            if (b.id === batchId) {
                return {
                    ...b,
                    stage: targetStage,
                    status: 'PENDING',
                    returnOriginStage: undefined,
                    reprocessCount: (b.reprocessCount || 0) + 1,
                    updatedDate: Date.now(),
                    pendingSince: Date.now(),
                    history: [...b.history, {
                        id: Date.now().toString(),
                        jobId: job.id,
                        stage: targetStage,
                        action: 'START',
                        timestamp: Date.now(),
                        user: user,
                        details: `Reprocessing Started at ${targetStage}`
                    }]
                } as Batch;
            }
            return b;
        });
        return { ...job, batches: updatedBatches, lastUpdated: Date.now() };
    }

    static scrapBatch(job: Job, batchId: string, reason: string, user: string): Job {
        const updatedBatches = job.batches.map(b => {
            if (b.id === batchId) {
                return {
                    ...b,
                    status: 'SCRAPPED',
                    isScrapped: true,
                    scrapReason: reason,
                    updatedDate: Date.now(),
                    history: [...b.history, {
                        id: Date.now().toString(),
                        jobId: job.id,
                        stage: b.stage,
                        action: 'QC_REJECT',
                        timestamp: Date.now(),
                        user: user,
                        details: `SCRAPPED: ${reason}`
                    }]
                } as Batch;
            }
            return b;
        });
        return { ...job, batches: updatedBatches, lastUpdated: Date.now() };
    }
}
