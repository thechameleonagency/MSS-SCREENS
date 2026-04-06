import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTableShell, dataTableClasses, listTableBodyMaxHeight } from '../../components/DataTableShell';
import {
  ListPageFiltersLayout,
  listPageStatChipButtonClass,
  listPageStatChipInner,
  listPageStatChipLabel,
} from '../../components/ListPageFiltersLayout';
import { TablePaginationBar, TABLE_DEFAULT_PAGE_SIZE } from '../../components/TablePaginationBar';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '../../components/icons';
import { cn } from '../../lib/utils';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { defaultExpenseTagForRole, formatINRDecimal, perDayRate, taskEffectiveStatus, WORKING_DAYS_PER_MONTH } from '../../lib/helpers';
import { filterSitesForAttendance, projectIsActivePipeline, projectIsCompletedClosed } from '../../lib/siteEligibility';
import { downloadCsv } from '../../lib/csvDownload';
import { exportDomToPdf } from '../../lib/pdfExport';
import { TASK_PROJECT_ENQUIRY_PLACEHOLDER } from '../../lib/enquiryConstants';
import { generateId, getCollection, getItem, setCollection } from '../../lib/storage';
import type {
  Attendance,
  CompanyHoliday,
  CompanyProfile,
  EmployeeExpense,
  Enquiry,
  PayrollRecord,
  Project,
  Site,
  Task,
  User,
} from '../../types';
import { EmployeeForm, type EmployeeFormSavePayload } from './EmployeeForm';

const EMP_ROLE_FILTER_W = '12rem';

function maskAadhaarDigits(d?: string) {
  const x = (d ?? '').replace(/\D/g, '');
  if (x.length !== 12) return d?.trim() || '—';
  return `XXXX XXXX ${x.slice(-4)}`;
}

function isImageUrl(s: string) {
  return s.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(s);
}

function DocReadCard({ label, url }: { label: string; url: string }) {
  if (!url.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        {label} — not uploaded
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
          {isImageUrl(url) ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-[10px] text-muted-foreground">File / link</span>
          )}
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
          Open
        </a>
      </div>
    </div>
  );
}

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Stay', 'Medical', 'Transport', 'Other'] as const;

/** Matches monthly grid / letters on Attendance (monthly) page. */
const DAY_LETTER: Record<Attendance['status'], string> = {
  Present: 'P',
  'Paid Leave': 'L',
  Absent: 'A',
};

/** v1 quota until persisted on User — see plan. */
const PAID_LEAVE_QUOTA_PER_MONTH = 1;

const SITE_DOT_PALETTE = [
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-cyan-600',
  'bg-fuchsia-500',
  'bg-lime-600',
  'bg-orange-500',
  'bg-indigo-500',
] as const;

function hashStringToPaletteIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

function siteDotClass(siteId: string) {
  return SITE_DOT_PALETTE[hashStringToPaletteIndex(siteId, SITE_DOT_PALETTE.length)] ?? 'bg-muted-foreground';
}

function sitesForAttendanceRecord(a: Attendance): string[] {
  if (a.siteIds?.length) return [...new Set(a.siteIds)];
  if (a.siteId) return [a.siteId];
  return [];
}

