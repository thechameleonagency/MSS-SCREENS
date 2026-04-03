import { useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHeaderProvider, useMergedPageHeader } from '../contexts/PageHeaderContext';
import { useRole, ROLES } from '../contexts/AppProviders';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { canAccessPath } from '../lib/permissions';
import type { AppNotification, UserRole } from '../types';
import { IconBell, IconChevronLeft, IconHome, IconPanel, IconPlus, IconSearch, IconSettings } from './icons';
import { cn } from '../lib/utils';
import { ShellButton, ShellIconButton } from './ShellButton';

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
      { to: '/sales/agents', label: 'Agents' },
      { to: '/sales/quotations', label: 'Quotations' },
      { to: '/sales/customers', label: 'Customers' },
    ],
  },
  {
    label: 'Projects',
    children: [
      { to: '/projects', label: 'All Projects' },
      { to: '/projects/sites', label: 'Sites' },
      { to: '/projects/timeline', label: 'Timeline' },
    ],
  },
  {
    label: 'Inventory',
    children: [
      { to: '/inventory/materials', label: 'Materials' },
      { to: '/inventory/tools', label: 'Tools' },
      { to: '/inventory/presets', label: 'Presets' },
    ],
  },
  {
    label: 'Finance',
    children: [
      { to: '/finance/invoices', label: 'Invoices' },
      { to: '/finance/sale-bills', label: 'Sale Bills' },
      { to: '/finance/payments', label: 'Payments' },
      { to: '/finance/loans', label: 'Loans' },
      { to: '/finance/vendors', label: 'Vendors' },
      { to: '/finance/partners', label: 'Partners' },
      { to: '/finance/channel-partners', label: 'Channel Partners' },
      { to: '/finance/chart-of-accounts', label: 'Chart of Accounts' },
      { to: '/finance/expense-audit', label: 'Expense Audit' },
    ],
  },
  {
    label: 'HR & Team',
    children: [
      { to: '/hr/employees', label: 'Employees' },
      { to: '/hr/attendance', label: 'Attendance' },
      { to: '/hr/attendance/monthly', label: 'Attendance (monthly)' },
      { to: '/hr/payroll', label: 'Payroll' },
      { to: '/hr/tasks', label: 'Tasks' },
    ],
  },
  {
    label: 'Settings',
    children: [
      { to: '/settings/master-data', label: 'Master Data' },
      { to: '/settings/users', label: 'User Management' },
      { to: '/settings/company', label: 'Company Profile' },
    ],
  },
  {
    label: 'Utilities',
    children: [{ to: '/utilities/notifications', label: 'Notifications' }],
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
          className="block px-3 py-2 text-sm text-foreground transition hover:bg-accent"
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
  const { title, subtitle, breadcrumbs, actions } = useMergedPageHeader();

  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3 lg:items-end">
        <nav
          className="flex flex-wrap items-center justify-end gap-x-1 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              {b.to ? (
                <Link to={b.to} className="transition hover:text-primary">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
        {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

function LayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const { role, setRole } = useRole();
  const loc = useLocation();
  const navFn = useNavigate();
  const notifications = useLiveCollection<AppNotification>('notifications');
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNav = nav
    .map((g) => ({
      ...g,
      children: g.children.filter((c) => canAccessPath(role, c.to)),
    }))
    .filter((g) => g.children.length > 0);

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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar — MMS semantic tokens (light chrome) */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <IconPanel className="text-foreground" size={22} />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-muted">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="hidden font-semibold tracking-tight text-foreground sm:inline">Solar Admin</span>
        </Link>
        <div className="hidden flex-1 justify-center md:flex">
          <div className="inline-flex rounded-full bg-muted p-1">
            <span className="rounded-full bg-background px-4 py-1.5 text-xs font-medium text-foreground shadow-sm">
              Operations
            </span>
            <span className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">Reports</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative hidden max-w-xs flex-1 sm:block md:max-w-[200px] lg:max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="search"
              placeholder="Search…"
              aria-label="Search"
              className="h-10 w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="relative" ref={quickAddRef}>
            <button
              type="button"
              onClick={() => setQuickAddOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-foreground transition hover:bg-muted"
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
          <div
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:flex"
            title="Profile (prototype)"
          >
            {role.slice(0, 1)}
          </div>
          <label className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1 shadow-sm">
            <span className="hidden text-xs text-muted-foreground lg:inline">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="max-w-[9rem] cursor-pointer rounded-md border-0 bg-transparent text-xs font-medium text-foreground focus:ring-0 sm:max-w-none sm:text-sm"
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

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 z-40 w-[min(17rem,85vw)] transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-transform lg:static lg:h-auto lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:translate-x-0',
            sidebarOpen ? 'top-14 translate-x-0' : 'top-14 -translate-x-full lg:translate-x-0',
            'h-[calc(100dvh-3.5rem)] lg:top-0'
          )}
        >
          <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-3 lg:hidden">
            <span className="text-sm font-semibold text-foreground">Menu</span>
            <button
              type="button"
              className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <nav className="scrollbar-thin max-h-[calc(100vh-3.5rem)] overflow-y-auto p-3 text-sm lg:max-h-[calc(100vh-7rem)]">
            {filteredNav.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
                <ul className="space-y-0.5">
                  {group.children.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        {sidebarOpen && (
          <button
            type="button"
            className="fixed left-0 top-14 z-30 h-[calc(100dvh-3.5rem)] w-full bg-foreground/40 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            <PageHeaderBar />
            <Outlet />
          </main>
        </div>

        {/* Right rail (laptop+) */}
        <aside
          className={cn(
            'hidden shrink-0 border-l border-sidebar-border bg-sidebar transition-[width] duration-200 xl:flex xl:flex-col',
            railCollapsed ? 'w-0 overflow-hidden border-0' : 'w-[4.25rem]'
          )}
        >
          <div className="flex flex-col items-center gap-2 py-4">
            <ShellIconButton label="Home" onClick={() => navFn('/dashboard')}>
              <IconHome size={18} />
            </ShellIconButton>
            <ShellIconButton label="Notifications" onClick={() => navFn('/utilities/notifications')}>
              <IconBell size={18} />
            </ShellIconButton>
            <ShellIconButton label="Settings" onClick={() => navFn('/settings/company')}>
              <IconSettings size={18} />
            </ShellIconButton>
            <div className="my-2 w-8 border-t border-sidebar-border" />
            <button
              type="button"
              onClick={() => setRailCollapsed((c) => !c)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={railCollapsed ? 'Expand tools' : 'Collapse tools'}
            >
              <IconChevronLeft size={18} className={railCollapsed ? 'rotate-180' : ''} />
            </button>
          </div>
        </aside>
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
