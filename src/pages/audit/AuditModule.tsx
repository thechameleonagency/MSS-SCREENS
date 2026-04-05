import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { ShellButton } from '../../components/ShellButton';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  aggregateGstActivity,
  buildProfitLossStatement,
  cashBankByMode,
  creditorsFromSuppliers,
  debtorsByCustomer,
  exportAuditCsv,
  inventoryValuation,
  rollupExpensesByTaxonomyKey,
  toolsAsFixedAssets,
} from '../../lib/financeInsights';
import { formatINRDecimal } from '../../lib/helpers';
import type {
  AuditLogEntry,
  CompanyExpense,
  Customer,
  Enquiry,
  IncomeRecord,
  Invoice,
  Material,
  Payment,
  Project,
  PurchaseBill,
  Quotation,
  SaleBill,
  Supplier,
  Task,
  Tool,
} from '../../types';
import { getItem } from '../../lib/storage';
import type { CompanyProfile } from '../../types';

const LINKS: { to: string; label: string; note: string }[] = [
  { to: '/audit/chart-of-accounts', label: 'Chart of accounts', note: 'Opens finance COA (read-only redirect)' },
  { to: '/audit/profit-loss', label: 'Profit & loss', note: 'Receipts, other income, expenses' },
  { to: '/audit/inventory', label: 'Inventory audit', note: 'SKU valuation & low-stock' },
  { to: '/audit/debtors-creditors', label: 'Debtors & creditors', note: 'AR by customer · AP by vendor' },
  { to: '/audit/gst', label: 'GST activity', note: 'Output vs input from stored breakups' },
  { to: '/audit/cash-bank', label: 'Cash & bank modes', note: 'Inflows/outflows by instrument' },
  { to: '/audit/expenses', label: 'Expense taxonomy', note: 'Roll-up by unified taxonomy key' },
  { to: '/audit/assets', label: 'Fixed assets (tools)', note: 'NBV estimate from useful life' },
  { to: '/audit/logs', label: 'Audit logs', note: 'Recent mutations' },
  { to: '/audit/reports', label: 'Reports & export', note: 'CSV bundles' },
  { to: '/audit/data-flow', label: 'Data flow', note: 'Counts & relationships' },
];

