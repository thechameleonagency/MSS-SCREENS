import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHeaderProvider, useMergedPageHeader } from '../contexts/PageHeaderContext';
import { useRole, ROLES, useDataRefresh } from '../contexts/AppProviders';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { DEFAULT_APP_SUBTITLE, DEFAULT_COMPANY_DISPLAY_NAME } from '../lib/branding';
import { getNavPins, toggleNavPin } from '../lib/navPins';
import { getItem } from '../lib/storage';
import { canAccessPath } from '../lib/permissions';
import type { AppNotification, CompanyProfile, User, UserRole } from '../types';
import { GlobalSearch } from './GlobalSearch';
import { PrototypeScopeNotice } from './PrototypeScopeNotice';
import { IconBellRound, IconChevronDown, IconNavPin, IconPanel, IconPlus, IconSettings } from './icons';
import { cn } from '../lib/utils';
import { ShellButton } from './ShellButton';

function normalizePath(pathname: string): string {
  const t = pathname.replace(/\/$/, '');
  return t === '' ? '/' : t;
}

function navItemActive(pathname: string, _search: string, to: string): boolean {
  const p = normalizePath(pathname);

  if (to === '/sales/enquiries') return p === '/sales/enquiries' || p.startsWith('/sales/enquiries/');
  if (to === '/sales/quotations') return p === '/sales/quotations' || p.startsWith('/sales/quotations/');
  if (to === '/sales/agents') return p === '/sales/agents' || p.startsWith('/sales/agents/');
  if (to.startsWith('/sales/')) return p === to || p.startsWith(`${to}/`);

  if (to === '/inventory') {
    if (p === '/inventory') return true;
    if (!p.startsWith('/inventory/')) return false;
    return true;
  }
  if (to.startsWith('/inventory/')) return p === to || p.startsWith(`${to}/`);

  if (to === '/presets') return p === '/presets' || p.startsWith('/presets/');

  if (to === '/finance/hub') {
    return (
      p === '/finance/hub' ||
      p === '/finance/transactions' ||
      p.startsWith('/finance/transactions/')
    );
  }
  if (to === '/finance/loans') return p === '/finance/loans' || p.startsWith('/finance/loans/');
  if (to === '/finance/billing') {
    return (
      p === '/finance/billing' ||
      p.startsWith('/finance/invoices') ||
      p.startsWith('/finance/sale-bills') ||
      p.startsWith('/finance/payments')
    );
  }
  if (to === '/finance/partners-vendors') {
    return (
      p === '/finance/partners-vendors' ||
      p.startsWith('/finance/vendors') ||
      p.startsWith('/finance/partners') ||
      p.startsWith('/finance/channel-partners')
    );
  }
  if (to === '/finance/customers') return p === '/finance/customers' || p.startsWith('/finance/customers/');
  if (to === '/finance/transactions') return p === '/finance/transactions';
  if (to === '/finance/accounting') {
    return (
      p === '/finance/accounting' ||
      p.startsWith('/finance/chart-of-accounts') ||
      p.startsWith('/finance/expense-audit')
    );
  }

  if (to === '/hr/employees') return p === '/hr/employees' || p.startsWith('/hr/employees/');
  if (to === '/hr/attendance') return p === '/hr/attendance' || p.startsWith('/hr/attendance/');
  if (to === '/hr/payroll') return p === '/hr/payroll';
  if (to === '/hr/holidays') return p === '/hr/holidays';
  if (to === '/hr/deployment') return p === '/hr/deployment';
  if (to === '/hr/tasks') return p === '/hr/tasks' || p.startsWith('/hr/tasks/');

  if (to === '/projects/active-sites') return p.startsWith('/projects/active-sites');
  if (to === '/projects/summaries') return p === '/projects/summaries';
  if (to === '/projects') {
    if (p !== '/projects') return false;
    return true;
  }

  if (to === '/analytics') return p === '/analytics' || p.startsWith('/analytics/');
  if (to === '/audit') return pathname.startsWith('/audit');

  const t = normalizePath(to);
  return p === t || p.startsWith(`${t}/`);
}

function groupContainsActive(
  children: { to: string; label: string }[],
  pathname: string,
  search: string
): boolean {
  return children.some((c) => navItemActive(pathname, search, c.to));
}

