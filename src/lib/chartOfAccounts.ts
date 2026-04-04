/** Hierarchical Chart of Accounts seed (MMS finance spec alignment). Not double-entry yet — UX + mapping hooks. */

export type CoaNature = 'Asset' | 'Liability' | 'Income' | 'Expense';

export interface CoaAccount {
  id: string;
  parentId: string | null;
  nature: CoaNature;
  name: string;
  code?: string;
  /** Shown in UI to explain typical sources (expenses, invoices, etc.) */
  sourceHint?: string;
}

/** Flat list; render as tree via parentId. */
export const CHART_OF_ACCOUNTS: CoaAccount[] = [
  { id: 'coa_root_asset', parentId: null, nature: 'Asset', name: 'Assets', code: '1', sourceHint: 'Balance sheet' },
  { id: 'coa_root_liab', parentId: null, nature: 'Liability', name: 'Liabilities', code: '2', sourceHint: 'Balance sheet' },
  { id: 'coa_root_inc', parentId: null, nature: 'Income', name: 'Income', code: '3', sourceHint: 'P&L' },
  { id: 'coa_root_exp', parentId: null, nature: 'Expense', name: 'Expenses', code: '4', sourceHint: 'P&L' },

  { id: 'coa_ca', parentId: 'coa_root_asset', nature: 'Asset', name: 'Current assets', code: '11' },
  { id: 'coa_cash', parentId: 'coa_ca', nature: 'Asset', name: 'Cash in hand', code: '1101', sourceHint: 'Customer payments (cash)' },
  { id: 'coa_bank', parentId: 'coa_ca', nature: 'Asset', name: 'Bank accounts', code: '1102', sourceHint: 'Customer payments (bank/UPI)' },
  { id: 'coa_debtors', parentId: 'coa_ca', nature: 'Asset', name: 'Trade receivables', code: '1103', sourceHint: 'Unpaid invoices' },
  { id: 'coa_gst_input', parentId: 'coa_ca', nature: 'Asset', name: 'GST input (ITC)', code: '1104', sourceHint: 'Purchase bills' },

  { id: 'coa_cl', parentId: 'coa_root_liab', nature: 'Liability', name: 'Current liabilities', code: '21' },
  { id: 'coa_creditors', parentId: 'coa_cl', nature: 'Liability', name: 'Trade payables', code: '2101', sourceHint: 'Vendor bills' },
  { id: 'coa_gst_output', parentId: 'coa_cl', nature: 'Liability', name: 'GST output payable', code: '2102', sourceHint: 'Tax on sales' },
  { id: 'coa_loans_st', parentId: 'coa_cl', nature: 'Liability', name: 'Short-term borrowings', code: '2103', sourceHint: 'Loans / udhar received' },
  { id: 'coa_capital', parentId: 'coa_cl', nature: 'Liability', name: 'Capital & partner accounts', code: '2104', sourceHint: 'Partner investment, drawings' },

  { id: 'coa_rev', parentId: 'coa_root_inc', nature: 'Income', name: 'Revenue from operations', code: '31' },
  { id: 'coa_sales', parentId: 'coa_rev', nature: 'Income', name: 'Solar sales & services', code: '3101', sourceHint: 'Invoices, client payments' },
  { id: 'coa_subsidy', parentId: 'coa_rev', nature: 'Income', name: 'Subsidy & rebates', code: '3102', sourceHint: 'Project subsidy income' },
  { id: 'coa_inc_other', parentId: 'coa_rev', nature: 'Income', name: 'Other operating income', code: '3103' },
  { id: 'coa_inc_nonop', parentId: 'coa_root_inc', nature: 'Income', name: 'Non-operating income', code: '32' },
  { id: 'coa_interest_inc', parentId: 'coa_inc_nonop', nature: 'Income', name: 'Interest income', code: '3201', sourceHint: 'FD / savings' },

  { id: 'coa_site_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Site / project expenses', code: '41', sourceHint: 'Site pillar' },
  { id: 'coa_exp_site_comm', parentId: 'coa_site_exp', nature: 'Expense', name: 'Site commission', code: '4101' },
  { id: 'coa_exp_site_trans', parentId: 'coa_site_exp', nature: 'Expense', name: 'Material transport', code: '4102' },
  { id: 'coa_exp_site_mat', parentId: 'coa_site_exp', nature: 'Expense', name: 'Materials on site', code: '4103' },
  { id: 'coa_exp_site_out', parentId: 'coa_site_exp', nature: 'Expense', name: 'Outsource (JCB etc.)', code: '4104' },
  { id: 'coa_exp_site_lab', parentId: 'coa_site_exp', nature: 'Expense', name: 'Site labour', code: '4105' },
  { id: 'coa_exp_site_gen', parentId: 'coa_site_exp', nature: 'Expense', name: 'General site', code: '4106' },

  { id: 'coa_co_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Company expenses', code: '42' },
  { id: 'coa_exp_vehicle', parentId: 'coa_co_exp', nature: 'Expense', name: 'Company vehicle', code: '4201' },
  { id: 'coa_exp_marketing', parentId: 'coa_co_exp', nature: 'Expense', name: 'Marketing & ads', code: '4202' },
  { id: 'coa_exp_physical_mkt', parentId: 'coa_co_exp', nature: 'Expense', name: 'Physical marketing', code: '4203' },
  { id: 'coa_exp_tools', parentId: 'coa_co_exp', nature: 'Expense', name: 'Tools & equipment', code: '4204' },
  { id: 'coa_exp_ca_tax', parentId: 'coa_co_exp', nature: 'Expense', name: 'CA, tax & compliance', code: '4205' },
  { id: 'coa_exp_software', parentId: 'coa_co_exp', nature: 'Expense', name: 'Software & subscriptions', code: '4206' },
  { id: 'coa_exp_co_misc', parentId: 'coa_co_exp', nature: 'Expense', name: 'Company other', code: '4207' },

  { id: 'coa_emp_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Employee expenses', code: '43' },
  { id: 'coa_exp_salary', parentId: 'coa_emp_exp', nature: 'Expense', name: 'Salary & wages', code: '4301' },
  { id: 'coa_exp_emp_benefit', parentId: 'coa_emp_exp', nature: 'Expense', name: 'Staff food, travel, uniform', code: '4302' },
  { id: 'coa_exp_adv_emp', parentId: 'coa_emp_exp', nature: 'Expense', name: 'Advances to staff', code: '4303' },

  { id: 'coa_office_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Office expenses', code: '44' },
  { id: 'coa_exp_rent', parentId: 'coa_office_exp', nature: 'Expense', name: 'Rent', code: '4401' },
  { id: 'coa_exp_util', parentId: 'coa_office_exp', nature: 'Expense', name: 'Electricity & utilities', code: '4402' },
  { id: 'coa_exp_internet', parentId: 'coa_office_exp', nature: 'Expense', name: 'Internet', code: '4403' },

  { id: 'coa_owner_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Owner / drawings', code: '45' },
  { id: 'coa_exp_drawings', parentId: 'coa_owner_exp', nature: 'Expense', name: 'Owner withdrawals', code: '4501' },
  { id: 'coa_exp_owner_pers', parentId: 'coa_owner_exp', nature: 'Expense', name: 'Owner personal (book)', code: '4502' },

  { id: 'coa_partner_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Partner expenses', code: '46' },
  { id: 'coa_exp_partner_payout', parentId: 'coa_partner_exp', nature: 'Expense', name: 'Partner profit / payout', code: '4601' },
  { id: 'coa_exp_partner_site', parentId: 'coa_partner_exp', nature: 'Expense', name: 'Partner site withdrawal', code: '4602' },

  { id: 'coa_unalloc_exp', parentId: 'coa_root_exp', nature: 'Expense', name: 'Unmapped expenses', code: '4998', sourceHint: 'Set taxonomy on expense rows' },
  { id: 'coa_unalloc_inc', parentId: 'coa_root_inc', nature: 'Income', name: 'Unmapped income', code: '3998' },
];

