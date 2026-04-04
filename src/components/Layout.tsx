import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHeaderProvider, useMergedPageHeader } from '../contexts/PageHeaderContext';
import { useRole, ROLES } from '../contexts/AppProviders';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { canAccessPath } from '../lib/permissions';
import type { AppNotification, UserRole } from '../types';
import { GlobalSearch } from './GlobalSearch';
import { PrototypeScopeNotice } from './PrototypeScopeNotice';
import { IconBell, IconChevronDown, IconChevronRight, IconPanel, IconPlus, IconSettings } from './icons';
import { cn } from '../lib/utils';
import { ShellButton } from './ShellButton';

function normalizePath(pathname: string): string {
  const t = pathname.replace(/\/$/, '');
  return t === '' ? '/' : t;
}

function navItemActive(pathname: string, search: string, to: string): boolean {
  const p = normalizePath(pathname);
  const sp = new URLSearchParams(search);

  if (to === '/projects?view=locations') {
    return p === '/projects' && sp.get('view') === 'locations';
  }

  if (to === '/sales') return p === '/sales';
  if (to.startsWith('/sales/')) return p === to || p.startsWith(`${to}/`);

  if (to === '/inventory') return p === '/inventory';
  if (to.startsWith('/inventory/')) return p === to || p.startsWith(`${to}/`);

  if (to === '/finance/hub') return p === '/finance/hub';
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
  if (to === '/finance/accounting') {
    return (
      p === '/finance/accounting' ||
      p.startsWith('/finance/chart-of-accounts') ||
      p.startsWith('/finance/expense-audit')
    );
  }

  if (to === '/hr/desk') return p === '/hr/desk';
  if (to === '/hr/employees') return p === '/hr/employees' || p.startsWith('/hr/employees/');
  if (to === '/hr/attendance') return p === '/hr/attendance' || p.startsWith('/hr/attendance/');
  if (to === '/hr/payroll') return p === '/hr/payroll';
  if (to === '/hr/holidays') return p === '/hr/holidays';
  if (to === '/hr/deployment') return p === '/hr/deployment';
  if (to === '/hr/tasks') return p === '/hr/tasks' || p.startsWith('/hr/tasks/');

  if (to === '/projects/active-sites') return p.startsWith('/projects/active-sites');
  if (to === '/projects/timeline') return p.startsWith('/projects/timeline');
  if (to === '/projects') {
    if (p === '/projects') return sp.get('view') !== 'locations';
    const rest = p.replace(/^\/projects/, '') || '/';
    if (rest === '/') return false;
    const seg = rest.split('/').filter(Boolean)[0] ?? '';
    return !['active-sites', 'sites', 'timeline'].includes(seg);
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
      { to: '/sales', label: 'Desk' },
      { to: '/sales/enquiries', label: 'Enquiries' },
      { to: '/sales/quotations', label: 'Quotations' },
      { to: '/sales/customers', label: 'Customers' },
      { to: '/sales/agents', label: 'Agents' },
    ],
  },
  {
    label: 'Projects',
    children: [
      { to: '/projects', label: 'All projects' },
      { to: '/projects/active-sites', label: 'Active sites' },
      { to: '/projects?view=locations', label: 'Install locations' },
      { to: '/projects/timeline', label: 'Timeline' },
    ],
  },
  {
    label: 'Inventory',
    children: [
      { to: '/inventory', label: 'Desk' },
      { to: '/inventory/materials', label: 'Materials' },
      { to: '/inventory/tools', label: 'Tools' },
      { to: '/inventory/presets', label: 'Presets' },
    ],
  },
  {
    label: 'Finance',
    children: [
      { to: '/finance/hub', label: 'Finance center' },
      { to: '/finance/billing', label: 'Billing & payments' },
      { to: '/finance/partners-vendors', label: 'Vendors & partners' },
      { to: '/finance/loans', label: 'Loans' },
      { to: '/finance/accounting', label: 'Chart & audit' },
    ],
  },
  {
    label: 'Insights',
    children: [
      { to: '/analytics', label: 'Analytics' },
      { to: '/audit', label: 'Audit' },
    ],
  },
  {
    label: 'Team',
    children: [
      { to: '/hr/desk', label: 'HR desk' },
      { to: '/hr/employees', label: 'Employees' },
      { to: '/hr/attendance', label: 'Attendance' },
      { to: '/hr/payroll', label: 'Payroll' },
      { to: '/hr/holidays', label: 'Holidays' },
      { to: '/hr/deployment', label: 'Deployment' },
      { to: '/hr/tasks', label: 'Tasks' },
    ],
  },
];

