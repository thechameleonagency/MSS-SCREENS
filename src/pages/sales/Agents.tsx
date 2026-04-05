import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, DATA_TABLE_LIST_BODY_MAX_HEIGHT, dataTableClasses } from '../../components/DataTableShell';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { enquiryCommissionLocked, inferIntroducingPartnerModeFromEnquiry } from '../../lib/enquiryProjectLock';
import {
  introAgentShareBreakdown as shareBreakdown,
  introducerPayModeForRow,
} from '../../lib/introAgentEconomics';
import { partnerPayoutBlockedReason } from '../../lib/projectClientCollection';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import { cn } from '../../lib/utils';
import type {
  Agent,
  AgentIntroProjectEconomics,
  Enquiry,
  IntroAgentPayoutKind,
  IntroducingPartnerPayMode,
  Customer,
  Invoice,
  Project,
  Quotation,
} from '../../types';

function agentWaDigits(a: Agent): string {
  return (a.whatsappNumber || a.mobile || '').replace(/\D/g, '');
}

function introModeLabel(m: IntroducingPartnerPayMode): string {
  if (m === 'profit_share') return 'Profit share';
  if (m === 'referral_flat') return 'Flat referral';
  return 'Per-kW referral';
}

function introTermsReadout(row: AgentIntroProjectEconomics, mode: IntroducingPartnerPayMode, cap: number): string {
  if (mode === 'profit_share') return `${row.partnerSharePercent}% of est. gross profit`;
  if (mode === 'referral_flat') return `₹${(row.referralFlatInr ?? 0).toLocaleString('en-IN')} (fixed)`;
  return `₹${(row.referralPerKwInr ?? 0).toLocaleString('en-IN')} / kW × ${cap} kW`;
}

type AgentKindChip = 'sales' | 'partner';

const AGENTS_RATE_FILTER_W = '11.5rem';

