import type { ProjectType } from '../types';

export type ProjectDetailTabKey =
  | 'overview'
  | 'documents'
  | 'progress'
  | 'events'
  | 'financials'
  | 'materials'
  | 'att';

export const PROJECT_DETAIL_TAB_LABELS: { key: ProjectDetailTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'progress', label: 'Tasks & tickets' },
  { key: 'events', label: 'Activity' },
  { key: 'financials', label: 'Financials' },
  { key: 'materials', label: 'Materials & stock' },
  { key: 'att', label: 'Site attendance' },
];

export function visibleProjectTabs(type: ProjectType): { key: ProjectDetailTabKey; label: string }[] {
  if (type === 'Vendorship Fee') {
    return PROJECT_DETAIL_TAB_LABELS.filter((t) => t.key !== 'materials');
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

export function visibleFinSubViews(
  type: ProjectType,
  opts: { hasChannelPartner: boolean }
): { key: FinSubViewKey; label: string }[] {
  const keys: FinSubViewKey[] = ['summary', 'payments', 'expenses', 'partner', 'food'];
  if (type === 'Solo') {
    keys.splice(keys.indexOf('partner'), 1);
  }
  if (type === 'Vendorship Fee') {
    const i = keys.indexOf('partner');
    if (i >= 0) keys.splice(i, 1);
    if (opts.hasChannelPartner) keys.push('channel');
  }
  return keys.map((key) => ({ key, label: FIN_LABELS[key] }));
}
