import type { ProjectType } from '../types';

export type ProjectDetailTabKey =
  | 'timeline'
  | 'documents'
  | 'progress'
  | 'events'
  | 'financials'
  | 'materials'
  | 'att';

export const PROJECT_DETAIL_TAB_LABELS: { key: ProjectDetailTabKey; label: string }[] = [
  { key: 'timeline', label: 'Project timeline' },
  { key: 'documents', label: 'Documents' },
  { key: 'progress', label: 'Tasks & tickets' },
  { key: 'events', label: 'Activity' },
  { key: 'financials', label: 'Financials' },
  { key: 'materials', label: 'Materials & stock' },
  { key: 'att', label: 'Site attendance' },
];

const FEE_ONLY_TAB_KEYS: ProjectDetailTabKey[] = ['timeline', 'documents'];

export function visibleProjectTabs(type: ProjectType): { key: ProjectDetailTabKey; label: string }[] {
  if (type === 'Vendorship Fee') {
    return PROJECT_DETAIL_TAB_LABELS.filter((t) => FEE_ONLY_TAB_KEYS.includes(t.key));
  }
  return PROJECT_DETAIL_TAB_LABELS;
}

export type FinSubViewKey = 'summary' | 'payments' | 'expenses' | 'partner' | 'food' | 'channel';

const FIN_LABELS: Record<FinSubViewKey, string> = {
  summary: 'Summary',
  payments: 'Client payments',
  expenses: 'Expenses',
  partner: 'Partner / agent',
  food: 'Food & misc',
  channel: 'Channel partner',
};

export function visibleFinSubViews(type: ProjectType): { key: FinSubViewKey; label: string }[] {
  if (type === 'Vendorship Fee') {
    return [];
  }
  const keys: FinSubViewKey[] = ['summary', 'payments', 'expenses', 'partner', 'food'];
  if (type === 'Solo') {
    keys.splice(keys.indexOf('partner'), 1);
  }
  return keys.map((key) => ({ key, label: FIN_LABELS[key] }));
}