function lastThreeCalendarMonthsFrom(today: Date): { y: number; m: number }[] {
  const out: { y: number; m: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  return out;
}

function daysInCalendarMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function countWeekdaysExcludingSunday(y: number, m: number) {
  const dim = daysInCalendarMonth(y, m);
  let n = 0;
  for (let d = 1; d <= dim; d++) {
    const wd = new Date(y, m - 1, d).getDay();
    if (wd !== 0) n++;
  }
  return n;
}

function prevPayrollMonthPrefix(ym: string) {
  const parts = ym.split('-');
  const ys = Number(parts[0]) || new Date().getFullYear();
  const ms = Number(parts[1]) || 1;
  const d = new Date(ys, ms - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function userInitialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Card strip on Attendance: present days × per-day rate for selected month (same net as Payroll page);
 * last month pending from unpaid PayrollRecord or estimated from prior month present count.
 */
function attendanceCardStats(
  u: User,
  ymPrefix: string,
  attendance: Attendance[],
  payrollRecords: PayrollRecord[],
  holRows: CompanyHoliday[]
) {
  const ymp = ymPrefix.split('-');
  const y = Number(ymp[0]) || new Date().getFullYear();
  const m = Number(ymp[1]) || 1;
  const monthAtt = attendance.filter((a) => a.employeeId === u.id && a.date.startsWith(ymPrefix));
  const present = monthAtt.filter((a) => a.status === 'Present').length;
  const paidLeaveUsed = monthAtt.filter((a) => a.status === 'Paid Leave').length;
  const holCount = holRows.filter((h) => h.date.startsWith(ymPrefix)).length;
  const workingDays = Math.max(0, countWeekdaysExcludingSunday(y, m) - holCount);
  const rate = perDayRate(u.salary);
  const currentEarnings = rate * present;
  const prevPrefix = prevPayrollMonthPrefix(ymPrefix);
  const prevRec = payrollRecords.find((r) => r.employeeId === u.id && r.month === prevPrefix);
  let lastMonthPending = 0;
  if (prevRec) {
    lastMonthPending = prevRec.paid ? 0 : prevRec.netPayable;
  } else {
    const prevPresent = attendance.filter(
      (a) => a.employeeId === u.id && a.date.startsWith(prevPrefix) && a.status === 'Present'
    ).length;
    lastMonthPending = rate * prevPresent;
  }
  const totalPayable = currentEarnings + lastMonthPending;
  const leaveAvail = Math.max(0, PAID_LEAVE_QUOTA_PER_MONTH - paidLeaveUsed);
  return {
    present,
    paidLeaveUsed,
    workingDays,
    currentEarnings,
    lastMonthPending,
    totalPayable,
    leaveAvail,
    paidLeaveQuota: PAID_LEAVE_QUOTA_PER_MONTH,
  };
}

export function EmployeesList() {
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [addFormKey, setAddFormKey] = useState(0);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusChip, setStatusChip] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);

  const statusCounts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const u of users) {
      if (u.employmentStatus === 'Inactive') inactive += 1;
      else active += 1;
    }
    return { total: users.length, active, inactive };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const effStatus = u.employmentStatus ?? 'Active';
      const matchStatus =
        statusChip === 'all' ||
        (statusChip === 'Active' && effStatus === 'Active') ||
        (statusChip === 'Inactive' && effStatus === 'Inactive');
      const matchQ =
        !qq ||
        u.name.toLowerCase().includes(qq) ||
        (u.email ?? '').toLowerCase().includes(qq) ||
        (u.phone ?? '').includes(q.replace(/\D/g, '')) ||
        (u.phone ?? '').toLowerCase().includes(qq);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchTag = !tagFilter || u.expenseTag === tagFilter;
      return matchStatus && matchQ && matchRole && matchTag;
    });
  }, [users, q, roleFilter, tagFilter, statusChip]);

  useEffect(() => {
    setPage(1);
  }, [filteredUsers.length, pageSize, q, roleFilter, tagFilter, statusChip]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filteredUsers.slice(s, s + pageSize);
  }, [filteredUsers, page, pageSize]);

  const salaryTotal = useMemo(() => filteredUsers.reduce((s, u) => s + (u.salary ?? 0), 0), [filteredUsers]);

  const tagOptions = useMemo(() => {
    const s = new Set(users.map((u) => u.expenseTag).filter(Boolean));
    return [...s].sort();
  }, [users]);

  const empHeader = useMemo(
    () => ({
      title: 'Employees',
      subtitle: `Team roster · ${filteredUsers.length} in view · combined salary ${formatINRDecimal(salaryTotal)}`,
      actions: (
        <ShellButton
          type="button"
          variant="primary"
          onClick={() => {
            setAddFormKey((k) => k + 1);
            setOpen(true);
          }}
        >
          Add employee
        </ShellButton>
      ),
      filtersToolbar: (
        <ListPageFiltersLayout
          primary={
            <>
              <input
                className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink"
                placeholder="Name, email, phone…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search employees"
              />
              <label className="flex flex-col gap-1">
                <span className="sr-only">Role</span>
                <select
                  className="select-shell h-10 shrink-0"
                  style={{ width: EMP_ROLE_FILTER_W }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter by role"
                >
                  <option value="">All roles</option>
                  {(['Super Admin', 'Admin', 'CEO', 'Management', 'Salesperson', 'Installation Team'] as const).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="sr-only">Expense tag</span>
                <select
                  className="select-shell h-10 min-w-[10rem] shrink-0"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  aria-label="Filter by expense tag"
                >
                  <option value="">All tags</option>
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </>
          }
          secondary={
            <>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={statusChip === 'all'}
                onClick={() => setStatusChip('all')}
              >
                <span className={listPageStatChipInner(statusChip === 'all')}>
                  <span className={listPageStatChipLabel(statusChip === 'all')}>Total</span>
                  <span className="tabular-nums text-foreground">{statusCounts.total}</span>
                </span>
              </button>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={statusChip === 'Active'}
                onClick={() => setStatusChip('Active')}
              >
                <span className={listPageStatChipInner(statusChip === 'Active')}>
                  <span className={listPageStatChipLabel(statusChip === 'Active')}>Active</span>
                  <span className="tabular-nums text-foreground">{statusCounts.active}</span>
                </span>
              </button>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={statusChip === 'Inactive'}
                onClick={() => setStatusChip('Inactive')}
              >
                <span className={listPageStatChipInner(statusChip === 'Inactive')}>
                  <span className={listPageStatChipLabel(statusChip === 'Inactive')}>Inactive</span>
                  <span className="tabular-nums text-foreground">{statusCounts.inactive}</span>
                </span>
              </button>
            </>
          }
        />
      ),
    }),
    [filteredUsers.length, salaryTotal, q, roleFilter, tagFilter, tagOptions, statusChip, statusCounts]
  );
  usePageHeader(empHeader);

  function saveNewEmployee(payload: EmployeeFormSavePayload) {
    const now = new Date().toISOString();
    const row: User = {
      ...payload,
      expenseTag: defaultExpenseTagForRole(payload.role),
      createdAt: now,
      updatedAt: now,
    };
    setCollection('users', [...getCollection<User>('users'), row]);
    bump();
    setOpen(false);
    show('Employee added', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <DataTableShell bare bodyMaxHeight={listTableBodyMaxHeight(pageSize)}>
          <table className={dataTableClasses}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Tag</th>
                <th>Salary</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-foreground">{u.name}</td>
                  <td className="text-muted-foreground">{u.role}</td>
                  <td className="text-muted-foreground">
                    {(u.employmentStatus ?? 'Active') === 'Inactive' ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">Inactive</span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-200">Active</span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{u.expenseTag}</td>
                  <td className="text-muted-foreground">{formatINRDecimal(u.salary)}</td>
                  <td>
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/hr/employees/${u.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredUsers.length > 0 && (
              <tfoot>
                <tr className="font-medium text-foreground">
                  <td colSpan={4} className="py-2 text-muted-foreground">
                    Totals ({filteredUsers.length} employees)
                  </td>
                  <td className="py-2 tabular-nums">{formatINRDecimal(salaryTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </DataTableShell>
      </Card>
      {filteredUsers.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <TablePaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filteredUsers.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
      <Modal open={open} title="Add employee" onClose={() => setOpen(false)} wide>
        {open ? (
          <EmployeeForm key={addFormKey} mode="create" onCancel={() => setOpen(false)} onSave={saveNewEmployee} />
        ) : null}
      </Modal>
    </div>
  );
}

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const tasks = useLiveCollection<Task>('tasks');
  const employeeExpenses = useLiveCollection<EmployeeExpense>('employeeExpenses');
  const payrollRecords = useLiveCollection<PayrollRecord>('payrollRecords');
  const projects = useLiveCollection<Project>('projects');
  const sites = useLiveCollection<Site>('sites');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const u = users.find((x) => x.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [hubDateFrom, setHubDateFrom] = useState('');
  const [hubDateTo, setHubDateTo] = useState('');
  const [expenseCatFilter, setExpenseCatFilter] = useState('');

  const inHubRange = useMemo(
    () => (isoDate: string) => {
      const day = isoDate.slice(0, 10);
      if (hubDateFrom && day < hubDateFrom) return false;
      if (hubDateTo && day > hubDateTo) return false;
      return true;
    },
    [hubDateFrom, hubDateTo]
  );

  const siteName = useCallback((sid?: string) => sites.find((s) => s.id === sid)?.name ?? sid ?? '—', [sites]);

  const projectLabel = useCallback(
    (t: Task) => {
      if (t.projectId === TASK_PROJECT_ENQUIRY_PLACEHOLDER && t.enquiryId) {
        return `Enquiry · ${enquiries.find((e) => e.id === t.enquiryId)?.customerName ?? 'Follow-up'}`;
      }
      return projects.find((p) => p.id === t.projectId)?.name ?? '—';
    },
    [projects, enquiries]
  );

  const edHeader = useMemo(() => {
    const row = users.find((x) => x.id === id);
    if (!row) {
      return {
        title: 'Employee',
        subtitle: '',
        actions: (
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/hr/employees')}>
            All employees
          </ShellButton>
        ),
      };
    }
    const st = row.employmentStatus ?? 'Active';
    return {
      title: row.name,
      subtitle: `${row.jobTitle || row.role} · ${st} · ${row.expenseTag}`,
      breadcrumbs: [
        { label: 'Home', to: '/dashboard' },
        { label: 'Employees', to: '/hr/employees' },
        { label: row.name },
      ],
      actions: (
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => navigate('/hr/employees')}>
            All employees
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={() => setEditOpen(true)}>
            Edit
          </ShellButton>
        </div>
      ),
    };
  }, [id, users, navigate]);
  usePageHeader(edHeader);

  function saveEdit(payload: EmployeeFormSavePayload) {
    const list = getCollection<User>('users');
    const prev = list.find((x) => x.id === payload.id);
    if (!prev) return;
    const next: User = {
      ...payload,
      expenseTag: defaultExpenseTagForRole(payload.role),
      createdAt: prev.createdAt,
      updatedAt: new Date().toISOString(),
    };
    setCollection(
      'users',
      list.map((x) => (x.id === payload.id ? next : x))
    );
    bump();
    setEditOpen(false);
    show('Employee updated', 'success');
  }

  const myAttendance = useMemo(() => {
    if (!u) return [];
    return attendance
      .filter((a) => a.employeeId === u.id && inHubRange(a.date))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [u, attendance, inHubRange]);

  const myTasks = useMemo(() => {
    if (!u) return [];
    return tasks
      .filter((t) => t.assignedTo.includes(u.id) && inHubRange(t.dueDate))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [u, tasks, inHubRange]);

  const myExpenses = useMemo(() => {
    if (!u) return [];
    return employeeExpenses
      .filter(
        (e) =>
          e.employeeId === u.id &&
          inHubRange(e.date) &&
          (!expenseCatFilter || e.category === expenseCatFilter)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [u, employeeExpenses, inHubRange, expenseCatFilter]);

  const expenseTotal = useMemo(() => myExpenses.reduce((s, e) => s + e.amount, 0), [myExpenses]);

  const myPayroll = useMemo(() => {
    if (!u) return [];
    return payrollRecords
      .filter((r) => {
        if (r.employeeId !== u.id) return false;
        const anchor = (r.paidDate ?? r.createdAt).slice(0, 10);
        return inHubRange(anchor);
      })
      .sort((a, b) => b.year - a.year || String(b.month).localeCompare(String(a.month)));
  }, [u, payrollRecords, inHubRange]);

  const adjustmentsFiltered = useMemo(() => {
    if (!u) return [];
    return (u.salaryAdjustments ?? []).filter((adj) => inHubRange(adj.date));
  }, [u, inHubRange]);

  const [dayDrillIso, setDayDrillIso] = useState<string | null>(null);

  const attendanceForThreeMonths = useMemo(() => {
    if (!u) return [];
    const blocks = lastThreeCalendarMonthsFrom(new Date());
    const first = blocks[0]!;
    const last = blocks[2]!;
    const start = `${first.y}-${String(first.m).padStart(2, '0')}-01`;
    const endDay = daysInCalendarMonth(last.y, last.m);
    const end = `${last.y}-${String(last.m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    return attendance
      .filter((a) => a.employeeId === u.id && a.date >= start && a.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [u, attendance]);

  const attByDay = useMemo(() => {
    const m = new Map<string, Attendance>();
    for (const a of attendanceForThreeMonths) {
      m.set(a.date.slice(0, 10), a);
    }
    return m;
  }, [attendanceForThreeMonths]);

  const sitesInCalendarWindow = useMemo(() => {
    const s = new Set<string>();
    for (const a of attendanceForThreeMonths) {
      if (a.status !== 'Present') continue;
      for (const sid of sitesForAttendanceRecord(a)) s.add(sid);
    }
    return [...s];
  }, [attendanceForThreeMonths]);

  const drillTasks = useMemo(() => {
    if (!dayDrillIso || !u) return [];
    return tasks.filter((t) => t.assignedTo.includes(u.id) && t.dueDate.slice(0, 10) === dayDrillIso);
  }, [dayDrillIso, u, tasks]);

  const drillExpenses = useMemo(() => {
    if (!dayDrillIso || !u) return [];
    return employeeExpenses.filter((e) => e.employeeId === u.id && e.date === dayDrillIso);
  }, [dayDrillIso, u, employeeExpenses]);

  if (!u) return <p className="text-muted-foreground">Not found</p>;
  const emp = u;

  const initials = emp.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const photo = emp.documents.photo;
  const effStatus = emp.employmentStatus ?? 'Active';

  function exportAttendanceCsv() {
    downloadCsv(
      `attendance-${emp.name.replace(/\s+/g, '_')}.csv`,
      ['Date', 'Status', 'Sites'],
      myAttendance.map((a) => [
        a.date,
        a.status,
        (a.siteIds?.length ? a.siteIds : a.siteId ? [a.siteId] : []).map((sid) => siteName(sid)).join('; '),
      ])
    );
  }

  function exportTasksCsv() {
    downloadCsv(
      `tasks-${emp.name.replace(/\s+/g, '_')}.csv`,
      ['Title', 'Project', 'Status', 'Due', 'Kind'],
      myTasks.map((t) => [t.title, projectLabel(t), taskEffectiveStatus(t), t.dueDate, t.kind === 'Ticket' ? 'Ticket' : 'Task'])
    );
  }

  function exportExpensesCsv() {
    downloadCsv(
      `expenses-${emp.name.replace(/\s+/g, '_')}.csv`,
      ['Date', 'Category', 'Amount', 'Project', 'Mode', 'Notes'],
      myExpenses.map((e) => [
        e.date,
        e.category,
        String(e.amount),
        e.projectId ? projects.find((p) => p.id === e.projectId)?.name ?? e.projectId : '—',
        e.paymentMode,
        e.notes ?? '',
      ])
    );
  }

  function exportPayrollCsv() {
    downloadCsv(
      `payroll-${emp.name.replace(/\s+/g, '_')}.csv`,
      ['Month', 'Year', 'Net payable', 'Paid', 'Paid date'],
      myPayroll.map((r) => [r.month, String(r.year), String(r.netPayable), r.paid ? 'Yes' : 'No', r.paidDate ?? ''])
    );
  }

  function exportAdjustmentsCsv() {
    downloadCsv(
      `salary-adjustments-${emp.name.replace(/\s+/g, '_')}.csv`,
      ['Date', 'Kind', 'Amount (₹)', 'Notes'],
      adjustmentsFiltered.map((a) => [a.date, a.kind, String(a.amountInr), a.notes ?? ''])
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold text-foreground">
          {photo && isImageUrl(photo) ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{emp.name}</h1>
            {effStatus === 'Inactive' ? (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">Inactive</span>
            ) : (
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{emp.jobTitle || emp.role}</p>
          <p className="text-xs text-muted-foreground">
            Per-day rate (÷{WORKING_DAYS_PER_MONTH}): {formatINRDecimal(perDayRate(emp.salary))}
          </p>
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Basic information</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="text-foreground">{emp.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Alternate phone</dt>
            <dd className="text-foreground">{emp.alternatePhone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Work email</dt>
            <dd className="text-foreground">{emp.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Portal username</dt>
            <dd className="text-foreground">{emp.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Password</dt>
            <dd className="text-foreground">•••••••• — change via Edit employee</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Aadhaar number</dt>
            <dd className="text-foreground">{maskAadhaarDigits(emp.aadhaarNumber)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date of birth</dt>
            <dd className="text-foreground">{emp.dob ? emp.dob.slice(0, 10) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd className="text-foreground">{emp.address || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Salary / month</dt>
            <dd className="text-foreground">{formatINRDecimal(emp.salary)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Joining date</dt>
            <dd className="text-foreground">{emp.joiningDate ? emp.joiningDate.slice(0, 10) : '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Documents</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DocReadCard label="Aadhaar card" url={emp.documents.aadhaar} />
          <DocReadCard label="Photo" url={emp.documents.photo} />
          <DocReadCard label="PAN" url={emp.documents.pan} />
          <DocReadCard label="Offer letter" url={emp.documents.offerLetter} />
        </div>
        {(emp.otherDocuments ?? []).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">Other uploads</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(emp.otherDocuments ?? []).map((od) => (
                <div
                  key={od.id}
                  className="relative flex w-28 flex-col overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="flex h-20 items-center justify-center bg-muted/30">
                    {od.dataUrl && isImageUrl(od.dataUrl) ? (
                      <img src={od.dataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="px-1 text-[10px] text-muted-foreground">File</span>
                    )}
                  </div>
                  <p className="truncate px-1 py-1 text-[10px] text-foreground">{od.label ?? 'Document'}</p>
                  {od.dataUrl ? (
                    <a
                      href={od.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border-t border-border py-1 text-center text-[10px] text-primary hover:underline"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card padding="md" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Filters (HR & Finance tables)</h2>
        <p className="text-xs text-muted-foreground">Date range applies to attendance, tasks (due date), expenses, and payroll rows.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-foreground">
            From
            <input
              type="date"
              className="input-shell mt-1 block h-10"
              value={hubDateFrom}
              onChange={(e) => setHubDateFrom(e.target.value)}
            />
          </label>
          <label className="text-xs font-medium text-foreground">
            To
            <input type="date" className="input-shell mt-1 block h-10" value={hubDateTo} onChange={(e) => setHubDateTo(e.target.value)} />
          </label>
          <label className="text-xs font-medium text-foreground">
            Expense category
            <select
              className="select-shell mt-1 block h-10 min-w-[10rem]"
              value={expenseCatFilter}
              onChange={(e) => setExpenseCatFilter(e.target.value)}
            >
              <option value="">All</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Attendance (last 3 months)</h2>
          <ShellButton type="button" variant="secondary" size="sm" onClick={exportAttendanceCsv}>
            Export CSV (table filters)
          </ShellButton>
        </div>
        <p className="text-xs text-muted-foreground">
          Day grid shows the rolling last three calendar months. Tap a day for tasks (due that day) and expenses. CSV export still
          uses the date range in filters above.
        </p>
        {sitesInCalendarWindow.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border/60 pb-3">
            <p className="w-full text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sites</p>
            {sitesInCalendarWindow.map((sid) => (
              <div key={sid} className="flex items-center gap-2 text-xs text-foreground">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', siteDotClass(sid))} />
                <span className="max-w-[12rem] truncate">{siteName(sid)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-5">
          {lastThreeCalendarMonthsFrom(new Date()).map((block) => {
            const dim = daysInCalendarMonth(block.y, block.m);
            const label = new Date(block.y, block.m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
            return (
              <div key={`${block.y}-${block.m}`}>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <div className="mt-2 overflow-x-auto pb-1">
                  <div className="flex w-max gap-0.5">
                    {Array.from({ length: dim }, (_, i) => {
                      const d = i + 1;
                      const iso = `${block.y}-${String(block.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const rec = attByDay.get(iso);
                      const letter = rec ? DAY_LETTER[rec.status] : '—';
                      const dots = rec && rec.status === 'Present' ? sitesForAttendanceRecord(rec) : [];
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setDayDrillIso(iso)}
                          className="flex min-w-[1.35rem] flex-col items-center gap-0.5 rounded border border-transparent px-0.5 py-1 text-center hover:border-border hover:bg-muted/40"
                        >
                          <span className="text-[8px] tabular-nums text-muted-foreground">{d}</span>
                          <span className="text-[10px] font-semibold tabular-nums text-foreground">{letter}</span>
                          {dots.length > 0 ? (
                            <span className="flex max-w-[1.25rem] flex-wrap justify-center gap-px">
                              {dots.map((sid) => (
                                <span
                                  key={sid}
                                  title={siteName(sid)}
                                  className={cn('h-1.5 w-1.5 shrink-0 rounded-full', siteDotClass(sid))}
                                />
                              ))}
                            </span>
                          ) : (
                            <span className="h-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
          <ShellButton type="button" variant="secondary" size="sm" onClick={exportTasksCsv}>
            Export CSV
          </ShellButton>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Project</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No assigned tasks in range.
                  </td>
                </tr>
              ) : (
                myTasks.map((t) => (
                  <tr key={t.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      <Link to={`/hr/tasks/${t.id}`} className="font-medium text-primary hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{projectLabel(t)}</td>
                    <td className="py-2 pr-4 text-foreground">{taskEffectiveStatus(t)}</td>
                    <td className="py-2 tabular-nums text-muted-foreground">{t.dueDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Expenses</h2>
          <ShellButton type="button" variant="secondary" size="sm" onClick={exportExpensesCsv}>
            Export CSV
          </ShellButton>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Total (filtered): <span className="font-medium text-foreground">{formatINRDecimal(expenseTotal)}</span>
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Project</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {myExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    No expenses in range.
                  </td>
                </tr>
              ) : (
                myExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 tabular-nums text-foreground">{e.date}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{e.category}</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{formatINRDecimal(e.amount)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {e.projectId ? projects.find((p) => p.id === e.projectId)?.name ?? e.projectId : '—'}
                    </td>
                    <td className="py-2 text-muted-foreground">{e.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Salary ledger (payroll)</h2>
          <ShellButton type="button" variant="secondary" size="sm" onClick={exportPayrollCsv}>
            Export CSV
          </ShellButton>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Period</th>
                <th className="py-2 pr-4 font-medium">Net payable</th>
                <th className="py-2 pr-4 font-medium">Paid</th>
                <th className="py-2 font-medium">Paid date</th>
              </tr>
            </thead>
            <tbody>
              {myPayroll.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No payroll rows in range.
                  </td>
                </tr>
              ) : (
                myPayroll.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-foreground">
                      {r.month} · {r.year}
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{formatINRDecimal(r.netPayable)}</td>
                    <td className="py-2 pr-4 text-foreground">{r.paid ? 'Yes' : 'No'}</td>
                    <td className="py-2 tabular-nums text-muted-foreground">{r.paidDate ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Overtime & adjustments</h2>
          <ShellButton type="button" variant="secondary" size="sm" onClick={exportAdjustmentsCsv}>
            Export CSV
          </ShellButton>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {adjustmentsFiltered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No overtime or adjustments recorded for this employee in range.
                  </td>
                </tr>
              ) : (
                adjustmentsFiltered.map((a) => (
                  <tr key={a.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 tabular-nums text-foreground">{a.date}</td>
                    <td className="py-2 pr-4 text-foreground">{a.kind}</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{formatINRDecimal(a.amountInr)}</td>
                    <td className="py-2 text-muted-foreground">{a.notes ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!dayDrillIso}
        title={
          dayDrillIso
            ? new Date(`${dayDrillIso}T12:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Day'
        }
        onClose={() => setDayDrillIso(null)}
        wide
      >
        {dayDrillIso ? (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tasks (due date)</p>
              {drillTasks.length === 0 ? (
                <p className="mt-2 text-muted-foreground">No tasks due this day.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {drillTasks.map((t) => (
                    <li key={t.id} className="rounded-lg border border-border/80 bg-muted/10 px-3 py-2">
                      <p className="font-medium text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{projectLabel(t)} · {taskEffectiveStatus(t)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Expenses</p>
              {drillExpenses.length === 0 ? (
                <p className="mt-2 text-muted-foreground">No expenses logged this day.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {drillExpenses.map((e) => (
                    <li key={e.id} className="rounded-lg border border-border/80 bg-muted/10 px-3 py-2">
                      <p className="font-medium text-foreground">{formatINRDecimal(e.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.category}
                        {e.projectId ? ` · ${projects.find((p) => p.id === e.projectId)?.name ?? e.projectId}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={editOpen} title="Edit employee" onClose={() => setEditOpen(false)} wide>
        {editOpen ? (
          <EmployeeForm key={emp.id} mode="edit" initialUser={emp} onCancel={() => setEditOpen(false)} onSave={saveEdit} />
        ) : null}
      </Modal>
    </div>
  );
}

type AttRow = { status: Attendance['status']; siteId: string; siteIds: string[] };

export function AttendancePage() {
  const users = useLiveCollection<User>('users');
  const attendance = useLiveCollection<Attendance>('attendance');
  const sites = useLiveCollection<Site>('sites');
  const projects = useLiveCollection<Project>('projects');
  const tasks = useLiveCollection<Task>('tasks');
  const employeeExpenses = useLiveCollection<EmployeeExpense>('employeeExpenses');
  const holidays = useLiveCollection<CompanyHoliday>('companyHolidays');
  const payrollRecords = useLiveCollection<PayrollRecord>('payrollRecords');
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
  const [includeCompletedTicketSites, setIncludeCompletedTicketSites] = useState(false);
  const [showCompactTable, setShowCompactTable] = useState(false);
  const [markModal, setMarkModal] = useState<{
    userId: string;
    mode: 'present' | 'paidLeave';
    siteIds: string[];
  } | null>(null);

  const readOnly = role === 'Salesperson';
  const isHoliday = holidays.some((h) => h.date === date);

  const eligibleSites = useMemo(
    () => filterSitesForAttendance(sites, projects, tasks, { includeCompletedWithTickets: includeCompletedTicketSites }),
    [sites, projects, tasks, includeCompletedTicketSites]
  );

  const eligibleIdSet = useMemo(() => new Set(eligibleSites.map((s) => s.id)), [eligibleSites]);

  useEffect(() => {
    const next: Record<string, AttRow> = {};
    users.forEach((u) => {
      const existing = attendance.find((a) => a.employeeId === u.id && a.date === date);
      let siteIds =
        existing?.siteIds?.length
          ? [...existing.siteIds]
          : existing?.siteId
            ? [existing.siteId]
            : eligibleSites[0]
              ? [eligibleSites[0].id]
              : [];
      siteIds = siteIds.filter((id) => eligibleIdSet.has(id));
      if (siteIds.length === 0 && eligibleSites[0]) siteIds = [eligibleSites[0].id];
      next[u.id] = {
        status: existing?.status ?? 'Absent',
        siteId: siteIds[0] ?? '',
        siteIds,
      };
    });
    setRows(next);
  }, [date, users, attendance, eligibleSites, eligibleIdSet]);

  function mark() {
    const markedBy = users[0]?.id ?? 'usr';
    const others = attendance.filter((a) => a.date !== date);
    const allowed = eligibleIdSet;
    const newRows: Attendance[] = Object.entries(rows).map(([employeeId, r]) => {
      const siteIds =
        r.status === 'Present' ? r.siteIds.filter((id) => allowed.has(id)) : [];
      return {
        id: generateId('att'),
        employeeId,
        date,
        status: r.status,
        siteId: r.status === 'Present' ? siteIds[0] ?? undefined : undefined,
        siteIds: r.status === 'Present' && siteIds.length ? siteIds : undefined,
        markedBy,
      };
    });
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

  const ymPrefix = date.slice(0, 7);
  const monthLongTitle = useMemo(() => {
    const p = ymPrefix.split('-');
    const ys = Number(p[0]) || new Date().getFullYear();
    const ms = Number(p[1]) || 1;
    return new Date(ys, ms - 1, 15).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [ymPrefix]);
  const dateLongLabel = useMemo(
    () =>
      new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [date]
  );

  const markModalUser = markModal ? users.find((x) => x.id === markModal.userId) : undefined;
  const paidLeaveSlotsUsedExcludingToday =
    markModalUser === undefined
      ? 0
      : attendance.filter(
          (a) =>
            a.employeeId === markModalUser.id &&
            a.date.startsWith(ymPrefix) &&
            a.status === 'Paid Leave' &&
            a.date !== date
        ).length;
  const paidLeaveBlockedForModal = paidLeaveSlotsUsedExcludingToday >= PAID_LEAVE_QUOTA_PER_MONTH;

  function rowState(u: User) {
    return (
      rows[u.id] ?? {
        status: 'Absent' as const,
        siteId: eligibleSites[0]?.id ?? '',
        siteIds: eligibleSites[0] ? [eligibleSites[0].id] : [],
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

  function openMarkModal(userId: string) {
    const usr = users.find((x) => x.id === userId);
    if (!usr) return;
    const st = rowState(usr);
    let siteIds = st.status === 'Present' ? st.siteIds.filter((id) => eligibleIdSet.has(id)) : [];
    if (siteIds.length === 0 && eligibleSites[0]) siteIds = [eligibleSites[0].id];
    setMarkModal({ userId, mode: 'present', siteIds });
  }

  function confirmMarkModal() {
    if (!markModal) return;
    const uid = markModal.userId;
    if (markModal.mode === 'paidLeave') {
      if (paidLeaveBlockedForModal) {
        show('Paid leave quota exhausted for this month', 'error');
        return;
      }
      setStatus(uid, 'Paid Leave');
      setMarkModal(null);
      return;
    }
    const picked = markModal.siteIds.filter((id) => eligibleIdSet.has(id));
    if (eligibleSites.length > 0 && picked.length === 0) {
      show('Select at least one site', 'error');
      return;
    }
    setRows({
      ...rows,
      [uid]: { status: 'Present', siteId: picked[0] ?? '', siteIds: picked },
    });
    setMarkModal(null);
  }

  function toggleMarkModalSite(sid: string) {
    if (!markModal || markModal.mode !== 'present') return;
    const set = new Set(markModal.siteIds);
    if (set.has(sid)) set.delete(sid);
    else set.add(sid);
    const siteIds = [...set];
    setMarkModal({ ...markModal, siteIds });
  }

  const sitePickers = (u: User) => {
    const state = rowState(u);
    if (state.status !== 'Present' || eligibleSites.length === 0) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <div className="flex max-w-md flex-wrap gap-1.5">
        {eligibleSites.map((s) => {
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
      <Card padding="md" className="border-border/80 bg-card text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Insights · {date}</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
          <span>
            Tasks due: <strong className="text-foreground">{tasksDue}</strong>
          </span>
          <span>
            Employee expenses logged: <strong className="text-foreground">{expensesLogged}</strong>
          </span>
          <span>
            Attendance rows saved for this date: <strong className="text-foreground">{savedRowsForDate}</strong>
          </span>
        </div>
      </Card>

      <Card padding="sm" className="space-y-3 border-border/80 bg-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={includeCompletedTicketSites}
              onChange={(e) => setIncludeCompletedTicketSites(e.target.checked)}
            />
            <span>Allow completed-project sites when a ticket exists for that project/site</span>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-foreground">
              Date
              <input
                type="date"
                className="input-shell mt-1 block h-10 max-w-[11rem]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <ShellButton type="button" variant="ghost" size="sm" onClick={() => setShowCompactTable((v) => !v)}>
              {showCompactTable ? 'Hide compact table' : 'Compact table'}
            </ShellButton>
          </div>
        </div>
        {isHoliday && (
          <p className="text-xs text-amber-700 dark:text-amber-400">Company holiday — still record if teams work.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Sites follow <strong className="text-foreground">active projects</strong> unless the option above is on. Mark the day below,
          then <strong className="text-foreground">Save day</strong> to persist everyone for {date}.
        </p>
        {eligibleSites.length === 0 && (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            No eligible sites — add tasks on active projects or tickets on completed work.
          </p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => {
          const state = rowState(u);
          const stats = attendanceCardStats(u, ymPrefix, attendance, payrollRecords, holidays);
          const eff = u.employmentStatus ?? 'Active';
          const initials = userInitialsFromName(u.name);
          const photo = u.documents.photo;
          const siteLabels = state.siteIds
            .map((sid) => sites.find((s) => s.id === sid)?.name ?? sid)
            .filter(Boolean);
          return (
            <Card key={u.id} padding="md" className="border-border/80">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-foreground">
                  {photo && isImageUrl(photo) ? (
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    {eff === 'Inactive' ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">Inactive</span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.jobTitle || u.role}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{u.phone}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Today ({date})</p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">{state.status}</span>
                    {state.status === 'Present' && siteLabels.length > 0 ? (
                      <span className="text-muted-foreground"> · {siteLabels.join(', ')}</span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Month · {monthLongTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Present <strong className="text-foreground">{stats.present}</strong> · Working days (Mon–Sat − holidays){' '}
                    <strong className="text-foreground">{stats.workingDays}</strong>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Earnings (est.)</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    <li>
                      Current month: <strong className="text-foreground">{formatINRDecimal(stats.currentEarnings)}</strong> (
                      present × per-day rate)
                    </li>
                    <li>
                      Last month pending: <strong className="text-foreground">{formatINRDecimal(stats.lastMonthPending)}</strong>
                    </li>
                    <li className="text-foreground">
                      Total payable: <strong>{formatINRDecimal(stats.totalPayable)}</strong>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Paid leave</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used <strong className="text-foreground">{stats.paidLeaveUsed}</strong> / quota{' '}
                    <strong className="text-foreground">{stats.paidLeaveQuota}</strong> · Available{' '}
                    <strong className="text-foreground">{stats.leaveAvail}</strong>
                  </p>
                </div>
              </div>

              {!readOnly && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                  <ShellButton type="button" variant="primary" size="sm" onClick={() => openMarkModal(u.id)}>
                    Present…
                  </ShellButton>
                  <ShellButton type="button" variant="secondary" size="sm" onClick={() => setStatus(u.id, 'Absent')}>
                    Absent
                  </ShellButton>
                </div>
              )}
            </Card>
          );
        })}
      </div>

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

      {showCompactTable ? (
        <DataTableShell className="overflow-x-auto">
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
      ) : null}

      <Modal open={!!markModal && !!markModalUser} title="Mark attendance" onClose={() => setMarkModal(null)} wide>
        {markModalUser && markModal ? (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{markModalUser.name}</span> · {dateLongLabel}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMarkModal({ ...markModal, mode: 'present' })}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  markModal.mode === 'present'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <p className="font-medium text-foreground">Present at site(s)</p>
                <p className="mt-1 text-xs text-muted-foreground">Pick one or more eligible sites.</p>
              </button>
              <button
                type="button"
                disabled={paidLeaveBlockedForModal}
                onClick={() => setMarkModal({ ...markModal, mode: 'paidLeave' })}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  markModal.mode === 'paidLeave'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40',
                  paidLeaveBlockedForModal && 'cursor-not-allowed opacity-50'
                )}
              >
                <p className="font-medium text-foreground">Paid leave</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paidLeaveBlockedForModal
                    ? 'No paid leave left this month (saved records).'
                    : `Available this month: ${PAID_LEAVE_QUOTA_PER_MONTH - paidLeaveSlotsUsedExcludingToday} of ${PAID_LEAVE_QUOTA_PER_MONTH}`}
                </p>
              </button>
            </div>
            {markModal.mode === 'present' && eligibleSites.length > 0 ? (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/80 p-3">
                <p className="text-xs font-medium text-muted-foreground">Sites</p>
                {eligibleSites.map((s) => {
                  const on = markModal.siteIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={on}
                        onChange={() => toggleMarkModalSite(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
            {markModal.mode === 'present' && eligibleSites.length === 0 ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">No eligible sites for this date.</p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <ShellButton type="button" variant="secondary" onClick={() => setMarkModal(null)}>
                Cancel
              </ShellButton>
              <ShellButton type="button" variant="primary" onClick={confirmMarkModal}>
                Confirm
              </ShellButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function HolidaysPage() {
  const holidays = useLiveCollection<CompanyHoliday>('companyHolidays');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const readOnly = role === 'Salesperson' || role === 'Installation Team';
  const [addOpen, setAddOpen] = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [batchDatesText, setBatchDatesText] = useState('');

  const holHeader = useMemo(
    () => ({
      title: 'Company holidays',
      subtitle: 'Used as hints on attendance (non-blocking)',
      actions: !readOnly ? (
        <ShellButton type="button" variant="primary" onClick={() => setAddOpen(true)}>
          Add holiday
        </ShellButton>
      ) : undefined,
    }),
    [readOnly]
  );
  usePageHeader(holHeader);

  function submitBatchHolidays(e: React.FormEvent) {
    e.preventDefault();
    const lab = batchLabel.trim();
    if (!lab) {
      show('Enter a label for these holidays', 'error');
      return;
    }
    const lines = batchDatesText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const dates = [...new Set(lines)].filter((d) => ISO_DATE_RE.test(d));
    if (dates.length === 0) {
      show('Add at least one valid date (YYYY-MM-DD), one per line', 'error');
      return;
    }
    const list = getCollection<CompanyHoliday>('companyHolidays');
    const now = new Date().toISOString();
    const newRows: CompanyHoliday[] = dates.map((date) => ({
      id: generateId('hol'),
      date,
      label: lab,
      createdAt: now,
    }));
    setCollection('companyHolidays', [...list, ...newRows]);
    bump();
    setBatchLabel('');
    setBatchDatesText('');
    setAddOpen(false);
    show(`Added ${newRows.length} holiday day(s)`, 'success');
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
      <Modal open={addOpen} title="Add holidays" onClose={() => setAddOpen(false)} wide>
        <form className="space-y-4 text-sm" onSubmit={submitBatchHolidays}>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Label (shared for all days) *</span>
            <input
              className="input-shell mt-1 w-full"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="e.g. Diwali break"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Dates *</span>
            <textarea
              className="input-shell mt-1 min-h-[8rem] w-full font-mono text-xs"
              value={batchDatesText}
              onChange={(e) => setBatchDatesText(e.target.value)}
              placeholder={'One date per line (YYYY-MM-DD), e.g.\n2026-10-20\n2026-10-21'}
            />
            <span className="mt-1 block text-xs text-muted-foreground">Duplicates are removed automatically.</span>
          </label>
          <div className="flex justify-end gap-2">
            <ShellButton type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Add days
            </ShellButton>
          </div>
        </form>
      </Modal>
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
  const enquiries = useLiveCollection<Enquiry>('enquiries');
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
  const upcoming = tasks.filter((t) => {
    if (t.dueDate < today || t.dueDate > windowEnd) return false;
    const proj = projects.find((p) => p.id === t.projectId);
    if (!proj) return true;
    const isTicket = t.kind === 'Ticket';
    if (isTicket) return projectIsCompletedClosed(proj.status);
    return projectIsActivePipeline(proj.status);
  });

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
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.projectId === TASK_PROJECT_ENQUIRY_PLACEHOLDER && t.enquiryId
                      ? `Enquiry · ${enquiries.find((e) => e.id === t.enquiryId)?.customerName ?? 'Follow-up'}`
                      : (projects.find((p) => p.id === t.projectId)?.name ?? t.projectId)}
                  </td>
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

  const payrollTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.present += r.present;
        acc.pl += r.pl;
        acc.absent += r.absent;
        acc.net += r.net;
        return acc;
      },
      { present: 0, pl: 0, absent: 0, net: 0 }
    );
  }, [rows]);

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

  function shiftPayrollMonth(delta: number) {
    setYm((cur) => {
      const [ys, ms] = cur.split('-').map(Number);
      const d = new Date(ys || now.getFullYear(), (ms || 1) - 1 + delta, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  const monthTitle = useMemo(
    () =>
      new Date(y, m - 1, 15).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [y, m]
  );

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseSelected, setReleaseSelected] = useState<Set<string>>(() => new Set());
  const [releaseAmounts, setReleaseAmounts] = useState<Record<string, string>>({});

  function openReleaseModal() {
    const nextSel = new Set<string>();
    const nextAmt: Record<string, string> = {};
    for (const r of rows) {
      if (!r.paid) {
        nextSel.add(r.u.id);
        nextAmt[r.u.id] = String(Math.round(r.net));
      }
    }
    setReleaseSelected(nextSel);
    setReleaseAmounts(nextAmt);
    setReleaseOpen(true);
  }

  function toggleReleaseUser(id: string) {
    setReleaseSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function confirmBulkRelease() {
    const list = getCollection<PayrollRecord>('payrollRecords');
    const paidDate = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const withoutSelectedThisMonth = list.filter(
      (r) => !(r.month === prefix && releaseSelected.has(r.employeeId))
    );
    const additions: PayrollRecord[] = [];
    for (const id of releaseSelected) {
      const amt = Number(releaseAmounts[id]);
      if (!Number.isFinite(amt) || amt < 0) continue;
      additions.push({
        id: generateId('pr'),
        employeeId: id,
        month: prefix,
        year: y,
        netPayable: amt,
        paid: true,
        paidDate,
        createdAt: nowIso,
      });
    }
    setCollection('payrollRecords', [...withoutSelectedThisMonth, ...additions]);
    bump();
    setReleaseOpen(false);
    show(`Payroll released for ${additions.length} employee(s)`, 'success');
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

  const payrollMonthOptions = useMemo(() => {
    const anchor = new Date();
    const out: { value: string; label: string }[] = [];
    const y0 = anchor.getFullYear() - 2;
    const y1 = anchor.getFullYear() + 2;
    for (let yy = y0; yy <= y1; yy++) {
      for (let mm = 1; mm <= 12; mm++) {
        const value = `${yy}-${String(mm).padStart(2, '0')}`;
        const label = new Date(yy, mm - 1, 15).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        out.push({ value, label });
      }
    }
    return out;
  }, []);

  usePageHeader({
    title: 'Payroll',
    subtitle: `Per-day = salary ÷ ${WORKING_DAYS_PER_MONTH} · net = present days × per-day rate`,
    actions: (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
            aria-label="Previous month"
            onClick={() => shiftPayrollMonth(-1)}
          >
            <IconChevronLeft size={18} />
          </button>
          <label className="sr-only" htmlFor="payroll-month-select">
            Payroll month
          </label>
          <div className="relative min-w-[10.5rem]">
            <select
              id="payroll-month-select"
              value={ym}
              onChange={(e) => setYm(e.target.value)}
              className={cn(
                'h-9 w-full cursor-pointer appearance-none border-0 border-b-2 border-primary bg-transparent py-1 pl-1 pr-7 text-sm font-semibold text-foreground outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              {payrollMonthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <IconChevronDown
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
              aria-hidden
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
            aria-label="Next month"
            onClick={() => shiftPayrollMonth(1)}
          >
            <IconChevronRight size={18} />
          </button>
        </div>
        {!readOnly ? (
          <ShellButton type="button" variant="primary" onClick={openReleaseModal}>
            Release payroll
          </ShellButton>
        ) : null}
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <Modal open={releaseOpen} title="Release payroll" onClose={() => setReleaseOpen(false)} wide>
        <p className="text-xs text-muted-foreground">
          Select employees and adjust amounts, then confirm. Records update for <strong className="text-foreground">{monthTitle}</strong>.
        </p>
        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {rows.map(({ u, paid }) => (
            <label
              key={u.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm',
                paid && 'opacity-50'
              )}
            >
              <input
                type="checkbox"
                className="rounded border-input"
                checked={releaseSelected.has(u.id)}
                disabled={paid}
                onChange={() => toggleReleaseUser(u.id)}
              />
              <span className="min-w-[8rem] font-medium text-foreground">{u.name}</span>
              <span className="text-xs text-muted-foreground">₹</span>
              <input
                type="number"
                min={0}
                className="input-shell h-9 w-28 text-sm"
                value={releaseAmounts[u.id] ?? ''}
                onChange={(e) => setReleaseAmounts((a) => ({ ...a, [u.id]: e.target.value }))}
                disabled={paid || !releaseSelected.has(u.id)}
              />
              {paid && <span className="text-xs text-muted-foreground">Already paid</span>}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setReleaseOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" onClick={confirmBulkRelease}>
            Confirm release
          </ShellButton>
        </div>
      </Modal>
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
            <th className="px-3 py-2 text-left">Status &amp; actions</th>
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
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('text-xs font-medium', paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground')}>
                    {paid ? 'Paid' : 'Pending'}
                  </span>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/50 font-medium text-foreground">
            <td className="px-3 py-2 text-muted-foreground">Totals ({rows.length})</td>
            <td className="px-3 py-2 tabular-nums">{payrollTotals.present}</td>
            <td className="px-3 py-2 tabular-nums">{payrollTotals.pl}</td>
            <td className="px-3 py-2 tabular-nums">{payrollTotals.absent}</td>
            <td className="px-3 py-2 tabular-nums">{formatINRDecimal(payrollTotals.net)}</td>
            <td className="px-3 py-2 text-xs font-normal text-muted-foreground">
              Net = present × per-day rate
            </td>
          </tr>
        </tfoot>
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

  const taskProjectChoices = useMemo(
    () => projects.filter((p) => projectIsActivePipeline(p.status)),
    [projects]
  );
  const ticketProjectChoices = useMemo(
    () => projects.filter((p) => projectIsCompletedClosed(p.status)),
    [projects]
  );
  const selectableProjects = kind === 'Ticket' ? ticketProjectChoices : taskProjectChoices;

  const proj = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);

  useEffect(() => {
    if (!selectableProjects.some((p) => p.id === projectId)) {
      const next = selectableProjects[0]?.id ?? '';
      if (next !== projectId) setProjectId(next);
    }
  }, [kind, selectableProjects, projectId]);

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
    if (kind === 'Ticket' && proj && !projectIsCompletedClosed(proj.status)) {
      show('Tickets are for completed or closed projects', 'error');
      return;
    }
    if (kind === 'Task' && proj && !projectIsActivePipeline(proj.status)) {
      show('Tasks are for active pipeline projects (New, In Progress, or On Hold)', 'error');
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
            {selectableProjects.length === 0 ? (
              <option value="">No matching projects</option>
            ) : (
              selectableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))
            )}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">
          {kind === 'Task'
            ? 'Only active pipeline projects are listed. Use tickets after completion.'
            : 'Only completed or closed projects are listed for post-completion tickets.'}
        </p>
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
  const projects = useLiveCollection<Project>('projects');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const users = useLiveCollection<User>('users');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'Task' | 'Ticket'>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_DEFAULT_PAGE_SIZE);

  const tasksHeader = useMemo(
    () => ({
      title: 'Tasks',
      subtitle: 'Project work items and post-completion tickets',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => navigate('/hr/tasks/new')}>
          New task
        </ShellButton>
      ),
      filtersToolbar: (
        <ListPageFiltersLayout
          className="lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-x-4 lg:gap-y-3"
          primary={
            <>
              <div className="flex min-w-[12rem] flex-1 flex-col gap-1 lg:max-w-[20rem]">
                <input
                  className="input-shell h-10 w-full"
                  placeholder="Title or description…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search tasks"
                />
              </div>
              <label className="flex min-w-[10rem] flex-col gap-1">
                <span className="sr-only">Status</span>
                <select
                  className="select-shell h-10 w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All</option>
                  {TASK_STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[12rem] flex-col gap-1">
                <span className="sr-only">Project</span>
                <select
                  className="select-shell h-10 w-full"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  aria-label="Filter by project"
                >
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[11rem] flex-col gap-1">
                <span className="sr-only">Assignee</span>
                <select
                  className="select-shell h-10 w-full min-w-[10rem]"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  aria-label="Filter by assignee"
                >
                  <option value="">All employees</option>
                  {[...users]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex min-w-[11rem] flex-col gap-1">
                <span className="sr-only">Lifecycle</span>
                <select
                  className="select-shell h-10 w-full"
                  value={lifecycleFilter}
                  onChange={(e) => setLifecycleFilter(e.target.value as typeof lifecycleFilter)}
                  aria-label="Filter by lifecycle"
                >
                  <option value="all">All</option>
                  <option value="active">Active pipeline</option>
                  <option value="completed">Completed / closed</option>
                </select>
              </label>
            </>
          }
          secondary={
            <>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
              >
                <span className={listPageStatChipInner(kindFilter === 'all')}>
                  <span className={listPageStatChipLabel(kindFilter === 'all')}>All</span>
                  <span className="tabular-nums text-foreground">{tasks.length}</span>
                </span>
              </button>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={kindFilter === 'Task'}
                onClick={() => setKindFilter('Task')}
              >
                <span className={listPageStatChipInner(kindFilter === 'Task')}>
                  <span className={listPageStatChipLabel(kindFilter === 'Task')}>Tasks</span>
                  <span className="tabular-nums text-foreground">{tasks.filter((x) => x.kind !== 'Ticket').length}</span>
                </span>
              </button>
              <button
                type="button"
                className={listPageStatChipButtonClass()}
                aria-pressed={kindFilter === 'Ticket'}
                onClick={() => setKindFilter('Ticket')}
              >
                <span className={listPageStatChipInner(kindFilter === 'Ticket')}>
                  <span className={listPageStatChipLabel(kindFilter === 'Ticket')}>Tickets</span>
                  <span className="tabular-nums text-foreground">{tasks.filter((x) => x.kind === 'Ticket').length}</span>
                </span>
              </button>
            </>
          }
        />
      ),
    }),
    [navigate, q, statusFilter, projectFilter, employeeFilter, kindFilter, lifecycleFilter, projects, users, tasks]
  );
  usePageHeader(tasksHeader);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (qq && !t.title.toLowerCase().includes(qq) && !(t.description ?? '').toLowerCase().includes(qq)) return false;
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (employeeFilter && !t.assignedTo.includes(employeeFilter)) return false;
      if (statusFilter && taskEffectiveStatus(t) !== statusFilter) return false;
      const isTicket = t.kind === 'Ticket';
      if (kindFilter === 'Task' && isTicket) return false;
      if (kindFilter === 'Ticket' && !isTicket) return false;
      const pr =
        t.projectId === TASK_PROJECT_ENQUIRY_PLACEHOLDER ? undefined : projects.find((p) => p.id === t.projectId);
      if (lifecycleFilter === 'active' && pr && !projectIsActivePipeline(pr.status)) return false;
      if (lifecycleFilter === 'completed' && pr && !projectIsCompletedClosed(pr.status)) return false;
      if (lifecycleFilter !== 'all' && !pr && t.projectId !== TASK_PROJECT_ENQUIRY_PLACEHOLDER) return false;
      return true;
    });
  }, [tasks, q, projectFilter, employeeFilter, statusFilter, kindFilter, lifecycleFilter, projects]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length, pageSize, q, projectFilter, employeeFilter, statusFilter, kindFilter, lifecycleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedTasks = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

  function statusBadgeClass(eff: string) {
    if (eff === 'Completed') return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
    if (eff === 'Overdue') return 'bg-destructive/15 text-destructive';
    if (eff === 'In Progress') return 'bg-primary/15 text-primary';
    return 'bg-muted text-muted-foreground';
  }

  return (
    <div className="space-y-4">
      <DataTableShell bodyMaxHeight={listTableBodyMaxHeight(pageSize)}>
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
            {pagedTasks.map((t) => {
              const eff = taskEffectiveStatus(t);
              const projName =
                t.projectId === TASK_PROJECT_ENQUIRY_PLACEHOLDER && t.enquiryId
                  ? `Enquiry · ${enquiries.find((e) => e.id === t.enquiryId)?.customerName ?? 'Follow-up'}`
                  : (projects.find((p) => p.id === t.projectId)?.name ?? '—');
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
  const enquiries = useLiveCollection<Enquiry>('enquiries');
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
        {task.enquiryId && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Linked enquiry: </span>
            <Link to={`/sales/enquiries/${task.enquiryId}`} className="font-medium text-primary hover:underline">
              {enquiries.find((e) => e.id === task.enquiryId)?.customerName ?? task.enquiryId}
            </Link>
          </p>
        )}
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
