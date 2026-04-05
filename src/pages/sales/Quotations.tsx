import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DocumentPreviewFrame } from '../../components/DocumentPreviewFrame';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { lineItemsTotal, formatINRDecimal, quotationDiscountAmountInr } from '../../lib/helpers';
import { exportDomToPdf } from '../../lib/pdfExport';
import { quotationIntroducerEconomicsLocked } from '../../lib/enquiryProjectLock';
import { getCollection, getItem, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { DataTableShell, DATA_TABLE_LIST_BODY_MAX_HEIGHT, dataTableClasses } from '../../components/DataTableShell';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import { QuotationForm } from './QuotationForm';
import type { Customer, Material, Project, Quotation, QuotationStatus } from '../../types';

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
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3">
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
        <div className="flex min-w-0 flex-wrap items-end justify-start gap-2 sm:justify-end sm:gap-3">
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
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-medium text-foreground">
                    <td colSpan={4} className="py-2 pl-3 text-left text-muted-foreground">
                      Totals ({filtered.length} quote{filtered.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-2 tabular-nums">{formatINRDecimal(filteredAmountSum)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
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

export function QuotationNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId') ?? '';
  const navigate = useNavigate();

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

  return (
    <QuotationForm
      mode="create"
      enquiryId={enquiryId}
      onEnquiryIdChange={setEnquiryParam}
      onCancel={() => navigate('/sales/quotations')}
      onCreated={(q) => navigate(`/sales/quotations/${q.id}`)}
    />
  );
}

export function QuotationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotations = useLiveCollection<Quotation>('quotations');
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const { show } = useToast();
  const found = quotations.find((x) => x.id === id);
  const quoteContentLocked = found && (found.status === 'Approved' || found.status === 'Confirmed');

  useEffect(() => {
    if (!found) return;
    if (quoteContentLocked) {
      show('This quotation is approved or confirmed — open the view page to preview or continue workflow.', 'error');
      navigate(`/sales/quotations/${found.id}`, { replace: true });
    }
  }, [found, quoteContentLocked, navigate, show]);

  const introLocked = found ? quotationIntroducerEconomicsLocked(found.id, projects) : false;

  const editHeader = useMemo(() => {
    if (!found) return { title: 'Edit quotation' };
    const c = customers.find((x) => x.id === found.customerId);
    return {
      title: `Edit · ${found.reference}`,
      subtitle: `${c?.name ?? 'Customer'} · ${found.status}`,
      breadcrumbs: [
        { label: 'Sales', to: '/sales' },
        { label: 'Quotations', to: '/sales/quotations' },
        { label: found.reference, to: `/sales/quotations/${found.id}` },
        { label: 'Edit' },
      ],
      actions: (
        <ShellButton type="button" variant="secondary" onClick={() => navigate(`/sales/quotations/${found.id}`)}>
          Cancel
        </ShellButton>
      ),
    };
  }, [found, customers, navigate]);

  usePageHeader(editHeader);

  if (!found) return <p className="text-sm text-muted-foreground">Not found</p>;
  if (quoteContentLocked) return null;

  return (
    <QuotationForm
      mode="edit"
      editQuotation={found}
      introducerEconomicsLocked={introLocked}
      onCancel={() => navigate(`/sales/quotations/${found.id}`)}
      onUpdated={() => navigate(`/sales/quotations/${found.id}`)}
    />
  );
}

export { QuotationDetail } from './QuotationDetailPage';

export function QuotationPreview() {
  const { id } = useParams();
  const { version, bump } = useDataRefresh();
  const { show } = useToast();
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

  const previewAbs =
    typeof window !== 'undefined' && foundQ ? `${window.location.origin}/sales/quotations/${foundQ.id}/preview` : '';

  function pushShare(channel: 'link' | 'whatsapp' | 'email') {
    if (!foundQ) return;
    const at = new Date().toISOString();
    const list = getCollection<Quotation>('quotations');
    setCollection(
      'quotations',
      list.map((x) =>
        x.id === foundQ.id
          ? { ...x, shareHistory: [...(x.shareHistory ?? []), { at, channel }], updatedAt: at }
          : x
      )
    );
    bump();
  }

  const previewHeader = useMemo(() => {
    if (!foundQ) {
      return { title: 'Quotation preview' };
    }
    const q = foundQ;
    return {
      title: `Preview · ${q.reference}`,
      subtitle: 'Print-ready layout',
      breadcrumbs: [
        { label: 'Sales', to: '/sales' },
        { label: 'Quotations', to: '/sales/quotations' },
        { label: q.reference, to: `/sales/quotations/${q.id}` },
        { label: 'Preview' },
      ],
      actions: (
        <div className="flex max-w-full flex-wrap items-center justify-end gap-2 print:hidden">
          <Link
            to={`/sales/quotations/${q.id}`}
            className="inline-flex rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/60"
          >
            Back to quotation
          </Link>
          <ShellButton type="button" variant="secondary" disabled={pdfBusy} onClick={() => void downloadPdf()}>
            {pdfBusy ? 'Building PDF…' : 'Download PDF'}
          </ShellButton>
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
                `https://wa.me/?text=${encodeURIComponent(`Quotation ${q.reference}: ${previewAbs}`)}`,
                '_blank'
              );
              pushShare('whatsapp');
            }}
          >
            WhatsApp
          </ShellButton>
          <ShellButton
            type="button"
            variant="secondary"
            onClick={() => {
              const subject = encodeURIComponent(`Quotation ${q.reference}`);
              const body = encodeURIComponent(`Please review: ${previewAbs}\n`);
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
              pushShare('email');
            }}
          >
            Email
          </ShellButton>
        </div>
      ),
    };
  }, [foundQ, pdfBusy, previewAbs, show]);

  usePageHeader(previewHeader);

  async function downloadPdf() {
    if (!printRef.current || !foundQ) return;
    setPdfBusy(true);
    try {
      await exportDomToPdf(printRef.current, `${foundQ.reference}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  if (!foundQ) return <p className="text-sm text-muted-foreground">Not found</p>;
  const q = foundQ;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
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
