import type { Project, ProjectProgressStage } from '../types';

export type { ProjectProgressStage };

const STAGE_LABELS: Record<ProjectProgressStage, string> = {
  lead: 'Lead / enquiry',
  proposal: 'Proposal / quotation',
  contract_active: 'Contract / mobilisation',
  execution: 'Execution',
  handover: 'Handover / commissioning',
  completed: 'Completed',
  on_hold: 'On hold',
};

export function deriveProjectProgressStage(project: Project): ProjectProgressStage {
  if (project.status === 'On Hold') return 'on_hold';
  if (project.status === 'Completed' || project.status === 'Closed') return 'completed';

  const steps = project.progressSteps ?? [];
  const completed = steps.filter((s) => s.status === 'Completed').length;
  const n = Math.max(1, steps.length);
  const ratio = completed / n;

  if (ratio >= 1) return 'handover';

  const inProgress = steps.some((s) => s.status === 'In Progress');
  if (inProgress || completed > 0) {
    if (ratio >= 0.71) return 'handover';
    if (ratio >= 0.29) return 'execution';
    return 'contract_active';
  }

  if (project.quotationId || (project.contractAmount > 0 && project.startDate)) {
    return 'contract_active';
  }

  return 'proposal';
}

/** Stored override wins; otherwise derived from steps + status. */
export function resolveProjectProgressStage(project: Project): ProjectProgressStage {
  return project.progressStage ?? deriveProjectProgressStage(project);
}

export function formatProgressStage(project: Project): string {
  return STAGE_LABELS[resolveProjectProgressStage(project)];
}
