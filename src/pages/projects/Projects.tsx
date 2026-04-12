import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Card';
import { DataTableShell, dataTableClasses, listTableBodyMaxHeight } from '../../components/DataTableShell';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { UnifiedExpenseModal } from '../../components/UnifiedExpenseModal';
import { UnifiedIncomeModal } from '../../components/UnifiedIncomeModal';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  agentCommissionForProject,
  defaultProgressSteps,
  formatINR,
  formatINRDecimal,
  getClientPaymentsForProject,
  getProjectExpenseTotal,
  partnerContributionTotal,
  partnerProfitShareType2,
  issueToPurchaseQty,
} from '../../lib/helpers';
import { introAgentShareBreakdown, introducerPayModeForRow } from '../../lib/introAgentEconomics';
import { projectClientCollection } from '../../lib/projectClientCollection';
import {
  visibleFinSubViews,
  visibleProjectTabs,
  type FinSubViewKey,
  type ProjectDetailTabKey,
} from '../../lib/projectUi';
import { formatProgressStage } from '../../lib/progressStage';
import {
  siteHasRecordedConsumption,
  siteLedgerBalance,
  upsertLedgerAfterIssue,
  workItemRequiresMaterialConsumption,
} from '../../lib/siteMaterialLedger';
import { exportDomToPdf } from '../../lib/pdfExport';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardCornerTypeTag, InlineTypeTagDot } from '../../components/ProjectTypeTagBadge';
import {
  projectDisplayTitleForCard,
  projectTypeDotClass,
  projectTypeFullLabelSlotsDossierPreview,
  projectTypeFullLabelSlotsHeroCard,
  shouldPromoteProjectTypeInSection,
  shouldPromoteProjectTypeOnListCard,
} from '../../lib/projectCardTags';
import { billingSummaryLines } from '../../lib/billingRules';
import { documentationTier, requiredProjectDocuments } from '../../lib/projectDocumentRules';
import { inferSolarKind } from '../../lib/solarProjectKind';
import { projectIsActivePipeline, projectIsCompletedClosed } from '../../lib/siteEligibility';
import type {
  Agent,
  AgentIntroProjectEconomics,
  Attendance,
  ChannelPartner,
  ChannelPartnerFee,
  CompanyExpense,
  CompanyProfile,
  Customer,
  Enquiry,
  Invoice,
  Material,
  MaterialReturn,
  MaterialTransfer,
  OutsourceWork,
  Partner,
  Payment,
  Project,
  ProjectLoanInstallment,
  Quotation,
  Site,
  SiteDocumentKind,
  SiteMaterialLedgerRow,
  SiteWorkStatusItem,
  SolarProjectKind,
  Supplier,
  Task,
  User,
} from '../../types';

const SELF_WORKING_TYPES: Project['type'][] = ['Solo', 'Partner (Profit Only)', 'Partner with Contributions'];
const COMMISSION_TYPES: Project['type'][] = ['Vendorship Fee'];

const PROJECT_STATUS_OPTIONS: Project['status'][] = ['New', 'In Progress', 'On Hold', 'Completed', 'Closed'];

const EMPTY_BLK = {
  title: '',
  description: '',
  reason: '',
  howToSolve: '',
  resolveByDate: '',
  projectStage: '',
  timelineStage: '',
  assignedTo: '',
  dueDate: '',
};

