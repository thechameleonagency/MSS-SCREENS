import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import type { CompanyExpense, IncomeRecord } from '../../types';

type Row =
  | { kind: 'expense'; id: string; date: string; label: string; amount: number; ref?: string }
  | { kind: 'income'; id: string; date: string; label: string; amount: number; ref?: string };

export function FinanceTransactionsPage() {
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomes = useLiveCollection<IncomeRecord>('incomeRecords');
  const [kind, setKind] = useState<'all' | 'expense' | 'income'>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const e of expenses) {
      out.push({
        kind: 'expense',
        id: e.id,
        date: e.date,
        label: e.category,
        amount: -Math.abs(e.amount),
        ref: e.projectId,
      });
    }
    for (const i of incomes) {
      out.push({
        kind: 'income',
        id: i.id,
        date: i.date,
        label: i.category,
        amount: Math.max(0, i.amount),
        ref: i.projectId,
      });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [expenses, incomes]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind === 'expense' && r.kind !== 'expense') return false;
      if (kind === 'income' && r.kind !== 'income') return false;
      if (!s) return true;
      return r.label.toLowerCase().includes(s) || r.date.includes(s) || (r.ref && r.ref.toLowerCase().includes(s));
    });
  }, [rows, kind, q]);

  usePageHeader({
    title: 'Transactions',
    subtitle: 'Income and expense lines — single ledger-style view (prototype)',
    breadcrumbs: [
      { label: 'Finance', to: '/finance/hub' },
      { label: 'Transactions' },
    ],
  });

  function exportCsv() {
    const header = ['date', 'type', 'description', 'amount_inr', 'project_ref'];
    const lines = filtered.map((r) =>
      [r.date, r.kind, `"${r.label.replace(/"/g, '""')}"`, String(Math.abs(r.amount)), r.ref ?? ''].join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mms-transactions-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted-foreground">
          Type
          <select
            className="select-shell mt-1 block min-w-[10rem]"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="all">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-sm text-muted-foreground">
          Search
          <input
            className="input-shell mt-1 w-full"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Category, date, project id…"
          />
        </label>
        <ShellButton type="button" variant="secondary" onClick={exportCsv}>
          Export CSV
        </ShellButton>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Description</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No rows match.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={`${r.kind}-${r.id}`} className="border-t border-border/80">
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.kind === 'income' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{r.label}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                      r.amount >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {r.amount >= 0 ? '+' : '−'}
                    {formatINRDecimal(Math.abs(r.amount))}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.ref ? (
                      <Link to={`/projects/${r.ref}`} className="text-tertiary hover:underline">
                        Project
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
