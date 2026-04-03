import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type {
  CompanyExpense,
  Customer,
  Invoice,
  Loan,
  Material,
  Payment,
  Project,
  PurchaseBill,
  SaleBill,
  Supplier,
} from '../../types';

export function InvoicesList() {
  const invoices = useLiveCollection<Invoice>('invoices');
  const customers = useLiveCollection<Customer>('customers');
  const navigate = useNavigate();
  const pageHeader = useMemo(
    () => ({
      title: 'Invoices',
      subtitle: 'Billing, payments, and balances',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => navigate('/finance/invoices/new')}>
          New invoice
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(pageHeader);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/90">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground">No.</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Customer</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Total</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-border transition hover:bg-muted/80">
                <td className="px-4 py-3 font-medium text-foreground">{i.invoiceNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{customers.find((c) => c.id === i.customerId)?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatINRDecimal(i.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.status}</td>
                <td className="px-4 py-3">
                  <Link className="font-medium text-primary hover:text-primary/90" to={`/finance/invoices/${i.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function InvoiceNew() {
  const [search] = useSearchParams();
  const projectId = search.get('projectId') ?? '';
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const navigate = useNavigate();
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [pid, setPid] = useState(projectId || projects[0]?.id || '');
  const [total, setTotal] = useState('100000');

  function save(e: React.FormEvent) {
    e.preventDefault();
    const proj = projects.find((p) => p.id === pid);
    if (!proj) return;
    const list = getCollection<Invoice>('invoices');
    const inv: Invoice = {
      id: generateId('inv'),
      projectId: proj.id,
      customerId: proj.customerId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(list.length + 200)}`,
      date: new Date().toISOString().slice(0, 10),
      total: Number(total) || 0,
      received: 0,
      balance: Number(total) || 0,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
    };
    setCollection('invoices', [...list, inv]);
    bump();
    show('Invoice created', 'success');
    navigate(`/finance/invoices/${inv.id}`);
  }

  const proj = projects.find((p) => p.id === pid);
  const cust = proj ? customers.find((c) => c.id === proj.customerId) : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link to="/finance/invoices" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">New invoice</h1>
      <form onSubmit={save} className="space-y-3 rounded-lg border bg-card p-4">
        <label className="block text-sm">
          Project
          <select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-foreground">Customer: {cust?.name}</p>
        <label className="block text-sm">
          Total (₹)
          <input className="mt-1 w-full rounded border px-3 py-2" value={total} onChange={(e) => setTotal(e.target.value)} />
        </label>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Create
        </button>
      </form>
    </div>
  );
}

export function InvoiceDetail() {
  const { id } = useParams();
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState('');
  const [mode, setMode] = useState<Payment['mode']>('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const foundInv = invoices.find((x) => x.id === id);
  if (!foundInv) return <p>Not found</p>;
  const row: Invoice = foundInv;
  const pays = payments.filter((p) => p.invoiceId === row.id);

  function recordPayment() {
    const amount = Number(amt);
    if (amount <= 0 || amount > row.balance) {
      show('Invalid amount', 'error');
      return;
    }
    const plist = getCollection<Payment>('payments');
    setCollection('payments', [
      ...plist,
      {
        id: generateId('pay'),
        invoiceId: row.id,
        amount,
        mode,
        date,
        createdAt: new Date().toISOString(),
      },
    ]);
    const ilist = getCollection<Invoice>('invoices');
    const received = row.received + amount;
    const balance = row.total - received;
    const status = balance <= 0 ? 'Paid' : received > 0 ? 'Partial' : 'Unpaid';
    setCollection(
      'invoices',
      ilist.map((i) =>
        i.id === row.id ? { ...i, received, balance, status } : i
      )
    );
    bump();
    setOpen(false);
    setAmt('');
    show('Payment recorded', 'success');
  }

  return (
    <div className="space-y-4">
      <Link to="/finance/invoices" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{row.invoiceNumber}</h1>
      <div className="rounded-lg border bg-card p-4 text-sm space-y-1">
        <p>Total: {formatINRDecimal(row.total)}</p>
        <p>Received: {formatINRDecimal(row.received)}</p>
        <p>Balance: {formatINRDecimal(row.balance)}</p>
        <p>Status: {row.status}</p>
      </div>
      <h2 className="font-semibold">Payments</h2>
      <ul className="text-sm">
        {pays.map((p) => (
          <li key={p.id}>
            {formatINRDecimal(p.amount)} — {p.mode} — {p.date}
          </li>
        ))}
      </ul>
      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
        Record payment
      </button>
      <Modal open={open} title="Record payment" onClose={() => setOpen(false)}>
        <div className="space-y-2">
          <input className="w-full rounded border px-3 py-2" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={mode} onChange={(e) => setMode(e.target.value as Payment['mode'])}>
            {(['Cash', 'UPI', 'Bank Transfer', 'Loan Disbursement'] as const).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input type="date" className="w-full rounded border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
          <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={recordPayment}>
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function SaleBillsList() {
  const bills = useLiveCollection<SaleBill>('saleBills');
  const customers = useLiveCollection<Customer>('customers');
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Sale bills</h1>
        <Link to="/finance/sale-bills/new" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          New sale bill
        </Link>
      </div>
      <table className="w-full rounded-lg border border-border bg-card text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Bill</th>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-left">Total</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left" />
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="px-3 py-2">{b.billNumber}</td>
              <td className="px-3 py-2">{customers.find((c) => c.id === b.customerId)?.name}</td>
              <td className="px-3 py-2">{formatINRDecimal(b.total)}</td>
              <td className="px-3 py-2">{b.status}</td>
              <td className="px-3 py-2">
                <Link className="text-primary" to={`/finance/sale-bills/${b.id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentsList() {
  const payments = useLiveCollection<Payment>('payments');
  const invoices = useLiveCollection<Invoice>('invoices');
  const projects = useLiveCollection<Project>('projects');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Client payments</h1>
      <table className="w-full rounded-lg border border-border bg-card text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Amount</th>
            <th className="px-3 py-2 text-left">Mode</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Project</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const inv = invoices.find((i) => i.id === p.invoiceId);
            const proj = inv ? projects.find((x) => x.id === inv.projectId) : undefined;
            return (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{formatINRDecimal(p.amount)}</td>
                <td className="px-3 py-2">{p.mode}</td>
                <td className="px-3 py-2">{p.date}</td>
                <td className="px-3 py-2">{proj?.name ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LoansList() {
  const loans = useLiveCollection<Loan>('loans');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [lid, setLid] = useState('');
  const [ramt, setRamt] = useState('');
  const [rdate, setRdate] = useState(() => new Date().toISOString().slice(0, 10));

  function repay() {
    const amount = Number(ramt);
    if (amount <= 0) return;
    const list = getCollection<Loan>('loans');
    setCollection(
      'loans',
      list.map((l) =>
        l.id === lid
          ? {
              ...l,
              repayments: [...l.repayments, { amount, date: rdate }],
              outstanding: Math.max(0, l.outstanding - amount),
              status: l.outstanding - amount <= 0 ? ('Closed' as const) : l.status,
            }
          : l
      )
    );
    bump();
    setOpen(false);
    show('Repayment recorded', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Loans</h1>
        <Link to="/finance/loans/new" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          New loan
        </Link>
      </div>
      <table className="w-full rounded-lg border border-border bg-card text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Source</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Outstanding</th>
            <th className="px-3 py-2 text-left" />
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="px-3 py-2">{l.source}</td>
              <td className="px-3 py-2">{l.type}</td>
              <td className="px-3 py-2">{formatINRDecimal(l.outstanding)}</td>
              <td className="px-3 py-2">
                {l.status === 'Active' && (
                  <button
                    type="button"
                    className="text-primary"
                    onClick={() => {
                      setLid(l.id);
                      setOpen(true);
                    }}
                  >
                    Repay
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={open} title="Record repayment" onClose={() => setOpen(false)}>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={ramt} onChange={(e) => setRamt(e.target.value)} />
        <input type="date" className="mb-2 w-full rounded border px-3 py-2" value={rdate} onChange={(e) => setRdate(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={repay}>
          Save
        </button>
      </Modal>
    </div>
  );
}

export function VendorsList() {
  const suppliers = useLiveCollection<Supplier>('suppliers');
  const bills = useLiveCollection<PurchaseBill>('purchaseBills');
  const materials = useLiveCollection<{ id: string; name: string }>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState('');

  function addBill(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const total = Number(fd.get('total')) || 0;
    const bl = getCollection<PurchaseBill>('purchaseBills');
    const mid = (fd.get('mid') as string) || materials[0]?.id;
    if (!mid) return;
    const qty = Number(fd.get('qty')) || 1;
    const rate = Number(fd.get('rate')) || 0;
    const bill: PurchaseBill = {
      id: generateId('pb'),
      supplierId: sid,
      billNumber: String(fd.get('bn')),
      date: String(fd.get('dt')),
      items: [{ materialId: mid, quantity: qty, rate, total: qty * rate }],
      total,
      paid: 0,
      due: total,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
    };
    setCollection('purchaseBills', [...bl, bill]);
    const mats = getCollection<Material>('materials').map((m) =>
      m.id === mid ? { ...m, currentStock: m.currentStock + qty, updatedAt: new Date().toISOString() } : m
    );
    setCollection('materials', mats);
    bump();
    setOpen(false);
    show('Purchase bill added; stock increased', 'success');
    form.reset();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendors</h1>
      <table className="w-full rounded-lg border border-border bg-card text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Outstanding</th>
            <th className="px-3 py-2 text-left" />
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-3 py-2">{s.name}</td>
              <td className="px-3 py-2">{formatINRDecimal(s.outstanding)}</td>
              <td className="px-3 py-2 flex flex-wrap gap-2">
                <Link className="text-primary" to={`/finance/vendors/${s.id}`}>
                  View
                </Link>
                <button type="button" className="text-primary" onClick={() => { setSid(s.id); setOpen(true); }}>
                  Add bill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">{bills.length} bills on file</p>
      <Modal open={open} title="Purchase bill" onClose={() => setOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={addBill}>
          <input name="bn" required placeholder="Bill no." className="rounded border px-3 py-2" />
          <input name="dt" type="date" required className="rounded border px-3 py-2" />
          <select name="mid" className="sm:col-span-2 rounded border px-3 py-2">
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input name="qty" type="number" placeholder="Qty" className="rounded border px-3 py-2" defaultValue={1} />
          <input name="rate" type="number" placeholder="Rate" className="rounded border px-3 py-2" />
          <input name="total" type="number" placeholder="Bill total" className="sm:col-span-2 rounded border px-3 py-2" required />
          <button type="submit" className="sm:col-span-2 rounded bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}

const COA = [
  { id: '1', name: 'Assets', children: ['Cash', 'Bank', 'Receivables'] },
  { id: '2', name: 'Liabilities', children: ['Payables', 'Loans'] },
  { id: '3', name: 'Income', children: ['Sales', 'Service'] },
  { id: '4', name: 'Expenses', children: ['COGS', 'Payroll', 'Office'] },
];

export function ChartOfAccountsPage() {
  const [sel, setSel] = useState<string | null>(null);
  const payments = useLiveCollection<Payment>('payments');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const tx = useMemo(() => {
    if (!sel) return [];
    if (sel.includes('Cash') || sel.includes('Bank'))
      return payments.slice(0, 20).map((p) => ({ d: p.date, a: p.amount, n: 'Payment ' + p.mode }));
    return expenses.slice(0, 20).map((e) => ({ d: e.date, a: e.amount, n: e.category }));
  }, [sel, payments, expenses]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Chart of accounts</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <ul className="text-sm space-y-2">
          {COA.map((n) => (
            <li key={n.id} className="rounded border bg-card p-3">
              <strong>{n.name}</strong>
              <ul className="ml-3 mt-1">
                {n.children.map((c) => (
                  <li key={c}>
                    <button type="button" className="text-primary hover:underline" onClick={() => setSel(c)}>
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="rounded border bg-card p-3 text-sm">
          <h2 className="font-semibold">Ledger preview</h2>
          {sel && (
            <ul className="mt-2 space-y-1">
              {tx.map((t, i) => (
                <li key={i}>
                  {t.d} — {formatINRDecimal(t.a)} — {t.n}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExpenseAuditPage() {
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const grouped = useMemo(() => {
    const g: Record<string, CompanyExpense[]> = {};
    expenses.forEach((e) => {
      g[e.category] = g[e.category] ?? [];
      g[e.category]!.push(e);
    });
    return g;
  }, [expenses]);

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const list = getCollection<CompanyExpense>('companyExpenses');
    setCollection('companyExpenses', [
      ...list,
      {
        id: generateId('ce'),
        category: String(fd.get('cat')),
        subCategory: String(fd.get('sub') || ''),
        amount: Number(fd.get('amt')) || 0,
        date: String(fd.get('dt')),
        paidBy: String(fd.get('pb') || 'company'),
        mode: String(fd.get('mode') || 'Bank Transfer'),
        notes: String(fd.get('notes') || ''),
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    show('Expense added', 'success');
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Expense audit</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add expense
        </button>
      </div>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">
            {cat} — {formatINRDecimal(items.reduce((s, x) => s + x.amount, 0))}
          </h2>
          <ul className="mt-2 text-sm text-muted-foreground">
            {items.map((x) => (
              <li key={x.id}>
                {x.date}: {formatINRDecimal(x.amount)} — {x.notes}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Modal open={open} title="Company expense" onClose={() => setOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={addExpense}>
          <input name="cat" required placeholder="Category" className="rounded border px-3 py-2" />
          <input name="sub" placeholder="Sub category" className="rounded border px-3 py-2" />
          <input name="amt" type="number" required placeholder="Amount" className="rounded border px-3 py-2" />
          <input name="dt" type="date" required className="rounded border px-3 py-2" />
          <input name="pb" placeholder="Paid by" className="rounded border px-3 py-2" />
          <input name="mode" placeholder="Mode" className="rounded border px-3 py-2" />
          <textarea name="notes" placeholder="Notes" className="sm:col-span-2 rounded border px-3 py-2" rows={2} />
          <button type="submit" className="sm:col-span-2 rounded bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}
