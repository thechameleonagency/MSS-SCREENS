import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../components/Card';
import { KpiDrilldownModal } from '../components/KpiDrilldownModal';
import { ShellButton } from '../components/ShellButton';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { formatINR, formatINRDecimal, isOpenEnquiryStatus, taskEffectiveStatus } from '../lib/helpers';
import type {
  Enquiry,
  Invoice,
  Loan,
  Material,
  Payment,
  Project,
  Quotation,
  SaleBill,
  Site,
  Task,
  User,
} from '../types';

type DrillKey =
  | 'revenue'
  | 'active'
  | 'pending'
  | 'employees'
  | 'lowstock'
  | 'emi'
  | 'quo'
  | 'hold'
  | null;

export function Dashboard() {
  const navigate = useNavigate();
  const projects = useLiveCollection<Project>('projects');
  const invoices = useLiveCollection<Invoice>('invoices');
  const saleBills = useLiveCollection<SaleBill>('saleBills');
  const materials = useLiveCollection<Material>('materials');
  const loans = useLiveCollection<Loan>('loans');
  const quotations = useLiveCollection<Quotation>('quotations');
  const users = useLiveCollection<User>('users');
  const tasks = useLiveCollection<Task>('tasks');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const payments = useLiveCollection<Payment>('payments');
  const sites = useLiveCollection<Site>('sites');

  const [drill, setDrill] = useState<DrillKey>(null);

  const kpis = useMemo(() => {
    const invRec = invoices.reduce((s, i) => s + i.received, 0);
    const sbRec = saleBills.reduce((s, b) => s + b.received, 0);
    const totalRevenue = invRec + sbRec;
    const activeProjects = projects.filter((p) => p.status === 'In Progress').length;
    const completed = projects.filter((p) => p.status === 'Completed' || p.status === 'Closed').length;
    const pending = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.balance, 0);
    const pendingCount = invoices.filter((i) => i.status !== 'Paid').length;
    const lowStock = materials.filter((m) => m.currentStock <= m.minStock).length;
    const emiActive = loans.filter((l) => l.status === 'Active' && l.type === 'EMI');
    const pendingQuo = quotations.filter((q) => q.status === 'Draft' || q.status === 'Sent').length;
    const onHold = projects.filter((p) => p.status === 'On Hold').length;
    const activeEmployees = users.filter((u) => u.role !== 'Installation Team').length;
    const inProgressIds = new Set(projects.filter((p) => p.status === 'In Progress').map((p) => p.id));
    const activeSites = sites.filter((s) => inProgressIds.has(s.projectId)).length;
    const openEnquiries = enquiries.filter((e) => isOpenEnquiryStatus(e.status)).length;
    const overdueTasks = tasks.filter(
      (t) => taskEffectiveStatus(t) === 'Overdue' && t.status !== 'Completed'
    ).length;
    return {
      totalRevenue,
      activeProjects,
      completed,
      pending,
      pendingCount,
      lowStock,
      emiActive: emiActive.length,
      pendingQuo,
      onHold,
      activeEmployees,
      activeSites,
      openEnquiries,
      overdueTasks,
    };
  }, [projects, invoices, saleBills, materials, loans, quotations, users, tasks, enquiries, sites]);

  const recentPayments = useMemo(() => {
    return [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [payments]);

  const drillLinks = useMemo(() => {
    if (drill === 'revenue') {
      const links = invoices.map((i) => ({
        label: `${i.invoiceNumber} (${formatINR(i.received)})`,
        to: `/finance/invoices/${i.id}`,
        meta: formatINR(i.total),
      }));
      saleBills.forEach((b) =>
        links.push({
          label: `${b.billNumber} (${formatINR(b.received)})`,
          to: `/finance/sale-bills/${b.id}`,
          meta: formatINR(b.total),
        })
      );
      return { title: 'Revenue breakdown', subtitle: 'Invoices and sale bills (received)', links };
    }
    if (drill === 'active') {
      return {
        title: 'Ongoing projects',
        subtitle: `${kpis.completed} completed / closed overall`,
        links: projects
          .filter((p) => p.status === 'In Progress')
          .map((p) => ({ label: p.name, to: `/projects/${p.id}` })),
      };
    }
    if (drill === 'pending') {
      return {
        title: 'Pending invoice balances',
        subtitle: `${kpis.pendingCount} invoices`,
        links: invoices
          .filter((i) => i.balance > 0)
          .map((i) => ({
            label: i.invoiceNumber,
            to: `/finance/invoices/${i.id}`,
            meta: formatINR(i.balance),
          })),
      };
    }
    if (drill === 'employees') {
      return {
        title: 'Team (ex-field install default)',
        subtitle: 'Click to open profile',
        links: users.map((u) => ({ label: `${u.name} · ${u.role}`, to: `/hr/employees/${u.id}` })),
      };
    }
    if (drill === 'lowstock') {
      return {
        title: 'Low stock',
        subtitle: 'At or below minimum',
        links: materials
          .filter((m) => m.currentStock <= m.minStock)
          .map((m) => ({
            label: m.name,
            to: `/inventory/materials/${m.id}`,
            meta: `${m.currentStock} / min ${m.minStock}`,
          })),
      };
    }
    if (drill === 'emi') {
      return {
        title: 'Active EMI loans',
        subtitle: 'Approx. monthly from outstanding (prototype)',
        links: loans
          .filter((l) => l.status === 'Active' && l.type === 'EMI')
          .map((l) => ({
            label: l.source,
            to: '/finance/loans',
            meta: formatINR(l.outstanding),
          })),
      };
    }
    if (drill === 'quo') {
      return {
        title: 'Pending quotations',
        subtitle: 'Draft or sent',
        links: quotations
          .filter((q) => q.status === 'Draft' || q.status === 'Sent')
          .map((q) => ({ label: q.reference, to: `/sales/quotations/${q.id}` })),
      };
    }
    if (drill === 'hold') {
      return {
        title: 'Projects on hold',
        subtitle: kpis.onHold ? 'Action may be required' : 'All clear',
        links: projects.filter((p) => p.status === 'On Hold').map((p) => ({ label: p.name, to: `/projects/${p.id}` })),
      };
    }
    return { title: '', subtitle: '', links: [] as { label: string; to: string; meta?: string }[] };
  }, [drill, projects, invoices, saleBills, materials, loans, quotations, users, kpis]);

  const explorerCards = [
    {
      key: 'revenue' as const,
      label: 'Total revenue',
      value: formatINR(kpis.totalRevenue),
      hint: 'Invoices + sale bills received',
    },
    {
      key: 'pending' as const,
      label: 'Receivables',
      value: formatINR(kpis.pending),
      hint: `${kpis.pendingCount} invoices with balance`,
    },
    {
      key: 'active' as const,
      label: 'Active projects',
      value: String(kpis.activeProjects),
      hint: `${kpis.completed} completed overall`,
    },
    {
      key: 'quo' as const,
      label: 'Quotations in flight',
      value: String(kpis.pendingQuo),
      hint: 'Draft or sent',
    },
    {
      key: 'lowstock' as const,
      label: 'Low stock SKUs',
      value: String(kpis.lowStock),
      hint: 'At or below minimum',
    },
    {
      key: 'employees' as const,
      label: 'Team roster',
      value: String(users.length),
      hint: `${kpis.activeEmployees} non-field roles`,
    },
    {
      key: 'emi' as const,
      label: 'Active EMI loans',
      value: String(kpis.emiActive),
      hint: 'Outstanding schedules',
    },
    {
      key: 'hold' as const,
      label: 'On hold (detail)',
      value: String(kpis.onHold),
      hint: 'Same as spotlight — full list',
    },
  ];

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    projects.forEach((p) => {
      m[p.status] = (m[p.status] ?? 0) + 1;
    });
    return m;
  }, [projects]);

  const maxStatus = Math.max(1, ...Object.values(statusCounts));

  return (
    <div className="space-y-8">
      <Card variant="feature" padding="lg">
        <CardHeader
          title="Today & this week"
          description="Items that usually need a quick decision or follow-up."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/hr/tasks"
            className="rounded-xl border border-border/80 bg-card/50 p-4 transition-colors hover:border-tertiary/40 hover:bg-muted/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overdue tasks</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.overdueTasks}</p>
            <p className="mt-1 text-xs text-muted-foreground">Open task list →</p>
          </Link>
          <button
            type="button"
            className="rounded-xl border border-border/80 bg-card/50 p-4 text-left transition-colors hover:border-tertiary/40 hover:bg-muted/40"
            onClick={() => setDrill('hold')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projects on hold</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.onHold}</p>
            <p className="mt-1 text-xs text-muted-foreground">Click for list</p>
          </button>
          <Link
            to="/hr/deployment"
            className="rounded-xl border border-border/80 bg-card/50 p-4 transition-colors hover:border-tertiary/40 hover:bg-muted/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deployment window</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">7 days</p>
            <p className="mt-1 text-xs text-muted-foreground">Upcoming field work →</p>
          </Link>
          <Link
            to="/utilities/notifications"
            className="rounded-xl border border-border/80 bg-card/50 p-4 transition-colors hover:border-tertiary/40 hover:bg-muted/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notifications</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">Inbox</p>
            <p className="mt-1 text-xs text-muted-foreground">Approvals & alerts →</p>
          </Link>
        </div>
      </Card>

      <Card variant="feature" padding="lg">
        <CardHeader title="Pipeline" description="Lead flow from first call to live project." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/sales/enquiries"
            className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
          >
            <span className="text-sm font-medium text-muted-foreground">Open enquiries</span>
            <span className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{kpis.openEnquiries}</span>
            <span className="mt-2 text-xs text-primary">Sales enquiries →</span>
          </Link>
          <Link
            to="/sales/quotations"
            className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
          >
            <span className="text-sm font-medium text-muted-foreground">Quotations (draft / sent)</span>
            <span className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{kpis.pendingQuo}</span>
            <span className="mt-2 text-xs text-primary">All quotations →</span>
          </Link>
          <Link
            to="/projects"
            className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
          >
            <span className="text-sm font-medium text-muted-foreground">Active projects</span>
            <span className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{kpis.activeProjects}</span>
            <span className="mt-2 text-xs text-primary">Project board →</span>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="feature" padding="lg">
          <CardHeader title="Cash" description="What you are owed and what recently landed." />
          <button
            type="button"
            className="mt-2 w-full rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/25"
            onClick={() => setDrill('pending')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outstanding receivables</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatINR(kpis.pending)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpis.pendingCount} unpaid / partial invoices · tap for list</p>
          </button>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent payments</h3>
              <Link className="text-xs font-medium text-primary hover:underline" to="/finance/payments">
                All payments
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border/60 text-sm">
                {recentPayments.map((p) => {
                  const inv = invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <li key={p.id} className="flex justify-between gap-2 py-2">
                      <span className="text-muted-foreground">
                        {p.date}
                        {inv ? ` · ${inv.invoiceNumber}` : ''}
                      </span>
                      <span className="shrink-0 font-medium text-foreground">{formatINRDecimal(p.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card variant="feature" padding="lg">
          <CardHeader title="Operations" description="Inventory and sites tied to live work." />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-border/80 bg-card/40 p-4 text-left transition-colors hover:bg-muted/30"
              onClick={() => setDrill('lowstock')}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low stock</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.lowStock}</p>
              <p className="mt-1 text-xs text-muted-foreground">SKUs at or below min</p>
            </button>
            <Link
              to="/projects/active-sites"
              className="rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:bg-muted/30"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Install locations</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.activeSites}</p>
              <p className="mt-1 text-xs text-primary">On in-progress projects →</p>
            </Link>
          </div>
        </Card>
      </div>

      <Card variant="feature" padding="lg">
        <CardHeader title="Quick actions" description="Shortcuts to common workflows" />
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="primary" onClick={() => navigate('/sales/quotations/new')}>
            Create quotation
          </ShellButton>
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/projects')}>
            View projects
          </ShellButton>
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/finance/invoices/new')}>
            Create invoice
          </ShellButton>
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/projects/active-sites')}>
            Active sites
          </ShellButton>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {explorerCards.map((c) => (
            <button
              key={c.key}
              type="button"
              className="w-full text-left"
              onClick={() => setDrill(c.key)}
            >
              <Card interactive variant="feature" padding="lg" className="h-full">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{c.value}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.hint}</p>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <KpiDrilldownModal
        open={drill !== null}
        title={drillLinks.title}
        subtitle={drillLinks.subtitle}
        links={drillLinks.links}
        onClose={() => setDrill(null)}
        footer={
          drill === 'revenue' ? (
            <Link className="text-sm font-medium text-primary" to="/finance/hub">
              Open finance center
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="feature" padding="lg">
          <CardHeader title="Project mix" description="Count by lifecycle status" />
          <ul className="space-y-3 text-sm">
            {Object.entries(statusCounts).map(([k, v]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between font-medium text-foreground">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-tertiary/90 to-primary/80 transition-all"
                    style={{ width: `${(v / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card variant="feature" padding="lg">
          <CardHeader title="More shortcuts" description="Frequently opened areas" />
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-tertiary/30 hover:bg-muted"
              to="/sales/enquiries"
            >
              Enquiries
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-tertiary/30 hover:bg-muted"
              to="/sales/quotations"
            >
              Quotations
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-tertiary/30 hover:bg-muted"
              to="/hr/attendance"
            >
              Attendance
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-tertiary/30 hover:bg-muted"
              to="/settings?tab=company"
            >
              Company
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
