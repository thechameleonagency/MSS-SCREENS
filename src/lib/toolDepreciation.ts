/** Straight-line annual depreciation (₹). */
export function annualDepreciationSlm(cost: number, salvage: number, usefulLifeYears: number): number {
  if (usefulLifeYears <= 0 || cost <= 0) return 0;
  return Math.max(0, (cost - Math.max(0, salvage)) / usefulLifeYears);
}

/** Declining balance first-year charge (simple WDV stub). */
export function annualDepreciationWdvFirstYear(wdv: number, ratePercent: number): number {
  if (wdv <= 0 || ratePercent <= 0) return 0;
  return Math.round(wdv * (ratePercent / 100) * 100) / 100;
}