function QuickAddMenu({ role, onClose }: { role: UserRole; onClose: () => void }) {
  const links: { to: string; label: string }[] = [];
  if (canAccessPath(role, '/sales/quotations/new')) links.push({ to: '/sales/quotations/new', label: 'New quotation' });
  if (canAccessPath(role, '/finance/invoices/new')) links.push({ to: '/finance/invoices/new', label: 'New invoice' });
  if (canAccessPath(role, '/hr/tasks/new')) links.push({ to: '/hr/tasks/new', label: 'New task' });
  if (canAccessPath(role, '/projects')) links.push({ to: '/projects', label: 'All projects' });
  if (canAccessPath(role, '/sales/enquiries')) links.push({ to: '/sales/enquiries', label: 'Enquiries' });

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md border border-border bg-popover py-2 text-popover-foreground shadow-md"
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
  const { title, breadcrumbs, actions, toolbarBelow } = useMergedPageHeader();
  const lastIdx = breadcrumbs.length - 1;

  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <IconChevronRight size={14} className="shrink-0 text-muted-foreground/45" aria-hidden />
              )}
              {b.to ? (
                <Link
                  to={b.to}
                  className="truncate font-medium transition-colors hover:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {b.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate font-semibold text-foreground',
                    i === lastIdx && 'text-base sm:text-lg'
                  )}
                >
                  {b.label}
                </span>
              )}
            </span>
          ))}
        </nav>
        {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {toolbarBelow ? <div className="flex flex-col gap-3">{toolbarBelow}</div> : null}
      <h1 className="sr-only">{title}</h1>
    </header>
  );
}

function LayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [navOpen, setNavOpen] = useState<Record<string, boolean>>({});
  const quickAddRef = useRef<HTMLDivElement>(null);
  const { role, setRole } = useRole();
  const loc = useLocation();
  const navFn = useNavigate();
  const notifications = useLiveCollection<AppNotification>('notifications');
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

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

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card/95 px-2 shadow-[0_1px_0_0_hsl(var(--border)/0.5)] backdrop-blur-md supports-[backdrop-filter]:bg-card/85 sm:gap-3 sm:px-4 lg:px-5">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <IconPanel className="text-foreground" size={22} />
        </button>
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted/80"
          aria-label="MMS home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-tertiary text-sm font-bold text-primary-foreground shadow-sm">
            M
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold tracking-tight text-foreground">Mahi MMS</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Operations</span>
          </span>
        </Link>
        <span className="hidden h-8 w-px shrink-0 bg-gradient-to-b from-transparent via-border to-transparent lg:block" aria-hidden />
        <div className="mx-1 min-w-0 flex-1 border-l border-transparent sm:mx-2 sm:border-border/50 sm:pl-3 lg:mx-3 lg:pl-4">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-border/40 pl-1.5 sm:gap-1 sm:pl-2">
          <div className="relative" ref={quickAddRef}>
            <button
              type="button"
              onClick={() => setQuickAddOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary text-tertiary-foreground shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-expanded={quickAddOpen}
              aria-haspopup="menu"
              aria-label="Quick add"
            >
              <IconPlus size={22} />
            </button>
            {quickAddOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-hidden onClick={() => setQuickAddOpen(false)} />
                <QuickAddMenu role={role} onClose={() => setQuickAddOpen(false)} />
              </>
            )}
          </div>
          {canAccessPath(role, '/utilities/notifications') && (
            <Link
              to="/utilities/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted hover:text-tertiary"
              aria-label="Notifications"
            >
              <IconBell size={22} />
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
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-secondary-foreground sm:flex"
            title="Profile (prototype)"
          >
            {role.slice(0, 1)}
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

      <aside
        className={cn(
          'fixed left-0 top-14 z-40 flex h-[calc(100dvh-3.5rem)] w-[min(17rem,calc(100vw-1.5rem))] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out sm:w-60',
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
          'lg:translate-x-0 lg:shadow-none'
        )}
      >
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
          {filteredNav.map((group) => {
            const multi = group.children.length > 1;
            const hasActive = groupContainsActive(group.children, loc.pathname, loc.search);

            if (!multi) {
              const item = group.children[0]!;
              return (
                <div key={group.label} className="mb-1">
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-semibold tracking-tight transition-colors',
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

            const expanded = navOpen[group.label] !== undefined ? navOpen[group.label]! : hasActive;

            return (
              <div key={group.label} className="mb-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-sidebar-hover"
                  onClick={() =>
                    setNavOpen((s) => {
                      const prev =
                        s[group.label] !== undefined ? s[group.label]! : groupContainsActive(group.children, loc.pathname, loc.search);
                      return { ...s, [group.label]: !prev };
                    })
                  }
                  aria-expanded={expanded}
                >
                  {group.label}
                  <IconChevronDown
                    size={16}
                    className={cn('shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                  />
                </button>
                {expanded && (
                  <ul className="ml-1 mt-1 space-y-0.5 border-l-2 border-sidebar-border/80 pl-2.5">
                    {group.children.map((item) => (
                      <li key={item.to}>
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
                          {item.label}
                        </Link>
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
          className="fixed inset-x-0 bottom-0 top-14 z-30 bg-foreground/35 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-dvh min-h-0 flex-col overflow-hidden pt-14 lg:pl-60">
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <PageHeaderBar />
          <Outlet />
          <PrototypeScopeNotice />
        </main>
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
