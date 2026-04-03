import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMeta, type BreadcrumbItem } from '../lib/routeMeta';

export type PageHeaderOverride = {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

type Ctx = {
  setPageOverride: (patch: PageHeaderOverride | null) => void;
};

const PageOverrideContext = createContext<Ctx | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [override, setOverride] = useState<PageHeaderOverride | null>(null);

  useEffect(() => {
    setOverride(null);
  }, [pathname]);

  const setPageOverride = useCallback((patch: PageHeaderOverride | null) => {
    setOverride(patch);
  }, []);

  const defaults = useMemo(() => getPageMeta(pathname), [pathname]);
  const merged = useMemo(
    () => ({
      title: override?.title ?? defaults.title,
      subtitle: override?.subtitle ?? defaults.subtitle,
      breadcrumbs: override?.breadcrumbs ?? defaults.breadcrumbs,
      actions: override?.actions,
    }),
    [defaults, override]
  );

  const value = useMemo(() => ({ setPageOverride }), [setPageOverride]);

  return (
    <PageOverrideContext.Provider value={value}>
      <MergedPageHeaderContext.Provider value={merged}>{children}</MergedPageHeaderContext.Provider>
    </PageOverrideContext.Provider>
  );
}

type MergedHeader = ReturnType<typeof getPageMeta> & { actions?: ReactNode };
const MergedPageHeaderContext = createContext<MergedHeader | null>(null);

export function useMergedPageHeader() {
  const v = useContext(MergedPageHeaderContext);
  if (!v) throw new Error('useMergedPageHeader outside PageHeaderProvider');
  return v;
}

export function usePageHeader(patch: PageHeaderOverride) {
  const ctx = useContext(PageOverrideContext);
  if (!ctx) throw new Error('usePageHeader outside PageHeaderProvider');
  const { setPageOverride } = ctx;
  const { title, subtitle, actions, breadcrumbs } = patch;

  useEffect(() => {
    setPageOverride({ title, subtitle, actions, breadcrumbs });
    return () => setPageOverride(null);
  }, [setPageOverride, title, subtitle, actions, breadcrumbs]);
}