function AuditHome() {
  const projects = useLiveCollection<Project>('projects');
  const invoices = useLiveCollection<Invoice>('invoices');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  usePageHeader({ title: 'Financial audit suite', subtitle: 'Ledgers, tax, and reconciliation views over live data' });
  return (
    <div className="space-y-6">
      <Card padding="md" variant="feature">
        <CardHeader
          title="Coverage snapshot"
          description={`${projects.length} projects · ${invoices.length} invoices · ${expenses.length} company expenses — open a tile for detail.`}
        />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card padding="md" interactive className="h-full">
              <h3 className="font-semibold text-primary">{l.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{l.note}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AuditDashboardPage() {
  return <AuditHome />;
}

export function AuditChartOfAccountsRedirect() {
  usePageHeader({ title: 'Chart of accounts', subtitle: 'Maintained under Finance' });
  return (
    <Card padding="md">
      <p className="text-sm text-muted-foreground">Chart of accounts is edited from the finance desk. No duplicate editor here.</p>
      <Link className="mt-3 inline-block font-medium text-primary" to="/finance/chart-of-accounts">
        Open chart of accounts
      </Link>
    </Card>
  );
}

export function AuditProfitLossPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const saleBills = useLiveCollection<SaleBill>('saleBills');
  const companyExpenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomeRecords = useLiveCollection<IncomeRecord>('incomeRecords');
  const pnl = buildProfitLossStatement({ invoices, saleBills, companyExpenses, incomeRecords });
  usePageHeader({ title: 'Profit & loss', subtitle: 'Cash-basis receipts vs company expenses (prototype statement)' });
  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm text-muted-foreground">
          Revenue uses <strong>received</strong> on invoices and sale bills (not only invoiced). Other income uses the income register
          excluding outgoing lines. This is a management view, not statutory books.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {pnl.sections.map((s) => (
            <li key={s.label} className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span>{s.label}</span>
              <span className="shrink-0 font-semibold tabular-nums">{formatINRDecimal(s.amount)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 pt-2 text-base font-bold">
            <span>Net (indicative)</span>
            <span className="tabular-nums">{formatINRDecimal(pnl.netIncome)}</span>
          </li>
        </ul>
      </Card>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditInventoryPage() {
  const materials = useLiveCollection<Material>('materials');
  const { rows, total } = inventoryValuation(materials);
  usePageHeader({ title: 'Inventory audit', subtitle: 'Stock × purchase rate' });
  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm">
          SKUs: <strong>{materials.length}</strong> · Total value: <strong>{formatINRDecimal(total)}</strong>
        </p>
      </Card>
      <DataTableShell>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Value</th>
              <th>Min stock flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 120).map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="text-muted-foreground">{r.category}</td>
                <td className="text-right tabular-nums">{r.qty}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.rate)}</td>
                <td className="text-right font-medium tabular-nums">{formatINRDecimal(r.value)}</td>
                <td>{r.belowMin ? <span className="text-amber-700 dark:text-amber-300">Low</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditDebtorsCreditorsPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const customers = useLiveCollection<Customer>('customers');
  const suppliers = useLiveCollection<Supplier>('suppliers');
  const debtors = debtorsByCustomer(invoices, customers);
  const creditors = creditorsFromSuppliers(suppliers);
  const ar = debtors.reduce((s, d) => s + d.balance, 0);
  const ap = creditors.reduce((s, c) => s + c.outstanding, 0);
  usePageHeader({ title: 'Debtors & creditors', subtitle: 'Outstanding receivables and vendor payables' });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Debtors</p>
          <p className="mt-1 text-2xl font-semibold">{formatINRDecimal(ar)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Creditors</p>
          <p className="mt-1 text-2xl font-semibold">{formatINRDecimal(ap)}</p>
        </Card>
      </div>
      <Card padding="md">
        <h3 className="font-semibold">Top debtors (invoice balance)</h3>
        <DataTableShell bare className="mt-3">
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Customer</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Invoices</th>
              </tr>
            </thead>
            <tbody>
              {debtors.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted-foreground">
                    No open balances.
                  </td>
                </tr>
              )}
              {debtors.slice(0, 40).map((d) => (
                <tr key={d.customerId}>
                  <td>
                    <Link className="text-primary hover:underline" to={`/finance/customers/${d.customerId}`}>
                      {d.name}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">{formatINRDecimal(d.balance)}</td>
                  <td className="text-right">{d.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </Card>
      <Card padding="md">
        <h3 className="font-semibold">Creditors (vendor outstanding)</h3>
        <DataTableShell bare className="mt-3">
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th className="text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {creditors.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-muted-foreground">
                    No vendor dues.
                  </td>
                </tr>
              )}
              {creditors.slice(0, 40).map((c) => (
                <tr key={c.supplierId}>
                  <td>
                    <Link className="text-primary hover:underline" to={`/finance/vendors/${c.supplierId}`}>
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">{formatINRDecimal(c.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </Card>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditGstPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const saleBills = useLiveCollection<SaleBill>('saleBills');
  const purchaseBills = useLiveCollection<PurchaseBill>('purchaseBills');
  const profile = getItem<CompanyProfile>('companyProfile');
  const g = aggregateGstActivity({ invoices, saleBills, purchaseBills });
  usePageHeader({ title: 'GST activity', subtitle: 'Aggregated from invoice/sale bill breakups and purchase line taxes' });
  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm text-muted-foreground">
          Company GSTIN (profile): <strong>{profile?.gst?.trim() || '— not set'}</strong>. Figures below include only documents where GST components were stored.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <p>
            Documents with output breakup: <strong>{g.invoicesWithBreakup + g.saleBillsWithBreakup}</strong> (inv {g.invoicesWithBreakup} · SB{' '}
            {g.saleBillsWithBreakup})
          </p>
          <p>
            Purchase bills with taxed lines: <strong>{g.billsWithGstItems}</strong>
          </p>
          <p>
            Net tax (output − input): <strong className="text-lg">{formatINRDecimal(g.netTaxPayable)}</strong>
          </p>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="md">
          <h3 className="font-semibold">Output (sales)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Taxable value: {formatINRDecimal(g.taxableSales)}</li>
            <li>CGST: {formatINRDecimal(g.outputCgst)}</li>
            <li>SGST: {formatINRDecimal(g.outputSgst)}</li>
            <li>IGST: {formatINRDecimal(g.outputIgst)}</li>
            <li className="font-medium">Total tax: {formatINRDecimal(g.outputTax)}</li>
          </ul>
        </Card>
        <Card padding="md">
          <h3 className="font-semibold">Input (purchases)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Taxable value (est.): {formatINRDecimal(g.taxablePurchases)}</li>
            <li>CGST: {formatINRDecimal(g.inputCgst)}</li>
            <li>SGST: {formatINRDecimal(g.inputSgst)}</li>
            <li>IGST: {formatINRDecimal(g.inputIgst)}</li>
            <li className="font-medium">Total tax: {formatINRDecimal(g.inputTax)}</li>
          </ul>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        This is not GSTR-1/3B filing output. Use CSV exports from Reports for external compliance work.
      </p>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditCashBankPage() {
  const payments = useLiveCollection<Payment>('payments');
  const companyExpenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomeRecords = useLiveCollection<IncomeRecord>('incomeRecords');
  const rows = cashBankByMode({ payments, companyExpenses, incomeRecords });
  usePageHeader({ title: 'Cash & bank', subtitle: 'Instrument mix from payments, expenses, and income register' });
  return (
    <div className="space-y-4">
      <DataTableShell>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Mode</th>
              <th className="text-right">Inflow</th>
              <th className="text-right">Outflow</th>
              <th className="text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mode}>
                <td>{r.mode}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.inflow)}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.outflow)}</td>
                <td className="text-right font-medium tabular-nums">{formatINRDecimal(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditExpensesPage() {
  const companyExpenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const roll = rollupExpensesByTaxonomyKey(companyExpenses);
  usePageHeader({ title: 'Expense audit', subtitle: 'Unified taxonomy roll-up (same keys as CoA mapping)' });
  return (
    <div className="space-y-4">
      <Card padding="sm">
        <Link className="text-sm font-medium text-primary" to="/finance/expense-audit">
          Open Finance → Expense audit (policy & detail)
        </Link>
      </Card>
      <DataTableShell>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Taxonomy key</th>
              <th>Pillar</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {roll.slice(0, 200).map((r) => (
              <tr key={r.key}>
                <td className="max-w-[14rem] truncate font-mono text-xs" title={r.key}>
                  {r.key}
                </td>
                <td>{r.pillar ?? '—'}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.amount)}</td>
                <td className="text-right">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditAssetsPage() {
  const tools = useLiveCollection<Tool>('tools');
  const rows = toolsAsFixedAssets(tools);
  const nbv = rows.reduce((s, r) => s + r.bookValueEstimate, 0);
  const cost = rows.reduce((s, r) => s + r.purchaseRate, 0);
  usePageHeader({ title: 'Fixed assets (tools)', subtitle: 'Straight-line NBV estimate from purchase date' });
  return (
    <div className="space-y-4">
      <Card padding="md" className="text-sm">
        <p>
          Gross tool cost: <strong>{formatINRDecimal(cost)}</strong> · Estimated NBV: <strong>{formatINRDecimal(nbv)}</strong>
        </p>
      </Card>
      <DataTableShell>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Status</th>
              <th>Condition</th>
              <th className="text-right">Purchase</th>
              <th className="text-right">Est. book</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.lifecycleStatus ?? '—'}</td>
                <td>{r.condition}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.purchaseRate)}</td>
                <td className="text-right tabular-nums">{formatINRDecimal(r.bookValueEstimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditLogsPage() {
  const logs = useLiveCollection<AuditLogEntry>('auditLogs');
  usePageHeader({ title: 'Audit logs', subtitle: 'Recent mutations (newest first)' });
  const sorted = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="max-h-[min(70vh,560px)] overflow-y-auto text-xs">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Action</th>
              <th className="p-2">Entity</th>
              <th className="p-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-muted-foreground">
                  No entries yet.
                </td>
              </tr>
            )}
            {sorted.slice(0, 400).map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-2 whitespace-nowrap">{l.timestamp.slice(0, 19)}</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">
                  {l.entityType} {l.entityName ?? l.entityId}
                </td>
                <td className="p-2 text-muted-foreground">
                  {[l.field, l.newValue].filter(Boolean).join(' → ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border p-3">
        <Link className="text-sm text-primary" to="/audit">
          ← Audit home
        </Link>
      </div>
    </Card>
  );
}

export function AuditReportsPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomes = useLiveCollection<IncomeRecord>('incomeRecords');
  const customers = useLiveCollection<Customer>('customers');
  const suppliers = useLiveCollection<Supplier>('suppliers');
  usePageHeader({ title: 'Reports & export', subtitle: 'Download CSV extracts' });

  function download(name: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  const debtorRows = debtorsByCustomer(invoices, customers).map((d) => ({
    customerId: d.customerId,
    name: d.name,
    balance: d.balance,
    invoices: d.invoiceCount,
  }));

  return (
    <div className="space-y-4">
      <Card padding="md" className="text-sm text-muted-foreground">
        Exports are point-in-time snapshots from browser storage. Large datasets may take a moment.
      </Card>
      <div className="flex flex-wrap gap-2">
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() => download(`debtors-${Date.now()}.csv`, exportAuditCsv('debtors', debtorRows))}
        >
          Debtors CSV
        </ShellButton>
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() =>
            download(
              `payments-${Date.now()}.csv`,
              exportAuditCsv(
                'payments',
                payments.map((p) => ({
                  id: p.id,
                  invoiceId: p.invoiceId,
                  amount: p.amount,
                  mode: p.mode,
                  date: p.date,
                }))
              )
            )
          }
        >
          Payments CSV
        </ShellButton>
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() =>
            download(
              `expenses-${Date.now()}.csv`,
              exportAuditCsv(
                'companyExpenses',
                expenses.map((e) => ({
                  id: e.id,
                  date: e.date,
                  amount: e.amount,
                  pillar: e.pillar ?? '',
                  taxonomyKey: e.taxonomyKey ?? '',
                  category: e.category,
                }))
              )
            )
          }
        >
          Expenses CSV
        </ShellButton>
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() =>
            download(
              `income-${Date.now()}.csv`,
              exportAuditCsv(
                'income',
                incomes.map((r) => ({
                  id: r.id,
                  date: r.date,
                  amount: r.amount,
                  pillar: r.pillar,
                  taxonomyKey: r.taxonomyKey ?? '',
                  outgoing: r.isOutgoing ? 'yes' : 'no',
                }))
              )
            )
          }
        >
          Income CSV
        </ShellButton>
        <ShellButton
          type="button"
          variant="secondary"
          onClick={() =>
            download(
              `creditors-${Date.now()}.csv`,
              exportAuditCsv(
                'creditors',
                suppliers.map((s) => ({
                  id: s.id,
                  name: s.name,
                  outstanding: s.outstanding,
                }))
              )
            )
          }
        >
          Creditors CSV
        </ShellButton>
      </div>
      <Link className="text-sm text-primary" to="/audit">
        ← Audit home
      </Link>
    </div>
  );
}

export function AuditDataFlowPage() {
  const projects = useLiveCollection<Project>('projects');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const quotations = useLiveCollection<Quotation>('quotations');
  const invoices = useLiveCollection<Invoice>('invoices');
  const tasks = useLiveCollection<Task>('tasks');
  usePageHeader({ title: 'Data flow', subtitle: 'Entity graph — counts' });
  return (
    <Card padding="md" className="space-y-4 text-sm text-muted-foreground">
      <ul className="list-inside list-disc space-y-2">
        <li>
          Enquiry → Quotation → Project → Invoice / Payments / Sites / Tasks / Material transfers
        </li>
        <li>Customer ← Projects, Invoices, Sale bills</li>
        <li>Supplier ← Purchase bills ← Vendor payments</li>
        <li>Unified expenses & income → Audit taxonomy roll-ups → Chart mapping (finance)</li>
      </ul>
      <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs text-foreground">
        <p>enquiries: {enquiries.length}</p>
        <p>quotations: {quotations.length}</p>
        <p>projects: {projects.length}</p>
        <p>invoices: {invoices.length}</p>
        <p>tasks: {tasks.length}</p>
      </div>
      <Link className="inline-block text-primary" to="/audit">
        ← Audit home
      </Link>
    </Card>
  );
}
