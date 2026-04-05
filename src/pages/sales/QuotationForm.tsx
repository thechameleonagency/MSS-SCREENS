import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  computeQuotationEffective,
  lineItemsTotal,
  formatINRDecimal,
  quotationDiscountAmountInr,
} from '../../lib/helpers';
import { inferIntroducingPartnerModeFromEnquiry } from '../../lib/enquiryProjectLock';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  Agent,
  CompanyProfile,
  Customer,
  Enquiry,
  IntroducingPartnerPayMode,
  Material,
  Preset,
  Quotation,
  QuotationStatus,
} from '../../types';

export const DEFAULT_QUOTE_NOTES = `• Installation includes complete wiring and commissioning
• Net metering application assistance included
• Free site survey and design consultation
• AMC available after warranty period`;

export const DEFAULT_QUOTE_PAYMENT_TERMS: Quotation['paymentTerms'] = [
  { label: 'Booking amount', percent: 20 },
  { label: 'On design approval', percent: 30 },
  { label: 'Before material dispatch', percent: 40 },
  { label: 'Post installation', percent: 10 },
];

export const DEFAULT_QUOTE_WARRANTY: Quotation['warrantyInfo'] = [
  { component: 'Panel product', years: 12 },
  { component: 'Panel performance', years: 25 },
  { component: 'Inverter', years: 5 },
  { component: 'Structure', years: 10 },
  { component: 'Other components', years: 1 },
];

function normalizePhone(p: string) {
  return p.replace(/\D/g, '').slice(-10);
}

export type QuotationFormProps = {
  mode: 'create' | 'edit';
  enquiryId?: string;
  onEnquiryIdChange?: (id: string) => void;
  editQuotation?: Quotation;
  introducerEconomicsLocked?: boolean;
  onCancel: () => void;
  onCreated?: (q: Quotation) => void;
  onUpdated?: () => void;
};

