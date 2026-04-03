import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { defaultExpenseTagForRole, formatINRDecimal, perDayRate, taskEffectiveStatus, WORKING_DAYS_PER_MONTH } from '../../lib/helpers';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { Attendance, PayrollRecord, Project, Site, Task, User } from '../../types';

export function EmployeesList() {
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const empHeader = useMemo(
    () => ({
      title: 'Employees',
      subtitle: 'Roles, salary, and expense tags',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => setOpen(true)}>
          Add employee
        </ShellButton>
      ),
    }),
    []
  );
  usePageHeader(empHeader);
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('Salesperson');
  const [salary, setSalary] = useState('45000');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function add(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<User>('users');
    const u: User = {
      id: generateId('usr'),
      name,
      role,
      expenseTag: defaultExpenseTagForRole(role),
      phone: phone.replace(/\D/g, '').slice(-10),
      email,
      address: '',
      dob: '',
      salary: Number(salary) || 0,
      bankDetails: '',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: email.split('@')[0] || `user_${list.length}`,
      password: 'changeme',
      joiningDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('users', [...list, u]);
    bump();
    setOpen(false);
    show('Employee added', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/90">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tag</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Salary</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border transition hover:bg-muted/80">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.expenseTag}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatINRDecimal(u.salary)}</td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/hr/employees/${u.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} title="Add employee" onClose={() => setOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={add}>
          <input
            required
            placeholder="Name"
            className="input-shell sm:col-span-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select className="select-shell" value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
            {(['Super Admin', 'Admin', 'Management', 'Salesperson', 'Installation Team'] as const).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input placeholder="Salary" className="input-shell" value={salary} onChange={(e) => setSalary(e.target.value)} />
          <input required placeholder="Phone" className="input-shell" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="email" required placeholder="Email" className="input-shell" value={email} onChange={(e) => setEmail(e.target.value)} />
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

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const users = useLiveCollection<User>('users');
  const u = users.find((x) => x.id === id);
  const edHeader = useMemo(() => {
    const row = users.find((x) => x.id === id);
    if (!row) return { title: 'Employee', subtitle: '' };
    return {
      title: row.name,
      subtitle: `${row.role} · ${row.expenseTag}`,
      actions: (
        <ShellButton type="button" variant="secondary" onClick={() => navigate('/hr/employees')}>
          All employees
        </ShellButton>
      ),
    };
  }, [id, users, navigate]);
  usePageHeader(edHeader);

  if (!u) return <p className="text-muted-foreground">Not found</p>;
  return (
    <Card>
      <div className="text-sm text-foreground space-y-2">
        <p>
          <span className="text-muted-foreground">Phone</span> · {u.phone}
        </p>
        <p>
          <span className="text-muted-foreground">Email</span> · {u.email}
        </p>
        <p>Salary: {formatINRDecimal(u.salary)} / month</p>
        <p>Per-day rate (÷{WORKING_DAYS_PER_MONTH}): {formatINRDecimal(perDayRate(u.salary))}</p>
      </div>
    </Card>
  );
}

export function AttendancePage() {
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const sites = useLiveCollection<{ id: string; name: string }>('sites');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const attHeader = useMemo(
    () => ({
      title: 'Attendance',
      subtitle: 'Daily marking by employee and site',
    }),
    []
  );
  usePageHeader(attHeader);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<string, { status: Attendance['status']; siteId: string }>>({});

  const readOnly = role === 'Salesperson';

  useEffect(() => {
    const next: Record<string, { status: Attendance['status']; siteId: string }> = {};
    users.forEach((u) => {
      const existing = attendance.find((a) => a.employeeId === u.id && a.date === date);
      next[u.id] = {
        status: existing?.status ?? 'Absent',
        siteId: existing?.siteId ?? sites[0]?.id ?? '',
      };
    });
    setRows(next);
  }, [date, users, attendance, sites]);

  function mark() {
    const markedBy = users[0]?.id ?? 'usr';
    const others = attendance.filter((a) => a.date !== date);
    const newRows: Attendance[] = Object.entries(rows).map(([employeeId, r]) => ({
      id: generateId('att'),
      employeeId,
      date,
      status: r.status,
      siteId: r.status === 'Present' ? r.siteId || undefined : undefined,
      markedBy,
    }));
    const merged = [...others, ...newRows];
    setCollection('attendance', merged);
    bump();
    show('Attendance saved', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <label className="text-sm font-medium text-foreground">
        Date{' '}
        <input type="date" className="input-shell mt-1 max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-left">Present</th>
              <th className="px-3 py-2 text-left">Paid leave</th>
              <th className="px-3 py-2 text-left">Absent</th>
              <th className="px-3 py-2 text-left">Site (if present)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const state = rows[u.id] ?? { status: 'Absent' as const, siteId: sites[0]?.id ?? '' };
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="radio"
                      name={`st-${u.id}`}
                      checked={state.status === 'Present'}
                      disabled={readOnly}
                      onChange={() => setRows({ ...rows, [u.id]: { ...state, status: 'Present' } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="radio"
                      name={`st-${u.id}`}
                      checked={state.status === 'Paid Leave'}
                      disabled={readOnly}
                      onChange={() => setRows({ ...rows, [u.id]: { ...state, status: 'Paid Leave' } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="radio"
                      name={`st-${u.id}`}
                      checked={state.status === 'Absent'}
                      disabled={readOnly}
                      onChange={() => setRows({ ...rows, [u.id]: { ...state, status: 'Absent' } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      disabled={readOnly || state.status !== 'Present'}
                      value={state.siteId}
                      onChange={(e) => setRows({ ...rows, [u.id]: { ...state, siteId: e.target.value } })}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Card>
      {!readOnly && (
        <ShellButton type="button" variant="primary" onClick={mark}>
          Save day
        </ShellButton>
      )}
      <p className="text-sm">
        <Link className="text-primary hover:underline" to="/hr/attendance/monthly">
          Monthly summary →
        </Link>
      </p>
    </div>
  );
}

const DAY_LETTER: Record<Attendance['status'], string> = {
  Present: 'P',
  'Paid Leave': 'L',
  Absent: 'A',
};

export function AttendanceMonthlyPage() {
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const navigate = useNavigate();
  const now = new Date();
  const [ym, setYm] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const moHeader = useMemo(
    () => ({
      title: 'Attendance (monthly)',
      subtitle: 'Per-employee day grid · P / L / A',
      actions: (
        <ShellButton type="button" variant="secondary" onClick={() => navigate('/hr/attendance')}>
          Daily marking
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(moHeader);

  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || now.getFullYear();
  const m = Number(mStr) || now.getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function cell(employeeId: string, day: number) {
    const d = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = attendance.find((a) => a.employeeId === employeeId && a.date === d);
    return row ? DAY_LETTER[row.status] : '—';
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <label className="text-sm font-medium text-foreground">
          Month{' '}
          <input type="month" className="input-shell mt-1 max-w-xs" value={ym} onChange={(e) => setYm(e.target.value)} />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">P = Present, L = Paid leave, A = Absent</p>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted">
              <th className="sticky left-0 z-10 border-b border-r bg-muted px-2 py-2 text-left">Employee</th>
              {dayNums.map((d) => (
                <th key={d} className="border-b px-1 py-2 text-center font-normal text-muted-foreground">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="sticky left-0 z-10 border-r bg-card px-2 py-1 whitespace-nowrap">{u.name}</td>
                {dayNums.map((d) => (
                  <td key={d} className="border-l border-border px-0 py-1 text-center">
                    {cell(u.id, d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

export function PayrollPage() {
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const payrollRecs = useLiveCollection<PayrollRecord>('payrollRecords');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const readOnly = role === 'Salesperson';
  const y = new Date().getFullYear();
  const m = new Date().getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;

  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUserId, setSlipUserId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return users.map((u) => {
      const monthAtt = attendance.filter((a) => a.employeeId === u.id && a.date.startsWith(prefix));
      const present = monthAtt.filter((a) => a.status === 'Present').length;
      const pl = monthAtt.filter((a) => a.status === 'Paid Leave').length;
      const absent = monthAtt.filter((a) => a.status === 'Absent').length;
      const net = perDayRate(u.salary) * present;
      const paid = payrollRecs.some((r) => r.employeeId === u.id && r.month === prefix && r.paid);
      return { u, present, pl, absent, net, paid };
    });
  }, [users, attendance, prefix, payrollRecs]);

  function markPaid(employeeId: string, net: number) {
    const list = getCollection<PayrollRecord>('payrollRecords');
    const row: PayrollRecord = {
      id: generateId('pr'),
      employeeId,
      month: prefix,
      year: y,
      netPayable: net,
      paid: true,
      paidDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    setCollection('payrollRecords', [...list.filter((r) => !(r.employeeId === employeeId && r.month === prefix)), row]);
    bump();
    show('Marked as paid', 'success');
  }

  const slipUser = slipUserId ? users.find((x) => x.id === slipUserId) : undefined;
  const slipRow = slipUserId ? rows.find((r) => r.u.id === slipUserId) : undefined;

  const payHeader = useMemo(
    () => ({
      title: 'Payroll',
      subtitle: `Month ${prefix} · per-day = salary ÷ ${WORKING_DAYS_PER_MONTH}`,
    }),
    [prefix]
  );
  usePageHeader(payHeader);

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Employee</th>
            <th className="px-3 py-2 text-left">Present</th>
            <th className="px-3 py-2 text-left">Leave</th>
            <th className="px-3 py-2 text-left">Absent</th>
            <th className="px-3 py-2 text-left">Net (est.)</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ u, present, pl, absent, net, paid }) => (
            <tr key={u.id} className="border-t">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">{present}</td>
              <td className="px-3 py-2">{pl}</td>
              <td className="px-3 py-2">{absent}</td>
              <td className="px-3 py-2">{formatINRDecimal(net)}</td>
              <td className="px-3 py-2">{paid ? 'Paid' : 'Pending'}</td>
              <td className="px-3 py-2 flex flex-wrap gap-2">
                <ShellButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSlipUserId(u.id);
                    setSlipOpen(true);
                  }}
                >
                  Slip
                </ShellButton>
                {!readOnly && !paid && (
                  <ShellButton type="button" variant="secondary" size="sm" onClick={() => markPaid(u.id, net)}>
                    Pay
                  </ShellButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </Card>
      <Modal open={slipOpen} title="Salary slip (preview)" onClose={() => setSlipOpen(false)} wide>
        {slipUser && slipRow && (
          <div className="space-y-2 rounded border border-border bg-muted p-4 font-mono text-sm">
            <p className="font-bold">Salary slip — {prefix}</p>
            <p>{slipUser.name}</p>
            <p>Base salary: {formatINRDecimal(slipUser.salary)}</p>
            <p>
              Present {slipRow.present}d · Leave {slipRow.pl} · Absent {slipRow.absent}d
            </p>
            <p>Per-day: {formatINRDecimal(perDayRate(slipUser.salary))}</p>
            <p className="font-semibold">Net payable: {formatINRDecimal(slipRow.net)}</p>
            <p className="text-xs text-muted-foreground">Prototype preview only — not a legal payslip.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function TaskNew() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const newTaskHeader = useMemo(
    () => ({
      title: 'New task / ticket',
      subtitle: 'Assign to project, site, and team members',
      actions: (
        <ShellButton type="button" variant="ghost" onClick={() => navigate('/hr/tasks')}>
          Back to tasks
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(newTaskHeader);
  const projects = useLiveCollection<Project>('projects');
  const sites = useLiveCollection<Site>('sites');
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const defaultPid = search.get('projectId') ?? projects[0]?.id ?? '';

  const [projectId, setProjectId] = useState(defaultPid);
  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [kind, setKind] = useState<'Task' | 'Ticket'>('Task');
  const [assignees, setAssignees] = useState<string[]>([]);

  const proj = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);

  function toggleAssignee(id: string) {
    setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !title.trim()) {
      show('Project and title required', 'error');
      return;
    }
    if (kind === 'Ticket' && proj?.status !== 'Completed' && proj?.status !== 'Closed') {
      show('Tickets are for completed or closed projects', 'error');
      return;
    }
    const list = getCollection<Task>('tasks');
    const t: Task = {
      id: generateId('task'),
      projectId,
      siteId: siteId || undefined,
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignees.length ? assignees : [users[0]?.id].filter(Boolean) as string[],
      dueDate,
      priority,
      status: 'Pending',
      kind: kind === 'Ticket' ? 'Ticket' : 'Task',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };
    setCollection('tasks', [...list, t]);
    bump();
    show('Task saved', 'success');
    navigate(`/hr/tasks/${t.id}`);
  }

  return (
    <div className="space-y-4">
      <Card padding="lg" className="max-w-xl">
      <form className="space-y-3" onSubmit={save}>
        <label className="block text-sm font-medium text-foreground">
          Project
          <select
            className="select-shell mt-1 w-full"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setSiteId('');
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Site (optional)
          <select className="select-shell mt-1 w-full" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">—</option>
            {projectSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Kind
          <select className="select-shell mt-1 w-full" value={kind} onChange={(e) => setKind(e.target.value as 'Task' | 'Ticket')}>
            <option value="Task">Task</option>
            <option value="Ticket">Ticket (post-completion)</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Title
          <input className="input-shell mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Description
          <textarea className="input-shell mt-1 w-full" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Due date
          <input type="date" className="input-shell mt-1 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Priority
          <select
            className="select-shell mt-1 w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
        <div className="text-sm">
          <span className="font-medium text-foreground">Assignees</span>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/50 p-2">
            {users.map((u) => (
              <li key={u.id}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={assignees.includes(u.id)} onChange={() => toggleAssignee(u.id)} />
                  {u.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <ShellButton type="submit" variant="primary">
          Create
        </ShellButton>
      </form>
      </Card>
    </div>
  );
}

export function TasksList() {
  const tasks = useLiveCollection<Task>('tasks');
  const projects = useLiveCollection<{ id: string; name: string }>('projects');
  const navigate = useNavigate();
  const tasksHeader = useMemo(
    () => ({
      title: 'Tasks',
      subtitle: 'Project work items and post-completion tickets',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => navigate('/hr/tasks/new')}>
          New task
        </ShellButton>
      ),
    }),
    [navigate]
  );
  usePageHeader(tasksHeader);
  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        {tasks.map((t) => (
          <li key={t.id}>
            <Link to={`/hr/tasks/${t.id}`} className="block">
              <Card padding="md" interactive>
                <span className="font-medium text-primary">{t.title}</span>
                <div className="mt-1 text-muted-foreground">
                  {projects.find((p) => p.id === t.projectId)?.name} — {taskEffectiveStatus(t)}
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useLiveCollection<Task>('tasks');
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const found = tasks.find((x) => x.id === id);
  const [comment, setComment] = useState('');

  const taskHeader = useMemo(() => {
    if (!found) {
      return {
        title: 'Task',
        subtitle: 'Not found',
        actions: (
          <ShellButton type="button" variant="ghost" onClick={() => navigate('/hr/tasks')}>
            Back to tasks
          </ShellButton>
        ),
      };
    }
    return {
      title: found.title,
      subtitle: `${found.kind === 'Ticket' ? 'Ticket' : 'Task'} · due ${found.dueDate} · ${taskEffectiveStatus(found)}`,
      actions: (
        <ShellButton type="button" variant="ghost" onClick={() => navigate('/hr/tasks')}>
          Back to tasks
        </ShellButton>
      ),
    };
  }, [navigate, found]);
  usePageHeader(taskHeader);

  if (!found) return <p>Not found</p>;
  const task = found;

  function setStatus(s: Task['status']) {
    const list = getCollection<Task>('tasks');
    setCollection(
      'tasks',
      list.map((x) =>
        x.id === task.id ? { ...x, status: s, updatedAt: new Date().toISOString() } : x
      )
    );
    bump();
    show('Updated', 'success');
  }

  function addComment() {
    if (!comment.trim()) return;
    const list = getCollection<Task>('tasks');
    setCollection(
      'tasks',
      list.map((x) =>
        x.id === task.id
          ? {
              ...x,
              comments: [
                ...x.comments,
                { userId: users[0]?.id ?? '', text: comment, timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : x
      )
    );
    setComment('');
    bump();
  }

  function saveAssignees(next: string[]) {
    const list = getCollection<Task>('tasks');
    setCollection(
      'tasks',
      list.map((x) => (x.id === task.id ? { ...x, assignedTo: next, updatedAt: new Date().toISOString() } : x))
    );
    bump();
    show('Assignees updated', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm text-muted-foreground">{task.description || 'No description.'}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Assigned:{' '}
          {task.assignedTo.map((uid) => users.find((u) => u.id === uid)?.name ?? uid).join(', ') || '—'}
        </p>
      </Card>
      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Reassign</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {users.map((u) => (
            <li key={u.id}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.assignedTo.includes(u.id)}
                  onChange={() => {
                    const next = task.assignedTo.includes(u.id)
                      ? task.assignedTo.filter((x) => x !== u.id)
                      : [...task.assignedTo, u.id];
                    saveAssignees(next);
                  }}
                />
                {u.name}
              </label>
            </li>
          ))}
        </ul>
      </Card>
      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['Pending', 'In Progress', 'Completed'] as const).map((s) => (
            <ShellButton key={s} type="button" variant="secondary" size="sm" onClick={() => setStatus(s)}>
              Mark {s}
            </ShellButton>
          ))}
        </div>
      </Card>
      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Comments</h2>
        <ul className="mt-2 space-y-2 text-sm text-foreground">
          {task.comments.map((c, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
              {c.text}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="input-shell min-w-0 flex-1"
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <ShellButton type="button" variant="primary" onClick={addComment}>
            Add
          </ShellButton>
        </div>
      </Card>
    </div>
  );
}
