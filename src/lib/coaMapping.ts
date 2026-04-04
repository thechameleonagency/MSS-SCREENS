/**
 * Pure mapping from operational records → Chart of Accounts leaf ids.
 * Refine with CA before any voucher posting.
 */
import type { CompanyExpense, IncomeRecord, Invoice, Payment } from '../types';
import { coaAccountById } from './chartOfAccounts';
import { inferExpenseTaxonomyKey } from './expenseTaxonomy';
import { inferIncomeTaxonomyKey } from './incomeTaxonomy';

export interface CoaMappingResult {
  accountId: string;
  accountName: string;
}

function wrap(accountId: string): CoaMappingResult {
  return {
    accountId,
    accountName: coaAccountById(accountId)?.name ?? accountId,
  };
}

function expenseKey(e: CompanyExpense): string {
  return e.taxonomyKey ?? inferExpenseTaxonomyKey(e) ?? '';
}

export function expenseToLedger(e: CompanyExpense): CoaMappingResult {
  const key = expenseKey(e);
  if (!key) return wrap('coa_unalloc_exp');

  if (key.startsWith('site:')) {
    if (key.startsWith('site:commission')) return wrap('coa_exp_site_comm');
    if (key.startsWith('site:transport')) return wrap('coa_exp_site_trans');
    if (key.startsWith('site:material')) return wrap('coa_exp_site_mat');
    if (key.startsWith('site:outsource')) return wrap('coa_exp_site_out');
    if (key.startsWith('site:labour')) return wrap('coa_exp_site_lab');
    if (key.startsWith('site:general')) return wrap('coa_exp_site_gen');
    return wrap('coa_exp_site_gen');
  }
  if (key.startsWith('company:')) {
    if (key.startsWith('company:vehicle')) return wrap('coa_exp_vehicle');
    if (key.startsWith('company:marketing')) return wrap('coa_exp_marketing');
    if (key.startsWith('company:physical_marketing')) return wrap('coa_exp_physical_mkt');
    if (key.startsWith('company:tools')) return wrap('coa_exp_tools');
    if (key.startsWith('company:ca') || key.startsWith('company:tax')) return wrap('coa_exp_ca_tax');
    if (key.startsWith('company:software')) return wrap('coa_exp_software');
    if (key.startsWith('company:other')) return wrap('coa_exp_co_misc');
    return wrap('coa_exp_co_misc');
  }
  if (key.startsWith('employee:')) {
    if (key.startsWith('employee:salary')) return wrap('coa_exp_salary');
    if (key.startsWith('employee:advance')) return wrap('coa_exp_adv_emp');
    return wrap('coa_exp_emp_benefit');
  }
  if (key.startsWith('office:')) {
    if (key.startsWith('office:rent')) return wrap('coa_exp_rent');
    if (key.startsWith('office:electric')) return wrap('coa_exp_util');
    if (key.startsWith('office:internet')) return wrap('coa_exp_internet');
    return wrap('coa_exp_util');
  }
  if (key.startsWith('owner:')) {
    if (key.startsWith('owner:withdraw')) return wrap('coa_exp_drawings');
    return wrap('coa_exp_owner_pers');
  }
  if (key.startsWith('partner:')) {
    if (key.startsWith('partner:pwith')) {
      if (key.endsWith(':cl')) return wrap('coa_exp_partner_payout');
      return wrap('coa_exp_partner_site');
    }
    if (key.startsWith('partner:pprofit')) return wrap('coa_exp_partner_payout');
    return wrap('coa_exp_partner_payout');
  }
  return wrap('coa_unalloc_exp');
}

function incomeKey(i: IncomeRecord): string {
  return i.taxonomyKey ?? inferIncomeTaxonomyKey(i) ?? '';
}

export function incomeToLedger(i: IncomeRecord): CoaMappingResult {
  const key = incomeKey(i);
  if (!key) return wrap('coa_unalloc_inc');

  if (key.startsWith('project:')) {
    if (key.includes(':subsidy')) return wrap('coa_subsidy');
    if (key.startsWith('project:other')) return wrap('coa_inc_other');
    if (key.startsWith('project:client')) return wrap('coa_sales');
    return wrap('coa_sales');
  }
  if (key.startsWith('loans:')) {
    if (key.includes('ugiven')) return wrap('coa_debtors');
    if (key.includes('urec') || key.includes('recv') || key.includes(':ff')) return wrap('coa_loans_st');
    if (key.includes('emi_ref')) return wrap('coa_bank');
    return wrap('coa_loans_st');
  }
  if (key.startsWith('partner:')) {
    if (key.startsWith('partner:profit')) return wrap('coa_capital');
    return wrap('coa_capital');
  }
  if (key.startsWith('employee:')) return wrap('coa_exp_emp_benefit');
  if (key.startsWith('company:')) {
    if (key.startsWith('company:interest')) return wrap('coa_interest_inc');
    return wrap('coa_inc_other');
  }
  return wrap('coa_unalloc_inc');
}

/** Customer receipt: asset side of collection. */
export function paymentToLedger(p: Payment): CoaMappingResult {
  if (p.mode === 'Cash') return wrap('coa_cash');
  if (p.mode === 'Bank Transfer' || p.mode === 'UPI' || p.mode === 'Cheque' || p.mode === 'Credit Card') {
    return wrap('coa_bank');
  }
  if (p.mode === 'Loan Disbursement') return wrap('coa_bank');
  return wrap('coa_bank');
}

/** Revenue recognition (simplified — one control account). */
export function invoiceToLedger(_inv: Invoice): CoaMappingResult {
  return wrap('coa_sales');
}

/** Unpaid invoice balance sits in receivables until paid. */
export function invoiceReceivableLedger(_inv: Invoice): CoaMappingResult {
  return wrap('coa_debtors');
}
