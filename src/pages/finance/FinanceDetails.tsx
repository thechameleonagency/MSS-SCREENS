import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DocumentPreviewFrame } from '../../components/DocumentPreviewFrame';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { requirePositiveAmount, optionalNonNegativeNumber, requireNonEmptyTrimmed } from '../../lib/formValidation';
import { formatINRDecimal, partnerProfitShareType2, partnerContributionTotal } from '../../lib/helpers';
import { computeGstBreakup, gstinSameState, invoiceGrandTotal } from '../../lib/gstCompute';
import { exportDomToPdf } from '../../lib/pdfExport';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  ChannelPartner,
  ChannelPartnerFee,
  Customer,
  InvoiceLineItem,
  Loan,
  Partner,
  PartnerSettlement,
  Project,
  PurchaseBill,
  SaleBill,
  Supplier,
  VendorPayment,
} from '../../types';

export function SaleBillNew() {
  const navigate = useNavigate();
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const { bump, version } = useDataRefresh();
  const { show } = useToast();
  const company = useMemo(() => getItem<{ gst: string }>('companyProfile'), [version]);
  const [pid, setPid] = useState(projects[0]?.id ?? '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: 'Sale', hsn: '', quantity: 1, rate: 25000, gstRate: 18, amount: 25000 },
  ]);
  const [customerGstin, setCustomerGstin] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [forceIgst, setForceIgst] = useState(false);

  const proj = projects.find((p) => p.id === pid);
  const cust = proj ? customers.find((c) => c.id === proj.customerId) : undefined;

  const sameState = forceIgst ? false : gstinSameState(company?.gst, customerGstin || cust?.gstin);
  const breakup = useMemo(() => computeGstBreakup(lineItems, undefined, sameState), [lineItems, sameState]);
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
    const p = projects.find((x) => x.id === pid);
    if (!p) return;
    if (!lineItems.length || lineItems.some((l) => !l.description.trim())) {
      show('Each line needs a description', 'error');
      return;
    }
    const list = getCollection<SaleBill>('saleBills');
    const c = customers.find((x) => x.id === p.customerId);
    const sb: SaleBill = {
      id: generateId('sb'),
      projectId: p.id,
      customerId: p.customerId,
      billNumber: `SB-${new Date().getFullYear()}-${String(list.length + 50).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      total: grandTotal,
      received: 0,
      balance: grandTotal,
      status: 'Unpaid',
      lineItems,
      customerGstin: customerGstin.trim() || c?.gstin,
      placeOfSupply: placeOfSupply.trim() || undefined,
      gstBreakup: breakup,
      createdAt: new Date().toISOString(),
    };
    setCollection('saleBills', [...list, sb]);
    bump();
    show('Sale bill created', 'success');
    navigate(`/finance/sale-bills/${sb.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/finance/sale-bills" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">New sale bill</h1>
      <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-4">
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
          Customer GSTIN
          <input className="mt-1 w-full rounded border px-3 py-2" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} />
        </label>
        <label className="block text-sm">
          Place of supply
          <input className="mt-1 w-full rounded border px-3 py-2" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={forceIgst} onChange={(e) => setForceIgst(e.target.checked)} />
          Inter-state (IGST)
        </label>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="py-1">Description</th>
              <th className="py-1">Qty</th>
              <th className="py-1">Rate</th>
              <th className="py-1">GST%</th>
              <th className="py-1">Taxable</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-1 pr-1">
                  <input
                    className="w-full rounded border px-2 py-1"
                    value={li.description}
                    onChange={(e) => updateLine(idx, { description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="w-16 rounded border px-2 py-1"
                    value={li.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="w-24 rounded border px-2 py-1"
                    value={li.rate}
                    onChange={(e) => updateLine(idx, { rate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="w-14 rounded border px-2 py-1"
                    value={li.gstRate}
                    onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>{li.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm font-medium">Grand total: {formatINRDecimal(grandTotal)}</p>
        <ShellButton type="submit" variant="primary">
          Create
        </ShellButton>
      </form>
    </div>
  );
}

export function SaleBillDetail() {
  const { id } = useParams();
  const bills = useLiveCollection<SaleBill>('saleBills');
  const customers = useLiveCollection<Customer>('customers');
  const { version } = useDataRefresh();
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const projects = useLiveCollection<Project>('projects');
  const company = useMemo(() => getItem<{ name: string; gst: string; address: string }>('companyProfile'), [version]);
  const row = bills.find((b) => b.id === id);
  if (!row) return <p>Not found</p>;
  const bill = row;
  const cust = customers.find((c) => c.id === bill.customerId);
  const proj = projects.find((p) => p.id === bill.projectId);

  async function downloadPdf() {
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      await exportDomToPdf(printRef.current, bill.billNumber);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link to="/finance/sale-bills" className="text-sm text-primary">
          ← Back
        </Link>
        <ShellButton type="button" variant="secondary" disabled={pdfBusy} onClick={() => void downloadPdf()}>
          {pdfBusy ? 'PDF…' : 'Download PDF'}
        </ShellButton>
      </div>
      <h1 className="text-2xl font-bold">{bill.billNumber}</h1>
      <div ref={printRef} className="space-y-4 rounded-lg border bg-card p-4 text-sm">
        <DocumentPreviewFrame
          company={{
            name: company?.name ?? 'Company',
            gst: company?.gst,
            address: company?.address,
          }}
          partyTitle="Bill to"
          partyName={cust?.name ?? 'Customer'}
          partyDetails={cust?.address ? <p>{cust.address}</p> : null}
          documentKind="Sale bill"
          reference={bill.billNumber}
          dateValue={bill.date}
          extraMeta={[
            ...(bill.placeOfSupply ? [{ label: 'Place of supply', value: bill.placeOfSupply }] : []),
            ...(proj ? [{ label: 'Project', value: proj.name }] : []),
            ...(bill.customerGstin || cust?.gstin
              ? [{ label: 'Customer GSTIN', value: bill.customerGstin ?? cust?.gstin ?? '' }]
              : []),
          ]}
          summary={
            <>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(bill.total)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(bill.received)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold text-foreground">{formatINRDecimal(bill.balance)}</p>
                <p className="text-xs font-medium text-muted-foreground">{bill.status}</p>
              </div>
            </>
          }
        />
        {bill.lineItems && bill.lineItems.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-1">Item</th>
                <th className="py-1">Taxable</th>
              </tr>
            </thead>
            <tbody>
              {bill.lineItems.map((li, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{li.description}</td>
                  <td>{formatINRDecimal(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {bill.gstBreakup && (
          <div className="border-t pt-2">
            {bill.gstBreakup.igst > 0 ? (
              <p>IGST: {formatINRDecimal(bill.gstBreakup.igst)}</p>
            ) : (
              <p>
                CGST: {formatINRDecimal(bill.gstBreakup.cgst)} · SGST: {formatINRDecimal(bill.gstBreakup.sgst)}
              </p>
            )}
          </div>
        )}
        {bill.notes && <p className="border-t pt-3 text-muted-foreground">Notes: {bill.notes}</p>}
      </div>
    </div>
  );
}

export function LoanNew() {
  const navigate = useNavigate();
  const projects = useLiveCollection<Project>('projects');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [source, setSource] = useState('');
  const [type, setType] = useState<Loan['type']>('EMI');
  const [principal, setPrincipal] = useState('500000');
  const [rate, setRate] = useState('12');
  const [paymentInfo, setPaymentInfo] = useState('₹0/mo');
  const [projectId, setProjectId] = useState('');

  function save(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(principal) || 0;
    const list = getCollection<Loan>('loans');
    const loan: Loan = {
      id: generateId('loan'),
      source: source || 'New loan',
      type,
      principal: p,
      rate: Number(rate) || undefined,
      paymentInfo: paymentInfo || '—',
      outstanding: p,
      status: 'Active',
      projectId: projectId || undefined,
      repayments: [],
      createdAt: new Date().toISOString(),
    };
    setCollection('loans', [...list, loan]);
    bump();
    show('Loan added', 'success');
    navigate('/finance/loans');
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link to="/finance/loans" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">New loan</h1>
      <form onSubmit={save} className="space-y-3 rounded-lg border bg-card p-4">
        <input required placeholder="Source / lender" className="w-full rounded border px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)} />
        <select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as Loan['type'])}>
          <option value="EMI">EMI</option>
          <option value="One-Time">One-Time</option>
          <option value="Reminder">Reminder</option>
        </select>
        <input placeholder="Principal" className="w-full rounded border px-3 py-2" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        <input placeholder="Rate % (optional)" className="w-full rounded border px-3 py-2" value={rate} onChange={(e) => setRate(e.target.value)} />
        <input placeholder="Payment info" className="w-full rounded border px-3 py-2" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} />
        <label className="block text-sm">
          Link project (optional)
          <select className="mt-1 w-full rounded border px-3 py-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Save
        </button>
      </form>
    </div>
  );
}

export function VendorDetail() {
  const { id } = useParams();
  const suppliers = useLiveCollection<Supplier>('suppliers');
  const bills = useLiveCollection<PurchaseBill>('purchaseBills');
  const vpay = useLiveCollection<VendorPayment>('vendorPayments');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [billId, setBillId] = useState('');
  const [pamt, setPamt] = useState('');
  const [pdate, setPdate] = useState(() => new Date().toISOString().slice(0, 10));

  const s = suppliers.find((x) => x.id === id);
  const mine = bills.filter((b) => b.supplierId === id);
  const payments = vpay.filter((p) => p.supplierId === id);

  if (!s) return <p>Not found</p>;
  const supplier = s;

  function recordVendorPay() {
    const bill = bills.find((b) => b.id === billId);
    const amount = Number(pamt);
    if (!bill || amount <= 0) {
      show('Select bill and amount', 'error');
      return;
    }
    const plist = getCollection<VendorPayment>('vendorPayments');
    setCollection('vendorPayments', [
      ...plist,
      {
        id: generateId('vpay'),
        purchaseBillId: bill.id,
        supplierId: supplier.id,
        amount,
        date: pdate,
        createdAt: new Date().toISOString(),
      },
    ]);
    const blist = getCollection<PurchaseBill>('purchaseBills');
    const paid = bill.paid + amount;
    const due = bill.total - paid;
    const status = due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    setCollection(
      'purchaseBills',
      blist.map((b) => (b.id === bill.id ? { ...b, paid, due, status } : b))
    );
    const totalPaid = payments.reduce((x, p) => x + p.amount, 0) + amount;
    const totalPurchases = mine.reduce((x, b) => x + b.total, 0);
    const slist = getCollection<Supplier>('suppliers');
    setCollection(
      'suppliers',
      slist.map((sup) =>
        sup.id === supplier.id
          ? { ...sup, totalPaid, outstanding: totalPurchases - totalPaid }
          : sup
      )
    );
    bump();
    setPayOpen(false);
    show('Vendor payment recorded', 'success');
  }

  return (
    <div className="space-y-4">
      <Link to="/finance/vendors" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{supplier.name}</h1>
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p>{supplier.contact} · {supplier.email}</p>
        <p>{supplier.address}</p>
        <p className="mt-2">Outstanding: {formatINRDecimal(supplier.outstanding)}</p>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Purchase bills</h2>
        <button type="button" className="text-sm text-primary" onClick={() => setPayOpen(true)}>
          Record payment
        </button>
      </div>
      <ul className="text-sm space-y-2">
        {mine.map((b) => (
          <li key={b.id} className="rounded border border-border p-2">
            {b.billNumber} — {b.date} — {formatINRDecimal(b.total)} — {b.status} (due {formatINRDecimal(b.due)})
          </li>
        ))}
      </ul>
      <h2 className="font-semibold">Payments</h2>
      <ul className="text-sm">
        {payments.map((p) => (
          <li key={p.id}>
            {p.date}: {formatINRDecimal(p.amount)}
          </li>
        ))}
      </ul>
      <Modal open={payOpen} title="Record vendor payment" onClose={() => setPayOpen(false)}>
        <select className="mb-2 w-full rounded border px-3 py-2" value={billId} onChange={(e) => setBillId(e.target.value)}>
          <option value="">Select bill</option>
          {mine.filter((b) => b.due > 0).map((b) => (
            <option key={b.id} value={b.id}>
              {b.billNumber} (due {formatINRDecimal(b.due)})
            </option>
          ))}
        </select>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={pamt} onChange={(e) => setPamt(e.target.value)} />
        <input type="date" className="mb-2 w-full rounded border px-3 py-2" value={pdate} onChange={(e) => setPdate(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={recordVendorPay}>
          Save
        </button>
      </Modal>
    </div>
  );
}

export function PartnerDetail() {
  const { id } = useParams();
  const partners = useLiveCollection<Partner>('partners');
  const projects = useLiveCollection<Project>('projects');
  const settlements = useLiveCollection<PartnerSettlement>('partnerSettlements');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [settleOpen, setSettleOpen] = useState(false);
  const [setAmt, setSetAmt] = useState('');
  const [setNotes, setSetNotes] = useState('');
  const [contribOpen, setContribOpen] = useState(false);
  const [projPick, setProjPick] = useState('');
  const [laborDesc, setLaborDesc] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [laborCost, setLaborCost] = useState('');

  const p = partners.find((x) => x.id === id);
  if (!p) return <p>Not found</p>;
  const partner = p;

  const linked = projects.filter(
    (pr) =>
      pr.partnerId === partner.id &&
      (pr.type === 'Partner (Profit Only)' || pr.type === 'Partner with Contributions')
  );

  const suggested = useMemo(() => {
    return linked.map((pr) => ({
      project: pr,
      share:
        pr.type === 'Partner (Profit Only)'
          ? partnerProfitShareType2(pr, partner.profitSharePercent)
          : partnerProfitShareType2(pr, partner.profitSharePercent) -
            partnerContributionTotal(pr) * (partner.profitSharePercent / 100),
    }));
  }, [linked, partner.profitSharePercent]);

  function settle() {
    const amount = Number(setAmt);
    if (amount <= 0) {
      show('Enter a positive settlement amount', 'error');
      return;
    }
    const list = getCollection<PartnerSettlement>('partnerSettlements');
    setCollection('partnerSettlements', [
      ...list,
      {
        id: generateId('ps'),
        partnerId: partner.id,
        projectId: projPick || undefined,
        amount,
        date: new Date().toISOString().slice(0, 10),
        notes: setNotes,
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setSettleOpen(false);
    show('Settlement recorded', 'success');
  }

  function addLaborContrib() {
    const pr = projects.find((x) => x.id === projPick);
    if (!pr || pr.type !== 'Partner with Contributions') {
      show('Pick a Partner with Contributions project', 'error');
      return;
    }
    const descErr = requireNonEmptyTrimmed(laborDesc, 'Description');
    if (descErr) {
      show(descErr, 'error');
      return;
    }
    const cost = requirePositiveAmount(laborCost, 'Cost');
    if (cost == null) {
      show('Cost must be a positive number', 'error');
      return;
    }
    const hoursParsed = optionalNonNegativeNumber(laborHours, 'Hours');
    if (typeof hoursParsed === 'object' && 'error' in hoursParsed) {
      show(hoursParsed.error, 'error');
      return;
    }
    const hours = hoursParsed;
    const desc = laborDesc.trim();
    const laborId = generateId('lab');
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) => {
        if (proj.id !== pr.id) return proj;
        const pc = proj.partnerContributions ?? { labor: [], materials: [] };
        return {
          ...proj,
          partnerContributions: {
            ...pc,
            labor: [
              ...pc.labor,
              { id: laborId, description: desc, hours, cost, date: new Date().toISOString().slice(0, 10) },
            ],
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    bump();
    setContribOpen(false);
    setLaborDesc('');
    setLaborHours('');
    setLaborCost('');
    show('Contribution added', 'success');
  }

  return (
    <div className="space-y-4">
      <Link to="/finance/partners" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{partner.name}</h1>
      <p className="text-sm">Profit share: {partner.profitSharePercent}% · {partner.contact}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => setSettleOpen(true)}>
          Settle profit
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setContribOpen(true)}>
          Add contribution (Type 4)
        </button>
      </div>
      <h2 className="font-semibold">Linked projects</h2>
      <ul className="text-sm space-y-2">
        {suggested.map(({ project, share }) => (
          <li key={project.id} className="rounded border p-2">
            <Link className="text-primary" to={`/projects/${project.id}`}>
              {project.name}
            </Link>
            <div className="text-xs text-muted-foreground">
              {project.type} · Est. share: {formatINRDecimal(Math.max(0, share))}
            </div>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold">Settlements</h2>
      <ul className="text-sm">
        {settlements
          .filter((x) => x.partnerId === partner.id)
          .map((x) => (
            <li key={x.id}>
              {x.date}: {formatINRDecimal(x.amount)} — {x.notes}
            </li>
          ))}
      </ul>
      <Modal open={settleOpen} title="Partner settlement" onClose={() => setSettleOpen(false)}>
        <select className="mb-2 w-full rounded border px-3 py-2" value={projPick} onChange={(e) => setProjPick(e.target.value)}>
          <option value="">All / no project</option>
          {linked.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.name}
            </option>
          ))}
        </select>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount ₹" value={setAmt} onChange={(e) => setSetAmt(e.target.value)} />
        <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Notes" value={setNotes} onChange={(e) => setSetNotes(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={settle}>
          Record
        </button>
      </Modal>
      <Modal
        open={contribOpen}
        title="Partner labor contribution"
        onClose={() => {
          setContribOpen(false);
          setLaborDesc('');
          setLaborHours('');
          setLaborCost('');
        }}
      >
        <select className="select-shell mb-2 w-full" value={projPick} onChange={(e) => setProjPick(e.target.value)}>
          <option value="">Select Type 4 project</option>
          {linked.filter((x) => x.type === 'Partner with Contributions').map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.name}
            </option>
          ))}
        </select>
        <label className="mb-2 block text-sm">
          Description *
          <input className="input-shell mt-1 w-full" value={laborDesc} onChange={(e) => setLaborDesc(e.target.value)} />
        </label>
        <label className="mb-2 block text-sm">
          Hours (optional)
          <input className="input-shell mt-1 w-full" type="number" min={0} step={0.5} value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
        </label>
        <label className="mb-3 block text-sm">
          Cost ₹ *
          <input className="input-shell mt-1 w-full" type="number" min={0} step={1} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
        </label>
        <ShellButton type="button" variant="primary" onClick={addLaborContrib}>
          Add labor
        </ShellButton>
      </Modal>
    </div>
  );
}

export function ChannelPartnerDetail() {
  const { id } = useParams();
  const cps = useLiveCollection<ChannelPartner>('channelPartners');
  const projects = useLiveCollection<Project>('projects');
  const fees = useLiveCollection<ChannelPartnerFee>('channelFees');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState('');
  const [pid, setPid] = useState('');
  const [notes, setNotes] = useState('');

  const cp = cps.find((x) => x.id === id);
  if (!cp) return <p>Not found</p>;
  const channelPartner = cp;

  const linked = projects.filter((pr) => pr.channelPartnerId === channelPartner.id);
  const myFees = fees.filter((f) => f.channelPartnerId === channelPartner.id);

  function addFee() {
    const amount = Number(amt);
    if (amount <= 0) {
      show('Enter a positive fee amount', 'error');
      return;
    }
    const list = getCollection<ChannelPartnerFee>('channelFees');
    setCollection('channelFees', [
      ...list,
      {
        id: generateId('cf'),
        channelPartnerId: channelPartner.id,
        projectId: pid || undefined,
        amount,
        date: new Date().toISOString().slice(0, 10),
        notes,
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    show('Fee recorded', 'success');
  }

  return (
    <div className="space-y-4">
      <Link to="/finance/channel-partners" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{channelPartner.name}</h1>
      <p className="text-sm">
        Code {channelPartner.vendorCode} · {channelPartner.feeStructure} ₹{channelPartner.feeAmount}
      </p>
      <button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
        Record fee payment
      </button>
      <h2 className="font-semibold">Projects</h2>
      <ul className="text-sm">
        {linked.map((pr) => (
          <li key={pr.id}>
            <Link className="text-primary" to={`/projects/${pr.id}`}>
              {pr.name}
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold">Fees received</h2>
      <ul className="text-sm">
        {myFees.map((f) => (
          <li key={f.id}>
            {f.date}: {formatINRDecimal(f.amount)} {f.notes}
          </li>
        ))}
      </ul>
      <Modal open={open} title="Channel partner fee" onClose={() => setOpen(false)}>
        <select className="mb-2 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">Project (optional)</option>
          {projects.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.name}
            </option>
          ))}
        </select>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={addFee}>
          Save
        </button>
      </Modal>
    </div>
  );
}

export function PartnersFinanceListEnhanced() {
  const partners = useLiveCollection<Partner>('partners');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [pct, setPct] = useState('25');

  function add() {
    const list = getCollection<Partner>('partners');
    setCollection('partners', [
      ...list,
      {
        id: generateId('part'),
        name,
        contact,
        profitSharePercent: Number(pct) || 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    show('Partner added', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Partners</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add partner
        </button>
      </div>
      <ul className="space-y-2 text-sm">
        {partners.map((p) => (
          <li key={p.id} className="rounded-lg border bg-card p-3 flex justify-between">
            <span>
              {p.name} — share {p.profitSharePercent}%
            </span>
            <Link className="text-primary" to={`/finance/partners/${p.id}`}>
              View
            </Link>
          </li>
        ))}
      </ul>
      <Modal open={open} title="Add partner" onClose={() => setOpen(false)}>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Profit share %" value={pct} onChange={(e) => setPct(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={add}>
          Save
        </button>
      </Modal>
    </div>
  );
}

export function ChannelPartnersFinanceListEnhanced() {
  const cps = useLiveCollection<ChannelPartner>('channelPartners');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [feeStructure, setFeeStructure] = useState<ChannelPartner['feeStructure']>('Per kW');
  const [feeAmount, setFeeAmount] = useState('350');

  function add() {
    const list = getCollection<ChannelPartner>('channelPartners');
    setCollection('channelPartners', [
      ...list,
      {
        id: generateId('ch'),
        name,
        vendorCode: code,
        contact,
        pricingTier: 'Wholesale',
        feeStructure,
        feeAmount: Number(feeAmount) || 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    show('Channel partner added', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Channel partners</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add channel partner
        </button>
      </div>
      <ul className="text-sm space-y-2">
        {cps.map((c) => (
          <li key={c.id} className="rounded border bg-card p-3 flex justify-between">
            <span>
              {c.name} ({c.vendorCode}) — {c.feeStructure} ₹{c.feeAmount}
            </span>
            <Link className="text-primary" to={`/finance/channel-partners/${c.id}`}>
              View
            </Link>
          </li>
        ))}
      </ul>
      <Modal open={open} title="Add channel partner" onClose={() => setOpen(false)}>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Vendor code" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
        <select className="mb-2 w-full rounded border px-3 py-2" value={feeStructure} onChange={(e) => setFeeStructure(e.target.value as ChannelPartner['feeStructure'])}>
          <option value="Per kW">Per kW</option>
          <option value="Fixed">Fixed</option>
          <option value="Percentage">Percentage</option>
        </select>
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Fee amount" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
        <button type="button" className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={add}>
          Save
        </button>
      </Modal>
    </div>
  );
}
