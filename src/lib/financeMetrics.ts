import type { CompanyExpense, IncomeRecord, Invoice, SaleBill } from '../types';

/** Single definition for Finance hub + Analytics (BR §7.11 / §7.12). */
export function computeFinanceSnapshot(input: {
  invoices: Invoice[];
  saleBills: SaleBill[];
  companyExpenses: CompanyExpense[];
  incomeRecords: IncomeRecord[];
}) {
  const { invoices, saleBills, companyExpenses, incomeRecords } = input;

  const invReceived = invoices.reduce((s, i) => s + i.received, 0);
  const sbReceived = saleBills.reduce((s, b) => s + b.received, 0);
  const paymentRevenue = invReceived + sbReceived;

  const incomeTotal = incomeRecords.reduce((s, x) => s + Math.max(0, x.amount), 0);
  const totalRevenue = paymentRevenue + incomeTotal;

  const expenseTotal = companyExpenses.reduce((s, e) => s + e.amount, 0);

  const invOutstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const sbOutstanding = saleBills.reduce((s, b) => s + b.balance, 0);
  const outstandingReceivables = invOutstanding + sbOutstanding;

  const netProfit = totalRevenue - expenseTotal;

  return {
    totalRevenue,
    paymentRevenue,
    incomeTotal,
    totalExpenses: expenseTotal,
    outstandingReceivables,
    netProfit,
  };
}
