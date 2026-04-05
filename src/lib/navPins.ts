const STORAGE_KEY = 'mms_nav_pins_v1';

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function getNavPins(): string[] {
  return readRaw();
}

export function setNavPins(paths: string[]): void {
  const uniq = [...new Set(paths.filter(Boolean))];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uniq));
  window.dispatchEvent(new CustomEvent('mms-nav-pins'));
}

export function toggleNavPin(to: string): void {
  const cur = readRaw();
  const next = cur.includes(to) ? cur.filter((x) => x !== to) : [...cur, to];
  setNavPins(next);
}

export function isNavPinned(to: string): boolean {
  return readRaw().includes(to);
}