function SiteLocationCard({
  site,
  projectId,
  highlight,
}: {
  site: Site;
  projectId: string;
  highlight: boolean;
}) {
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [photoUrl, setPhotoUrl] = useState('');

  function addPhoto() {
    const u = photoUrl.trim();
    if (!u) {
      show('Enter a photo URL', 'error');
      return;
    }
    try {
      new URL(u);
    } catch {
      show('Use a full URL (https://…)', 'error');
      return;
    }
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) => (x.id === site.id ? { ...x, photos: [...x.photos, u] } : x))
    );
    setPhotoUrl('');
    bump();
    show('Photo added', 'success');
  }

  return (
    <div
      id={`install-site-${site.id}`}
      className={cn(
        'rounded-xl border p-5 shadow-sm transition-shadow',
        highlight
          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
          : 'border-border bg-card/90'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            className="text-lg font-semibold text-primary hover:underline"
            to={`/projects/${projectId}?site=${encodeURIComponent(site.id)}`}
          >
            {site.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {site.checklistItems.filter((c) => c.completed).length}/{site.checklistItems.length} checklist
        </span>
      </div>
      {site.photos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {site.photos.slice(0, 6).map((url, i) => (
            <a
              key={`${url}-${i}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </a>
          ))}
          {site.photos.length > 6 && (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              +{site.photos.length - 6}
            </span>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="input-shell min-w-[12rem] flex-1 text-sm"
          placeholder="Photo URL (https://…)"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
        <button type="button" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium" onClick={addPhoto}>
          Add photo
        </button>
      </div>
    </div>
  );
}

export function ProjectsList() {
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');
  const quotations = useLiveCollection<Quotation>('quotations');
  const agents = useLiveCollection<Agent>('agents');
  const partners = useLiveCollection<Partner>('partners');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
  const invoices = useLiveCollection<Invoice>('invoices');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [directOpen, setDirectOpen] = useState(false);
  const [openSelf, setOpenSelf] = useState(true);
  const [openComm, setOpenComm] = useState(true);
  const [ddCustomer, setDdCustomer] = useState('');
  const [ddName, setDdName] = useState('');
  const [ddCap, setDdCap] = useState('5');
  const [ddAddr, setDdAddr] = useState('');
  const [ddType, setDdType] = useState<Project['type']>('Solo');
  const [ddCat, setDdCat] = useState<Project['category']>('Residential');
  const [ddPartnerId, setDdPartnerId] = useState('');
  const [ddCoPartnerIds, setDdCoPartnerIds] = useState<string[]>([]);
  const [ddChannelId, setDdChannelId] = useState('');
  const [statusScope, setStatusScope] = useState<'all' | 'active' | 'completed'>('all');

  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusScope === 'active') return projectIsActivePipeline(p.status);
      if (statusScope === 'completed') return projectIsCompletedClosed(p.status);
      return true;
    });
  }, [projects, statusScope]);

  function saveDirectDeal() {
    const cid = ddCustomer || customers[0]?.id;
    if (!cid) {
      show('Add a customer first (Sales → Customers)', 'error');
      return;
    }
    const cap = Number(ddCap) || 5;
    const cust = customers.find((c) => c.id === cid);
    const name = ddName.trim() || `${cust?.name ?? 'Site'} ${cap}kW`;
    const list = getCollection<Project>('projects');
    const progressSteps = defaultProgressSteps();
    const proj: Project = {
      id: generateId('proj'),
      name,
      type: ddType,
      category: ddCat,
      status: 'New',
      customerId: cid,
      quotationId: undefined,
      capacity: cap,
      contractAmount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      address: ddAddr.trim() || cust?.address || '',
      progressSteps,
      blockages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (ddType === 'Partner (Profit Only)' || ddType === 'Partner with Contributions') {
      if (!ddPartnerId) {
        show('Select a primary partner', 'error');
        return;
      }
      proj.partnerId = ddPartnerId;
      const co = ddCoPartnerIds.filter((id) => id && id !== ddPartnerId);
      if (co.length) proj.coPartnerIds = co;
    }
    if (ddType === 'Vendorship Fee') {
      if (!ddChannelId) {
        show('Select a channel / OEM partner', 'error');
        return;
      }
      proj.channelPartnerId = ddChannelId;
    }
    setCollection('projects', [...list, proj]);
    bump();
    setDirectOpen(false);
    setDdName('');
    setDdAddr('');
    show('Direct-deal project created (no quotation linked)', 'success');
  }

  usePageHeader({ title: 'All projects', subtitle: 'Self-working vs commissioned (OEM) — open a card for full detail & install sites' });

  const photoCount = (pid: string) => sites.filter((s) => s.projectId === pid).reduce((n, s) => n + s.photos.length, 0);

  function patchProjectStatus(pid: string, status: Project['status']) {
    const list = getCollection<Project>('projects');
    const now = new Date().toISOString();
    setCollection(
      'projects',
      list.map((x) => (x.id === pid ? { ...x, status, updatedAt: now } : x))
    );
    bump();
    show('Status updated', 'success');
  }

  function renderProjectCard(p: Project) {
    const cust = customers.find((c) => c.id === p.customerId);
    const quo = p.quotationId ? quotations.find((q) => q.id === p.quotationId) : undefined;
    const ag = p.agentId ? agents.find((a) => a.id === p.agentId) : undefined;
    const par = p.partnerId ? partners.find((x) => x.id === p.partnerId) : undefined;
    const chFix = p.channelPartnerId ? channelPartners.find((x) => x.id === p.channelPartnerId) : undefined;
    const invs = invoices.filter((i) => i.projectId === p.id);
    const siteN = sites.filter((s) => s.projectId === p.id).length;
    const openBlk = p.blockages.filter((b) => !b.resolved).length;
    const promoteType = shouldPromoteProjectTypeOnListCard(p);
    const titleShown = projectDisplayTitleForCard(p);
    const dotClass = projectTypeDotClass(p.type);

    return (
      <Card key={p.id} className="relative flex h-full flex-col border-border/80 shadow-sm transition hover:border-primary/25 hover:shadow-md">
        {promoteType && <CardCornerTypeTag label={p.type} dotClass={dotClass} />}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-10">
            <div className="min-w-0 flex-1">
              <Link className="text-base font-semibold text-primary hover:underline sm:text-lg" to={`/projects/${p.id}`}>
                {titleShown}
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground">{cust?.name ?? 'Customer'}</p>
            </div>
            <select
              className="select-shell max-w-[9rem] shrink-0 text-xs"
              value={p.status}
              onChange={(e) => patchProjectStatus(p.id, e.target.value as Project['status'])}
            >
              {PROJECT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {promoteType ? (
              <InlineTypeTagDot label={p.type} dotClass={dotClass} />
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{p.type}</span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{p.category}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{formatProgressStage(p)}</span>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contract</p>
              <p className="font-semibold tabular-nums text-foreground">{formatINRDecimal(p.contractAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Quotation</p>
              {quo ? (
                <Link className="font-medium text-primary hover:underline" to={`/sales/quotations/${quo.id}`}>
                  {quo.reference} · {formatINRDecimal(quo.effectivePrice)}
                </Link>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Capacity</p>
              <p>{p.capacity} kW</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sites / photos</p>
              <p>
                {siteN} site(s) · {photoCount(p.id)} photos
              </p>
            </div>
          </div>

          {(ag || par || chFix) && (
            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
              {ag && (
                <div className="flex items-center gap-2">
                  {ag.photo ? (
                    <img src={ag.photo} alt="" className="h-8 w-8 rounded-full border border-border object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">A</span>
                  )}
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Agent</p>
                    <Link className="font-medium text-primary hover:underline" to={`/sales/agents/${ag.id}`}>
                      {ag.fullName}
                    </Link>
                  </div>
                </div>
              )}
              {par && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Partner</p>
                  <span className="font-medium text-foreground">{par.name}</span>
                </div>
              )}
              {chFix && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Channel / OEM</p>
                  <span className="font-medium text-foreground">{chFix.name}</span>
                </div>
              )}
            </div>
          )}

          {!p.quotationId && (
            <span className="inline-flex w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-200">
              Direct deal
            </span>
          )}

          {openBlk > 0 && (
            <p className="text-xs font-medium text-destructive">{openBlk} open blockage(s) — open project to resolve</p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <Link
              to={`/projects/${p.id}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Open project
            </Link>
            {quo && (
              <Link
                to={`/sales/quotations/${quo.id}`}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
              >
                Quotation
              </Link>
            )}
            {invs.length > 0 ? (
              invs.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/finance/invoices/${inv.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
                >
                  Invoice {inv.invoiceNumber}
                </Link>
              ))
            ) : (
              <Link
                to={`/finance/invoices/new?projectId=${encodeURIComponent(p.id)}`}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
              >
                Create invoice
              </Link>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const selfProjects = visibleProjects.filter((p) => SELF_WORKING_TYPES.includes(p.type));
  const commProjects = visibleProjects.filter((p) => COMMISSION_TYPES.includes(p.type));
  const otherProjects = visibleProjects.filter(
    (p) => !SELF_WORKING_TYPES.includes(p.type) && !COMMISSION_TYPES.includes(p.type)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <ShellButton type="button" variant="primary" onClick={() => setDirectOpen(true)}>
          New project (direct deal)
        </ShellButton>
        <label className="text-sm font-medium text-foreground">
          Projects
          <select
            className="select-shell mt-1 min-w-[11rem]"
            value={statusScope}
            onChange={(e) => setStatusScope(e.target.value as typeof statusScope)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active pipeline</option>
            <option value="completed">Completed / closed</option>
          </select>
        </label>
      </div>

      {projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create a project from a confirmed quotation, or seed demo data (refresh after deploy)."
        />
      )}

      {projects.length > 0 && visibleProjects.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects match this status filter.</p>
      )}

      {visibleProjects.length > 0 && (
        <div className="space-y-5">
          <section className="rounded-xl border border-border/80 bg-card/40">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              onClick={() => setOpenSelf((o) => !o)}
            >
              <div>
                <h2 className="text-base font-semibold text-foreground">Self working projects</h2>
                <p className="text-xs text-muted-foreground">Solo, partner profit-share, and partner-with-contributions</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{selfProjects.length}</span>
            </button>
            {openSelf && (
              <div className="border-t border-border/60 p-4 pt-4">
                {selfProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects in this group.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{selfProjects.map((p) => renderProjectCard(p))}</div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/80 bg-card/40">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              onClick={() => setOpenComm((o) => !o)}
            >
              <div>
                <h2 className="text-base font-semibold text-foreground">Commissioned (OEM / vendorship)</h2>
                <p className="text-xs text-muted-foreground">Vendorship fee and channel-led execution</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{commProjects.length}</span>
            </button>
            {openComm && (
              <div className="border-t border-border/60 p-4 pt-4">
                {commProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No commissioned projects.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{commProjects.map((p) => renderProjectCard(p))}</div>
                )}
              </div>
            )}
          </section>

          {otherProjects.length > 0 && (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4">
              <h2 className="text-base font-semibold text-foreground">Other types</h2>
              <p className="mb-3 text-xs text-muted-foreground">Projects that don&apos;t match the groups above (legacy or new enum values).</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{otherProjects.map((p) => renderProjectCard(p))}</div>
            </section>
          )}
        </div>
      )}

      <Modal open={directOpen} title="New project — direct deal" onClose={() => setDirectOpen(false)} wide>
        <p className="mb-3 text-sm text-muted-foreground">
          Use when the customer agreed scope without a formal quotation in the system. You can add contract amount and billing later.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">
            Customer *
            <select
              className="select-shell mt-1 w-full"
              value={ddCustomer}
              onChange={(e) => setDdCustomer(e.target.value)}
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Project name (optional)
            <input
              className="input-shell mt-1 w-full"
              value={ddName}
              onChange={(e) => setDdName(e.target.value)}
              placeholder="Defaults to Customer + kW"
            />
          </label>
          <label className="text-sm">
            Capacity (kW)
            <input className="input-shell mt-1 w-full" value={ddCap} onChange={(e) => setDdCap(e.target.value)} />
          </label>
          <label className="text-sm">
            Segment
            <select className="select-shell mt-1 w-full" value={ddCat} onChange={(e) => setDdCat(e.target.value as Project['category'])}>
              {(['Residential', 'Commercial', 'Industrial', 'Other'] as const).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Project type
            <select
              className="select-shell mt-1 w-full"
              value={ddType}
              onChange={(e) => {
                const t = e.target.value as Project['type'];
                setDdType(t);
                if (t === 'Partner (Profit Only)' || t === 'Partner with Contributions') {
                  setDdPartnerId(partners[0]?.id ?? '');
                  setDdCoPartnerIds([]);
                }
                if (t === 'Vendorship Fee') {
                  setDdChannelId(channelPartners[0]?.id ?? '');
                }
              }}
            >
              <option value="Solo">Solo</option>
              <option value="Partner (Profit Only)">Partner (Profit Only)</option>
              <option value="Vendorship Fee">Vendorship Fee</option>
              <option value="Partner with Contributions">Partner with Contributions</option>
            </select>
          </label>
          {(ddType === 'Partner (Profit Only)' || ddType === 'Partner with Contributions') && (
            <>
              <label className="text-sm sm:col-span-2">
                Primary partner *
                <select
                  className="select-shell mt-1 w-full"
                  value={ddPartnerId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDdPartnerId(v);
                    setDdCoPartnerIds((prev) => prev.filter((id) => id !== v));
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
              {partners.filter((p) => p.id !== ddPartnerId).length > 0 && (
                <div className="sm:col-span-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Additional partners (optional)</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {partners
                      .filter((p) => p.id !== ddPartnerId)
                      .map((p) => (
                        <label key={p.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={ddCoPartnerIds.includes(p.id)}
                            onChange={() =>
                              setDdCoPartnerIds((prev) =>
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
          {ddType === 'Vendorship Fee' && (
            <label className="text-sm sm:col-span-2">
              Channel / OEM partner *
              <select className="select-shell mt-1 w-full" value={ddChannelId} onChange={(e) => setDdChannelId(e.target.value)}>
                <option value="">Select…</option>
                {channelPartners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm sm:col-span-2">
            Site / install address
            <input
              className="input-shell mt-1 w-full"
              value={ddAddr}
              onChange={(e) => setDdAddr(e.target.value)}
              placeholder="Defaults to customer billing address"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setDirectOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={saveDirectDeal}>
            Create project
          </ShellButton>
        </div>
      </Modal>
    </div>
  );
}

/** Shared list for `/projects?view=locations` and legacy exports. */
export function InstallLocationsPanel() {
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const [pid, setPid] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);

  const filtered = useMemo(() => {
    return sites.filter((s) => !pid || s.projectId === pid);
  }, [sites, pid]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length, pageSize, pid]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedSites = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Install locations belong to a project — open a row to work in project context.{' '}
        <Link to="/projects" className="text-primary hover:underline">
          All projects
        </Link>
      </p>
      <label className="block max-w-md text-sm font-medium text-foreground">
        Filter by project
        <select className="select-shell mt-1 w-full" value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <DataTableShell bodyMaxHeight={listTableBodyMaxHeight(pageSize)}>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Location</th>
              <th>Project</th>
              <th>Address</th>
              <th className="w-28 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {pagedSites.map((s) => (
              <tr key={s.id}>
                <td className="font-medium text-foreground">{s.name}</td>
                <td className="text-muted-foreground">{projectName(s.projectId)}</td>
                <td className="max-w-xs truncate text-muted-foreground">{s.address}</td>
                <td className="text-right">
                  <Link
                    className="text-sm font-medium text-primary hover:underline"
                    to={`/projects/${s.projectId}?site=${encodeURIComponent(s.id)}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
      {filtered.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <TablePaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No locations match this filter.</p>}
    </div>
  );
}

export function SitesList() {
  return <Navigate to="/projects" replace />;
}

type LedgerDraft = { opening: string; returned: string; scrap: string; consumed: string };

export function SiteDetail() {
  const { id } = useParams();
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const [photoUrl, setPhotoUrl] = useState('');
  const [blkNew, setBlkNew] = useState('');
  const [ledgerDrafts, setLedgerDrafts] = useState<Record<string, LedgerDraft>>({});
  const [newLedgerMatId, setNewLedgerMatId] = useState('');
  const [docKind, setDocKind] = useState<SiteDocumentKind>('DCR');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const foundSite = sites.find((x) => x.id === id);
  if (!foundSite) return <p>Not found</p>;
  const site = foundSite;
  const parentProject = projects.find((p) => p.id === site.projectId);
  const soloParent = parentProject?.type === 'Solo';

  const ledgerRowsForSite = useMemo(
    () => (parentProject?.siteMaterialLedger ?? []).filter((r) => r.siteId === site.id),
    [parentProject?.siteMaterialLedger, site.id]
  );

  const ledgerSyncKey = useMemo(
    () =>
      ledgerRowsForSite
        .map(
          (r) =>
            `${r.id}:${r.issuedQty}:${r.openingQty}:${r.returnedQty}:${r.scrapAtSiteQty}:${r.consumedQty}:${r.lastUpdatedAt ?? ''}`
        )
        .join('|'),
    [ledgerRowsForSite]
  );

  useEffect(() => {
    const next: Record<string, LedgerDraft> = {};
    for (const r of ledgerRowsForSite) {
      next[r.id] = {
        opening: String(r.openingQty),
        returned: String(r.returnedQty),
        scrap: String(r.scrapAtSiteQty),
        consumed: String(r.consumedQty),
      };
    }
    setLedgerDrafts(next);
  }, [ledgerSyncKey]);

  function addPhotoUrl() {
    const u = photoUrl.trim();
    if (!u) {
      show('Enter a photo URL', 'error');
      return;
    }
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) => (x.id === site.id ? { ...x, photos: [...x.photos, u] } : x))
    );
    setPhotoUrl('');
    bump();
    show('Photo added', 'success');
  }

  function removePhoto(pi: number) {
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) =>
        x.id === site.id ? { ...x, photos: x.photos.filter((_, i) => i !== pi) } : x
      )
    );
    bump();
    show('Photo removed', 'success');
  }

  function addSiteBlockage() {
    const d = blkNew.trim();
    if (!d) {
      show('Enter a description', 'error');
      return;
    }
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) =>
        x.id === site.id
          ? {
              ...x,
              siteBlockages: [
                ...(x.siteBlockages ?? []),
                {
                  id: generateId('sblk'),
                  description: d,
                  resolved: false,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : x
      )
    );
    setBlkNew('');
    bump();
    show('Site issue logged', 'success');
  }

  function resolveSiteBlockage(bid: string) {
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) =>
        x.id === site.id
          ? {
              ...x,
              siteBlockages: (x.siteBlockages ?? []).map((b) =>
                b.id === bid ? { ...b, resolved: true } : b
              ),
            }
          : x
      )
    );
    bump();
    show('Marked resolved', 'success');
  }

  function toggleItem(idx: number) {
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) => {
        if (x.id !== site.id) return x;
        const items = [...x.checklistItems];
        const it = items[idx];
        if (!it) return x;
        items[idx] = {
          ...it,
          completed: !it.completed,
          completedAt: !it.completed ? new Date().toISOString() : undefined,
        };
        return { ...x, checklistItems: items };
      })
    );
    bump();
    show('Checklist updated', 'success');
  }

  function initSoloWorkStatusTemplate() {
    const list = getCollection<Site>('sites');
    const soloWorkStatus: Site['soloWorkStatus'] = {
      updatedAt: new Date().toISOString(),
      areas: [
        {
          id: generateId('wsa'),
          title: 'Roof & civil',
          items: [
            { id: generateId('wsi'), title: 'Roof survey / readiness', done: false },
            { id: generateId('wsi'), title: 'Lay plan confirmed', done: false },
          ],
        },
        {
          id: generateId('wsa'),
          title: 'DC / AC installation',
          items: [
            { id: generateId('wsi'), title: 'Module mounting', done: false },
            { id: generateId('wsi'), title: 'Wiring & terminations', done: false },
          ],
        },
      ],
    };
    setCollection(
      'sites',
      list.map((x) => (x.id === site.id ? { ...x, soloWorkStatus } : x))
    );
    bump();
    show('Solo work-status template added', 'success');
  }

  function persistProjectLedger(nextRows: SiteMaterialLedgerRow[]) {
    if (!parentProject) return;
    const projs = getCollection<Project>('projects');
    const rest = (parentProject.siteMaterialLedger ?? []).filter((r) => r.siteId !== site.id);
    setCollection(
      'projects',
      projs.map((p) =>
        p.id !== parentProject.id
          ? p
          : { ...p, siteMaterialLedger: [...rest, ...nextRows], updatedAt: new Date().toISOString() }
      )
    );
    bump();
    show('Material ledger saved', 'success');
  }

  function saveLedgerFromDrafts() {
    if (!parentProject) return;
    const now = new Date().toISOString();
    const updated = ledgerRowsForSite.map((r) => {
      const d = ledgerDrafts[r.id];
      if (!d) return r;
      return {
        ...r,
        openingQty: Math.max(0, Number(d.opening) || 0),
        returnedQty: Math.max(0, Number(d.returned) || 0),
        scrapAtSiteQty: Math.max(0, Number(d.scrap) || 0),
        consumedQty: Math.max(0, Number(d.consumed) || 0),
        lastUpdatedAt: now,
        lastUpdatedBy: role,
      };
    });
    persistProjectLedger(updated);
  }

  function addLedgerMaterialRow() {
    if (!parentProject || !newLedgerMatId) {
      show('Select a material', 'error');
      return;
    }
    if (ledgerRowsForSite.some((r) => r.materialId === newLedgerMatId)) {
      show('This material is already on the ledger for this site', 'error');
      return;
    }
    const now = new Date().toISOString();
    const row: SiteMaterialLedgerRow = {
      id: generateId('sml'),
      siteId: site.id,
      materialId: newLedgerMatId,
      openingQty: 0,
      issuedQty: 0,
      returnedQty: 0,
      scrapAtSiteQty: 0,
      consumedQty: 0,
      lastUpdatedAt: now,
      lastUpdatedBy: role,
    };
    const rest = parentProject.siteMaterialLedger ?? [];
    const projs = getCollection<Project>('projects');
    setCollection(
      'projects',
      projs.map((p) =>
        p.id !== parentProject.id ? p : { ...p, siteMaterialLedger: [...rest, row], updatedAt: now }
      )
    );
    setNewLedgerMatId('');
    bump();
    show('Row added — adjust quantities and save', 'success');
  }

  function addSiteDocumentRow() {
    const t = docTitle.trim();
    if (!t) {
      show('Title required', 'error');
      return;
    }
    const list = getCollection<Site>('sites');
    const doc = {
      id: generateId('sdoc'),
      kind: docKind,
      title: t,
      url: docUrl.trim() || undefined,
      notes: docNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setCollection(
      'sites',
      list.map((x) =>
        x.id === site.id ? { ...x, siteDocuments: [...(x.siteDocuments ?? []), doc] } : x
      )
    );
    setDocTitle('');
    setDocUrl('');
    setDocNotes('');
    bump();
    show('Document logged', 'success');
  }

  function patchWorkItem(areaId: string, itemId: string, itemPatch: Partial<SiteWorkStatusItem>) {
    const list = getCollection<Site>('sites');
    setCollection(
      'sites',
      list.map((x) => {
        if (x.id !== site.id || !x.soloWorkStatus) return x;
        return {
          ...x,
          soloWorkStatus: {
            ...x.soloWorkStatus,
            updatedAt: new Date().toISOString(),
            areas: x.soloWorkStatus.areas.map((a) =>
              a.id !== areaId
                ? a
                : {
                    ...a,
                    items: a.items.map((it) => (it.id !== itemId ? it : { ...it, ...itemPatch })),
                  }
            ),
          },
        };
      })
    );
    bump();
  }

  function toggleWorkStatusItem(areaId: string, itemId: string) {
    const list = getCollection<Site>('sites');
    const row = list.find((s) => s.id === site.id);
    const it = row?.soloWorkStatus?.areas.find((a) => a.id === areaId)?.items.find((i) => i.id === itemId);
    if (!it) return;
    const nextDone = !it.done;
    if (nextDone && soloParent && parentProject && workItemRequiresMaterialConsumption(it.title)) {
      if (!siteHasRecordedConsumption(parentProject, site.id)) {
        show(
          'Record installed/consumed qty in Site material ledger before completing this installation/structure step.',
          'error'
        );
        return;
      }
    }
    setCollection(
      'sites',
      list.map((siteRow) => {
        if (siteRow.id !== site.id || !siteRow.soloWorkStatus) return siteRow;
        return {
          ...siteRow,
          soloWorkStatus: {
            ...siteRow.soloWorkStatus,
            updatedAt: new Date().toISOString(),
            areas: siteRow.soloWorkStatus.areas.map((a) =>
              a.id !== areaId
                ? a
                : {
                    ...a,
                    items: a.items.map((item) =>
                      item.id !== itemId ? item : { ...item, done: nextDone }
                    ),
                  }
            ),
          },
        };
      })
    );
    bump();
  }

  return (
    <div className="space-y-4">
      <Link to="/projects" className="text-sm text-primary hover:underline">
        ← Back to projects
      </Link>
      <h1 className="text-2xl font-bold">{site.name}</h1>
      <p className="text-sm text-muted-foreground">{site.address}</p>
      {parentProject && (
        <p className="text-sm">
          <Link
            className="font-medium text-primary hover:underline"
            to={`/projects/${parentProject.id}?site=${encodeURIComponent(site.id)}`}
          >
            Open project · {parentProject.name}
          </Link>
        </p>
      )}

      {parentProject && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Site material ledger</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Opening, issued (from warehouse transfers), returned, scrap at site, installed/consumed, and balance — issue unit.
            Issued increases automatically when stock is transferred here.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Add material
              <select
                className="mt-1 block max-w-xs rounded border px-2 py-1.5 text-sm"
                value={newLedgerMatId}
                onChange={(e) => setNewLedgerMatId(e.target.value)}
              >
                <option value="">Select…</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.issueUnit}
                    {m.sizeSpec ? ` · ${m.sizeSpec}` : ''})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium"
              onClick={addLedgerMaterialRow}
            >
              Add row
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              onClick={saveLedgerFromDrafts}
            >
              Save ledger
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[48rem] w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Material</th>
                  <th className="py-2 pr-1 font-medium">Opening</th>
                  <th className="py-2 pr-1 font-medium">Issued</th>
                  <th className="py-2 pr-1 font-medium">Returned</th>
                  <th className="py-2 pr-1 font-medium">Scrap</th>
                  <th className="py-2 pr-1 font-medium">Consumed</th>
                  <th className="py-2 pr-1 font-medium">Balance</th>
                  <th className="py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRowsForSite.map((r) => {
                  const m = materials.find((x) => x.id === r.materialId);
                  const d = ledgerDrafts[r.id] ?? {
                    opening: String(r.openingQty),
                    returned: String(r.returnedQty),
                    scrap: String(r.scrapAtSiteQty),
                    consumed: String(r.consumedQty),
                  };
                  const bal = siteLedgerBalance({
                    ...r,
                    openingQty: Math.max(0, Number(d.opening) || 0),
                    returnedQty: Math.max(0, Number(d.returned) || 0),
                    scrapAtSiteQty: Math.max(0, Number(d.scrap) || 0),
                    consumedQty: Math.max(0, Number(d.consumed) || 0),
                  });
                  const setD = (field: keyof LedgerDraft, v: string) =>
                    setLedgerDrafts((prev) => ({
                      ...prev,
                      [r.id]: { ...d, [field]: v },
                    }));
                  return (
                    <tr key={r.id} className="border-t border-border/80">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-foreground">{m?.name ?? r.materialId}</div>
                        <div className="text-muted-foreground">
                          {m?.issueUnit}
                          {m?.sizeSpec ? ` · ${m.sizeSpec}` : ''}
                        </div>
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20"
                          value={d.opening}
                          onChange={(e) => setD('opening', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-1 tabular-nums text-muted-foreground">{r.issuedQty}</td>
                      <td className="py-1 pr-1">
                        <input
                          className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20"
                          value={d.returned}
                          onChange={(e) => setD('returned', e.target.value)}
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20"
                          value={d.scrap}
                          onChange={(e) => setD('scrap', e.target.value)}
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20"
                          value={d.consumed}
                          onChange={(e) => setD('consumed', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-1 tabular-nums font-medium text-foreground">{bal}</td>
                      <td className="py-2 text-muted-foreground">
                        {r.lastUpdatedBy ? `${r.lastUpdatedBy} · ` : ''}
                        {r.lastUpdatedAt ? new Date(r.lastUpdatedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ledgerRowsForSite.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">No ledger rows yet. Add a material or issue stock to this site.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Site documents (DCR / WCR / vendor)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Track daily completion reports, work completion, and vendor confirmations.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="rounded border px-2 py-1.5 text-sm"
            value={docKind}
            onChange={(e) => setDocKind(e.target.value as SiteDocumentKind)}
          >
            {(['DCR', 'WCR', 'VendorConfirmation', 'Other'] as const).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm"
            placeholder="Title"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />
          <input
            className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm"
            placeholder="URL (optional)"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
          <input
            className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm"
            placeholder="Notes"
            value={docNotes}
            onChange={(e) => setDocNotes(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={addSiteDocumentRow}
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {(site.siteDocuments ?? []).map((doc) => (
            <li key={doc.id} className="rounded-md border border-border/80 px-3 py-2">
              <span className="font-medium text-foreground">{doc.kind}</span>
              <span className="text-foreground"> · {doc.title}</span>
              {doc.url && (
                <a className="ml-2 text-primary hover:underline" href={doc.url} target="_blank" rel="noreferrer">
                  Link
                </a>
              )}
              {doc.notes && <p className="mt-1 text-xs text-muted-foreground">{doc.notes}</p>}
            </li>
          ))}
          {(site.siteDocuments ?? []).length === 0 && (
            <li className="text-muted-foreground">No documents logged yet.</li>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Photos</h2>
        <p className="mt-1 text-xs text-muted-foreground">Add image URLs (or pasted data URLs from your device).</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded border px-3 py-2 text-sm"
            placeholder="https://…"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={addPhotoUrl}>
            Add photo
          </button>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {site.photos.map((url, pi) => (
            <li key={`${url}-${pi}`} className="relative overflow-hidden rounded-md border border-border">
              <img src={url} alt="" className="h-32 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-background/90 px-2 py-0.5 text-xs"
                onClick={() => removePhoto(pi)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {site.photos.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No photos yet.</p>}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Site issues</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded border px-3 py-2 text-sm"
            placeholder="Describe blockage / issue"
            value={blkNew}
            onChange={(e) => setBlkNew(e.target.value)}
          />
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={addSiteBlockage}>
            Log issue
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {(site.siteBlockages ?? []).map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-2 border-b border-border py-2">
              <span className={b.resolved ? 'text-muted-foreground line-through' : ''}>{b.description}</span>
              {!b.resolved && (
                <button type="button" className="shrink-0 text-primary" onClick={() => resolveSiteBlockage(b.id)}>
                  Resolve
                </button>
              )}
            </li>
          ))}
          {(site.siteBlockages ?? []).length === 0 && <li className="text-muted-foreground">No site-level issues.</li>}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Checklist</h2>
        <ul className="mt-2 space-y-2">
          {site.checklistItems.map((it, idx) => (
            <li key={it.itemId} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={it.completed} onChange={() => toggleItem(idx)} />
              <span>{it.description}</span>
              {materials.find((m) => m.id === it.materialId) && (
                <span className="text-xs text-muted-foreground">
                  ({materials.find((m) => m.id === it.materialId)?.name})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {soloParent && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Solo work status (structured)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Installation/structure steps require consumed qty on the site material ledger. Photo verification: set status,
            verifier, and remarks.
          </p>
          {!site.soloWorkStatus?.areas?.length ? (
            <button
              type="button"
              className="mt-3 rounded-lg border border-primary/40 px-3 py-2 text-sm text-primary"
              onClick={initSoloWorkStatusTemplate}
            >
              Add starter template
            </button>
          ) : (
            <ul className="mt-3 space-y-4 text-sm">
              {site.soloWorkStatus.areas.map((a) => (
                <li key={a.id}>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <ul className="mt-2 space-y-3 pl-0 sm:pl-2">
                    {a.items.map((it) => (
                      <li key={it.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="checkbox"
                            checked={it.done}
                            onChange={() => toggleWorkStatusItem(a.id, it.id)}
                          />
                          <span className={it.done ? 'text-muted-foreground line-through' : ''}>{it.title}</span>
                          {workItemRequiresMaterialConsumption(it.title) && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200">
                              Ledger required
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Verification</span>
                          <select
                            className="rounded border px-2 py-1"
                            value={it.approvalStatus ?? 'none'}
                            onChange={(e) =>
                              patchWorkItem(a.id, it.id, {
                                approvalStatus: e.target.value as SiteWorkStatusItem['approvalStatus'],
                              })
                            }
                          >
                            <option value="none">None</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="resubmit_requested">Resubmit</option>
                          </select>
                          <input
                            className="min-w-[6rem] flex-1 rounded border px-2 py-1"
                            placeholder="Verifier name"
                            value={it.verifierName ?? ''}
                            onChange={(e) => patchWorkItem(a.id, it.id, { verifierName: e.target.value })}
                          />
                          <input
                            className="min-w-[10rem] flex-[2] rounded border px-2 py-1"
                            placeholder="Remarks"
                            value={it.verificationRemarks ?? ''}
                            onChange={(e) => patchWorkItem(a.id, it.id, { verificationRemarks: e.target.value })}
                          />
                          <button
                            type="button"
                            className="rounded border border-border px-2 py-1"
                            onClick={() =>
                              patchWorkItem(a.id, it.id, { verifiedAt: new Date().toISOString() })
                            }
                          >
                            Stamp time
                          </button>
                        </div>
                        {(it.verifiedAt || it.verifierName) && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {it.verifierName && <span>{it.verifierName}</span>}
                            {it.verifiedAt && (
                              <span>
                                {it.verifierName ? ' · ' : ''}
                                {new Date(it.verifiedAt).toLocaleString()}
                              </span>
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightSiteId = searchParams.get('site') ?? undefined;
  const { role } = useRole();
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');
  const materials = useLiveCollection<Material>('materials');
  const agents = useLiveCollection<Agent>('agents');
  const partners = useLiveCollection<{ id: string; name: string; profitSharePercent: number }>('partners');
  const users = useLiveCollection<User>('users');
  const transfers = useLiveCollection<MaterialTransfer>('materialTransfers');
  const materialReturns = useLiveCollection<MaterialReturn>('materialReturns');
  const tasks = useLiveCollection<Task>('tasks');
  const outsourceRows = useLiveCollection<OutsourceWork>('outsourceWork');
  const companyExpsAll = useLiveCollection<CompanyExpense>('companyExpenses');
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const attendance = useLiveCollection<Attendance>('attendance');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
  const channelFees = useLiveCollection<ChannelPartnerFee>('channelFees');
  const quotations = useLiveCollection<Quotation>('quotations');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const suppliers = useLiveCollection<Supplier>('suppliers');
  const introAgentEconomics = useLiveCollection<AgentIntroProjectEconomics>('introAgentEconomics');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [tab, setTab] = useState<ProjectDetailTabKey>('timeline');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blk, setBlk] = useState(() => ({ ...EMPTY_BLK }));
  const dossierRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [finView, setFinView] = useState<FinSubViewKey>('summary');
  const [transferOpen, setTransferOpen] = useState(false);
  const [xfer, setXfer] = useState({ materialId: '', qty: '', siteId: '' });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [outsourceOpen, setOutsourceOpen] = useState(false);
  const [outForm, setOutForm] = useState({ type: 'JCB', quantity: '1', cost: '', date: '', notes: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', capacity: '', status: '' as Project['status'] });
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ name: '', address: '' });
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [contribOpen, setContribOpen] = useState(false);
  const [contribLabor, setContribLabor] = useState({ description: '', hours: '', cost: '', date: '' });
  const [contribMat, setContribMat] = useState({ materialId: '', quantity: '', cost: '', date: '' });
  const [resolveBlockageId, setResolveBlockageId] = useState<string | null>(null);
  const [resolutionNotesDraft, setResolutionNotesDraft] = useState('');

  const found = projects.find((x) => x.id === id);
  const readOnly = role === 'Installation Team';

  usePageHeader(
    useMemo(
      () =>
        found
          ? {
              title: found.name,
              subtitle: `${formatProgressStage(found)} · ${found.status}`,
              breadcrumbs: [
                { label: 'Home', to: '/dashboard' },
                { label: 'Projects', to: '/projects' },
                { label: found.name },
              ],
            }
          : { title: 'Project' },
      [found]
    )
  );

  const tabDefs = useMemo(() => (found ? visibleProjectTabs(found.type) : []), [found]);
  const finTabDefs = useMemo(() => (found ? visibleFinSubViews(found.type) : []), [found]);

  useEffect(() => {
    if (!found) return;
    const allowed = visibleProjectTabs(found.type).map((t) => t.key);
    if (!allowed.includes(tab)) setTab('timeline');
  }, [found, tab]);

  useEffect(() => {
    if (!found) return;
    const allowed = visibleFinSubViews(found.type).map((t) => t.key);
    if (allowed.length === 0) return;
    if (!allowed.includes(finView)) setFinView(allowed[0]!);
  }, [found, finView]);

  const projectSitesForScroll = useMemo(() => {
    if (!found) return [] as Site[];
    return sites.filter((s) => s.projectId === found.id);
  }, [found, sites]);

  useEffect(() => {
    if (!highlightSiteId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`install-site-${highlightSiteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [highlightSiteId, projectSitesForScroll.length]);

  const projectEvents = useMemo(() => {
    if (!found) return [];
    const projectTasksLocal = tasks.filter((t) => t.projectId === found.id);
    const projCE = companyExpsAll.filter((e) => e.projectId === found.id);
    const projOut = outsourceRows.filter((o) => o.projectId === found.id);
    const projInv = invoices.filter((i) => i.projectId === found.id);
    const ev: { t: string; label: string }[] = [];
    found.progressSteps.forEach((s) => {
      if (s.updatedAt)
        ev.push({ t: s.updatedAt, label: `Step ${s.step} ${s.name} → ${s.status}` });
    });
    projectTasksLocal.forEach((tk) => {
      const tt = tk.taskType ? ` [${tk.taskType}]` : '';
      ev.push({
        t: tk.updatedAt,
        label: `${tk.kind === 'Ticket' ? 'Ticket' : 'Task'}${tt}: ${tk.title} (${tk.status})`,
      });
    });
    projCE.forEach((e) => {
      ev.push({ t: e.createdAt, label: `Expense: ${e.category} ${formatINRDecimal(e.amount)}` });
    });
    projOut.forEach((o) => {
      ev.push({ t: o.createdAt, label: `Outsource: ${o.type} ${formatINRDecimal(o.cost)}` });
    });
    projInv.forEach((inv) => {
      ev.push({ t: inv.createdAt, label: `Invoice ${inv.invoiceNumber} (${inv.status})` });
    });
    projInv.forEach((inv) => {
      payments
        .filter((p) => p.invoiceId === inv.id)
        .forEach((p) => {
          ev.push({ t: `${p.date}T12:00:00.000Z`, label: `Client payment ${formatINRDecimal(p.amount)}` });
        });
    });
    return ev.sort((a, b) => b.t.localeCompare(a.t));
  }, [found, tasks, companyExpsAll, outsourceRows, invoices, payments]);

  const epcDocChecklist = useMemo(() => (found ? requiredProjectDocuments(found) : []), [found]);
  const epcBillingLines = useMemo(() => (found ? billingSummaryLines(found) : []), [found]);
  const epcDocTier = useMemo(() => (found ? documentationTier(inferSolarKind(found)) : 'full'), [found]);

  if (!found) return <p>Not found</p>;
  const project = found;

  const introAgentRow =
    project.agentId != null
      ? introAgentEconomics.find((r) => r.projectId === project.id && r.agentId === project.agentId)
      : undefined;

  const chPartner = project.channelPartnerId ? channelPartners.find((c) => c.id === project.channelPartnerId) : undefined;
  const projectChannelFees = channelFees.filter((f) => f.projectId === project.id);

  const cust = customers.find((c) => c.id === project.customerId);
  const agent = project.agentId ? agents.find((a) => a.id === project.agentId) : undefined;
  const partner = project.partnerId ? partners.find((x) => x.id === project.partnerId) : undefined;
  const projectSites = sites.filter((s) => s.projectId === project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectTasksOnly = projectTasks.filter((t) => t.kind !== 'Ticket');
  const projectTickets = projectTasks.filter((t) => t.kind === 'Ticket');
  const projCompanyExps = companyExpsAll.filter((e) => e.projectId === project.id);
  const projectInvoices = invoices.filter((i) => i.projectId === project.id);
  const projectTransfers = transfers.filter((t) => t.projectId === project.id);
  const projectReturns = materialReturns.filter((r) => r.projectId === project.id);
  const paymentsRecv = getClientPaymentsForProject(project.id);
  const expTotal = getProjectExpenseTotal(project.id);
  const contrib = partnerContributionTotal(project);
  const share2 = partner ? partnerProfitShareType2(project, partner.profitSharePercent) : 0;
  const comm = agent ? agentCommissionForProject(agent, project.capacity) : 0;

  const company = getItem<CompanyProfile>('companyProfile');

  const quo = project.quotationId ? quotations.find((q) => q.id === project.quotationId) : undefined;
  const linkedEnquiry = quo?.enquiryId ? enquiries.find((e) => e.id === quo.enquiryId) : undefined;
  const isFeeProject = project.type === 'Vendorship Fee';
  const isPartnerType =
    project.type === 'Partner (Profit Only)' || project.type === 'Partner with Contributions';

  const heroTypeSlots = projectTypeFullLabelSlotsHeroCard(project);
  const promoteHeroType = shouldPromoteProjectTypeInSection(heroTypeSlots);
  const dossierTypeSlots = projectTypeFullLabelSlotsDossierPreview(project);
  const promoteDossierType = shouldPromoteProjectTypeInSection(dossierTypeSlots);
  const typeDotClass = projectTypeDotClass(project.type);

  function patchProject(patch: Partial<Project>) {
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id === project.id ? { ...proj, ...patch, updatedAt: new Date().toISOString() } : proj
      )
    );
    bump();
  }

  function setPrimaryPartnerId(nextId: string) {
    const co = (project.coPartnerIds ?? []).filter((x) => x !== nextId);
    patchProject({
      partnerId: nextId || undefined,
      coPartnerIds: co,
    });
  }

  function toggleCoPartner(partnerRowId: string) {
    if (partnerRowId === project.partnerId) return;
    const cur = project.coPartnerIds ?? [];
    const has = cur.includes(partnerRowId);
    const next = has ? cur.filter((x) => x !== partnerRowId) : [...cur, partnerRowId];
    patchProject({ coPartnerIds: next });
  }

  function setChannelPartnerOnProject(nextId: string) {
    patchProject({ channelPartnerId: nextId || undefined });
  }

  function openBlockageBlank() {
    setBlk({ ...EMPTY_BLK });
    setBlockOpen(true);
  }

  function openBlockageFromStep(si: number) {
    const st = project.progressSteps[si];
    if (!st) return;
    const label = `Step ${st.step}: ${st.name}`;
    setBlk({ ...EMPTY_BLK, projectStage: label, timelineStage: label });
    setBlockOpen(true);
  }

  async function downloadProjectDossier() {
    if (!dossierRef.current) return;
    setPdfBusy(true);
    try {
      const safe = project.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'project';
      await exportDomToPdf(dossierRef.current, `${safe}-dossier.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  function updateStep(si: number, status: Project['progressSteps'][0]['status']) {
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) => {
        if (proj.id !== project.id) return proj;
        const steps = [...proj.progressSteps];
        const cur = steps[si];
        if (!cur) return proj;
        steps[si] = {
          ...cur,
          status,
          updatedAt: new Date().toISOString(),
          updatedBy: users[0]?.id,
        };
        return { ...proj, progressSteps: steps, updatedAt: new Date().toISOString() };
      })
    );
    bump();
    show('Step updated', 'success');
  }

  function saveStepNotes(si: number) {
    const step = project.progressSteps[si];
    const text = notesDraft[si] ?? step?.notes ?? '';
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) => {
        if (proj.id !== project.id) return proj;
        const steps = [...proj.progressSteps];
        const cur = steps[si];
        if (!cur) return proj;
        steps[si] = {
          ...cur,
          notes: text,
          updatedAt: new Date().toISOString(),
          updatedBy: users[0]?.id,
        };
        return { ...proj, progressSteps: steps, updatedAt: new Date().toISOString() };
      })
    );
    const nextDraft = { ...notesDraft };
    delete nextDraft[si];
    setNotesDraft(nextDraft);
    bump();
    show('Notes saved', 'success');
  }

  function saveOutsource(e: React.FormEvent) {
    e.preventDefault();
    const cost = Number(outForm.cost);
    const qty = Number(outForm.quantity) || 1;
    if (cost <= 0 || !outForm.date) {
      show('Cost and date required', 'error');
      return;
    }
    const row: OutsourceWork = {
      id: generateId('out'),
      projectId: project.id,
      type: outForm.type,
      quantity: qty,
      cost,
      date: outForm.date,
      notes: outForm.notes,
      createdAt: new Date().toISOString(),
    };
    setCollection('outsourceWork', [...getCollection<OutsourceWork>('outsourceWork'), row]);
    setOutsourceOpen(false);
    setOutForm({ type: 'JCB', quantity: '1', cost: '', date: '', notes: '' });
    bump();
    show('Outsource work recorded', 'success');
  }

  function saveProjectEdit(e: React.FormEvent) {
    e.preventDefault();
    const cap = Number(editForm.capacity);
    if (!editForm.name.trim()) return;
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id === project.id
          ? {
              ...proj,
              name: editForm.name.trim(),
              address: editForm.address,
              capacity: cap > 0 ? cap : proj.capacity,
              status: editForm.status,
              updatedAt: new Date().toISOString(),
            }
          : proj
      )
    );
    setEditOpen(false);
    bump();
    show('Project updated', 'success');
  }

  function saveNewSite(e: React.FormEvent) {
    e.preventDefault();
    if (!siteForm.name.trim() || !siteForm.address.trim()) {
      show('Name and address required', 'error');
      return;
    }
    const site: Site = {
      id: generateId('site'),
      projectId: project.id,
      name: siteForm.name.trim(),
      address: siteForm.address.trim(),
      photos: [],
      checklistItems: [],
      createdAt: new Date().toISOString(),
    };
    setCollection('sites', [...getCollection<Site>('sites'), site]);
    setSiteOpen(false);
    setSiteForm({ name: '', address: '' });
    bump();
    show('Site added', 'success');
  }

  function addBlockage() {
    const desc = (blk.description || blk.title).trim();
    if (!desc || !blk.assignedTo || !blk.dueDate) {
      show('Description (or title), assignee, and due date required', 'error');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (blk.dueDate < today) {
      show('Due date must be today or in the future', 'error');
      return;
    }
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id === project.id
          ? {
              ...proj,
              blockages: [
                ...proj.blockages,
                {
                  id: generateId('blk'),
                  title: blk.title.trim() || undefined,
                  description: desc,
                  reason: blk.reason.trim() || undefined,
                  howToSolve: blk.howToSolve.trim() || undefined,
                  resolveByDate: blk.resolveByDate || undefined,
                  projectStage: blk.projectStage.trim() || undefined,
                  timelineStage: blk.timelineStage.trim() || undefined,
                  assignedTo: blk.assignedTo,
                  dueDate: blk.dueDate,
                  resolved: false,
                  status: 'active',
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : proj
      )
    );
    setBlockOpen(false);
    setBlk({ ...EMPTY_BLK });
    bump();
    show('Blockage added', 'success');
  }

  function confirmResolveBlockage() {
    const bid = resolveBlockageId;
    if (!bid) return;
    const resolutionNotes = resolutionNotesDraft;
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id === project.id
          ? {
              ...proj,
              blockages: proj.blockages.map((b) =>
                b.id === bid
                  ? {
                      ...b,
                      resolved: true,
                      status: 'resolved',
                      resolvedAt: new Date().toISOString(),
                      resolvedBy: users[0]?.name,
                      resolutionNotes: resolutionNotes.trim() || undefined,
                    }
                  : b
              ),
            }
          : proj
      )
    );
    bump();
    setResolveBlockageId(null);
    setResolutionNotesDraft('');
    show('Resolved', 'success');
  }

  function saveLaborContribution() {
    const hours = Number(contribLabor.hours) || 0;
    const cost = Number(contribLabor.cost) || 0;
    if (!contribLabor.description.trim() || !contribLabor.date) {
      show('Description and date required', 'error');
      return;
    }
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) => {
        if (proj.id !== project.id) return proj;
        const pc = proj.partnerContributions ?? { labor: [], materials: [] };
        return {
          ...proj,
          partnerContributions: {
            ...pc,
            labor: [
              ...pc.labor,
              {
                id: generateId('plab'),
                description: contribLabor.description.trim(),
                hours,
                cost,
                date: contribLabor.date,
              },
            ],
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    bump();
    show('Labor contribution recorded', 'success');
    setContribOpen(false);
    setContribLabor({ description: '', hours: '', cost: '', date: '' });
  }

  function saveMaterialContribution() {
    const quantity = Number(contribMat.quantity) || 0;
    const cost = Number(contribMat.cost) || 0;
    if (!contribMat.materialId || !contribMat.date) {
      show('Material and date required', 'error');
      return;
    }
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) => {
        if (proj.id !== project.id) return proj;
        const pc = proj.partnerContributions ?? { labor: [], materials: [] };
        return {
          ...proj,
          partnerContributions: {
            ...pc,
            materials: [
              ...pc.materials,
              {
                id: generateId('pmat'),
                materialId: contribMat.materialId,
                quantity,
                cost,
                date: contribMat.date,
              },
            ],
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    bump();
    show('Material contribution recorded', 'success');
    setContribOpen(false);
    setContribMat({ materialId: '', quantity: '', cost: '', date: '' });
  }

  function transferMaterial() {
    const mat = materials.find((m) => m.id === xfer.materialId);
    if (!mat || !xfer.qty) {
      show('Select material and quantity', 'error');
      return;
    }
    const qtyIssue = Number(xfer.qty);
    const deduct = issueToPurchaseQty(qtyIssue, mat);
    if (deduct > mat.currentStock) {
      show('Insufficient stock', 'error');
      return;
    }
    const mats = getCollection<Material>('materials');
    setCollection(
      'materials',
      mats.map((m) =>
        m.id === mat.id ? { ...m, currentStock: m.currentStock - deduct, updatedAt: new Date().toISOString() } : m
      )
    );
    const mt = getCollection<MaterialTransfer>('materialTransfers');
    setCollection('materialTransfers', [
      ...mt,
      {
        id: generateId('xfer'),
        materialId: mat.id,
        projectId: project.id,
        siteId: xfer.siteId || undefined,
        quantityInIssueUnit: qtyIssue,
        quantityDeductedPurchase: deduct,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      },
    ]);
    const d = new Date().toISOString().slice(0, 10);
    const projs = getCollection<Project>('projects');
    setCollection(
      'projects',
      projs.map((proj) => {
        if (proj.id !== project.id) return proj;
        const withLine = {
          ...proj,
          materialsSent: [
            ...(proj.materialsSent ?? []),
            {
              id: generateId('msent'),
              materialId: mat.id,
              quantity: qtyIssue,
              date: d,
              siteId: xfer.siteId || undefined,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        return upsertLedgerAfterIssue(withLine, xfer.siteId || undefined, mat.id, qtyIssue);
      })
    );
    setTransferOpen(false);
    bump();
    show('Material transferred', 'success');
  }

  function updateLoanInstallmentRow(loanId: string, patch: Partial<ProjectLoanInstallment>) {
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id !== project.id
          ? proj
          : {
              ...proj,
              loanInstallments: (proj.loanInstallments ?? []).map((x) =>
                x.id === loanId ? { ...x, ...patch } : x
              ),
              updatedAt: new Date().toISOString(),
            }
      )
    );
    bump();
  }

  function addLoanInstallmentRow() {
    const list = getCollection<Project>('projects');
    const cur = list.find((p) => p.id === project.id);
    const existing = cur?.loanInstallments ?? [];
    const seq: 1 | 2 = existing.length === 0 ? 1 : 2;
    const row: ProjectLoanInstallment = {
      id: generateId('li'),
      sequence: seq,
      amountInr: Math.round(project.contractAmount * 0.35),
      status: 'Pending',
    };
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id !== project.id
          ? proj
          : {
              ...proj,
              loanInstallments: [...(proj.loanInstallments ?? []), row],
              updatedAt: new Date().toISOString(),
            }
      )
    );
    bump();
    show('Installment row added', 'success');
  }

  return (
    <div className="space-y-8">
      <Card
        variant="feature"
        padding="lg"
        className={cn('space-y-6 text-sm', promoteHeroType && 'relative pr-2 pt-1')}
      >
        {promoteHeroType && <CardCornerTypeTag label={project.type} dotClass={typeDotClass} />}
        <CardHeader
          title={promoteHeroType ? projectDisplayTitleForCard(project) : project.name}
          description={
            promoteHeroType ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>{cust?.name ?? 'Customer'}</span>
                <InlineTypeTagDot label={project.type} dotClass={typeDotClass} />
              </span>
            ) : (
              `${cust?.name ?? 'Customer'} · ${project.type}`
            )
          }
        />
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted-foreground">Status</span>
            <select
              className="select-shell mt-1 block min-w-[10rem]"
              value={project.status}
              disabled={readOnly}
              onChange={(e) => patchProject({ status: e.target.value as Project['status'] })}
            >
              {PROJECT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{project.category}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Capacity</span>
            <span className="mt-1 block text-lg font-semibold text-foreground">{project.capacity} kW</span>
          </p>
          <p className="rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contract</span>
            <span className="mt-1 block text-lg font-semibold text-foreground">{formatINRDecimal(project.contractAmount)}</span>
          </p>
        </div>
        <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">EPC &amp; billing model</p>
          <p className="text-[11px] text-muted-foreground">
            Active kind: <strong className="text-foreground">{inferSolarKind(project)}</strong> · Doc tier: {epcDocTier} ·
            Legacy type: {project.type}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Solar kind</span>
              <select
                className="select-shell mt-1 w-full"
                disabled={readOnly}
                value={project.solarKind ?? inferSolarKind(project)}
                onChange={(e) => patchProject({ solarKind: e.target.value as SolarProjectKind })}
              >
                {(['SOLO_EPC', 'PARTNER_EPC', 'INC', 'FIXED_EPC', 'VENDOR_NETWORK'] as const).map((k) => (
                  <option key={k} value={k}>
                    {k.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Vendor (DISCOM / supplier)</span>
              <select
                className="select-shell mt-1 w-full"
                disabled={readOnly}
                value={project.vendorId ?? ''}
                onChange={(e) => patchProject({ vendorId: e.target.value || undefined })}
              >
                <option value="">— None —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Internal cost estimate (₹)</span>
              <input
                type="number"
                min={0}
                className="input-shell mt-1 w-full"
                disabled={readOnly}
                value={project.internalCostEstimateInr ?? ''}
                onChange={(e) =>
                  patchProject({
                    internalCostEstimateInr: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Fixed backend price (₹)</span>
              <input
                type="number"
                min={0}
                className="input-shell mt-1 w-full"
                disabled={readOnly}
                value={project.fixedBackendPriceInr ?? ''}
                onChange={(e) =>
                  patchProject({
                    fixedBackendPriceInr: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-input"
              disabled={readOnly}
              checked={!!project.createdWithoutQuotation}
              onChange={(e) => patchProject({ createdWithoutQuotation: e.target.checked })}
            />
            <span>Created without quotation</span>
          </label>
          {inferSolarKind(project) === 'PARTNER_EPC' ? (
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Partner EPC — vendor ownership</span>
              <select
                className="select-shell mt-1 w-full"
                disabled={readOnly}
                value={project.partnerEpicVendorOwnership ?? ''}
                onChange={(e) =>
                  patchProject({
                    partnerEpicVendorOwnership:
                      e.target.value === ''
                        ? undefined
                        : (e.target.value as NonNullable<Project['partnerEpicVendorOwnership']>),
                  })
                }
              >
                <option value="">—</option>
                <option value="VENDOR_OWNED_BY_US">Vendor owned by us</option>
                <option value="VENDOR_OWNED_BY_PARTNER">Vendor owned by partner</option>
              </select>
            </label>
          ) : null}
          {inferSolarKind(project) === 'FIXED_EPC' ? (
            <label className="text-sm">
              <span className="block text-xs font-medium text-muted-foreground">Fixed EPC — vendor case</span>
              <select
                className="select-shell mt-1 w-full"
                disabled={readOnly}
                value={project.fixedEpicVendor ?? ''}
                onChange={(e) =>
                  patchProject({
                    fixedEpicVendor:
                      e.target.value === ''
                        ? undefined
                        : (e.target.value as NonNullable<Project['fixedEpicVendor']>),
                  })
                }
              >
                <option value="">—</option>
                <option value="OUR_VENDOR">Our vendor</option>
                <option value="PARTNER_VENDOR">Partner vendor</option>
              </select>
            </label>
          ) : null}
          <div>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Billing rules (preview)</p>
            <ul className="mt-1 list-inside list-disc text-[11px] text-muted-foreground">
              {epcBillingLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Documentation checklist</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {epcDocChecklist.map((d) => (
                <li key={d.id} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground">
                  {d.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-3 border-t border-border/60 pt-4">
          <p>
            <span className="text-muted-foreground">Customer</span>{' '}
            <Link className="font-medium text-primary hover:underline" to={`/finance/customers/${project.customerId}`}>
              {cust?.name ?? '—'}
            </Link>
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {agent && (
              <p className="min-w-0">
                <span className="text-muted-foreground">Agent</span>{' '}
                <Link className="font-medium text-primary hover:underline" to={`/sales/agents/${agent.id}`}>
                  {agent.fullName}
                </Link>
                {agent.isProfitSharePartner && (
                  <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    Introducing partner
                  </span>
                )}
              </p>
            )}
            {linkedEnquiry && (
              <p className="min-w-0">
                <span className="text-muted-foreground">Enquiry</span>{' '}
                <Link className="font-medium text-primary hover:underline" to={`/sales/enquiries/${linkedEnquiry.id}`}>
                  {linkedEnquiry.customerName}
                </Link>
                <span className="ml-1 text-xs text-muted-foreground">
                  · {linkedEnquiry.status} · {linkedEnquiry.systemCapacity} kW
                </span>
              </p>
            )}
          </div>
          {quo && (
            <p>
              <span className="text-muted-foreground">Quotation</span>{' '}
              <Link className="font-medium text-primary hover:underline" to={`/sales/quotations/${quo.id}`}>
                {quo.reference} · {formatINRDecimal(quo.effectivePrice)}
              </Link>
            </p>
          )}
          {agent?.isProfitSharePartner && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-foreground">Introducing partner economics</p>
              {introAgentRow ? (
                <p className="mt-2 text-muted-foreground">
                  {(() => {
                    const bd = introAgentShareBreakdown(introAgentRow, project.capacity ?? 0);
                    const mode = introducerPayModeForRow(introAgentRow);
                    const coll = projectClientCollection(project.id, projectInvoices);
                    const payNote =
                      mode === 'profit_share'
                        ? coll.fullyPaid
                          ? 'Client billing for this project is fully received — profit-share payouts can proceed per policy.'
                          : coll.partial
                            ? 'Client payment is still in progress — wait before paying profit share.'
                            : 'Client payment pending on recorded invoices — wait before releasing profit share.'
                        : 'Referral (flat or per-kW) is not blocked on client collection in this prototype.';
                    const dueLine =
                      mode === 'profit_share'
                        ? `Profit share: ${introAgentRow.partnerSharePercent}% of est. gross profit (₹${introAgentRow.estimatedGrossProfitInr.toLocaleString('en-IN')}) → ₹${bd.share.toLocaleString('en-IN')} due`
                        : mode === 'referral_flat'
                          ? `Flat referral due: ₹${bd.refDue.toLocaleString('en-IN')}`
                          : `Per-kW referral due: ₹${bd.refDue.toLocaleString('en-IN')} (${project.capacity ?? 0} kW)`;
                    return (
                      <>
                        <span className="font-medium text-foreground">
                          {mode === 'profit_share' ? 'Profit share' : mode === 'referral_flat' ? 'Flat referral' : 'Per-kW referral'}
                        </span>
                        . {dueLine}. Paid ₹{bd.paid.toLocaleString('en-IN')} (P ₹{bd.profitPaid.toLocaleString('en-IN')} · R ₹
                        {bd.refPaid.toLocaleString('en-IN')}). Pending ₹{bd.pending.toLocaleString('en-IN')}.{' '}
                        <span className="block mt-1 text-xs">{payNote}</span>{' '}
                        <Link className="text-primary hover:underline" to={`/sales/agents/${agent.id}`}>
                          View on agent page
                        </Link>
                      </>
                    );
                  })()}
                </p>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No economics row yet —{' '}
                  <Link className="text-primary hover:underline" to={`/sales/agents/${agent.id}`}>
                    open agent profile
                  </Link>{' '}
                  and use <strong className="text-foreground">Track economics</strong> for this project.
                </p>
              )}
            </div>
          )}
          {isPartnerType && !readOnly && partners.length > 0 && (
            <label className="block max-w-lg text-sm">
              Primary partner
              <select
                className="select-shell mt-1 w-full"
                value={project.partnerId ?? ''}
                onChange={(e) => setPrimaryPartnerId(e.target.value)}
              >
                <option value="">— Select —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.profitSharePercent}%)
                  </option>
                ))}
              </select>
            </label>
          )}
          {isPartnerType &&
            !readOnly &&
            partners.filter((x) => x.id !== project.partnerId).length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Additional partners</p>
                <div className="mt-2 flex flex-col gap-2">
                  {partners
                    .filter((x) => x.id !== project.partnerId)
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(project.coPartnerIds ?? []).includes(p.id)}
                          onChange={() => toggleCoPartner(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                </div>
              </div>
            )}
          {isPartnerType && readOnly && partner && (
            <p>
              <span className="text-muted-foreground">Partner</span>{' '}
              <span className="font-medium text-foreground">{partner.name}</span>
              {(project.coPartnerIds ?? []).length > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · +{(project.coPartnerIds ?? []).length} more
                </span>
              )}
            </p>
          )}
          {isFeeProject && !readOnly && (
            <label className="block max-w-lg text-sm">
              Channel / OEM partner
              <select
                className="select-shell mt-1 w-full"
                value={project.channelPartnerId ?? ''}
                onChange={(e) => setChannelPartnerOnProject(e.target.value)}
              >
                <option value="">— Select —</option>
                {channelPartners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isFeeProject && readOnly && chPartner && (
            <p>
              <span className="text-muted-foreground">Channel / OEM</span>{' '}
              <span className="font-medium text-foreground">{chPartner.name}</span>
            </p>
          )}
        </div>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Site address:</strong> {project.address}
        </p>
        {!isFeeProject && (
          <div className="space-y-1 rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <p>Client payments (invoices): {formatINR(paymentsRecv)}</p>
            <p>Project expenses: {formatINR(expTotal)}</p>
            <p>Agent commission (est.): {formatINR(comm)}</p>
            {partner && project.type === 'Partner (Profit Only)' && (
              <p>
                Partner share ({partner.profitSharePercent}%): {formatINR(share2)}
              </p>
            )}
            {project.type === 'Partner with Contributions' && <p>Partner contributions: {formatINR(contrib)}</p>}
          </div>
        )}
        {!isFeeProject &&
          (project.paymentType === 'Bank Loan' ||
            project.paymentType === 'Bank Loan + Cash' ||
            (project.loanInstallments?.length ?? 0) > 0) && (
            <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-4">
              <CardHeader
                title="Loan file book"
                description="Customer bank disbursements (1st / 2nd installment). Separate from company finance loans."
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">#</th>
                      <th className="py-2 pr-2 font-medium">Amount (₹)</th>
                      <th className="py-2 pr-2 font-medium">Due</th>
                      <th className="py-2 pr-2 font-medium">Received</th>
                      <th className="py-2 pr-2 font-medium">Receipt ref</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(project.loanInstallments ?? []).map((li) => (
                      <tr key={li.id} className="border-t border-border/80">
                        <td className="py-2 pr-2">{li.sequence === 1 ? '1st' : '2nd'}</td>
                        <td className="py-2 pr-2">
                          {!readOnly ? (
                            <input
                              type="number"
                              className="w-28 rounded border px-2 py-1 tabular-nums"
                              value={li.amountInr}
                              onChange={(e) =>
                                updateLoanInstallmentRow(li.id, { amountInr: Number(e.target.value) || 0 })
                              }
                            />
                          ) : (
                            formatINRDecimal(li.amountInr)
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {!readOnly ? (
                            <input
                              type="date"
                              className="rounded border px-2 py-1"
                              value={li.dueDate ?? ''}
                              onChange={(e) => updateLoanInstallmentRow(li.id, { dueDate: e.target.value || undefined })}
                            />
                          ) : (
                            li.dueDate ?? '—'
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {!readOnly ? (
                            <input
                              type="date"
                              className="rounded border px-2 py-1"
                              value={li.receivedDate ?? ''}
                              onChange={(e) =>
                                updateLoanInstallmentRow(li.id, { receivedDate: e.target.value || undefined })
                              }
                            />
                          ) : (
                            li.receivedDate ?? '—'
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {!readOnly ? (
                            <input
                              className="w-full min-w-[6rem] rounded border px-2 py-1"
                              value={li.receiptRef ?? ''}
                              onChange={(e) =>
                                updateLoanInstallmentRow(li.id, { receiptRef: e.target.value || undefined })
                              }
                            />
                          ) : (
                            li.receiptRef ?? '—'
                          )}
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              li.status === 'Received'
                                ? 'text-success'
                                : 'text-amber-700 dark:text-amber-300'
                            }
                          >
                            {li.status}
                          </span>
                          {!readOnly && li.status === 'Pending' && (
                            <button
                              type="button"
                              className="ml-2 text-xs text-primary hover:underline"
                              onClick={() =>
                                updateLoanInstallmentRow(li.id, {
                                  status: 'Received',
                                  receivedDate: new Date().toISOString().slice(0, 10),
                                })
                              }
                            >
                              Mark received
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(project.loanInstallments ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No installment lines. Add the 1st/2nd bank release schedule.</p>
              )}
              {!readOnly && (project.loanInstallments?.length ?? 0) < 2 && (
                <ShellButton type="button" variant="secondary" onClick={addLoanInstallmentRow}>
                  Add installment row
                </ShellButton>
              )}
            </div>
          )}
        {!isFeeProject && (
          <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-4">
            <CardHeader
              title="Install locations"
              description="Roof, ground, or multiple areas — all belong to this project."
            />
            {projectSites.length === 0 ? (
              <p className="text-muted-foreground">No install locations yet. Add one from the actions below.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projectSites.map((s) => (
                  <SiteLocationCard
                    key={s.id}
                    site={s}
                    projectId={project.id}
                    highlight={highlightSiteId === s.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {!readOnly && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Link
              to={`/finance/invoices/new?projectId=${project.id}`}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              Create invoice
            </Link>
            {!isFeeProject && (
              <>
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={openBlockageBlank}>
                  Add blockage
                </button>
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setExpenseOpen(true)}>
                  Add expense
                </button>
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setIncomeOpen(true)}>
                  Record income
                </button>
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setOutsourceOpen(true)}>
                  Add outsource
                </button>
              </>
            )}
            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-sm"
              onClick={() => {
                setEditForm({
                  name: project.name,
                  address: project.address,
                  capacity: String(project.capacity),
                  status: project.status,
                });
                setEditOpen(true);
              }}
            >
              Edit details
            </button>
            {!isFeeProject && (
              <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setSiteOpen(true)}>
                Add install location
              </button>
            )}
            {!isFeeProject && project.type === 'Partner with Contributions' && (
              <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setContribOpen(true)}>
                Add partner contribution
              </button>
            )}
          </div>
        )}
      </Card>

      <div className="sticky-page-subnav -mx-1 mb-2 border-b border-border/80 bg-background/95 py-2.5 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {tabDefs.map(({ key: k, label: l }) => (
            <button
              key={k}
              type="button"
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                tab === k
                  ? 'bg-tertiary-muted text-tertiary-muted-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'timeline' && (
        <div className="space-y-8 text-sm">
          <Card variant="feature" padding="lg" className="space-y-4">
            <CardHeader
              title="Execution timeline"
              description={
                isFeeProject
                  ? 'Fee-based (OEM) project — checkpoints are informational; use project status in the card above for delivery tracking.'
                  : 'Update status, notes, and create tasks or blockages tied to each step.'
              }
            />
            <ol className="space-y-4">
              {project.progressSteps.map((s, si) => (
                <li
                  key={s.step}
                  className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm sm:border-l-4 sm:border-l-primary/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-foreground">
                      {s.step}. {s.name}{' '}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{s.status}</span>
                    </div>
                    {!readOnly && !isFeeProject && (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted"
                          to={`/hr/tasks/new?projectId=${encodeURIComponent(project.id)}&progressStep=${s.step}&progressStepName=${encodeURIComponent(s.name)}`}
                        >
                          Add task
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          onClick={() => openBlockageFromStep(si)}
                        >
                          Add blockage
                        </button>
                      </div>
                    )}
                  </div>
                  {!readOnly && !isFeeProject && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(['Pending', 'In Progress', 'Completed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            s.status === st ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                          onClick={() => updateStep(si, st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  )}
                  {s.notes && <p className="mt-2 text-xs text-muted-foreground">Notes: {s.notes}</p>}
                  {!readOnly && !isFeeProject && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="input-shell w-full text-sm"
                        rows={2}
                        placeholder="Step notes…"
                        value={notesDraft[si] !== undefined ? notesDraft[si]! : (s.notes ?? '')}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [si]: e.target.value })}
                      />
                      <ShellButton type="button" variant="secondary" size="sm" onClick={() => saveStepNotes(si)}>
                        Save notes
                      </ShellButton>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          {!isFeeProject && (
            <Card padding="lg" className="border-border/80">
              <h2 className="text-base font-semibold text-foreground">Blockages</h2>
              <p className="mt-1 text-xs text-muted-foreground">Open issues affecting delivery; link to a step when created from the timeline.</p>
              <ul className="mt-4 space-y-3">
                {project.blockages.length === 0 && <li className="text-muted-foreground">No blockages recorded.</li>}
                {project.blockages.map((b) => (
                  <li key={b.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:justify-between">
                    <div className="min-w-0 text-sm">
                      {b.title && <p className="font-medium text-foreground">{b.title}</p>}
                      <p>{b.description}</p>
                      {b.reason && <p className="text-xs text-muted-foreground">Reason: {b.reason}</p>}
                      {b.howToSolve && <p className="text-xs text-muted-foreground">How to solve: {b.howToSolve}</p>}
                      <p className="text-xs text-muted-foreground">
                        Due {b.dueDate}
                        {b.resolveByDate && ` · resolve by ${b.resolveByDate}`}
                        {(b.projectStage || b.timelineStage) &&
                          ` · ${[b.projectStage, b.timelineStage].filter(Boolean).join(' / ')}`}
                      </p>
                      {b.resolved && b.resolutionNotes && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Resolved: {b.resolutionNotes}</p>
                      )}
                    </div>
                    {!b.resolved && !readOnly && (
                      <button
                        type="button"
                        className="shrink-0 text-sm font-medium text-primary"
                        onClick={() => {
                          setResolveBlockageId(b.id);
                          setResolutionNotesDraft('');
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-8 text-sm">
          <Card variant="feature" padding="lg" className="space-y-3">
            <CardHeader
              title="Project dossier"
              description="Printable summary for records, bank, or handover. Uses your company profile where set."
            />
            <ShellButton type="button" variant="primary" disabled={pdfBusy} onClick={() => void downloadProjectDossier()}>
              {pdfBusy ? 'Building PDF…' : 'Download PDF dossier'}
            </ShellButton>
            <div
              ref={dossierRef}
              className={cn(
                'relative max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 text-left text-[13px] leading-relaxed text-neutral-900 shadow-inner dark:border-neutral-300',
                promoteDossierType && 'pr-3 pt-3'
              )}
            >
              {promoteDossierType && (
                <CardCornerTypeTag
                  label={project.type}
                  dotClass={typeDotClass}
                  className="right-3 top-3 bg-white/95 dark:bg-neutral-900/95"
                />
              )}
              <p className="text-lg font-bold">{company?.name ?? 'Company name'}</p>
              <p className="text-xs text-neutral-600">{company?.address}</p>
              <p className="mt-6 border-b border-neutral-200 pb-2 text-base font-semibold">Project execution summary</p>
              <p className="mt-2">
                <strong>Project:</strong>{' '}
                {promoteDossierType ? projectDisplayTitleForCard(project) : project.name}
              </p>
              <p>
                <strong>Customer:</strong> {cust?.name ?? '—'}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <strong>Type / status:</strong>{' '}
                {promoteDossierType ? (
                  <>
                    <InlineTypeTagDot label={project.type} dotClass={typeDotClass} />
                    <span>· {project.status}</span>
                  </>
                ) : (
                  <span>
                    {project.type} · {project.status}
                  </span>
                )}
              </p>
              <p>
                <strong>Capacity:</strong> {project.capacity} kW · <strong>Contract:</strong> {formatINRDecimal(project.contractAmount)}
              </p>
              <p>
                <strong>Address:</strong> {project.address}
              </p>
              <p className="mt-4 font-semibold">Install locations</p>
              <ul className="list-disc pl-5">
                {projectSites.length === 0 && <li>None listed</li>}
                {projectSites.map((s) => (
                  <li key={s.id}>
                    {s.name} — {s.address} ({s.photos.length} photos)
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-semibold">7-step progress</p>
              <table className="mt-2 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="py-1 text-left">Step</th>
                    <th className="py-1 text-left">Name</th>
                    <th className="py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {project.progressSteps.map((st) => (
                    <tr key={st.step} className="border-b border-neutral-100">
                      <td className="py-1">{st.step}</td>
                      <td className="py-1">{st.name}</td>
                      <td className="py-1">{st.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 font-semibold">Open blockages</p>
              <ul className="list-disc pl-5">
                {project.blockages.filter((b) => !b.resolved).length === 0 && <li>None</li>}
                {project.blockages
                  .filter((b) => !b.resolved)
                  .map((b) => (
                    <li key={b.id}>{b.title ?? b.description}</li>
                  ))}
              </ul>
              <p className="mt-4 font-semibold">Invoices</p>
              <ul className="list-disc pl-5">
                {projectInvoices.length === 0 && <li>None</li>}
                {projectInvoices.map((inv) => (
                  <li key={inv.id}>
                    {inv.invoiceNumber} — {inv.status} — {formatINRDecimal(inv.total)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[10px] text-neutral-500">Generated {new Date().toLocaleString()} · MMS prototype dossier</p>
            </div>
          </Card>

          <Card variant="feature" padding="lg" className="space-y-4">
            <CardHeader
              title="Project files"
              description="Categories for handover and site evidence. Uploads and versioning will connect here in a later release."
            />
            <ul className="divide-y divide-border/60 rounded-lg border border-border/80 bg-muted/10">
              {[
                { label: 'Dossier', note: 'Use the PDF above for the compiled execution summary.' },
                { label: 'Handover pack', note: 'Checklists, warranties, and as-built notes (placeholder).' },
                { label: 'Site photos', note: 'Links to install-location galleries (placeholder).' },
              ].map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.note}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">—</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" className="border-dashed border-border/80">
            <h3 className="text-sm font-semibold text-foreground">Generate documents</h3>
            <p className="mt-1 text-xs text-muted-foreground">One-click exports you choose will appear here.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Handover PDF', 'Site photo sheet', 'Material reconciliation'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  title="Coming next"
                  className="cursor-not-allowed rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  Generate {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-4 text-sm">
          {!readOnly && (
            <Link
              to={`/hr/tasks/new?projectId=${project.id}`}
              className="inline-block rounded-lg bg-primary px-3 py-2 text-primary-foreground"
            >
              Add task or ticket
            </Link>
          )}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Tasks</h2>
            <ul className="mt-2 space-y-2">
              {projectTasksOnly.map((t) => (
                <li key={t.id}>
                  <Link to={`/hr/tasks/${t.id}`} className="text-primary hover:underline">
                    {t.title}
                  </Link>{' '}
                  — {t.status}
                  {t.progressStep != null && (
                    <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Step {t.progressStep}</span>
                  )}
                  {t.taskType && <span className="text-xs text-muted-foreground"> · {t.taskType}</span>}
                </li>
              ))}
              {projectTasksOnly.length === 0 && <li className="text-muted-foreground">No tasks</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Tickets (post-completion)</h2>
            <ul className="mt-2 space-y-2">
              {projectTickets.map((t) => (
                <li key={t.id}>
                  <Link to={`/hr/tasks/${t.id}`} className="text-primary hover:underline">
                    {t.title}
                  </Link>{' '}
                  — {t.status}
                </li>
              ))}
              {projectTickets.length === 0 && <li className="text-muted-foreground">No tickets</li>}
            </ul>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Project timeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {projectEvents.slice(0, 100).map((e, i) => (
              <li key={i} className="flex gap-3 border-b border-border py-2">
                <span className="w-36 shrink-0 text-muted-foreground">{e.t.slice(0, 10)}</span>
                <span>{e.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'financials' && (
        <div className="space-y-4">
          <div className="sticky-page-subnav -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 py-2.5 pb-2 text-sm backdrop-blur-sm">
            {finTabDefs.map(({ key: k, label: l }) => (
              <button
                key={k}
                type="button"
                className={`rounded-full px-3 py-1 ${finView === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFinView(k)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-3">
            {finView === 'summary' && (
              <>
                <p>Client payments (invoices): {formatINR(paymentsRecv)}</p>
                <p>Project expenses (loaded): {formatINR(expTotal)}</p>
                <p>Agent commission (est.): {formatINR(comm)}</p>
                {partner && project.type === 'Partner (Profit Only)' && (
                  <p>
                    Partner share ({partner.profitSharePercent}%): {formatINR(share2)}
                  </p>
                )}
                {project.type === 'Partner with Contributions' && (
                  <p>Partner contributions value: {formatINR(contrib)}</p>
                )}
              </>
            )}
            {finView === 'payments' && (
              <ul className="space-y-3">
                {projectInvoices.map((inv) => (
                  <li key={inv.id} className="rounded border border-border p-2">
                    <Link to={`/finance/invoices/${inv.id}`} className="font-medium text-primary">
                      {inv.invoiceNumber}
                    </Link>{' '}
                    — {inv.status} — total {formatINRDecimal(inv.total)} · balance {formatINRDecimal(inv.balance)}
                    <ul className="mt-1 text-xs text-muted-foreground">
                      {payments
                        .filter((p) => p.invoiceId === inv.id)
                        .map((p) => (
                          <li key={p.id}>
                            {p.date}: {formatINRDecimal(p.amount)} ({p.mode})
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
                {projectInvoices.length === 0 && <li className="text-muted-foreground">No invoices for this project.</li>}
              </ul>
            )}
            {finView === 'expenses' && (
              <ul className="space-y-1">
                {projCompanyExps.map((e) => (
                  <li key={e.id}>
                    {e.date} · {e.category}: {formatINRDecimal(e.amount)} — {e.notes}
                  </li>
                ))}
                {projCompanyExps.length === 0 && <li className="text-muted-foreground">No expenses.</li>}
              </ul>
            )}
            {finView === 'partner' && (
              <div className="space-y-2">
                <p>Agent commission (est.): {formatINR(comm)}</p>
                {partner && (
                  <>
                    <p>Partner: {partner.name}</p>
                    {project.type === 'Partner (Profit Only)' && (
                      <p>
                        Profit share ({partner.profitSharePercent}%): {formatINR(share2)}
                      </p>
                    )}
                    {project.type === 'Partner with Contributions' && (
                      <div>
                        <p>Contributions total: {formatINR(contrib)}</p>
                        <p className="text-xs text-muted-foreground">
                          Labor entries: {project.partnerContributions?.labor?.length ?? 0} · Material entries:{' '}
                          {project.partnerContributions?.materials?.length ?? 0}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {!partner && <p className="text-muted-foreground">No partner on this project.</p>}
              </div>
            )}
            {finView === 'food' && (
              <ul className="space-y-1">
                {projCompanyExps
                  .filter(
                    (e) =>
                      e.category.toLowerCase().includes('food') ||
                      (e.subCategory ?? '').toLowerCase().includes('food')
                  )
                  .map((e) => (
                    <li key={e.id}>
                      {e.date} · {e.category}: {formatINRDecimal(e.amount)}
                    </li>
                  ))}
                {projCompanyExps.filter(
                  (e) =>
                    e.category.toLowerCase().includes('food') ||
                    (e.subCategory ?? '').toLowerCase().includes('food')
                ).length === 0 && <li className="text-muted-foreground">No food-tagged expenses.</li>}
              </ul>
            )}
            {finView === 'channel' && (
              <div className="space-y-2">
                {chPartner ? (
                  <p>
                    <Link
                      to={`/finance/channel-partners/${chPartner.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {chPartner.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {' '}
                      · {chPartner.feeStructure} ₹{chPartner.feeAmount}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">No channel partner linked to this project.</p>
                )}
                <ul className="space-y-1">
                  {projectChannelFees.map((f) => (
                    <li key={f.id}>
                      {f.date}: {formatINRDecimal(f.amount)} — {f.notes}
                    </li>
                  ))}
                </ul>
                {projectChannelFees.length === 0 && (
                  <p className="text-xs text-muted-foreground">No channel fee entries for this project.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'materials' && (
        <div className="space-y-4 text-sm">
          {!readOnly && (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => setTransferOpen(true)}
            >
              Transfer material
            </button>
          )}
          <div>
            <h3 className="font-medium text-foreground">Materials sent (project log)</h3>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {(project.materialsSent ?? []).map((row) => (
                <li key={row.id}>
                  {materials.find((m) => m.id === row.materialId)?.name ?? row.materialId}: {row.quantity} · {row.date}
                  {row.siteId ? ` · site ${row.siteId}` : ''}
                </li>
              ))}
              {(project.materialsSent ?? []).length === 0 && <li className="text-xs">No dispatch lines yet (transfer from warehouse to add).</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Warehouse transfers (movements)</h3>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {projectTransfers.map((t) => (
                <li key={t.id}>
                  {materials.find((m) => m.id === t.materialId)?.name}: {t.quantityInIssueUnit} (issue u.) · deduct{' '}
                  {t.quantityDeductedPurchase.toFixed(3)} purchase u. · {t.date}
                </li>
              ))}
              {projectTransfers.length === 0 && <li className="text-xs">No transfers.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Returns & damage</h3>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {projectReturns.map((r) => (
                <li key={r.id}>
                  {materials.find((m) => m.id === r.materialId)?.name}: {r.quantityInIssueUnit} · {r.action}
                  {r.damageReason ? ` — ${r.damageReason}` : r.conditionNotes ? ` — ${r.conditionNotes}` : ''} · {r.date}
                </li>
              ))}
              {projectReturns.length === 0 && (
                <li className="text-xs">Record returns or scrap from Inventory → material detail.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === 'att' && (
        <ul className="text-sm">
          {attendance
            .filter((a) => {
              const ids = a.siteIds?.length ? a.siteIds : a.siteId ? [a.siteId] : [];
              return ids.some((sid) => projectSites.some((s) => s.id === sid));
            })
            .map((a) => (
              <li key={a.date + a.employeeId}>
                {a.date}: {users.find((u) => u.id === a.employeeId)?.name} — {a.status}
              </li>
            ))}
        </ul>
      )}

      <Modal
        open={blockOpen}
        title="Add blockage"
        onClose={() => {
          setBlockOpen(false);
          setBlk({ ...EMPTY_BLK });
        }}
        wide
      >
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <label className="sm:col-span-2">
            Title (short)
            <input
              className="input-shell mt-1 w-full"
              value={blk.title}
              onChange={(e) => setBlk({ ...blk, title: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            Description *
            <textarea
              className="input-shell mt-1 min-h-[4rem] w-full"
              rows={2}
              value={blk.description}
              onChange={(e) => setBlk({ ...blk, description: e.target.value })}
            />
          </label>
          <label>
            Reason
            <input className="input-shell mt-1 w-full" value={blk.reason} onChange={(e) => setBlk({ ...blk, reason: e.target.value })} />
          </label>
          <label>
            How to solve
            <input
              className="input-shell mt-1 w-full"
              value={blk.howToSolve}
              onChange={(e) => setBlk({ ...blk, howToSolve: e.target.value })}
            />
          </label>
          <label>
            Resolve-by date
            <input
              type="date"
              className="input-shell mt-1 w-full"
              value={blk.resolveByDate}
              onChange={(e) => setBlk({ ...blk, resolveByDate: e.target.value })}
            />
          </label>
          <label>
            Project stage label
            <input
              className="input-shell mt-1 w-full"
              value={blk.projectStage}
              onChange={(e) => setBlk({ ...blk, projectStage: e.target.value })}
            />
          </label>
          <label>
            Timeline stage label
            <input
              className="input-shell mt-1 w-full"
              value={blk.timelineStage}
              onChange={(e) => setBlk({ ...blk, timelineStage: e.target.value })}
            />
          </label>
          <select
            className="select-shell w-full sm:col-span-2"
            value={blk.assignedTo}
            onChange={(e) => setBlk({ ...blk, assignedTo: e.target.value })}
          >
            <option value="">Assign to *</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <label className="sm:col-span-2">
            Due date *
            <input
              type="date"
              className="input-shell mt-1 w-full"
              value={blk.dueDate}
              onChange={(e) => setBlk({ ...blk, dueDate: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="sm:col-span-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={addBlockage}
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(resolveBlockageId)}
        title="Resolve blockage"
        onClose={() => {
          setResolveBlockageId(null);
          setResolutionNotesDraft('');
        }}
      >
        <p className="mb-2 text-sm text-muted-foreground">Optional notes are stored on the blockage record.</p>
        <textarea
          className="input-shell mb-3 min-h-[4rem] w-full text-sm"
          placeholder="Resolution notes (optional)"
          value={resolutionNotesDraft}
          onChange={(e) => setResolutionNotesDraft(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <ShellButton
            type="button"
            variant="secondary"
            onClick={() => {
              setResolveBlockageId(null);
              setResolutionNotesDraft('');
            }}
          >
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={confirmResolveBlockage}>
            Mark resolved
          </ShellButton>
        </div>
      </Modal>

      <UnifiedExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        defaultProjectId={project.id}
        currentUserId={users[0]?.id ?? 'system'}
        currentUserName={users[0]?.name ?? 'User'}
      />
      <UnifiedIncomeModal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        defaultProjectId={project.id}
        currentUserId={users[0]?.id ?? 'system'}
        currentUserName={users[0]?.name ?? 'User'}
      />

      <Modal open={outsourceOpen} title="Add outsource work" onClose={() => setOutsourceOpen(false)}>
        <form className="space-y-2" onSubmit={saveOutsource}>
          <input
            className="input-shell w-full"
            placeholder="Type (JCB, Crane, …)"
            value={outForm.type}
            onChange={(e) => setOutForm({ ...outForm, type: e.target.value })}
          />
          <input
            type="number"
            className="input-shell w-full"
            placeholder="Quantity"
            value={outForm.quantity}
            onChange={(e) => setOutForm({ ...outForm, quantity: e.target.value })}
          />
          <input
            type="number"
            className="input-shell w-full"
            placeholder="Cost"
            value={outForm.cost}
            onChange={(e) => setOutForm({ ...outForm, cost: e.target.value })}
          />
          <input
            type="date"
            className="input-shell w-full"
            value={outForm.date}
            onChange={(e) => setOutForm({ ...outForm, date: e.target.value })}
          />
          <textarea
            className="input-shell min-h-[4rem] w-full"
            rows={2}
            value={outForm.notes}
            onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })}
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>

      <Modal open={editOpen} title="Edit project" onClose={() => setEditOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={saveProjectEdit}>
          <input
            className="input-shell sm:col-span-2 w-full"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <textarea
            className="input-shell sm:col-span-2 min-h-[4rem] w-full"
            rows={2}
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <input
            type="number"
            className="input-shell w-full"
            placeholder="Capacity kW"
            value={editForm.capacity}
            onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
          />
          <select
            className="select-shell w-full"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Project['status'] })}
          >
            {(['New', 'In Progress', 'Completed', 'Closed', 'On Hold'] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="sm:col-span-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>

      <Modal open={siteOpen} title="Add install location" onClose={() => setSiteOpen(false)}>
        <form className="space-y-2" onSubmit={saveNewSite}>
          <input
            className="input-shell w-full"
            placeholder="Site name"
            value={siteForm.name}
            onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
          />
          <textarea
            className="input-shell min-h-[4rem] w-full"
            placeholder="Address"
            rows={2}
            value={siteForm.address}
            onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>

      <Modal open={transferOpen} title="Transfer to project" onClose={() => setTransferOpen(false)} wide>
        <div className="space-y-2">
          <select
            className="select-shell w-full"
            value={xfer.materialId}
            onChange={(e) => setXfer({ ...xfer, materialId: e.target.value })}
          >
            <option value="">Material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (stock {m.currentStock} {m.purchaseUnit})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={`Qty in issue unit`}
            className="input-shell w-full"
            value={xfer.qty}
            onChange={(e) => setXfer({ ...xfer, qty: e.target.value })}
          />
          <select
            className="select-shell w-full"
            value={xfer.siteId}
            onChange={(e) => setXfer({ ...xfer, siteId: e.target.value })}
          >
            <option value="">Site (optional)</option>
            {projectSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={transferMaterial}>
            Transfer
          </button>
        </div>
      </Modal>

      <Modal open={contribOpen} title="Partner contribution" onClose={() => setContribOpen(false)} wide>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border p-3 sm:col-span-1">
            <h3 className="font-semibold text-foreground">Labor</h3>
            <input
              className="input-shell w-full"
              placeholder="Description"
              value={contribLabor.description}
              onChange={(e) => setContribLabor({ ...contribLabor, description: e.target.value })}
            />
            <input
              type="number"
              className="input-shell w-full"
              placeholder="Hours"
              value={contribLabor.hours}
              onChange={(e) => setContribLabor({ ...contribLabor, hours: e.target.value })}
            />
            <input
              type="number"
              className="input-shell w-full"
              placeholder="Cost (₹)"
              value={contribLabor.cost}
              onChange={(e) => setContribLabor({ ...contribLabor, cost: e.target.value })}
            />
            <input
              type="date"
              className="input-shell w-full"
              value={contribLabor.date}
              onChange={(e) => setContribLabor({ ...contribLabor, date: e.target.value })}
            />
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={saveLaborContribution}>
              Save labor
            </button>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-3 sm:col-span-1">
            <h3 className="font-semibold text-foreground">Materials</h3>
            <select
              className="select-shell w-full"
              value={contribMat.materialId}
              onChange={(e) => setContribMat({ ...contribMat, materialId: e.target.value })}
            >
              <option value="">Material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="input-shell w-full"
              placeholder="Quantity"
              value={contribMat.quantity}
              onChange={(e) => setContribMat({ ...contribMat, quantity: e.target.value })}
            />
            <input
              type="number"
              className="input-shell w-full"
              placeholder="Cost (₹)"
              value={contribMat.cost}
              onChange={(e) => setContribMat({ ...contribMat, cost: e.target.value })}
            />
            <input
              type="date"
              className="input-shell w-full"
              value={contribMat.date}
              onChange={(e) => setContribMat({ ...contribMat, date: e.target.value })}
            />
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={saveMaterialContribution}>
              Save material
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