export function QuotationForm({
  mode,
  enquiryId = '',
  onEnquiryIdChange,
  editQuotation,
  introducerEconomicsLocked = false,
  onCancel,
  onCreated,
  onUpdated,
}: QuotationFormProps) {
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const presets = useLiveCollection<Preset>('presets');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const agents = useLiveCollection<Agent>('agents');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();

  const enq = mode === 'create' ? enquiries.find((e) => e.id === enquiryId) : undefined;
  const referringAgent =
    enq?.source.type === 'Agent' && enq.source.agentId
      ? agents.find((a) => a.id === enq.source.agentId)
      : undefined;

  const [customerId, setCustomerId] = useState('');
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', address: '' });
  const [presetId, setPresetId] = useState('');
  const [lineItems, setLineItems] = useState<Quotation['lineItems']>([]);
  const [discount, setDiscount] = useState(2);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [gst, setGst] = useState(18);
  const [notes, setNotes] = useState(DEFAULT_QUOTE_NOTES);
  const [incPay, setIncPay] = useState(true);
  const [incWar, setIncWar] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState<Quotation['paymentTerms']>(() => [...DEFAULT_QUOTE_PAYMENT_TERMS]);
  const [warrantyInfo, setWarrantyInfo] = useState<Quotation['warrantyInfo']>(() => [...DEFAULT_QUOTE_WARRANTY]);
  const [validityDays, setValidityDays] = useState('30');
  const [clientAgreed, setClientAgreed] = useState('');
  const [bankDocAmount, setBankDocAmount] = useState('');
  const [systemKw, setSystemKw] = useState('');
  const [pdfSec, setPdfSec] = useState({
    header: true,
    lineItems: true,
    paymentTerms: true,
    warranty: true,
    notes: true,
    pricing: true,
  });
  const [addMaterialId, setAddMaterialId] = useState('');
  const [introMode, setIntroMode] = useState<IntroducingPartnerPayMode>('profit_share');
  const [introFlat, setIntroFlat] = useState('');
  const [introPerKw, setIntroPerKw] = useState('');

  const hydratedRef = useRef<string | null>(null);

  const defaultPresetId = useMemo(
    () => presets.find((p) => p.type === 'Quotation')?.id ?? '',
    [presets]
  );

  const applyPresetLines = useCallback(
    (pid: string) => {
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
    },
    [presets, materials]
  );

  /** Create: init line items when first quotation preset + materials are available */
  useEffect(() => {
    if (mode !== 'create') return;
    const pid = defaultPresetId;
    if (!pid || materials.length === 0) return;
    if (hydratedRef.current === `create-${pid}`) return;
    hydratedRef.current = `create-${pid}`;
    setPresetId(pid);
    applyPresetLines(pid);
  }, [mode, defaultPresetId, applyPresetLines, materials.length]);

  useEffect(() => {
    if (mode !== 'create' || !enq) return;
    const p = normalizePhone(enq.phone);
    const match = customers.find((c) => normalizePhone(c.phone) === p);
    if (match) setCustomerId(match.id);
    else setCustomerId('');
    setNotes(DEFAULT_QUOTE_NOTES);
  }, [mode, enq, customers]);

  /** Edit: hydrate from quotation */
  useEffect(() => {
    if (mode !== 'edit' || !editQuotation) return;
    if (hydratedRef.current === editQuotation.id) return;
    hydratedRef.current = editQuotation.id;

    setPresetId(editQuotation.systemConfigPresetId || defaultPresetId);
    setLineItems(editQuotation.lineItems.map((li) => ({ ...li })));
    setDiscount(editQuotation.discountPercent);
    setDiscountType(editQuotation.discountType ?? 'percent');
    setDiscountValue(
      editQuotation.discountType === 'amount' && editQuotation.discountValue != null
        ? String(editQuotation.discountValue)
        : ''
    );
    setGst(editQuotation.gstPercent);
    setNotes(editQuotation.additionalNotes ?? '');
    setIncPay(editQuotation.includePaymentTerms !== false);
    setIncWar(editQuotation.includeWarranty !== false);
    setPaymentTerms(
      editQuotation.paymentTerms?.length ? editQuotation.paymentTerms.map((x) => ({ ...x })) : [...DEFAULT_QUOTE_PAYMENT_TERMS]
    );
    setWarrantyInfo(
      editQuotation.warrantyInfo?.length ? editQuotation.warrantyInfo.map((x) => ({ ...x })) : [...DEFAULT_QUOTE_WARRANTY]
    );
    setValidityDays(
      editQuotation.validityPeriodDays != null && editQuotation.validityPeriodDays > 0
        ? String(editQuotation.validityPeriodDays)
        : ''
    );
    setClientAgreed(
      editQuotation.clientAgreedAmount != null && editQuotation.clientAgreedAmount > 0
        ? String(editQuotation.clientAgreedAmount)
        : ''
    );
    setBankDocAmount(
      editQuotation.bankDocumentationAmount != null && editQuotation.bankDocumentationAmount > 0
        ? String(editQuotation.bankDocumentationAmount)
        : ''
    );
    setSystemKw(editQuotation.systemCapacityKw != null ? String(editQuotation.systemCapacityKw) : '');
    setPdfSec({
      header: editQuotation.sectionVisibility?.header !== false,
      lineItems: editQuotation.sectionVisibility?.lineItems !== false,
      paymentTerms: editQuotation.sectionVisibility?.paymentTerms !== false,
      warranty: editQuotation.sectionVisibility?.warranty !== false,
      notes: editQuotation.sectionVisibility?.notes !== false,
      pricing: editQuotation.sectionVisibility?.pricing !== false,
    });
    setCustomerId(editQuotation.customerId);
    setIntroMode(editQuotation.introducingPartnerPayMode ?? 'profit_share');
    setIntroFlat(
      editQuotation.introducingPartnerReferralFlatInr != null
        ? String(editQuotation.introducingPartnerReferralFlatInr)
        : ''
    );
    setIntroPerKw(
      editQuotation.introducingPartnerReferralPerKwInr != null
        ? String(editQuotation.introducingPartnerReferralPerKwInr)
        : ''
    );
    setAddMaterialId('');
  }, [mode, editQuotation, defaultPresetId]);

  const subtotal = lineItemsTotal(lineItems);
  const discValNum = Number(discountValue) || 0;
  const effectivePreview = computeQuotationEffective(
    subtotal,
    { type: discountType, percent: discount, value: discValNum },
    gst
  );

  function onPresetSelect(pid: string) {
    if (pid === presetId) return;
    if (lineItems.length > 0) {
      const ok = window.confirm(
        'Replace current line items with the selected preset? Unsaved line edits will be lost.'
      );
      if (!ok) return;
    }
    setPresetId(pid);
    applyPresetLines(pid);
  }

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

  function validateDiscount(): boolean {
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
        return false;
      }
    }
    return true;
  }

  function buildSectionVisibility(): Quotation['sectionVisibility'] | undefined {
    const sectionVisibility: Quotation['sectionVisibility'] = {};
    if (!pdfSec.header) sectionVisibility.header = false;
    if (!pdfSec.lineItems) sectionVisibility.lineItems = false;
    if (!pdfSec.paymentTerms) sectionVisibility.paymentTerms = false;
    if (!pdfSec.warranty) sectionVisibility.warranty = false;
    if (!pdfSec.notes) sectionVisibility.notes = false;
    if (!pdfSec.pricing) sectionVisibility.pricing = false;
    return Object.keys(sectionVisibility).length ? sectionVisibility : undefined;
  }

  function buildIntroducerPatch(): Partial<Quotation> {
    if (introducerEconomicsLocked || !editQuotation) return {};
    const flatN = Number(introFlat) || 0;
    const perKwN = Number(introPerKw) || 0;
    const patch: Partial<Quotation> = { introducingPartnerPayMode: introMode };
    if (introMode === 'referral_flat') {
      patch.introducingPartnerReferralFlatInr = flatN > 0 ? flatN : undefined;
      patch.introducingPartnerReferralPerKwInr = undefined;
    } else if (introMode === 'referral_per_kw') {
      patch.introducingPartnerReferralPerKwInr = perKwN > 0 ? perKwN : undefined;
      patch.introducingPartnerReferralFlatInr = undefined;
    } else {
      patch.introducingPartnerReferralFlatInr = undefined;
      patch.introducingPartnerReferralPerKwInr = undefined;
    }
    return patch;
  }

  function saveCreate(status: QuotationStatus = 'Draft') {
    if (!customerId) {
      show('Select customer', 'error');
      return;
    }
    if (status !== 'Draft' && lineItems.length === 0) {
      show('Add at least one line item', 'error');
      return;
    }
    if (!validateDiscount()) return;

    const fallbackPreset = presets.find((p) => p.type === 'Quotation');
    if (!fallbackPreset) {
      show('Add at least one Quotation preset under Inventory → Presets.', 'error');
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
        const newRow: Customer = {
          id: generateId('cust'),
          name: enq.customerName,
          phone: p,
          email: enq.email || '',
          address: enq.customerAddress ?? '',
          type: enq.customerType ?? 'Individual',
          siteAddress: enq.customerAddress || undefined,
          createdAt: new Date().toISOString(),
        };
        setCollection('customers', [...custList, newRow]);
        cid = newRow.id;
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
    const eff = computeQuotationEffective(st, { type: discountType, percent: discount, value: discValNum }, gst);
    const vd = Number(validityDays);
    const agreedNum = Number(clientAgreed);
    const bankNum = Number(bankDocAmount);
    const kwNum = Number(systemKw);
    const sectionVisibility = buildSectionVisibility();

    const q: Quotation = {
      id: generateId('quo'),
      customerId: cid,
      enquiryId: enquiryId || undefined,
      agentId: referringAgent?.id,
      reference: ref,
      referringAgentName: referringAgent?.fullName,
      systemCapacityKw: kwNum > 0 ? kwNum : enq?.systemCapacity,
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
      systemConfigPresetId: presetId || fallbackPreset.id,
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
      sectionVisibility,
      paymentTerms: incPay ? paymentTerms : [],
      warrantyInfo: incWar ? warrantyInfo : [],
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
          e.id === enquiryId ? { ...e, status: 'Converted' as const, updatedAt: new Date().toISOString() } : e
        )
      );
    }
    bump();
    show('Quotation saved', 'success');
    onCreated?.(q);
  }

  function saveEdit() {
    if (!editQuotation) return;
    if (!customerId) {
      show('Select customer', 'error');
      return;
    }
    if (lineItems.length === 0) {
      show('Add at least one line item', 'error');
      return;
    }
    if (!validateDiscount()) return;

    const fallbackPreset = presets.find((p) => p.type === 'Quotation');
    if (!fallbackPreset) {
      show('Add at least one Quotation preset under Inventory → Presets.', 'error');
      return;
    }

    const eff = computeQuotationEffective(
      subtotal,
      { type: discountType, percent: discount, value: discValNum },
      gst
    );
    const vd = Number(validityDays);
    const agreedNum = Number(clientAgreed);
    const bankNum = Number(bankDocAmount);
    const kwNum = Number(systemKw);
    const sectionVisibility = buildSectionVisibility();

    let nextStatus = editQuotation.status;
    let nextSent = editQuotation.sentDate;
    let nextApproved = editQuotation.approvedDate;
    if (editQuotation.status === 'Sent' || editQuotation.status === 'Rejected') {
      nextStatus = 'Draft';
      nextSent = undefined;
      nextApproved = undefined;
    }

    const basePatch: Partial<Quotation> = {
      customerId,
      systemConfigPresetId: presetId || fallbackPreset.id,
      lineItems,
      discountPercent: discount,
      discountType,
      discountValue: discountType === 'amount' ? discValNum : undefined,
      gstPercent: gst,
      effectivePrice: eff,
      additionalNotes: notes,
      validityPeriodDays: vd > 0 ? vd : undefined,
      clientAgreedAmount: agreedNum > 0 ? agreedNum : undefined,
      bankDocumentationAmount: bankNum > 0 ? bankNum : undefined,
      sectionVisibility,
      systemCapacityKw: kwNum > 0 ? kwNum : undefined,
      includePaymentTerms: incPay,
      includeWarranty: incWar,
      paymentTerms: incPay ? paymentTerms : [],
      warrantyInfo: incWar ? warrantyInfo : [],
      status: nextStatus,
      sentDate: nextSent,
      approvedDate: nextApproved,
      updatedAt: new Date().toISOString(),
    };

    const introPatch = introducerEconomicsLocked ? {} : buildIntroducerPatch();

    const list = getCollection<Quotation>('quotations');
    setCollection(
      'quotations',
      list.map((x) => (x.id === editQuotation.id ? { ...x, ...basePatch, ...introPatch } : x))
    );
    bump();
    show(
      nextStatus !== editQuotation.status
        ? 'Saved as draft — quote was revised from sent/rejected status.'
        : 'Quotation updated.',
      'success'
    );
    onUpdated?.();
  }

  function appendMaterialLine(mid: string) {
    if (!mid) return;
    const m = materials.find((x) => x.id === mid);
    const rate = m?.saleRateRetail ?? 0;
    setLineItems((prev) => [...prev, { materialId: mid, quantity: 1, rate, total: rate }]);
    setAddMaterialId('');
  }

  function resetPaymentDefaults() {
    setPaymentTerms([...DEFAULT_QUOTE_PAYMENT_TERMS]);
    show('Payment terms reset to defaults', 'info');
  }

  function resetWarrantyDefaults() {
    setWarrantyInfo([...DEFAULT_QUOTE_WARRANTY]);
    show('Warranty block reset to defaults', 'info');
  }

  const enquiryLinkRow =
    mode === 'edit' && editQuotation?.enquiryId ? (
      <p className="text-sm text-muted-foreground">
        Linked enquiry:{' '}
        <Link className="text-primary hover:underline" to={`/sales/enquiries/${editQuotation.enquiryId}`}>
          Open enquiry
        </Link>
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-lg border border-border bg-card space-y-4 p-4">
        {mode === 'create' && onEnquiryIdChange && (
          <label className="block text-sm font-medium text-foreground">
            Link enquiry (optional)
            <select
              className="select-shell mt-1 w-full max-w-xl"
              value={enquiryId}
              onChange={(e) => onEnquiryIdChange(e.target.value)}
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
        )}
        {enquiryLinkRow}
        {enq && mode === 'create' && (
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
        {introducerEconomicsLocked && mode === 'edit' && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Introducer payment fields are locked because a project was created from this quotation.
          </p>
        )}
        {mode === 'edit' && editQuotation && !introducerEconomicsLocked && (
          <div className="rounded border border-border/80 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Introducing partner economics</p>
            <label className="mt-2 block max-w-xs text-sm">
              Mode
              <select
                className="select-shell mt-1 w-full"
                value={introMode}
                onChange={(e) => setIntroMode(e.target.value as IntroducingPartnerPayMode)}
              >
                <option value="profit_share">Profit share</option>
                <option value="referral_flat">Referral (flat ₹)</option>
                <option value="referral_per_kw">Referral (₹ per kW)</option>
              </select>
            </label>
            {introMode === 'referral_flat' && (
              <label className="mt-2 block max-w-xs">
                Flat amount ₹
                <input
                  type="number"
                  min={0}
                  className="input-shell mt-1 w-full"
                  value={introFlat}
                  onChange={(e) => setIntroFlat(e.target.value)}
                />
              </label>
            )}
            {introMode === 'referral_per_kw' && (
              <label className="mt-2 block max-w-xs">
                ₹ per kW
                <input
                  type="number"
                  min={0}
                  className="input-shell mt-1 w-full"
                  value={introPerKw}
                  onChange={(e) => setIntroPerKw(e.target.value)}
                />
              </label>
            )}
            {introMode === 'profit_share' && (
              <p className="mt-2 text-xs text-muted-foreground">Profit-share % is tracked on the enquiry / project where applicable.</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={incPay}
              onChange={(e) => {
                setIncPay(e.target.checked);
                if (e.target.checked && paymentTerms.length === 0) setPaymentTerms([...DEFAULT_QUOTE_PAYMENT_TERMS]);
              }}
            />
            Include payment terms on PDF
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={incWar}
              onChange={(e) => {
                setIncWar(e.target.checked);
                if (e.target.checked && warrantyInfo.length === 0) setWarrantyInfo([...DEFAULT_QUOTE_WARRANTY]);
              }}
            />
            Include warranty block
          </label>
        </div>
        {(incPay || incWar) && mode === 'edit' && (
          <div className="flex flex-wrap gap-2 text-sm">
            {incPay && (
              <ShellButton type="button" variant="secondary" onClick={resetPaymentDefaults}>
                Reset payment terms to defaults
              </ShellButton>
            )}
            {incWar && (
              <ShellButton type="button" variant="secondary" onClick={resetWarrantyDefaults}>
                Reset warranty to defaults
              </ShellButton>
            )}
          </div>
        )}
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
            onChange={(e) => onPresetSelect(e.target.value)}
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
        <label className="block max-w-xs text-sm">
          System capacity (kW)
          <input
            type="number"
            min={0}
            className="input-shell mt-1 w-full"
            value={systemKw}
            onChange={(e) => setSystemKw(e.target.value)}
            placeholder="Optional"
          />
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
                <th className="py-1 w-14" />
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
                          next[idx] = { ...li, quantity: qn, total: qn * li.rate };
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
                          next[idx] = { ...li, rate: r, total: li.quantity * r };
                          setLineItems(next);
                        }}
                      />
                    </td>
                    <td className="py-1">{li.total}</td>
                    <td className="py-1">
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setLineItems((prev) => prev.filter((_, j) => j !== idx))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
          <ShellButton type="button" variant="secondary" onClick={onCancel}>
            {mode === 'edit' ? 'Cancel' : 'Back to list'}
          </ShellButton>
          {mode === 'create' && (
            <>
              <ShellButton type="button" variant="secondary" onClick={() => saveCreate('Draft')}>
                Save draft
              </ShellButton>
              <ShellButton type="button" variant="primary" onClick={() => saveCreate('Draft')}>
                Save & continue
              </ShellButton>
            </>
          )}
          {mode === 'edit' && (
            <ShellButton type="button" variant="primary" onClick={saveEdit}>
              Save changes
            </ShellButton>
          )}
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
