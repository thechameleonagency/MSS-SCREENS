import type { IntroducingPartnerPayMode, Invoice } from '../types';

/** Sum billed vs received on invoices for a project (client → us). */
export function projectClientCollection(projectId: string, invoices: Invoice[]) {
  const invs = invoices.filter((i) => i.projectId === projectId);
  const billed = invs.reduce((s, i) => s + (i.total ?? 0), 0);
  const received = invs.reduce((s, i) => s + (i.received ?? 0), 0);
  const balance = Math.max(0, billed - received);
  const fullyPaid = billed <= 0 ? false : balance <= 0.01;
  const partial = billed > 0 && !fullyPaid && received > 0;
  return { billed, received, balance, fullyPaid, partial, hasInvoices: invs.length > 0 };
}

/** Profit-share introducers wait for full client collection; flat / per-kW referral can be paid per policy (not gated here). */
export function partnerPayoutBlockedReason(
  projectId: string,
  invoices: Invoice[],
  introducerPayMode?: IntroducingPartnerPayMode
): string | null {
  if (introducerPayMode && introducerPayMode !== 'profit_share') {
    return null;
  }
  const s = projectClientCollection(projectId, invoices);
  if (!s.hasInvoices) {
    return 'No client invoices are recorded for this project yet. Add billing and client receipts before paying introducing partner shares.';
  }
  if (s.partial) {
    return `Client payment is still in progress (₹${s.received.toLocaleString('en-IN')} received of ₹${s.billed.toLocaleString('en-IN')} billed). Please wait until the client has fully paid before releasing partner profit share.`;
  }
  if (!s.fullyPaid) {
    return `Client payment is pending (₹${s.balance.toLocaleString('en-IN')} still due on client invoices). Please wait before releasing partner share / agent amounts.`;
  }
  return null;
}
