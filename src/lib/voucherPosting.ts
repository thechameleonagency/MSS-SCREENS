import { appendAudit } from './auditLog';
import { expenseToLedger, paymentToLedger } from './coaMapping';
import { generateId, getCollection, setCollection } from './storage';
import type { CompanyExpense, Invoice, LedgerLine, Payment, Voucher } from '../types';

/** Simplified sales voucher: Dr receivables, Cr revenue (tax detail later). */
export function postSalesVoucherFromInvoice(inv: Invoice, userId: string, userName?: string): void {
  const vid = generateId('vch');
  const now = new Date().toISOString();
  const voucher: Voucher = {
    id: vid,
    type: 'Sales',
    date: inv.date,
    narration: `Invoice ${inv.invoiceNumber}`,
    postedFrom: { entityType: 'Invoice', entityId: inv.id },
    createdAt: now,
  };
  const lines: LedgerLine[] = [
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: 'coa_debtors',
      debit: inv.total,
      credit: 0,
      narration: inv.invoiceNumber,
      createdAt: now,
    },
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: 'coa_sales',
      debit: 0,
      credit: inv.total,
      narration: inv.invoiceNumber,
      createdAt: now,
    },
  ];
  setCollection('vouchers', [...getCollection<Voucher>('vouchers'), voucher]);
  setCollection('ledgerLines', [...getCollection<LedgerLine>('ledgerLines'), ...lines]);
  appendAudit({
    userId,
    userName,
    action: 'create',
    entityType: 'Voucher',
    entityId: vid,
    entityName: voucher.narration,
    newValue: String(inv.total),
  });
}

/** Customer receipt: Dr bank/cash, Cr receivables. */
export function postReceiptVoucherFromPayment(
  pay: Payment,
  inv: Invoice,
  userId: string,
  userName?: string
): void {
  const vid = generateId('vch');
  const now = new Date().toISOString();
  const assetId = paymentToLedger(pay).accountId;
  const voucher: Voucher = {
    id: vid,
    type: 'Receipt',
    date: pay.date,
    narration: `Receipt ${pay.mode} — ${inv.invoiceNumber}${pay.isAdvance ? ' (advance flag)' : ''}`,
    postedFrom: { entityType: 'Payment', entityId: pay.id },
    createdAt: now,
  };
  const lines: LedgerLine[] = [
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: assetId,
      debit: pay.amount,
      credit: 0,
      narration: inv.invoiceNumber,
      createdAt: now,
    },
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: 'coa_debtors',
      debit: 0,
      credit: pay.amount,
      narration: inv.invoiceNumber,
      createdAt: now,
    },
  ];
  setCollection('vouchers', [...getCollection<Voucher>('vouchers'), voucher]);
  setCollection('ledgerLines', [...getCollection<LedgerLine>('ledgerLines'), ...lines]);
  appendAudit({
    userId,
    userName,
    action: 'create',
    entityType: 'Voucher',
    entityId: vid,
    entityName: voucher.narration,
    newValue: String(pay.amount),
  });
}

/** Expense: Dr mapped expense, Cr bank (simplified; payer split later). */
export function postExpenseVoucher(exp: CompanyExpense, userId: string, userName?: string): void {
  const vid = generateId('vch');
  const now = new Date().toISOString();
  const expAcc = expenseToLedger(exp).accountId;
  const voucher: Voucher = {
    id: vid,
    type: 'Journal',
    date: exp.date,
    narration: `Expense ${exp.category}`,
    postedFrom: { entityType: 'CompanyExpense', entityId: exp.id },
    createdAt: now,
  };
  const lines: LedgerLine[] = [
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: expAcc,
      debit: exp.amount,
      credit: 0,
      narration: exp.category,
      createdAt: now,
    },
    {
      id: generateId('led'),
      voucherId: vid,
      accountId: 'coa_bank',
      debit: 0,
      credit: exp.amount,
      narration: exp.mode,
      createdAt: now,
    },
  ];
  setCollection('vouchers', [...getCollection<Voucher>('vouchers'), voucher]);
  setCollection('ledgerLines', [...getCollection<LedgerLine>('ledgerLines'), ...lines]);
  appendAudit({
    userId,
    userName,
    action: 'create',
    entityType: 'Voucher',
    entityId: vid,
    entityName: voucher.narration,
    newValue: String(exp.amount),
  });
}
