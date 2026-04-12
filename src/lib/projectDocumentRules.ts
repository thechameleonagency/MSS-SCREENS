import type { Project, SolarProjectKind } from '../types';
import { inferSolarKind } from './solarProjectKind';

export type ProjectDocChecklistItem = { id: string; label: string; tier: 'full' | 'minimal' };

const FULL_EPC_DOCS: ProjectDocChecklistItem[] = [
  { id: 'proposal', label: 'Proposal', tier: 'full' },
  { id: 'agreement', label: 'Agreement', tier: 'full' },
  { id: 'feasibility', label: 'Feasibility report', tier: 'full' },
  { id: 'meter_app', label: 'Meter application', tier: 'full' },
  { id: 'wcr', label: 'Work completion report', tier: 'full' },
];

const MINIMAL_DOCS: ProjectDocChecklistItem[] = [
  { id: 'wcr_min', label: 'Work completion / handover', tier: 'minimal' },
  { id: 'basic_site', label: 'Basic site photos', tier: 'minimal' },
];

/**
 * Required documentation tiers by kind (spec §5). Ownership of files is a workflow concern.
 */
export function requiredProjectDocuments(project: Project): ProjectDocChecklistItem[] {
  const k = inferSolarKind(project);
  if (k === 'INC') return MINIMAL_DOCS;
  if (k === 'SOLO_EPC' || k === 'PARTNER_EPC' || k === 'FIXED_EPC' || k === 'VENDOR_NETWORK') {
    return FULL_EPC_DOCS;
  }
  return FULL_EPC_DOCS;
}

export function documentationTier(kind: SolarProjectKind): 'full' | 'minimal' {
  return kind === 'INC' ? 'minimal' : 'full';
}
