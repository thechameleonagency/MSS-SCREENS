import type {
  Attendance,
  CompanyExpense,
  Enquiry,
  EnquiryNote,
  IncomeRecord,
  Material,
  Project,
  ProjectBlockage,
  Supplier,
  Task,
  Tool,
} from '../types';
import { STORAGE_KEYS, type StorageKey } from '../types';
import { inferExpenseTaxonomyKey } from './expenseTaxonomy';
import { inferIncomeTaxonomyKey } from './incomeTaxonomy';
import { mergeMaterialsPack62IfAbsent } from './materialsPack62';
import { getCollection, setCollection } from './storage';

const CURRENT_SCHEMA = 4;

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

function migrateProjects(list: Project[]): Project[] {
  return list.map((p) => ({
    ...p,
    blockages: migrateBlockages(p.blockages ?? []),
    operational: p.operational ?? {},
    materialsSent: p.materialsSent ?? [],
  }));
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

export function runDataMigrations(): void {
  ensureEmptyCollections();
  const v = Number(localStorage.getItem(STORAGE_KEYS.schemaVersion) ?? '0');
  if (v >= CURRENT_SCHEMA) return;

  try {
    setCollection('enquiries', migrateEnquiries(getCollection<Enquiry>('enquiries')));
    setCollection('projects', migrateProjects(getCollection<Project>('projects')));
    setCollection('attendance', migrateAttendance(getCollection<Attendance>('attendance')));
    setCollection('tasks', migrateTasks(getCollection<Task>('tasks')));
    setCollection('tools', migrateTools(getCollection<Tool>('tools')));
    setCollection('suppliers', migrateSuppliers(getCollection<Supplier>('suppliers')));
    setCollection('companyExpenses', migrateExpenses(getCollection<CompanyExpense>('companyExpenses')));
    setCollection('incomeRecords', migrateIncomeRecords(getCollection<IncomeRecord>('incomeRecords')));
    setCollection('materials', migrateMaterials(getCollection<Material>('materials')));
  } catch {
    /* ignore corrupt local data */
  }

  localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA));
}
