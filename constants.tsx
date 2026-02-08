import React from 'react';
import { JobStage, RejectionReason, DesignSubTask } from './types';

// Design Sub-Task Configuration
export const DESIGN_SUBTASK_LABELS = {
  '3D_MODEL': '3D Model',
  'DXF': 'DXF',
  'BENDING': 'Bending',
  'FABRICATION': 'Fabrication',
  'BOM': 'BOM'
} as const;

export const DEFAULT_DESIGN_SUBTASKS: DesignSubTask[] = [
  { id: '3D_MODEL', label: '3D Model', status: 'PENDING' },
  { id: 'DXF', label: 'DXF', status: 'PENDING' },
  { id: 'BENDING', label: 'Bending', status: 'PENDING' },
  { id: 'FABRICATION', label: 'Fabrication', status: 'PENDING' },
  { id: 'BOM', label: 'BOM', status: 'PENDING' }
];

// Stage Configuration
export const STAGES: JobStage[] = [
  'DESIGN',
  'CUTTING',
  'PUNCHING',
  'BENDING',
  'FABRICATION',
  'POWDER_COATING',
  'ASSEMBLY',
  'DISPATCH'
];

export const JOB_STAGES = STAGES;

export const REJECTION_REASONS: RejectionReason[] = [
  'Dimension issue',
  'Color mismatch',
  'Finish issue',
  'Scratch / Scrap',
  'Double-time required',
  'Material Defect',
  'Assembly Error',
  'Damaged Delivery',
  'Customer Rejection'
];

export const STAGE_LABELS: Record<JobStage, string> = {
  'DESIGN': 'Design',
  'CUTTING': 'Cutting',
  'BENDING': 'Bending',
  'PUNCHING': 'Punching',
  'FABRICATION': 'Fabrication',
  'POWDER_COATING': 'Powder Coating',
  'ASSEMBLY': 'Assembly',
  'DISPATCH': 'Dispatch'
};

export const STAGE_COLORS: Record<JobStage, string> = {
  'DESIGN': 'bg-orange-500 text-white',
  'CUTTING': 'bg-red-500 text-white',
  'BENDING': 'bg-indigo-500 text-white',
  'PUNCHING': 'bg-violet-600 text-white',
  'FABRICATION': 'bg-blue-600 text-white',
  'POWDER_COATING': 'bg-amber-500 text-white',
  'ASSEMBLY': 'bg-cyan-500 text-white',
  'DISPATCH': 'bg-emerald-600 text-white',
};
