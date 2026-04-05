import { clearAllSolarKeys } from './storage';

/**
 * Bump when a deployed build may be incompatible with persisted localStorage
 * (schema, seed assumptions, or critical prototype behavior).
 */
export const APP_VERSION = '1.0.0';

/** Must match requirement: stored under `appVersion` in localStorage. */
export const APP_VERSION_STORAGE_KEY = 'appVersion';

export function shouldBlockOnVersionMismatch(): boolean {
  const stored = localStorage.getItem(APP_VERSION_STORAGE_KEY);
  return stored !== null && stored !== APP_VERSION;
}

/** Clears all MMS keys plus version/seed markers so the next load re-seeds cleanly. */
export function clearAllAppMemory(): void {
  clearAllSolarKeys();
  localStorage.removeItem(APP_VERSION_STORAGE_KEY);
  localStorage.removeItem('solar_demoSeedVersion');
}
