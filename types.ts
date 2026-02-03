
export type JobStage =
  | 'DESIGN'
  | 'CUTTING'
  | 'BENDING'
  | 'PUNCHING'
  | 'FABRICATION'
  | 'POWDER_COATING'
  | 'ASSEMBLY'
  | 'DISPATCH';

export type DesignSubTaskType = '3D_MODEL' | 'DXF' | 'BENDING' | 'FABRICATION' | 'BOM';
export type DesignSubTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface DesignSubTask {
  id: DesignSubTaskType;
  label: string;
  status: DesignSubTaskStatus;
  completedAt?: number;
  startedAt?: number;
}

export type QCStatus = 'PENDING' | 'READY_FOR_QC' | 'APPROVED' | 'REJECTED';

export type UserRole = 'ADMIN' | 'WORKER' | 'QC';

export type JobActionType = 'START' | 'PAUSE' | 'COMPLETE' | 'QC_APPROVE' | 'QC_REJECT' | 'SKIP' | 'CREATE' | 'DISPATCH_READY' | 'DISPATCH';

export type RejectionReason =
  | 'Dimension issue'
  | 'Color mismatch'
  | 'Finish issue'
  | 'Scratch / Scrap'
  | 'Double-time required'
  | 'Material Defect'
  | 'Assembly Error'
  | 'Damaged Delivery'
  | 'Damaged Delivery'
  | 'Customer Rejection';

export type BatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'MOVED' | 'OK_QUALITY' | 'RETURNED' | 'SCRAPPED';

export interface Batch {
  id: string; // B1, B2, etc.
  jobId: string;
  stage: JobStage;
  quantity: number;
  status: BatchStatus;

  // Advanced Tracking
  createdDate: number;
  updatedDate: number;
  pendingSince?: number; // Timestamp when it became PENDING
  nextReminder?: number; // Timestamp for next reminder

  // Rejection & Quality
  rejectionReason?: string;
  reprocessCount?: number;

  // Customer Return & Scrap Tracking
  returnOriginStage?: JobStage; // Stage where the issue originated (for returns)
  returnDate?: number;
  isScrapped?: boolean;
  scrapReason?: string;

  // History for this specific batch
  history: JobHistory[];
}

export interface JobHistory {
  id: string;
  jobId: string;
  stage: JobStage;
  action: JobActionType;
  timestamp: number;
  user: string; // Worker Name or ID
  details?: string; // Reason for rejection or skip
}

export interface StageStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  qcStatus: QCStatus;
  startTime?: number;
  endTime?: number;
  assignedWorkers: string[];
  qcBy?: string;
  qcDate?: number;
  qcNotes?: string;
}

export interface Job {
  id: string;
  srNo: number;
  customer: string;
  codeNo: string;
  description: string;
  panelSize: string;
  totalQty: number;
  batchQty: number; // New field

  batches: Batch[]; // New Batch Tracking

  goodQty: number;
  rejectQty: number;
  pendingQty: number;
  dispatchedQty: number;

  // Design & Specs
  color: string;
  ralCode: string;
  blueprints?: string[]; // Updated to support multiple files

  // Design Sub-Task Tracking
  designSubTasks?: DesignSubTask[];

  // Manufacturing Batches

  // Status Tracking
  currentStage: JobStage;
  qcStatus: QCStatus; // Global QC status for current stage
  skippedStages: JobStage[];
  rejectionReason?: RejectionReason;

  // Stage Specific Tracking
  stageStatus: Partial<Record<JobStage, StageStatus>>; // Track status per stage

  // Logs
  history: JobHistory[]; // Audit trail

  // Dates & Times
  dispatchDate: string;
  dispatchTime: string;
  session: 'Morning' | 'Evening' | 'Night';
  maxCompletionTime: number; // 12 days default
  expectedWorkingTime: number; // 8-10 days
  followUpDate: string;
  startTime: number;
  lastUpdated: number;
  currentStageStartTime?: number; // When current stage started (for elapsed time calculation)
  stageTimes?: { [key in JobStage]?: number }; // Time spent in each stage (in milliseconds)
  isCompleted: boolean;

  // Workers
  assignedWorkers: string[]; // Global assignment or current stage assignment
  remark: string;
  priority?: JobPriority; // Job priority level

  // Dispatch specific fields
  vehicleNumber?: string;
  challanNumber?: string;
  invoiceNumber?: string;
  dispatcherName?: string;
  dispatchMessage?: string;
  actualDispatchTime?: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string | UserRole; // Updated to include UserRole
  joinedDate: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string; // 'ADMIN' or Worker ID/Name
  content: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'video';
  attachment_url?: string;
  timestamp: number;
  is_read?: boolean;
}

// ============================================
// NEW TYPES FOR FEATURE EXPANSION
// ============================================

// Priority System
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Notification System
export type NotificationType = 'QC_ALERT' | 'JOB_UPDATE' | 'MENTION' | 'ANNOUNCEMENT' | 'STAGE_COMPLETE' | 'PRIORITY_CHANGE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  jobId?: string;
  workerId?: string;
  link?: string;
}

// Announcement System
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: number;
  priority: AnnouncementPriority;
  expiresAt?: number;
  isActive: boolean;
}

// Dashboard Analytics
export interface DashboardMetrics {
  totalJobs: number;
  completedToday: number;
  inProgress: number;
  pendingQC: number;
  avgCycleTime: number; // in hours
  throughputRate: number; // jobs per day
  stageBottleneck?: JobStage;
  efficiency: number; // percentage
}

export interface StageMetrics {
  stage: JobStage;
  jobCount: number;
  avgTime: number; // in hours
  pendingCount: number;
  completedToday: number;
}

// Worker Performance
export interface WorkerStats {
  workerId: string;
  workerName: string;
  jobsCompleted: number;
  jobsCompletedToday: number;
  avgCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  currentStage?: JobStage;
  isActive: boolean;
  lastActivity?: number;
}

// Shift Management
export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT';

export interface Shift {
  id: string;
  workerId: string;
  workerName: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  station?: string;
  stage?: JobStage;
  isConfirmed: boolean;
}

// Inventory System
export type StockType = 'NEW' | 'OLD' | 'EXPIRED';
export type InventoryCategory = 'Raw Material' | 'Paint' | 'Wiring' | 'Hardware' | 'Packaging' | 'Tools' | 'Other';

export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ORDERED';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  location: string;
  supplier?: string;
  lastUpdated: number;
  status: InventoryStatus;
  stockType: StockType;
  expiryDate?: number;
  deliveryDueDate?: number;
  batchNumber?: string;
  unitCost?: number;
}

// Equipment Management
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DOWN' | 'IDLE';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  station: string;
  stage: JobStage;
  status: EquipmentStatus;
  lastMaintenance: number;
  nextMaintenance: number;
  hoursUsed: number;
  notes?: string;
}

// Report Types
export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface ProductionReport {
  id: string;
  type: ReportType;
  startDate: string;
  endDate: string;
  generatedAt: number;
  generatedBy: string;
  metrics: DashboardMetrics;
  stageMetrics: StageMetrics[];
  topWorkers: WorkerStats[];
  completedJobs: number;
  pendingJobs: number;
}

// Extended Worker with additional fields
export interface ExtendedWorker extends Worker {
  email?: string;
  phone?: string;
  skills?: JobStage[];
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  shift?: ShiftType;
  avatar?: string;
  performanceScore?: number;
}
