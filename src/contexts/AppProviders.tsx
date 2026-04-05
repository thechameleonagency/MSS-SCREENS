import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserRole } from '../types';
import { STORAGE_KEYS } from '../types';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

type DataCtx = { version: number; bump: () => void };
const DataContext = createContext<DataCtx | null>(null);

export function useDataRefresh(): DataCtx {
  const c = useContext(DataContext);
  if (!c) throw new Error('useDataRefresh outside provider');
  return c;
}

type RoleCtx = {
  role: UserRole;
  setRole: (r: UserRole) => void;
};
const RoleContext = createContext<RoleCtx | null>(null);

export function useRole(): RoleCtx {
  const c = useContext(RoleContext);
  if (!c) throw new Error('useRole outside provider');
  return c;
}

type ToastCtx = { show: (message: string, type?: Toast['type']) => void };
const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast outside provider');
  return c;
}

const ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'CEO',
  'Management',
  'Salesperson',
  'Installation Team',
];

export function AppProviders({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [role, setRoleState] = useState<UserRole>(() => {
    const r = localStorage.getItem(STORAGE_KEYS.currentRole) as UserRole | null;
    return r && ROLES.includes(r) ? r : 'Super Admin';
  });

  const setRole = useCallback((r: UserRole) => {
    localStorage.setItem(STORAGE_KEYS.currentRole, r);
    setRoleState(r);
  }, []);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  const dataValue = useMemo(() => ({ version, bump }), [version, bump]);
  const roleValue = useMemo(() => ({ role, setRole }), [role, setRole]);
  const toastValue = useMemo(() => ({ show }), [show]);

  return (
    <DataContext.Provider value={dataValue}>
      <RoleContext.Provider value={roleValue}>
        <ToastContext.Provider value={toastValue}>
          {children}
          <div className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`rounded-md border px-4 py-3 text-sm font-medium shadow-md transition ${
                  t.type === 'success'
                    ? 'border-transparent bg-success text-success-foreground'
                    : t.type === 'error'
                      ? 'border-transparent bg-destructive text-destructive-foreground'
                      : 'border-border bg-card text-card-foreground'
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </RoleContext.Provider>
    </DataContext.Provider>
  );
}

export { ROLES };
