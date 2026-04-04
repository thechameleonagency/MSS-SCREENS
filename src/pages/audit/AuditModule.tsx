import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import type { AuditLogEntry, CompanyExpense, Invoice, Material, Supplier } from '../../types';

const LINKS: { to: string; label: string; note: string }[] = [
  { to: '/audit/chart-of-accounts', label: 'Chart of accounts', note: 'Hierarchy (links to finance COA)' },
  { to: '/audit/profit-loss', label: 'Profit & loss', note: 'Monthly prototype statement' },
  { to: '/audit/inventory', label: 'Inventory audit', note: 'Stock valuation snapshot' },
  { to: '/audit/debtors-creditors', label: 'Debtors & creditors', note: 'Outstanding receivables / payables' },
  { to: '/audit/gst', label: 'GST compliance', note: 'Prototype — not filing ready' },
  { to: '/audit/cash-bank', label: 'Cash & bank', note: 'Ledger placeholder' },
  { to: '/audit/expenses', label: 'Expense audit', note: 'Category roll-up' },
  { to: '/audit/assets', label: 'Fixed assets', note: 'Register placeholder' },
  { to: '/audit/logs', label: 'Audit logs', note: 'Recent mutations' },
  { to: '/audit/reports', label: 'Reports & export', note: 'Batch export' },
  { to: '/audit/data-flow', label: 'Data flow', note: 'How entities link' },
];

function AuditHome() {
  usePageHeader({ title: 'Audit suite', subtitle: 'Compliance and reporting (prototype)' });
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to}>
          <Card padding="md" interactive>
            <h3 className="font-semibold text-primary">{l.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{l.note}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StubPage({
  title,
  body,
  checklist,
  related,
}: {
  title: string;
  body: string;
  checklist?: string[];
  related?: { to: string; label: string }[];
}) {
  usePageHeader({ title, subtitle: 'Audit module — prototype' });
  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm text-muted-foreground">{body}</p>
        {checklist && checklist.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
              {checklist.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {related && related.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
              >
                {r.label}
              </Link>
            ))}
          </div>
        )}
        <Link className="mt-4 inline-block text-sm font-medium text-primary" to="/audit">
          ← Audit home
        </Link>
      </Card>
    </div>
  );
}

export function AuditDashboardPage() {
  return <AuditHome />;
}

export function AuditChartOfAccountsRedirect() {
  usePageHeader({ title: 'Chart of accounts', subtitle: 'Redirecting…' });
  return (
    <Card padding="md">
      <p className="text-sm">Use the finance chart of accounts for editing.</p>
      <Link className="mt-2 inline-block font-medium text-primary" to="/finance/chart-of-accounts">
        Open chart of accounts
      </Link>
    </Card>
  );
}

export function AuditProfitLossPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const received = invoices.reduce((s, i) => s + i.received, 0);
  const companyExpenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const expenseSum = companyExpenses.reduce((s, e) => s + e.amount, 0);
  usePageHeader({ title: 'Profit & loss', subtitle: 'Simplified from invoices + expenses' });
  return (
    <Card padding="md" className="space-y-2 text-sm">
      <p>Revenue (received on invoices): {formatINRDecimal(received)}</p>
      <p>Expenses (company): {formatINRDecimal(expenseSum)}</p>
      <p className="font-semibold">Net (rough): {formatINRDecimal(received - expenseSum)}</p>
      <Link className="inline-block pt-4 text-primary" to="/audit">
        ← Back
      </Link>
    </Card>
  );
}

export function AuditInventoryPage() {
  const materials = useLiveCollection<Material>('materials');
  const value = materials.reduce((s, m) => s + m.currentStock * m.purchaseRate, 0);
  usePageHeader({ title: 'Inventory audit', subtitle: 'Stock × purchase rate' });
  return (
    <Card padding="md" className="text-sm">
      <p>SKUs: {materials.length}</p>
      <p className="font-semibold">Estimated value: {formatINRDecimal(value)}</p>
      <Link className="mt-4 inline-block text-primary" to="/audit">
        ← Back
      </Link>
    </Card>
  );
}

