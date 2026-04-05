import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import { formatProgressStage } from '../../lib/progressStage';
import {
  projectDisplayTitleForCard,
  projectTypeDotClass,
  shouldPromoteProjectTypeOnListCard,
} from '../../lib/projectCardTags';
import { projectHasOpenTickets } from '../../lib/siteEligibility';
import { getCollection, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { CardCornerTypeTag, InlineTypeTagDot } from '../../components/ProjectTypeTagBadge';
import type {
  Agent,
  ChannelPartner,
  Customer,
  Invoice,
  Partner,
  Project,
  Quotation,
  Site,
  Task,
} from '../../types';

const FILTERS = [
  { key: 'fileLogin', label: 'File login' },
  { key: 'subsidyType', label: 'Subsidy' },
  { key: 'bankFileType', label: 'Bank file' },
  { key: 'loanStage', label: 'Loan stage' },
  { key: 'workStatus', label: 'Work status' },
  { key: 'discomStatus', label: 'DISCOM' },
  { key: 'paymentStatus', label: 'Payment' },
] as const;

const STATUS_OPTIONS: Project['status'][] = ['New', 'In Progress', 'On Hold', 'Completed', 'Closed'];

export function ActiveSitesPage() {
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');
  const tasks = useLiveCollection<Task>('tasks');
  const quotations = useLiveCollection<Quotation>('quotations');
  const invoices = useLiveCollection<Invoice>('invoices');
  const agents = useLiveCollection<Agent>('agents');
  const partners = useLiveCollection<Partner>('partners');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const readOnly = role === 'Installation Team';

  const [q, setQ] = useState('');
  const [filterKey, setFilterKey] = useState<string>('');
  const [filterVal, setFilterVal] = useState('');
  const [includeCompletedWithTickets, setIncludeCompletedWithTickets] = useState(false);

  const active = useMemo(() => {
    const pipeline = projects.filter((p) => p.status === 'New' || p.status === 'In Progress' || p.status === 'On Hold');
    if (!includeCompletedWithTickets) return pipeline;
    const extra = projects.filter(
      (p) =>
        (p.status === 'Completed' || p.status === 'Closed') && projectHasOpenTickets(p.id, tasks)
    );
    return [...pipeline, ...extra];
  }, [projects, tasks, includeCompletedWithTickets]);

  const filtered = useMemo(() => {
    return active.filter((p) => {
      const cust = customers.find((c) => c.id === p.customerId);
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (cust?.name.toLowerCase().includes(q.toLowerCase()) ?? false);
      if (!filterKey || !filterVal) return matchQ;
      const op = p.operational?.[filterKey as keyof NonNullable<Project['operational']>];
      return matchQ && String(op ?? '').toLowerCase().includes(filterVal.toLowerCase());
    });
  }, [active, customers, q, filterKey, filterVal]);

  usePageHeader({
    title: 'Active sites',
    subtitle: `Live execution — projects in motion with tasks, blockages, and quick links (${filtered.length} shown)`,
  });

  function setProjectStatus(projectId: string, status: Project['status']) {
    const list = getCollection<Project>('projects');
    const now = new Date().toISOString();
    setCollection(
      'projects',
      list.map((p) => (p.id === projectId ? { ...p, status, updatedAt: now } : p))
    );
    bump();
    show('Project status updated', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={includeCompletedWithTickets}
              onChange={(e) => setIncludeCompletedWithTickets(e.target.checked)}
            />
            Show completed projects with open tickets
          </label>
          <label className="block min-w-[12rem] flex-1 text-sm font-medium">
            Search
            <input className="input-shell mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Project or client" />
          </label>
          <label className="block w-full text-sm font-medium lg:w-40">
            Filter field
            <select className="select-shell mt-1 w-full" value={filterKey} onChange={(e) => setFilterKey(e.target.value)}>
              <option value="">Any</option>
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full text-sm font-medium lg:w-48">
            Contains
            <input className="input-shell mt-1" value={filterVal} onChange={(e) => setFilterVal(e.target.value)} disabled={!filterKey} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Each card is an <strong className="text-foreground">active project</strong> (and its install sites). Use project detail for full CRUD; this board is for daily stand-up.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const cust = customers.find((c) => c.id === p.customerId);
          const projectSites = sites.filter((s) => s.projectId === p.id);
          const firstSite = projectSites[0];
          const detailTo = firstSite
            ? `/projects/${p.id}?site=${encodeURIComponent(firstSite.id)}`
            : `/projects/${p.id}`;
          const quo = p.quotationId ? quotations.find((x) => x.id === p.quotationId) : undefined;
          const invs = invoices.filter((i) => i.projectId === p.id);
          const ag = p.agentId ? agents.find((a) => a.id === p.agentId) : undefined;
          const par = p.partnerId ? partners.find((x) => x.id === p.partnerId) : undefined;
          const ch = p.channelPartnerId ? channelPartners.find((x) => x.id === p.channelPartnerId) : undefined;
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const openTasks = projectTasks.filter((t) => t.status !== 'Completed').slice(0, 4);
          const openBlockages = p.blockages.filter((b) => !b.resolved).slice(0, 3);
          const done = p.progressSteps.filter((s) => s.status === 'Completed').length;
          const pct = Math.round((done / Math.max(1, p.progressSteps.length)) * 100);

          const promoteType = shouldPromoteProjectTypeOnListCard(p);
          const titleShown = projectDisplayTitleForCard(p);
          const dotClass = projectTypeDotClass(p.type);

          return (
            <Card key={p.id} padding="md" className="relative flex flex-col border-border/80 shadow-sm">
              {promoteType && <CardCornerTypeTag label={p.type} dotClass={dotClass} />}
              <div className="flex flex-wrap items-start justify-between gap-2 pr-14">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{titleShown}</h3>
                  <p className="text-sm text-muted-foreground">{cust?.name ?? 'Customer'}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {promoteType ? (
                      <>
                        <InlineTypeTagDot label={p.type} dotClass={dotClass} />
                        <span>
                          {p.capacity} kW · {projectSites.length} site(s)
                        </span>
                      </>
                    ) : (
                      <span>
                        {p.type} · {p.capacity} kW · {projectSites.length} site(s)
                      </span>
                    )}
                  </p>
                </div>
                {!readOnly ? (
                  <select
                    className="select-shell max-w-[9.5rem] shrink-0 text-xs"
                    value={p.status}
                    onChange={(e) => setProjectStatus(p.id, e.target.value as Project['status'])}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{p.status}</span>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-primary">{formatProgressStage(p)}</p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{pct}% timeline steps · {openTasks.length} open task(s)</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Contract</span>
                  <p className="font-semibold tabular-nums">{formatINRDecimal(p.contractAmount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quote</span>
                  {quo ? (
                    <Link className="block font-medium text-primary hover:underline" to={`/sales/quotations/${quo.id}`}>
                      {quo.reference}
                    </Link>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>

              {(ag || par || ch) && (
                <div className="mt-3 flex flex-wrap gap-3 border-t border-border/60 pt-3 text-xs">
                  {ag && (
                    <div className="flex items-center gap-2">
                      {ag.photo ? (
                        <img src={ag.photo} alt="" className="h-7 w-7 rounded-full border object-cover" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">A</span>
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
                      <span className="font-medium">{par.name}</span>
                    </div>
                  )}
                  {ch && (
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Channel</p>
                      <span className="font-medium">{ch.name}</span>
                    </div>
                  )}
                </div>
              )}

              {openBlockages.length > 0 && (
                <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 p-2">
                  <p className="text-[10px] font-bold uppercase text-destructive">Blockages</p>
                  <ul className="mt-1 space-y-1 text-xs text-foreground">
                    {openBlockages.map((b) => (
                      <li key={b.id} className="line-clamp-2">
                        • {b.title ?? b.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {openTasks.length > 0 && (
                <div className="mt-3 rounded-lg border border-border/80 bg-muted/30 p-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Next tasks</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {openTasks.map((t) => (
                      <li key={t.id}>
                        <Link className="text-primary hover:underline" to={`/hr/tasks/${t.id}`}>
                          {t.title}
                        </Link>
                        <span className="text-muted-foreground"> · {t.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.operational && Object.values(p.operational).some(Boolean) && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {p.operational.workStatus && <span className="mr-2">Work: {p.operational.workStatus}</span>}
                  {p.operational.paymentStatus && <span>Pay: {p.operational.paymentStatus}</span>}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
                <Link
                  to={detailTo}
                  className={cn(
                    'inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90'
                  )}
                >
                  View details
                </Link>
                {quo && (
                  <Link
                    to={`/sales/quotations/${quo.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                  >
                    Quotation
                  </Link>
                )}
                {invs.length > 0 ? (
                  invs.slice(0, 2).map((inv) => (
                    <Link
                      key={inv.id}
                      to={`/finance/invoices/${inv.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  ))
                ) : (
                  !readOnly && (
                    <Link
                      to={`/finance/invoices/new?projectId=${encodeURIComponent(p.id)}`}
                      className="inline-flex items-center justify-center rounded-md border border-dashed border-input px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Create invoice
                    </Link>
                  )
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground">No matching active projects.</p>}
    </div>
  );
}
