import type {
  ApprovalRequest,
  Attendance,
  CompanyExpense,
  Enquiry,
  EnquiryNote,
  IncomeRecord,
  MasterData,
  Material,
  Project,
  ProjectBlockage,
  SiteMaterialLedgerRow,
  Supplier,
  Task,
  Tool,
  User,
} from '../types';
import { STORAGE_KEYS, type StorageKey } from '../types';
import { inferExpenseTaxonomyKey } from './expenseTaxonomy';
import { inferIncomeTaxonomyKey } from './incomeTaxonomy';
import { mergeMaterialsPack62IfAbsent } from './materialsPack62';
import { generateId, getCollection, setCollection } from './storage';

const CURRENT_SCHEMA = 7;

function defaultJobTitleFromRole(role: User['role']): string | undefined {
  switch (role) {
    case 'Installation Team':
      return 'Installer';
    case 'Salesperson':
      return 'Sales Executive';
    case 'Management':
      return 'Manager';
    case 'CEO':
      return 'Chief Executive';
    case 'Admin':
    case 'Super Admin':
      return 'Administrator';
    default:
      return undefined;
  }
}

function ensureEnquiryPipelineMasterRows(): void {
  const list = getCollection<MasterData>('masterData');
  if (list.some((m) => m.type === 'EnquiryPipelineStage')) return;
  const additions: MasterData[] = [
    { id: 'md_enqpipe_lead', type: 'EnquiryPipelineStage', value: 'Lead captured', order: 0 },
    { id: 'md_enqpipe_qual', type: 'EnquiryPipelineStage', value: 'Qualified', order: 1 },
    { id: 'md_enqpipe_prop', type: 'EnquiryPipelineStage', value: 'Proposal shared', order: 2 },
    { id: 'md_enqpipe_neg', type: 'EnquiryPipelineStage', value: 'Negotiation', order: 3 },
  ];
  setCollection('masterData', [...list, ...additions]);
}

function ensureEmptyCollections() {
  const keys: StorageKey[] = [
    'incomeRecords',
    'approvalRequests',
    'auditLogs',
    'companyHolidays',
    'toolMovements',
    'materialReturns',
    'vouchers',
    'ledgerLines',
    'introAgentEconomics',
  ];
  for (const k of keys) {
    if (!localStorage.getItem(STORAGE_KEYS[k])) {
      setCollection(k, []);
    }
  }
}

function migrateEnquiries(list: Enquiry[]): Enquiry[] {
  return list.map((e) => {
    const src = e.source as Enquiry['source'] & { type?: string };
    const type = src.type;
    const safeType =
      type === 'Agent' ||
      type === 'Direct' ||
      type === 'Referral' ||
      type === 'Phone' ||
      type === 'WalkIn' ||
      type === 'Online' ||
      type === 'Social'
        ? type
        : 'Direct';
    const notes: EnquiryNote[] = (e.notes ?? []).map((n) => {
      const raw = n as EnquiryNote & { text?: string };
      return {
        ...raw,
        note: raw.note ?? raw.text,
        by: raw.by ?? raw.updatedBy,
        date: raw.date ?? raw.timestamp?.slice(0, 10),
      };
    });
    return {
      ...e,
      source: { ...src, type: safeType },
      notes,
    };
  });
}

function migrateBlockages(blockages: ProjectBlockage[]): ProjectBlockage[] {
  return blockages.map((b) => ({
    ...b,
    title: b.title ?? b.description.slice(0, 80),
    status: b.status ?? (b.resolved ? 'resolved' : 'active'),
  }));
}

function migrateProjectSiteLedgerFromMaterialsSent(list: Project[]): Project[] {
  return list.map((p) => {
    if ((p.siteMaterialLedger?.length ?? 0) > 0) return p;
    const byKey = new Map<string, SiteMaterialLedgerRow>();
    for (const line of p.materialsSent ?? []) {
      const sid = line.siteId ?? '';
      const key = `${sid}::${line.materialId}`;
      const existing = byKey.get(key);
      const q = line.quantity;
      if (existing) {
        byKey.set(key, {
          ...existing,
          issuedQty: existing.issuedQty + q,
          lastUpdatedAt: line.date,
        });
      } else {
        byKey.set(key, {
          id: generateId('sml'),
          siteId: sid,
          materialId: line.materialId,
          openingQty: 0,
          issuedQty: q,
          returnedQty: 0,
          scrapAtSiteQty: 0,
          consumedQty: 0,
          lastUpdatedAt: line.date,
        });
      }
    }
    return { ...p, siteMaterialLedger: [...byKey.values()] };
  });
}

function migrateProjects(list: Project[]): Project[] {
  const base = list.map((p) => ({
    ...p,
    blockages: migrateBlockages(p.blockages ?? []),
    operational: p.operational ?? {},
    materialsSent: p.materialsSent ?? [],
    loanInstallments: p.loanInstallments ?? [],
    coPartnerIds: Array.isArray(p.coPartnerIds) ? p.coPartnerIds : [],
  }));
  return migrateProjectSiteLedgerFromMaterialsSent(base);
}

