import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DocumentPreviewFrame } from '../../components/DocumentPreviewFrame';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  computeQuotationEffective,
  defaultProgressSteps,
  lineItemsTotal,
  formatINRDecimal,
} from '../../lib/helpers';
import { exportDomToPdf } from '../../lib/pdfExport';
import { requireNonEmptyTrimmed } from '../../lib/formValidation';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
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
      {rows.length === 0 ? (
        <EmptyState
          title="No quotations to show"
          description={
            st
              ? 'Clear the status filter or pick another stage to see quotes.'
              : 'Start from a customer or enquiry and publish your first quote.'
          }
          action={
            <ShellButton type="button" variant="primary" onClick={() => navigate('/sales/quotations/new')}>
              New quotation
            </ShellButton>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/60">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground">Ref</th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground">Customer</th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground">Amount</th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id} className="border-t border-border/80 transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{q.reference}</td>
                    <td className="px-4 py-3 text-muted-foreground">{name(q.customerId)}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{formatINRDecimal(q.effectivePrice)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-tertiary hover:underline"
                        to={`/sales/quotations/${q.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
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

  function normalizePhone(p: string) {
    return p.replace(/\D/g, '').slice(-10);
  }

  useEffect(() => {
    if (!enq) return;
    const p = normalizePhone(enq.phone);
    const match = customers.find((c) => normalizePhone(c.phone) === p);
    if (match) setCustomerId(match.id);
  }, [enq, customers]);
  const [presetId, setPresetId] = useState(
    () => presets.find((p) => p.type === 'Quotation')?.id ?? ''
  );
  const [lineItems, setLineItems] = useState<Quotation['lineItems']>(() => {
    const pr = presets.find((p) => p.type === 'Quotation');
    if (!pr) return [];
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
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [gst, setGst] = useState(18);
  const [notes, setNotes] = useState('');
  const [quoteKind, setQuoteKind] = useState<'Solar' | 'Other'>('Solar');
  const [incPay, setIncPay] = useState(true);
  const [incWar, setIncWar] = useState(true);
  const [validityDays, setValidityDays] = useState('30');
  const [clientAgreed, setClientAgreed] = useState('');
  const [bankDocAmount, setBankDocAmount] = useState('');
  const [pdfSec, setPdfSec] = useState({
    header: true,
    lineItems: true,
    paymentTerms: true,
    warranty: true,
    notes: true,
    pricing: true,
  });

  const subtotal = lineItemsTotal(lineItems);
  const discValNum = Number(discountValue) || 0;
  const effectivePreview = computeQuotationEffective(
    subtotal,
    { type: discountType, percent: discount, value: discValNum },
    gst
  );

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

  function setKind(next: 'Solar' | 'Other') {
    setQuoteKind(next);
    if (next === 'Other') {
      setLineItems([{ materialId: '', quantity: 1, rate: 0, total: 0, description: '' }]);
    } else {
      applyPreset((presetId || presets.find((p) => p.type === 'Quotation')?.id) ?? '');
    }
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
    if (quoteKind === 'Other' && lineItems.some((li) => !(li.description ?? '').trim())) {
      show('Each line needs a description', 'error');
      return;
    }
    const custList = getCollection<Customer>('customers');
    let cid = customerId;
    if (enq) {
      const p = normalizePhone(enq.phone);
      const match = custList.find((c) => normalizePhone(c.phone) === p);
      if (match) {
        cid = match.id;
      } else if (!cid) {
        const newCust: Customer = {
          id: generateId('cust'),
          name: enq.customerName,
          phone: p,
          email: enq.email || '',
          address: enq.customerAddress ?? '',
          type: enq.customerType ?? 'Individual',
          siteAddress: enq.customerAddress || undefined,
          createdAt: new Date().toISOString(),
        };
        setCollection('customers', [...custList, newCust]);
        cid = newCust.id;
      }
    }
    if (!cid) {
      show('Select customer', 'error');
      return;
    }
    const list = getCollection<Quotation>('quotations');
    const ref = `QUO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const st = lineItemsTotal(lineItems);
    const defaultPay = [
      { label: 'Advance', percent: 20 },
      { label: 'Installation', percent: 60 },
      { label: 'DCR', percent: 20 },
    ];
    const defaultWar = [
      { component: 'Panels', years: 25 },
      { component: 'Inverter', years: 10 },
    ];
    const eff = computeQuotationEffective(st, { type: discountType, percent: discount, value: discValNum }, gst);
    const vd = Number(validityDays);
    const agreedNum = Number(clientAgreed);
    const bankNum = Number(bankDocAmount);
    const sectionVisibility: Quotation['sectionVisibility'] = {};
    if (!pdfSec.header) sectionVisibility.header = false;
    if (!pdfSec.lineItems) sectionVisibility.lineItems = false;
    if (!pdfSec.paymentTerms) sectionVisibility.paymentTerms = false;
    if (!pdfSec.warranty) sectionVisibility.warranty = false;
    if (!pdfSec.notes) sectionVisibility.notes = false;
    if (!pdfSec.pricing) sectionVisibility.pricing = false;
    const q: Quotation = {
      id: generateId('quo'),
      customerId: cid,
      enquiryId: enquiryId || undefined,
      agentId: enq?.source.type === 'Agent' ? enq.source.agentId : agents[0]?.id,
      reference: ref,
      systemConfigPresetId: presetId || presets[0]!.id,
      quoteKind,
      includePaymentTerms: incPay,
      includeWarranty: incWar,
      lineItems,
      discountPercent: discount,
      discountType,
      discountValue: discountType === 'amount' ? discValNum : undefined,
      gstPercent: gst,
      effectivePrice: eff,
      validityPeriodDays: vd > 0 ? vd : undefined,
      clientAgreedAmount: agreedNum > 0 ? agreedNum : undefined,
      bankDocumentationAmount: bankNum > 0 ? bankNum : undefined,
      sectionVisibility: Object.keys(sectionVisibility).length ? sectionVisibility : undefined,
      paymentTerms: incPay ? defaultPay : [],
      warrantyInfo: incWar ? defaultWar : [],
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
          From enquiry: {enq.customerName} — customer is matched by phone when possible; a new customer is created only if none
          exists.
        </p>
      )}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-medium text-foreground">Quotation type</span>
          <label className="flex items-center gap-2">
            <input type="radio" checked={quoteKind === 'Solar'} onChange={() => setKind('Solar')} />
            Solar EPC
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={quoteKind === 'Other'} onChange={() => setKind('Other')} />
            Other / generic
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={incPay} onChange={(e) => setIncPay(e.target.checked)} />
            Include payment terms on PDF
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={incWar} onChange={(e) => setIncWar(e.target.checked)} />
            Include warranty block
          </label>
        </div>
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
        {quoteKind === 'Solar' && (
          <label className="block text-sm">
            Load preset
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
        )}
        <div className="text-sm">
          <div className="font-medium">{quoteKind === 'Solar' ? 'Line items (retail rate)' : 'Line items (description)'}</div>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-xs text-muted-foreground">
                {quoteKind === 'Other' && <th className="py-1">Description</th>}
                {quoteKind === 'Solar' && <th className="py-1">Material</th>}
                <th className="py-1">Qty</th>
                <th className="py-1">Rate</th>
                <th className="py-1">Total</th>
                {quoteKind === 'Other' && <th className="py-1 w-8" />}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => {
                const m = materials.find((x) => x.id === li.materialId);
                return (
                  <tr key={idx} className="border-t border-border">
                    {quoteKind === 'Other' ? (
                      <td className="py-1 pr-2">
                        <input
                          className="w-full min-w-[8rem] rounded border px-2 py-1"
                          value={li.description ?? ''}
                          onChange={(e) => {
                            const next = [...lineItems];
                            next[idx] = { ...li, description: e.target.value };
                            setLineItems(next);
                          }}
                        />
                      </td>
                    ) : (
                      <td className="py-1">{(m?.name ?? li.materialId) || '—'}</td>
                    )}
                    <td className="py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-20 rounded border px-2 py-1"
                        value={li.quantity}
                        onChange={(e) => {
                          const qn = Number(e.target.value) || 0;
                          const next = [...lineItems];
                          next[idx] = {
                            ...li,
                            quantity: qn,
                            total: qn * li.rate,
                          };
                          setLineItems(next);
                        }}
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded border px-2 py-1"
                        value={li.rate}
                        onChange={(e) => {
                          const r = Number(e.target.value) || 0;
                          const next = [...lineItems];
                          next[idx] = {
                            ...li,
                            rate: r,
                            total: li.quantity * r,
                          };
                          setLineItems(next);
                        }}
                      />
                    </td>
                    <td className="py-1">{li.total}</td>
                    {quoteKind === 'Other' && (
                      <td className="py-1">
                        <button
                          type="button"
                          className="text-xs text-destructive"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {quoteKind === 'Other' && (
            <button
              type="button"
              className="mt-2 rounded border px-3 py-1 text-sm"
              onClick={() =>
                setLineItems([...lineItems, { materialId: '', quantity: 1, rate: 0, total: 0, description: '' }])
              }
            >
              Add line
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            Discount type
            <select
              className="ml-2 rounded border px-2 py-1"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
            >
              <option value="percent">Percent</option>
              <option value="amount">Flat ₹</option>
            </select>
          </label>
          {discountType === 'percent' ? (
            <label className="text-sm">
              Discount %
              <input
                type="number"
                className="ml-2 w-20 rounded border px-2 py-1"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </label>
          ) : (
            <label className="text-sm">
              Discount ₹
              <input
                type="number"
                className="ml-2 w-28 rounded border px-2 py-1"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </label>
          )}
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
        <div className="flex flex-wrap gap-4 text-sm">
          <label>
            Validity (days)
            <input
              type="number"
              min={0}
              className="ml-2 w-20 rounded border px-2 py-1"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
            />
          </label>
          <label>
            Client agreed ₹
            <input
              type="number"
              min={0}
              className="ml-2 w-28 rounded border px-2 py-1"
              value={clientAgreed}
              onChange={(e) => setClientAgreed(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Bank documentation ₹
            <input
              type="number"
              min={0}
              className="ml-2 w-28 rounded border px-2 py-1"
              value={bankDocAmount}
              onChange={(e) => setBankDocAmount(e.target.value)}
              placeholder="Loan papers"
            />
          </label>
        </div>
        <div className="rounded border border-border/80 p-3 text-xs">
          <p className="mb-2 font-medium text-foreground">PDF sections</p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['header', 'Header'],
                ['lineItems', 'Line items'],
                ['paymentTerms', 'Payment terms'],
                ['warranty', 'Warranty'],
                ['notes', 'Notes'],
                ['pricing', 'Pricing total'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={pdfSec[key]}
                  onChange={(e) => setPdfSec({ ...pdfSec, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <p className="text-sm">
          Subtotal: {formatINRDecimal(subtotal)} → Effective: <strong>{formatINRDecimal(effectivePreview)}</strong>
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [payType, setPayType] = useState<PaymentTypeChoice>('Cash');
  const [kNum, setKNum] = useState('');
  const [lender, setLender] = useState('');
  const [projType, setProjType] = useState<Project['type']>('Solo');
  const [qTab, setQTab] = useState<'summary' | 'lines' | 'notes'>('summary');

  usePageHeader(
    useMemo(() => {
      if (!foundQuote) return { title: 'Quotation' };
      const c = customers.find((x) => x.id === foundQuote.customerId);
      return {
        title: foundQuote.reference,
        subtitle: `${c?.name ?? 'Customer'} · ${foundQuote.status}`,
        breadcrumbs: [
          { label: 'Sales', to: '/sales' },
          { label: 'Quotations', to: '/sales/quotations' },
          { label: foundQuote.reference },
        ],
      };
    }, [foundQuote, customers])
  );

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

  function pushShare(channel: 'link' | 'whatsapp' | 'email') {
    const at = new Date().toISOString();
    patch({
      shareHistory: [...(quotation.shareHistory ?? []), { at, channel }],
    });
  }

  function share() {
    if (!quotation.lineItems.length || !quotation.customerId) {
      show('Need customer and line items', 'error');
      return;
    }
    const at = new Date().toISOString();
    patch({
      status: 'Sent',
      sentDate: at,
      shareHistory: [...(quotation.shareHistory ?? []), { at, channel: 'link' }],
    });
    show('Marked as Sent', 'success');
  }

  function approve() {
    patch({ status: 'Approved', approvedDate: new Date().toISOString() });
    show('Approved', 'success');
  }

  function submitReject() {
    const err = requireNonEmptyTrimmed(rejectReason, 'Rejection reason');
    if (err) {
      show(err, 'error');
      return;
    }
    const reason = rejectReason.trim();
    patch({
      status: 'Rejected',
      additionalNotes: `${quotation.additionalNotes ?? ''}\nReject: ${reason}`.trim(),
    });
    setRejectOpen(false);
    setRejectReason('');
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
              amount:
                quotation.bankDocumentationAmount && quotation.bankDocumentationAmount > 0
                  ? quotation.bankDocumentationAmount
                  : quotation.effectivePrice * 0.7,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-end gap-2">
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
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRejectOpen(true)}>
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
          <Link
            to={`/finance/invoices/new?quotationId=${quotation.id}`}
            className="rounded-lg border border-primary/40 px-3 py-2 text-sm text-primary"
          >
            Create invoice
          </Link>
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-1 border-b border-border/80 bg-background/90 py-2 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
          {(
            [
              { id: 'summary' as const, label: 'Summary & commercial' },
              { id: 'lines' as const, label: 'Line items' },
              { id: 'notes' as const, label: 'Notes & sharing' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                qTab === id
                  ? 'bg-tertiary-muted text-tertiary-muted-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              onClick={() => setQTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {qTab === 'summary' && (
        <Card padding="md" className="shadow-sm">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium text-foreground">{quotation.status}</dd>
            </div>
            {quotation.quoteKind && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote kind</dt>
                <dd className="mt-1 text-foreground">{quotation.quoteKind}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Effective price</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatINRDecimal(quotation.effectivePrice)}
              </dd>
            </div>
            {quotation.validityPeriodDays != null && quotation.validityPeriodDays > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Validity</dt>
                <dd className="mt-1 text-foreground">{quotation.validityPeriodDays} days from quote date</dd>
              </div>
            )}
            {quotation.clientAgreedAmount != null && quotation.clientAgreedAmount > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client agreed</dt>
                <dd className="mt-1 tabular-nums text-foreground">{formatINRDecimal(quotation.clientAgreedAmount)}</dd>
              </div>
            )}
            {quotation.bankDocumentationAmount != null && quotation.bankDocumentationAmount > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bank documentation</dt>
                <dd className="mt-1 tabular-nums text-foreground">{formatINRDecimal(quotation.bankDocumentationAmount)}</dd>
              </div>
            )}
            {quotation.discountType === 'amount' && quotation.discountValue != null && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Discount</dt>
                <dd className="mt-1 text-foreground">
                  ₹{quotation.discountValue.toLocaleString('en-IN')} (amount) · GST {quotation.gstPercent}%
                </dd>
              </div>
            )}
            {quotation.paymentType && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment type</dt>
                <dd className="mt-1 text-foreground">{quotation.paymentType}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {qTab === 'lines' && (
        <Card padding="none" className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 font-semibold">Qty</th>
                  <th className="pb-2 font-semibold">Rate</th>
                  <th className="pb-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.lineItems.map((li, i) => (
                  <tr key={i} className="border-t border-border/80">
                    <td className="py-2.5 pr-2">
                      {li.description?.trim()
                        ? li.description
                        : materials.find((m) => m.id === li.materialId)?.name ?? li.materialId}
                    </td>
                    <td className="py-2.5 tabular-nums">{li.quantity}</td>
                    <td className="py-2.5 tabular-nums">{formatINRDecimal(li.rate)}</td>
                    <td className="py-2.5 tabular-nums font-medium">{formatINRDecimal(li.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {qTab === 'notes' && (
        <Card padding="md" className="shadow-sm">
          <p className="text-sm leading-relaxed text-foreground">{quotation.additionalNotes || '— No notes'}</p>
          {quotation.shareHistory && quotation.shareHistory.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Share history</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {quotation.shareHistory.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="capitalize">{h.channel}</span>
                    <span className="text-xs">{new Date(h.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

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
              void navigator.clipboard.writeText(url).then(() => {
                pushShare('link');
                show('Link copied', 'success');
              });
            }}
          >
            Copy link
          </button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => {
              const url = `${window.location.origin}/sales/quotations/${quotation.id}/preview`;
              window.open(
                `https://wa.me/?text=${encodeURIComponent(`Quotation ${quotation.reference}: ${url}`)}`,
                '_blank'
              );
              pushShare('whatsapp');
            }}
          >
            WhatsApp
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

      <Modal open={rejectOpen} title="Reject quotation" onClose={() => setRejectOpen(false)}>
        <p className="mb-2 text-sm text-muted-foreground">A reason is required for audit trail.</p>
        <textarea
          className="input-shell mb-3 min-h-[5rem] w-full text-sm"
          placeholder="Reason for rejection"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={submitReject}>
            Reject quote
          </ShellButton>
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
  const printRef = useRef<HTMLDivElement>(null);
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const company = useMemo(() => getItem<{ name: string; gst?: string; address?: string }>('companyProfile'), [version]);
  const foundQ = quotations.find((x) => x.id === id);
  const cust = foundQ ? customers.find((c) => c.id === foundQ.customerId) : undefined;
  const [pdfBusy, setPdfBusy] = useState(false);
  if (!foundQ) return <p>Not found</p>;
  const q = foundQ;

  async function downloadPdf() {
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      await exportDomToPdf(printRef.current, `${q.reference}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link to={`/sales/quotations/${q.id}`} className="text-sm text-primary">
          ← Back
        </Link>
        <ShellButton type="button" variant="secondary" disabled={pdfBusy} onClick={() => void downloadPdf()}>
          {pdfBusy ? 'Building PDF…' : 'Download PDF'}
        </ShellButton>
      </div>
      <div ref={printRef} className="rounded-lg border border-border bg-card p-8 print:border-0">
        {q.sectionVisibility?.header !== false && (
          <DocumentPreviewFrame
            company={{
              name: company?.name ?? 'Company',
              gst: company?.gst,
              address: company?.address,
            }}
            partyTitle="Quoted to"
            partyName={cust?.name ?? 'Customer'}
            partyDetails={cust?.address ? <p>{cust.address}</p> : null}
            documentKind="Quotation"
            reference={q.reference}
            dateValue={q.createdAt.slice(0, 10)}
            extraMeta={[
              ...(q.quoteKind ? [{ label: 'Type', value: q.quoteKind }] : []),
              ...(q.validityPeriodDays != null && q.validityPeriodDays > 0
                ? [{ label: 'Valid for', value: `${q.validityPeriodDays} days` }]
                : []),
            ]}
          />
        )}
        {q.sectionVisibility?.lineItems !== false && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Rate</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.lineItems.map((li, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1">
                    {li.description?.trim()
                      ? li.description
                      : materials.find((m) => m.id === li.materialId)?.name ?? li.materialId}
                  </td>
                  <td>{li.quantity}</td>
                  <td>{li.rate}</td>
                  <td>{li.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {q.sectionVisibility?.pricing !== false && (
          <p className="mt-4 text-lg font-semibold">Total: {formatINRDecimal(q.effectivePrice)}</p>
        )}
        {q.sectionVisibility?.paymentTerms !== false && q.includePaymentTerms !== false && q.paymentTerms.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium">Payment terms</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {q.paymentTerms.map((p, i) => (
                <li key={i}>
                  {p.label}: {p.percent}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {q.sectionVisibility?.warranty !== false && q.includeWarranty !== false && q.warrantyInfo.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium">Warranty</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {q.warrantyInfo.map((w, i) => (
                <li key={i}>
                  {w.component}: {w.years} yrs
                </li>
              ))}
            </ul>
          </div>
        )}
        {q.sectionVisibility?.notes !== false && q.additionalNotes && (
          <p className="mt-4 text-sm text-muted-foreground">{q.additionalNotes}</p>
        )}
      </div>
    </div>
  );
}
