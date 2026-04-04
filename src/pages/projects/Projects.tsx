import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { UnifiedExpenseModal } from '../../components/UnifiedExpenseModal';
import { UnifiedIncomeModal } from '../../components/UnifiedIncomeModal';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  agentCommissionForProject,
  formatINR,
  formatINRDecimal,
  getClientPaymentsForProject,
  getProjectExpenseTotal,
  partnerContributionTotal,
  partnerProfitShareType2,
  issueToPurchaseQty,
} from '../../lib/helpers';
import {
  visibleFinSubViews,
  visibleProjectTabs,
  type FinSubViewKey,
  type ProjectDetailTabKey,
} from '../../lib/projectUi';
import { formatProgressStage } from '../../lib/progressStage';
import { exportDomToPdf } from '../../lib/pdfExport';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import type {
  Agent,
  Attendance,
  ChannelPartner,
  ChannelPartnerFee,
  CompanyExpense,
  CompanyProfile,
  Customer,
  Invoice,
  Material,
  MaterialReturn,
  MaterialTransfer,
  OutsourceWork,
  Payment,
  Project,
  Site,
  Task,
  User,
} from '../../types';

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
  const [searchParams] = useSearchParams();
  const locationsView = searchParams.get('view') === 'locations';
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');

  const pageHeader = useMemo(
    () =>
      locationsView
        ? {
            title: 'Install locations',
            subtitle: 'Every row opens the parent project with this site highlighted',
          }
        : { title: 'All projects' },
    [locationsView]
  );
  usePageHeader(pageHeader);

  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  const photoCount = (pid: string) => sites.filter((s) => s.projectId === pid).reduce((n, s) => n + s.photos.length, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/projects/timeline"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-tertiary/40 hover:bg-muted/80"
        >
          Timeline
        </Link>
        <Link
          to="/projects/active-sites"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-tertiary/40 hover:bg-muted/80"
        >
          Active sites board
        </Link>
        <Link
          to="/projects?view=locations"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-tertiary/40 hover:bg-muted/80"
        >
          Install locations
        </Link>
      </div>

      {locationsView && <InstallLocationsPanel />}

      {!locationsView && projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create a project from a confirmed quotation, or seed demo data (refresh after deploy)."
        />
      )}

      {!locationsView && projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="block">
              <Card interactive className="h-full border-border/80 transition hover:border-tertiary/30 hover:shadow-md">
                <div className="font-semibold text-foreground">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.type} · {p.status}
                </div>
                <div className="mt-1 text-xs font-medium text-tertiary">{formatProgressStage(p)}</div>
                <div className="mt-2 text-sm text-foreground">
                  {p.capacity} kW · {formatINR(p.contractAmount)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {name(p.customerId)} · {photoCount(p.id)} site photos
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared list for `/projects?view=locations` and legacy exports. */
export function InstallLocationsPanel() {
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const [pid, setPid] = useState('');

  const filtered = useMemo(() => {
    return sites.filter((s) => !pid || s.projectId === pid);
  }, [sites, pid]);

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
      <DataTableShell>
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
            {filtered.map((s) => (
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
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No locations match this filter.</p>}
    </div>
  );
}

export function SitesList() {
  usePageHeader({ title: 'Install locations' });
  return <InstallLocationsPanel />;
}

export function GlobalTimeline() {
  const projects = useLiveCollection<Project>('projects');
  const tasks = useLiveCollection<Task>('tasks');
  const events = useMemo(() => {
    const ev: { t: string; label: string; projectId: string }[] = [];
    projects.forEach((p) => {
      ev.push({ t: p.createdAt, label: `${p.name} created`, projectId: p.id });
      p.progressSteps.forEach((s) => {
        if (s.updatedAt)
          ev.push({
            t: s.updatedAt,
            label: `${p.name}: ${s.name} → ${s.status}`,
            projectId: p.id,
          });
      });
    });
    tasks.forEach((tk) => {
      ev.push({ t: tk.updatedAt, label: `Task: ${tk.title}`, projectId: tk.projectId });
    });
    return ev.sort((a, b) => b.t.localeCompare(a.t));
  }, [projects, tasks]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Global timeline</h1>
      <ul className="space-y-2 text-sm">
        {events.slice(0, 80).map((e, i) => (
          <li key={i} className="flex gap-3 border-b border-border py-2">
            <span className="w-36 shrink-0 text-muted-foreground">{e.t.slice(0, 10)}</span>
            <Link className="text-primary hover:underline" to={`/projects/${e.projectId}`}>
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteDetail() {
  const { id } = useParams();
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [photoUrl, setPhotoUrl] = useState('');
  const [blkNew, setBlkNew] = useState('');
  const foundSite = sites.find((x) => x.id === id);
  if (!foundSite) return <p>Not found</p>;
  const site = foundSite;
  const parentProject = projects.find((p) => p.id === site.projectId);
  const soloParent = parentProject?.type === 'Solo';

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

  function toggleWorkStatusItem(areaId: string, itemId: string) {
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
                    items: a.items.map((it) =>
                      it.id !== itemId ? it : { ...it, done: !it.done }
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
            Spec #08 stub — nested areas/items; photo/video and approvals can attach later.
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
                  <ul className="mt-1 space-y-1 pl-3">
                    {a.items.map((it) => (
                      <li key={it.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={it.done}
                          onChange={() => toggleWorkStatusItem(a.id, it.id)}
                        />
                        <span className={it.done ? 'text-muted-foreground line-through' : ''}>{it.title}</span>
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
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [tab, setTab] = useState<ProjectDetailTabKey>('overview');
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
  const finTabDefs = useMemo(
    () =>
      found ? visibleFinSubViews(found.type, { hasChannelPartner: Boolean(found.channelPartnerId) }) : [],
    [found]
  );

  useEffect(() => {
    if (!found) return;
    const allowed = visibleProjectTabs(found.type).map((t) => t.key);
    if (!allowed.includes(tab)) setTab('overview');
  }, [found, tab]);

  useEffect(() => {
    if (!found) return;
    const allowed = visibleFinSubViews(found.type, {
      hasChannelPartner: Boolean(found.channelPartnerId),
    }).map((t) => t.key);
    if (!allowed.includes(finView)) setFinView('summary');
  }, [found, found?.channelPartnerId, finView]);

  const projectSitesForScroll = useMemo(() => {
    if (!found) return [] as Site[];
    return sites.filter((s) => s.projectId === found.id);
  }, [found, sites]);

  useEffect(() => {
    if (!highlightSiteId || tab !== 'overview') return;
    const t = window.setTimeout(() => {
      document.getElementById(`install-site-${highlightSiteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [highlightSiteId, tab, projectSitesForScroll.length]);

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

  if (!found) return <p>Not found</p>;
  const project = found;

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
      projs.map((proj) =>
        proj.id !== project.id
          ? proj
          : {
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
            }
      )
    );
    setTransferOpen(false);
    bump();
    show('Material transferred', 'success');
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 -mx-1 mb-2 border-b border-border/80 bg-background/95 py-2.5 backdrop-blur-md">
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

      {tab === 'overview' && (
        <div className="space-y-8 text-sm">
          <Card variant="feature" padding="lg" className="space-y-3">
            <CardHeader
              title="Project summary"
              description={`${cust?.name ?? 'Customer'} · ${project.type} · ${project.status}`}
            />
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
            <p className="text-muted-foreground">
              <strong className="text-foreground">Site address:</strong> {project.address}
            </p>
          </Card>

          <Card variant="feature" padding="lg" className="space-y-4">
            <CardHeader
              title="Install locations"
              description="Roof, ground, or multiple areas — all belong to this project. Add photos and track checklist progress here."
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
          </Card>

          <Card variant="feature" padding="lg" className="space-y-4">
            <CardHeader
              title="7-step execution timeline"
              description="Update status, notes, and create tasks or blockages tied to each step."
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
                    {!readOnly && (
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
                  {!readOnly && (
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
                  {!readOnly && (
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

          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/finance/invoices/new?projectId=${project.id}`}
                className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
              >
                Create invoice
              </Link>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={openBlockageBlank}>
                Add blockage
              </button>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setExpenseOpen(true)}>
                Add expense
              </button>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setIncomeOpen(true)}>
                Record income
              </button>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setOutsourceOpen(true)}>
                Add outsource
              </button>
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5"
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
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setSiteOpen(true)}>
                Add install location
              </button>
              {project.type === 'Partner with Contributions' && (
                <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setContribOpen(true)}>
                  Add partner contribution
                </button>
              )}
            </div>
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
              className="max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 text-left text-[13px] leading-relaxed text-neutral-900 shadow-inner dark:border-neutral-300"
            >
              <p className="text-lg font-bold">{company?.name ?? 'Company name'}</p>
              <p className="text-xs text-neutral-600">{company?.address}</p>
              <p className="mt-6 border-b border-neutral-200 pb-2 text-base font-semibold">Project execution summary</p>
              <p className="mt-2">
                <strong>Project:</strong> {project.name}
              </p>
              <p>
                <strong>Customer:</strong> {cust?.name ?? '—'}
              </p>
              <p>
                <strong>Type / status:</strong> {project.type} · {project.status}
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
          <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
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
