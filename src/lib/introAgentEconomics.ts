import type { AgentIntroProjectEconomics, IntroducingPartnerPayMode, IntroAgentPayoutKind } from '../types';

export function payoutKind(p: AgentIntroProjectEconomics['payouts'][number]): IntroAgentPayoutKind {
  return p.kind ?? 'profit_share';
}

/** Resolve mode from new fields or legacy projectReferralRateType. */
export function introducerPayModeForRow(row: AgentIntroProjectEconomics): IntroducingPartnerPayMode {
  if (row.introducerPayMode) return row.introducerPayMode;
  const rt = row.projectReferralRateType ?? 'None';
  if (rt === 'Flat') return 'referral_flat';
  if (rt === 'Per kW') return 'referral_per_kw';
  return 'profit_share';
}

function referralFlatAmount(row: AgentIntroProjectEconomics): number {
  if (row.referralFlatInr != null && row.referralFlatInr > 0) return Math.round(row.referralFlatInr);
  if (row.projectReferralRateType === 'Flat') return Math.round(row.projectReferralRateInr ?? 0);
  return 0;
}

function referralPerKwAmount(row: AgentIntroProjectEconomics, capacityKw: number): number {
  const rate =
    row.referralPerKwInr != null && row.referralPerKwInr > 0
      ? row.referralPerKwInr
      : row.projectReferralRateType === 'Per kW'
        ? (row.projectReferralRateInr ?? 0)
        : 0;
  return Math.round(rate * capacityKw);
}

/** Single bucket due for this row based on introducer mode (profit share XOR referral). */
export function introAgentShareBreakdown(row: AgentIntroProjectEconomics, capacityKw: number) {
  const mode = introducerPayModeForRow(row);
  const share =
    mode === 'profit_share'
      ? Math.round((row.estimatedGrossProfitInr * row.partnerSharePercent) / 100)
      : 0;
  const refDue =
    mode === 'referral_flat' ? referralFlatAmount(row) : mode === 'referral_per_kw' ? referralPerKwAmount(row, capacityKw) : 0;

  const profitPaid = row.payouts.filter((p) => payoutKind(p) === 'profit_share').reduce((s, p) => s + p.amountInr, 0);
  const refPaid = row.payouts.filter((p) => payoutKind(p) === 'referral').reduce((s, p) => s + p.amountInr, 0);

  const profitPending = mode === 'profit_share' ? Math.max(0, share - profitPaid) : 0;
  const refPending =
    mode === 'referral_flat' || mode === 'referral_per_kw' ? Math.max(0, refDue - refPaid) : 0;

  return {
    mode,
    share,
    refDue,
    profitPaid,
    refPaid,
    paid: profitPaid + refPaid,
    profitPending,
    refPending,
    pending: profitPending + refPending,
  };
}
