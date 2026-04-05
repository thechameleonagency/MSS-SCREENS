import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, DATA_TABLE_LIST_BODY_MAX_HEIGHT, dataTableClasses } from '../../components/DataTableShell';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import {
  ENQUIRY_MEETING_TASK_KINDS,
  TASK_PROJECT_ENQUIRY_PLACEHOLDER,
  type EnquiryMeetingTaskKindId,
} from '../../lib/enquiryConstants';
import { enquiryCommissionLocked } from '../../lib/enquiryProjectLock';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { IDS } from '../../lib/seedData';
import type { Agent, Enquiry, IntroducingPartnerPayMode, MasterData, Project, Quotation, Task, User } from '../../types';

function waMeUrl(phone: string, message: string): string {
  const raw = phone.replace(/\D/g, '');
  const withCc = raw.length === 10 ? `91${raw}` : raw;
  return `https://wa.me/${withCc}?text=${encodeURIComponent(message)}`;
}

type WaRecipient = {
  key: string;
  kind: 'employee' | 'agent';
  label: string;
  phone: string;
  userId?: string;
};

function buildEmployeeWaBody(u: User, enq: Enquiry, taskList: Task[]): string {
  const related = taskList.filter((t) => t.enquiryId === enq.id && t.assignedTo.includes(u.id));
  const latest = related[related.length - 1];
  const greeting = `Hello ${u.name},`;
  const taskLine = latest
    ? ` this is your latest task assigned to you — "${latest.title}". Due ${latest.dueDate}. Please save this and remember to complete it on time.`
    : ` there is activity on enquiry "${enq.customerName}"; please check your task list.`;
  return `${greeting}${taskLine}`;
}

function introducerPayModeLabel(m: IntroducingPartnerPayMode): string {
  if (m === 'profit_share') return 'Profit share (% of our gross profit)';
  if (m === 'referral_flat') return 'Flat referral (₹)';
  return 'Per-kW referral (₹/kW)';
}

function enquiryCommissionReadout(enq: Enquiry): string {
  const mode =
    enq.introducingPartnerPayMode ??
    (enq.partnerProfitSharePercent != null && enq.partnerProfitSharePercent > 0
      ? ('profit_share' as const)
      : (enq.introducingPartnerReferralPerKwInr ?? 0) > 0
        ? ('referral_per_kw' as const)
        : (enq.introducingPartnerReferralFlatInr ?? 0) > 0 || (enq.fixedDealAmountInr ?? 0) > 0
          ? ('referral_flat' as const)
          : null);
  if (!mode) return '—';
  if (mode === 'profit_share') {
    return enq.partnerProfitSharePercent != null
      ? `${enq.partnerProfitSharePercent}% of our gross profit`
      : introducerPayModeLabel(mode);
  }
  if (mode === 'referral_flat') {
    const n = enq.introducingPartnerReferralFlatInr;
    return n != null && n > 0 ? `₹${n.toLocaleString('en-IN')} (flat)` : introducerPayModeLabel(mode);
  }
  const r = enq.introducingPartnerReferralPerKwInr;
  const kw = enq.systemCapacity;
  if (r != null && r > 0) {
    return `₹${r.toLocaleString('en-IN')}/kW × ${kw} kW = ₹${Math.round(r * kw).toLocaleString('en-IN')}`;
  }
  return introducerPayModeLabel(mode);
}

function buildPartnerAgentWaBody(agent: Agent, enq: Enquiry): string {
  const budgetLine =
    enq.fixedDealAmountInr != null && enq.fixedDealAmountInr > 0
      ? `Fixed / agreed amount: ₹${enq.fixedDealAmountInr.toLocaleString('en-IN')}`
      : `Estimated budget: ₹${enq.estimatedBudget.toLocaleString('en-IN')}`;
  const shareLine =
    enq.partnerProfitSharePercent != null
      ? `Agreed profit share (of our gross profit): ${enq.partnerProfitSharePercent}%`
      : 'Agreed profit share: (to be confirmed on project)';
  return [
    `Hello ${agent.fullName},`,
    '',
    'Your new partnership enquiry has been updated in the system. Here are the details:',
    '',
    `Client: ${enq.customerName}`,
    `Phone: ${enq.phone}`,
    `Type: ${enq.type}`,
    `System capacity: ${enq.systemCapacity} kW`,
    budgetLine,
    shareLine,
    `Pipeline / status: ${enq.status} · ${enq.priority}`,
    '',
    'Payouts are made after site completion and once the client has fully paid us.',
  ].join('\n');
}

