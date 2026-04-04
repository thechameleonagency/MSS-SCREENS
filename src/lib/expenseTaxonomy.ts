/** Data-driven taxonomy for UnifiedExpenseModal (MMS feature doc §18). Expand freely. */

export type ExpensePillarId = 'COMPANY' | 'EMPLOYEE' | 'OFFICE' | 'SITE' | 'OWNER' | 'PARTNER';

export type ExpenseFlag =
  | 'requiresMonth'
  | 'requiresProject'
  | 'requiresEmployee'
  | 'requiresPartner'
  | 'requiresVendor'
  | 'requiresQuantity'
  | 'allowMultiEmployee'
  | 'allowReimbursement';

export interface ExpenseSubDef {
  id: string;
  label: string;
  /** Override default `pillarSlug:catId:subId` for CoA mapping */
  taxonomyKey?: string;
  flags?: Partial<Record<ExpenseFlag, boolean>>;
}

export interface ExpenseCategoryDef {
  id: string;
  label: string;
  subs: ExpenseSubDef[];
}

export interface ExpensePillarDef {
  id: ExpensePillarId;
  label: string;
  allowedPayers: ('Company' | 'Employee' | 'Owner' | 'Partner' | 'Split')[];
  categories: ExpenseCategoryDef[];
}

export const EXPENSE_TAXONOMY: ExpensePillarDef[] = [
  {
    id: 'COMPANY',
    label: 'Company',
    allowedPayers: ['Company', 'Owner'],
    categories: [
      {
        id: 'vehicle',
        label: 'Company Vehicle',
        subs: [
          { id: 'emi', label: 'Vehicle EMI', flags: { requiresMonth: true } },
          { id: 'fuel', label: 'Fuel' },
          { id: 'maint', label: 'Maintenance' },
          { id: 'insurance', label: 'Insurance', flags: { requiresMonth: true } },
        ],
      },
      {
        id: 'marketing',
        label: 'Marketing',
        subs: [
          { id: 'ig', label: 'Instagram Ads' },
          { id: 'google', label: 'Google Ads' },
          { id: 'agency', label: 'Agency Subscription', flags: { requiresMonth: true } },
        ],
      },
      {
        id: 'physical_marketing',
        label: 'Physical marketing',
        subs: [
          { id: 'banners', label: 'Banners / hoardings' },
          { id: 'pamphlets', label: 'Pamphlets / flyers' },
          { id: 'events', label: 'Events / stalls' },
        ],
      },
      {
        id: 'tools',
        label: 'Tools & equipment',
        subs: [
          { id: 'purchase', label: 'Tool purchase' },
          { id: 'maint', label: 'Tool maintenance / repair' },
          { id: 'rent', label: 'Tool rental' },
        ],
      },
      {
        id: 'other',
        label: 'Other',
        subs: [{ id: 'misc', label: 'Miscellaneous' }],
      },
      { id: 'ca', label: 'CA Payments', subs: [{ id: 'ca', label: 'CA Fee' }] },
      { id: 'tax', label: 'Tax Payments', subs: [{ id: 'gst', label: 'GST' }, { id: 'it', label: 'Income Tax' }] },
      { id: 'software', label: 'Subscriptions / Software', subs: [{ id: 'sw', label: 'Software' }, { id: 'cloud', label: 'Cloud / Hosting' }] },
    ],
  },
  {
    id: 'EMPLOYEE',
    label: 'Employee',
    allowedPayers: ['Company', 'Employee', 'Owner', 'Split'],
    categories: [
      {
        id: 'salary',
        label: 'Salary',
        subs: [
          { id: 'monthly', label: 'Monthly Salary', flags: { requiresEmployee: true, requiresMonth: true } },
          { id: 'ot', label: 'Overtime', flags: { requiresEmployee: true } },
        ],
      },
      { id: 'food', label: 'Food', subs: [{ id: 'site', label: 'Site Food', flags: { requiresEmployee: true, allowReimbursement: true } }] },
      {
        id: 'travel',
        label: 'Travel & conveyance',
        subs: [
          { id: 'local', label: 'Local travel', flags: { requiresEmployee: true, allowReimbursement: true } },
          { id: 'outstation', label: 'Outstation', flags: { requiresEmployee: true, allowReimbursement: true } },
        ],
      },
      {
        id: 'uniform',
        label: 'Uniform / safety',
        subs: [{ id: 'ppe', label: 'PPE / uniform', flags: { requiresEmployee: true, allowReimbursement: true } }],
      },
      { id: 'advance', label: 'Advance', subs: [{ id: 'sal_adv', label: 'Salary Advance', flags: { requiresEmployee: true } }] },
    ],
  },
  {
    id: 'OFFICE',
    label: 'Office',
    allowedPayers: ['Company', 'Owner'],
    categories: [
      { id: 'rent', label: 'Rent', subs: [{ id: 'mrent', label: 'Monthly Rent', flags: { requiresMonth: true } }] },
      { id: 'electric', label: 'Electricity', subs: [{ id: 'ebill', label: 'Electricity Bill', flags: { requiresMonth: true } }] },
      { id: 'internet', label: 'Internet', subs: [{ id: 'inet', label: 'Internet Bill', flags: { requiresMonth: true } }] },
    ],
  },
  {
    id: 'SITE',
    label: 'Site / Project',
    allowedPayers: ['Company', 'Employee', 'Owner', 'Partner', 'Split'],
    categories: [
      { id: 'commission', label: 'Commission', subs: [{ id: 'agent', label: 'Agent', flags: { requiresProject: true } }] },
      { id: 'transport', label: 'Material Transport', subs: [{ id: 'cv', label: 'Company Vehicle', flags: { requiresProject: true } }] },
      {
        id: 'material',
        label: 'Materials on site',
        subs: [
          { id: 'purchase', label: 'Material purchase', flags: { requiresProject: true } },
          { id: 'return_freight', label: 'Return / reverse freight', flags: { requiresProject: true } },
          { id: 'damage', label: 'Damage / wastage', flags: { requiresProject: true } },
        ],
      },
      { id: 'outsource', label: 'Outsource Work', subs: [{ id: 'jcb', label: 'JCB', flags: { requiresProject: true, requiresQuantity: true } }] },
      { id: 'labour', label: 'Labour for Shift to Roof', subs: [{ id: 'lr', label: 'Labour', flags: { requiresProject: true } }] },
      {
        id: 'general',
        label: 'General site expense',
        subs: [{ id: 'misc', label: 'Miscellaneous', flags: { requiresProject: true } }],
      },
    ],
  },
  {
    id: 'OWNER',
    label: 'Owner / MK',
    allowedPayers: ['Owner'],
    categories: [
      { id: 'withdraw', label: 'Withdrawals', subs: [{ id: 'w', label: 'Withdrawal' }] },
      { id: 'personal', label: 'Personal Expenses', subs: [{ id: 'food', label: 'Food' }, { id: 'trans', label: 'Transport' }] },
    ],
  },
  {
    id: 'PARTNER',
    label: 'Partner',
    allowedPayers: ['Company', 'Partner'],
    categories: [
      { id: 'pwith', label: 'Partner Withdrawal', subs: [{ id: 'cl', label: 'Company Level' }, { id: 'sl', label: 'Site Level', flags: { requiresProject: true, requiresPartner: true } }] },
      { id: 'pprofit', label: 'Partner Profit Payment', subs: [{ id: 'pp', label: 'Profit Payment', flags: { requiresPartner: true } }] },
    ],
  },
];