export function AgentsList() {
  const agents = useLiveCollection<Agent>('agents');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rateFilter, setRateFilter] = useState<'' | Agent['rateType']>('');
  const [chipKinds, setChipKinds] = useState<Set<AgentKindChip>>(() => new Set());

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    whatsappNumber: '',
    email: '',
    rateType: 'Per kW' as Agent['rateType'],
    rate: '1000',
    address: '',
    photo: '',
    isProfitSharePartner: false,
  });

  function toggleKindChip(k: AgentKindChip) {
    setChipKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);

  const filteredAgents = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return agents.filter((a) => {
      const matchQ =
        !qq ||
        a.fullName.toLowerCase().includes(qq) ||
        a.mobile.includes(q.trim()) ||
        (a.email ?? '').toLowerCase().includes(qq) ||
        (a.whatsappNumber ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      const matchRate = !rateFilter || a.rateType === rateFilter;
      let matchKind = true;
      if (chipKinds.size > 0 && !(chipKinds.has('partner') && chipKinds.has('sales'))) {
        const isP = Boolean(a.isProfitSharePartner);
        if (chipKinds.has('partner')) matchKind = isP;
        else if (chipKinds.has('sales')) matchKind = !isP;
      }
      return matchQ && matchRate && matchKind;
    });
  }, [agents, chipKinds, q, rateFilter]);

  useEffect(() => {
    setPage(1);
  }, [filteredAgents.length, pageSize, q, rateFilter, chipKinds]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));
  const pagedAgents = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filteredAgents.slice(s, s + pageSize);
  }, [filteredAgents, page, pageSize]);

  const listTotals = useMemo(() => {
    return filteredAgents.reduce(
      (acc, a) => {
        acc.paid += a.paidCommission;
        acc.booked += a.totalCommission;
        return acc;
      },
      { paid: 0, booked: 0 }
    );
  }, [filteredAgents]);

  const summary = useMemo(() => {
    const totalComm = agents.reduce((s, a) => s + a.totalCommission, 0);
    const paid = agents.reduce((s, a) => s + a.paidCommission, 0);
    const pending = agents.reduce((s, a) => s + (a.pendingCommission ?? a.totalCommission - a.paidCommission), 0);
    const partners = agents.filter((a) => a.isProfitSharePartner).length;
    return { count: agents.length, totalComm, paid, pending, partners, standard: agents.length - partners };
  }, [agents]);

  const chipBtn = () =>
    cn(
      'rounded-none border-0 bg-transparent p-0 shadow-none text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
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

  const filtersToolbar = useMemo(
    () => (
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3">
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <input
              className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink"
              placeholder="Name, mobile, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search agents"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Rate type</span>
            <select
              className="select-shell h-10 shrink-0 grow-0"
              style={{ width: AGENTS_RATE_FILTER_W }}
              value={rateFilter}
              onChange={(e) => setRateFilter((e.target.value || '') as '' | Agent['rateType'])}
              aria-label="Filter by rate type"
            >
              <option value="">All rate types</option>
              <option value="Per kW">Per kW</option>
              <option value="Flat">Flat</option>
            </select>
          </label>
        </div>
        <div
          className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm sm:justify-end"
          role="group"
          aria-label="Filter by agent type"
        >
          <button type="button" className={chipBtn()} onClick={() => toggleKindChip('sales')}>
            <span className={chipInner(chipKinds.has('sales'))}>
              <span className={chipLab(chipKinds.has('sales'))}>Standard agent</span>
              <span className="tabular-nums text-foreground">{summary.standard}</span>
            </span>
          </button>
          <button type="button" className={chipBtn()} onClick={() => toggleKindChip('partner')}>
            <span className={chipInner(chipKinds.has('partner'))}>
              <span className={chipLab(chipKinds.has('partner'))}>Introducing partner</span>
              <span className="tabular-nums text-foreground">{summary.partners}</span>
            </span>
          </button>
        </div>
      </div>
    ),
    [chipKinds, summary.standard, summary.partners, q, rateFilter]
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Sales agents',
      subtitle: `Referral agents and introducing partners · Commission booked ₹${summary.totalComm.toLocaleString('en-IN')}`,
      actions: (
        <ShellButton variant="primary" type="button" onClick={() => setOpen(true)}>
          Add agent
        </ShellButton>
      ),
      filtersToolbar,
    }),
    [filtersToolbar, summary.totalComm]
  );
  usePageHeader(pageHeader);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Agent>('agents');
    const mob = form.mobile.replace(/\D/g, '').slice(-10);
    const wa = form.whatsappNumber.replace(/\D/g, '');
    const a: Agent = {
      id: generateId('agt'),
      photo: form.photo,
      fullName: form.fullName,
      mobile: mob,
      whatsappNumber: wa ? (wa.length === 10 ? wa : wa) : undefined,
      email: form.email,
      rateType: form.rateType,
      rate: Number(form.rate) || 0,
      address: form.address,
      totalCommission: 0,
      paidCommission: 0,
      isProfitSharePartner: form.isProfitSharePartner,
      createdAt: new Date().toISOString(),
    };
    setCollection('agents', [...list, a]);
    bump();
    setOpen(false);
    show('Agent added', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <DataTableShell bare bodyMaxHeight={DATA_TABLE_LIST_BODY_MAX_HEIGHT}>
          <div className="overflow-x-auto">
            <table className={dataTableClasses}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Mobile</th>
                  <th>WhatsApp</th>
                  <th>Email</th>
                  <th>Rate</th>
                  <th>Commission</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {pagedAgents.map((a) => (
                  <tr key={a.id} className="border-t border-border transition hover:bg-muted/50">
                    <td className="font-medium text-foreground">{a.fullName}</td>
                    <td className="text-muted-foreground">
                      {a.isProfitSharePartner ? (
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Partner</span>
                      ) : (
                        <span className="text-xs">Agent</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground">{a.mobile}</td>
                    <td className="whitespace-nowrap text-muted-foreground">{a.whatsappNumber || a.mobile || '—'}</td>
                    <td className="max-w-[10rem] truncate text-muted-foreground">{a.email || '—'}</td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      {a.isProfitSharePartner ? (
                        a.rate > 0 ? (
                          <span>
                            ₹{a.rate.toLocaleString('en-IN')} {a.rateType === 'Per kW' ? '/kW' : 'flat'}
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">Optional lead referral</span>
                          </span>
                        ) : (
                          <span>Profit share (per project)</span>
                        )
                      ) : (
                        <>
                          ₹{a.rate.toLocaleString('en-IN')} {a.rateType === 'Per kW' ? '/kW' : 'flat'}
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      ₹{a.paidCommission.toLocaleString('en-IN')} / ₹{a.totalCommission.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/agents/${a.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredAgents.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-medium text-foreground">
                    <td colSpan={6} className="py-2 text-muted-foreground">
                      Totals ({filteredAgents.length} agent{filteredAgents.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-2 tabular-nums text-muted-foreground">
                      ₹{listTotals.paid.toLocaleString('en-IN')} / ₹{listTotals.booked.toLocaleString('en-IN')}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </DataTableShell>
      </Card>
      {filteredAgents.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <TablePaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filteredAgents.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <Modal open={open} title="Add agent" onClose={() => setOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Full name *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Mobile *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">WhatsApp number</span>
            <input
              className="input-shell mt-1"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              placeholder="If different from mobile"
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
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isProfitSharePartner}
              onChange={(e) => setForm({ ...form, isProfitSharePartner: e.target.checked })}
            />
            <span className="text-sm text-foreground">Introducing partner (profit-share on our project profit only)</span>
          </label>
          {form.isProfitSharePartner ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Optional: set a per-kW or flat rate below if they also earn a separate lead/referral fee on enquiries. Project
              profit share is configured per project on their profile.
            </p>
          ) : null}
          <label>
            <span className="text-xs text-muted-foreground">Rate type</span>
            <select
              className="select-shell mt-1"
              value={form.rateType}
              onChange={(e) => setForm({ ...form, rateType: e.target.value as Agent['rateType'] })}
            >
              <option value="Per kW">Per kW</option>
              <option value="Flat">Flat</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Rate (₹)</span>
            <input className="input-shell mt-1" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <textarea
              className="input-shell mt-1 min-h-[4rem]"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Photo (stored as data URL)</span>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-muted-foreground"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setForm((prev) => ({ ...prev, photo: String(r.result ?? '') }));
                r.readAsDataURL(f);
              }}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function inferIntroducerModeFromEnquiry(e?: Enquiry): IntroducingPartnerPayMode {
  if (!e) return 'profit_share';
  return inferIntroducingPartnerModeFromEnquiry(e);
}

export function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const agents = useLiveCollection<Agent>('agents');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const projects = useLiveCollection<Project>('projects');
  const quotations = useLiveCollection<Quotation>('quotations');
  const customers = useLiveCollection<Customer>('customers');
  const economicsRows = useLiveCollection<AgentIntroProjectEconomics>('introAgentEconomics');
  const invoices = useLiveCollection<Invoice>('invoices');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const a = agents.find((x) => x.id === id);

  const commissionPipelineRollup = useMemo(() => {
    if (!id) return [];
    type Acc = {
      mode: IntroducingPartnerPayMode;
      enqCount: number;
      enqPipeline: number;
      enqConverted: number;
      quoteCount: number;
      sumFlat: number;
      sumPerKwEquiv: number;
      lockedEnquiries: number;
    };
    const map = new Map<IntroducingPartnerPayMode, Acc>();
    const touch = (mode: IntroducingPartnerPayMode): Acc => {
      if (!map.has(mode)) {
        map.set(mode, {
          mode,
          enqCount: 0,
          enqPipeline: 0,
          enqConverted: 0,
          quoteCount: 0,
          sumFlat: 0,
          sumPerKwEquiv: 0,
          lockedEnquiries: 0,
        });
      }
      return map.get(mode)!;
    };
    const referredEnquiries = enquiries.filter((e) => e.source.type === 'Agent' && e.source.agentId === id);
    for (const enq of referredEnquiries) {
      const mode = inferIntroducingPartnerModeFromEnquiry(enq);
      const row = touch(mode);
      row.enqCount += 1;
      if (enq.status === 'Converted') row.enqConverted += 1;
      else if (enq.status !== 'Lost') row.enqPipeline += 1;
      if (enquiryCommissionLocked(enq.id, projects, quotations)) row.lockedEnquiries += 1;
      if (mode === 'referral_flat') {
        row.sumFlat += enq.introducingPartnerReferralFlatInr ?? enq.fixedDealAmountInr ?? 0;
      } else if (mode === 'referral_per_kw') {
        row.sumPerKwEquiv += Math.round((enq.introducingPartnerReferralPerKwInr ?? 0) * enq.systemCapacity);
      }
    }
    const linkedQuotes = quotations.filter((q) => {
      if (q.agentId === id) return true;
      if (!q.enquiryId) return false;
      const e = enquiries.find((x) => x.id === q.enquiryId);
      return e?.source?.type === 'Agent' && e.source.agentId === id;
    });
    for (const q of linkedQuotes) {
      const enq = q.enquiryId ? enquiries.find((e) => e.id === q.enquiryId) : undefined;
      const mode = q.introducingPartnerPayMode ?? (enq ? inferIntroducingPartnerModeFromEnquiry(enq) : 'referral_flat');
      const row = touch(mode);
      row.quoteCount += 1;
      const kw = q.systemCapacityKw ?? enq?.systemCapacity ?? 0;
      if (mode === 'referral_flat') {
        row.sumFlat += q.introducingPartnerReferralFlatInr ?? 0;
      } else if (mode === 'referral_per_kw') {
        row.sumPerKwEquiv += Math.round((q.introducingPartnerReferralPerKwInr ?? 0) * kw);
      }
    }
    return [...map.values()].sort((x, y) => x.mode.localeCompare(y.mode));
  }, [id, enquiries, quotations, projects]);

  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [fifoOpen, setFifoOpen] = useState(false);
  const [payTargetId, setPayTargetId] = useState<string | null>(null);
  const [payKind, setPayKind] = useState<IntroAgentPayoutKind>('profit_share');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');
  const [fifoAmount, setFifoAmount] = useState('');
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobile: '',
    whatsappNumber: '',
    email: '',
    rateType: 'Per kW' as Agent['rateType'],
    rate: '',
    address: '',
    isProfitSharePartner: false,
  });

  const detailHeader = useMemo(() => {
    if (!a) return { title: 'Agent', subtitle: '' };
    return {
      title: a.fullName,
      subtitle: a.isProfitSharePartner ? 'Introducing partner · profit-share' : 'Sales agent · referral rates',
      actions: (
        <div className="flex flex-wrap justify-end gap-2">
          <ShellButton
            variant="primary"
            type="button"
            onClick={() => navigate(`/sales/enquiries?prefillAgentId=${encodeURIComponent(a.id)}`)}
          >
            New enquiry
          </ShellButton>
          <ShellButton variant="secondary" type="button" onClick={() => navigate('/sales/agents')}>
            ← Back to list
          </ShellButton>
        </div>
      ),
    };
  }, [a, navigate]);
  usePageHeader(detailHeader);

  if (!a) return <p className="text-muted-foreground">Not found</p>;
  const agent = a;

  const referredList = enquiries.filter((e) => e.source.type === 'Agent' && e.source.agentId === agent.id);
  const referred = referredList.length;
  const openLeads = referredList.filter((e) => e.status === 'New' || e.status === 'Contacted').length;
  const convertedN = referredList.filter((e) => e.status === 'Converted').length;
  const projs = projects.filter((p) => p.agentId === agent.id);
  const myEconomics = economicsRows.filter((r) => r.agentId === agent.id);
  const agentQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (q.agentId === agent.id) return true;
      if (!q.enquiryId) return false;
      const e = enquiries.find((x) => x.id === q.enquiryId);
      return e?.source?.type === 'Agent' && e.source.agentId === agent.id;
    });
  }, [quotations, enquiries, agent.id]);

  const [qPage, setQPage] = useState(1);
  const [qPageSize, setQPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);
  const [projPage, setProjPage] = useState(1);
  const [projPageSize, setProjPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setQPage(1);
    setProjPage(1);
  }, [agent.id]);

  useEffect(() => {
    setQPage(1);
  }, [agentQuotations.length, qPageSize]);

  useEffect(() => {
    setProjPage(1);
  }, [projs.length, projPageSize]);

  const qTotalPages = Math.max(1, Math.ceil(agentQuotations.length / qPageSize));
  const quotationsPaged = useMemo(() => {
    const s = (qPage - 1) * qPageSize;
    return agentQuotations.slice(s, s + qPageSize);
  }, [agentQuotations, qPage, qPageSize]);

  const projTotalPages = Math.max(1, Math.ceil(projs.length / projPageSize));
  const projsPaged = useMemo(() => {
    const s = (projPage - 1) * projPageSize;
    return projs.slice(s, s + projPageSize);
  }, [projs, projPage, projPageSize]);

  const partnerTableTotals = useMemo(() => {
    let contract = 0;
    let due = 0;
    let paid = 0;
    let pending = 0;
    for (const p of projs) {
      contract += p.contractAmount;
      const row = myEconomics.find((r) => r.projectId === p.id);
      const cap = p.capacity ?? 0;
      const bd = row
        ? shareBreakdown(row, cap)
        : {
            mode: 'profit_share' as const,
            share: 0,
            refDue: 0,
            paid: 0,
            pending: 0,
          };
      due += bd.mode === 'profit_share' ? bd.share : bd.refDue;
      paid += bd.paid;
      pending += bd.pending;
    }
    return { contract, due, paid, pending };
  }, [projs, myEconomics]);

  const referralTableTotals = useMemo(() => {
    let capKw = 0;
    let contract = 0;
    let est = 0;
    for (const p of projs) {
      capKw += p.capacity;
      contract += p.contractAmount;
      est += agent.rateType === 'Per kW' ? Math.round(p.capacity * agent.rate) : agent.rate;
    }
    return { capKw, contract, est };
  }, [projs, agent.rate, agent.rateType]);

  const totalPendingPartner = agent.isProfitSharePartner
    ? myEconomics.reduce((s, r) => {
        const cap = projects.find((p) => p.id === r.projectId)?.capacity ?? 0;
        return s + shareBreakdown(r, cap).pending;
      }, 0)
    : 0;

  function persistPhoto(dataUrl: string) {
    const list = getCollection<Agent>('agents');
    setCollection(
      'agents',
      list.map((x) => (x.id === agent.id ? { ...x, photo: dataUrl } : x))
    );
    bump();
    show('Photo updated', 'success');
  }

  function openAgentEdit() {
    setEditForm({
      fullName: agent.fullName,
      mobile: agent.mobile,
      whatsappNumber: agent.whatsappNumber ?? '',
      email: agent.email,
      rateType: agent.rateType,
      rate: String(agent.rate),
      address: agent.address,
      isProfitSharePartner: Boolean(agent.isProfitSharePartner),
    });
    setEditOpen(true);
  }

  function saveAgentEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      show('Name required', 'error');
      return;
    }
    const list = getCollection<Agent>('agents');
    const wa = editForm.whatsappNumber.replace(/\D/g, '');
    setCollection(
      'agents',
      list.map((x) =>
        x.id === agent.id
          ? {
              ...x,
              fullName: editForm.fullName.trim(),
              mobile: editForm.mobile.replace(/\D/g, '').slice(-10),
              whatsappNumber: wa ? wa : undefined,
              email: editForm.email.trim(),
              rateType: editForm.rateType,
              rate: Number(editForm.rate) || 0,
              address: editForm.address.trim(),
              isProfitSharePartner: editForm.isProfitSharePartner,
            }
          : x
      )
    );
    bump();
    setEditOpen(false);
    show('Agent profile updated', 'success');
  }

  function setPartnerFlag(next: boolean) {
    const list = getCollection<Agent>('agents');
    setCollection(
      'agents',
      list.map((x) => (x.id === agent.id ? { ...x, isProfitSharePartner: next } : x))
    );
    bump();
    show(next ? 'Marked as introducing partner' : 'Marked as standard agent', 'success');
  }

  function openPayModal(rowId: string) {
    const row = economicsRows.find((r) => r.id === rowId);
    const cap = row ? projects.find((p) => p.id === row.projectId)?.capacity ?? 0 : 0;
    const b = row ? shareBreakdown(row, cap) : null;
    setPayTargetId(rowId);
    setPayKind(b?.mode === 'profit_share' ? 'profit_share' : 'referral');
    setPayAmount('');
    setPayNotes('');
    setPayOpen(true);
  }

  function saveProjectPayment() {
    if (!payTargetId || !payAmount.trim()) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      show('Enter a valid amount', 'error');
      return;
    }
    const list = getCollection<AgentIntroProjectEconomics>('introAgentEconomics');
    const row = list.find((r) => r.id === payTargetId);
    if (!row) return;
    const cap = projects.find((p) => p.id === row.projectId)?.capacity ?? 0;
    const b = shareBreakdown(row, cap);
    const block = partnerPayoutBlockedReason(row.projectId, invoices, b.mode);
    if (block) {
      show(block, 'error');
      return;
    }
    let kind: IntroAgentPayoutKind = payKind;
    if (!(b.profitPending > 0 && b.refPending > 0)) {
      if (b.profitPending > 0) kind = 'profit_share';
      else if (b.refPending > 0) kind = 'referral';
    }
    const maxForKind = kind === 'profit_share' ? b.profitPending : b.refPending;
    if (amt > maxForKind + 0.01) {
      show(
        `Amount exceeds ${kind === 'profit_share' ? 'profit share' : 'referral'} pending (₹${maxForKind.toLocaleString('en-IN')})`,
        'error'
      );
      return;
    }
    const ts = new Date().toISOString();
    setCollection(
      'introAgentEconomics',
      list.map((r) =>
        r.id === payTargetId
          ? {
              ...r,
              payouts: [
                ...r.payouts,
                {
                  id: generateId('pout'),
                  amountInr: amt,
                  date: payDate,
                  notes: payNotes.trim() || 'Payment',
                  kind,
                },
              ],
              updatedAt: ts,
            }
          : r
      )
    );
    bump();
    setPayOpen(false);
    show('Payment recorded', 'success');
  }

  function saveFifoPayment() {
    const amt = Number(fifoAmount);
    if (!amt || amt <= 0) {
      show('Enter a valid amount', 'error');
      return;
    }
    const ordered = [...myEconomics].sort((a, b) => {
      const pa = projects.find((p) => p.id === a.projectId);
      const pb = projects.find((p) => p.id === b.projectId);
      return (pa?.startDate ?? '').localeCompare(pb?.startDate ?? '');
    });
    let left = amt;
    const noteBase = (payNotes.trim() || 'FIFO payment') + ' (FIFO)';
    type App = { rowId: string; projectId: string; payouts: AgentIntroProjectEconomics['payouts'] };
    const apps: App[] = [];

    for (const row of ordered) {
      if (left <= 0) break;
      const cap = projects.find((p) => p.id === row.projectId)?.capacity ?? 0;
      const b = shareBreakdown(row, cap);
      if (b.pending <= 0) continue;
      const profitApply = Math.min(left, b.profitPending);
      left -= profitApply;
      const refApply = Math.min(left, b.refPending);
      left -= refApply;
      if (profitApply <= 0 && refApply <= 0) continue;

      const newPayouts: AgentIntroProjectEconomics['payouts'] = [];
      if (profitApply > 0) {
        newPayouts.push({
          id: generateId('pout'),
          amountInr: profitApply,
          date: payDate,
          notes: noteBase,
          kind: 'profit_share',
        });
      }
      if (refApply > 0) {
        newPayouts.push({
          id: generateId('pout'),
          amountInr: refApply,
          date: payDate,
          notes: noteBase,
          kind: 'referral',
        });
      }
      apps.push({ rowId: row.id, projectId: row.projectId, payouts: newPayouts });
    }

    const projectIds = new Set(apps.map((x) => x.projectId));
    for (const pid of projectIds) {
      const rowForPid = ordered.find((r) => r.projectId === pid);
      const capP = projects.find((p) => p.id === pid)?.capacity ?? 0;
      const modeP = rowForPid ? shareBreakdown(rowForPid, capP).mode : 'profit_share';
      const block = partnerPayoutBlockedReason(pid, invoices, modeP);
      if (block) {
        show(block, 'error');
        return;
      }
    }

    const list = getCollection<AgentIntroProjectEconomics>('introAgentEconomics');
    const ts = new Date().toISOString();
    const byId = new Map(list.map((r) => [r.id, r] as const));
    for (const app of apps) {
      const cur = byId.get(app.rowId);
      if (!cur) continue;
      byId.set(app.rowId, {
        ...cur,
        payouts: [...cur.payouts, ...app.payouts],
        updatedAt: ts,
      });
    }
    setCollection(
      'introAgentEconomics',
      list.map((row) => byId.get(row.id) ?? row)
    );
    bump();
    setFifoOpen(false);
    setFifoAmount('');
    show('FIFO payment applied to oldest pending balances', 'success');
  }

  function ensureEconomicsForProject(p: Project) {
    const list = getCollection<AgentIntroProjectEconomics>('introAgentEconomics');
    if (list.some((r) => r.projectId === p.id && r.agentId === agent.id)) {
      show('Row already exists', 'info');
      return;
    }
    const guess = enquiries.find((e) => e.source.type === 'Agent' && e.source.agentId === agent.id);
    const mode = inferIntroducerModeFromEnquiry(guess);
    const ts = new Date().toISOString();
    const row: AgentIntroProjectEconomics = {
      id: generateId('iae'),
      projectId: p.id,
      agentId: agent.id,
      estimatedSiteCostInr: Math.round(p.contractAmount * 0.62),
      estimatedGrossProfitInr: Math.round(p.contractAmount * 0.2),
      introducerPayMode: mode,
      partnerSharePercent:
        mode === 'profit_share' ? (guess?.partnerProfitSharePercent ?? 10) : guess?.partnerProfitSharePercent ?? 0,
      referralFlatInr:
        mode === 'referral_flat'
          ? (guess?.introducingPartnerReferralFlatInr ?? guess?.fixedDealAmountInr ?? 0)
          : undefined,
      referralPerKwInr: mode === 'referral_per_kw' ? (guess?.introducingPartnerReferralPerKwInr ?? 0) : undefined,
      projectReferralRateType: 'None',
      projectReferralRateInr: 0,
      payouts: [],
      updatedAt: ts,
    };
    setCollection('introAgentEconomics', [...list, row]);
    bump();
    show('Economics row added — set mode and amounts as needed', 'success');
  }

  function patchEconomicsRow(rowId: string, patch: Partial<AgentIntroProjectEconomics>) {
    const list = getCollection<AgentIntroProjectEconomics>('introAgentEconomics');
    const ts = new Date().toISOString();
    setCollection(
      'introAgentEconomics',
      list.map((x) => (x.id === rowId ? { ...x, ...patch, updatedAt: ts } : x))
    );
    bump();
  }

  return (
    <div className="space-y-4">
      {agent.isProfitSharePartner && (
        <Card className="border-primary/25 bg-primary/5">
          <p className="text-sm text-foreground">
            <strong>Introducing partner</strong> — brings the lead only; MMS executes the project. Remuneration is{' '}
            <strong>one mode per project</strong>: profit share on MMS gross profit (paid after full client collection), a{' '}
            <strong>flat referral</strong>, or <strong>per-kW referral</strong>. Not the same as{' '}
            <em>Finance → Partners</em> (site / co-execution partners).
          </p>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row sm:items-start lg:flex-col lg:items-center">
            {agent.photo ? (
              <img src={agent.photo} alt="" className="h-28 w-28 rounded-lg border border-border object-cover" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No photo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => persistPhoto(String(r.result ?? ''));
                  r.readAsDataURL(f);
                  e.target.value = '';
                }}
              />
              <ShellButton type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                Upload / change photo
              </ShellButton>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{agent.fullName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {agent.isProfitSharePartner
                    ? 'Introducing partner — each project pays either a profit share, a flat referral, or a per-kW referral (exactly one).'
                    : 'Sales agent — Per kW or flat referral on standard deals.'}
                </p>
                <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm leading-relaxed text-foreground">
                  Referred enquiries <span className="font-semibold tabular-nums">{referred}</span>
                  <span className="text-muted-foreground"> · </span>
                  Open pipeline <span className="font-semibold tabular-nums">{openLeads}</span>
                  <span className="text-muted-foreground"> · </span>
                  Converted <span className="font-semibold tabular-nums">{convertedN}</span>
                  <span className="text-muted-foreground"> · </span>
                  {agent.isProfitSharePartner ? (
                    <>
                      Pending partner payout{' '}
                      <span className="font-semibold text-foreground tabular-nums">
                        ₹{totalPendingPartner.toLocaleString('en-IN')}
                      </span>
                    </>
                  ) : (
                    <>
                      Linked projects <span className="font-semibold tabular-nums">{projs.length}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShellButton type="button" variant="secondary" size="sm" onClick={openAgentEdit}>
                  Edit profile
                </ShellButton>
                <ShellButton
                  type="button"
                  variant={agent.isProfitSharePartner ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => setPartnerFlag(!agent.isProfitSharePartner)}
                >
                  {agent.isProfitSharePartner ? 'Remove partner mode' : 'Mark as introducing partner'}
                </ShellButton>
              </div>
            </div>
            <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium text-foreground">
                  {agent.isProfitSharePartner ? 'Introducing partner' : 'Standard referral agent'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mobile</dt>
                <dd className="font-medium text-foreground">{agent.mobile}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd className="font-medium text-foreground">
                  {agentWaDigits(agent) ? agent.whatsappNumber || agent.mobile : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{agent.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rate card</dt>
                <dd className="font-medium text-foreground">
                  {agent.isProfitSharePartner ? (
                    agent.rate > 0 ? (
                      <>
                        ₹{agent.rate.toLocaleString('en-IN')} ({agent.rateType}) — optional; project payout is fixed per deal.
                      </>
                    ) : (
                      <>No agent-level rate on file; economics are set on enquiry / quotation / project.</>
                    )
                  ) : (
                    <>
                      ₹{agent.rate.toLocaleString('en-IN')} ({agent.rateType})
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Commission (booked / paid)</dt>
                <dd className="font-medium text-foreground">
                  ₹{agent.totalCommission.toLocaleString('en-IN')} / ₹{agent.paidCommission.toLocaleString('en-IN')}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium text-foreground">{agent.address || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Onboarded</dt>
                <dd className="text-muted-foreground">{new Date(agent.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden shadow-sm">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Commission pipeline by mode</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enquiries and quotations linked to this agent, grouped by introducer pay mode. Per-kW column is Σ (rate ×
            kW) per row. Locked counts are enquiries where a project already references the linked quotation.
          </p>
        </div>
        <DataTableShell bare>
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Enquiries</th>
                <th>Pipeline / converted</th>
                <th>Quotations</th>
                <th>Σ flat ₹</th>
                <th>Σ per-kW ₹</th>
                <th>Locked enq.</th>
              </tr>
            </thead>
            <tbody>
              {commissionPipelineRollup.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No linked enquiries or quotations yet.
                  </td>
                </tr>
              ) : (
                commissionPipelineRollup.map((r) => (
                  <tr key={r.mode}>
                    <td className="font-medium text-foreground">{introModeLabel(r.mode)}</td>
                    <td className="tabular-nums text-muted-foreground">{r.enqCount}</td>
                    <td className="text-muted-foreground">
                      {r.enqPipeline} / {r.enqConverted}
                    </td>
                    <td className="tabular-nums text-muted-foreground">{r.quoteCount}</td>
                    <td className="tabular-nums text-foreground">₹{r.sumFlat.toLocaleString('en-IN')}</td>
                    <td className="tabular-nums text-foreground">₹{r.sumPerKwEquiv.toLocaleString('en-IN')}</td>
                    <td className="tabular-nums text-muted-foreground">{r.lockedEnquiries}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </Card>

      {agent.isProfitSharePartner ? (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border bg-muted/50 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Projects · introducing partner economics</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              One payout mode per project, fixed on the enquiry or quotation (read-only here). Profit share waits for full
              client collection; flat and per-kW referrals do not. FIFO applies oldest pending balances first. Est. cost /
              profit remain editable for internal estimates.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ShellButton type="button" variant="secondary" size="sm" onClick={() => setFifoOpen(true)}>
                Record FIFO payment
              </ShellButton>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className={dataTableClasses}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Quotation</th>
                  <th>Contract ₹</th>
                  <th>Est. cost ₹</th>
                  <th>Est. profit ₹</th>
                  <th>Payout mode</th>
                  <th>Terms</th>
                  <th>Due ₹</th>
                  <th>Paid ₹</th>
                  <th>Pending ₹</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projsPaged.map((p) => {
                  const row = myEconomics.find((r) => r.projectId === p.id);
                  const cap = p.capacity ?? 0;
                  const bd = row
                    ? shareBreakdown(row, cap)
                    : {
                        mode: 'profit_share' as const,
                        share: 0,
                        refDue: 0,
                        profitPaid: 0,
                        refPaid: 0,
                        paid: 0,
                        profitPending: 0,
                        refPending: 0,
                        pending: 0,
                      };
                  const { mode, share, refDue, profitPaid, refPaid, paid, pending, profitPending, refPending } = bd;
                  const dueDisplay = mode === 'profit_share' ? share : refDue;
                  const quote = p.quotationId ? quotations.find((q) => q.id === p.quotationId) : undefined;
                  const rowMode: IntroducingPartnerPayMode | undefined = row ? introducerPayModeForRow(row) : undefined;
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td>
                        <Link className="font-medium text-primary hover:underline" to={`/projects/${p.id}`}>
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {quote ? (
                          <Link className="text-primary hover:underline" to={`/sales/quotations/${quote.id}`}>
                            {quote.reference || quote.id.slice(0, 8)}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-muted-foreground">₹{p.contractAmount.toLocaleString('en-IN')}</td>
                      <td className="text-muted-foreground">
                        {row ? (
                          <input
                            className="input-shell h-9 w-28 py-1 text-sm"
                            value={row.estimatedSiteCostInr}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              patchEconomicsRow(row.id, { estimatedSiteCostInr: v });
                            }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-muted-foreground">
                        {row ? (
                          <input
                            className="input-shell h-9 w-28 py-1 text-sm"
                            value={row.estimatedGrossProfitInr}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              patchEconomicsRow(row.id, { estimatedGrossProfitInr: v });
                            }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-sm text-foreground">{row && rowMode ? introModeLabel(rowMode) : '—'}</td>
                      <td className="max-w-[14rem] text-sm text-muted-foreground">
                        {row && rowMode ? introTermsReadout(row, rowMode, cap) : '—'}
                      </td>
                      <td className="font-medium text-foreground tabular-nums">₹{dueDisplay.toLocaleString('en-IN')}</td>
                      <td className="text-muted-foreground">
                        <span className="tabular-nums">₹{paid.toLocaleString('en-IN')}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          P ₹{profitPaid.toLocaleString('en-IN')} · R ₹{refPaid.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="font-medium text-foreground">
                        <span className="tabular-nums">₹{pending.toLocaleString('en-IN')}</span>
                        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                          P ₹{profitPending.toLocaleString('en-IN')} · R ₹{refPending.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {row ? (
                          <ShellButton type="button" variant="secondary" size="sm" onClick={() => openPayModal(row.id)}>
                            Pay
                          </ShellButton>
                        ) : (
                          <ShellButton type="button" variant="secondary" size="sm" onClick={() => ensureEconomicsForProject(p)}>
                            Track economics
                          </ShellButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {projs.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-medium text-foreground">
                    <td colSpan={2} className="py-2 text-muted-foreground">
                      Totals ({projs.length} project{projs.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-2 tabular-nums">₹{partnerTableTotals.contract.toLocaleString('en-IN')}</td>
                    <td colSpan={2} />
                    <td colSpan={2} className="text-xs font-normal text-muted-foreground">
                      Due / paid / pending (all projects)
                    </td>
                    <td className="py-2 tabular-nums">₹{partnerTableTotals.due.toLocaleString('en-IN')}</td>
                    <td className="py-2 tabular-nums text-muted-foreground">₹{partnerTableTotals.paid.toLocaleString('en-IN')}</td>
                    <td className="py-2 tabular-nums">₹{partnerTableTotals.pending.toLocaleString('en-IN')}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
            {projs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No projects linked to this agent yet.</p>}
          </div>
          {projs.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <TablePaginationBar
                page={projPage}
                totalPages={projTotalPages}
                pageSize={projPageSize}
                totalCount={projs.length}
                onPageChange={setProjPage}
                onPageSizeChange={setProjPageSize}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border bg-muted/50 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Projects · referral rates</h2>
            <p className="text-xs text-muted-foreground">Per-project capacity and estimated commission from your rate card.</p>
          </div>
          <div className="overflow-x-auto">
            <table className={dataTableClasses}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Capacity (kW)</th>
                  <th>Contract ₹</th>
                  <th>Rate type</th>
                  <th>Rate ₹</th>
                  <th>Est. commission ₹</th>
                </tr>
              </thead>
              <tbody>
                {projsPaged.map((p) => {
                  const est =
                    agent.rateType === 'Per kW' ? Math.round(p.capacity * agent.rate) : agent.rate;
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td>
                        <Link className="font-medium text-primary hover:underline" to={`/projects/${p.id}`}>
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-muted-foreground">{p.capacity}</td>
                      <td className="text-muted-foreground">₹{p.contractAmount.toLocaleString('en-IN')}</td>
                      <td className="text-muted-foreground">{agent.rateType}</td>
                      <td className="text-muted-foreground">₹{agent.rate.toLocaleString('en-IN')}</td>
                      <td className="font-medium text-foreground">₹{est.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
              {projs.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-medium text-foreground">
                    <td className="py-2 text-muted-foreground">Totals ({projs.length} projects)</td>
                    <td className="py-2 tabular-nums">{referralTableTotals.capKw}</td>
                    <td className="py-2 tabular-nums">₹{referralTableTotals.contract.toLocaleString('en-IN')}</td>
                    <td colSpan={2} />
                    <td className="py-2 tabular-nums">₹{referralTableTotals.est.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {projs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No linked projects.</p>}
          </div>
          {projs.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <TablePaginationBar
                page={projPage}
                totalPages={projTotalPages}
                pageSize={projPageSize}
                totalCount={projs.length}
                onPageChange={setProjPage}
                onPageSizeChange={setProjPageSize}
              />
            </div>
          )}
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Quotations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Linked by agent on the quote or by enquiry source. Open a quote to see the enquiry and project trail.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Phone</th>
                <th>kW</th>
                <th>Status</th>
                <th>Enquiry</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {quotationsPaged.map((q) => {
                const cust = customers.find((c) => c.id === q.customerId);
                const enq = q.enquiryId ? enquiries.find((e) => e.id === q.enquiryId) : undefined;
                const kw = q.systemCapacityKw;
                return (
                  <tr key={q.id} className="border-t border-border">
                    <td className="font-medium text-foreground">{q.reference || q.id.slice(0, 8)}</td>
                    <td className="text-muted-foreground">{cust?.name ?? '—'}</td>
                    <td className="text-muted-foreground tabular-nums">{cust?.phone ?? '—'}</td>
                    <td className="text-muted-foreground tabular-nums">{kw != null ? `${kw}` : '—'}</td>
                    <td className="text-muted-foreground">{q.status}</td>
                    <td className="text-muted-foreground">
                      {enq ? (
                        <Link className="text-primary hover:underline" to={`/sales/enquiries/${enq.id}`}>
                          {enq.customerName || enq.id.slice(0, 8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <Link className="text-primary hover:underline" to={`/sales/quotations/${q.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agentQuotations.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No quotations linked to this agent yet.</p>
          )}
        </div>
        {agentQuotations.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <TablePaginationBar
              page={qPage}
              totalPages={qTotalPages}
              pageSize={qPageSize}
              totalCount={agentQuotations.length}
              onPageChange={setQPage}
              onPageSizeChange={setQPageSize}
            />
          </div>
        )}
      </Card>

      <Modal open={editOpen} title="Edit agent" onClose={() => setEditOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveAgentEdit}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Full name *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Mobile *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              value={editForm.mobile}
              onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">WhatsApp number</span>
            <input
              className="input-shell mt-1 w-full"
              value={editForm.whatsappNumber}
              onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
              placeholder="If different from mobile"
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1 w-full"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={editForm.isProfitSharePartner}
              onChange={(e) => setEditForm({ ...editForm, isProfitSharePartner: e.target.checked })}
            />
            <span className="text-sm">Introducing partner (profit-share)</span>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Rate type</span>
            <select
              className="select-shell mt-1 w-full"
              value={editForm.rateType}
              onChange={(e) => setEditForm({ ...editForm, rateType: e.target.value as Agent['rateType'] })}
            >
              <option value="Per kW">Per kW</option>
              <option value="Flat">Flat</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Rate (₹)</span>
            <input className="input-shell mt-1 w-full" value={editForm.rate} onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <textarea
              className="input-shell mt-1 min-h-[4rem] w-full"
              rows={2}
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save
            </ShellButton>
          </div>
        </form>
      </Modal>

      <Modal open={payOpen} title="Record payment (project)" onClose={() => setPayOpen(false)}>
        {(() => {
          const payRow = payTargetId ? economicsRows.find((r) => r.id === payTargetId) : undefined;
          const payProj = payRow ? projects.find((x) => x.id === payRow.projectId) : undefined;
          const payBd = payRow ? shareBreakdown(payRow, payProj?.capacity ?? 0) : null;
          const payBlock =
            payRow && payBd ? partnerPayoutBlockedReason(payRow.projectId, invoices, payBd.mode) : null;
          const dualPending = Boolean(payBd && payBd.profitPending > 0 && payBd.refPending > 0);
          return (
            <>
              {payBlock ? (
                <p className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                  {payBlock}
                </p>
              ) : null}
              {payBd ? (
                <p className="mb-3 text-xs text-muted-foreground">
                  Pending: profit share ₹{payBd.profitPending.toLocaleString('en-IN')}
                  {payBd.refPending > 0 ? (
                    <> · referral ₹{payBd.refPending.toLocaleString('en-IN')}</>
                  ) : null}
                </p>
              ) : null}
              {dualPending ? (
                <label className="block text-sm">
                  <span className="text-muted-foreground">Payment type</span>
                  <select
                    className="select-shell mt-1 w-full"
                    value={payKind}
                    onChange={(e) => setPayKind(e.target.value as IntroAgentPayoutKind)}
                  >
                    <option value="profit_share">Profit share</option>
                    <option value="referral" disabled={!payBd || payBd.refPending <= 0}>
                      Referral (flat / per-kW)
                    </option>
                  </select>
                </label>
              ) : payBd ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  {payBd.mode === 'profit_share' || payBd.profitPending > 0
                    ? 'Recording a profit share payout.'
                    : 'Recording a referral payout (flat or per-kW).'}
                </p>
              ) : null}
              <label className="mt-2 block text-sm">
                <span className="text-muted-foreground">Amount (₹)</span>
                <input
                  className="input-shell mt-1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  type="number"
                  min={1}
                />
              </label>
              <label className="mt-2 block text-sm">
                <span className="text-muted-foreground">Date</span>
                <input type="date" className="input-shell mt-1" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </label>
              <label className="mt-2 block text-sm">
                <span className="text-muted-foreground">Notes</span>
                <input className="input-shell mt-1" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <ShellButton type="button" variant="secondary" onClick={() => setPayOpen(false)}>
                  Cancel
                </ShellButton>
                <ShellButton type="button" variant="primary" onClick={saveProjectPayment} disabled={Boolean(payBlock)}>
                  Save
                </ShellButton>
              </div>
            </>
          );
        })()}
      </Modal>

      <Modal open={fifoOpen} title="FIFO payment across projects" onClose={() => setFifoOpen(false)}>
        <p className="mb-2 text-xs text-muted-foreground">
          Applies to oldest pending balances first (by project start date). Profit-share amounts are applied before project
          referral within each row. Blocked automatically if the client has not fully paid on invoices for a project that
          would receive this payment.
        </p>
        <label className="block text-sm">
          <span className="text-muted-foreground">Total amount (₹)</span>
          <input className="input-shell mt-1" value={fifoAmount} onChange={(e) => setFifoAmount(e.target.value)} type="number" min={1} />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-muted-foreground">Date</span>
          <input type="date" className="input-shell mt-1" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-muted-foreground">Notes</span>
          <input className="input-shell mt-1" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setFifoOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={saveFifoPayment}>
            Apply FIFO
          </ShellButton>
        </div>
      </Modal>
    </div>
  );
}
