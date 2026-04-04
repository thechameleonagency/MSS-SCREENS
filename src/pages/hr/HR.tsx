import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, dataTableClasses } from '../../components/DataTableShell';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { cn } from '../../lib/utils';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { defaultExpenseTagForRole, formatINRDecimal, perDayRate, taskEffectiveStatus, WORKING_DAYS_PER_MONTH } from '../../lib/helpers';
import { exportDomToPdf } from '../../lib/pdfExport';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  Attendance,
  CompanyHoliday,
  CompanyProfile,
  EmployeeExpense,
  PayrollRecord,
  Project,
  Site,
  Task,
  User,
} from '../../types';

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
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const u = users.find((x) => x.id === id);
  const [docs, setDocs] = useState({ aadhaar: '', pan: '', photo: '', offerLetter: '' });

  useEffect(() => {
    const row = users.find((x) => x.id === id);
    if (row) setDocs({ ...row.documents });
  }, [id]);

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

  function saveDocuments() {
    if (!u) return;
    const list = getCollection<User>('users');
    setCollection(
      'users',
      list.map((x) =>
        x.id === u.id ? { ...x, documents: { ...docs }, updatedAt: new Date().toISOString() } : x
      )
    );
    bump();
    show('Document links saved', 'success');
  }

  if (!u) return <p className="text-muted-foreground">Not found</p>;
  return (
    <div className="space-y-4">
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
      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Documents</h2>
        <p className="mt-1 text-xs text-muted-foreground">Store links or paths (e.g. drive URL, scanned file path).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['aadhaar', 'Aadhaar'],
              ['pan', 'PAN'],
              ['photo', 'Photo'],
              ['offerLetter', 'Offer letter'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              {label}
              <input
                className="input-shell mt-1 w-full"
                value={docs[key]}
                onChange={(e) => setDocs({ ...docs, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <ShellButton type="button" variant="primary" className="mt-4" onClick={saveDocuments}>
          Save documents
        </ShellButton>
      </Card>
    </div>
  );
}

type AttRow = { status: Attendance['status']; siteId: string; siteIds: string[] };

export function AttendancePage() {
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const sites = useLiveCollection<{ id: string; name: string }>('sites');
  const tasks = useLiveCollection<Task>('tasks');
  const employeeExpenses = useLiveCollection<EmployeeExpense>('employeeExpenses');
  const holidays = useLiveCollection<CompanyHoliday>('companyHolidays');
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
  const [rows, setRows] = useState<Record<string, AttRow>>({});

  const readOnly = role === 'Salesperson';
  const isHoliday = holidays.some((h) => h.date === date);

  useEffect(() => {
    const next: Record<string, AttRow> = {};
    users.forEach((u) => {
      const existing = attendance.find((a) => a.employeeId === u.id && a.date === date);
      const siteIds =
        existing?.siteIds?.length
          ? [...existing.siteIds]
          : existing?.siteId
            ? [existing.siteId]
            : sites[0]
              ? [sites[0].id]
              : [];
      next[u.id] = {
        status: existing?.status ?? 'Absent',
        siteId: siteIds[0] ?? '',
        siteIds,
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
      siteId: r.status === 'Present' ? r.siteIds[0] ?? r.siteId ?? undefined : undefined,
      siteIds: r.status === 'Present' && r.siteIds.length ? r.siteIds : undefined,
      markedBy,
    }));
    const merged = [...others, ...newRows];
    setCollection('attendance', merged);
    bump();
    show('Attendance saved', 'success');
  }

  const draftSummary = useMemo(() => {
    let present = 0;
    let paidLeave = 0;
    let absent = 0;
    users.forEach((u) => {
      const s = rows[u.id]?.status ?? 'Absent';
      if (s === 'Present') present += 1;
      else if (s === 'Paid Leave') paidLeave += 1;
      else absent += 1;
    });
    return { present, paidLeave, absent };
  }, [rows, users]);

  const tasksDue = tasks.filter((t) => t.dueDate === date).length;
  const expensesLogged = employeeExpenses.filter((e) => e.date === date).length;
  const savedRowsForDate = attendance.filter((a) => a.date === date).length;

  function rowState(u: User) {
    return (
      rows[u.id] ?? {
        status: 'Absent' as const,
        siteId: sites[0]?.id ?? '',
        siteIds: sites[0] ? [sites[0].id] : [],
      }
    );
  }

  function toggleSite(employeeId: string, sid: string) {
    const state = rowState(users.find((x) => x.id === employeeId)!);
    const set = new Set(state.siteIds);
    if (set.has(sid)) set.delete(sid);
    else set.add(sid);
    const siteIds = [...set];
    setRows({ ...rows, [employeeId]: { ...state, siteIds, siteId: siteIds[0] ?? '' } });
  }

  function setStatus(employeeId: string, status: Attendance['status']) {
    const state = rowState(users.find((x) => x.id === employeeId)!);
    setRows({ ...rows, [employeeId]: { ...state, status } });
  }

  const sitePickers = (u: User) => {
    const state = rowState(u);
    if (state.status !== 'Present' || sites.length === 0) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <div className="flex max-w-md flex-wrap gap-1.5">
        {sites.map((s) => {
          const on = state.siteIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              disabled={readOnly}
              onClick={() => toggleSite(u.id, s.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                on
                  ? 'border-tertiary bg-tertiary-muted text-tertiary-muted-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Date{' '}
          <input type="date" className="input-shell mt-1 max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {isHoliday && (
          <p className="text-sm text-amber-700 dark:text-amber-400">Company holiday — still record if teams work.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Mark one day at a time for everyone on the list, then use <strong className="text-foreground">Save day</strong>.
        </p>
      </Card>

      <div className="space-y-3 lg:hidden">
        {users.map((u) => {
          const state = rowState(u);
          return (
            <Card key={u.id} padding="md" className="border-border/80">
              <p className="font-medium text-foreground">{u.name}</p>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</label>
              <select
                className="select-shell mt-1 w-full max-w-xs"
                disabled={readOnly}
                value={state.status}
                onChange={(e) => setStatus(u.id, e.target.value as Attendance['status'])}
              >
                <option value="Present">Present</option>
                <option value="Paid Leave">Paid leave</option>
                <option value="Absent">Absent</option>
              </select>
              {state.status === 'Present' && sites.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">Sites</p>
                  <div className="mt-1.5">{sitePickers(u)}</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <DataTableShell className="hidden lg:block">
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Employee</th>
              <th className="min-w-[10rem]">Status</th>
              <th>Sites (when present)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const state = rowState(u);
              return (
                <tr key={u.id}>
                  <td className="font-medium text-foreground">{u.name}</td>
                  <td>
                    <select
                      className="select-shell w-full max-w-[11rem] text-sm"
                      disabled={readOnly}
                      value={state.status}
                      onChange={(e) => setStatus(u.id, e.target.value as Attendance['status'])}
                    >
                      <option value="Present">Present</option>
                      <option value="Paid Leave">Paid leave</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                  <td>{sitePickers(u)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>

      {!readOnly && (
        <ShellButton type="button" variant="primary" onClick={mark}>
          Save day
        </ShellButton>
      )}

      <Card padding="md" className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
          <span>
            Draft today: <strong className="text-foreground">{draftSummary.present}</strong> present ·{' '}
            <strong className="text-foreground">{draftSummary.paidLeave}</strong> leave ·{' '}
            <strong className="text-foreground">{draftSummary.absent}</strong> absent
          </span>
        </div>
        <Link className="shrink-0 font-medium text-primary hover:underline" to="/hr/attendance/monthly">
          Monthly summary →
        </Link>
      </Card>

      <details className="rounded-lg border border-border/80 bg-card/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-foreground">Insights for {date}</summary>
        <ul className="mt-3 space-y-1 text-muted-foreground">
          <li>Tasks due this day: {tasksDue}</li>
          <li>Employee expenses logged: {expensesLogged}</li>
          <li>Attendance rows already saved for this date: {savedRowsForDate}</li>
        </ul>
      </details>
    </div>
  );
}

export function HolidaysPage() {
  const holidays = useLiveCollection<CompanyHoliday>('companyHolidays');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const readOnly = role === 'Salesperson' || role === 'Installation Team';
  const [d, setD] = useState(() => new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState('');
  const holHeader = useMemo(
    () => ({
      title: 'Company holidays',
      subtitle: 'Used as hints on attendance (non-blocking)',
    }),
    []
  );
  usePageHeader(holHeader);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const list = getCollection<CompanyHoliday>('companyHolidays');
    setCollection('companyHolidays', [
      ...list,
      { id: generateId('hol'), date: d, label: label.trim(), createdAt: new Date().toISOString() },
    ]);
    setLabel('');
    bump();
    show('Holiday added', 'success');
  }

  function remove(id: string) {
    setCollection(
      'companyHolidays',
      getCollection<CompanyHoliday>('companyHolidays').filter((h) => h.id !== id)
    );
    bump();
    show('Removed', 'info');
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card padding="md">
          <form className="flex flex-wrap items-end gap-3" onSubmit={add}>
            <label className="text-sm">
              Date
              <input type="date" className="input-shell mt-1" value={d} onChange={(e) => setD(e.target.value)} />
            </label>
            <label className="text-sm">
              Label
              <input className="input-shell mt-1" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Diwali" />
            </label>
            <ShellButton type="submit" variant="primary">
              Add
            </ShellButton>
          </form>
        </Card>
      )}
      <Card padding="none" className="overflow-hidden">
        <ul className="divide-y divide-border text-sm">
          {[...holidays]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((h) => (
              <li key={h.id} className="flex items-center justify-between px-4 py-3">
                <span>
                  <span className="font-medium text-foreground">{h.date}</span> — {h.label}
                </span>
                {!readOnly && (
                  <ShellButton type="button" variant="ghost" size="sm" onClick={() => remove(h.id)}>
                    Remove
                  </ShellButton>
                )}
              </li>
            ))}
          {holidays.length === 0 && <li className="px-4 py-6 text-muted-foreground">No holidays yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

export function DeploymentPage() {
  const tasks = useLiveCollection<Task>('tasks');
  const users = useLiveCollection<User>('users');
  const projects = useLiveCollection<Project>('projects');
  const depHeader = useMemo(
    () => ({
      title: 'Deployment (7-day tasks)',
      subtitle: 'Tasks due in the next week by assignee',
    }),
    []
  );
  usePageHeader(depHeader);

  const today = new Date().toISOString().slice(0, 10);
  const endD = new Date();
  endD.setDate(endD.getDate() + 7);
  const windowEnd = endD.toISOString().slice(0, 10);
  const upcoming = tasks.filter((t) => t.dueDate >= today && t.dueDate <= windowEnd);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm text-muted-foreground">
          Window: {today} → {windowEnd} · {upcoming.length} task(s)
        </p>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Task</th>
                <th className="px-3 py-2 text-left">Due</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-left">Assignees</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2">{t.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.dueDate}</td>
                  <td className="px-3 py-2 text-muted-foreground">{projects.find((p) => p.id === t.projectId)?.name ?? t.projectId}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.assignedTo.map((id) => users.find((u) => u.id === id)?.name ?? id).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {upcoming.length === 0 && <p className="p-4 text-muted-foreground">No tasks in range.</p>}
        </div>
      </Card>
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
  const now = new Date();
  const [ym, setYm] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || now.getFullYear();
  const m = Number(mStr) || now.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;

  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUserId, setSlipUserId] = useState<string | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const [slipPdfBusy, setSlipPdfBusy] = useState(false);
  const companyProfile = getItem<CompanyProfile>('companyProfile');

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

  async function downloadSlipPdf() {
    if (!slipRef.current || !slipUser) return;
    setSlipPdfBusy(true);
    try {
      const safe = slipUser.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'employee';
      await exportDomToPdf(slipRef.current, `${safe}-salary-slip-${prefix}.pdf`);
    } finally {
      setSlipPdfBusy(false);
    }
  }

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
      <Card padding="md">
        <label className="text-sm font-medium text-foreground">
          Payroll month{' '}
          <input type="month" className="input-shell mt-1 max-w-xs" value={ym} onChange={(e) => setYm(e.target.value)} />
        </label>
      </Card>
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <ShellButton
                type="button"
                variant="primary"
                disabled={slipPdfBusy}
                onClick={() => void downloadSlipPdf()}
              >
                {slipPdfBusy ? 'Building PDF…' : 'Download PDF'}
              </ShellButton>
            </div>
            <div
              ref={slipRef}
              className="max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-8 text-left text-[13px] leading-relaxed text-neutral-900 shadow-inner dark:border-neutral-300"
            >
              <p className="text-xl font-bold tracking-tight">{companyProfile?.name ?? 'Company name'}</p>
              {companyProfile?.address && <p className="mt-1 text-xs text-neutral-600">{companyProfile.address}</p>}
              {companyProfile?.gst && (
                <p className="mt-0.5 text-xs text-neutral-600">GST: {companyProfile.gst}</p>
              )}
              <p className="mt-6 border-b border-neutral-200 pb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Salary statement
              </p>
              <p className="mt-3">
                <span className="text-neutral-600">Pay period:</span>{' '}
                <span className="font-medium">{prefix}</span>
              </p>
              <p className="mt-4 text-base font-semibold text-neutral-900">{slipUser.name}</p>
              <p className="text-xs text-neutral-600">
                {slipUser.role}
                {slipUser.email ? ` · ${slipUser.email}` : ''}
              </p>
              <table className="mt-6 w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Monthly salary</td>
                    <td className="py-2 text-right font-medium">{formatINRDecimal(slipUser.salary)}</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Working days basis</td>
                    <td className="py-2 text-right">{WORKING_DAYS_PER_MONTH} days / month</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Per-day rate</td>
                    <td className="py-2 text-right font-medium">{formatINRDecimal(perDayRate(slipUser.salary))}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Attendance (month)</p>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Days present</td>
                    <td className="py-2 text-right font-medium">{slipRow.present}</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Paid leave</td>
                    <td className="py-2 text-right">{slipRow.pl}</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-600">Absent</td>
                    <td className="py-2 text-right">{slipRow.absent}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-6 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                <span className="text-sm font-semibold text-neutral-800">Net payable (estimate)</span>
                <span className="text-lg font-bold text-neutral-900">{formatINRDecimal(slipRow.net)}</span>
              </p>
              <p className="mt-8 border-t border-neutral-100 pt-4 text-[10px] leading-snug text-neutral-500">
                This is a prototype preview for internal use only. It is not a statutory payslip and does not replace
                formal payroll or tax documents.
              </p>
              <p className="mt-2 text-[10px] text-neutral-400">Generated {new Date().toLocaleString()} · MMS</p>
            </div>
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
  const progressStepRaw = search.get('progressStep');
  const progressStepNameQ = search.get('progressStepName') ?? '';
  const progressStepFromUrl: Task['progressStep'] | undefined =
    progressStepRaw && /^[1-7]$/.test(progressStepRaw) ? (Number(progressStepRaw) as Task['progressStep']) : undefined;

  const [projectId, setProjectId] = useState(defaultPid);
  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [kind, setKind] = useState<'Task' | 'Ticket'>('Task');
  const [taskType, setTaskType] = useState<NonNullable<Task['taskType']>>('work');
  const [assignees, setAssignees] = useState<string[]>([]);

  const proj = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);

  useEffect(() => {
    if (!progressStepFromUrl || !progressStepNameQ) return;
    const decoded = decodeURIComponent(progressStepNameQ);
    setTitle((prev) =>
      prev.trim() ? prev : `Step ${progressStepFromUrl}: ${decoded} — `
    );
  }, [progressStepFromUrl, progressStepNameQ]);

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
      taskType: kind === 'Task' ? taskType : undefined,
      progressStep: kind === 'Task' ? progressStepFromUrl : undefined,
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
        {kind === 'Task' && (
          <label className="block text-sm font-medium text-foreground">
            Task type
            <select
              className="select-shell mt-1 w-full"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as NonNullable<Task['taskType']>)}
            >
              <option value="work">Work on site</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
            </select>
          </label>
        )}
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

const TASK_STATUS_FILTERS = ['Pending', 'In Progress', 'Overdue', 'Completed'] as const;

export function TasksList() {
  const tasks = useLiveCollection<Task>('tasks');
  const projects = useLiveCollection<{ id: string; name: string }>('projects');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');

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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (qq && !t.title.toLowerCase().includes(qq) && !(t.description ?? '').toLowerCase().includes(qq)) return false;
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (statusFilter && taskEffectiveStatus(t) !== statusFilter) return false;
      return true;
    });
  }, [tasks, q, projectFilter, statusFilter]);

  function statusBadgeClass(eff: string) {
    if (eff === 'Completed') return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
    if (eff === 'Overdue') return 'bg-destructive/15 text-destructive';
    if (eff === 'In Progress') return 'bg-primary/15 text-primary';
    return 'bg-muted text-muted-foreground';
  }

  return (
    <div className="space-y-4">
      <Card padding="md" className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="block min-w-[12rem] flex-1 text-sm font-medium text-foreground">
          Search
          <input
            className="input-shell mt-1 w-full"
            placeholder="Title or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="block min-w-[10rem] text-sm font-medium text-foreground">
          Status
          <select
            className="select-shell mt-1 w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {TASK_STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[12rem] text-sm font-medium text-foreground">
          Project
          <select
            className="select-shell mt-1 w-full"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <DataTableShell>
        <table className={dataTableClasses}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Status</th>
              <th>Due</th>
              <th>Step</th>
              <th>Kind</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const eff = taskEffectiveStatus(t);
              const projName = projects.find((p) => p.id === t.projectId)?.name ?? '—';
              return (
                <tr key={t.id}>
                  <td>
                    <Link to={`/hr/tasks/${t.id}`} className="font-medium text-primary hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{projName}</td>
                  <td>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadgeClass(eff)
                      )}
                    >
                      {eff}
                    </span>
                  </td>
                  <td className="text-muted-foreground whitespace-nowrap">{t.dueDate}</td>
                  <td className="text-muted-foreground">
                    {t.progressStep != null ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Step {t.progressStep}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-muted-foreground">
                    {t.kind === 'Ticket' ? 'Ticket' : 'Task'}
                    {t.taskType ? ` · ${t.taskType}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No tasks match your filters.</p>
      )}
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

  const overdue = taskEffectiveStatus(task) === 'Overdue' && task.status !== 'Completed';

  return (
    <div className="space-y-4">
      {overdue && (
        <Card padding="md" className="border-amber-500/40 bg-amber-500/10">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
            Past due date ({task.dueDate}). Update status or extend the due date from the task list when editing is added.
          </p>
        </Card>
      )}
      <Card padding="md">
        <p className="text-sm text-muted-foreground">{task.description || 'No description.'}</p>
        {task.progressStep != null && (
          <p className="mt-2 text-sm font-medium text-foreground">
            Linked timeline step: <span className="text-primary">Step {task.progressStep}</span>
          </p>
        )}
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
          {(['Pending', 'In Progress', 'Overdue', 'Completed'] as const).map((s) => (
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
