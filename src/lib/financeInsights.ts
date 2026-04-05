/**
 * Shared financial analytics & audit computations (read-only over live collections).
 */
import { inferExpenseTaxonomyKey } from './expenseTaxonomy';
import { inferIncomeTaxonomyKey } from './incomeTaxonomy';
import type {
  CompanyExpense,
  CompanyProfile,
  Customer,
  IncomeRecord,
  Invoice,
  Material,
  Payment,
  PurchaseBill,
  SaleBill,
  Supplier,
  Tool,
} from '../types';

export function inDateRange(isoDate: string, start: string, end: string): boolean {
  const d = isoDate.slice(0, 10);
  return d >= start && d <= end;
}

export interface TaxonomyRollupRow {
  key: string;
  pillar?: string;
  amount: number;
  count: number;
  label: string;
}

export function rollupExpensesByTaxonomyKey(expenses: CompanyExpense[]): TaxonomyRollupRow[] {
  const m = new Map<string, { amount: number; count: number; pillar?: string; label: string }>();
  for (const e of expenses) {
    const key = inferExpenseTaxonomyKey(e) ?? e.taxonomyKey ?? `legacy:${e.category}`;
    const label = e.category.includes('›') ? e.category : `${e.pillar ?? '—'} · ${e.category}`;
    const cur = m.get(key) ?? { amount: 0, count: 0, pillar: e.pillar, label };
    cur.amount += e.amount;
    cur.count += 1;
    if (!cur.pillar && e.pillar) cur.pillar = e.pillar;
    m.set(key, cur);
  }
  return [...m.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

export function rollupIncomeByTaxonomyKey(incomes: IncomeRecord[]): TaxonomyRollupRow[] {
  const m = new Map<string, { amount: number; count: number; pillar?: string; label: string }>();
  for (const r of incomes) {
    if (r.isOutgoing) continue;
    const key = inferIncomeTaxonomyKey(r) ?? r.taxonomyKey ?? `legacy:${r.pillar}:${r.category}`;
    const label = r.category.includes('›') ? r.category : `${r.pillar} · ${r.category}`;
    const cur = m.get(key) ?? { amount: 0, count: 0, pillar: r.pillar, label };
    cur.amount += r.amount;
    cur.count += 1;
    m.set(key, cur);
  }
  return [...m.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

export interface GstAggregate {
  taxableSales: number;
  outputCgst: number;
  outputSgst: number;
  outputIgst: number;
  outputTax: number;
  taxablePurchases: number;
  inputCgst: number;
  inputSgst: number;
  inputIgst: number;
  inputTax: number;
  netTaxPayable: number;
  invoicesWithBreakup: number;
  saleBillsWithBreakup: number;
  billsWithGstItems: number;
}

export function aggregateGstActivity(opts: {
  invoices: Invoice[];
  saleBills: SaleBill[];
  purchaseBills: PurchaseBill[];
}): GstAggregate {
  let taxableSales = 0;
  let outputCgst = 0;
  let outputSgst = 0;
  let outputIgst = 0;
  let invoicesWithBreakup = 0;
  let saleBillsWithBreakup = 0;
  for (const inv of opts.invoices) {
    const g = inv.gstBreakup;
    if (!g) continue;
    invoicesWithBreakup += 1;
    taxableSales += g.taxableValue;
    outputCgst += g.cgst;
    outputSgst += g.sgst;
    outputIgst += g.igst;
  }
  for (const sb of opts.saleBills) {
    const g = sb.gstBreakup;
    if (!g) continue;
    saleBillsWithBreakup += 1;
    taxableSales += g.taxableValue;
    outputCgst += g.cgst;
    outputSgst += g.sgst;
    outputIgst += g.igst;
  }
  let taxablePurchases = 0;
  let inputCgst = 0;
  let inputSgst = 0;
  let inputIgst = 0;
  let billsWithGstItems = 0;
  for (const b of opts.purchaseBills) {
    let any = false;
    for (const it of b.items) {
      if (it.gstRatePercent == null && it.cgst == null && it.sgst == null && it.igst == null) continue;
      any = true;
      const base = it.total - (it.cgst ?? 0) - (it.sgst ?? 0) - (it.igst ?? 0);
      taxablePurchases += Math.max(0, base);
      inputCgst += it.cgst ?? 0;
      inputSgst += it.sgst ?? 0;
      inputIgst += it.igst ?? 0;
    }
    if (any) billsWithGstItems += 1;
  }
  const outputTax = outputCgst + outputSgst + outputIgst;
  const inputTax = inputCgst + inputSgst + inputIgst;
  return {
    taxableSales,
    outputCgst,
    outputSgst,
    outputIgst,
    outputTax,
    taxablePurchases,
    inputCgst,
    inputSgst,
    inputIgst,
    inputTax,
    netTaxPayable: outputTax - inputTax,
    invoicesWithBreakup,
    saleBillsWithBreakup,
    billsWithGstItems,
  };
}

export interface DebtorRow {
  customerId: string;
  name: string;
  balance: number;
  invoiceCount: number;
}

export function debtorsByCustomer(invoices: Invoice[], customers: Customer[]): DebtorRow[] {
  const m = new Map<string, { balance: number; n: number }>();
  for (const inv of invoices) {
    if (inv.balance <= 0) continue;
    const cur = m.get(inv.customerId) ?? { balance: 0, n: 0 };
    cur.balance += inv.balance;
    cur.n += 1;
    m.set(inv.customerId, cur);
  }
  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  return [...m.entries()]
    .map(([customerId, v]) => ({
      customerId,
      name: name(customerId),
      balance: v.balance,
      invoiceCount: v.n,
    }))
    .sort((a, b) => b.balance - a.balance);
}

export interface CreditorRow {
  supplierId: string;
  name: string;
  outstanding: number;
}

export function creditorsFromSuppliers(suppliers: Supplier[]): CreditorRow[] {
  return suppliers
    .filter((s) => s.outstanding > 0)
    .map((s) => ({ supplierId: s.id, name: s.name, outstanding: s.outstanding }))
    .sort((a, b) => b.outstanding - a.outstanding);
}

export interface CashBankRow {
  mode: string;
  inflow: number;
  outflow: number;
  net: number;
}

export function cashBankByMode(opts: {
  payments: Payment[];
  companyExpenses: CompanyExpense[];
  incomeRecords: IncomeRecord[];
}): CashBankRow[] {
  const modes = new Map<string, { inflow: number; outflow: number }>();
  const add = (mode: string, inf: number, outf: number) => {
    const cur = modes.get(mode) ?? { inflow: 0, outflow: 0 };
    cur.inflow += inf;
    cur.outflow += outf;
    modes.set(mode, cur);
  };
  for (const p of opts.payments) {
    add(p.mode, p.amount, 0);
  }
  for (const e of opts.companyExpenses) {
    add(e.mode || 'Other', 0, e.amount);
  }
  for (const r of opts.incomeRecords) {
    if (r.isOutgoing) {
      add(r.paymentMode || 'Other', 0, r.amount);
    } else {
      add(r.paymentMode || 'Other', r.amount, 0);
    }
  }
  return [...modes.entries()]
    .map(([mode, v]) => ({ mode, ...v, net: v.inflow - v.outflow }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

export interface PnlSection {
  label: string;
  amount: number;
}

export interface PnlStatement {
  sections: PnlSection[];
  netIncome: number;
}

export function buildProfitLossStatement(opts: {
  invoices: Invoice[];
  saleBills: SaleBill[];
  companyExpenses: CompanyExpense[];
  incomeRecords: IncomeRecord[];
}): PnlStatement {
  const invRecv = opts.invoices.reduce((s, i) => s + i.received, 0);
  const sbRecv = opts.saleBills.reduce((s, b) => s + b.received, 0);
  const otherIncome = opts.incomeRecords.filter((r) => !r.isOutgoing).reduce((s, r) => s + r.amount, 0);
  const revenue = invRecv + sbRecv;
  const expenses = opts.companyExpenses.reduce((s, e) => s + e.amount, 0);
  const sections: PnlSection[] = [
    { label: 'Revenue — invoices (cash received)', amount: invRecv },
    { label: 'Revenue — sale bills (cash received)', amount: sbRecv },
    { label: 'Other income (income register, excl. outgoing)', amount: otherIncome },
    { label: 'Total inflows (invoice + sale bill received + other income)', amount: revenue + otherIncome },
    { label: 'Company expenses (all pillars)', amount: -expenses },
  ];
  const netIncome = revenue + otherIncome - expenses;
  return { sections, netIncome };
}

export interface MonthlyFlow {
  monthKey: string;
  label: string;
  payments: number;
  expenses: number;
  incomeLines: number;
}

export function lastNMonthlyFlows(
  n: number,
  opts: { payments: Payment[]; expenses: CompanyExpense[]; incomes: IncomeRecord[] }
): MonthlyFlow[] {
  const now = new Date();
  const out: MonthlyFlow[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    const payments = opts.payments.filter((p) => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    const expenses = opts.expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    const incomeLines = opts.incomes
      .filter((r) => !r.isOutgoing && r.date.startsWith(key))
      .reduce((s, r) => s + r.amount, 0);
    out.push({ monthKey: key, label, payments, expenses, incomeLines });
  }
  return out;
}

export interface ToolAssetRow {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseDate: string;
  condition: string;
  lifecycleStatus?: string;
  bookValueEstimate: number;
}

export function toolsAsFixedAssets(tools: Tool[]): ToolAssetRow[] {
  return tools.map((t) => {
    const years = t.usefulLifeYears ?? 5;
    const salvage = t.salvageValue ?? 0;
    const p = new Date(t.purchaseDate);
    const age = Math.max(0, (Date.now() - p.getTime()) / (365.25 * 24 * 3600 * 1000));
    const depAnnual = years > 0 ? (t.purchaseRate - salvage) / years : 0;
    const book = Math.max(salvage, t.purchaseRate - depAnnual * age);
    return {
      id: t.id,
      name: t.name,
      category: t.category,
      purchaseRate: t.purchaseRate,
      purchaseDate: t.purchaseDate,
      condition: t.condition,
      lifecycleStatus: t.lifecycleStatus,
      bookValueEstimate: Math.round(book),
    };
  });
}

export interface InventorySkuRow {
  id: string;
  name: string;
  category: string;
  qty: number;
  rate: number;
  value: number;
  belowMin: boolean;
}

export function inventoryValuation(materials: Material[]): { rows: InventorySkuRow[]; total: number } {
  let total = 0;
  const rows = materials.map((m) => {
    const value = m.currentStock * m.purchaseRate;
    total += value;
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      qty: m.currentStock,
      rate: m.purchaseRate,
      value,
      belowMin: m.currentStock <= m.minStock,
    };
  });
  rows.sort((a, b) => b.value - a.value);
  return { rows, total };
}

export function exportAuditCsv(kind: string, rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return `${kind}\n(no rows)\n`;
  const keys = Object.keys(rows[0]!);
  const esc = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [kind, keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k] ?? '')).join(','))].join('\n');
}

export function companyGstin(profile: CompanyProfile | null): string | undefined {
  return profile?.gst?.trim() || undefined;
}