export function coaAccountById(id: string): CoaAccount | undefined {
  return CHART_OF_ACCOUNTS.find((a) => a.id === id);
}

export function buildCoaTree(): Map<string | null, CoaAccount[]> {
  const m = new Map<string | null, CoaAccount[]>();
  for (const a of CHART_OF_ACCOUNTS) {
    const k = a.parentId;
    const list = m.get(k) ?? [];
    list.push(a);
    m.set(k, list);
  }
  for (const list of m.values()) {
    list.sort((x, y) => (x.code ?? x.name).localeCompare(y.code ?? y.name));
  }
  return m;
}

export function filterCoaAccounts(query: string): CoaAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return CHART_OF_ACCOUNTS;
  return CHART_OF_ACCOUNTS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.code?.toLowerCase().includes(q) ?? false) ||
      (a.sourceHint?.toLowerCase().includes(q) ?? false) ||
      a.id.toLowerCase().includes(q)
  );
}

/** All leaf account ids under `rootId` (including `rootId` if it is a leaf). */
export function descendantLeafIds(rootId: string): Set<string> {
  const tree = buildCoaTree();
  const out = new Set<string>();
  function walk(id: string) {
    const kids = tree.get(id) ?? [];
    if (!kids.length) out.add(id);
    else for (const k of kids) walk(k.id);
  }
  walk(rootId);
  return out;
}
