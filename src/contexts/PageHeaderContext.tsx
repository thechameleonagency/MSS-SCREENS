import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMeta, type BreadcrumbItem } from '../lib/routeMeta';

export type PageHeaderOverride = {
  title?: string;
  /** Hidden from UI; kept for screen readers and meta. */
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  /** Optional parent link; layout no longer renders a back control (breadcrumbs only). */
  backTo?: string;
  backLabel?: string;
  /**
   * Filters / search / chips — scrolls with page content (not sticky).
   * Prefer this over `toolbarBelow` (alias).
   */
  filtersToolbar?: ReactNode;
  /** @deprecated Use `filtersToolbar` — same slot, kept for backward compatibility. */
  toolbarBelow?: ReactNode;
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
      backTo: override?.backTo,
      backLabel: override?.backLabel,
      filtersToolbar: override?.filtersToolbar ?? override?.toolbarBelow,
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

type MergedHeader = ReturnType<typeof getPageMeta> & {
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  filtersToolbar?: ReactNode;
};
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
  const { title, subtitle, actions, breadcrumbs, backTo, backLabel, toolbarBelow, filtersToolbar } = patch;
  const resolvedFilters = filtersToolbar ?? toolbarBelow;

  useLayoutEffect(() => {
    setPageOverride({
      title,
      subtitle,
      actions,
      breadcrumbs,
      backTo,
      backLabel,
      filtersToolbar: resolvedFilters,
    });
    return () => setPageOverride(null);
  }, [setPageOverride, title, subtitle, actions, breadcrumbs, backTo, backLabel, resolvedFilters]);
}
