import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '../../contexts/AppProviders';
import { canAccessPath } from '../../lib/permissions';
import {
  AttendanceMonthlyPage,
  AttendancePage,
  DeploymentPage,
  EmployeesList,
  HolidaysPage,
  PayrollPage,
  TasksList,
} from './HR';

const TABS: { id: string; label: string; path: string }[] = [
  { id: 'employees', label: 'Employees', path: '/hr/employees' },
  { id: 'attendance', label: 'Attendance', path: '/hr/attendance' },
  { id: 'monthly', label: 'Monthly roll-up', path: '/hr/attendance/monthly' },
  { id: 'payroll', label: 'Payroll', path: '/hr/payroll' },
  { id: 'holidays', label: 'Holidays', path: '/hr/holidays' },
  { id: 'deployment', label: 'Deployment', path: '/hr/deployment' },
  { id: 'tasks', label: 'Tasks', path: '/hr/tasks' },
];

export function HRDesk() {
  const { role } = useRole();
  const [sp, setSp] = useSearchParams();
  const allowed = useMemo(() => TABS.filter((t) => canAccessPath(role, t.path)), [role]);
  const raw = sp.get('tab') ?? allowed[0]?.id ?? 'employees';
  const active = allowed.find((t) => t.id === raw)?.id ?? allowed[0]?.id ?? 'employees';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
        {allowed.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
              active === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSp({ tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active === 'employees' && <EmployeesList />}
      {active === 'attendance' && <AttendancePage />}
      {active === 'monthly' && <AttendanceMonthlyPage />}
      {active === 'payroll' && <PayrollPage />}
      {active === 'holidays' && <HolidaysPage />}
      {active === 'deployment' && <DeploymentPage />}
      {active === 'tasks' && <TasksList />}
    </div>
  );
}
