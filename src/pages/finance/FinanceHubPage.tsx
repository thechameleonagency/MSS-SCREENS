import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { UnifiedExpenseModal } from '../../components/UnifiedExpenseModal';
import { UnifiedIncomeModal } from '../../components/UnifiedIncomeModal';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import type { CompanyExpense, IncomeRecord, Invoice, Payment } from '../../types';

export function FinanceHubPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomes = useLiveCollection<IncomeRecord>('incomeRecords');
  const [expOpen, setExpOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);

  const revenue = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const invOutstanding = useMemo(() => invoices.reduce((s, i) => s + i.balance, 0), [invoices]);
  const expenseTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const incomeTotal = useMemo(() => incomes.reduce((s, i) => s + Math.max(0, i.amount), 0), [incomes]);
  const net = revenue + incomeTotal - expenseTotal;

  const months = useMemo(() => {
    const out: { key: string; label: string; rev: number; exp: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rev = payments
        .filter((p) => p.date.startsWith(key))
        .reduce((s, p) => s + p.amount, 0);
      const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      out.push({ key, label: d.toLocaleString('default', { month: 'short' }), rev, exp });
    }
    return out;
  }, [payments, expenses]);

  usePageHeader({
    title: 'Finance center',
    subtitle: 'KPIs, trends, and unified expense / income entry',
    actions: (
      <div className="flex flex-wrap gap-2">
        <ShellButton type="button" variant="secondary" onClick={() => setExpOpen(true)}>
          Add expense
        </ShellButton>
        <ShellButton type="button" variant="primary" onClick={() => setIncOpen(true)}>
          Add income
        </ShellButton>
      </div>
    ),
  });

  const maxBar = Math.max(1, ...months.flatMap((m) => [m.rev, m.exp]));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="feature" padding="lg">
          <p className="text-xs font-medium uppercase text-muted-foreground">Revenue (payments)</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{formatINRDecimal(revenue)}</p>
        </Card>
        <Card variant="feature" padding="lg">
          <p className="text-xs font-medium uppercase text-muted-foreground">Outstanding invoices</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{formatINRDecimal(invOutstanding)}</p>
        </Card>
        <Card variant="feature" padding="lg">
          <p className="text-xs font-medium uppercase text-muted-foreground">Expenses (recorded)</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{formatINRDecimal(expenseTotal)}</p>
        </Card>
        <Card variant="feature" padding="lg">
          <p className="text-xs font-medium uppercase text-muted-foreground">Net (prototype)</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{formatINRDecimal(net)}</p>
        </Card>
      </div>

      <Card variant="feature" padding="lg">
        <h2 className="text-base font-semibold text-foreground">6-month trend</h2>
        <p className="mt-1 text-sm text-muted-foreground">Green = client payments · Muted = expenses</p>
        <div className="mt-4 flex h-40 items-end gap-2">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                <div
                  className="w-1/2 max-w-[20px] rounded-t bg-primary/80"
                  style={{ height: `${(m.rev / maxBar) * 100}%`, minHeight: m.rev ? 4 : 0 }}
                  title={`Rev ${m.rev}`}
                />
                <div
                  className="w-1/2 max-w-[20px] rounded-t bg-muted-foreground/40"
                  style={{ height: `${(m.exp / maxBar) * 100}%`, minHeight: m.exp ? 4 : 0 }}
                  title={`Exp ${m.exp}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="feature" padding="lg">
        <h2 className="mb-3 text-base font-semibold text-foreground">Modules</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded-md border border-border bg-card px-3 py-2 font-medium text-primary hover:bg-accent" to="/finance/billing">
            Billing & payments
          </Link>
          <Link className="rounded-md border border-border bg-card px-3 py-2 font-medium text-primary hover:bg-accent" to="/finance/loans">
            Loans
          </Link>
          <Link className="rounded-md border border-border bg-card px-3 py-2 font-medium text-primary hover:bg-accent" to="/finance/partners-vendors">
            Vendors & partners
          </Link>
          <Link className="rounded-md border border-border bg-card px-3 py-2 font-medium text-primary hover:bg-accent" to="/finance/accounting">
            Chart & audit
          </Link>
          <Link className="rounded-md border border-border bg-card px-3 py-2 font-medium text-primary hover:bg-accent" to="/audit">
            Audit suite
          </Link>
        </div>
      </Card>

      <UnifiedExpenseModal open={expOpen} onClose={() => setExpOpen(false)} />
      <UnifiedIncomeModal open={incOpen} onClose={() => setIncOpen(false)} />
    </div>
  );
}
