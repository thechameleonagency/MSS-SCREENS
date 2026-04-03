import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { formatINR } from '../lib/helpers';
import type { Invoice, Loan, Material, Project } from '../types';

const barHeights = [40, 65, 45, 80, 55, 70, 50];

export function Dashboard() {
  const projects = useLiveCollection<Project>('projects');
  const invoices = useLiveCollection<Invoice>('invoices');
  const materials = useLiveCollection<Material>('materials');
  const loans = useLiveCollection<Loan>('loans');

  const kpis = useMemo(() => {
    const active = projects.filter((p) => p.status === 'In Progress' || p.status === 'New').length;
    const revenue = invoices.reduce((s, i) => s + i.received, 0);
    const pending = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.balance, 0);
    const lowStock = materials.filter((m) => m.currentStock <= m.minStock).length;
    const emiLoans = loans.filter((l) => l.status === 'Active' && l.type === 'EMI').length;
    return { active, revenue, pending, lowStock, emiLoans };
  }, [projects, invoices, materials, loans]);

  const cards = [
    { label: 'Active / new projects', value: String(kpis.active), to: '/projects', hint: 'Live pipeline' },
    { label: 'Revenue received', value: formatINR(kpis.revenue), to: '/finance/invoices', hint: 'From invoices' },
    { label: 'Pending invoice balance', value: formatINR(kpis.pending), to: '/finance/invoices', hint: 'Collections' },
    { label: 'Low stock SKUs', value: String(kpis.lowStock), to: '/inventory/materials', hint: 'Below minimum' },
    { label: 'Active EMI loans', value: String(kpis.emiLoans), to: '/finance/loans', hint: 'Ongoing' },
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
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="block">
            <Card interactive padding="md" className="h-full">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{c.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.hint}</p>
              <div className="mt-4 flex h-12 items-end gap-1">
                {barHeights.map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-chart-revenue/35 to-chart-revenue"
                    style={{ height: `${(h / 100) * 3}rem` }}
                  />
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">Project status</h2>
          <ul className="space-y-3 text-sm">
            {Object.entries(statusCounts).map(([k, v]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between font-medium text-foreground">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-chart-revenue to-chart-revenue/90 transition-all"
                    style={{ width: `${(v / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">Quick links</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-primary/20 hover:bg-accent"
              to="/sales/enquiries"
            >
              Enquiries
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-primary/20 hover:bg-accent"
              to="/sales/quotations"
            >
              Quotations
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-primary/20 hover:bg-accent"
              to="/hr/attendance"
            >
              Attendance
            </Link>
            <Link
              className="rounded-full border border-border bg-muted/80 px-4 py-2 text-sm font-medium text-accent-foreground transition hover:border-primary/20 hover:bg-accent"
              to="/settings/company"
            >
              Company
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
