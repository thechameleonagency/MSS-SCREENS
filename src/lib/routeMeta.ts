/** Labels for URL segments → readable breadcrumbs and page titles. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  sales: 'Sales',
  enquiries: 'Enquiries',
  agents: 'Agents',
  quotations: 'Quotations',
  customers: 'Customers',
  new: 'New',
  preview: 'Preview',
  projects: 'Projects',
  sites: 'Sites',
  timeline: 'Timeline',
  inventory: 'Inventory',
  materials: 'Materials',
  tools: 'Tools',
  presets: 'Presets',
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

function isLikelyId(segment: string): boolean {
  if (/^new$|^preview$/i.test(segment)) return false;
  return /_/.test(segment) && segment.length > 8;
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
  const parent = breadcrumbs[breadcrumbs.length - 2];
  const subtitle =
    parent && parent.label !== 'Home'
      ? `${parent.label} · Solar operations`
      : 'Solar operations hub';
  return { title, subtitle, breadcrumbs };
}
