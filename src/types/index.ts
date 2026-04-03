export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Management'
  | 'Salesperson'
  | 'Installation Team';

export type ExpenseTag = 'Direct' | 'Indirect';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  expenseTag: ExpenseTag;
  phone: string;
  email: string;
  address: string;
  dob: string;
  salary: number;
  bankDetails: string;
  documents: {
    aadhaar: string;
    pan: string;
    photo: string;
    offerLetter: string;
  };
  username: string;
  password: string;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Paid Leave' | 'Absent';
  siteId?: string;
  markedBy: string;
}

export interface Task {
  id: string;
  projectId: string;
  siteId?: string;
  title: string;
  description: string;
  assignedTo: string[];
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  /** Tickets used after project completion (same shape as tasks). */
  kind?: 'Task' | 'Ticket';
  createdAt: string;
  updatedAt: string;
  comments: { userId: string; text: string; timestamp: string }[];
}

export interface EmployeeExpense {
  id: string;
  employeeId: string;
  date: string;
  category: 'Food' | 'Travel' | 'Stay' | 'Medical' | 'Transport' | 'Other';
  amount: number;
  projectId?: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  notes: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  photo: string;
  fullName: string;
  mobile: string;
  email: string;
  rateType: 'Per kW' | 'Flat';
  rate: number;
  address: string;
  totalCommission: number;
  paidCommission: number;
  pendingCommission?: number;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  type: 'Residential' | 'Commercial';
  source: {
    type: 'Agent' | 'Direct';
    agentId?: string;
    directSource?: string;
  };
  priority: 'Low' | 'Medium' | 'High';
  systemCapacity: number;
  estimatedBudget: number;
  assignedTo: string;
  meetingDate?: string;
  notes: { text: string; updatedBy: string; timestamp: string }[];
  status: 'New' | 'In Progress' | 'Converted' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'Individual' | 'Company';
  createdAt: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Confirmed';

export interface Quotation {
  id: string;
  customerId: string;
  enquiryId?: string;
  agentId?: string;
  reference: string;
  systemConfigPresetId: string;
  lineItems: {
    materialId: string;
    quantity: number;
    rate: number;
    total: number;
  }[];
  discountPercent: number;
  gstPercent: number;
  effectivePrice: number;
  paymentTerms: { label: string; percent: number }[];
  warrantyInfo: { component: string; years: number }[];
  additionalNotes: string;
  status: QuotationStatus;
  sentDate?: string;
  approvedDate?: string;
  paymentType?: 'Bank Loan' | 'Cash' | 'Bank Loan + Cash';
  bankLoanDetails?: {
    kNumber: string;
    lender: string;
    amount: number;
    approvalStatus: 'Pending' | 'Approved' | 'Disbursed';
  };
  createdAt: string;
  updatedAt: string;
}

export type ProjectType =
  | 'Solo'
  | 'Partner (Profit Only)'
  | 'Vendorship Fee'
  | 'Partner with Contributions';

export type ProjectStatus = 'New' | 'In Progress' | 'Completed' | 'Closed' | 'On Hold';

export interface ProjectProgressStep {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  subOptions: Record<string, unknown>;
  status: 'Pending' | 'In Progress' | 'Completed';
  updatedBy?: string;
  updatedAt?: string;
  notes?: string;
}

export interface ProjectBlockage {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  category: 'Residential' | 'Commercial' | 'Industrial';
  status: ProjectStatus;
  customerId: string;
  quotationId?: string;
  agentId?: string;
  partnerId?: string;
  channelPartnerId?: string;
  capacity: number;
  contractAmount: number;
  startDate: string;
  endDate?: string;
  address: string;
  progressSteps: ProjectProgressStep[];
  blockages: ProjectBlockage[];
  partnerContributions?: {
    labor: {
      id: string;
      description: string;
      hours: number;
      cost: number;
      date: string;
    }[];
    materials: {
      id: string;
      materialId: string;
      quantity: number;
      cost: number;
      date: string;
    }[];
  };
  paymentType?: 'Bank Loan' | 'Cash' | 'Bank Loan + Cash';
  createdAt: string;
  updatedAt: string;
}

export interface SiteChecklistItem {
  itemId: string;
  materialId?: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface Site {
  id: string;
  projectId: string;
  name: string;
  address: string;
  photos: string[];
  checklistPresetId?: string;
  checklistItems: SiteChecklistItem[];
  createdAt: string;
}

export type StockUnit = 'Pcs' | 'Foot' | 'Meter' | 'Kg';

export interface Material {
  id: string;
  name: string;
  category: string;
  sizeSpec: string;
  purchaseUnit: StockUnit;
  issueUnit: StockUnit;
  conversionFactor?: number;
  purchaseRate: number;
  saleRateRetail: number;
  saleRateWholesale: number;
  hsn: string;
  minStock: number;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseDate: string;
  condition: 'Good' | 'Under Repair' | 'Damaged';
  assignedTo?: string;
  siteId?: string;
  lastUpdated: string;
  createdAt: string;
}

export type PresetType = 'Quotation' | 'SiteChecklist';

export interface Preset {
  id: string;
  name: string;
  type: PresetType;
  description: string;
  items: { materialId: string; quantity: number; note?: string }[];
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  outstanding: number;
  totalPurchases: number;
  totalPaid: number;
  createdAt: string;
}

export interface PurchaseBill {
  id: string;
  supplierId: string;
  billNumber: string;
  date: string;
  items: { materialId: string; quantity: number; rate: number; total: number }[];
  total: number;
  paid: number;
  due: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  purchaseBillId: string;
  supplierId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  source: string;
  type: 'EMI' | 'One-Time' | 'Reminder';
  principal: number;
  rate?: number;
  paymentInfo: string;
  outstanding: number;
  status: 'Active' | 'Closed';
  projectId?: string;
  repayments: { amount: number; date: string }[];
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  contact: string;
  profitSharePercent: number;
  createdAt: string;
}

export interface ChannelPartner {
  id: string;
  name: string;
  vendorCode: string;
  contact: string;
  pricingTier: 'Wholesale';
  feeStructure: 'Per kW' | 'Fixed' | 'Percentage';
  feeAmount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  customerId: string;
  invoiceNumber: string;
  date: string;
  total: number;
  received: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Loan Disbursement';
  date: string;
  createdAt: string;
}

export interface SaleBill {
  id: string;
  projectId: string;
  customerId: string;
  billNumber: string;
  date: string;
  total: number;
  received: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
  createdAt: string;
}

export interface CompanyExpense {
  id: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: string;
  projectId?: string;
  paidBy: string;
  mode: string;
  notes: string;
  createdAt: string;
}

export type MasterDataType =
  | 'PanelBrand'
  | 'InverterBrand'
  | 'StructureType'
  | 'SystemCapacity'
  | 'ExpenseMainCategory'
  | 'ExpenseSubCategory'
  | 'DocumentTemplate';

export interface MasterData {
  id: string;
  type: MasterDataType;
  value: string;
  parentId?: string;
  order: number;
}

export interface CompanyProfile {
  name: string;
  logo: string;
  gst: string;
  address: string;
  bankAccount: string;
}

export interface MaterialTransfer {
  id: string;
  materialId: string;
  projectId: string;
  siteId?: string;
  quantityInIssueUnit: number;
  quantityDeductedPurchase: number;
  date: string;
  createdAt: string;
}

export interface OutsourceWork {
  id: string;
  projectId: string;
  type: string;
  quantity: number;
  cost: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  netPayable: number;
  paid: boolean;
  paidDate?: string;
  createdAt: string;
}

export interface PartnerSettlement {
  id: string;
  partnerId: string;
  projectId?: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface ChannelPartnerFee {
  id: string;
  channelPartnerId: string;
  projectId?: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export const STORAGE_KEYS = {
  users: 'solar_users',
  attendance: 'solar_attendance',
  tasks: 'solar_tasks',
  employeeExpenses: 'solar_employeeExpenses',
  agents: 'solar_agents',
  enquiries: 'solar_enquiries',
  customers: 'solar_customers',
  quotations: 'solar_quotations',
  projects: 'solar_projects',
  sites: 'solar_sites',
  materials: 'solar_materials',
  tools: 'solar_tools',
  presets: 'solar_presets',
  suppliers: 'solar_suppliers',
  purchaseBills: 'solar_purchaseBills',
  vendorPayments: 'solar_vendorPayments',
  loans: 'solar_loans',
  partners: 'solar_partners',
  channelPartners: 'solar_channelPartners',
  invoices: 'solar_invoices',
  payments: 'solar_payments',
  saleBills: 'solar_saleBills',
  companyExpenses: 'solar_companyExpenses',
  masterData: 'solar_masterData',
  companyProfile: 'solar_companyProfile',
  materialTransfers: 'solar_materialTransfers',
  outsourceWork: 'solar_outsourceWork',
  payrollRecords: 'solar_payrollRecords',
  partnerSettlements: 'solar_partnerSettlements',
  channelFees: 'solar_channelFees',
  notifications: 'solar_notifications',
  seeded: 'solar_seeded',
  currentRole: 'solar_currentRole',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