function migrateAttendance(list: Attendance[]): Attendance[] {
  return list.map((a) => ({
    ...a,
    siteIds: a.siteIds ?? (a.siteId ? [a.siteId] : undefined),
  }));
}

function migrateTasks(list: Task[]): Task[] {
  return list.map((t) => ({
    ...t,
    taskType: t.taskType ?? 'work',
  }));
}

function migrateTools(list: Tool[]): Tool[] {
  return list.map((t) => ({
    ...t,
    lifecycleStatus:
      t.lifecycleStatus ?? (t.assignedTo || t.siteId ? 'In Use' : 'Available'),
  }));
}

function migrateSuppliers(list: Supplier[]): Supplier[] {
  return list.map((s) => ({
    ...s,
    category: s.category ?? 'Other',
  }));
}

function migrateExpenses(list: CompanyExpense[]): CompanyExpense[] {
  return list.map((x) => {
    const base: CompanyExpense = {
      ...x,
      pillar: x.pillar ?? 'SITE',
      payerType: x.payerType ?? x.paidBy,
    };
    const taxonomyKey = inferExpenseTaxonomyKey(base);
    return taxonomyKey ? { ...base, taxonomyKey } : base;
  });
}

function migrateIncomeRecords(list: IncomeRecord[]): IncomeRecord[] {
  return list.map((x) => {
    const taxonomyKey = inferIncomeTaxonomyKey(x);
    return taxonomyKey ? { ...x, taxonomyKey } : x;
  });
}

function migrateMaterials(list: Material[]): Material[] {
  return mergeMaterialsPack62IfAbsent(list, new Date().toISOString());
}

/** BR §12.1 enquiry statuses */
function migrateEnquiryStatuses(list: Enquiry[]): Enquiry[] {
  return list.map((e) => {
    const raw = e.status as string;
    let status: Enquiry['status'] = e.status;
    if (raw === 'In Progress') status = 'Contacted';
    else if (raw === 'Closed') status = 'Lost';
    return { ...e, status };
  });
}

/** BR §7.6 tool condition labels */
function migrateToolConditions(list: Tool[]): Tool[] {
  const map: Record<string, Tool['condition']> = {
    Good: 'Good',
    Fair: 'Minor Damage',
    Poor: 'Major Damage',
    Damaged: 'Major Damage',
    'Under Repair': 'Not Working',
  };
  return list.map((t) => {
    const raw = t.condition as string;
    const condition =
      (map[raw] as Tool['condition'] | undefined) ??
      (['Good', 'Minor Damage', 'Major Damage', 'Not Working'] as const).includes(raw as Tool['condition'])
        ? (raw as Tool['condition'])
        : 'Good';
    let lifecycleStatus = t.lifecycleStatus ?? (t.assignedTo || t.siteId ? ('In Use' as const) : ('Available' as const));
    if (condition === 'Not Working') lifecycleStatus = 'Under Repair';
    return { ...t, condition, lifecycleStatus };
  });
}

function migrateUsersForBr(list: User[]): User[] {
  return list.map((u) => ({
    ...u,
    userType: u.userType ?? 'admin',
    jobTitle: u.jobTitle ?? defaultJobTitleFromRole(u.role),
  }));
}

function migrateApprovalRequestsMeta(list: ApprovalRequest[]): ApprovalRequest[] {
  return list.map((a) => ({
    ...a,
    ticketNo: a.ticketNo ?? `TKT-${a.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase() || '00000000'}`,
  }));
}

export function runDataMigrations(): void {
  ensureEmptyCollections();
  ensureEnquiryPipelineMasterRows();
  const v = Number(localStorage.getItem(STORAGE_KEYS.schemaVersion) ?? '0');
  if (v >= CURRENT_SCHEMA) return;

  try {
    setCollection('enquiries', migrateEnquiryStatuses(migrateEnquiries(getCollection<Enquiry>('enquiries'))));
    setCollection('projects', migrateProjects(getCollection<Project>('projects')));
    setCollection('attendance', migrateAttendance(getCollection<Attendance>('attendance')));
    setCollection('tasks', migrateTasks(getCollection<Task>('tasks')));
    setCollection('tools', migrateToolConditions(migrateTools(getCollection<Tool>('tools'))));
    setCollection('suppliers', migrateSuppliers(getCollection<Supplier>('suppliers')));
    setCollection('companyExpenses', migrateExpenses(getCollection<CompanyExpense>('companyExpenses')));
    setCollection('incomeRecords', migrateIncomeRecords(getCollection<IncomeRecord>('incomeRecords')));
    setCollection('materials', migrateMaterials(getCollection<Material>('materials')));
    setCollection('users', migrateUsersForBr(getCollection<User>('users')));
    setCollection('approvalRequests', migrateApprovalRequestsMeta(getCollection<ApprovalRequest>('approvalRequests')));
  } catch {
    /* ignore corrupt local data */
  }

  localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA));
}
