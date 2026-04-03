import { STORAGE_KEYS, type StorageKey } from '../types';

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getCollection<T>(key: StorageKey): T[] {
  const k = STORAGE_KEYS[key];
  return parse<T[]>(localStorage.getItem(k), []);
}

export function setCollection<T>(key: StorageKey, data: T[]): void {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

export function getItem<T>(key: StorageKey): T | null {
  const raw = localStorage.getItem(STORAGE_KEYS[key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: StorageKey, data: T): void {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

export function removeKey(key: StorageKey): void {
  localStorage.removeItem(STORAGE_KEYS[key]);
}

export function clearAllSolarKeys(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
