import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
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
    sourceType: 'Direct' as 'Agent' | 'Direct',
    agentId: '',
    directSource: 'Walk-in',
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

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const matchQ =
        !q ||
        e.customerName.toLowerCase().includes(q.toLowerCase()) ||
        e.phone.includes(q);
      const matchS = !status || e.status === status;
      return matchQ && matchS;
    });
  }, [enquiries, q, status]);

  function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Enquiry>('enquiries');
    const item: Enquiry = {
      id: generateId('enq'),
      customerName: form.customerName,
      phone: form.phone.replace(/\D/g, '').slice(-10),
      email: form.email,
      type: form.type,
      source:
        form.sourceType === 'Agent'
          ? { type: 'Agent', agentId: form.agentId || undefined }
          : { type: 'Direct', directSource: form.directSource },
      priority: form.priority,
      systemCapacity: Number(form.systemCapacity) || 0,
      estimatedBudget: Number(form.estimatedBudget) || 0,
      assignedTo: form.assignedTo || (users[0]?.id ?? IDS.u4),
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
    <div className="space-y-4">
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
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/90">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Customer</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Phone</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Priority</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">kW</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-border transition hover:bg-muted/80">
                  <td className="px-4 py-3 font-medium text-foreground">{e.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.priority}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.systemCapacity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.status}</td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/sales/enquiries/${e.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <span className="text-xs text-muted-foreground">Source</span>
            <select
              className="select-shell mt-1"
              value={form.sourceType}
              onChange={(e) => setForm({ ...form, sourceType: e.target.value as 'Agent' | 'Direct' })}
            >
              <option value="Direct">Direct</option>
              <option value="Agent">Agent</option>
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
          ) : (
            <label className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Direct source</span>
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
    patchEnquiry((x) => ({
      ...x,
      notes: [
        ...x.notes,
        { text: note.trim(), updatedBy: users[0]?.name ?? 'User', timestamp: new Date().toISOString() },
      ],
      updatedAt: new Date().toISOString(),
    }));
    setNote('');
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
            {enquiry.source.type === 'Agent' && enquiry.source.agentId && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Agent</dt>
                <dd className="font-medium text-foreground">
                  {agents.find((a) => a.id === enquiry.source.agentId)?.fullName ?? enquiry.source.agentId}
                </dd>
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
              <p className="text-foreground">{n.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.updatedBy} · {new Date(n.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={noteOpen} title="Add note" onClose={() => setNoteOpen(false)}>
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
