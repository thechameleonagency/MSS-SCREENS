import type { Enquiry, IntroducingPartnerPayMode, Project, Quotation } from '../types';

/** Infer introducer remuneration mode from structured + legacy enquiry fields. */
export function inferIntroducingPartnerModeFromEnquiry(enq: Enquiry): IntroducingPartnerPayMode {
  if (enq.introducingPartnerPayMode) return enq.introducingPartnerPayMode;
  if (enq.partnerProfitSharePercent != null && enq.partnerProfitSharePercent > 0) return 'profit_share';
  if ((enq.introducingPartnerReferralPerKwInr ?? 0) > 0) return 'referral_per_kw';
  if ((enq.introducingPartnerReferralFlatInr ?? 0) > 0 || (enq.fixedDealAmountInr ?? 0) > 0) {
    return 'referral_flat';
  }
  return 'profit_share';
}

/** True when a project exists whose quotation is tied to this enquiry (commission basis is fixed). */
export function enquiryCommissionLocked(
  enquiryId: string,
  projects: Project[],
  quotations: Quotation[]
): boolean {
  for (const p of projects) {
    if (!p.quotationId) continue;
    const q = quotations.find((x) => x.id === p.quotationId);
    if (q?.enquiryId === enquiryId) return true;
  }
  return false;
}

/** True when any project was created from this quotation (introducer economics should not change on the quote). */
export function quotationIntroducerEconomicsLocked(quotationId: string, projects: Project[]): boolean {
  return projects.some((p) => p.quotationId === quotationId);
}
