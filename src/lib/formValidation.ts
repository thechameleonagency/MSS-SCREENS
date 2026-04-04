/** Lightweight client-side checks (no zod dependency). */

export function requireNonEmptyTrimmed(value: string, fieldLabel: string): string | null {
  const t = value.trim();
  if (!t) return `${fieldLabel} is required`;
  return null;
}

export function requirePositiveAmount(value: string | number, _fieldLabel: string): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function optionalNonNegativeNumber(value: string, fieldLabel: string): number | { error: string } {
  const t = value.trim();
  if (t === '') return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return { error: `${fieldLabel} must be zero or positive` };
  return n;
}