const nav: {
  label: string;
  children: { to: string; label: string }[];
}[] = [
  {
    label: 'Dashboard',
    children: [{ to: '/dashboard', label: 'Overview' }],
  },
  {
    label: 'Sales',
    children: [
      { to: '/sales/enquiries', label: 'Enquiries' },
      { to: '/sales/quotations', label: 'Quotations' },
      { to: '/sales/agents', label: 'Agents' },
    ],
  },
  {
    label: 'Team',
    children: [
      { to: '/hr/employees', label: 'Employees' },
      { to: '/hr/attendance', label: 'Attendance' },
      { to: '/hr/payroll', label: 'Payroll' },
      { to: '/hr/holidays', label: 'Holidays' },
      { to: '/hr/deployment', label: 'Deployment' },
    ],
  },
  {
    label: 'Tasks',
    children: [{ to: '/hr/tasks', label: 'All tasks' }],
  },
  {
    label: 'Materials & Tools',
    children: [{ to: '/inventory', label: 'Materials & Tools' }],
  },
  {
    label: 'Projects',
    children: [
      { to: '/projects', label: 'All projects' },
      { to: '/projects/active-sites', label: 'Active sites' },
      { to: '/projects/summaries', label: 'Project summaries' },
    ],
  },
  {
    label: 'Finance',
    children: [
      { to: '/finance/hub', label: 'Finance center' },
      { to: '/finance/customers', label: 'Customers' },
      { to: '/finance/transactions', label: 'Transactions' },
      { to: '/finance/billing', label: 'Billing & payments' },
      { to: '/finance/partners-vendors', label: 'Vendors & partners' },
      { to: '/finance/loans', label: 'Loans' },
      { to: '/finance/accounting', label: 'Chart & audit' },
    ],
  },
  {
    label: 'Financial insights',
    children: [
      { to: '/analytics', label: 'Analytics' },
      { to: '/audit', label: 'Financial audit' },
    ],
  },
  {
    label: 'Presets',
    children: [{ to: '/presets', label: 'Presets' }],
  },
];

const NAV_SECTIONS_STORAGE_KEY = 'mms-nav-sections';

/** Collapsible groups: only Sales + Projects expanded by default; rest false. */
function defaultNavOpenState(): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  for (const g of nav) {
    if (g.children.length > 1) {
      o[g.label] = g.label === 'Sales' || g.label === 'Projects';
    }
  }
  return o;
}

function loadNavOpenMerged(): Record<string, boolean> {
  const base = defaultNavOpenState();
  try {
    const raw = localStorage.getItem(NAV_SECTIONS_STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    for (const k of Object.keys(base)) {
      if (typeof saved[k] === 'boolean') base[k] = saved[k] as boolean;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return base;
}

function QuickAddMenu({ role, onClose }: { role: UserRole; onClose: () => void }) {
  const links: { to: string; label: string }[] = [];
  if (canAccessPath(role, '/sales/quotations/new')) links.push({ to: '/sales/quotations/new', label: 'New quotation' });
  if (canAccessPath(role, '/finance/invoices/new')) links.push({ to: '/finance/invoices/new', label: 'New invoice' });
  if (canAccessPath(role, '/hr/tasks/new')) links.push({ to: '/hr/tasks/new', label: 'New task' });
  if (canAccessPath(role, '/projects')) links.push({ to: '/projects', label: 'All projects' });
  if (canAccessPath(role, '/sales/enquiries')) links.push({ to: '/sales/enquiries', label: 'Enquiries' });

  return (
    <div
      className="absolute right-0 top-full z-[70] mt-2 w-72 rounded-md border border-border bg-popover py-2 text-popover-foreground shadow-md"
      role="menu"
    >
      <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick add</p>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onClose}
          className="block px-3 py-2 text-sm text-foreground transition hover:bg-muted"
          role="menuitem"
        >
          {l.label}
        </Link>
      ))}
      {links.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No actions for this role</p>}
    </div>
  );
}

function PageHeaderBar() {
  const { title, breadcrumbs, actions } = useMergedPageHeader();
  const lastIdx = breadcrumbs.length - 1;

  return (
    <header className="space-y-0">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex min-w-0 items-center gap-x-2">
              {i > 0 && <span className="shrink-0 text-muted-foreground/50" aria-hidden>/</span>}
              {b.to ? (
                <Link
                  to={b.to}
                  className="truncate font-medium underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-tertiary hover:decoration-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {b.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate font-semibold text-foreground underline decoration-border underline-offset-4',
                    i === lastIdx && 'text-sm sm:text-base'
                  )}
                >
                  {b.label}
                </span>
              )}
            </span>
          ))}
        </nav>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        ) : null}
      </div>
      <h1 className="sr-only">{title}</h1>
    </header>
  );
}

function StickyPageHeader() {
  return (
    <div
      className={cn(
        'sticky top-14 z-30 -mx-4 my-2 bg-background/95 px-4 py-3 backdrop-blur-md',
        'supports-[backdrop-filter]:bg-background/85 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8'
      )}
    >
      <PageHeaderBar />
    </div>
  );
}

