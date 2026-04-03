import type {
  Agent,
  Attendance,
  CompanyExpense,
  Customer,
  EmployeeExpense,
  Enquiry,
  Invoice,
  Material,
  MaterialTransfer,
  OutsourceWork,
  Payment,
  Project,
  ProjectProgressStep,
  PurchaseBill,
  Quotation,
  Site,
  Task,
  User,
} from '../types';
import { getCollection } from './storage';

export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatINRDecimal(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(n);
}

export const WORKING_DAYS_PER_MONTH = 26;

export function perDayRate(salary: number): number {
  return Math.round((salary / WORKING_DAYS_PER_MONTH) * 100) / 100;
}

export function computeEffectivePrice(
  lineTotal: number,
  discountPercent: number,
  gstPercent: number
): number {
  const afterDisc = lineTotal * (1 - discountPercent / 100);
  return Math.round(afterDisc * (1 + gstPercent / 100) * 100) / 100;
}

export function lineItemsTotal(
  items: { quantity: number; rate: number; total?: number }[]
): number {
  return items.reduce((s, i) => s + (i.total ?? i.quantity * i.rate), 0);
}

export function issueToPurchaseQty(
  issueQty: number,
  material: Material
): number {
  if (material.purchaseUnit === material.issueUnit) return issueQty;
  const f = material.conversionFactor ?? 1;
  if (material.purchaseUnit === 'Kg' && material.issueUnit === 'Foot') {
    return (issueQty * f) / 1000;
  }
  return issueQty * f;
}

export function agentCommissionForProject(agent: Agent, capacityKw: number): number {
  if (agent.rateType === 'Per kW') return agent.rate * capacityKw;
  return agent.rate;
}

export function getEnquiriesByAgentId(
  agentId: string,
  enquiries: Enquiry[]
): Enquiry[] {
  return enquiries.filter(
    (e) => e.source.type === 'Agent' && e.source.agentId === agentId
  );
}

export function getQuotationsByCustomerId(
  customerId: string,
  quotations: Quotation[]
): Quotation[] {
  return quotations.filter((q) => q.customerId === customerId);
}

export function getProjectsByCustomerId(
  customerId: string,
  projects: Project[]
): Project[] {
  return projects.filter((p) => p.customerId === customerId);
}

export function getSitesByProjectId(projectId: string): Site[] {
  return getCollection<Site>('sites').filter((s) => s.projectId === projectId);
}

export function getTasksByProjectId(projectId: string): Task[] {
  return getCollection<Task>('tasks').filter((t) => t.projectId === projectId);
}

export function getTasksByEmployeeId(employeeId: string): Task[] {
  return getCollection<Task>('tasks').filter((t) => t.assignedTo.includes(employeeId));
}

export function getAttendanceByEmployeeMonth(
  employeeId: string,
  year: number,
  month: number
): Attendance[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getCollection<Attendance>('attendance').filter(
    (a) => a.employeeId === employeeId && a.date.startsWith(prefix)
  );
}

export function getCompanyExpensesByProject(projectId: string): CompanyExpense[] {
  return getCollection<CompanyExpense>('companyExpenses').filter((e) => e.projectId === projectId);
}

export function getInvoicesByProjectId(projectId: string): Invoice[] {
  return getCollection<Invoice>('invoices').filter((i) => i.projectId === projectId);
}

export function getPaymentsByInvoiceId(invoiceId: string): Payment[] {
  return getCollection<Payment>('payments').filter((p) => p.invoiceId === invoiceId);
}

export function getClientPaymentsForProject(projectId: string): number {
  const invoices = getInvoicesByProjectId(projectId);
  const payments = getCollection<Payment>('payments');
  return invoices.reduce((sum, inv) => {
    return (
      sum +
      payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0)
    );
  }, 0);
}

export function getProjectExpenseTotal(projectId: string): number {
  const company = getCompanyExpensesByProject(projectId).reduce(
    (s, e) => s + e.amount,
    0
  );
  const emp = getCollection<EmployeeExpense>('employeeExpenses')
    .filter((e) => e.projectId === projectId)
    .reduce((s, e) => s + e.amount, 0);
  const outsource = getCollection<OutsourceWork>('outsourceWork')
    .filter((o) => o.projectId === projectId)
    .reduce((s, o) => s + o.cost, 0);
  return company + emp + outsource;
}

export function partnerContributionTotal(project: Project): number {
  const pc = project.partnerContributions;
  if (!pc) return 0;
  const labor = pc.labor.reduce((s, l) => s + l.cost, 0);
  const mats = pc.materials.reduce((s, m) => s + m.cost, 0);
  return labor + mats;
}

export function partnerProfitShareType2(
  project: Project,
  partnerSharePercent: number
): number {
  const payments = getClientPaymentsForProject(project.id);
  const expenses = getProjectExpenseTotal(project.id);
  const net = payments - expenses;
  return Math.max(0, (net * partnerSharePercent) / 100);
}

export function taskEffectiveStatus(task: Task): Task['status'] {
  if (task.status === 'Completed') return 'Completed';
  const today = new Date().toISOString().slice(0, 10);
  if (task.dueDate < today) return 'Overdue';
  return task.status;
}

export function defaultExpenseTagForRole(role: User['role']): 'Direct' | 'Indirect' {
  if (role === 'Salesperson' || role === 'Installation Team') return 'Direct';
  return 'Indirect';
}

export function defaultProgressSteps(): Project['progressSteps'] {
  const names = [
    'File Login',
    'Subsidy Type',
    'Bank/Cash',
    'Work Status',
    'DISCOM',
    'Payment Status',
    'DCR',
  ] as const;
  return names.map((name, i) => ({
    step: (i + 1) as ProjectProgressStep['step'],
    name,
    subOptions: {},
    status: 'Pending' as const,
  }));
}

export function recalcSupplierTotals(
  supplierId: string,
  bills: PurchaseBill[],
  vendorPayments: { purchaseBillId: string; amount: number }[]
): { outstanding: number; totalPurchases: number; totalPaid: number } {
  const mine = bills.filter((b) => b.supplierId === supplierId);
  const totalPurchases = mine.reduce((s, b) => s + b.total, 0);
  const billIds = new Set(mine.map((b) => b.id));
  const totalPaid = vendorPayments
    .filter((p) => billIds.has(p.purchaseBillId))
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = totalPurchases - totalPaid;
  return { outstanding, totalPurchases, totalPaid };
}

export function getTransfersForMaterial(materialId: string): MaterialTransfer[] {
  return getCollection<MaterialTransfer>('materialTransfers').filter((t) => t.materialId === materialId);
}

export function getCustomerName(id: string, customers: Customer[]): string {
  return customers.find((c) => c.id === id)?.name ?? id;
}
