import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { SummaryCards } from '../../components/SummaryCards';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINR, formatINRDecimal } from '../../lib/helpers';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { Customer, Invoice, Payment, Project, Quotation, SaleBill } from '../../types';

export function CustomersList() {
  const customers = useLiveCollection<Customer>('customers');
  const invoices = useLiveCollection<Invoice>('invoices');
  const [open, setOpen] = useState(false);
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'Individual' as Customer['type'],
    gstin: '',
    siteAddress: '',
    pan: '',
    state: '',
  });

  const pageHeader = useMemo(
    () => ({
      title: 'Customers',
      subtitle: 'Accounts, invoices, sale bills, and projects',
      actions: (
        <ShellButton variant="primary" type="button" onClick={() => setOpen(true)}>
          Add customer
        </ShellButton>
      ),
    }),
    []
  );
  usePageHeader(pageHeader);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Customer>('customers');
    const c: Customer = {
      id: generateId('cust'),
      name: form.name,
      phone: form.phone.replace(/\D/g, '').slice(-10),
      email: form.email,
      address: form.address,
      type: form.type,
      gstin: form.gstin.trim() || undefined,
      siteAddress: form.siteAddress.trim() || undefined,
      pan: form.pan.trim().toUpperCase() || undefined,
      state: form.state.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setCollection('customers', [...list, c]);
    bump();
    setOpen(false);
    show('Customer added', 'success');
  }

  const pendingByCustomer = (cid: string) =>
    invoices.filter((i) => i.customerId === cid && i.status !== 'Paid').reduce((s, i) => s + i.balance, 0);

  const summary = useMemo(() => {
    const companies = customers.filter((c) => c.type === 'Company').length;
    const withPending = customers.filter((c) => pendingByCustomer(c.id) > 0).length;
    return {
      total: customers.length,
      companies,
      individuals: customers.length - companies,
      withPending,
    };
  }, [customers, invoices]);

  return (
    <div className="space-y-8">
      <SummaryCards
        columns={4}
        items={[
          { label: 'Customers', value: String(summary.total) },
          { label: 'Companies', value: String(summary.companies) },
          { label: 'Individuals', value: String(summary.individuals) },
          { label: 'With pending dues', value: String(summary.withPending) },
        ]}
      />
      <Card padding="none" className="overflow-hidden">
        <DataTableShell bare>
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Pending</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="transition hover:bg-muted/50">
                  <td className="font-medium text-foreground">{c.name}</td>
                  <td className="text-muted-foreground">{c.phone}</td>
                  <td className="text-muted-foreground">{c.type}</td>
                  <td className="text-muted-foreground">{formatINR(pendingByCustomer(c.id))}</td>
                  <td>
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/customers/${c.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </Card>
      <Modal open={open} title="Add customer" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          <label className="block">
            <span className="text-xs text-muted-foreground">Name *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Phone *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Address</span>
            <textarea
              className="input-shell mt-1 min-h-[4rem]"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              className="select-shell mt-1"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Customer['type'] })}
            >
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">GSTIN (company)</span>
            <input
              className="input-shell mt-1"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Site / installation address</span>
            <textarea
              className="input-shell mt-1 min-h-[3rem]"
              rows={2}
              value={form.siteAddress}
              onChange={(e) => setForm({ ...form, siteAddress: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">PAN</span>
            <input
              className="input-shell mt-1"
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value })}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">State (place of supply)</span>
            <input
              className="input-shell mt-1"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="e.g. Maharashtra"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <ShellButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customers = useLiveCollection<Customer>('customers');
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const projects = useLiveCollection<Project>('projects');
  const quotations = useLiveCollection<Quotation>('quotations');
  const saleBills = useLiveCollection<SaleBill>('saleBills');
  const c = customers.find((x) => x.id === id);
  const [tab, setTab] = useState<'inv' | 'sb' | 'quo' | 'proj' | 'pay'>('inv');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'Individual' as Customer['type'],
    gstin: '',
    siteAddress: '',
    pan: '',
    state: '',
  });
  const { bump } = useDataRefresh();
  const { show } = useToast();

  const header = useMemo(() => {
    const row = customers.find((x) => x.id === id);
    if (!row) return { title: 'Customer', subtitle: '' };
    return {
      title: row.name,
      subtitle: `${row.type} · ${row.phone}`,
      actions: (
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/sales/customers')}>
            All customers
          </ShellButton>
          <ShellButton
            type="button"
            variant="primary"
            onClick={() => {
              setEditForm({
                name: row.name,
                phone: row.phone,
                email: row.email,
                address: row.address,
                type: row.type,
                gstin: row.gstin ?? '',
                siteAddress: row.siteAddress ?? '',
                pan: row.pan ?? '',
                state: row.state ?? '',
              });
              setEditOpen(true);
            }}
          >
            Edit profile
          </ShellButton>
        </div>
      ),
    };
  }, [id, customers, navigate]);
  usePageHeader(header);

  if (!c) return <p className="text-muted-foreground">Not found</p>;
  const customerId = c.id;

  const invs = invoices.filter((i) => i.customerId === customerId);
  const quos = quotations.filter((q) => q.customerId === customerId);
  const projs = projects.filter((p) => p.customerId === customerId);
  const pays = payments.filter((p) => invs.some((i) => i.id === p.invoiceId));
  const bills = saleBills.filter((b) => b.customerId === customerId);

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Customer>('customers');
    setCollection(
      'customers',
      list.map((x) =>
        x.id === customerId
          ? {
              ...x,
              ...editForm,
              phone: editForm.phone.replace(/\D/g, '').slice(-10),
              gstin: editForm.gstin.trim() || undefined,
              siteAddress: editForm.siteAddress.trim() || undefined,
              pan: editForm.pan.trim().toUpperCase() || undefined,
              state: editForm.state.trim() || undefined,
            }
          : x
      )
    );
    bump();
    setEditOpen(false);
    show('Customer updated', 'success');
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-muted-foreground">
          {c.phone} · {c.email}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{c.address || '—'}</p>
        {c.siteAddress && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Site address</span>{' '}
            <span className="font-medium text-foreground">{c.siteAddress}</span>
          </p>
        )}
        {c.gstin && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">GSTIN</span>{' '}
            <span className="font-medium text-foreground">{c.gstin}</span>
          </p>
        )}
        {c.pan && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">PAN</span>{' '}
            <span className="font-medium text-foreground">{c.pan}</span>
          </p>
        )}
        {c.state && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">State</span>{' '}
            <span className="font-medium text-foreground">{c.state}</span>
          </p>
        )}
      </Card>

      <Card padding="sm">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {(
            [
              ['inv', 'Invoices'],
              ['sb', 'Sale bills'],
              ['quo', 'Quotations'],
              ['proj', 'Projects'],
              ['pay', 'Payments'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === k ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-secondary/80'
              }`}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="pt-4">
          {tab === 'inv' && (
            <ul className="space-y-2 text-sm">
              {invs.map((i) => (
                <li key={i.id}>
                  <Link className="font-medium text-primary hover:text-primary/90" to={`/finance/invoices/${i.id}`}>
                    {i.invoiceNumber} — {formatINR(i.total)} ({i.status})
                  </Link>
                </li>
              ))}
              {invs.length === 0 && <li className="text-muted-foreground">No invoices</li>}
            </ul>
          )}
          {tab === 'sb' && (
            <ul className="space-y-2 text-sm">
              {bills.map((b) => (
                <li key={b.id}>
                  <Link className="font-medium text-primary hover:text-primary/90" to={`/finance/sale-bills/${b.id}`}>
                    {b.billNumber} — {formatINRDecimal(b.total)} ({b.status})
                  </Link>
                </li>
              ))}
              {bills.length === 0 && <li className="text-muted-foreground">No sale bills</li>}
            </ul>
          )}
          {tab === 'quo' && (
            <ul className="space-y-2 text-sm">
              {quos.map((q) => (
                <li key={q.id}>
                  <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/quotations/${q.id}`}>
                    {q.reference} — {q.status}
                  </Link>
                </li>
              ))}
              {quos.length === 0 && <li className="text-muted-foreground">No quotations</li>}
            </ul>
          )}
          {tab === 'proj' && (
            <ul className="space-y-2 text-sm">
              {projs.map((p) => (
                <li key={p.id}>
                  <Link className="font-medium text-primary hover:text-primary/90" to={`/projects/${p.id}`}>
                    {p.name} — {p.status}
                  </Link>
                </li>
              ))}
              {projs.length === 0 && <li className="text-muted-foreground">No projects</li>}
            </ul>
          )}
          {tab === 'pay' && (
            <ul className="space-y-2 text-sm">
              {pays.map((p) => (
                <li key={p.id}>
                  {formatINR(p.amount)} — {p.mode} — {p.date}
                </li>
              ))}
              {pays.length === 0 && <li className="text-muted-foreground">No payments</li>}
            </ul>
          )}
        </div>
      </Card>

      <Modal open={editOpen} title="Edit customer" onClose={() => setEditOpen(false)}>
        <form className="space-y-3" onSubmit={saveEdit}>
          <label className="block">
            <span className="text-xs text-muted-foreground">Name *</span>
            <input
              required
              className="input-shell mt-1"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Phone *</span>
            <input
              required
              className="input-shell mt-1"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Address</span>
            <textarea
              className="input-shell mt-1 min-h-[4rem]"
              rows={2}
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              className="select-shell mt-1"
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Customer['type'] })}
            >
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">GSTIN</span>
            <input
              className="input-shell mt-1"
              value={editForm.gstin}
              onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Site / installation address</span>
            <textarea
              className="input-shell mt-1 min-h-[3rem]"
              rows={2}
              value={editForm.siteAddress}
              onChange={(e) => setEditForm({ ...editForm, siteAddress: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">PAN</span>
            <input
              className="input-shell mt-1"
              value={editForm.pan}
              onChange={(e) => setEditForm({ ...editForm, pan: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">State</span>
            <input
              className="input-shell mt-1"
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <ShellButton type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
