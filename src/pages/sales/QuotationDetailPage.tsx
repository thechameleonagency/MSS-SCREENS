import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { defaultProgressSteps, lineItemsTotal, formatINRDecimal } from '../../lib/helpers';
import { requireNonEmptyTrimmed } from '../../lib/formValidation';
import { quotationIntroducerEconomicsLocked } from '../../lib/enquiryProjectLock';
import { isQuotationExpired, quotationExpiryLabel } from '../../lib/quotationRules';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { ChannelPartner, Customer, Enquiry, Material, Partner, Project, Quotation } from '../../types';

type PaymentTypeChoice = NonNullable<Quotation['paymentType']>;

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotations = useLiveCollection<Quotation>('quotations');
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const materials = useLiveCollection<Material>('materials');
  const partners = useLiveCollection<Partner>('partners');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
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
  const [projPartnerId, setProjPartnerId] = useState('');
  const [projCoPartnerIds, setProjCoPartnerIds] = useState<string[]>([]);
  const [projChannelId, setProjChannelId] = useState('');

  const quotation = foundQuote;
  const cust = quotation ? customers.find((c) => c.id === quotation.customerId) : undefined;
  const linkedProject = quotation ? projects.find((p) => p.quotationId === quotation.id) : undefined;
  const introLock = quotation ? quotationIntroducerEconomicsLocked(quotation.id, projects) : false;
  const quoteContentLocked = quotation && (quotation.status === 'Approved' || quotation.status === 'Confirmed');
  const canEditContent = quotation && !quoteContentLocked;
  const showMarkAsSentInShareModal = quotation?.status === 'Draft';
  const canOpenShareModal =
    quotation &&
    (quotation.status === 'Draft' ||
      quotation.status === 'Sent' ||
      quotation.status === 'Approved' ||
      quotation.status === 'Rejected');

  const previewPath = quotation ? `/sales/quotations/${quotation.id}/preview` : '';
  const previewAbs =
    typeof window !== 'undefined' && quotation ? `${window.location.origin}${previewPath}` : '';

  const approveFromHeader = useCallback(() => {
    if (!foundQuote) return;
    const list = getCollection<Quotation>('quotations');
    setCollection(
      'quotations',
      list.map((x) =>
        x.id === foundQuote.id
          ? { ...x, status: 'Approved' as const, approvedDate: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : x
      )
    );
    bump();
    show('Approved', 'success');
  }, [foundQuote, bump, show]);

  const headerBlock = useMemo(() => {
    if (!quotation) return { title: 'Quotation' };
    const c = customers.find((x) => x.id === quotation.customerId);
    const actions = (
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
        {canEditContent && (
          <ShellButton type="button" variant="secondary" onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}>
            Edit
          </ShellButton>
        )}
        <Link to={previewPath} className="inline-flex">
          <span className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/60">
            Preview
          </span>
        </Link>
        {canOpenShareModal && (
          <ShellButton type="button" variant="secondary" onClick={() => setShareOpen(true)}>
            {quotation.status === 'Draft' ? 'Share' : 'Share / resend'}
          </ShellButton>
        )}
        {quotation.status === 'Sent' && (
          <>
            <ShellButton
              type="button"
              variant="primary"
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={approveFromHeader}
            >
              Approve
            </ShellButton>
            <ShellButton type="button" variant="secondary" onClick={() => setRejectOpen(true)}>
              Reject
            </ShellButton>
          </>
        )}
        {quotation.status === 'Approved' && (
          <ShellButton type="button" variant="primary" onClick={() => setConfirmOpen(true)}>
            Confirm (payment)
          </ShellButton>
        )}
        {quotation.status === 'Confirmed' && (
          <ShellButton
            type="button"
            variant="primary"
            disabled={isQuotationExpired(quotation)}
            title={
              isQuotationExpired(quotation)
                ? `Expired on ${quotationExpiryLabel(quotation)}`
                : `Valid through ${quotationExpiryLabel(quotation)}`
            }
            onClick={() => setProjOpen(true)}
          >
            Create project
          </ShellButton>
        )}
        <Link
          to={`/finance/invoices/new?quotationId=${quotation.id}`}
          className="inline-flex rounded-lg border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/5"
        >
          Create invoice
        </Link>
      </div>
    );
    return {
      title: quotation.reference,
      subtitle: `${c?.name ?? 'Customer'} · ${quotation.status}`,
      breadcrumbs: [
        { label: 'Sales', to: '/sales' },
        { label: 'Quotations', to: '/sales/quotations' },
        { label: quotation.reference },
      ],
      actions,
    };
  }, [quotation, customers, navigate, previewPath, canEditContent, canOpenShareModal, approveFromHeader]);

  usePageHeader(headerBlock);

  if (!quotation) return <p className="text-sm text-muted-foreground">Not found</p>;

  const q = quotation;
  const subtotal = lineItemsTotal(q.lineItems);

  const patch = (updates: Partial<Quotation>) => {
    const list = getCollection<Quotation>('quotations');
    setCollection(
      'quotations',
      list.map((x) => (x.id === q.id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x))
    );
    bump();
  };

  const pushShare = (channel: 'link' | 'whatsapp' | 'email') => {
    const at = new Date().toISOString();
    patch({
      shareHistory: [...(q.shareHistory ?? []), { at, channel }],
    });
  };

  const share = () => {
    if (!q.lineItems.length || !q.customerId) {
      show('Need customer and line items', 'error');
      return;
    }
    const at = new Date().toISOString();
    patch({
      status: 'Sent',
      sentDate: at,
      shareHistory: [...(q.shareHistory ?? []), { at, channel: 'link' }],
    });
    show('Marked as Sent', 'success');
  };

  const submitReject = () => {
    const err = requireNonEmptyTrimmed(rejectReason, 'Rejection reason');
    if (err) {
      show(err, 'error');
      return;
    }
    const reason = rejectReason.trim();
    patch({
      status: 'Rejected',
      additionalNotes: `${q.additionalNotes ?? ''}\nReject: ${reason}`.trim(),
    });
    setRejectOpen(false);
    setRejectReason('');
    show('Rejected', 'info');
  };

  const confirm = () => {
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
                q.bankDocumentationAmount && q.bankDocumentationAmount > 0
                  ? q.bankDocumentationAmount
                  : q.effectivePrice * 0.7,
              approvalStatus: 'Pending',
            },
    });
    setConfirmOpen(false);
    show('Confirmed', 'success');
  };

  const createProject = () => {
    if (isQuotationExpired(q)) {
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
    const projectList = getCollection<Project>('projects');
    const enq = q.enquiryId
      ? getCollection<Enquiry>('enquiries').find((e) => e.id === q.enquiryId)
      : undefined;
    const capacity = enq?.systemCapacity ?? 5;
    const progressSteps =
      projType === 'Vendorship Fee'
        ? defaultProgressSteps()
            .slice(0, 2)
            .map((s, i) => ({ ...s, step: (i + 1) as 1 | 2, name: i === 0 ? 'Payment' : 'Product' }))
        : defaultProgressSteps();
    const pt = q.paymentType;
    let loanInstallments: Project['loanInstallments'];
    if (pt === 'Bank Loan' || pt === 'Bank Loan + Cash') {
      const bankShare =
        q.bankDocumentationAmount && q.bankDocumentationAmount > 0
          ? q.bankDocumentationAmount
          : q.effectivePrice * 0.7;
      const half = Math.round(bankShare / 2);
      loanInstallments = [
        { id: generateId('li'), sequence: 1, amountInr: half, status: 'Pending' },
        { id: generateId('li'), sequence: 2, amountInr: Math.round(bankShare - half), status: 'Pending' },
      ];
    }
    const coIds = projCoPartnerIds.filter((pid) => pid && pid !== projPartnerId);
    const proj: Project = {
      id: generateId('proj'),
      name: `${cust?.name ?? 'Project'} ${capacity}kW`,
      type: projType,
      category: enq?.type === 'Commercial' ? 'Commercial' : 'Residential',
      status: 'New',
      customerId: q.customerId,
      quotationId: q.id,
      agentId: q.agentId,
      partnerId:
        projType === 'Partner (Profit Only)' || projType === 'Partner with Contributions'
          ? projPartnerId
          : undefined,
      ...(coIds.length > 0 ? { coPartnerIds: coIds } : {}),
      channelPartnerId: projType === 'Vendorship Fee' ? projChannelId : undefined,
      capacity,
      contractAmount: q.effectivePrice,
      startDate: new Date().toISOString().slice(0, 10),
      address: cust?.address ?? '',
      progressSteps,
      blockages: [],
      paymentType: q.paymentType,
      loanInstallments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('projects', [...projectList, proj]);
    bump();
    setProjOpen(false);
    show('Project created', 'success');
    navigate(`/projects/${proj.id}`);
  };

  const openEmailShare = () => {
    const subject = encodeURIComponent(`Quotation ${q.reference}`);
    const body = encodeURIComponent(`Please review: ${previewAbs}\n`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    pushShare('email');
  };

  return (
    <div className="space-y-6">
      {canEditContent && (quotation.status === 'Sent' || quotation.status === 'Rejected') && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          Use <strong>Edit</strong> to change line items or pricing. Saving will set status back to <strong>Draft</strong> and
          clear sent/approval timestamps.
        </p>
      )}
      {quoteContentLocked && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This quotation is <strong className="text-foreground">{quotation.status}</strong> — use Preview or invoice; edit is
          disabled.
        </p>
      )}
      {introLock && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Introducer economics are locked because a project exists for this quotation.
        </p>
      )}
      {isQuotationExpired(quotation) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          Validity ended on <strong>{quotationExpiryLabel(quotation)}</strong>. Extend validity via Edit before creating a
          project.
        </p>
      )}

      <div className="space-y-6">
        <Card padding="md" className="shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Summary & commercial</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium text-foreground">{quotation.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</dt>
              <dd className="mt-1 text-foreground">{cust?.name ?? quotation.customerId}</dd>
            </div>
            {quotation.quoteKind && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote kind</dt>
                <dd className="mt-1 text-foreground">{quotation.quoteKind}</dd>
              </div>
            )}
            {quotation.enquiryId && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enquiry</dt>
                <dd className="mt-1">
                  <Link className="text-primary hover:underline" to={`/sales/enquiries/${quotation.enquiryId}`}>
                    Open linked enquiry
                  </Link>
                </dd>
              </div>
            )}
            {linkedProject && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</dt>
                <dd className="mt-1">
                  <Link className="text-primary hover:underline" to={`/projects/${linkedProject.id}`}>
                    {linkedProject.name}
                  </Link>
                </dd>
              </div>
            )}
            {quotation.systemCapacityKw != null && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">System capacity</dt>
                <dd className="mt-1 text-foreground">{quotation.systemCapacityKw} kW</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subtotal (excl. GST)</dt>
              <dd className="mt-1 tabular-nums text-foreground">{formatINRDecimal(subtotal)}</dd>
            </div>
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
            {quotation.referringAgentName && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referring partner</dt>
                <dd className="mt-1 text-foreground">{quotation.referringAgentName}</dd>
              </div>
            )}
            {quotation.introducingPartnerPayMode && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Introducer terms</dt>
                <dd className="mt-1 text-foreground">
                  {quotation.introducingPartnerPayMode === 'profit_share' && 'Profit share (see project / enquiry)'}
                  {quotation.introducingPartnerPayMode === 'referral_flat' &&
                    quotation.introducingPartnerReferralFlatInr != null &&
                    `Flat ${formatINRDecimal(quotation.introducingPartnerReferralFlatInr)}`}
                  {quotation.introducingPartnerPayMode === 'referral_per_kw' &&
                    quotation.introducingPartnerReferralPerKwInr != null &&
                    `${formatINRDecimal(quotation.introducingPartnerReferralPerKwInr)} per kW`}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">PDF options</dt>
              <dd className="mt-1 text-muted-foreground">
                Payment terms: {quotation.includePaymentTerms !== false && quotation.paymentTerms.length > 0 ? 'Yes' : 'No'} ·
                Warranty: {quotation.includeWarranty !== false && quotation.warrantyInfo.length > 0 ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
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

        <Card padding="md" className="shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-foreground">Notes & sharing</h2>
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
      </div>

      <Modal open={shareOpen} title="Share quotation" onClose={() => setShareOpen(false)} wide>
        <p className="text-sm text-muted-foreground">
          Copy link or open WhatsApp — does not change status. Use &quot;Mark as sent&quot; when the client has received the
          quote{showMarkAsSentInShareModal ? '' : ' (available when status is Draft)'}.
        </p>
        <input readOnly className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" value={previewAbs} />
        <div className="mt-3 flex flex-wrap gap-2">
          <ShellButton
            type="button"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(previewAbs).then(() => {
                pushShare('link');
                show('Link copied', 'success');
              });
            }}
          >
            Copy link
          </ShellButton>
          <ShellButton
            type="button"
            variant="secondary"
            onClick={() => {
              window.open(
                `https://wa.me/?text=${encodeURIComponent(`Quotation ${quotation.reference}: ${previewAbs}`)}`,
                '_blank'
              );
              pushShare('whatsapp');
            }}
          >
            WhatsApp
          </ShellButton>
          <ShellButton type="button" variant="secondary" onClick={openEmailShare}>
            Email (mailto)
          </ShellButton>
          {showMarkAsSentInShareModal && (
            <ShellButton
              type="button"
              variant="primary"
              onClick={() => {
                share();
                setShareOpen(false);
              }}
            >
              Mark as sent
            </ShellButton>
          )}
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
          <ShellButton type="button" variant="primary" onClick={confirm}>
            Confirm
          </ShellButton>
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
                  setProjCoPartnerIds((prev) => prev.filter((pid) => pid !== v));
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
