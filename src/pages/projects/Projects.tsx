import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
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
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type {
  Agent,
  CompanyExpense,
  Customer,
  Invoice,
  Material,
  MaterialTransfer,
  OutsourceWork,
  Payment,
  Project,
  Site,
  Task,
  User,
} from '../../types';

export function ProjectsList() {
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');

  const pageHeader = useMemo(
    () => ({
      title: 'All projects',
      subtitle: 'Capacity, contract value, sites, and progress',
    }),
    []
  );
  usePageHeader(pageHeader);

  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  const photoCount = (pid: string) => sites.filter((s) => s.projectId === pid).reduce((n, s) => n + s.photos.length, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <Link key={p.id} to={`/projects/${p.id}`} className="block">
          <Card interactive className="h-full">
            <div className="font-semibold text-foreground">{p.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {p.type} · {p.status}
            </div>
            <div className="mt-2 text-sm text-foreground">
              {p.capacity} kW · {formatINR(p.contractAmount)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {name(p.customerId)} · {photoCount(p.id)} photos
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function SitesList() {
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const [pid, setPid] = useState('');

  const filtered = useMemo(() => {
    return sites.filter((s) => !pid || s.projectId === pid);
  }, [sites, pid]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sites</h1>
      <select
        className="rounded-lg border px-3 py-2 text-sm"
        value={pid}
        onChange={(e) => setPid(e.target.value)}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <ul className="space-y-2">
        {filtered.map((s) => (
          <li key={s.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <Link className="font-medium text-primary" to={`/projects/sites/${s.id}`}>
              {s.name}
            </Link>
            <div className="text-muted-foreground">{s.address}</div>
          </li>
        ))}
      </ul>
    </div>
  );
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
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const foundSite = sites.find((x) => x.id === id);
  if (!foundSite) return <p>Not found</p>;
  const site = foundSite;

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

  return (
    <div className="space-y-4">
      <Link to="/projects/sites" className="text-sm text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{site.name}</h1>
      <p className="text-sm text-muted-foreground">{site.address}</p>
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
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');
  const materials = useLiveCollection<Material>('materials');
  const agents = useLiveCollection<Agent>('agents');
  const partners = useLiveCollection<{ id: string; name: string; profitSharePercent: number }>('partners');
  const users = useLiveCollection<User>('users');
  const transfers = useLiveCollection<MaterialTransfer>('materialTransfers');
  const tasks = useLiveCollection<Task>('tasks');
  const outsourceRows = useLiveCollection<OutsourceWork>('outsourceWork');
  const companyExpsAll = useLiveCollection<CompanyExpense>('companyExpenses');
  const invoices = useLiveCollection<Invoice>('invoices');
  const payments = useLiveCollection<Payment>('payments');
  const attendance = useLiveCollection<{ employeeId: string; siteId?: string; date: string; status: string }>(
    'attendance'
  );
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [tab, setTab] = useState<
    'overview' | 'timeline' | 'progress' | 'events' | 'financials' | 'sites' | 'materials' | 'att'
  >('overview');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blk, setBlk] = useState({ description: '', assignedTo: '', dueDate: '' });
  const [transferOpen, setTransferOpen] = useState(false);
  const [xfer, setXfer] = useState({ materialId: '', qty: '', siteId: '' });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expForm, setExpForm] = useState({ category: 'Site/Project', amount: '', date: '', notes: '' });
  const [outsourceOpen, setOutsourceOpen] = useState(false);
  const [outForm, setOutForm] = useState({ type: 'JCB', quantity: '1', cost: '', date: '', notes: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', capacity: '', status: '' as Project['status'] });
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ name: '', address: '' });
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const foundProject = projects.find((x) => x.id === id);
  const readOnly = role === 'Installation Team';

  if (!foundProject) return <p>Not found</p>;
  const project = foundProject;

  const cust = customers.find((c) => c.id === project.customerId);
  const agent = project.agentId ? agents.find((a) => a.id === project.agentId) : undefined;
  const partner = project.partnerId ? partners.find((x) => x.id === project.partnerId) : undefined;
  const projectSites = sites.filter((s) => s.projectId === project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectTasksOnly = projectTasks.filter((t) => t.kind !== 'Ticket');
  const projectTickets = projectTasks.filter((t) => t.kind === 'Ticket');
  const projectOutsource = outsourceRows.filter((o) => o.projectId === project.id);
  const projCompanyExps = companyExpsAll.filter((e) => e.projectId === project.id);
  const projectInvoices = invoices.filter((i) => i.projectId === project.id);
  const projectTransfers = transfers.filter((t) => t.projectId === project.id);
  const paymentsRecv = getClientPaymentsForProject(project.id);
  const expTotal = getProjectExpenseTotal(project.id);
  const contrib = partnerContributionTotal(project);
  const share2 = partner ? partnerProfitShareType2(project, partner.profitSharePercent) : 0;
  const comm = agent ? agentCommissionForProject(agent, project.capacity) : 0;

  const projectEvents = useMemo(() => {
    const ev: { t: string; label: string }[] = [];
    project.progressSteps.forEach((s) => {
      if (s.updatedAt)
        ev.push({ t: s.updatedAt, label: `Step ${s.step} ${s.name} → ${s.status}` });
    });
    projectTasks.forEach((tk) => {
      ev.push({
        t: tk.updatedAt,
        label: `${tk.kind === 'Ticket' ? 'Ticket' : 'Task'}: ${tk.title} (${tk.status})`,
      });
    });
    projCompanyExps.forEach((e) => {
      ev.push({ t: e.createdAt, label: `Expense: ${e.category} ${formatINRDecimal(e.amount)}` });
    });
    projectOutsource.forEach((o) => {
      ev.push({ t: o.createdAt, label: `Outsource: ${o.type} ${formatINRDecimal(o.cost)}` });
    });
    projectInvoices.forEach((inv) => {
      ev.push({ t: inv.createdAt, label: `Invoice ${inv.invoiceNumber} (${inv.status})` });
    });
    projectInvoices.forEach((inv) => {
      payments
        .filter((p) => p.invoiceId === inv.id)
        .forEach((p) => {
          ev.push({ t: `${p.date}T12:00:00.000Z`, label: `Client payment ${formatINRDecimal(p.amount)}` });
        });
    });
    return ev.sort((a, b) => b.t.localeCompare(a.t));
  }, [project, projectTasks, projCompanyExps, projectOutsource, projectInvoices, payments]);

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

  function saveCompanyExpense(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(expForm.amount);
    if (amount <= 0 || !expForm.date) {
      show('Amount and date required', 'error');
      return;
    }
    const ex: CompanyExpense = {
      id: generateId('cexp'),
      category: expForm.category,
      amount,
      date: expForm.date,
      projectId: project.id,
      paidBy: users[0]?.id ?? '',
      mode: 'Bank Transfer',
      notes: expForm.notes,
      createdAt: new Date().toISOString(),
    };
    setCollection('companyExpenses', [...getCollection<CompanyExpense>('companyExpenses'), ex]);
    setExpenseOpen(false);
    setExpForm({ category: 'Site/Project', amount: '', date: '', notes: '' });
    bump();
    show('Expense recorded', 'success');
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
    if (!blk.description || !blk.assignedTo || !blk.dueDate) {
      show('Fill all fields', 'error');
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
                  description: blk.description,
                  assignedTo: blk.assignedTo,
                  dueDate: blk.dueDate,
                  resolved: false,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : proj
      )
    );
    setBlockOpen(false);
    setBlk({ description: '', assignedTo: '', dueDate: '' });
    bump();
    show('Blockage added', 'success');
  }

  function resolveBlockage(bid: string) {
    const list = getCollection<Project>('projects');
    setCollection(
      'projects',
      list.map((proj) =>
        proj.id === project.id
          ? {
              ...proj,
              blockages: proj.blockages.map((b) =>
                b.id === bid
                  ? { ...b, resolved: true, resolvedAt: new Date().toISOString() }
                  : b
              ),
            }
          : proj
      )
    );
    bump();
    show('Resolved', 'success');
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
    setTransferOpen(false);
    bump();
    show('Material transferred', 'success');
  }

  const tabs = [
    ['overview', 'Overview'],
    ['timeline', 'Timeline'],
    ['progress', 'Progress'],
    ['events', 'Events'],
    ['financials', 'Financials'],
    ['sites', 'Sites'],
    ['materials', 'Materials'],
    ['att', 'Attendance'],
  ] as const;

  return (
    <div className="space-y-4">
      <Link to="/projects" className="text-sm text-primary hover:underline">
        ← All projects
      </Link>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <div className="flex flex-wrap gap-2 border-b border-border text-sm">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={`border-b-2 px-3 py-2 ${
              tab === k ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
          <p>
            <strong>Customer:</strong> {cust?.name}
          </p>
          <p>
            <strong>Type:</strong> {project.type} · <strong>Status:</strong> {project.status}
          </p>
          <p>
            <strong>Capacity:</strong> {project.capacity} kW · <strong>Contract:</strong>{' '}
            {formatINRDecimal(project.contractAmount)}
          </p>
          <p>
            <strong>Address:</strong> {project.address}
          </p>
          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/finance/invoices/new?projectId=${project.id}`}
                className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
              >
                Create invoice
              </Link>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setBlockOpen(true)}>
                Add blockage
              </button>
              <button type="button" className="rounded-lg border px-3 py-1.5" onClick={() => setExpenseOpen(true)}>
                Add expense
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
                Add site
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">7-step progress</h2>
            <ol className="mt-3 space-y-3">
              {project.progressSteps.map((s, si) => (
                <li key={s.step} className="border-l-2 border-primary/60 pl-3 text-sm">
                  <div className="font-medium">
                    {s.step}. {s.name} — {s.status}
                  </div>
                  {!readOnly && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(['Pending', 'In Progress', 'Completed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className="rounded bg-muted px-2 py-0.5 text-xs"
                          onClick={() => updateStep(si, st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  )}
                  {s.notes && <p className="text-xs text-muted-foreground">Saved: {s.notes}</p>}
                  {!readOnly && (
                    <div className="mt-2 space-y-1">
                      <textarea
                        className="w-full rounded border px-2 py-1 text-xs"
                        rows={2}
                        placeholder="Step notes"
                        value={notesDraft[si] !== undefined ? notesDraft[si]! : (s.notes ?? '')}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [si]: e.target.value })}
                      />
                      <button
                        type="button"
                        className="rounded bg-secondary px-2 py-0.5 text-xs"
                        onClick={() => saveStepNotes(si)}
                      >
                        Save notes
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Blockages</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {project.blockages.map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span>
                    {b.description} — due {b.dueDate} {b.resolved ? '(resolved)' : ''}
                  </span>
                  {!b.resolved && !readOnly && (
                    <button type="button" className="text-primary" onClick={() => resolveBlockage(b.id)}>
                      Resolve
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
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
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
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
        </div>
      )}

      {tab === 'sites' && (
        <ul className="space-y-2 text-sm">
          {projectSites.map((s) => (
            <li key={s.id}>
              <Link className="text-primary hover:underline" to={`/projects/sites/${s.id}`}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tab === 'materials' && (
        <div className="space-y-2">
          {!readOnly && (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => setTransferOpen(true)}
            >
              Transfer material
            </button>
          )}
          <ul className="text-sm space-y-1">
            {projectTransfers.map((t) => (
              <li key={t.id}>
                {materials.find((m) => m.id === t.materialId)?.name}: {t.quantityInIssueUnit} (issue u.) · deduct{' '}
                {t.quantityDeductedPurchase.toFixed(3)} purchase u. · {t.date}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'att' && (
        <ul className="text-sm">
          {attendance
            .filter((a) => a.siteId && projectSites.some((s) => s.id === a.siteId))
            .map((a) => (
              <li key={a.date + a.employeeId}>
                {a.date}: {users.find((u) => u.id === a.employeeId)?.name} — {a.status}
              </li>
            ))}
        </ul>
      )}

      <Modal open={blockOpen} title="Add blockage" onClose={() => setBlockOpen(false)}>
        <div className="space-y-2">
          <textarea
            className="w-full rounded border px-3 py-2"
            placeholder="Description"
            value={blk.description}
            onChange={(e) => setBlk({ ...blk, description: e.target.value })}
          />
          <select
            className="w-full rounded border px-3 py-2"
            value={blk.assignedTo}
            onChange={(e) => setBlk({ ...blk, assignedTo: e.target.value })}
          >
            <option value="">Assign to</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={blk.dueDate}
            onChange={(e) => setBlk({ ...blk, dueDate: e.target.value })}
          />
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={addBlockage}>
            Save
          </button>
        </div>
      </Modal>

      <Modal open={expenseOpen} title="Add project expense" onClose={() => setExpenseOpen(false)}>
        <form className="space-y-2" onSubmit={saveCompanyExpense}>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Category"
            value={expForm.category}
            onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            placeholder="Amount"
            value={expForm.amount}
            onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
          />
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={expForm.date}
            onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
          />
          <textarea
            className="w-full rounded border px-3 py-2"
            placeholder="Notes"
            rows={2}
            value={expForm.notes}
            onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })}
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>

      <Modal open={outsourceOpen} title="Add outsource work" onClose={() => setOutsourceOpen(false)}>
        <form className="space-y-2" onSubmit={saveOutsource}>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Type (JCB, Crane, …)"
            value={outForm.type}
            onChange={(e) => setOutForm({ ...outForm, type: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            placeholder="Quantity"
            value={outForm.quantity}
            onChange={(e) => setOutForm({ ...outForm, quantity: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            placeholder="Cost"
            value={outForm.cost}
            onChange={(e) => setOutForm({ ...outForm, cost: e.target.value })}
          />
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={outForm.date}
            onChange={(e) => setOutForm({ ...outForm, date: e.target.value })}
          />
          <textarea
            className="w-full rounded border px-3 py-2"
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
            className="sm:col-span-2 rounded border px-3 py-2"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <textarea
            className="sm:col-span-2 rounded border px-3 py-2"
            rows={2}
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <input
            type="number"
            className="rounded border px-3 py-2"
            placeholder="Capacity kW"
            value={editForm.capacity}
            onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
          />
          <select
            className="rounded border px-3 py-2"
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

      <Modal open={siteOpen} title="Add site" onClose={() => setSiteOpen(false)}>
        <form className="space-y-2" onSubmit={saveNewSite}>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Site name"
            value={siteForm.name}
            onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
          />
          <textarea
            className="w-full rounded border px-3 py-2"
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
            className="w-full rounded border px-3 py-2"
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
            className="w-full rounded border px-3 py-2"
            value={xfer.qty}
            onChange={(e) => setXfer({ ...xfer, qty: e.target.value })}
          />
          <select
            className="w-full rounded border px-3 py-2"
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
    </div>
  );
}
