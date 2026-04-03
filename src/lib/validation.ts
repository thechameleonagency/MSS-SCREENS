export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function isPhone10(s: string): boolean {
  return /^\d{10}$/.test(s.replace(/\D/g, '').slice(-10));
}

export function digitsPhone(s: string): string {
  return s.replace(/\D/g, '').slice(-10);
}
