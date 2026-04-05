import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { ShellButton } from '../../components/ShellButton';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { computeFinanceSnapshot } from '../../lib/financeMetrics';
import {
  aggregateGstActivity,
  buildProfitLossStatement,
  exportAuditCsv,
  lastNMonthlyFlows,
  rollupExpensesByTaxonomyKey,
  rollupIncomeByTaxonomyKey,
} from '../../lib/financeInsights';
import { formatINRDecimal, taskEffectiveStatus } from '../../lib/helpers';
import type {
  CompanyExpense,
  IncomeRecord,
  Invoice,
  Material,
  Payment,
  Project,
  PurchaseBill,
  SaleBill,
  Task,
  User,
} from '../../types';

type Period = 'month' | 'quarter' | 'year';
type TabKey = 'financial' | 'operations';

function periodBounds(p: Period): { start: string; end: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (p === 'month') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }
  if (p === 'quarter') {
    const qStartM = Math.floor(m / 3) * 3;
    const start = new Date(y, qStartM, 1);
    const end = new Date(y, qStartM + 3, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `Q${Math.floor(m / 3) + 1} ${y}`,
    };
  }
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `Year ${y}`,
  };
}

function inRange(isoDate: string, start: string, end: string): boolean {
  const d = isoDate.slice(0, 10);
  return d >= start && d <= end;
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{formatINRDecimal(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-tertiary/80" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const projects = useLiveCollection<Project>('projects');
  const invoices = useLiveCollection<Invoice>('invoices');
  const saleBills = useLiveCollection<SaleBill>('saleBills');
  const purchaseBills = useLiveCollection<PurchaseBill>('purchaseBills');
  const payments = useLiveCollection<Payment>('payments');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomeRecords = useLiveCollection<IncomeRecord>('incomeRecords');
  const materials = useLiveCollection<Material>('materials');
  const users = useLiveCollection<User>('users');
  const tasks = useLiveCollection<Task>('tasks');
  const [period, setPeriod] = useState<Period>('month');
  const [tab, setTab] = useState<TabKey>('financial');
  const [exporting, setExporting] = useState(false);

  const { start, end, label } = useMemo(() => periodBounds(period), [period]);

  const projectsInPeriod = useMemo(
    () => projects.filter((p) => inRange(p.createdAt, start, end)),
    [projects, start, end]
  );

  const paymentsInPeriod = useMemo(
    () => payments.filter((p) => inRange(p.date, start, end)),
    [payments, start, end]
  );

  const expensesInPeriod = useMemo(
    () => expenses.filter((e) => inRange(e.date, start, end)),
    [expenses, start, end]
  );

  const incomeInPeriod = useMemo(
    () => incomeRecords.filter((i) => inRange(i.date, start, end) && !i.isOutgoing),
    [incomeRecords, start, end]
  );

  const saleRecvInPeriod = useMemo(() => {
    return saleBills
      .filter((b) => inRange(b.date, start, end))
      .reduce((s, b) => s + b.received, 0);
  }, [saleBills, start, end]);

  const snapAll = useMemo(
    () =>
      computeFinanceSnapshot({
        invoices,
        saleBills,
        companyExpenses: expenses,
        incomeRecords,
      }),
    [invoices, saleBills, expenses, incomeRecords]
  );

  const snapScoped = useMemo(
    () =>
      computeFinanceSnapshot({
        invoices,
        saleBills,
        companyExpenses: expensesInPeriod,
        incomeRecords: incomeInPeriod,
      }),
    [invoices, saleBills, expensesInPeriod, incomeInPeriod]
  );

  const revenueInPeriod = useMemo(
    () => paymentsInPeriod.reduce((s, p) => s + p.amount, 0),
    [paymentsInPeriod]
  );

  const pnl = useMemo(
    () => buildProfitLossStatement({ invoices, saleBills, companyExpenses: expenses, incomeRecords }),
    [invoices, saleBills, expenses, incomeRecords]
  );

  const gst = useMemo(
    () => aggregateGstActivity({ invoices, saleBills, purchaseBills }),
    [invoices, saleBills, purchaseBills]
  );

  const monthly = useMemo(
    () => lastNMonthlyFlows(6, { payments, expenses, incomes: incomeRecords }),
    [payments, expenses, incomeRecords]
  );

  const monthlyMax = useMemo(
    () => Math.max(1, ...monthly.flatMap((m) => [m.payments, m.expenses, m.incomeLines])),
    [monthly]
  );

  const expenseRollupAll = useMemo(() => rollupExpensesByTaxonomyKey(expenses), [expenses]);
  const expenseRollupPeriod = useMemo(() => rollupExpensesByTaxonomyKey(expensesInPeriod), [expensesInPeriod]);
  const incomeRollupPeriod = useMemo(() => rollupIncomeByTaxonomyKey(incomeInPeriod), [incomeInPeriod]);

  const stockValue = useMemo(
    () => materials.reduce((s, m) => s + m.currentStock * m.purchaseRate, 0),
    [materials]
  );

  const lowStock = useMemo(() => materials.filter((m) => m.currentStock <= m.minStock).length, [materials]);

  const projMix = useMemo(() => {
    const m: Record<string, number> = { Residential: 0, Commercial: 0, Industrial: 0, Other: 0 };
    for (const p of projectsInPeriod) {
      const k = p.category in m ? p.category : 'Other';
      m[k] = (m[k] ?? 0) + 1;
    }
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return (Object.entries(m) as [string, number][]).map(([k, v]) => ({
      key: k,
      count: v,
      pct: Math.round((v / total) * 1000) / 10,
    }));
  }, [projectsInPeriod]);

  const typeMix = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of projects) {
      m[p.type] = (m[p.type] ?? 0) + 1;
    }
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(m)
      .map(([k, v]) => ({ key: k, count: v, pct: Math.round((v / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const topPerformers = useMemo(() => {
    const byUser: Record<string, { name: string; done: number; total: number }> = {};
    for (const t of tasks) {
      const done = taskEffectiveStatus(t) === 'Completed' || t.status === 'Completed';
      if (!inRange(t.updatedAt, start, end) && !inRange(t.createdAt, start, end)) continue;
      for (const uid of t.assignedTo) {
        const u = users.find((x) => x.id === uid);
        if (!byUser[uid]) byUser[uid] = { name: u?.name ?? uid, done: 0, total: 0 };
        byUser[uid].total += 1;
        if (done) byUser[uid].done += 1;
      }
    }
    return Object.values(byUser)
      .filter((x) => x.total > 0)
      .map((x) => ({
        ...x,
        pct: Math.round((x.done / x.total) * 1000) / 10,
      }))
      .sort((a, b) => b.done - a.done)
      .slice(0, 10);
  }, [tasks, users, start, end]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    expensesInPeriod.forEach((e) => {
      const k = e.pillar ?? e.category.split('›')[0]?.trim() ?? 'Other';
      m[k] = (m[k] ?? 0) + e.amount;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [expensesInPeriod]);

  const pctSum = projMix.reduce((s, x) => s + x.pct, 0);
  const openInv = invoices.filter((i) => i.balance > 0).length;

  usePageHeader({
    title: 'Financial analytics',
    subtitle: `${label} · Revenue, tax, expenses, and operations`,
    actions: (
      <div className="flex flex-wrap gap-2">
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() => {
            setExporting(true);
            const csv = exportAuditCsv('analytics_summary', [
              { metric: 'period_label', value: label },
              { metric: 'payments_in_period', value: revenueInPeriod },
              { metric: 'sale_bills_received_in_period', value: saleRecvInPeriod },
              { metric: 'expenses_in_period', value: expensesInPeriod.reduce((s, e) => s + e.amount, 0) },
              { metric: 'income_lines_in_period', value: incomeInPeriod.reduce((s, r) => s + r.amount, 0) },
              { metric: 'gst_net_payable_model', value: gst.netTaxPayable },
              { metric: 'pnl_net_indicative', value: pnl.netIncome },
            ]);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `analytics-summary-${period}-${Date.now()}.csv`;
            a.click();
            setExporting(false);
          }}
        >
          {exporting ? '…' : 'Export CSV summary'}
        </ShellButton>
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() => {
            setExporting(true);
            const blob = new Blob(
              [
                JSON.stringify(
                  {
                    period: label,
                    start,
                    end,
                    tab,
                    revenueInPeriod,
                    saleBillsReceivedInPeriod: saleRecvInPeriod,
                    gst,
                    pnl,
                    snapScoped,
                    snapAll,
                    projectsInPeriod: projectsInPeriod.length,
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
            a.download = `analytics-${period}-${Date.now()}.json`;
            a.click();
            setExporting(false);
          }}
        >
          Export JSON
        </ShellButton>
        <Link to="/audit/gst" className="inline-flex h-10 items-center rounded-md border border-input bg-secondary px-4 text-sm font-medium">
          GST audit
        </Link>
      </div>
    ),
  });

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'financial', label: 'Financial' },
    { id: 'operations', label: 'Operations' },
  ];

  return (
    <div className="space-y-6">
      <div className="sticky-page-subnav -mx-1 space-y-3 border-b border-border bg-background/95 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? 'This month' : p === 'quarter' ? 'This quarter' : 'This year'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                tab === t.id ? 'bg-tertiary-muted text-tertiary-muted-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'financial' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md">
              <p className="text-xs font-medium uppercase text-muted-foreground">Invoice payments (period)</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatINRDecimal(revenueInPeriod)}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-medium uppercase text-muted-foreground">Sale bills received (period)</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatINRDecimal(saleRecvInPeriod)}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-medium uppercase text-muted-foreground">Expenses (period)</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatINRDecimal(expensesInPeriod.reduce((s, e) => s + e.amount, 0))}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-medium uppercase text-muted-foreground">Other income (period)</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatINRDecimal(incomeInPeriod.reduce((s, r) => s + r.amount, 0))}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="md">
              <CardHeader title="GST snapshot (all documents)" description="Output − input from stored tax components" />
              <ul className="mt-3 space-y-1 text-sm">
                <li>Output tax: {formatINRDecimal(gst.outputTax)}</li>
                <li>Input tax: {formatINRDecimal(gst.inputTax)}</li>
                <li className="font-semibold">Net (model): {formatINRDecimal(gst.netTaxPayable)}</li>
                <li className="text-xs text-muted-foreground">
                  Invoices w/ breakup: {gst.invoicesWithBreakup} · Sale bills: {gst.saleBillsWithBreakup} · Purchase bills w/ GST lines:{' '}
                  {gst.billsWithGstItems}
                </li>
              </ul>
            </Card>
            <Card padding="md">
              <CardHeader title="P&amp;L (indicative, all-time)" description="Same basis as Audit → Profit &amp; loss" />
              <p className="mt-2 text-2xl font-bold tabular-nums">{formatINRDecimal(pnl.netIncome)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Uses received on AR docs minus all company expenses plus income register.</p>
            </Card>
          </div>

          <Card padding="md">
            <CardHeader title="Last 6 months — cash signals" description="Payments vs expenses vs income lines (not bank reconciled)" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {monthly.map((mo) => (
                <div key={mo.monthKey} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground">{mo.label}</p>
                  <div className="mt-3 space-y-3">
                    <BarRow label="Payments" value={mo.payments} max={monthlyMax} />
                    <BarRow label="Expenses" value={mo.expenses} max={monthlyMax} />
                    <BarRow label="Income lines" value={mo.incomeLines} max={monthlyMax} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <CardHeader
                title={`Expense taxonomy (${label})`}
                description="Top leaves by mapped key — full list in Audit → Expense audit"
              />
              <DataTableShell bare className="mt-3 max-h-72 overflow-y-auto">
                <table className={dataTableClasses}>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRollupPeriod.slice(0, 12).map((r) => (
                      <tr key={r.key}>
                        <td className="max-w-[10rem] truncate font-mono text-[11px]" title={r.key}>
                          {r.key}
                        </td>
                        <td className="text-right tabular-nums">{formatINRDecimal(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableShell>
            </Card>
            <Card padding="md">
              <CardHeader title={`Income taxonomy (${label})`} description="Non-outgoing lines only" />
              <DataTableShell bare className="mt-3 max-h-72 overflow-y-auto">
                <table className={dataTableClasses}>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRollupPeriod.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-muted-foreground">
                          No income in range.
                        </td>
                      </tr>
                    )}
                    {incomeRollupPeriod.slice(0, 12).map((r) => (
                      <tr key={r.key}>
                        <td className="max-w-[10rem] truncate font-mono text-[11px]" title={r.key}>
                          {r.key}
                        </td>
                        <td className="text-right tabular-nums">{formatINRDecimal(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableShell>
            </Card>
          </div>

          <Card padding="md">
            <h2 className="text-base font-semibold">All-time expense taxonomy (top 20)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {expenseRollupAll.slice(0, 20).map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span className="truncate font-mono text-xs text-muted-foreground">{r.key}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatINRDecimal(r.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {tab === 'operations' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md">
              <p className="text-xs uppercase text-muted-foreground">Projects (period)</p>
              <p className="mt-2 text-2xl font-semibold">{projectsInPeriod.length}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs uppercase text-muted-foreground">Open invoices</p>
              <p className="mt-2 text-2xl font-semibold">{openInv}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs uppercase text-muted-foreground">Stock value</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatINRDecimal(stockValue)}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs uppercase text-muted-foreground">Low-stock SKUs</p>
              <p className="mt-2 text-2xl font-semibold">{lowStock}</p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="md">
              <p className="text-xs text-muted-foreground">Net (finance snapshot, period-scoped expenses)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatINRDecimal(snapScoped.netProfit)}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-muted-foreground">All-time reference</p>
              <p className="mt-1 text-sm">
                Revenue {formatINRDecimal(snapAll.totalRevenue)} · Outstanding {formatINRDecimal(snapAll.outstandingReceivables)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <h2 className="text-base font-semibold">Project categories ({label})</h2>
              <p className="mt-1 text-xs text-muted-foreground">Mix ≈ {pctSum.toFixed(1)}%</p>
              <ul className="mt-3 space-y-2 text-sm">
                {projMix.map(({ key, count, pct }) => (
                  <li key={key} className="flex justify-between gap-2">
                    <span>{key}</span>
                    <span className="font-medium tabular-nums">
                      {count} · {pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card padding="md">
              <h2 className="text-base font-semibold">Project types (all data)</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {typeMix.map(({ key, count, pct }) => (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="truncate">{key}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {count} · {pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <h2 className="text-base font-semibold">Expense by pillar ({label})</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {byCat.length === 0 && <li className="text-muted-foreground">No expenses in period.</li>}
                {byCat.slice(0, 16).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="truncate pr-2">{k}</span>
                    <span className="shrink-0 font-medium tabular-nums">{formatINRDecimal(v)}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card padding="md">
              <h2 className="text-base font-semibold">Top performers (tasks · {label})</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {topPerformers.length === 0 && <li className="text-muted-foreground">No assignments in range.</li>}
                {topPerformers.map((x) => (
                  <li key={x.name} className="flex justify-between gap-2">
                    <span className="truncate">{x.name}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {x.done}/{x.total} · {x.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
