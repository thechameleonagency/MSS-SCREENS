/** Labels for URL segments → readable breadcrumbs and page titles. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  sales: 'Sales',
  billing: 'Billing & payments',
  'partners-vendors': 'Vendors & partners',
  accounting: 'Chart & audit',
  desk: 'Desk',
  enquiries: 'Enquiries',
  agents: 'Agents',
  quotations: 'Quotations',
  customers: 'Customers',
  new: 'New',
  preview: 'Preview',
  projects: 'Projects',
  'active-sites': 'Active sites',
  sites: 'Sites',
  timeline: 'Timeline',
  summaries: 'Project summaries',
  hub: 'Finance center',
  analytics: 'Analytics',
  audit: 'Audit',
  'profit-loss': 'Profit & loss',
  inventory: 'Materials & Tools',
  presets: 'Presets',
  'debtors-creditors': 'Debtors & creditors',
  gst: 'GST',
  'cash-bank': 'Cash & bank',
  expenses: 'Expenses',
  assets: 'Assets',
  logs: 'Logs',
  reports: 'Reports',
  'data-flow': 'Data flow',
  materials: 'Materials',
  tools: 'Tools',
  finance: 'Finance',
  invoices: 'Invoices',
  'sale-bills': 'Sale bills',
  payments: 'Payments',
  loans: 'Loans',
  vendors: 'Vendors',
  partners: 'Partners',
  'channel-partners': 'Channel partners',
  'chart-of-accounts': 'Chart of accounts',
  'expense-audit': 'Expense audit',
  hr: 'HR & Team',
  employees: 'Employees',
  attendance: 'Attendance',
  monthly: 'Monthly',
  payroll: 'Payroll',
  tasks: 'Tasks',
  settings: 'Settings',
  'master-data': 'Master data',
  users: 'Users',
  company: 'Company',
  utilities: 'Utilities',
  notifications: 'Notifications',
};

export function isLikelyId(segment: string): boolean {
  if (/^new$|^preview$/i.test(segment)) return false;
  return /_/.test(segment) && segment.length > 8;
}

/** Parent path for back navigation on detail / new / preview routes. */
export function inferBackTo(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return undefined;
  const last = parts[parts.length - 1]!;
  if (last === 'new' || last === 'preview') {
    return `/${parts.slice(0, -1).join('/')}`;
  }
  if (isLikelyId(last)) {
    return `/${parts.slice(0, -1).join('/')}`;
  }
  return undefined;
}

export type BreadcrumbItem = { label: string; to?: string };

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Home', to: '/dashboard' }];
  let acc = '';
  parts.forEach((segment, i) => {
    acc += `/${segment}`;
    const isLast = i === parts.length - 1;
    const label = isLikelyId(segment)
      ? 'Details'
      : SEGMENT_LABELS[segment] ??
        segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    items.push({
      label,
      to: isLast ? undefined : acc,
    });
  });
  return items;
}

export function getPageMeta(pathname: string): {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
} {
  const breadcrumbs = buildBreadcrumbs(pathname);
  const last = breadcrumbs[breadcrumbs.length - 1];
  const title = last?.label ?? 'Page';
  return { title, subtitle: '', breadcrumbs };
}