function PageFiltersSlot() {
  const { filtersToolbar } = useMergedPageHeader();
  if (!filtersToolbar) return null;
  return (
    <div className="-mx-4 px-4 py-3 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">{filtersToolbar}</div>
  );
}

function LayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [pinTick, setPinTick] = useState(0);
  const [navOpen, setNavOpen] = useState<Record<string, boolean>>(loadNavOpenMerged);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const { role, setRole } = useRole();
  const { version: dataVersion } = useDataRefresh();
  const loc = useLocation();
  const navFn = useNavigate();
  const companyProfile = useMemo(() => getItem<CompanyProfile>('companyProfile'), [dataVersion]);
  const companyDisplayName = useMemo(() => {
    return (companyProfile?.name && companyProfile.name.trim()) || DEFAULT_COMPANY_DISPLAY_NAME;
  }, [companyProfile]);
  const companyLogo = companyProfile?.logo?.trim() || '';
  const notifications = useLiveCollection<AppNotification>('notifications');
  const users = useLiveCollection<User>('users');
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const currentUserDisplay = useMemo(() => {
    const u = users.find((x) => x.role === role) ?? users[0];
    return u?.name?.trim() || role;
  }, [users, role]);
  const userInitials = useMemo(() => {
    const parts = currentUserDisplay.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    return currentUserDisplay.slice(0, 2).toUpperCase();
  }, [currentUserDisplay]);

  const filteredNav = useMemo(
    () =>
      nav
        .map((g) => ({
          ...g,
          children: g.children.filter((c) => canAccessPath(role, c.to)),
        }))
        .filter((g) => g.children.length > 0),
    [role]
  );

  useEffect(() => {
    const bump = () => setPinTick((t) => t + 1);
    window.addEventListener('mms-nav-pins', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('mms-nav-pins', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const pinSet = useMemo(() => new Set(getNavPins()), [pinTick]);

  const pinnedNavItems = useMemo(() => {
    const out: { to: string; label: string }[] = [];
    for (const g of filteredNav) {
      for (const c of g.children) {
        if (pinSet.has(c.to)) out.push(c);
      }
    }
    return out;
  }, [filteredNav, pinSet]);

  useEffect(() => {
    setNavOpen((prev) => {
      const next = { ...prev };
      for (const g of filteredNav) {
        if (g.children.length > 1 && groupContainsActive(g.children, loc.pathname, loc.search)) {
          next[g.label] = true;
        }
      }
      return next;
    });
  }, [loc.pathname, loc.search, filteredNav]);

  useEffect(() => {
    try {
      localStorage.setItem(NAV_SECTIONS_STORAGE_KEY, JSON.stringify(navOpen));
    } catch {
      /* quota / private mode */
    }
  }, [navOpen]);

  if (!canAccessPath(role, loc.pathname)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-foreground">You don&apos;t have access to this page with role &quot;{role}&quot;.</p>
        <ShellButton type="button" variant="default" onClick={() => navFn('/dashboard')}>
          Go to Dashboard
        </ShellButton>
      </div>
    );
  }

  const appShellHeader = (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card/95 px-2 shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-card/85 sm:gap-3 sm:px-4 lg:px-5">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <IconPanel className="text-foreground" size={22} />
      </button>
      <div className="mx-1 min-w-0 flex-1 sm:mx-2 lg:mx-3">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-border/40 pl-1.5 sm:gap-1 sm:pl-2">
        <div className="relative" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => setQuickAddOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={quickAddOpen}
            aria-haspopup="menu"
            aria-label="Quick add"
          >
            <IconPlus size={22} />
          </button>
          {quickAddOpen && (
            <>
              <button type="button" className="fixed inset-0 z-[60] cursor-default bg-transparent" aria-hidden onClick={() => setQuickAddOpen(false)} />
              <QuickAddMenu role={role} onClose={() => setQuickAddOpen(false)} />
            </>
          )}
        </div>
        {canAccessPath(role, '/utilities/notifications') && (
          <Link
            to="/utilities/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <IconBellRound size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}
        {canAccessPath(role, '/settings') && (
          <Link
            to="/settings?tab=company"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted hover:text-tertiary"
            aria-label="Settings"
            title="Settings"
          >
            <IconSettings size={22} />
          </Link>
        )}
        <div
          className="hidden max-w-[10rem] shrink-0 items-center gap-2 rounded-full border border-border bg-muted/50 py-1 pl-1 pr-2.5 sm:flex"
          title={currentUserDisplay}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {userInitials}
          </span>
          <span className="truncate text-xs font-medium text-foreground">{currentUserDisplay}</span>
        </div>
        <label className="ml-1 flex shrink-0 items-center gap-2 rounded-lg border border-input bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="hidden text-xs text-muted-foreground lg:inline">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="max-w-[7rem] cursor-pointer rounded-md border-0 bg-transparent text-xs font-medium text-foreground focus:ring-0 sm:max-w-none sm:text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-popover text-popover-foreground">
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 flex w-[min(17rem,calc(100vw-1.5rem))] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out sm:w-60',
          sidebarOpen
            ? 'z-50 translate-x-0 shadow-xl'
            : '-translate-x-full max-lg:pointer-events-none max-lg:z-0',
          'lg:z-30 lg:translate-x-0 lg:shadow-none lg:pointer-events-auto'
        )}
      >
        <Link
          to="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="flex shrink-0 items-center gap-3 border-b border-sidebar-border px-3 py-4 transition-colors hover:bg-sidebar-hover"
        >
          {companyLogo ? (
            <img src={companyLogo} alt="" className="h-10 w-10 shrink-0 object-contain object-left" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-tertiary text-sm font-bold text-primary-foreground">
              M
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight text-sidebar-foreground">{companyDisplayName}</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/65">
              {DEFAULT_APP_SUBTITLE}
            </span>
          </span>
        </Link>
        <div className="flex h-11 shrink-0 items-center border-b border-sidebar-border px-3 lg:hidden">
          <span className="text-sm font-semibold text-foreground">Navigation</span>
          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-hover"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 pb-6 text-sm">
          {pinnedNavItems.length > 0 && (
            <ul className="mb-2 space-y-0.5 border-b border-sidebar-border/60 pb-2">
              {pinnedNavItems.map((item) => (
                <li key={item.to} className="flex items-center gap-0.5">
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      navItemActive(loc.pathname, loc.search, item.to)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-hover'
                    )}
                  >
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-sidebar-hover hover:text-foreground"
                    title="Unpin"
                    aria-label={`Unpin ${item.label}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleNavPin(item.to);
                    }}
                  >
                    <IconNavPin size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {filteredNav.map((group) => {
            const multi = group.children.length > 1;
            const hasActive = groupContainsActive(group.children, loc.pathname, loc.search);
            const childrenVisible = group.children.filter((c) => !pinSet.has(c.to));

            if (!multi) {
              const item = group.children[0]!;
              return (
                <div key={group.label} className="mb-1">
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      navItemActive(loc.pathname, loc.search, item.to)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-hover'
                    )}
                  >
                    {group.label}
                  </Link>
                </div>
              );
            }

            if (childrenVisible.length === 0) {
              return null;
            }

            const expanded = navOpen[group.label] ?? hasActive;

            return (
              <div key={group.label} className="mb-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-hover"
                  onClick={() =>
                    setNavOpen((s) => {
                      const prev = s[group.label] ?? false;
                      return { ...s, [group.label]: !prev };
                    })
                  }
                  aria-expanded={expanded}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                  <span className="flex shrink-0 items-center text-muted-foreground" title={expanded ? 'Collapse' : 'Expand'}>
                    <IconChevronDown
                      size={16}
                      className={cn('transition-transform', expanded && 'rotate-180')}
                      aria-hidden
                    />
                  </span>
                </button>
                {expanded && (
                  <ul className="ml-1 mt-1 space-y-0.5 border-l-2 border-sidebar-border/80 pl-2.5">
                    {childrenVisible.map((item) => (
                      <li key={item.to} className="group/pinrow flex items-stretch gap-0.5">
                        <Link
                          to={item.to}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            navItemActive(loc.pathname, loc.search, item.to)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                              : 'text-sidebar-foreground hover:bg-sidebar-hover'
                          )}
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          title="Pin to top of sidebar"
                          aria-label={`Pin ${item.label} to top of sidebar`}
                          className="flex w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 opacity-0 transition-opacity hover:bg-sidebar-hover hover:text-foreground focus-visible:opacity-100 group-hover/pinrow:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleNavPin(item.to);
                          }}
                        >
                          <IconNavPin size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-foreground/35 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden lg:pl-60">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {appShellHeader}
          <div className="px-4 pb-5 pt-0 sm:px-5 sm:pb-6 lg:px-8 lg:pb-8">
            <StickyPageHeader />
            <PageFiltersSlot />
            <Outlet />
            <PrototypeScopeNotice />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <PageHeaderProvider>
      <LayoutShell />
    </PageHeaderProvider>
  );
}
