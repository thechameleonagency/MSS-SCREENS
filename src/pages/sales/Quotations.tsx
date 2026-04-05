import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DocumentPreviewFrame } from '../../components/DocumentPreviewFrame';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  computeQuotationEffective,
  defaultProgressSteps,
  lineItemsTotal,
  formatINRDecimal,
  quotationDiscountAmountInr,
} from '../../lib/helpers';
import { exportDomToPdf } from '../../lib/pdfExport';
import { requireNonEmptyTrimmed } from '../../lib/formValidation';
import { inferIntroducingPartnerModeFromEnquiry } from '../../lib/enquiryProjectLock';
import { isQuotationExpired, quotationExpiryLabel } from '../../lib/quotationRules';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { DataTableShell, DATA_TABLE_LIST_BODY_MAX_HEIGHT, dataTableClasses } from '../../components/DataTableShell';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import type {
  Agent,
  ChannelPartner,
  CompanyProfile,
  Customer,
  Enquiry,
  Material,
  Partner,
  Preset,
  Project,
  Quotation,
  QuotationStatus,
} from '../../types';

const QUO_STATUS_SELECT_W = '11.75rem';

export function QuotationsList() {
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const navigate = useNavigate();
  const [st, setSt] = useState('');
  const [q, setQ] = useState('');
  const [chipStatuses, setChipStatuses] = useState<Set<QuotationStatus>>(() => new Set());
  const [pageSize, setPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const summary = useMemo(() => {
    return {
      total: quotations.length,
      draft: quotations.filter((x) => x.status === 'Draft').length,
      sent: quotations.filter((x) => x.status === 'Sent').length,
      approved: quotations.filter((x) => x.status === 'Approved').length,
      rejected: quotations.filter((x) => x.status === 'Rejected').length,
      converted: quotations.filter((x) => x.status === 'Confirmed').length,
    };
  }, [quotations]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return quotations.filter((row) => {
      const matchSt = !st || row.status === st;
      const cust = customers.find((c) => c.id === row.customerId);
      const digits = qq.replace(/\D/g, '');
      const matchQ =
        !qq ||
        row.reference.toLowerCase().includes(qq) ||
        (cust?.name ?? '').toLowerCase().includes(qq) ||
        (cust?.phone && (cust.phone.includes(qq) || (digits.length >= 3 && cust.phone.replace(/\D/g, '').includes(digits))));
      const chipMatch =
        chipStatuses.size === 0 ||
        chipStatuses.has(row.status);
      return matchSt && matchQ && chipMatch;
    });
  }, [quotations, st, q, customers, chipStatuses]);

  useEffect(() => {
    setPage(1);
  }, [q, st, chipStatuses, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const name = (cid: string) => customers.find((c) => c.id === cid)?.name ?? cid;

  const chipBtn = useCallback(
    () =>
      cn(
        'rounded-none border-0 bg-transparent p-0 shadow-none text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      ),
    []
  );
  const chipInner = (active: boolean) =>
    cn(
      'inline-flex flex-col items-start border-b-2 pb-0.5',
      active
        ? 'border-foreground font-medium text-foreground'
        : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
    );
  const chipLab = (active: boolean) =>
    cn('text-[10px] font-normal uppercase tracking-wide', active ? 'text-foreground' : 'text-muted-foreground');

  const toggleChipStatus = useCallback((s: QuotationStatus) => {
    setChipStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const filtersToolbar = useMemo(
    () => (
      <div className="flex flex-col gap-3 pb-3">
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <input
              className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink"
              placeholder="Reference, customer, or phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search quotations"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Status</span>
            <select
              className="select-shell h-10 shrink-0 grow-0"
              style={{ width: QUO_STATUS_SELECT_W }}
              value={st}
              onChange={(e) => setSt(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All status</option>
              {(['Draft', 'Sent', 'Approved', 'Rejected', 'Confirmed'] as QuotationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex min-w-0 flex-wrap items-end justify-end gap-2 sm:gap-3">
          <button type="button" className={chipBtn()} aria-pressed={chipStatuses.size === 0} onClick={() => setChipStatuses(new Set())}>
            <span className={chipInner(chipStatuses.size === 0)}>
              <span className={chipLab(chipStatuses.size === 0)}>Total</span>
              <span className="tabular-nums text-foreground">{summary.total}</span>
            </span>
          </button>
          {(
            [
              ['Draft', summary.draft],
              ['Sent', summary.sent],
              ['Approved', summary.approved],
              ['Rejected', summary.rejected],
              ['Confirmed', summary.converted],
            ] as const
          ).map(([label, count]) => {
            const stKey = label as QuotationStatus;
            return (
              <button
                key={label}
                type="button"
                className={chipBtn()}
                aria-pressed={chipStatuses.has(stKey)}
                onClick={() => toggleChipStatus(stKey)}
              >
                <span className={chipInner(chipStatuses.has(stKey))}>
                  <span className={chipLab(chipStatuses.has(stKey))}>{label === 'Confirmed' ? 'Converted' : label}</span>
                  <span className="tabular-nums text-foreground">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    ),
    [q, st, chipBtn, chipStatuses, summary, toggleChipStatus]
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Quotations',
      subtitle: 'Pricing, approval, and project creation',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => navigate('/sales/quotations/new')}>
          New quotation
        </ShellButton>
      ),
      filtersToolbar,
    }),
    [navigate, filtersToolbar]
  );
  usePageHeader(pageHeader);

  const filteredAmountSum = useMemo(
    () => filtered.reduce((s, r) => s + (r.effectivePrice ?? 0), 0),
    [filtered]
  );

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <EmptyState
          title="No quotations to show"
          description={
            st || q.trim() || chipStatuses.size > 0
              ? 'Clear the search, dropdown filter, or status chips to see more quotations.'
              : 'Start from a customer or enquiry and publish your first quote.'
          }
          action={
            <ShellButton type="button" variant="primary" onClick={() => navigate('/sales/quotations/new')}>
              New quotation
            </ShellButton>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <DataTableShell bare bodyMaxHeight={DATA_TABLE_LIST_BODY_MAX_HEIGHT}>
            <div className="overflow-x-auto">
              <table className={dataTableClasses}>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>kW</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => {
                    const cust = customers.find((c) => c.id === row.customerId);
                    const kw = row.systemCapacityKw;
                    return (
                      <tr key={row.id} className="border-t border-border transition-colors hover:bg-muted/50">
                        <td className="font-medium text-foreground">{row.reference}</td>
                        <td className="text-muted-foreground">{name(row.customerId)}</td>
                        <td className="whitespace-nowrap text-muted-foreground tabular-nums">{cust?.phone ?? '—'}</td>
                        <td className="text-muted-foreground tabular-nums">{kw != null ? kw : '—'}</td>
                        <td className="tabular-nums text-foreground">{formatINRDecimal(row.effectivePrice)}</td>
                        <td>
                          <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                            {row.status === 'Confirmed' ? 'Converted' : row.status}
                          </span>
                        </td>
                        <td>
                          <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/quotations/${row.id}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-medium text-foreground">
                    <td colSpan={4} className="py-2 pl-3 text-left text-muted-foreground">
                      Totals ({filtered.length} quote{filtered.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-2 tabular-nums">{formatINRDecimal(filteredAmountSum)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </DataTableShell>
          <div className="border-t border-border px-4 py-3">
            <TablePaginationBar
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

const DEFAULT_QUOTE_NOTES = `• Installation includes complete wiring and commissioning
• Net metering application assistance included
• Free site survey and design consultation
• AMC available after warranty period`;

export function QuotationNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId') ?? '';
  const navigate = useNavigate();
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const presets = useLiveCollection<Preset>('presets');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const agents = useLiveCollection<Agent>('agents');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();

  const enq = enquiries.find((e) => e.id === enquiryId);
  const referringAgent =
    enq?.source.type === 'Agent' && enq.source.agentId
      ? agents.find((a) => a.id === enq.source.agentId)
      : undefined;
  const [customerId, setCustomerId] = useState(enq ? '' : customers[0]?.id ?? '');
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', address: '' });

  function setEnquiryParam(id: string) {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      if (id) n.set('enquiryId', id);
      else n.delete('enquiryId');
      return n;
    });
  }

  const newFormHeader = useMemo(
    () => ({
      title: 'New quotation',
      subtitle: 'Solar EPC — link an enquiry or pick a client, then line items and pricing',
      actions: (
        <ShellButton type="button" variant="secondary" onClick={() => navigate('/sales/quotations')}>
          Back to list
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(newFormHeader);

  function normalizePhone(p: string) {
    return p.replace(/\D/g, '').slice(-10);
  }

  useEffect(() => {
    if (!enq) return;
    const p = normalizePhone(enq.phone);
    const match = customers.find((c) => normalizePhone(c.phone) === p);
    if (match) setCustomerId(match.id);
    else setCustomerId('');
    setNotes(DEFAULT_QUOTE_NOTES);
  }, [enq, customers]);

  function saveNewCustomer(e: React.FormEvent) {
    e.preventDefault();
    const p = normalizePhone(newCust.phone);
    if (!newCust.name.trim() || p.length < 10) {
      show('Name and valid 10-digit phone required', 'error');
      return;
    }
    const list = getCollection<Customer>('customers');
    if (list.some((c) => normalizePhone(c.phone) === p)) {
      show('A client with this phone already exists', 'error');
      return;
    }
    const row: Customer = {
      id: generateId('cust'),
      name: newCust.name.trim(),
      phone: p,
      email: newCust.email.trim(),
      address: newCust.address.trim(),
      type: 'Individual',
      createdAt: new Date().toISOString(),
    };
    setCollection('customers', [...list, row]);
    bump();
    setCustomerId(row.id);
    setNewCustOpen(false);
    setNewCust({ name: '', phone: '', email: '', address: '' });
    show('Client created', 'success');
  }
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
  const [notes, setNotes] = useState(DEFAULT_QUOTE_NOTES);
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

  function save(status: QuotationStatus = 'Draft') {
    if (!customerId) {
      show('Select customer', 'error');
      return;
    }
    if (status !== 'Draft' && lineItems.length === 0) {
      show('Add at least one line item', 'error');
      return;
    }
    const profile = getItem<CompanyProfile>('companyProfile');
    const thr = profile?.quotationDiscountApprovalThresholdInr;
    if (thr && thr > 0 && role !== 'Super Admin') {
      const discInr = quotationDiscountAmountInr(subtotal, {
        type: discountType,
        percent: discount,
        value: discValNum,
      });
      if (discInr >= thr) {
        show(
          `Discount on subtotal is ${formatINRDecimal(discInr)}, at or above the company threshold ${formatINRDecimal(
            thr
          )}. Reduce the discount, or ask Super Admin to raise the threshold in Settings → Company profile.`,
          'error'
        );
        return;
      }
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
    const year = new Date().getFullYear();
    let seq = list.length + 1;
    let ref = `QUO-${year}-${String(seq).padStart(3, '0')}`;
    while (list.some((x) => x.reference === ref)) {
      seq += 1;
      ref = `QUO-${year}-${String(seq).padStart(3, '0')}`;
    }
    const st = lineItemsTotal(lineItems);
    const defaultPay = [
      { label: 'Booking amount', percent: 20 },
      { label: 'On design approval', percent: 30 },
      { label: 'Before material dispatch', percent: 40 },
      { label: 'Post installation', percent: 10 },
    ];
    const defaultWar = [
      { component: 'Panel product', years: 12 },
      { component: 'Panel performance', years: 25 },
      { component: 'Inverter', years: 5 },
      { component: 'Structure', years: 10 },
      { component: 'Other components', years: 1 },
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
      agentId: referringAgent?.id,
      reference: ref,
      referringAgentName: referringAgent?.fullName,
      systemCapacityKw: enq?.systemCapacity,
      ...(enq?.source.type === 'Agent' && enq.source.agentId
        ? (() => {
            const mode = inferIntroducingPartnerModeFromEnquiry(enq);
            return {
              introducingPartnerPayMode: mode,
              introducingPartnerReferralFlatInr:
                mode === 'referral_flat'
                  ? enq.introducingPartnerReferralFlatInr ?? enq.fixedDealAmountInr
                  : undefined,
              introducingPartnerReferralPerKwInr:
                mode === 'referral_per_kw' ? enq.introducingPartnerReferralPerKwInr : undefined,
            };
          })()
        : {}),
      solarSpec: enq
        ? {
            systemDescription: enq.requirements,
          }
        : undefined,
      systemConfigPresetId: presetId || presets[0]!.id,
      quoteKind: 'Solar',
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
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Link enquiry (optional)
          <select
            className="select-shell mt-1 w-full max-w-xl"
            value={enquiryId}
            onChange={(e) => setEnquiryParam(e.target.value)}
          >
            <option value="">— None —</option>
            {enquiries
              .filter((e) => e.status !== 'Lost')
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.customerName} · {e.systemCapacity} kW · {e.status}
                </option>
              ))}
          </select>
        </label>
        {enq && (
          <p className="text-sm text-muted-foreground">
            Prefilled from <strong className="text-foreground">{enq.customerName}</strong>. Client is matched by phone; save
            will create a customer record if needed.
            {enq.source.type === 'Agent' && referringAgent && (
              <>
                {' '}
                Referring partner/agent:{' '}
                <strong className="text-foreground">{referringAgent.fullName}</strong> (stored on the quote).
              </>
            )}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Solar EPC quotation</span> — line items use your materials catalog and
          retail rates.
        </p>
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
        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-[12rem] flex-1 text-sm">
            Customer *
            <select
              className="select-shell mt-1 w-full"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </label>
          <ShellButton type="button" variant="secondary" className="h-10 shrink-0" onClick={() => setNewCustOpen(true)}>
            New client
          </ShellButton>
        </div>
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
                    <td className="py-1">{(m?.name ?? li.materialId) || '—'}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          Additional notes
          <textarea
            className="input-shell mt-1 min-h-[7rem] w-full"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => save('Draft')}>
            Save draft
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={() => save('Draft')}>
            Save & continue
          </ShellButton>
        </div>
      </div>

      <Modal open={newCustOpen} title="New client" onClose={() => setNewCustOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveNewCustomer}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Name *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              value={newCust.name}
              onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Phone *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              value={newCust.phone}
              onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              placeholder="+91…"
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1 w-full"
              value={newCust.email}
              onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <input
              className="input-shell mt-1 w-full"
              value={newCust.address}
              onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setNewCustOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save client
            </ShellButton>
          </div>
        </form>
      </Modal>
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
  const partners = useLiveCollection<Partner>('partners');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
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
  const [projPartnerId, setProjPartnerId] = useState('');
  const [projCoPartnerIds, setProjCoPartnerIds] = useState<string[]>([]);
  const [projChannelId, setProjChannelId] = useState('');
  const [editLineItems, setEditLineItems] = useState<Quotation['lineItems']>([]);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editDiscountType, setEditDiscountType] = useState<'percent' | 'amount'>('percent');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editGst, setEditGst] = useState(18);
  const [editNotes, setEditNotes] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editValidityDays, setEditValidityDays] = useState('');
  const [editClientAgreed, setEditClientAgreed] = useState('');
  const [editBankDoc, setEditBankDoc] = useState('');
  const [editSystemKw, setEditSystemKw] = useState('');
  const [editPdfSec, setEditPdfSec] = useState({
    header: true,
    lineItems: true,
    paymentTerms: true,
    warranty: true,
    notes: true,
    pricing: true,
  });
  const [addMaterialId, setAddMaterialId] = useState('');
  const editHydratedIdRef = useRef<string | undefined>(undefined);

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

  useEffect(() => {
    if (!foundQuote) return;
    if (editHydratedIdRef.current === foundQuote.id) return;
    editHydratedIdRef.current = foundQuote.id;
    setEditLineItems(foundQuote.lineItems.map((li) => ({ ...li })));
    setEditDiscountPercent(foundQuote.discountPercent);
    setEditDiscountType(foundQuote.discountType ?? 'percent');
    setEditDiscountValue(
      foundQuote.discountType === 'amount' && foundQuote.discountValue != null
        ? String(foundQuote.discountValue)
        : ''
    );
    setEditGst(foundQuote.gstPercent);
    setEditNotes(foundQuote.additionalNotes);
    setEditCustomerId(foundQuote.customerId);
    setEditValidityDays(
      foundQuote.validityPeriodDays != null && foundQuote.validityPeriodDays > 0
        ? String(foundQuote.validityPeriodDays)
        : ''
    );
    setEditClientAgreed(
      foundQuote.clientAgreedAmount != null && foundQuote.clientAgreedAmount > 0
        ? String(foundQuote.clientAgreedAmount)
        : ''
    );
    setEditBankDoc(
      foundQuote.bankDocumentationAmount != null && foundQuote.bankDocumentationAmount > 0
        ? String(foundQuote.bankDocumentationAmount)
        : ''
    );
    setEditSystemKw(foundQuote.systemCapacityKw != null ? String(foundQuote.systemCapacityKw) : '');
    setEditPdfSec({
      header: foundQuote.sectionVisibility?.header !== false,
      lineItems: foundQuote.sectionVisibility?.lineItems !== false,
      paymentTerms: foundQuote.sectionVisibility?.paymentTerms !== false,
      warranty: foundQuote.sectionVisibility?.warranty !== false,
      notes: foundQuote.sectionVisibility?.notes !== false,
      pricing: foundQuote.sectionVisibility?.pricing !== false,
    });
    setAddMaterialId('');
  }, [foundQuote]);

  if (!foundQuote) return <p>Not found</p>;
  const quotation = foundQuote;
  const quoteContentLocked = quotation.status === 'Approved' || quotation.status === 'Confirmed';
  const editSubtotal = lineItemsTotal(editLineItems);
  const editDiscValNum = Number(editDiscountValue) || 0;
  const editEffectivePreview = computeQuotationEffective(
    editSubtotal,
    { type: editDiscountType, percent: editDiscountPercent, value: editDiscValNum },
    editGst
  );

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

  function saveQuoteEdits() {
    if (quoteContentLocked) return;
    if (!editCustomerId) {
      show('Select customer', 'error');
      return;
    }
    if (editLineItems.length === 0) {
      show('Add at least one line item', 'error');
      return;
    }
    const profile = getItem<CompanyProfile>('companyProfile');
    const thr = profile?.quotationDiscountApprovalThresholdInr;
    if (thr && thr > 0 && role !== 'Super Admin') {
      const discInr = quotationDiscountAmountInr(editSubtotal, {
        type: editDiscountType,
        percent: editDiscountPercent,
        value: editDiscValNum,
      });
      if (discInr >= thr) {
        show(
          `Discount on subtotal is ${formatINRDecimal(discInr)}, at or above the company threshold ${formatINRDecimal(
            thr
          )}. Reduce the discount, or ask Super Admin to raise the threshold in Settings → Company profile.`,
          'error'
        );
        return;
      }
    }
    const eff = computeQuotationEffective(
      editSubtotal,
      { type: editDiscountType, percent: editDiscountPercent, value: editDiscValNum },
      editGst
    );
    const vd = Number(editValidityDays);
    const agreedNum = Number(editClientAgreed);
    const bankNum = Number(editBankDoc);
    const kwNum = Number(editSystemKw);
    const sectionVisibility: Quotation['sectionVisibility'] = {};
    if (!editPdfSec.header) sectionVisibility.header = false;
    if (!editPdfSec.lineItems) sectionVisibility.lineItems = false;
    if (!editPdfSec.paymentTerms) sectionVisibility.paymentTerms = false;
    if (!editPdfSec.warranty) sectionVisibility.warranty = false;
    if (!editPdfSec.notes) sectionVisibility.notes = false;
    if (!editPdfSec.pricing) sectionVisibility.pricing = false;

    let nextStatus = quotation.status;
    let nextSent = quotation.sentDate;
    let nextApproved = quotation.approvedDate;
    if (quotation.status === 'Sent' || quotation.status === 'Rejected') {
      nextStatus = 'Draft';
      nextSent = undefined;
      nextApproved = undefined;
    }

    patch({
      customerId: editCustomerId,
      lineItems: editLineItems,
      discountPercent: editDiscountPercent,
      discountType: editDiscountType,
      discountValue: editDiscountType === 'amount' ? editDiscValNum : undefined,
      gstPercent: editGst,
      effectivePrice: eff,
      additionalNotes: editNotes,
      validityPeriodDays: vd > 0 ? vd : undefined,
      clientAgreedAmount: agreedNum > 0 ? agreedNum : undefined,
      bankDocumentationAmount: bankNum > 0 ? bankNum : undefined,
      sectionVisibility: Object.keys(sectionVisibility).length ? sectionVisibility : undefined,
      systemCapacityKw: kwNum > 0 ? kwNum : undefined,
      status: nextStatus,
      sentDate: nextSent,
      approvedDate: nextApproved,
    });
    show(
      nextStatus !== quotation.status
        ? 'Saved as draft — quote was revised from sent/rejected status.'
        : 'Quotation updated.',
      'success'
    );
  }

  function appendMaterialLine(mid: string) {
    if (!mid) return;
    const m = materials.find((x) => x.id === mid);
    const rate = m?.saleRateRetail ?? 0;
    setEditLineItems((prev) => [...prev, { materialId: mid, quantity: 1, rate, total: rate }]);
    setAddMaterialId('');
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
    if (isQuotationExpired(quotation)) {
      show('This quotation has expired. Extend validity or create a new quote before starting a project.', 'error');
      return;
    }
    if (
      (projType === 'Partner (Profit Only)' || projType === 'Partner with Contributions') &&
      !projPartnerId
    ) {
      show('Select a primary partner', 'error');
      return;
    }
    if (projType === 'Vendorship Fee' && !projChannelId) {
      show('Select a channel / OEM partner', 'error');
      return;
    }
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
    const pt = quotation.paymentType;
    let loanInstallments: Project['loanInstallments'];
    if (pt === 'Bank Loan' || pt === 'Bank Loan + Cash') {
      const bankShare =
        quotation.bankDocumentationAmount && quotation.bankDocumentationAmount > 0
          ? quotation.bankDocumentationAmount
          : quotation.effectivePrice * 0.7;
      const half = Math.round(bankShare / 2);
      loanInstallments = [
        { id: generateId('li'), sequence: 1, amountInr: half, status: 'Pending' },
        { id: generateId('li'), sequence: 2, amountInr: Math.round(bankShare - half), status: 'Pending' },
      ];
    }
    const coIds = projCoPartnerIds.filter((id) => id && id !== projPartnerId);
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
          ? projPartnerId
          : undefined,
      ...(coIds.length > 0 ? { coPartnerIds: coIds } : {}),
      channelPartnerId: projType === 'Vendorship Fee' ? projChannelId : undefined,
      capacity,
      contractAmount: quotation.effectivePrice,
      startDate: new Date().toISOString().slice(0, 10),
      address: cust?.address ?? '',
      progressSteps,
      blockages: [],
      paymentType: quotation.paymentType,
      loanInstallments,
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
      {!quoteContentLocked && (quotation.status === 'Sent' || quotation.status === 'Rejected') && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          Saving commercial or line-item changes will set status back to <strong>Draft</strong> and clear sent/approval
          timestamps so the quote can be revised safely.
        </p>
      )}
      {quoteContentLocked && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This quotation is <strong className="text-foreground">{quotation.status}</strong> — commercial fields and line
          items are read-only.
        </p>
      )}
      <div className="flex flex-wrap items-start justify-end gap-2">
        <div className="flex flex-wrap gap-2">
          {!quoteContentLocked && (
            <ShellButton type="button" variant="primary" onClick={saveQuoteEdits}>
              Save changes
            </ShellButton>
          )}
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
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isQuotationExpired(quotation)}
              title={
                isQuotationExpired(quotation)
                  ? `Expired on ${quotationExpiryLabel(quotation)}`
                  : `Valid through ${quotationExpiryLabel(quotation)}`
              }
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

      <div className="space-y-6">
        <Card padding="md" className="shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Summary & commercial</h2>
          {quoteContentLocked ? (
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
              {(quotation.discountPercent > 0 || (quotation.discountType === 'amount' && quotation.discountValue != null)) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Discount</dt>
                  <dd className="mt-1 text-foreground">
                    {quotation.discountType === 'amount' && quotation.discountValue != null
                      ? `₹${quotation.discountValue.toLocaleString('en-IN')} (amount)`
                      : `${quotation.discountPercent}%`}{' '}
                    · GST {quotation.gstPercent}%
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
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 font-medium text-foreground">{quotation.status}</p>
              </div>
              <label className="block max-w-xl">
                <span className="text-xs font-medium text-muted-foreground">Customer</span>
                <select
                  className="select-shell mt-1 w-full"
                  value={editCustomerId}
                  onChange={(e) => setEditCustomerId(e.target.value)}
                >
                  <option value="">Select</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block max-w-xs">
                <span className="text-xs font-medium text-muted-foreground">System capacity (kW)</span>
                <input
                  type="number"
                  min={0}
                  className="input-shell mt-1 w-full"
                  value={editSystemKw}
                  onChange={(e) => setEditSystemKw(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <div className="flex flex-wrap items-end gap-4">
                <label>
                  Discount type
                  <select
                    className="ml-2 rounded border border-border px-2 py-1"
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as 'percent' | 'amount')}
                  >
                    <option value="percent">Percent</option>
                    <option value="amount">Flat ₹</option>
                  </select>
                </label>
                {editDiscountType === 'percent' ? (
                  <label>
                    Discount %
                    <input
                      type="number"
                      className="ml-2 w-20 rounded border border-border px-2 py-1"
                      value={editDiscountPercent}
                      onChange={(e) => setEditDiscountPercent(Number(e.target.value) || 0)}
                    />
                  </label>
                ) : (
                  <label>
                    Discount ₹
                    <input
                      type="number"
                      className="ml-2 w-28 rounded border border-border px-2 py-1"
                      value={editDiscountValue}
                      onChange={(e) => setEditDiscountValue(e.target.value)}
                    />
                  </label>
                )}
                <label>
                  GST %
                  <input
                    type="number"
                    className="ml-2 w-20 rounded border border-border px-2 py-1"
                    value={editGst}
                    onChange={(e) => setEditGst(Number(e.target.value) || 0)}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-4">
                <label>
                  Validity (days)
                  <input
                    type="number"
                    min={0}
                    className="ml-2 w-20 rounded border border-border px-2 py-1"
                    value={editValidityDays}
                    onChange={(e) => setEditValidityDays(e.target.value)}
                  />
                </label>
                <label>
                  Client agreed ₹
                  <input
                    type="number"
                    min={0}
                    className="ml-2 w-28 rounded border border-border px-2 py-1"
                    value={editClientAgreed}
                    onChange={(e) => setEditClientAgreed(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Bank documentation ₹
                  <input
                    type="number"
                    min={0}
                    className="ml-2 w-28 rounded border border-border px-2 py-1"
                    value={editBankDoc}
                    onChange={(e) => setEditBankDoc(e.target.value)}
                    placeholder="Optional"
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
                        checked={editPdfSec[key]}
                        onChange={(e) => setEditPdfSec({ ...editPdfSec, [key]: e.target.checked })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm">
                Subtotal: {formatINRDecimal(editSubtotal)} → Effective:{' '}
                <strong className="tabular-nums">{formatINRDecimal(editEffectivePreview)}</strong>
              </p>
            </div>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden shadow-sm">
          <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-base font-semibold text-foreground">Line items</h2>
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 font-semibold">Qty</th>
                  <th className="pb-2 font-semibold">Rate</th>
                  <th className="pb-2 font-semibold">Total</th>
                  {!quoteContentLocked && <th className="w-14 pb-2 font-semibold"> </th>}
                </tr>
              </thead>
              <tbody>
                {(quoteContentLocked ? quotation.lineItems : editLineItems).map((li, i) => (
                  <tr key={i} className="border-t border-border/80">
                    <td className="py-2.5 pr-2">
                      {quoteContentLocked ? (
                        li.description?.trim() ? (
                          li.description
                        ) : (
                          materials.find((m) => m.id === li.materialId)?.name ?? li.materialId
                        )
                      ) : (
                        <span>
                          {li.description?.trim()
                            ? li.description
                            : materials.find((m) => m.id === li.materialId)?.name ?? li.materialId}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums">
                      {quoteContentLocked ? (
                        li.quantity
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="w-20 rounded border border-border px-2 py-1"
                          value={li.quantity}
                          onChange={(e) => {
                            const qn = Number(e.target.value) || 0;
                            setEditLineItems((prev) => {
                              const next = [...prev];
                              const row = next[i];
                              if (!row) return prev;
                              next[i] = { ...row, quantity: qn, total: qn * row.rate };
                              return next;
                            });
                          }}
                        />
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums">
                      {quoteContentLocked ? (
                        formatINRDecimal(li.rate)
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="w-24 rounded border border-border px-2 py-1"
                          value={li.rate}
                          onChange={(e) => {
                            const r = Number(e.target.value) || 0;
                            setEditLineItems((prev) => {
                              const next = [...prev];
                              const row = next[i];
                              if (!row) return prev;
                              next[i] = { ...row, rate: r, total: row.quantity * r };
                              return next;
                            });
                          }}
                        />
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums font-medium">{formatINRDecimal(li.total)}</td>
                    {!quoteContentLocked && (
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => setEditLineItems((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!quoteContentLocked && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
                <label className="text-sm">
                  Add material
                  <select
                    className="select-shell ml-2 mt-1 max-w-xs"
                    value={addMaterialId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAddMaterialId(v);
                      if (v) appendMaterialLine(v);
                    }}
                  >
                    <option value="">Choose…</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </Card>

        <Card padding="md" className="shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-foreground">Notes & sharing</h2>
          {quoteContentLocked ? (
            <p className="text-sm leading-relaxed text-foreground">{quotation.additionalNotes || '— No notes'}</p>
          ) : (
            <label className="block text-sm">
              <span className="text-xs font-medium text-muted-foreground">Additional notes</span>
              <textarea
                className="input-shell mt-1 min-h-[7rem] w-full"
                rows={5}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </label>
          )}
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

      <Modal open={projOpen} title="Create project from quotation" onClose={() => setProjOpen(false)} wide>
        <label className="block text-sm">
          Project type
          <select
            className="select-shell mt-1 w-full"
            value={projType}
            onChange={(e) => {
              const t = e.target.value as Project['type'];
              setProjType(t);
              if (t === 'Partner (Profit Only)' || t === 'Partner with Contributions') {
                setProjPartnerId(partners[0]?.id ?? '');
                setProjCoPartnerIds([]);
              }
              if (t === 'Vendorship Fee') {
                setProjChannelId(channelPartners[0]?.id ?? '');
              }
            }}
          >
            <option value="Solo">Solo</option>
            <option value="Partner (Profit Only)">Partner (Profit Only)</option>
            <option value="Vendorship Fee">Vendorship Fee</option>
            <option value="Partner with Contributions">Partner with Contributions</option>
          </select>
        </label>
        {(projType === 'Partner (Profit Only)' || projType === 'Partner with Contributions') && (
          <>
            <label className="mt-3 block text-sm">
              Primary partner *
              <select
                className="select-shell mt-1 w-full"
                value={projPartnerId}
                onChange={(e) => {
                  const v = e.target.value;
                  setProjPartnerId(v);
                  setProjCoPartnerIds((prev) => prev.filter((id) => id !== v));
                }}
              >
                <option value="">Select…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {partners.filter((p) => p.id !== projPartnerId).length > 0 && (
              <div className="mt-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Additional partners (optional)</p>
                <div className="mt-2 flex flex-col gap-2">
                  {partners
                    .filter((p) => p.id !== projPartnerId)
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={projCoPartnerIds.includes(p.id)}
                          onChange={() =>
                            setProjCoPartnerIds((prev) =>
                              prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                            )
                          }
                        />
                        {p.name}
                      </label>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
        {projType === 'Vendorship Fee' && (
          <label className="mt-3 block text-sm">
            Channel / OEM partner *
            <select
              className="select-shell mt-1 w-full"
              value={projChannelId}
              onChange={(e) => setProjChannelId(e.target.value)}
            >
              <option value="">Select…</option>
              {channelPartners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-4 flex justify-end">
          <ShellButton type="button" variant="primary" onClick={createProject}>
            Create project
          </ShellButton>
        </div>
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
  const subtotal = foundQ ? lineItemsTotal(foundQ.lineItems) : 0;
  const discInr = foundQ
    ? quotationDiscountAmountInr(subtotal, {
        type: foundQ.discountType ?? 'percent',
        percent: foundQ.discountPercent,
        value: foundQ.discountValue ?? 0,
      })
    : 0;
  const afterDisc = Math.max(0, subtotal - discInr);
  const gstAmt = foundQ ? Math.round((afterDisc * foundQ.gstPercent) / 100) : 0;
  const netInclGst = afterDisc + gstAmt;
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
            partyDetails={
              <div className="space-y-0.5 text-sm text-muted-foreground">
                {cust?.phone && <p>Phone: {cust.phone}</p>}
                {cust?.email ? <p>{cust.email}</p> : null}
                {cust?.address ? <p>{cust.address}</p> : null}
                {(q.clientCity || q.clientState) && (
                  <p>{[q.clientCity, q.clientState].filter(Boolean).join(', ')}</p>
                )}
              </div>
            }
            documentKind="Quotation"
            reference={q.reference}
            dateValue={q.createdAt.slice(0, 10)}
            extraMeta={[
              ...(q.quoteKind ? [{ label: 'Type', value: q.quoteKind }] : []),
              ...(q.systemCapacityKw != null ? [{ label: 'System capacity', value: `${q.systemCapacityKw} kW` }] : []),
              ...(q.referringAgentName ? [{ label: 'Referring partner', value: q.referringAgentName }] : []),
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
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price breakdown</p>
            <div className="flex justify-between gap-4 tabular-nums">
              <span className="text-muted-foreground">System cost (excl. GST)</span>
              <span>{formatINRDecimal(subtotal)}</span>
            </div>
            {discInr > 0 && (
              <div className="flex justify-between gap-4 tabular-nums text-muted-foreground">
                <span>Discount</span>
                <span>−{formatINRDecimal(discInr)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 tabular-nums">
              <span className="text-muted-foreground">GST ({q.gstPercent}%)</span>
              <span>{formatINRDecimal(gstAmt)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2 text-base font-semibold tabular-nums">
              <span>Net (incl. GST)</span>
              <span>{formatINRDecimal(netInclGst)}</span>
            </div>
            {q.govtSubsidyInr != null && q.govtSubsidyInr > 0 && (
              <div className="flex justify-between gap-4 tabular-nums text-emerald-700 dark:text-emerald-400">
                <span>Govt. subsidy</span>
                <span>−{formatINRDecimal(q.govtSubsidyInr)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-1 text-lg font-bold tabular-nums text-foreground">
              <span>Effective price</span>
              <span>{formatINRDecimal(q.effectivePrice)}</span>
            </div>
          </div>
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
