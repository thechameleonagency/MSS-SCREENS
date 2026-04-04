import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DocumentPreviewFrame } from '../../components/DocumentPreviewFrame';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { appendAudit } from '../../lib/auditLog';
import { postSalesVoucherFromInvoice, postReceiptVoucherFromPayment } from '../../lib/voucherPosting';
import { buildCoaTree, CHART_OF_ACCOUNTS, descendantLeafIds } from '../../lib/chartOfAccounts';
import {
  expenseToLedger,
  incomeToLedger,
  invoiceReceivableLedger,
  invoiceToLedger,
  paymentToLedger,
} from '../../lib/coaMapping';
import { formatINRDecimal } from '../../lib/helpers';
import { computeGstBreakup, gstinSameState, invoiceGrandTotal } from '../../lib/gstCompute';
import { exportDomToPdf } from '../../lib/pdfExport';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  CompanyExpense,
  Customer,
  IncomeRecord,
  Invoice,
  InvoiceLineItem,
  Loan,
  Material,
  Payment,
  Project,
  PurchaseBill,
  Quotation,
  SaleBill,
  Supplier,
  User,
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
  const quotationId = search.get('quotationId') ?? '';
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const quotations = useLiveCollection<Quotation>('quotations');
  const materials = useLiveCollection<Material>('materials');
  const users = useLiveCollection<User>('users');
  const navigate = useNavigate();
  const { bump, version } = useDataRefresh();
  const { show } = useToast();
  const company = useMemo(() => getItem<{ gst: string; name: string }>('companyProfile'), [version]);
  const seededRef = useRef(false);
  const [pid, setPid] = useState(projectId || projects[0]?.id || '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 },
  ]);
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [forceIgst, setForceIgst] = useState(false);

  useEffect(() => {
    if (seededRef.current || !quotationId) return;
    const q = quotations.find((x) => x.id === quotationId);
    if (!q) return;
    seededRef.current = true;
    const cust = customers.find((c) => c.id === q.customerId);
    setCustomerGstin(cust?.gstin ?? '');
    const matchProj = projects.find((p) => p.customerId === q.customerId) ?? projects[0];
    if (matchProj) setPid(matchProj.id);
    const mapped: InvoiceLineItem[] = q.lineItems.map((li) => {
      const m = materials.find((x) => x.id === li.materialId);
      const desc = (li.description ?? '').trim() || m?.name || 'Item';
      const amount = li.quantity * li.rate;
      return {
        description: desc,
        hsn: m?.hsn,
        quantity: li.quantity,
        rate: li.rate,
        gstRate: q.gstPercent,
        amount,
      };
    });
    if (mapped.length) setLineItems(mapped);
  }, [quotationId, quotations, customers, projects, materials]);

  const sameState = forceIgst ? false : gstinSameState(company?.gst, customerGstin);
  const breakup = useMemo(
    () => computeGstBreakup(lineItems, undefined, sameState),
    [lineItems, sameState]
  );
  const grandTotal = invoiceGrandTotal(breakup);

  function updateLine(idx: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((prev) => {
      const next = [...prev];
      const base = next[idx];
      if (!base) return prev;
      const cur: InvoiceLineItem = {
        description: patch.description ?? base.description,
        hsn: patch.hsn ?? base.hsn,
        quantity: patch.quantity ?? base.quantity,
        rate: patch.rate ?? base.rate,
        gstRate: patch.gstRate ?? base.gstRate,
        amount: 0,
      };
      cur.amount = cur.quantity * cur.rate;
      next[idx] = cur;
      return next;
    });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const proj = projects.find((p) => p.id === pid);
    if (!proj) {
      show('Select a project', 'error');
      return;
    }
    if (!lineItems.length || lineItems.some((l) => !l.description.trim())) {
      show('Each line needs a description', 'error');
      return;
    }
    const list = getCollection<Invoice>('invoices');
    const cust = customers.find((c) => c.id === proj.customerId);
    const qFromQuote =
      quotationId.trim() !== ''
        ? getCollection<Quotation>('quotations').find((x) => x.id === quotationId)
        : undefined;
    const bankDoc = qFromQuote?.bankDocumentationAmount;
    const loanNote =
      bankDoc != null &&
      bankDoc > 0 &&
      (qFromQuote?.paymentType === 'Bank Loan' || qFromQuote?.paymentType === 'Bank Loan + Cash')
        ? `Bank documentation amount (from quotation): ${formatINRDecimal(bankDoc)}`
        : '';
    const inv: Invoice = {
      id: generateId('inv'),
      projectId: proj.id,
      customerId: proj.customerId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(list.length + 200)}`,
      date: new Date().toISOString().slice(0, 10),
      total: grandTotal,
      received: 0,
      balance: grandTotal,
      status: 'Unpaid',
      lineItems,
      customerGstin: customerGstin.trim() || cust?.gstin,
      placeOfSupply: placeOfSupply.trim() || undefined,
      customerAddress: cust?.address,
      customerContact: cust?.phone,
      gstBreakup: breakup,
      quotationId: quotationId || undefined,
      bankDocumentationAmount: bankDoc != null && bankDoc > 0 ? bankDoc : undefined,
      notes: loanNote || undefined,
      createdAt: new Date().toISOString(),
    };
    setCollection('invoices', [...list, inv]);
    appendAudit({
      userId: users[0]?.id ?? 'sys',
      userName: users[0]?.name,
      action: 'create',
      entityType: 'Invoice',
      entityId: inv.id,
      entityName: inv.invoiceNumber,
    });
    bump();
    postSalesVoucherFromInvoice(inv, users[0]?.id ?? 'sys', users[0]?.name);
    show('Invoice created', 'success');
    navigate(`/finance/invoices/${inv.id}`);
  }

  const proj = projects.find((p) => p.id === pid);
  const cust = proj ? customers.find((c) => c.id === proj.customerId) : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/finance/invoices" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">New invoice</h1>
      {quotationId && <p className="text-sm text-muted-foreground">Prefilled from quotation when available.</p>}
      <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-card p-4">
        <label className="block text-sm">
          Project *
          <select
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-foreground">Customer: {cust?.name ?? '—'}</p>
        <label className="block text-sm">
          Customer GSTIN
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value)}
            placeholder="For CGST/SGST vs IGST"
          />
        </label>
        <label className="block text-sm">
          Place of supply
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={placeOfSupply}
            onChange={(e) => setPlaceOfSupply(e.target.value)}
            placeholder="State / code"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={forceIgst} onChange={(e) => setForceIgst(e.target.checked)} />
          Treat as inter-state (IGST)
        </label>
        <div className="text-sm">
          <p className="font-medium">Line items (taxable value per line)</p>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-1">Description</th>
                <th className="py-1">HSN</th>
                <th className="py-1">Qty</th>
                <th className="py-1">Rate</th>
                <th className="py-1">GST%</th>
                <th className="py-1">Taxable</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="py-1 pr-1">
                    <input
                      className="w-full min-w-[6rem] rounded border px-2 py-1"
                      value={li.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                    />
                  </td>
                  <td className="py-1 pr-1">
                    <input
                      className="w-20 rounded border px-2 py-1"
                      value={li.hsn ?? ''}
                      onChange={(e) => updateLine(idx, { hsn: e.target.value })}
                    />
                  </td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      className="w-16 rounded border px-2 py-1"
                      value={li.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded border px-2 py-1"
                      value={li.rate}
                      onChange={(e) => updateLine(idx, { rate: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      className="w-14 rounded border px-2 py-1"
                      value={li.gstRate}
                      onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="py-1">{li.amount}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      className="text-destructive"
                      onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="mt-2 rounded border px-3 py-1 text-sm"
            onClick={() =>
              setLineItems([
                ...lineItems,
                { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 },
              ])
            }
          >
            Add line
          </button>
        </div>
        <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
          <p>Taxable: {formatINRDecimal(breakup.taxableValue)}</p>
          {sameState ? (
            <>
              <p>CGST: {formatINRDecimal(breakup.cgst)} · SGST: {formatINRDecimal(breakup.sgst)}</p>
            </>
          ) : (
            <p>IGST: {formatINRDecimal(breakup.igst)}</p>
          )}
          <p className="font-semibold">Grand total: {formatINRDecimal(grandTotal)}</p>
        </div>
        <ShellButton type="submit" variant="primary">
          Create invoice
        </ShellButton>
      </form>
    </div>
  );
}

export function InvoiceDetail() {
  const { id } = useParams();
  const invoices = useLiveCollection<Invoice>('invoices');
  const customers = useLiveCollection<Customer>('customers');
  const projects = useLiveCollection<Project>('projects');
  const payments = useLiveCollection<Payment>('payments');
  const users = useLiveCollection<User>('users');
  const { bump, version } = useDataRefresh();
  const { show } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const company = useMemo(() => getItem<{ name: string; gst: string; address: string }>('companyProfile'), [version]);
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState('');
  const [mode, setMode] = useState<Payment['mode']>('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payAsAdvance, setPayAsAdvance] = useState(false);

  const foundInv = invoices.find((x) => x.id === id);
  if (!foundInv) return <p>Not found</p>;
  const row: Invoice = foundInv;
  const pays = payments.filter((p) => p.invoiceId === row.id);
  const cust = customers.find((c) => c.id === row.customerId);
  const proj = projects.find((p) => p.id === row.projectId);

  async function downloadPdf() {
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      await exportDomToPdf(printRef.current, row.invoiceNumber);
    } finally {
      setPdfBusy(false);
    }
  }

  function recordPayment() {
    const amount = Number(amt);
    if (amount <= 0 || amount > row.balance) {
      show('Invalid amount', 'error');
      return;
    }
    const plist = getCollection<Payment>('payments');
    const pay: Payment = {
      id: generateId('pay'),
      invoiceId: row.id,
      amount,
      mode,
      date,
      isAdvance: payAsAdvance || undefined,
      createdAt: new Date().toISOString(),
    };
    setCollection('payments', [...plist, pay]);
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
    postReceiptVoucherFromPayment(pay, row, users[0]?.id ?? 'sys', users[0]?.name);
    setOpen(false);
    setAmt('');
    setPayAsAdvance(false);
    show('Payment recorded', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/finance/invoices" className="text-sm text-primary">
          ← Back
        </Link>
        <ShellButton type="button" variant="secondary" disabled={pdfBusy} onClick={() => void downloadPdf()}>
          {pdfBusy ? 'PDF…' : 'Download PDF'}
        </ShellButton>
      </div>
      <h1 className="text-2xl font-bold">{row.invoiceNumber}</h1>
      <div ref={printRef} className="space-y-4 rounded-lg border border-border bg-card p-4">
        <DocumentPreviewFrame
          company={{
            name: company?.name ?? 'Company',
            gst: company?.gst,
            address: company?.address,
          }}
          partyTitle="Bill to"
          partyName={cust?.name ?? 'Customer'}
          partyDetails={
            <>
              {(row.customerAddress ?? cust?.address) && <p>{row.customerAddress ?? cust?.address}</p>}
              {row.customerContact && <p>Contact: {row.customerContact}</p>}
              {(row.customerGstin ?? cust?.gstin) && <p>GSTIN: {row.customerGstin ?? cust?.gstin}</p>}
            </>
          }
          documentKind="Tax invoice"
          reference={row.invoiceNumber}
          dateValue={row.date}
          extraMeta={[
            ...(row.placeOfSupply ? [{ label: 'Place of supply', value: row.placeOfSupply }] : []),
            ...(proj ? [{ label: 'Project', value: proj.name }] : []),
          ]}
          summary={
            <>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(row.total)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(row.received)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(row.balance)}</p>
                <p className="text-xs font-medium text-muted-foreground">{row.status}</p>
              </div>
            </>
          }
        />
        {row.lineItems && row.lineItems.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2">Description</th>
                <th className="py-2">HSN</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Rate</th>
                <th className="py-2">GST%</th>
                <th className="py-2">Taxable</th>
              </tr>
            </thead>
            <tbody>
              {row.lineItems.map((li, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1">{li.description}</td>
                  <td>{li.hsn ?? '—'}</td>
                  <td>{li.quantity}</td>
                  <td>{li.rate}</td>
                  <td>{li.gstRate}</td>
                  <td>{formatINRDecimal(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">Header-only invoice (no line items stored).</p>
        )}
        {row.gstBreakup && (
          <div className="border-t border-border pt-3 text-sm">
            <p>Taxable: {formatINRDecimal(row.gstBreakup.taxableValue)}</p>
            {row.gstBreakup.igst > 0 ? (
              <p>IGST: {formatINRDecimal(row.gstBreakup.igst)}</p>
            ) : (
              <p>
                CGST: {formatINRDecimal(row.gstBreakup.cgst)} · SGST: {formatINRDecimal(row.gstBreakup.sgst)}
              </p>
            )}
            <p>Total tax: {formatINRDecimal(row.gstBreakup.totalTax)}</p>
          </div>
        )}
      </div>
      <h2 className="font-semibold">Payments</h2>
      <ul className="text-sm">
        {pays.map((p) => (
          <li key={p.id}>
            {formatINRDecimal(p.amount)} — {p.mode}
            {p.isAdvance ? ' · advance' : ''} — {p.date}
          </li>
        ))}
      </ul>
      <ShellButton type="button" variant="primary" onClick={() => setOpen(true)}>
        Record payment
      </ShellButton>
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
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={payAsAdvance} onChange={(e) => setPayAsAdvance(e.target.checked)} />
            Mark as advance / on-account (metadata for allocation later)
          </label>
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
    const hsn = String(fd.get('hsn') || '').trim();
    const gstRate = Number(fd.get('gst')) || 0;
    const taxable = qty * rate;
    const taxAmt = Math.round(taxable * (gstRate / 100) * 100) / 100;
    const half = Math.round((taxAmt / 2) * 100) / 100;
    const bill: PurchaseBill = {
      id: generateId('pb'),
      supplierId: sid,
      billNumber: String(fd.get('bn')),
      date: String(fd.get('dt')),
      items: [
        {
          materialId: mid,
          quantity: qty,
          rate,
          total: taxable,
          hsn: hsn || undefined,
          gstRatePercent: gstRate || undefined,
          cgst: gstRate ? half : undefined,
          sgst: gstRate ? half : undefined,
        },
      ],
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
          <input name="hsn" placeholder="HSN (optional)" className="rounded border px-3 py-2" />
          <input name="gst" type="number" placeholder="GST % (optional)" className="rounded border px-3 py-2" />
          <input name="total" type="number" placeholder="Bill total" className="sm:col-span-2 rounded border px-3 py-2" required />
          <button type="submit" className="sm:col-span-2 rounded bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}

type LedgerPreviewRow = { date: string; amount: number; note: string; source: string };

export function ChartOfAccountsPage() {
  const childMap = useMemo(() => buildCoaTree(), []);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const map = buildCoaTree();
    const s = new Set<string>();
    for (const a of CHART_OF_ACCOUNTS) {
      if ((map.get(a.id) ?? []).length > 0) s.add(a.id);
    }
    return s;
  });
  const [sel, setSel] = useState<string | null>(null);

  const payments = useLiveCollection<Payment>('payments');
  const expenses = useLiveCollection<CompanyExpense>('companyExpenses');
  const incomes = useLiveCollection<IncomeRecord>('incomeRecords');
  const invoices = useLiveCollection<Invoice>('invoices');
  const customers = useLiveCollection<Customer>('customers');

  const pageHeader = useMemo(
    () => ({
      title: 'Chart of accounts',
      subtitle: 'Hierarchy, search, and mapped preview from expenses, income, invoices, and payments',
    }),
    []
  );
  usePageHeader(pageHeader);

  const keepIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return new Set(CHART_OF_ACCOUNTS.map((a) => a.id));
    const keep = new Set<string>();
    for (const a of CHART_OF_ACCOUNTS) {
      const hit =
        a.name.toLowerCase().includes(q) ||
        (a.code?.toLowerCase().includes(q) ?? false) ||
        (a.sourceHint?.toLowerCase().includes(q) ?? false) ||
        a.id.toLowerCase().includes(q);
      if (hit) {
        keep.add(a.id);
        let p = a.parentId;
        while (p) {
          keep.add(p);
          const parent = CHART_OF_ACCOUNTS.find((x) => x.id === p);
          p = parent?.parentId ?? null;
        }
      }
    }
    return keep;
  }, [search]);

  const ledgerRows = useMemo((): LedgerPreviewRow[] => {
    if (!sel) return [];
    const leafIds = descendantLeafIds(sel);
    const rows: LedgerPreviewRow[] = [];

    for (const e of expenses) {
      if (leafIds.has(expenseToLedger(e).accountId)) {
        rows.push({
          date: e.date,
          amount: e.amount,
          note: e.taxonomyKey ? `${e.category} (${e.taxonomyKey})` : e.category,
          source: 'Expense',
        });
      }
    }
    for (const i of incomes) {
      if (leafIds.has(incomeToLedger(i).accountId)) {
        rows.push({
          date: i.date,
          amount: i.amount,
          note: i.taxonomyKey ? `${i.category} (${i.taxonomyKey})` : i.category,
          source: 'Income',
        });
      }
    }
    for (const p of payments) {
      if (leafIds.has(paymentToLedger(p).accountId)) {
        const inv = invoices.find((x) => x.id === p.invoiceId);
        rows.push({
          date: p.date,
          amount: p.amount,
          note: `${p.mode}${inv ? ` — ${inv.invoiceNumber}` : ''}`,
          source: 'Payment',
        });
      }
    }
    for (const inv of invoices) {
      if (leafIds.has(invoiceToLedger(inv).accountId)) {
        const cust = customers.find((c) => c.id === inv.customerId);
        rows.push({
          date: inv.date,
          amount: inv.total,
          note: `${inv.invoiceNumber}${cust ? ` — ${cust.name}` : ''} (revenue)`,
          source: 'Invoice',
        });
      }
      if (inv.balance > 0 && leafIds.has(invoiceReceivableLedger(inv).accountId)) {
        const cust = customers.find((c) => c.id === inv.customerId);
        rows.push({
          date: inv.date,
          amount: inv.balance,
          note: `${inv.invoiceNumber}${cust ? ` — ${cust.name}` : ''} (outstanding)`,
          source: 'Receivable',
        });
      }
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows.slice(0, 150);
  }, [sel, expenses, incomes, payments, invoices, customers]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderCoaLevel(parentKey: string | null, depth: number): ReactNode {
    const nodes = (childMap.get(parentKey) ?? []).filter((n) => keepIds.has(n.id));
    return nodes.map((a) => {
      const visibleKids = (childMap.get(a.id) ?? []).filter((k) => keepIds.has(k.id));
      const hasKids = visibleKids.length > 0;
      const open = expanded.has(a.id);
      const pad = { paddingLeft: `${8 + depth * 14}px` };
      return (
        <li key={a.id} className="border-b border-border/60 last:border-0">
          <div className="flex items-center gap-1 py-1.5 text-sm" style={pad}>
            {hasKids ? (
              <button
                type="button"
                className="w-6 shrink-0 text-muted-foreground hover:text-foreground"
                aria-expanded={open}
                onClick={() => toggleExpand(a.id)}
              >
                {open ? '▾' : '▸'}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}
            <button
              type="button"
              className={`text-left hover:underline ${sel === a.id ? 'font-semibold text-primary' : ''}`}
              onClick={() => setSel(a.id)}
            >
              <span className="text-foreground">{a.name}</span>
              {a.code ? <span className="ml-2 text-xs text-muted-foreground">{a.code}</span> : null}
              <span className="ml-2 text-xs uppercase text-muted-foreground">{a.nature}</span>
            </button>
          </div>
          {hasKids && open ? <ul className="ml-0">{renderCoaLevel(a.id, depth + 1)}</ul> : null}
        </li>
      );
    });
  }

  const selectedAccount = sel ? CHART_OF_ACCOUNTS.find((x) => x.id === sel) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chart of accounts</h1>
          <p className="text-sm text-muted-foreground">Click an account to preview mapped transactions (taxonomy-driven).</p>
        </div>
        <label className="flex max-w-md flex-1 flex-col text-sm">
          <span className="mb-1 text-muted-foreground">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, code, or id"
            className="rounded-lg border border-input bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-medium">Account tree</div>
          <ul className="max-h-[min(70vh,520px)] overflow-y-auto">{renderCoaLevel(null, 0)}</ul>
        </Card>
        <Card padding="md" className="min-h-[200px]">
          <h2 className="font-semibold">Ledger preview</h2>
          {selectedAccount?.sourceHint ? (
            <p className="mt-1 text-xs text-muted-foreground">{selectedAccount.sourceHint}</p>
          ) : null}
          {!sel ? (
            <p className="mt-3 text-sm text-muted-foreground">Select an account on the left. Groups include all leaf accounts underneath.</p>
          ) : ledgerRows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No mapped rows for this selection yet.</p>
          ) : (
            <ul className="mt-3 max-h-[min(60vh,480px)] space-y-2 overflow-y-auto text-sm">
              {ledgerRows.map((t, i) => (
                <li key={`${t.source}-${t.date}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">
                    {t.date} · <span className="text-foreground">{t.source}</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatINRDecimal(t.amount)}</span>
                  <span className="w-full text-xs text-muted-foreground">{t.note}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
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
