import type { GstBreakup, InvoiceLineItem, InvoiceServiceLine } from '../types';

export function gstinSameState(companyGstin: string | undefined, customerGstin: string | undefined): boolean {
  const a = (companyGstin ?? '').replace(/\s/g, '').toUpperCase();
  const b = (customerGstin ?? '').replace(/\s/g, '').toUpperCase();
  if (a.length < 2 || b.length < 2) return true;
  return a.slice(0, 2) === b.slice(0, 2);
}

export function computeGstBreakup(
  lineItems: InvoiceLineItem[],
  serviceLines: InvoiceServiceLine[] | undefined,
  sameState: boolean
): GstBreakup {
  let taxable = 0;
  let totalTax = 0;
  for (const li of lineItems) {
    const base = li.amount;
    taxable += base;
    totalTax += (base * li.gstRate) / 100;
  }
  for (const sl of serviceLines ?? []) {
    taxable += sl.amount;
    totalTax += (sl.amount * sl.gstRate) / 100;
  }
  if (sameState) {
    const half = totalTax / 2;
    return { taxableValue: taxable, cgst: half, sgst: half, igst: 0, totalTax };
  }
  return { taxableValue: taxable, cgst: 0, sgst: 0, igst: totalTax, totalTax };
}

export function invoiceGrandTotal(b: GstBreakup): number {
  return b.taxableValue + b.totalTax;
}
