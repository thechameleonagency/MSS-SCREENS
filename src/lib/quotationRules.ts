import type { Quotation } from '../types';

const MS_PER_DAY = 86400000;

/** True when quote validity (from createdAt + validityPeriodDays) has passed. */
export function isQuotationExpired(q: Quotation, now = Date.now()): boolean {
  const days = q.validityPeriodDays ?? 30;
  const start = new Date(q.createdAt).getTime();
  if (!Number.isFinite(start)) return false;
  return now > start + days * MS_PER_DAY;
}

export function quotationExpiryLabel(q: Quotation): string {
  const days = q.validityPeriodDays ?? 30;
  const end = new Date(new Date(q.createdAt).getTime() + days * MS_PER_DAY);
  return end.toISOString().slice(0, 10);
}