const STATUS_OPTIONS = ['New', 'Contacted', 'Converted', 'Lost'] as const;
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'] as const;
/** Fixed select width: longest option label + comfortable padding (no grow/shrink). */
const ENQ_STATUS_SELECT_W = '11.75rem';
const ENQ_PRIORITY_SELECT_W = '12.75rem';
export function EnquiryList() {
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const users = useLiveCollection<User>('users');
  const agents = useLiveCollection<Agent>('agents');
  const masterData = useLiveCollection<MasterData>('masterData');
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priorityOnly, setPriorityOnly] = useState<string>('');
  /** Quick filters from stat links (OR within statuses, AND high-only when on). */
  const [chipStatuses, setChipStatuses] = useState<Set<Enquiry['status']>>(() => new Set());
  const [chipHighOnly, setChipHighOnly] = useState(false);
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(TABLE_DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    type: 'Residential' as Enquiry['type'],
    priority: 'Medium' as Enquiry['priority'],
    systemCapacity: '5',
    estimatedBudget: '250000',
    assignedTo: '',
    sourceType: 'Direct' as Enquiry['source']['type'],
    agentId: '',
    directSource: 'Walk-in',
    referredBy: '',
    customerAddress: '',
    customerType: 'Individual' as 'Individual' | 'Company',
    followUpDate: '',
    requirements: '',
    roofType: '',
    monthlyBillAmount: '',
    pipelineStage: '',
    newAgentName: '',
    newAgentMobile: '',
    fixedDealAmountInr: '',
    partnerProfitSharePercent: '',
    stdCommissionMode: 'referral_flat' as 'referral_flat' | 'referral_per_kw',
    introReferralFlatInr: '',
    introReferralPerKwInr: '',
    partnerCommissionMode: 'profit_share' as IntroducingPartnerPayMode,
  });

  const canEdit = role !== 'Installation Team';

  const pipelineOptions = useMemo(
    () =>
      masterData
        .filter((m) => m.type === 'EnquiryPipelineStage')
        .slice()
        .sort((a, b) => a.order - b.order || a.value.localeCompare(b.value))
        .map((m) => m.value),
    [masterData]
  );

  const summary = useMemo(() => {
    return {
      total: enquiries.length,
      new: enquiries.filter((e) => e.status === 'New').length,
      contacted: enquiries.filter((e) => e.status === 'Contacted').length,
      converted: enquiries.filter((e) => e.status === 'Converted').length,
      high: enquiries.filter((e) => e.priority === 'High').length,
    };
  }, [enquiries]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enquiries.filter((e) => {
      const matchQ =
        !qq ||
        e.customerName.toLowerCase().includes(qq) ||
        e.phone.includes(q.trim()) ||
        (e.pipelineStage ?? '').toLowerCase().includes(qq);
      const matchS = !status || e.status === status;
      const matchP = !priorityOnly || e.priority === priorityOnly;
      const matchChipStatus = chipStatuses.size === 0 || chipStatuses.has(e.status);
      const matchChipHigh = !chipHighOnly || e.priority === 'High';
      return matchQ && matchS && matchP && matchChipStatus && matchChipHigh;
    });
  }, [enquiries, q, status, priorityOnly, chipStatuses, chipHighOnly]);

  useEffect(() => {
    setPage(1);
  }, [q, status, priorityOnly, chipStatuses, chipHighOnly, pageSize]);

  useEffect(() => {
    const raw = searchParams.get('prefillAgentId');
    if (!raw) return;
    const exists = agents.some((x) => x.id === raw);
    if (!exists) return;
    setForm((prev) => ({ ...prev, sourceType: 'Agent', agentId: raw }));
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('prefillAgentId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, agents]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pickedAgentForForm =
    form.sourceType === 'Agent' && form.agentId && form.agentId !== '__new__'
      ? agents.find((x) => x.id === form.agentId)
      : undefined;
  const showPartnerDealFields = Boolean(pickedAgentForForm?.isProfitSharePartner);

  function clearStatChips() {
    setChipStatuses(new Set());
    setChipHighOnly(false);
  }

  function toggleChipStatus(s: Enquiry['status']) {
    setChipStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleChipHigh() {
    setChipHighOnly((h) => !h);
  }

  function buildSource(resolvedAgentId: string): Enquiry['source'] {
    if (form.sourceType === 'Agent') {
      return { type: 'Agent', agentId: resolvedAgentId || undefined };
    }
    if (form.sourceType === 'Referral') {
      return { type: 'Referral', referredBy: form.referredBy || undefined };
    }
    return {
      type: form.sourceType,
      directSource: form.directSource,
    };
  }

  function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    let resolvedAgentId = form.agentId;
    if (form.sourceType === 'Agent') {
      if (form.agentId === '__new__') {
        if (!form.newAgentName.trim() || !form.newAgentMobile.trim()) {
          show('Enter new agent name and mobile', 'error');
          return;
        }
        const agList = getCollection<Agent>('agents');
        resolvedAgentId = generateId('agt');
        const newA: Agent = {
          id: resolvedAgentId,
          photo: '',
          fullName: form.newAgentName.trim(),
          mobile: form.newAgentMobile.replace(/\D/g, ''),
          email: '',
          rateType: 'Flat',
          rate: 0,
          address: '',
          totalCommission: 0,
          paidCommission: 0,
          createdAt: new Date().toISOString(),
        };
        setCollection('agents', [...agList, newA]);
        bump();
      }
      if (!resolvedAgentId || resolvedAgentId === '__new__') {
        show('Select an agent or create a new one', 'error');
        return;
      }
    }
    const list = getCollection<Enquiry>('enquiries');
    const item: Enquiry = {
      id: generateId('enq'),
      customerName: form.customerName,
      phone: form.phone.replace(/\D/g, '').slice(-10),
      email: form.email,
      type: form.type,
      source: buildSource(resolvedAgentId),
      priority: form.priority,
      systemCapacity: Number(form.systemCapacity) || 0,
      estimatedBudget: Number(form.estimatedBudget) || 0,
      assignedTo: form.assignedTo || (users[0]?.id ?? IDS.u4),
      customerAddress: form.customerAddress || undefined,
      customerType: form.customerType,
      followUpDate: form.followUpDate || undefined,
      requirements: form.requirements || undefined,
      roofType: form.roofType.trim() || undefined,
      monthlyBillAmount:
        form.monthlyBillAmount.trim() !== '' ? Number(form.monthlyBillAmount) || undefined : undefined,
      pipelineStage: form.pipelineStage.trim() || undefined,
      ...(form.sourceType === 'Agent' && pickedAgentForForm
        ? pickedAgentForForm.isProfitSharePartner
          ? {
              introducingPartnerPayMode: form.partnerCommissionMode,
              partnerProfitSharePercent:
                form.partnerCommissionMode === 'profit_share' && form.partnerProfitSharePercent.trim() !== ''
                  ? Number(form.partnerProfitSharePercent) || undefined
                  : undefined,
              introducingPartnerReferralFlatInr:
                form.partnerCommissionMode === 'referral_flat' && form.introReferralFlatInr.trim() !== ''
                  ? Number(form.introReferralFlatInr) || undefined
                  : undefined,
              introducingPartnerReferralPerKwInr:
                form.partnerCommissionMode === 'referral_per_kw' && form.introReferralPerKwInr.trim() !== ''
                  ? Number(form.introReferralPerKwInr) || undefined
                  : undefined,
              fixedDealAmountInr:
                form.fixedDealAmountInr.trim() !== '' ? Number(form.fixedDealAmountInr) || undefined : undefined,
            }
          : {
              introducingPartnerPayMode: form.stdCommissionMode,
              introducingPartnerReferralFlatInr:
                form.stdCommissionMode === 'referral_flat' && form.introReferralFlatInr.trim() !== ''
                  ? Number(form.introReferralFlatInr) || undefined
                  : undefined,
              introducingPartnerReferralPerKwInr:
                form.stdCommissionMode === 'referral_per_kw' && form.introReferralPerKwInr.trim() !== ''
                  ? Number(form.introReferralPerKwInr) || undefined
                  : undefined,
              partnerProfitSharePercent: undefined,
              fixedDealAmountInr: undefined,
            }
        : {
            introducingPartnerPayMode: undefined,
            introducingPartnerReferralFlatInr: undefined,
            introducingPartnerReferralPerKwInr: undefined,
            partnerProfitSharePercent: undefined,
            fixedDealAmountInr: undefined,
          }),
      notes: [],
      status: form.assignedTo ? 'Contacted' : 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('enquiries', [...list, item]);
    bump();
    setOpen(false);
    show('Enquiry created', 'success');
  }

  const statChipBtn = () =>
    cn(
      'rounded-none border-0 bg-transparent p-0 shadow-none text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    );

  const statChipInner = (active: boolean) =>
    cn(
      'inline-flex flex-col items-start border-b-2 pb-0.5',
      active
        ? 'border-foreground font-medium text-foreground'
        : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
    );

  const statChipLabel = (active: boolean) =>
    cn('text-[10px] font-normal uppercase tracking-wide', active ? 'text-foreground' : 'text-muted-foreground');

  const filtersToolbar = useMemo(() => {
    const chipsActive = chipStatuses.size > 0 || chipHighOnly;
    return (
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3">
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <input
              className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink"
              placeholder="Name, phone, or pipeline stage…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search by customer name, phone, or pipeline stage"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Status</span>
            <select
              className="select-shell h-10 shrink-0 grow-0"
              style={{ width: ENQ_STATUS_SELECT_W }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Priority</span>
            <select
              className="select-shell h-10 shrink-0 grow-0"
              style={{ width: ENQ_PRIORITY_SELECT_W }}
              value={priorityOnly}
              onChange={(e) => setPriorityOnly(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="flex flex-wrap items-baseline justify-start gap-x-4 gap-y-2 text-sm sm:justify-end"
          role="group"
          aria-label="Quick filters from totals"
        >
          <button
            type="button"
            className={statChipBtn()}
            aria-pressed={!chipsActive}
            onClick={clearStatChips}
          >
            <span className={statChipInner(!chipsActive)}>
              <span className={statChipLabel(!chipsActive)}>Total</span>
              <span className="tabular-nums text-foreground">{summary.total}</span>
            </span>
          </button>
          <button
            type="button"
            className={statChipBtn()}
            aria-pressed={chipStatuses.has('New')}
            onClick={() => toggleChipStatus('New')}
          >
            <span className={statChipInner(chipStatuses.has('New'))}>
              <span className={statChipLabel(chipStatuses.has('New'))}>New</span>
              <span className="tabular-nums text-foreground">{summary.new}</span>
            </span>
          </button>
          <button
            type="button"
            className={statChipBtn()}
            aria-pressed={chipStatuses.has('Contacted')}
            onClick={() => toggleChipStatus('Contacted')}
          >
            <span className={statChipInner(chipStatuses.has('Contacted'))}>
              <span className={statChipLabel(chipStatuses.has('Contacted'))}>Contacted</span>
              <span className="tabular-nums text-foreground">{summary.contacted}</span>
            </span>
          </button>
          <button
            type="button"
            className={statChipBtn()}
            aria-pressed={chipStatuses.has('Converted')}
            onClick={() => toggleChipStatus('Converted')}
          >
            <span className={statChipInner(chipStatuses.has('Converted'))}>
              <span className={statChipLabel(chipStatuses.has('Converted'))}>Converted</span>
              <span className="tabular-nums text-foreground">{summary.converted}</span>
            </span>
          </button>
          <button
            type="button"
            className={statChipBtn()}
            aria-pressed={chipHighOnly}
            onClick={toggleChipHigh}
          >
            <span className={statChipInner(chipHighOnly)}>
              <span className={statChipLabel(chipHighOnly)}>High priority</span>
              <span className="tabular-nums text-foreground">{summary.high}</span>
            </span>
          </button>
        </div>
      </div>
    );
  }, [q, status, priorityOnly, chipStatuses, chipHighOnly, summary]);

  usePageHeader({
    title: 'Enquiries',
    subtitle: 'Leads, follow-ups, and conversion to quotations',
    actions: canEdit ? (
      <ShellButton variant="primary" type="button" onClick={() => setOpen(true)}>
        Add enquiry
      </ShellButton>
    ) : undefined,
    filtersToolbar,
  });

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <DataTableShell bare bodyMaxHeight={DATA_TABLE_LIST_BODY_MAX_HEIGHT}>
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Priority</th>
                <th>kW</th>
                <th>Status</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((e) => (
                <tr key={e.id} className="transition hover:bg-muted/50">
                  <td className="font-medium text-foreground">{e.customerName}</td>
                  <td className="text-muted-foreground">{e.phone}</td>
                  <td className="text-muted-foreground">{e.priority}</td>
                  <td className="text-muted-foreground">{e.systemCapacity}</td>
                  <td className="text-muted-foreground">{e.status}</td>
                  <td>
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/enquiries/${e.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </Card>
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

      <Modal open={open} title="New enquiry" onClose={() => setOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitEnquiry}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Customer name *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Phone *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              className="select-shell mt-1"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Enquiry['type'] })}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Priority</span>
            <select
              className="select-shell mt-1"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Enquiry['priority'] })}
            >
              {['Low', 'Medium', 'High'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Capacity (kW)</span>
            <input
              className="input-shell mt-1"
              value={form.systemCapacity}
              onChange={(e) => setForm({ ...form, systemCapacity: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Budget (₹)</span>
            <input
              className="input-shell mt-1"
              value={form.estimatedBudget}
              onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Assign to</span>
            <select
              className="select-shell mt-1"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <input
              className="input-shell mt-1"
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Customer type</span>
            <select
              className="select-shell mt-1"
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value as 'Individual' | 'Company' })}
            >
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Follow-up date</span>
            <input
              type="date"
              className="input-shell mt-1"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Requirements</span>
            <textarea
              className="input-shell mt-1 min-h-[3rem]"
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              rows={2}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Roof type</span>
            <input
              className="input-shell mt-1"
              value={form.roofType}
              onChange={(e) => setForm({ ...form, roofType: e.target.value })}
              placeholder="e.g. RCC, sheet"
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Monthly bill (₹)</span>
            <input
              type="number"
              min={0}
              className="input-shell mt-1"
              value={form.monthlyBillAmount}
              onChange={(e) => setForm({ ...form, monthlyBillAmount: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Pipeline stage</span>
            <select
              className="select-shell mt-1"
              value={form.pipelineStage}
              onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })}
            >
              <option value="">—</option>
              {pipelineOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Source</span>
            <select
              className="select-shell mt-1"
              value={form.sourceType}
              onChange={(e) =>
                setForm({
                  ...form,
                  sourceType: e.target.value as Enquiry['source']['type'],
                  agentId: e.target.value === 'Agent' ? form.agentId : '',
                  newAgentName: e.target.value === 'Agent' ? form.newAgentName : '',
                  newAgentMobile: e.target.value === 'Agent' ? form.newAgentMobile : '',
                })
              }
            >
              <option value="Direct">Direct</option>
              <option value="Agent">Agent</option>
              <option value="Referral">Referral</option>
              <option value="Phone">Phone</option>
              <option value="WalkIn">Walk-in</option>
              <option value="Online">Online</option>
              <option value="Social">Social media</option>
            </select>
          </label>
          {form.sourceType === 'Agent' ? (
            <>
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Agent</span>
                <select
                  className="select-shell mt-1"
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="__new__">+ Create new agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </select>
              </label>
              {form.agentId === '__new__' ? (
                <>
                  <label>
                    <span className="text-xs text-muted-foreground">New agent name *</span>
                    <input
                      className="input-shell mt-1"
                      value={form.newAgentName}
                      onChange={(e) => setForm({ ...form, newAgentName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="text-xs text-muted-foreground">New agent mobile *</span>
                    <input
                      className="input-shell mt-1"
                      value={form.newAgentMobile}
                      onChange={(e) => setForm({ ...form, newAgentMobile: e.target.value })}
                    />
                  </label>
                </>
              ) : null}
            </>
          ) : form.sourceType === 'Referral' ? (
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Referred by *</span>
              <input
                required
                className="input-shell mt-1"
                value={form.referredBy}
                onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
              />
            </label>
          ) : (
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Source detail</span>
              <input
                className="input-shell mt-1"
                value={form.directSource}
                onChange={(e) => setForm({ ...form, directSource: e.target.value })}
              />
            </label>
          )}
          {form.sourceType === 'Agent' && pickedAgentForForm && !pickedAgentForForm.isProfitSharePartner ? (
            <>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Referral commission</strong> for this lead — choose{' '}
                <strong>one</strong> basis: a flat amount or ₹ per kW (stored on the enquiry and copied to quotations).
              </p>
              <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="addStdComm"
                    checked={form.stdCommissionMode === 'referral_flat'}
                    onChange={() => setForm({ ...form, stdCommissionMode: 'referral_flat' })}
                  />
                  Flat ₹
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="addStdComm"
                    checked={form.stdCommissionMode === 'referral_per_kw'}
                    onChange={() => setForm({ ...form, stdCommissionMode: 'referral_per_kw' })}
                  />
                  ₹ per kW
                </label>
              </div>
              {form.stdCommissionMode === 'referral_flat' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral amount (₹)</span>
                  <input
                    type="number"
                    min={0}
                    className="input-shell mt-1"
                    value={form.introReferralFlatInr}
                    onChange={(e) => setForm({ ...form, introReferralFlatInr: e.target.value })}
                  />
                </label>
              ) : (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral (₹ per kW)</span>
                  <input
                    type="number"
                    min={0}
                    className="input-shell mt-1"
                    value={form.introReferralPerKwInr}
                    onChange={(e) => setForm({ ...form, introReferralPerKwInr: e.target.value })}
                  />
                </label>
              )}
            </>
          ) : null}
          {showPartnerDealFields ? (
            <>
              <p className="sm:col-span-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                This agent is an <strong className="text-foreground">introducing partner</strong>. Pick{' '}
                <strong>one</strong> remuneration mode for this lead: profit share of our gross profit, a flat referral,
                or ₹ per kW.
              </p>
              <div className="sm:col-span-2 flex flex-wrap gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="addPartnerComm"
                    checked={form.partnerCommissionMode === 'profit_share'}
                    onChange={() => setForm({ ...form, partnerCommissionMode: 'profit_share' })}
                  />
                  Profit share %
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="addPartnerComm"
                    checked={form.partnerCommissionMode === 'referral_flat'}
                    onChange={() => setForm({ ...form, partnerCommissionMode: 'referral_flat' })}
                  />
                  Flat ₹
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="addPartnerComm"
                    checked={form.partnerCommissionMode === 'referral_per_kw'}
                    onChange={() => setForm({ ...form, partnerCommissionMode: 'referral_per_kw' })}
                  />
                  ₹ per kW
                </label>
              </div>
              {form.partnerCommissionMode === 'profit_share' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Partner profit share (% of our gross profit)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    className="input-shell mt-1"
                    value={form.partnerProfitSharePercent}
                    onChange={(e) => setForm({ ...form, partnerProfitSharePercent: e.target.value })}
                    placeholder="e.g. 12"
                  />
                </label>
              ) : null}
              {form.partnerCommissionMode === 'referral_flat' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral amount (₹)</span>
                  <input
                    type="number"
                    min={0}
                    className="input-shell mt-1"
                    value={form.introReferralFlatInr}
                    onChange={(e) => setForm({ ...form, introReferralFlatInr: e.target.value })}
                  />
                </label>
              ) : null}
              {form.partnerCommissionMode === 'referral_per_kw' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral (₹ per kW)</span>
                  <input
                    type="number"
                    min={0}
                    className="input-shell mt-1"
                    value={form.introReferralPerKwInr}
                    onChange={(e) => setForm({ ...form, introReferralPerKwInr: e.target.value })}
                  />
                </label>
              ) : null}
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Fixed deal amount (₹, optional)</span>
                <input
                  type="number"
                  min={0}
                  className="input-shell mt-1"
                  value={form.fixedDealAmountInr}
                  onChange={(e) => setForm({ ...form, fixedDealAmountInr: e.target.value })}
                  placeholder="If the lead has a set price"
                />
              </label>
            </>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save enquiry
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function EnquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const users = useLiveCollection<User>('users');
  const agents = useLiveCollection<Agent>('agents');
  const masterData = useLiveCollection<MasterData>('masterData');
  const tasks = useLiveCollection<Task>('tasks');
  const projects = useLiveCollection<Project>('projects');
  const quotations = useLiveCollection<Quotation>('quotations');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const foundEnq = enquiries.find((e) => e.id === id);
  const commissionLocked = useMemo(
    () => (foundEnq ? enquiryCommissionLocked(foundEnq.id, projects, quotations) : false),
    [foundEnq?.id, projects, quotations]
  );

  const pipelineOptions = useMemo(
    () =>
      masterData
        .filter((m) => m.type === 'EnquiryPipelineStage')
        .slice()
        .sort((a, b) => a.order - b.order || a.value.localeCompare(b.value))
        .map((m) => m.value),
    [masterData]
  );

  const [noteOpen, setNoteOpen] = useState(false);
  const [meetOpen, setMeetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [waSelected, setWaSelected] = useState<Set<string>>(() => new Set());
  const [waDrafts, setWaDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [noteBy, setNoteBy] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetNotes, setMeetNotes] = useState('');
  const [meetAssignees, setMeetAssignees] = useState<string[]>([]);
  const [meetKind, setMeetKind] = useState<EnquiryMeetingTaskKindId>('client_meet');
  const [editForm, setEditForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    type: 'Residential' as Enquiry['type'],
    priority: 'Medium' as Enquiry['priority'],
    systemCapacity: '',
    estimatedBudget: '',
    status: 'New' as Enquiry['status'],
    assignedTo: '',
    customerAddress: '',
    followUpDate: '',
    requirements: '',
    pipelineStage: '',
    roofType: '',
    monthlyBillAmount: '',
    customerType: 'Individual' as 'Individual' | 'Company',
    sourceType: 'Direct' as Enquiry['source']['type'],
    agentId: '',
    directSource: 'Walk-in',
    referredBy: '',
    newAgentName: '',
    newAgentMobile: '',
    fixedDealAmountInr: '',
    partnerProfitSharePercent: '',
    stdCommissionMode: 'referral_flat' as 'referral_flat' | 'referral_per_kw',
    introReferralFlatInr: '',
    introReferralPerKwInr: '',
    partnerCommissionMode: 'profit_share' as IntroducingPartnerPayMode,
  });

  const canEdit = role !== 'Installation Team';

  const waRecipients: WaRecipient[] = useMemo(() => {
    const enq = foundEnq;
    if (!enq) return [];
    const map = new Map<string, WaRecipient>();
    const assignee = users.find((u) => u.id === enq.assignedTo);
    if (assignee?.phone) {
      map.set(`emp:${assignee.id}`, {
        key: `emp:${assignee.id}`,
        kind: 'employee',
        label: `${assignee.name} (assigned)`,
        phone: assignee.phone,
        userId: assignee.id,
      });
    }
    for (const t of tasks.filter((x) => x.enquiryId === enq.id)) {
      for (const uid of t.assignedTo) {
        const u = users.find((x) => x.id === uid);
        if (u?.phone) {
          map.set(`emp:${u.id}`, {
            key: `emp:${u.id}`,
            kind: 'employee',
            label: `${u.name} (task assignee)`,
            phone: u.phone,
            userId: u.id,
          });
        }
      }
    }
    if (enq.source.type === 'Agent' && enq.source.agentId) {
      const ag = agents.find((a) => a.id === enq.source.agentId);
      const wap = (ag?.whatsappNumber || ag?.mobile || '').replace(/\D/g, '');
      if (ag && wap) {
        map.set('agent', {
          key: 'agent',
          kind: 'agent',
          label: `${ag.isProfitSharePartner ? 'Partner / ' : ''}Agent (${ag.fullName})`,
          phone: wap,
        });
      }
    }
    return [...map.values()];
  }, [foundEnq, users, agents, tasks]);

  useEffect(() => {
    if (waOpen) {
      setWaSelected(new Set(waRecipients.map((r) => r.key)));
    }
  }, [waOpen, waRecipients]);

  useEffect(() => {
    if (!waOpen || !foundEnq) return;
    setWaDrafts(() => {
      const next: Record<string, string> = {};
      for (const r of waRecipients) {
        if (r.kind === 'employee' && r.userId) {
          const u = users.find((x) => x.id === r.userId);
          next[r.key] = u ? buildEmployeeWaBody(u, foundEnq, tasks) : 'Update on your MMS enquiry.';
        } else if (r.kind === 'agent' && foundEnq.source.type === 'Agent' && foundEnq.source.agentId) {
          const ag = agents.find((x) => x.id === foundEnq.source.agentId);
          next[r.key] = ag ? buildPartnerAgentWaBody(ag, foundEnq) : 'Update on your MMS enquiry.';
        } else {
          next[r.key] = 'Update on your MMS enquiry.';
        }
      }
      return next;
    });
  }, [waOpen, foundEnq, waRecipients, users, agents, tasks]);

  const sortedMeetUsers = useMemo(() => {
    const list = [...users];
    if (meetKind === 'site_visit') {
      list.sort((a, b) => {
        const ta = a.role === 'Installation Team' ? 0 : 1;
        const tb = b.role === 'Installation Team' ? 0 : 1;
        return ta - tb || a.name.localeCompare(b.name);
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [users, meetKind]);

  const header = useMemo(() => {
    const enq = enquiries.find((e) => e.id === id);
    if (!enq) return { title: 'Enquiry', subtitle: '' };
    return {
      title: enq.customerName,
      subtitle: `${enq.status} · ${enq.priority} priority`,
      actions: (
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && (
            <>
              <ShellButton
                type="button"
                variant="secondary"
                onClick={() => {
                  const src = enq.source;
                  let agentId = '';
                  let directSource = 'Walk-in';
                  let referredBy = '';
                  const sourceType: Enquiry['source']['type'] = src.type;
                  if (src.type === 'Agent') agentId = src.agentId ?? '';
                  else if (src.type === 'Referral') referredBy = src.referredBy ?? '';
                  else if ('directSource' in src && src.directSource) directSource = src.directSource;
                  setEditForm({
                    customerName: enq.customerName,
                    phone: enq.phone,
                    email: enq.email,
                    type: enq.type,
                    priority: enq.priority,
                    systemCapacity: String(enq.systemCapacity),
                    estimatedBudget: String(enq.estimatedBudget),
                    status: enq.status,
                    assignedTo: enq.assignedTo,
                    customerAddress: enq.customerAddress ?? '',
                    followUpDate: enq.followUpDate ?? '',
                    requirements: enq.requirements ?? '',
                    pipelineStage: enq.pipelineStage ?? '',
                    roofType: enq.roofType ?? '',
                    monthlyBillAmount: enq.monthlyBillAmount != null ? String(enq.monthlyBillAmount) : '',
                    customerType: enq.customerType ?? 'Individual',
                    sourceType,
                    agentId,
                    directSource,
                    referredBy,
                    newAgentName: '',
                    newAgentMobile: '',
                    fixedDealAmountInr: enq.fixedDealAmountInr != null ? String(enq.fixedDealAmountInr) : '',
                    partnerProfitSharePercent:
                      enq.partnerProfitSharePercent != null ? String(enq.partnerProfitSharePercent) : '',
                    stdCommissionMode:
                      enq.introducingPartnerPayMode === 'referral_per_kw' ? 'referral_per_kw' : 'referral_flat',
                    introReferralFlatInr:
                      enq.introducingPartnerReferralFlatInr != null
                        ? String(enq.introducingPartnerReferralFlatInr)
                        : '',
                    introReferralPerKwInr:
                      enq.introducingPartnerReferralPerKwInr != null
                        ? String(enq.introducingPartnerReferralPerKwInr)
                        : '',
                    partnerCommissionMode: ((): IntroducingPartnerPayMode => {
                      if (enq.introducingPartnerPayMode) return enq.introducingPartnerPayMode;
                      if (enq.partnerProfitSharePercent != null && enq.partnerProfitSharePercent > 0) {
                        return 'profit_share';
                      }
                      if ((enq.introducingPartnerReferralPerKwInr ?? 0) > 0) return 'referral_per_kw';
                      return 'referral_flat';
                    })(),
                  });
                  setEditOpen(true);
                }}
              >
                Edit
              </ShellButton>
              <ShellButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setMeetKind('client_meet');
                  setMeetDate('');
                  setMeetNotes('');
                  setMeetAssignees(enq.assignedTo ? [enq.assignedTo] : users[0]?.id ? [users[0].id] : []);
                  setMeetOpen(true);
                }}
              >
                Schedule meeting
              </ShellButton>
              <ShellButton type="button" variant="secondary" onClick={() => setNoteOpen(true)}>
                Add note
              </ShellButton>
              <ShellButton type="button" variant="secondary" onClick={() => setWaOpen(true)}>
                WhatsApp
              </ShellButton>
              <ShellButton
                type="button"
                variant="primary"
                onClick={() => navigate(`/sales/quotations/new?enquiryId=${enq.id}`)}
              >
                Create quotation
              </ShellButton>
            </>
          )}
        </div>
      ),
    };
  }, [id, enquiries, canEdit, navigate, users]);
  usePageHeader(header);

  if (!foundEnq) return <p className="text-muted-foreground">Not found</p>;
  const enquiry = foundEnq;

  const pickedAgentForEdit =
    editForm.sourceType === 'Agent' && editForm.agentId && editForm.agentId !== '__new__'
      ? agents.find((x) => x.id === editForm.agentId)
      : undefined;
  const showPartnerDealFieldsEdit = Boolean(pickedAgentForEdit?.isProfitSharePartner);

  function toggleWaRecipient(key: string) {
    setWaSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openSelectedWhatsApp() {
    const sel = waRecipients.filter((r) => waSelected.has(r.key));
    if (sel.length === 0) {
      show('Select at least one recipient', 'error');
      return;
    }
    sel.forEach((r, i) => {
      const body = (waDrafts[r.key] ?? '').trim() || 'Update on your MMS enquiry.';
      window.setTimeout(() => {
        window.open(waMeUrl(r.phone, body), '_blank', 'noopener,noreferrer');
      }, i * 450);
    });
    setWaOpen(false);
    show('Opening WhatsApp for selected recipients', 'success');
  }

  function patchEnquiry(updater: (e: Enquiry) => Enquiry) {
    const list = getCollection<Enquiry>('enquiries');
    setCollection(
      'enquiries',
      list.map((x) => (x.id === enquiry.id ? updater(x) : x))
    );
    bump();
  }

  function addNoteSave() {
    if (!note.trim()) return;
    const ts = new Date().toISOString();
    const who = users[0]?.name ?? 'User';
    patchEnquiry((x) => ({
      ...x,
      notes: [
        ...x.notes,
        {
          note: note.trim(),
          text: note.trim(),
          by: noteBy.trim() || who,
          updatedBy: who,
          timestamp: ts,
          date: ts.slice(0, 10),
        },
      ],
      updatedAt: ts,
    }));
    setNote('');
    setNoteBy('');
    setNoteOpen(false);
    show('Note added', 'success');
  }

  function toggleMeetAssignee(uid: string) {
    setMeetAssignees((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }

  function saveMeeting() {
    if (!meetDate) {
      show('Pick a date', 'error');
      return;
    }
    if (meetAssignees.length === 0) {
      show('Select at least one assignee', 'error');
      return;
    }
    const preset = ENQUIRY_MEETING_TASK_KINDS.find((k) => k.id === meetKind);
    const ts = new Date().toISOString();
    const taskList = getCollection<Task>('tasks');
    const title = `${preset?.label ?? 'Meeting'}: ${enquiry.customerName}`;
    const desc = [meetNotes.trim(), `Enquiry: ${enquiry.customerName}`, `Scheduled: ${meetDate}`]
      .filter(Boolean)
      .join('\n');
    const newTask: Task = {
      id: generateId('task'),
      projectId: TASK_PROJECT_ENQUIRY_PLACEHOLDER,
      enquiryId: enquiry.id,
      title,
      description: desc,
      assignedTo: meetAssignees,
      dueDate: meetDate,
      priority: 'Medium',
      status: 'Pending',
      kind: 'Task',
      taskType: preset?.taskType ?? 'meeting',
      createdAt: ts,
      updatedAt: ts,
      comments: [],
    };
    setCollection('tasks', [...taskList, newTask]);
    patchEnquiry((x) => ({
      ...x,
      meetingDate: meetDate,
      notes: meetNotes.trim()
        ? [
            ...x.notes,
            {
              text: `Meeting scheduled ${meetDate} (${preset?.label ?? 'Meeting'}) — assigned: ${meetAssignees
                .map((uid) => users.find((u) => u.id === uid)?.name ?? uid)
                .join(', ')}. ${meetNotes.trim()}`,
              updatedBy: users[0]?.name ?? 'User',
              timestamp: ts,
            },
          ]
        : x.notes,
      updatedAt: ts,
    }));
    bump();
    setMeetOpen(false);
    setMeetNotes('');
    show('Meeting saved — task created for assignees', 'success');
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    let resolvedAgentId = editForm.agentId;
    if (editForm.sourceType === 'Agent') {
      if (editForm.agentId === '__new__') {
        if (!editForm.newAgentName.trim() || !editForm.newAgentMobile.trim()) {
          show('Enter new agent name and mobile', 'error');
          return;
        }
        const agList = getCollection<Agent>('agents');
        resolvedAgentId = generateId('agt');
        const newA: Agent = {
          id: resolvedAgentId,
          photo: '',
          fullName: editForm.newAgentName.trim(),
          mobile: editForm.newAgentMobile.replace(/\D/g, ''),
          email: '',
          rateType: 'Flat',
          rate: 0,
          address: '',
          totalCommission: 0,
          paidCommission: 0,
          createdAt: new Date().toISOString(),
        };
        setCollection('agents', [...agList, newA]);
        bump();
      }
      if (!resolvedAgentId || resolvedAgentId === '__new__') {
        show('Select an agent or create a new one', 'error');
        return;
      }
    }
    let source: Enquiry['source'];
    if (editForm.sourceType === 'Agent') {
      source = { type: 'Agent', agentId: resolvedAgentId || undefined };
    } else if (editForm.sourceType === 'Referral') {
      source = { type: 'Referral', referredBy: editForm.referredBy || undefined };
    } else {
      source = { type: editForm.sourceType, directSource: editForm.directSource };
    }
    const economicsPatch: Partial<Enquiry> = commissionLocked
      ? {}
      : editForm.sourceType === 'Agent' && pickedAgentForEdit
        ? pickedAgentForEdit.isProfitSharePartner
          ? {
              introducingPartnerPayMode: editForm.partnerCommissionMode,
              partnerProfitSharePercent:
                editForm.partnerCommissionMode === 'profit_share' && editForm.partnerProfitSharePercent.trim() !== ''
                  ? Number(editForm.partnerProfitSharePercent) || undefined
                  : undefined,
              introducingPartnerReferralFlatInr:
                editForm.partnerCommissionMode === 'referral_flat' && editForm.introReferralFlatInr.trim() !== ''
                  ? Number(editForm.introReferralFlatInr) || undefined
                  : undefined,
              introducingPartnerReferralPerKwInr:
                editForm.partnerCommissionMode === 'referral_per_kw' && editForm.introReferralPerKwInr.trim() !== ''
                  ? Number(editForm.introReferralPerKwInr) || undefined
                  : undefined,
              fixedDealAmountInr:
                editForm.fixedDealAmountInr.trim() !== ''
                  ? Number(editForm.fixedDealAmountInr) || undefined
                  : undefined,
            }
          : {
              introducingPartnerPayMode: editForm.stdCommissionMode,
              introducingPartnerReferralFlatInr:
                editForm.stdCommissionMode === 'referral_flat' && editForm.introReferralFlatInr.trim() !== ''
                  ? Number(editForm.introReferralFlatInr) || undefined
                  : undefined,
              introducingPartnerReferralPerKwInr:
                editForm.stdCommissionMode === 'referral_per_kw' && editForm.introReferralPerKwInr.trim() !== ''
                  ? Number(editForm.introReferralPerKwInr) || undefined
                  : undefined,
              partnerProfitSharePercent: undefined,
              fixedDealAmountInr: undefined,
            }
        : {
            introducingPartnerPayMode: undefined,
            introducingPartnerReferralFlatInr: undefined,
            introducingPartnerReferralPerKwInr: undefined,
            partnerProfitSharePercent: undefined,
            fixedDealAmountInr: undefined,
          };

    patchEnquiry((x) => ({
      ...x,
      customerName: editForm.customerName,
      phone: editForm.phone.replace(/\D/g, '').slice(-10),
      email: editForm.email,
      type: editForm.type,
      priority: editForm.priority,
      systemCapacity: Number(editForm.systemCapacity) || 0,
      estimatedBudget: Number(editForm.estimatedBudget) || 0,
      status: editForm.status,
      assignedTo: editForm.assignedTo || x.assignedTo,
      customerAddress: editForm.customerAddress || undefined,
      customerType: editForm.customerType,
      followUpDate: editForm.followUpDate || undefined,
      requirements: editForm.requirements || undefined,
      pipelineStage: editForm.pipelineStage.trim() || undefined,
      roofType: editForm.roofType.trim() || undefined,
      monthlyBillAmount:
        editForm.monthlyBillAmount.trim() !== ''
          ? Number(editForm.monthlyBillAmount) || undefined
          : undefined,
      ...economicsPatch,
      source,
      updatedAt: new Date().toISOString(),
    }));
    setEditOpen(false);
    show('Enquiry updated', 'success');
  }

  function setStatusQuick(next: Enquiry['status']) {
    patchEnquiry((x) => ({ ...x, status: next, updatedAt: new Date().toISOString() }));
    show(`Status → ${next}`, 'info');
  }

  const sourceSummary = (() => {
    const s = enquiry.source;
    if (s.type === 'Agent' && s.agentId) {
      return `Agent · ${agents.find((a) => a.id === s.agentId)?.fullName ?? s.agentId}`;
    }
    if (s.type === 'Referral' && s.referredBy) return `Referral · ${s.referredBy}`;
    if (s.directSource) return `${s.type} · ${s.directSource}`;
    return s.type;
  })();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-foreground">Details</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium text-foreground">{enquiry.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{enquiry.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium text-foreground">{enquiry.type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capacity</dt>
              <dd className="font-medium text-foreground">{enquiry.systemCapacity} kW</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Budget</dt>
              <dd className="font-medium text-foreground">₹{enquiry.estimatedBudget.toLocaleString('en-IN')}</dd>
            </div>
            {enquiry.fixedDealAmountInr != null && enquiry.fixedDealAmountInr > 0 && (
              <div>
                <dt className="text-muted-foreground">Fixed deal amount</dt>
                <dd className="font-medium text-foreground">₹{enquiry.fixedDealAmountInr.toLocaleString('en-IN')}</dd>
              </div>
            )}
            {enquiry.partnerProfitSharePercent != null && (
              <div>
                <dt className="text-muted-foreground">Partner profit share</dt>
                <dd className="font-medium text-foreground">{enquiry.partnerProfitSharePercent}% of our gross profit</dd>
              </div>
            )}
            {enquiry.source.type === 'Agent' && enquiry.source.agentId && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Commission basis</dt>
                <dd className="font-medium text-foreground">
                  {commissionLocked ? (
                    <span className="mr-2 text-xs font-normal text-amber-800 dark:text-amber-200">
                      Locked (project started) —
                    </span>
                  ) : null}
                  {enquiryCommissionReadout(enquiry)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Assigned</dt>
              <dd className="font-medium text-foreground">
                {users.find((u) => u.id === enquiry.assignedTo)?.name ?? enquiry.assignedTo}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Customer type</dt>
              <dd className="font-medium text-foreground">{enquiry.customerType ?? 'Individual'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium text-foreground">{sourceSummary}</dd>
            </div>
            {enquiry.customerAddress && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium text-foreground">{enquiry.customerAddress}</dd>
              </div>
            )}
            {enquiry.followUpDate && (
              <div>
                <dt className="text-muted-foreground">Follow-up</dt>
                <dd className="font-medium text-foreground">{enquiry.followUpDate}</dd>
              </div>
            )}
            {enquiry.roofType && (
              <div>
                <dt className="text-muted-foreground">Roof type</dt>
                <dd className="font-medium text-foreground">{enquiry.roofType}</dd>
              </div>
            )}
            {enquiry.monthlyBillAmount != null && enquiry.monthlyBillAmount > 0 && (
              <div>
                <dt className="text-muted-foreground">Monthly bill</dt>
                <dd className="font-medium text-foreground">₹{enquiry.monthlyBillAmount.toLocaleString('en-IN')}</dd>
              </div>
            )}
            {enquiry.pipelineStage && (
              <div>
                <dt className="text-muted-foreground">Pipeline</dt>
                <dd className="font-medium text-foreground">{enquiry.pipelineStage}</dd>
              </div>
            )}
            {enquiry.requirements && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Requirements</dt>
                <dd className="text-foreground">{enquiry.requirements}</dd>
              </div>
            )}
            {enquiry.meetingDate && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Next meeting</dt>
                <dd className="font-medium text-primary">{enquiry.meetingDate}</dd>
              </div>
            )}
          </dl>
        </Card>

        {canEdit && (
          <Card>
            <h2 className="mb-3 text-base font-semibold text-foreground">Pipeline</h2>
            <p className="mb-2 text-xs text-muted-foreground">Quick status</p>
            <div className="flex flex-wrap gap-2">
              {(['New', 'Contacted', 'Converted', 'Lost'] as const).map((s) => (
                <ShellButton
                  key={s}
                  type="button"
                  variant={enquiry.status === s ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusQuick(s)}
                >
                  {s}
                </ShellButton>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-foreground">Notes timeline</h2>
        <ul className="space-y-3 text-sm">
          {enquiry.notes.length === 0 && <li className="text-muted-foreground">No notes yet.</li>}
          {enquiry.notes.map((n, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted/80 px-3 py-2">
              <p className="text-foreground">{n.note ?? n.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Shared by {n.by ?? '—'} · Entered by {n.updatedBy} · {new Date(n.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={noteOpen} title="Add note" onClose={() => setNoteOpen(false)}>
        <label className="mb-3 block text-sm">
          <span className="text-muted-foreground">Status shared by (who provided the info)</span>
          <input className="input-shell mt-1" value={noteBy} onChange={(e) => setNoteBy(e.target.value)} placeholder="Optional" />
        </label>
        <textarea
          className="input-shell min-h-[6rem]"
          placeholder="Write an update for the timeline…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setNoteOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={addNoteSave}>
            Save note
          </ShellButton>
        </div>
      </Modal>

      <Modal open={meetOpen} title="Schedule meeting" onClose={() => setMeetOpen(false)} wide>
        <label className="block text-sm">
          <span className="text-muted-foreground">Date (due on task)</span>
          <input
            type="date"
            className="input-shell mt-1"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-muted-foreground">Meeting / task type</span>
          <select
            className="select-shell mt-1"
            value={meetKind}
            onChange={(e) => setMeetKind(e.target.value as EnquiryMeetingTaskKindId)}
          >
            {ENQUIRY_MEETING_TASK_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        {meetKind === 'site_visit' && (
          <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs text-foreground">
            Site visit: technical / installation team members are highlighted below for quicker assignment.
          </p>
        )}
        <div className="mt-3">
          <span className="text-sm text-muted-foreground">Assign to (creates one task for the group)</span>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2 text-sm">
            {sortedMeetUsers.map((u) => (
              <li key={u.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded px-1 py-0.5',
                    meetKind === 'site_visit' && u.role === 'Installation Team' && 'border border-primary/40 bg-primary/5'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={meetAssignees.includes(u.id)}
                    onChange={() => toggleMeetAssignee(u.id)}
                  />
                  <span>
                    {u.name}
                    <span className="text-muted-foreground"> · {u.role}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-muted-foreground">Agenda / notes (optional)</span>
          <textarea
            className="input-shell mt-1 min-h-[4rem]"
            value={meetNotes}
            onChange={(e) => setMeetNotes(e.target.value)}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setMeetOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={saveMeeting}>
            Save & create task
          </ShellButton>
        </div>
      </Modal>

      <Modal open={waOpen} title="Share on WhatsApp" onClose={() => setWaOpen(false)} wide>
        <p className="mb-3 text-sm text-muted-foreground">
          Select <strong className="text-foreground">employees</strong> and/or the{' '}
          <strong className="text-foreground">referring agent / partner</strong>. Messages are tailored: task-focused for
          staff, partnership summary for the agent. Each selection opens its own chat (may require allowing pop-ups).
        </p>
        {waRecipients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employee or agent WhatsApp numbers available for this enquiry.</p>
        ) : (
          <>
            <ul className="mb-4 max-h-52 space-y-2 overflow-y-auto rounded-md border border-border p-3 text-sm">
              {waRecipients.map((r) => (
                <li key={r.key}>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={waSelected.has(r.key)}
                      onChange={() => toggleWaRecipient(r.key)}
                    />
                    <span>
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.kind === 'employee' ? 'Staff message: task assignment reminder' : 'Partner message: enquiry & profit-share summary'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {waRecipients.some((r) => waSelected.has(r.key)) ? (
              <div className="mb-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Message preview (editable per recipient)</p>
                {waRecipients
                  .filter((r) => waSelected.has(r.key))
                  .map((r) => (
                    <label key={`draft-${r.key}`} className="block text-sm">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <textarea
                        className="input-shell mt-1 min-h-[5.5rem] w-full text-sm"
                        value={waDrafts[r.key] ?? ''}
                        onChange={(e) => setWaDrafts((d) => ({ ...d, [r.key]: e.target.value }))}
                        spellCheck
                      />
                    </label>
                  ))}
              </div>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <ShellButton type="button" variant="secondary" onClick={() => setWaOpen(false)}>
                Cancel
              </ShellButton>
              <ShellButton type="button" variant="primary" onClick={openSelectedWhatsApp}>
                Open WhatsApp for selected
              </ShellButton>
            </div>
          </>
        )}
      </Modal>

      <Modal open={editOpen} title="Edit enquiry" onClose={() => setEditOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveEdit}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Customer name</span>
            <input
              required
              className="input-shell mt-1"
              value={editForm.customerName}
              onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Phone</span>
            <input
              required
              className="input-shell mt-1"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              className="select-shell mt-1"
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Enquiry['type'] })}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Priority</span>
            <select
              className="select-shell mt-1"
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Enquiry['priority'] })}
            >
              {['Low', 'Medium', 'High'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Capacity (kW)</span>
            <input
              className="input-shell mt-1"
              value={editForm.systemCapacity}
              onChange={(e) => setEditForm({ ...editForm, systemCapacity: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Budget (₹)</span>
            <input
              className="input-shell mt-1"
              value={editForm.estimatedBudget}
              onChange={(e) => setEditForm({ ...editForm, estimatedBudget: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Status</span>
            <select
              className="select-shell mt-1"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Enquiry['status'] })}
            >
              {(['New', 'Contacted', 'Converted', 'Lost'] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Assign to</span>
            <select
              className="select-shell mt-1"
              value={editForm.assignedTo}
              onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Customer type</span>
            <select
              className="select-shell mt-1"
              value={editForm.customerType}
              onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value as 'Individual' | 'Company' })}
            >
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <input
              className="input-shell mt-1"
              value={editForm.customerAddress}
              onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Follow-up date</span>
            <input
              type="date"
              className="input-shell mt-1"
              value={editForm.followUpDate}
              onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Pipeline stage</span>
            <select
              className="select-shell mt-1"
              value={editForm.pipelineStage}
              onChange={(e) => setEditForm({ ...editForm, pipelineStage: e.target.value })}
            >
              <option value="">—</option>
              {pipelineOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Roof type</span>
            <input
              className="input-shell mt-1"
              value={editForm.roofType}
              onChange={(e) => setEditForm({ ...editForm, roofType: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Monthly bill (₹)</span>
            <input
              type="number"
              min={0}
              className="input-shell mt-1"
              value={editForm.monthlyBillAmount}
              onChange={(e) => setEditForm({ ...editForm, monthlyBillAmount: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Source</span>
            <select
              className="select-shell mt-1"
              value={editForm.sourceType}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  sourceType: e.target.value as Enquiry['source']['type'],
                  agentId: e.target.value === 'Agent' ? editForm.agentId : '',
                  newAgentName: e.target.value === 'Agent' ? editForm.newAgentName : '',
                  newAgentMobile: e.target.value === 'Agent' ? editForm.newAgentMobile : '',
                })
              }
            >
              <option value="Direct">Direct</option>
              <option value="Agent">Agent</option>
              <option value="Referral">Referral</option>
              <option value="Phone">Phone</option>
              <option value="WalkIn">Walk-in</option>
              <option value="Online">Online</option>
              <option value="Social">Social media</option>
            </select>
          </label>
          {editForm.sourceType === 'Agent' ? (
            <>
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Agent</span>
                <select
                  className="select-shell mt-1"
                  value={editForm.agentId}
                  onChange={(e) => setEditForm({ ...editForm, agentId: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="__new__">+ Create new agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </select>
              </label>
              {editForm.agentId === '__new__' ? (
                <>
                  <label>
                    <span className="text-xs text-muted-foreground">New agent name *</span>
                    <input
                      className="input-shell mt-1"
                      value={editForm.newAgentName}
                      onChange={(e) => setEditForm({ ...editForm, newAgentName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="text-xs text-muted-foreground">New agent mobile *</span>
                    <input
                      className="input-shell mt-1"
                      value={editForm.newAgentMobile}
                      onChange={(e) => setEditForm({ ...editForm, newAgentMobile: e.target.value })}
                    />
                  </label>
                </>
              ) : null}
            </>
          ) : editForm.sourceType === 'Referral' ? (
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Referred by *</span>
              <input
                required
                className="input-shell mt-1"
                value={editForm.referredBy}
                onChange={(e) => setEditForm({ ...editForm, referredBy: e.target.value })}
              />
            </label>
          ) : (
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Source detail</span>
              <input
                className="input-shell mt-1"
                value={editForm.directSource}
                onChange={(e) => setEditForm({ ...editForm, directSource: e.target.value })}
              />
            </label>
          )}
          {commissionLocked ? (
            <p className="sm:col-span-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-foreground">
              Project started from a quotation linked to this enquiry — <strong>commission basis cannot be changed</strong>.
            </p>
          ) : null}
          {editForm.sourceType === 'Agent' && pickedAgentForEdit && !pickedAgentForEdit.isProfitSharePartner ? (
            <>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Referral commission</strong> — one basis only.
              </p>
              <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="editStdComm"
                    disabled={commissionLocked}
                    checked={editForm.stdCommissionMode === 'referral_flat'}
                    onChange={() => setEditForm({ ...editForm, stdCommissionMode: 'referral_flat' })}
                  />
                  Flat ₹
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="editStdComm"
                    disabled={commissionLocked}
                    checked={editForm.stdCommissionMode === 'referral_per_kw'}
                    onChange={() => setEditForm({ ...editForm, stdCommissionMode: 'referral_per_kw' })}
                  />
                  ₹ per kW
                </label>
              </div>
              {editForm.stdCommissionMode === 'referral_flat' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral amount (₹)</span>
                  <input
                    type="number"
                    min={0}
                    disabled={commissionLocked}
                    className="input-shell mt-1"
                    value={editForm.introReferralFlatInr}
                    onChange={(e) => setEditForm({ ...editForm, introReferralFlatInr: e.target.value })}
                  />
                </label>
              ) : (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral (₹ per kW)</span>
                  <input
                    type="number"
                    min={0}
                    disabled={commissionLocked}
                    className="input-shell mt-1"
                    value={editForm.introReferralPerKwInr}
                    onChange={(e) => setEditForm({ ...editForm, introReferralPerKwInr: e.target.value })}
                  />
                </label>
              )}
            </>
          ) : null}
          {showPartnerDealFieldsEdit ? (
            <>
              <p className="sm:col-span-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                Introducing partner — pick <strong className="text-foreground">one</strong> mode: profit share, flat
                referral, or ₹ per kW.
              </p>
              <div className="sm:col-span-2 flex flex-wrap gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="editPartnerComm"
                    disabled={commissionLocked}
                    checked={editForm.partnerCommissionMode === 'profit_share'}
                    onChange={() => setEditForm({ ...editForm, partnerCommissionMode: 'profit_share' })}
                  />
                  Profit share %
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="editPartnerComm"
                    disabled={commissionLocked}
                    checked={editForm.partnerCommissionMode === 'referral_flat'}
                    onChange={() => setEditForm({ ...editForm, partnerCommissionMode: 'referral_flat' })}
                  />
                  Flat ₹
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="editPartnerComm"
                    disabled={commissionLocked}
                    checked={editForm.partnerCommissionMode === 'referral_per_kw'}
                    onChange={() => setEditForm({ ...editForm, partnerCommissionMode: 'referral_per_kw' })}
                  />
                  ₹ per kW
                </label>
              </div>
              {editForm.partnerCommissionMode === 'profit_share' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Partner profit share (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    disabled={commissionLocked}
                    className="input-shell mt-1"
                    value={editForm.partnerProfitSharePercent}
                    onChange={(e) => setEditForm({ ...editForm, partnerProfitSharePercent: e.target.value })}
                  />
                </label>
              ) : null}
              {editForm.partnerCommissionMode === 'referral_flat' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral amount (₹)</span>
                  <input
                    type="number"
                    min={0}
                    disabled={commissionLocked}
                    className="input-shell mt-1"
                    value={editForm.introReferralFlatInr}
                    onChange={(e) => setEditForm({ ...editForm, introReferralFlatInr: e.target.value })}
                  />
                </label>
              ) : null}
              {editForm.partnerCommissionMode === 'referral_per_kw' ? (
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Referral (₹ per kW)</span>
                  <input
                    type="number"
                    min={0}
                    disabled={commissionLocked}
                    className="input-shell mt-1"
                    value={editForm.introReferralPerKwInr}
                    onChange={(e) => setEditForm({ ...editForm, introReferralPerKwInr: e.target.value })}
                  />
                </label>
              ) : null}
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Fixed deal amount (₹, optional)</span>
                <input
                  type="number"
                  min={0}
                  disabled={commissionLocked}
                  className="input-shell mt-1"
                  value={editForm.fixedDealAmountInr}
                  onChange={(e) => setEditForm({ ...editForm, fixedDealAmountInr: e.target.value })}
                />
              </label>
            </>
          ) : null}
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Requirements</span>
            <textarea
              className="input-shell mt-1 min-h-[3rem]"
              value={editForm.requirements}
              onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
              rows={2}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save changes
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
