import { useMemo, useState } from 'react';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import type { CompanyExpense, Invoice, Project, User } from '../../types';

export function AnalyticsPage() {
  const projects = useLiveCollection<Project>('projects');
  const invoices = useLiveCollection<Invoice>('invoices');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const users = useLiveCollection<User>('users');
  const [exporting, setExporting] = useState(false);

  usePageHeader({
    title: 'Analytics',
    subtitle: 'Aggregates from local prototype data',
    actions: (
      <ShellButton
        type="button"
        variant="secondary"
        onClick={() => {
          setExporting(true);
          const blob = new Blob(
            [
              JSON.stringify(
                {
                  projects: projects.length,
                  invoices: invoices.length,
                  expenses: expenses.length,
                  generatedAt: new Date().toISOString(),
                },
                null,
                2
              ),
            ],
            { type: 'application/json' }
          );
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `analytics-export-${Date.now()}.json`;
          a.click();
          setExporting(false);
        }}
      >
        {exporting ? 'Export…' : 'Export summary JSON'}
      </ShellButton>
    ),
  });

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach((e) => {
      const k = e.pillar ?? e.category.split('›')[0]?.trim() ?? 'Other';
      m[k] = (m[k] ?? 0) + e.amount;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const projMix = useMemo(() => {
    const m: Record<string, number> = {};
    projects.forEach((p) => {
      m[p.category] = (m[p.category] ?? 0) + 1;
    });
    return Object.entries(m);
  }, [projects]);

  const revenue = useMemo(() => invoices.reduce((s, i) => s + i.received, 0), [invoices]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Projects</p>
          <p className="mt-2 text-2xl font-semibold">{projects.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Invoice revenue received</p>
          <p className="mt-2 text-2xl font-semibold">{formatINRDecimal(revenue)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Expense lines</p>
          <p className="mt-2 text-2xl font-semibold">{expenses.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Employees</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="text-base font-semibold">Project type mix</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {projMix.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <h2 className="text-base font-semibold">Expense by pillar / category</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {byCat.slice(0, 12).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="truncate pr-2">{k}</span>
                <span className="shrink-0 font-medium">{formatINRDecimal(v)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