export function AuditDebtorsCreditorsPage() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const sup = useLiveCollection<Supplier>('suppliers');
  const recv = invoices.reduce((s, i) => s + i.balance, 0);
  const pay = sup.reduce((s, v) => s + v.outstanding, 0);
  usePageHeader({ title: 'Debtors & creditors', subtitle: 'Receivables vs vendor outstanding' });
  return (
    <Card padding="md" className="space-y-2 text-sm">
      <p>Debtors (invoice balance): {formatINRDecimal(recv)}</p>
      <p>Creditors (vendor outstanding): {formatINRDecimal(pay)}</p>
      <Link className="inline-block pt-4 text-primary" to="/audit">
        ← Back
      </Link>
    </Card>
  );
}

export function AuditGstPage() {
  return (
    <StubPage
      title="GST compliance"
      body="GSTR-1 / 3B placeholders. This prototype does not generate filing-ready returns. Use exported invoice lines when GST item data is complete."
      checklist={[
        'Invoice line items include HSN and GST breakup where captured',
        'Sale bills and purchase bills carry gstBreakup in seed data',
        'Filing export is not implemented — use Analytics export or manual CSV',
      ]}
      related={[
        { to: '/finance/billing', label: 'Finance billing desk' },
        { to: '/finance/invoices', label: 'Invoices list' },
        { to: '/analytics', label: 'Analytics export' },
      ]}
    />
  );
}

export function AuditCashBankPage() {
  return (
    <StubPage
      title="Cash & bank"
      body="Bank reconciliation UI can be added when statement import is defined. Voucher and ledger lines in seed demonstrate double-entry patterns."
      checklist={[
        'Review Receipt / Payment vouchers in storage (prototype)',
        'Match payments list to invoice receipts for cash flow sanity',
      ]}
      related={[
        { to: '/finance/payments', label: 'Payments' },
        { to: '/finance/chart-of-accounts', label: 'Chart of accounts' },
        { to: '/finance/accounting', label: 'Accounting desk' },
      ]}
    />
  );
}

export function AuditExpensesPage() {
  return <StubPage title="Expense audit" body="See Finance → Expense audit for category breakdown. This page mirrors policy checks later." />;
}

export function AuditAssetsPage() {
  return (
    <StubPage
      title="Fixed assets"
      body="Tools inventory includes purchase rate and depreciation fields; a full fixed-asset register can extend the same pattern."
      checklist={['Tools list shows condition and lifecycle status', 'Tool movements (issue / return / transfer) in seed']}
      related={[
        { to: '/inventory/tools', label: 'Tools & assets' },
        { to: '/audit/inventory', label: 'Inventory audit' },
      ]}
    />
  );
}

export function AuditLogsPage() {
  const logs = useLiveCollection<AuditLogEntry>('auditLogs');
  usePageHeader({ title: 'Audit logs', subtitle: 'Last writes (cap 2000 in store)' });
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="max-h-[480px] overflow-y-auto text-xs">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Action</th>
              <th className="p-2">Entity</th>
              <th className="p-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-muted-foreground">
                  No entries yet. Log unified expenses/income, create invoices, or resolve approvals.
                </td>
              </tr>
            )}
            {logs.slice(0, 200).map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-2 whitespace-nowrap">{l.timestamp.slice(0, 19)}</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">
                  {l.entityType} {l.entityName ?? l.entityId}
                </td>
                <td className="p-2 text-muted-foreground">{l.newValue ?? l.field ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border p-3">
        <Link className="text-sm text-primary" to="/audit">
          ← Back
        </Link>
      </div>
    </Card>
  );
}

export function AuditReportsPage() {
  return (
    <StubPage
      title="Reports & export"
      body="Batch CSV/JSON exports per module can be added incrementally. Analytics currently exports a summary JSON of counts."
      checklist={['Dashboard drilldowns link to underlying records', 'Audit logs capture recent mutations']}
      related={[
        { to: '/analytics', label: 'Analytics' },
        { to: '/audit/logs', label: 'Audit logs' },
      ]}
    />
  );
}

export function AuditDataFlowPage() {
  usePageHeader({ title: 'Data flow', subtitle: 'Entity relationships' });
  return (
    <Card padding="md" className="space-y-3 text-sm text-muted-foreground">
      <p>Enquiry → Quotation → Project → Invoice / Payments</p>
      <p>Project → Material transfers, Tasks, Company expenses, Outsource work</p>
      <p>Customer ← Invoices, Sale bills, Projects</p>
      <Link className="inline-block text-primary" to="/audit">
        ← Back
      </Link>
    </Card>
  );
}
