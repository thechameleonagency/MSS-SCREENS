import type { UserRole } from '../types';

const financePrefixes = ['/finance'];
const hrPrefixes = ['/hr'];
const settingsPrefixes = ['/settings'];

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role === 'Super Admin' || role === 'Admin' || role === 'CEO' || role === 'Management') return true;
  if (role === 'Salesperson') {
    if (path.startsWith('/finance/customers')) return true;
    if (financePrefixes.some((p) => path.startsWith(p))) return false;
    if (hrPrefixes.some((p) => path.startsWith(p))) return false;
    if (settingsPrefixes.some((p) => path.startsWith(p))) return false;
    if (path.startsWith('/audit')) return false;
    return (
      path.startsWith('/dashboard') ||
      path.startsWith('/sales') ||
      path.startsWith('/projects') ||
      path.startsWith('/hr/tasks') ||
      path.startsWith('/analytics') ||
      path.startsWith('/utilities') ||
      path === '/'
    );
  }
  if (role === 'Installation Team') {
    return (
      path.startsWith('/dashboard') ||
      path.startsWith('/projects') ||
      path === '/hr' ||
      path === '/hr/attendance' ||
      path.startsWith('/hr/tasks') ||
      path.startsWith('/utilities') ||
      path === '/'
    );
  }
  return true;
}

export function canDeleteUsers(role: UserRole): boolean {
  return role === 'Super Admin' || role === 'Admin' || role === 'CEO';
}

export function canEditSettings(role: UserRole): boolean {
  return role === 'Super Admin' || role === 'Admin' || role === 'CEO';
}
