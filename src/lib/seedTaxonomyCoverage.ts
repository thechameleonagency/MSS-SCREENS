/**
 * One synthetic row per expense/income taxonomy leaf so every unified modal path has demo data.
 */
import type { CompanyExpense, IncomeRecord } from '../types';
import { EXPENSE_TAXONOMY, expenseTaxonomyKey, type ExpensePillarId } from './expenseTaxonomy';
import { INCOME_TAXONOMY, incomeTaxonomyKey, type IncomePillarId } from './incomeTaxonomy';

export interface TaxonomySeedContext {
  now: string;
  year: number;
  projectId: string;
  employeeId: string;
  partnerId: string;
  vendorId: string;
  loanId: string;
  secondPartnerId?: string;
}

const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Cheque'] as const;

function expenseDate(year: number, idx: number): string {
  const m = (idx % 12) + 1;
  const day = 5 + (idx % 20);
  return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function incomeDate(year: number, idx: number): string {
  return expenseDate(year, idx + 3);
}

export function buildTaxonomyCoverageExpenses(ctx: TaxonomySeedContext): CompanyExpense[] {
  const out: CompanyExpense[] = [];
  let idx = 0;
  for (const pillar of EXPENSE_TAXONOMY) {
    const payerType = pillar.allowedPayers[0]!;
    const paidBy =
      pillar.id === 'OWNER'
        ? 'Owner'
        : payerType === 'Employee'
          ? 'Company'
          : payerType;
    for (const cat of pillar.categories) {
      for (const sub of cat.subs) {
        const flags = sub.flags ?? {};
        const key = expenseTaxonomyKey(pillar.id, cat.id, sub.id);
        const categoryLabel = `${pillar.label} › ${cat.label}`;
        const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length]!;
        const row: CompanyExpense = {
          id: `exp_cov_${pillar.id}_${cat.id}_${sub.id}`,
          category: categoryLabel,
          subCategory: sub.id,
          taxonomyKey: key,
          pillar: pillar.id,
          payerType,
          paidBy,
          amount: 1200 + idx * 173 + (pillar.id.length * 41),
          date: expenseDate(ctx.year, idx),
          mode,
          notes: `Demo coverage — ${sub.label}`,
          createdAt: ctx.now,
        };
        if (flags.requiresProject) row.projectId = ctx.projectId;
        if (flags.requiresEmployee) row.employeeId = ctx.employeeId;
        if (flags.requiresPartner) {
          row.partnerId = ctx.partnerId;
          if (flags.requiresProject) row.projectId = ctx.projectId;
        }
        if (flags.requiresVendor) row.vendorId = ctx.vendorId;
        if (flags.requiresMonth) row.monthRef = `${ctx.year}-${String((idx % 12) + 1).padStart(2, '0')}`;
        if (flags.requiresQuantity) {
          row.quantity = 2 + (idx % 4);
          row.quantityUnit = 'day';
        }
        if (pillar.id === 'PARTNER' && sub.id === 'sl') {
          row.partnerId = ctx.partnerId;
          row.projectId = ctx.projectId;
        }
        out.push(row);
        idx += 1;
      }
    }
  }
  return out;
}

export function buildTaxonomyCoverageIncome(ctx: TaxonomySeedContext): IncomeRecord[] {
  const out: IncomeRecord[] = [];
  let idx = 0;
  for (const pillar of INCOME_TAXONOMY) {
    for (const cat of pillar.categories) {
      for (const sub of cat.subs) {
        const flags = sub.flags ?? {};
        const key = incomeTaxonomyKey(pillar.id as IncomePillarId, cat.id, sub.id);
        const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length]!;
        const row: IncomeRecord = {
          id: `inc_cov_${pillar.id}_${cat.id}_${sub.id}`,
          pillar: pillar.id,
          category: `${pillar.label} › ${cat.label}`,
          subCategory: sub.id,
          taxonomyKey: key,
          amount: 3500 + idx * 211,
          date: incomeDate(ctx.year, idx),
          paymentMode: mode,
          notes: `Demo coverage — ${sub.label}`,
          createdAt: ctx.now,
          isOutgoing: Boolean(flags.isOutgoing),
        };
        if (flags.requiresProject) row.projectId = ctx.projectId;
        if (flags.requiresPartner) row.partnerId = ctx.partnerId;
        if (flags.requiresEmployee) row.employeeId = ctx.employeeId;
        if (flags.requiresPersonName) {
          row.personName = 'Demo Lender / Udhar';
          row.contactNumber = '919876543210';
        }
        if (flags.requiresExpectedReturnDate) row.expectedReturnDate = `${ctx.year}-12-31`;
        if (flags.requiresBankName) row.bankName = 'HDFC Bank';
        if (flags.requiresLoanAccount) row.loanAccount = 'LOAN-XXXX-7721';
        if (flags.requiresInterestRate) row.interestRate = 10.5 + (idx % 5) * 0.25;
        if (flags.requiresTenure) row.tenureMonths = 48 + (idx % 12) * 2;
        if (flags.requiresLoanSelect) row.metadata = { loanId: ctx.loanId };
        out.push(row);
        idx += 1;
      }
    }
  }
  return out;
}

/** Extra expenses to touch every ExpensePillarId explicitly in payer variants (optional second rows). */
export function buildExpensePayerVariants(ctx: TaxonomySeedContext, pillars: ExpensePillarId[]): CompanyExpense[] {
  const out: CompanyExpense[] = [];
  let n = 0;
  for (const pillarId of pillars) {
    const pillar = EXPENSE_TAXONOMY.find((p) => p.id === pillarId);
    if (!pillar) continue;
    const cat = pillar.categories[0];
    const sub = cat?.subs[0];
    if (!cat || !sub) continue;
    out.push({
      id: `exp_payervar_${pillarId}_${n++}`,
      category: `${pillar.label} › ${cat.label} (payer variant)`,
      subCategory: sub.id,
      taxonomyKey: expenseTaxonomyKey(pillarId, cat.id, sub.id),
      pillar: pillarId,
      payerType: pillar.allowedPayers[Math.min(1, pillar.allowedPayers.length - 1)]!,
      paidBy: pillar.id === 'OWNER' ? 'Owner' : 'Company',
      amount: 2500 + n * 100,
      date: expenseDate(ctx.year, 40 + n),
      mode: 'Bank Transfer',
      notes: `Payer variant demo — ${pillar.label}`,
      createdAt: ctx.now,
      projectId: pillarId === 'SITE' || pillarId === 'PARTNER' ? ctx.projectId : undefined,
      partnerId: pillarId === 'PARTNER' ? ctx.partnerId : undefined,
      employeeId: pillarId === 'EMPLOYEE' ? ctx.employeeId : undefined,
    });
  }
  return out;
}
