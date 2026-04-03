import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  computeEffectivePrice,
  defaultProgressSteps,
  lineItemsTotal,
  formatINRDecimal,
} from '../../lib/helpers';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  ChannelPartner,
  Customer,
  Enquiry,
  Material,
  Partner,
  Preset,
  Project,
  Quotation,
  QuotationStatus,
} from '../../types';

export function QuotationsList() {
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const navigate = useNavigate();
  const [st, setSt] = useState('');

  const rows = useMemo(() => {
    return quotations.filter((q) => !st || q.status === st);
  }, [quotations, st]);

  const name = (cid: string) => customers.find((c) => c.id === cid)?.name ?? cid;

  const pageHeader = useMemo(
    () => ({
      title: 'Quotations',
      subtitle: 'Pricing, approval, and project creation',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => navigate('/sales/quotations/new')}>
          New quotation
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(pageHeader);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <label className="block text-sm text-muted-foreground">
          Filter by status
          <select className="select-shell mt-1 max-w-xs" value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="">All status</option>
            {(['Draft', 'Sent', 'Approved', 'Rejected', 'Confirmed'] as QuotationStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/90">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Ref</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Customer</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-t border-border transition hover:bg-muted/80">
                  <td className="px-4 py-3 font-medium text-foreground">{q.reference}</td>
                  <td className="px-4 py-3 text-muted-foreground">{name(q.customerId)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatINRDecimal(q.effectivePrice)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{q.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/quotations/${q.id}`}>
                      Open
                    </Link>
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

export function QuotationNew() {
  const [search] = useSearchParams();
  const enquiryId = search.get('enquiryId') ?? '';
  const navigate = useNavigate();
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const presets = useLiveCollection<Preset>('presets');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const agents = useLiveCollection<{ id: string }>('agents');
  const { bump } = useDataRefresh();
  const { show } = useToast();

  const enq = enquiries.find((e) => e.id === enquiryId);
  const [customerId, setCustomerId] = useState(enq ? '' : customers[0]?.id ?? '');
  const [presetId, setPresetId] = useState(
    () => presets.find((p) => p.type === 'Quotation')?.id ?? ''
  );
  const [lineItems, setLineItems] = useState(() => {
    const pr = presets.find((p) => p.type === 'Quotation');
    if (!pr) return [] as Quotation['lineItems'];
    return pr.items.map((it) => {
      const m = materials.find((x) => x.id === it.materialId);
      const rate = m?.saleRateRetail ?? 0;
      return {
        materialId: it.materialId,
        quantity: it.quantity,
        rate,
        total: it.quantity * rate,
      };
    });
  });
  const [discount, setDiscount] = useState(2);
  const [gst, setGst] = useState(18);
  const [notes, setNotes] = useState('');

  const subtotal = lineItemsTotal(lineItems);

  function applyPreset(pid: string) {
    const pr = presets.find((p) => p.id === pid && p.type === 'Quotation');
    if (!pr) return;
    setLineItems(
      pr.items.map((it) => {
        const m = materials.find((x) => x.id === it.materialId);
        const rate = m?.saleRateRetail ?? 0;
        return {
          materialId: it.materialId,
          quantity: it.quantity,
          rate,
          total: it.quantity * rate,
        };
      })
    );
  }

  function save(status: QuotationStatus = 'Draft') {
    if (!customerId) {
      show('Select customer', 'error');
      return;
    }
    if (status !== 'Draft' && lineItems.length === 0) {
      show('Add at least one line item', 'error');
      return;
    }
    const list = getCollection<Quotation>('quotations');
    const ref = `QUO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const st = lineItemsTotal(lineItems);
    const q: Quotation = {
      id: generateId('quo'),
      customerId,
      enquiryId: enquiryId || undefined,
      agentId: enq?.source.type === 'Agent' ? enq.source.agentId : agents[0]?.id,
      reference: ref,
      systemConfigPresetId: presetId || presets[0]!.id,
      lineItems,
      discountPercent: discount,
      gstPercent: gst,
      effectivePrice: computeEffectivePrice(st, discount, gst),
      paymentTerms: [
        { label: 'Advance', percent: 20 },
        { label: 'Installation', percent: 60 },
        { label: 'DCR', percent: 20 },
      ],
      warrantyInfo: [
        { component: 'Panels', years: 25 },
        { component: 'Inverter', years: 10 },
      ],
      additionalNotes: notes,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('quotations', [...list, q]);
    if (enquiryId) {
      const enqs = getCollection<Enquiry>('enquiries');
      setCollection(
        'enquiries',
        enqs.map((e) =>
          e.id === enquiryId
            ? { ...e, status: 'Converted' as const, updatedAt: new Date().toISOString() }
            : e
        )
      );
    }
    bump();
    show('Quotation saved', 'success');
    navigate(`/sales/quotations/${q.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/sales/quotations" className="text-sm text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">New quotation</h1>
      {enq && (
        <p className="text-sm text-muted-foreground">
          From enquiry: {enq.customerName} — create/select customer below to link.
        </p>
      )}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <label className="block text-sm">
          Customer *
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Load preset (Type A)
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={presetId}
            onChange={(e) => {
              setPresetId(e.target.value);
              applyPreset(e.target.value);
            }}
          >
            {presets
              .filter((p) => p.type === 'Quotation')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <div className="text-sm">
          <div className="font-medium">Line items (retail rate)</div>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-1">Material</th>
                <th className="py-1">Qty</th>
                <th className="py-1">Rate</th>
                <th className="py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => {
                const m = materials.find((x) => x.id === li.materialId);
                return (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-1">{m?.name ?? li.materialId}</td>
                    <td className="py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-20 rounded border px-2 py-1"
                        value={li.quantity}
                        onChange={(e) => {
                          const q = Number(e.target.value) || 0;
                          const next = [...lineItems];
                          next[idx] = {
                            ...li,
                            quantity: q,
                            total: q * li.rate,
                          };
                          setLineItems(next);
                        }}
                      />
                    </td>
                    <td className="py-1">{li.rate}</td>
                    <td className="py-1">{li.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            Discount %
            <input
              type="number"
              className="ml-2 w-20 rounded border px-2 py-1"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-sm">
            GST %
            <input
              type="number"
              className="ml-2 w-20 rounded border px-2 py-1"
              value={gst}
              onChange={(e) => setGst(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <p className="text-sm">
          Subtotal: {formatINRDecimal(subtotal)} → Effective:{' '}
          <strong>{formatINRDecimal(computeEffectivePrice(subtotal, discount, gst))}</strong>
        </p>
        <label className="block text-sm">
          Notes
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2"
            onClick={() => save('Draft')}
          >
            Save draft
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => save('Draft')}
          >
            Save & continue
          </button>
        </div>
      </div>
    </div>
  );
}

type PaymentTypeChoice = NonNullable<Quotation['paymentType']>;

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const foundQuote = quotations.find((x) => x.id === id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [payType, setPayType] = useState<PaymentTypeChoice>('Cash');
  const [kNum, setKNum] = useState('');
  const [lender, setLender] = useState('');
  const [projType, setProjType] = useState<Project['type']>('Solo');

  if (!foundQuote) return <p>Not found</p>;
  const quotation = foundQuote;

  const cust = customers.find((c) => c.id === quotation.customerId);

  function patch(updates: Partial<Quotation>) {
    const list = getCollection<Quotation>('quotations');
    setCollection(
      'quotations',
      list.map((x) =>
        x.id === quotation.id
          ? { ...x, ...updates, updatedAt: new Date().toISOString() }
          : x
      )
    );
    bump();
  }

  function share() {
    if (!quotation.lineItems.length || !quotation.customerId) {
      show('Need customer and line items', 'error');
      return;
    }
    patch({ status: 'Sent', sentDate: new Date().toISOString() });
    show('Marked as Sent (share simulated)', 'success');
  }

  function approve() {
    patch({ status: 'Approved', approvedDate: new Date().toISOString() });
    show('Approved', 'success');
  }

  function reject() {
    const reason = window.prompt('Reason?') ?? '';
    patch({ status: 'Rejected', additionalNotes: quotation.additionalNotes + '\nReject: ' + reason });
    show('Rejected', 'info');
  }

  function confirm() {
    if (payType === 'Bank Loan' || payType === 'Bank Loan + Cash') {
      if (!kNum.trim() || !lender.trim()) {
        show('K number and lender required for bank loan', 'error');
        return;
      }
    }
    patch({
      status: 'Confirmed',
      paymentType: payType,
      bankLoanDetails:
        payType === 'Cash'
          ? undefined
          : {
              kNumber: kNum,
              lender,
              amount: quotation.effectivePrice * 0.7,
              approvalStatus: 'Pending',
            },
    });
    setConfirmOpen(false);
    show('Confirmed', 'success');
  }

  function createProject() {
    const projects = getCollection<Project>('projects');
    const enq = quotation.enquiryId
      ? getCollection<Enquiry>('enquiries').find((e) => e.id === quotation.enquiryId)
      : undefined;
    const capacity = enq?.systemCapacity ?? 5;
    const progressSteps =
      projType === 'Vendorship Fee'
        ? defaultProgressSteps()
            .slice(0, 2)
            .map((s, i) => ({ ...s, step: (i + 1) as 1 | 2, name: i === 0 ? 'Payment' : 'Product' }))
        : defaultProgressSteps();
    const proj: Project = {
      id: generateId('proj'),
      name: `${cust?.name ?? 'Project'} ${capacity}kW`,
      type: projType,
      category: enq?.type === 'Commercial' ? 'Commercial' : 'Residential',
      status: 'New',
      customerId: quotation.customerId,
      quotationId: quotation.id,
      agentId: quotation.agentId,
      partnerId:
        projType === 'Partner (Profit Only)' || projType === 'Partner with Contributions'
          ? getCollection<Partner>('partners')[0]?.id
          : undefined,
      channelPartnerId: projType === 'Vendorship Fee'
        ? getCollection<ChannelPartner>('channelPartners')[0]?.id
        : undefined,
      capacity,
      contractAmount: quotation.effectivePrice,
      startDate: new Date().toISOString().slice(0, 10),
      address: cust?.address ?? '',
      progressSteps,
      blockages: [],
      paymentType: quotation.paymentType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('projects', [...projects, proj]);
    bump();
    setProjOpen(false);
    show('Project created', 'success');
    navigate(`/projects/${proj.id}`);
  }

  return (
    <div className="space-y-4">
      <Link to="/sales/quotations" className="text-sm text-primary hover:underline">
        ← Back
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{quotation.reference}</h1>
          <p className="text-sm text-muted-foreground">{cust?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quotation.status === 'Draft' && (
            <button type="button" className="rounded-lg bg-foreground px-3 py-2 text-sm text-background" onClick={() => setShareOpen(true)}>
              Share
            </button>
          )}
          {quotation.status === 'Sent' && (
            <>
              <button type="button" className="rounded-lg bg-success px-3 py-2 text-sm text-success-foreground" onClick={approve}>
                Approve
              </button>
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={reject}>
                Reject
              </button>
            </>
          )}
          {quotation.status === 'Approved' && (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => setConfirmOpen(true)}
            >
              Confirm (payment)
            </button>
          )}
          {quotation.status === 'Confirmed' && (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => setProjOpen(true)}
            >
              Create project
            </button>
          )}
          <Link
            to={`/sales/quotations/${quotation.id}/preview`}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Preview
          </Link>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p>Status: {quotation.status}</p>
        <p>Effective price: {formatINRDecimal(quotation.effectivePrice)}</p>
        {quotation.paymentType && <p>Payment type: {quotation.paymentType}</p>}
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lineItems.map((li, i) => (
              <tr key={i} className="border-t border-border">
                <td>{materials.find((m) => m.id === li.materialId)?.name}</td>
                <td>{li.quantity}</td>
                <td>{li.rate}</td>
                <td>{li.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-muted-foreground">{quotation.additionalNotes}</p>
      </div>

      <Modal open={shareOpen} title="Share quotation" onClose={() => setShareOpen(false)} wide>
        <p className="text-sm text-muted-foreground">Simulate email or WhatsApp by copying the preview link.</p>
        <input
          readOnly
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sales/quotations/${quotation.id}/preview`}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => {
              const url = `${window.location.origin}/sales/quotations/${quotation.id}/preview`;
              void navigator.clipboard.writeText(url).then(() => show('Link copied', 'success'));
            }}
          >
            Copy link
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => {
              share();
              setShareOpen(false);
            }}
          >
            Mark as sent
          </button>
        </div>
      </Modal>

      <Modal open={confirmOpen} title="Confirm quotation" onClose={() => setConfirmOpen(false)} wide>
        <div className="space-y-3">
          <label className="block text-sm">
            Payment type
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={payType}
              onChange={(e) => setPayType(e.target.value as PaymentTypeChoice)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Loan">Bank Loan</option>
              <option value="Bank Loan + Cash">Bank Loan + Cash</option>
            </select>
          </label>
          {(payType === 'Bank Loan' || payType === 'Bank Loan + Cash') && (
            <>
              <label className="block text-sm">
                K number *
                <input className="mt-1 w-full rounded-lg border px-3 py-2" value={kNum} onChange={(e) => setKNum(e.target.value)} />
              </label>
              <label className="block text-sm">
                Lender *
                <input className="mt-1 w-full rounded-lg border px-3 py-2" value={lender} onChange={(e) => setLender(e.target.value)} />
              </label>
            </>
          )}
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={confirm}>
            Confirm
          </button>
        </div>
      </Modal>

      <Modal open={projOpen} title="Create project from quotation" onClose={() => setProjOpen(false)}>
        <label className="block text-sm">
          Project type
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={projType}
            onChange={(e) => setProjType(e.target.value as Project['type'])}
          >
            <option value="Solo">Solo</option>
            <option value="Partner (Profit Only)">Partner (Profit Only)</option>
            <option value="Vendorship Fee">Vendorship Fee</option>
            <option value="Partner with Contributions">Partner with Contributions</option>
          </select>
        </label>
        <button type="button" className="mt-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={createProject}>
          Create
        </button>
      </Modal>
    </div>
  );
}

export function QuotationPreview() {
  const { id } = useParams();
  const { version } = useDataRefresh();
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const company = useMemo(() => getItem<{ name: string }>('companyProfile'), [version]);
  const q = quotations.find((x) => x.id === id);
  const cust = q ? customers.find((c) => c.id === q.customerId) : undefined;
  if (!q) return <p>Not found</p>;
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 print:border-0">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">{company?.name ?? 'Company'}</h1>
        <span className="text-sm text-muted-foreground">QUOTATION</span>
      </div>
      <p className="mt-4 text-sm">
        <strong>To:</strong> {cust?.name}
        <br />
        {cust?.address}
      </p>
      <p className="mt-2 text-sm">
        Ref: {q.reference} · Date: {q.createdAt.slice(0, 10)}
      </p>
      <p className="mt-4 text-lg font-semibold">{formatINRDecimal(q.effectivePrice)}</p>
      <Link to={`/sales/quotations/${q.id}`} className="mt-6 inline-block text-primary print:hidden">
        ← Back
      </Link>
    </div>
  );
}