export function findSub(pillarId: string, catId: string, subId: string): ExpenseSubDef | undefined {
  const p = EXPENSE_TAXONOMY.find((x) => x.id === pillarId);
  const c = p?.categories.find((x) => x.id === catId);
  return c?.subs.find((s) => s.id === subId);
}

const EXPENSE_PILLAR_SLUG: Record<ExpensePillarId, string> = {
  COMPANY: 'company',
  EMPLOYEE: 'employee',
  OFFICE: 'office',
  SITE: 'site',
  OWNER: 'owner',
  PARTNER: 'partner',
};

/** Stable key for CoA / reporting: `company:vehicle:emi` */
export function expenseTaxonomyKey(pillarId: ExpensePillarId, catId: string, subId: string): string {
  const sub = findSub(pillarId, catId, subId);
  if (sub?.taxonomyKey) return sub.taxonomyKey;
  const slug = EXPENSE_PILLAR_SLUG[pillarId];
  return `${slug}:${catId}:${subId}`;
}

/** Backfill key from stored pillar + subCategory when cat/sub ids match taxonomy. */
export function inferExpenseTaxonomyKey(e: {
  taxonomyKey?: string;
  pillar?: string;
  subCategory?: string;
}): string | undefined {
  if (e.taxonomyKey) return e.taxonomyKey;
  if (!e.pillar || !e.subCategory) return undefined;
  const pillar = EXPENSE_TAXONOMY.find((p) => p.id === e.pillar);
  if (!pillar) return undefined;
  for (const c of pillar.categories) {
    const sub = c.subs.find((s) => s.id === e.subCategory);
    if (sub) return expenseTaxonomyKey(pillar.id, c.id, sub.id);
  }
  return undefined;
}
