import { useMemo } from 'react';
import { useDataRefresh } from '../contexts/AppProviders';
import { getCollection } from '../lib/storage';
import type { StorageKey } from '../types';

export function useLiveCollection<T>(key: StorageKey): T[] {
  const { version } = useDataRefresh();
  return useMemo(() => getCollection<T>(key), [key, version]);
}
