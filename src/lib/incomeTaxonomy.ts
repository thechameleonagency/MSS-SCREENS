/** Data-driven taxonomy for UnifiedIncomeModal (MMS feature doc §19). */

export type IncomePillarId = 'PROJECT' | 'LOANS' | 'PARTNER' | 'EMPLOYEE' | 'COMPANY';

export type IncomeFlag =
  | 'requiresProject'
  | 'requiresPartner'
  | 'requiresEmployee'
  | 'requiresPersonName'
  | 'requiresContactNumber'
  | 'requiresExpectedReturnDate'
  | 'requiresBankName'
  | 'requiresLoanAccount'
  | 'requiresInterestRate'
  | 'requiresTenure'
  | 'requiresLoanSelect'
  | 'isOutgoing';

export interface IncomeSubDef {
  id: string;
  label: string;
  taxonomyKey?: string;
  flags?: Partial<Record<IncomeFlag, boolean>>;
}

export interface IncomeCategoryDef {
  id: string;
  label: string;
  subs: IncomeSubDef[];
}

export interface IncomePillarDef {
  id: IncomePillarId;
  label: string;
  categories: IncomeCategoryDef[];
}

export const INCOME_TAXONOMY: IncomePillarDef[] = [
  {
    id: 'PROJECT',
    label: 'Project income',
    categories: [
      {
        id: 'client',
        label: 'Client payment',
        subs: [
          { id: 'cash', label: 'Cash payment', flags: { requiresProject: true } },
          { id: 'adv', label: 'Client advance', flags: { requiresProject: true } },
          { id: 'bank', label: 'Bank instalment', flags: { requiresProject: true } },
          { id: 'subsidy', label: 'Subsidy / rebate (govt.)', flags: { requiresProject: true } },
        ],
      },
      {
        id: 'other',
        label: 'Other project income',
        subs: [{ id: 'misc', label: 'Miscellaneous', flags: { requiresProject: true } }],
      },
    ],
  },
  {
    id: 'LOANS',
    label: 'Loans & udhar',
    categories: [
      {
        id: 'bank',
        label: 'Bank loan (formal)',
        subs: [
          {
            id: 'recv',
            label: 'Loan received',
            flags: {
              requiresBankName: true,
              requiresLoanAccount: true,
              requiresInterestRate: true,
              requiresTenure: true,
            },
          },
          { id: 'emi_ref', label: 'EMI payment reference', flags: { requiresLoanSelect: true } },
        ],
      },
      {
        id: 'udhar',
        label: 'Udhar / borrowing',
        subs: [
          {
            id: 'urec',
            label: 'Udhar received',
            flags: { requiresPersonName: true, requiresContactNumber: true, requiresExpectedReturnDate: true },
          },
          { id: 'ugiven', label: 'Udhar given (outgoing)', flags: { isOutgoing: true, requiresPersonName: true } },
          {
            id: 'ff',
            label: 'Friend / family loan',
            flags: { requiresPersonName: true, requiresContactNumber: true },
          },
        ],
      },
    ],
  },
  {
    id: 'PARTNER',
    label: 'Partner income',
    categories: [
      {
        id: 'invest',
        label: 'Partner investment',
        subs: [
          { id: 'co', label: 'Investment to company', flags: { requiresPartner: true } },
          { id: 'site', label: 'Site investment', flags: { requiresPartner: true, requiresProject: true } },
        ],
      },
      {
        id: 'profit',
        label: 'Partner share / drawings (reverse)',
        subs: [{ id: 'return', label: 'Capital / profit return', flags: { requiresPartner: true, isOutgoing: true } }],
      },
    ],
  },
  {
    id: 'EMPLOYEE',
    label: 'Employee payments',
    categories: [
      {
        id: 'paid',
        label: 'Employee paid for company',
        subs: [{ id: 'exp', label: 'Employee paid expense', flags: { requiresEmployee: true } }],
      },
    ],
  },
  {
    id: 'COMPANY',
    label: 'Company income',
    categories: [
      { id: 'owner', label: 'Owner investment', subs: [{ id: 'cap', label: 'Capital investment' }] },
      { id: 'other', label: 'Other company income', subs: [{ id: 'misc', label: 'Miscellaneous' }] },
      {
        id: 'interest',
        label: 'Interest income',
        subs: [{ id: 'fd', label: 'FD / savings interest' }],
      },
    ],
  },
];

const INCOME_PILLAR_SLUG: Record<IncomePillarId, string> = {
  PROJECT: 'project',
  LOANS: 'loans',
  PARTNER: 'partner',
  EMPLOYEE: 'employee',
  COMPANY: 'company',
};

export function findIncomeSub(pillarId: string, catId: string, subId: string): IncomeSubDef | undefined {
  const p = INCOME_TAXONOMY.find((x) => x.id === pillarId);
  const c = p?.categories.find((x) => x.id === catId);
  return c?.subs.find((s) => s.id === subId);
}

export function incomeTaxonomyKey(pillarId: IncomePillarId, catId: string, subId: string): string {
  const sub = findIncomeSub(pillarId, catId, subId);
  if (sub?.taxonomyKey) return sub.taxonomyKey;
  const slug = INCOME_PILLAR_SLUG[pillarId];
  return `${slug}:${catId}:${subId}`;
}

export function inferIncomeTaxonomyKey(e: {
  taxonomyKey?: string;
  pillar?: string;
  subCategory?: string;
}): string | undefined {
  if (e.taxonomyKey) return e.taxonomyKey;
  if (!e.pillar || !e.subCategory) return undefined;
  const pillar = INCOME_TAXONOMY.find((p) => p.id === e.pillar);
  if (!pillar) return undefined;
  for (const c of pillar.categories) {
    const sub = c.subs.find((s) => s.id === e.subCategory);
    if (sub) return incomeTaxonomyKey(pillar.id, c.id, sub.id);
  }
  return undefined;
}
