import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { SummaryCards } from '../../components/SummaryCards';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import { IDS } from '../../lib/seedData';
import type { Agent, Enquiry, User } from '../../types';

export function EnquiryList() {
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const users = useLiveCollection<User>('users');
  const agents = useLiveCollection<Agent>('agents');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priorityOnly, setPriorityOnly] = useState<string>('');
  const [pipelineQ, setPipelineQ] = useState('');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
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
  });

  const canEdit = role !== 'Installation Team';

  const pageHeader = useMemo(
    () => ({
      title: 'Enquiries',
      subtitle: 'Leads, follow-ups, and conversion to quotations',
      actions: canEdit ? (
        <ShellButton variant="primary" type="button" onClick={() => setOpen(true)}>
          Add enquiry
        </ShellButton>
      ) : undefined,
    }),
    [canEdit]
  );
  usePageHeader(pageHeader);

  const summary = useMemo(() => {
    return {
      total: enquiries.length,
      new: enquiries.filter((e) => e.status === 'New').length,
      inProg: enquiries.filter((e) => e.status === 'In Progress').length,
      converted: enquiries.filter((e) => e.status === 'Converted').length,
      high: enquiries.filter((e) => e.priority === 'High').length,
    };
  }, [enquiries]);

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const matchQ =
        !q ||
        e.customerName.toLowerCase().includes(q.toLowerCase()) ||
        e.phone.includes(q);
      const matchS = !status || e.status === status;
      const matchP = !priorityOnly || e.priority === priorityOnly;
      const pipe = (e.pipelineStage ?? '').toLowerCase();
      const matchPipe = !pipelineQ.trim() || pipe.includes(pipelineQ.trim().toLowerCase());
      return matchQ && matchS && matchP && matchPipe;
    });
  }, [enquiries, q, status, priorityOnly, pipelineQ]);

  function buildSource(): Enquiry['source'] {
    if (form.sourceType === 'Agent') {
      return { type: 'Agent', agentId: form.agentId || undefined };
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
    const list = getCollection<Enquiry>('enquiries');
    const item: Enquiry = {
      id: generateId('enq'),
      customerName: form.customerName,
      phone: form.phone.replace(/\D/g, '').slice(-10),
      email: form.email,
      type: form.type,
      source: buildSource(),
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
      notes: [],
      status: form.assignedTo ? 'In Progress' : 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('enquiries', [...list, item]);
    bump();
    setOpen(false);
    show('Enquiry created', 'success');
  }

  return (
    <div className="space-y-6">
      <SummaryCards
        columns={5}
        items={[
          { label: 'Total', value: String(summary.total) },
          { label: 'New', value: String(summary.new) },
          { label: 'In progress', value: String(summary.inProg) },
          { label: 'Converted', value: String(summary.converted) },
          { label: 'High priority', value: String(summary.high) },
        ]}
      />
      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            className="input-shell max-w-md flex-1"
            placeholder="Search name or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search enquiries"
          />
          <select className="select-shell w-full sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            {['New', 'In Progress', 'Converted', 'Closed'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="select-shell w-full sm:w-44"
            value={priorityOnly}
            onChange={(e) => setPriorityOnly(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            {['Low', 'Medium', 'High'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="input-shell w-full sm:w-48"
            placeholder="Pipeline stage contains…"
            value={pipelineQ}
            onChange={(e) => setPipelineQ(e.target.value)}
            aria-label="Filter by pipeline stage"
          />
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <DataTableShell bare>
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
              {filtered.map((e) => (
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
            <span className="text-xs text-muted-foreground">Source</span>
            <select
              className="select-shell mt-1"
              value={form.sourceType}
              onChange={(e) => setForm({ ...form, sourceType: e.target.value as Enquiry['source']['type'] })}
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
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Agent</span>
              <select
                className="select-shell mt-1"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              >
                <option value="">—</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName}
                  </option>
                ))}
              </select>
            </label>
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
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const foundEnq = enquiries.find((e) => e.id === id);

  const [noteOpen, setNoteOpen] = useState(false);
  const [meetOpen, setMeetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteBy, setNoteBy] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetNotes, setMeetNotes] = useState('');
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
  });

  const canEdit = role !== 'Installation Team';

  const header = useMemo(() => {
    const enq = enquiries.find((e) => e.id === id);
    if (!enq) return { title: 'Enquiry', subtitle: '' };
    return {
      title: enq.customerName,
      subtitle: `${enq.status} · ${enq.priority} priority`,
      actions: (
        <div className="flex flex-wrap justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/sales/enquiries')}>
            All enquiries
          </ShellButton>
          {canEdit && (
            <>
              <ShellButton
                type="button"
                variant="secondary"
                onClick={() => {
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
                  });
                  setEditOpen(true);
                }}
              >
                Edit
              </ShellButton>
              <ShellButton type="button" variant="secondary" onClick={() => setMeetOpen(true)}>
                Schedule meeting
              </ShellButton>
              <ShellButton type="button" variant="secondary" onClick={() => setNoteOpen(true)}>
                Add note
              </ShellButton>
              <ShellButton
                type="button"
                variant="secondary"
                onClick={() =>
                  window.open(
                    `https://wa.me/91${enq.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${enq.customerName}, regarding your solar enquiry.`)}`,
                    '_blank'
                  )
                }
              >
                WhatsApp
              </ShellButton>
              <ShellButton
                type="button"
                variant="secondary"
                onClick={() =>
                  window.open(
                    `mailto:${enq.email || ''}?subject=${encodeURIComponent('Solar enquiry')}&body=${encodeURIComponent(`Hello ${enq.customerName},`)}`,
                    '_blank'
                  )
                }
              >
                Email
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
  }, [id, enquiries, canEdit, navigate]);
  usePageHeader(header);

  if (!foundEnq) return <p className="text-muted-foreground">Not found</p>;
  const enquiry = foundEnq;

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

  function saveMeeting() {
    if (!meetDate) {
      show('Pick a date', 'error');
      return;
    }
    patchEnquiry((x) => ({
      ...x,
      meetingDate: meetDate,
      notes: meetNotes.trim()
        ? [
            ...x.notes,
            {
              text: `Meeting scheduled ${meetDate}: ${meetNotes.trim()}`,
              updatedBy: users[0]?.name ?? 'User',
              timestamp: new Date().toISOString(),
            },
          ]
        : x.notes,
      updatedAt: new Date().toISOString(),
    }));
    setMeetOpen(false);
    setMeetNotes('');
    show('Meeting scheduled', 'success');
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
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
      followUpDate: editForm.followUpDate || undefined,
      requirements: editForm.requirements || undefined,
      pipelineStage: editForm.pipelineStage || undefined,
      roofType: editForm.roofType.trim() || undefined,
      monthlyBillAmount:
        editForm.monthlyBillAmount.trim() !== ''
          ? Number(editForm.monthlyBillAmount) || undefined
          : undefined,
      updatedAt: new Date().toISOString(),
    }));
    setEditOpen(false);
    show('Enquiry updated', 'success');
  }

  function setStatusQuick(next: Enquiry['status']) {
    patchEnquiry((x) => ({ ...x, status: next, updatedAt: new Date().toISOString() }));
    show(`Status → ${next}`, 'info');
  }

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
            <div>
              <dt className="text-muted-foreground">Assigned</dt>
              <dd className="font-medium text-foreground">
                {users.find((u) => u.id === enquiry.assignedTo)?.name ?? enquiry.assignedTo}
              </dd>
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
            {enquiry.source.type === 'Agent' && enquiry.source.agentId && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Agent</dt>
                <dd className="font-medium text-foreground">
                  {agents.find((a) => a.id === enquiry.source.agentId)?.fullName ?? enquiry.source.agentId}
                </dd>
              </div>
            )}
            {enquiry.source.type === 'Referral' && enquiry.source.referredBy && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Referred by</dt>
                <dd className="font-medium text-foreground">{enquiry.source.referredBy}</dd>
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
              {(['New', 'In Progress', 'Converted', 'Closed'] as const).map((s) => (
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

      <Modal open={meetOpen} title="Schedule meeting" onClose={() => setMeetOpen(false)}>
        <label className="block text-sm">
          <span className="text-muted-foreground">Date</span>
          <input
            type="date"
            className="input-shell mt-1"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-muted-foreground">Agenda (optional)</span>
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
            Save
          </ShellButton>
        </div>
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
              {(['New', 'In Progress', 'Converted', 'Closed'] as const).map((s) => (
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
            <span className="text-xs text-muted-foreground">Pipeline stage (label)</span>
            <input
              className="input-shell mt-1"
              value={editForm.pipelineStage}
              onChange={(e) => setEditForm({ ...editForm, pipelineStage: e.target.value })}
              placeholder="e.g. quotation-sent"
            />
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
