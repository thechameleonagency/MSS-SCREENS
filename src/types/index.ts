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
  /** Multi-site present days (doc) */
  siteIds?: string[];
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
  /** Doc: work | call | meeting */
  taskType?: 'work' | 'call' | 'meeting';
  /** Optional link to 7-step project timeline (1–7) */
  progressStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
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

export type EnquirySourceType =
  | 'Agent'
  | 'Direct'
  | 'Referral'
  | 'Phone'
  | 'WalkIn'
  | 'Online'
  | 'Social';

/** Supports legacy `{ text }` and doc `{ note, by, updatedBy }`. */
export interface EnquiryNote {
  text?: string;
  note?: string;
  by?: string;
  updatedBy: string;
  timestamp: string;
  date?: string;
}

export interface Enquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  type: 'Residential' | 'Commercial';
  source: {
    type: EnquirySourceType;
    agentId?: string;
    directSource?: string;
    referredBy?: string;
  };
  priority: 'Low' | 'Medium' | 'High';
  systemCapacity: number;
  estimatedBudget: number;
  assignedTo: string;
  meetingDate?: string;
  customerAddress?: string;
  customerType?: 'Individual' | 'Company';
  followUpDate?: string;
  /** Doc lifecycle labels; optional overlay on status */
  pipelineStage?: string;
  requirements?: string;
  /** Roof construction / type (spec #03) */
  roofType?: string;
  /** Average monthly electricity bill (₹) */
  monthlyBillAmount?: number;
  notes: EnquiryNote[];
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
  gstin?: string;
  /** Installation / site address if different from billing */
  siteAddress?: string;
  pan?: string;
  /** State/UT for place of supply */
  state?: string;
  createdAt: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Confirmed';

export interface QuotationShareEvent {
  at: string;
  channel: 'link' | 'whatsapp' | 'email';
}

export interface Quotation {
  id: string;
  customerId: string;
  enquiryId?: string;
  agentId?: string;
  reference: string;
  systemConfigPresetId: string;
  /** Doc: Solar EPC vs generic / other */
  quoteKind?: 'Solar' | 'Other';
  includePaymentTerms?: boolean;
  includeWarranty?: boolean;
  lineItems: {
    materialId: string;
    quantity: number;
    rate: number;
    total: number;
    /** Free-text line when quoteKind is Other or material not used */
    description?: string;
  }[];
  discountPercent: number;
  /** When `amount`, `discountValue` is ₹ off subtotal before GST */
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  gstPercent: number;
  effectivePrice: number;
  /** Quote validity in days from created date */
  validityPeriodDays?: number;
  /** Final amount agreed with client (incl. or excl. per practice — stored as agreed total) */
  clientAgreedAmount?: number;
  /** Loan documentation / sanctioned amount for bank flow */
  bankDocumentationAmount?: number;
  /** Per-section PDF visibility; omitted keys default to on */
  sectionVisibility?: Partial<{
    header: boolean;
    lineItems: boolean;
    paymentTerms: boolean;
    warranty: boolean;
    notes: boolean;
    pricing: boolean;
  }>;
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
  shareHistory?: QuotationShareEvent[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectType =
  | 'Solo'
  | 'Partner (Profit Only)'
  | 'Vendorship Fee'
  | 'Partner with Contributions';

export type ProjectStatus = 'New' | 'In Progress' | 'Completed' | 'Closed' | 'On Hold';

/** Lifecycle label (spec #08); optional on `Project`; otherwise derived in UI */
export type ProjectProgressStage =
  | 'lead'
  | 'proposal'
  | 'contract_active'
  | 'execution'
  | 'handover'
  | 'completed'
  | 'on_hold';

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
  title?: string;
  description: string;
  reason?: string;
  howToSolve?: string;
  resolveByDate?: string;
  projectStage?: string;
  timelineStage?: string;
  notes?: string;
  assignedTo: string;
  dueDate: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  status?: 'active' | 'resolved';
}

/** Materials dispatched to this project/site (spec #07); mirrors transfers from warehouse. */
export interface ProjectMaterialsSentLine {
  id: string;
  materialId: string;
  quantity: number;
  date: string;
  siteId?: string;
  notes?: string;
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
  /** Cumulative lines issued from warehouse to this project */
  materialsSent?: ProjectMaterialsSentLine[];
  /** Active Sites board filters (doc §2) */
  operational?: {
    fileLogin?: string;
    subsidyType?: string;
    bankFileType?: string;
    loanStage?: string;
    workStatus?: string;
    discomStatus?: string;
    paymentStatus?: string;
  };
  /** Optional override for displayed lifecycle stage (spec #08); else derived in UI */
  progressStage?: ProjectProgressStage;
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

export interface SiteBlockage {
  id: string;
  description: string;
  resolved: boolean;
  createdAt: string;
}

/** Nested work-status tree for Solo projects (spec #08); approvals/media later */
export interface SiteWorkStatusItem {
  id: string;
  title: string;
  done: boolean;
  photoUrls?: string[];
  videoUrls?: string[];
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

export interface SiteWorkStatusArea {
  id: string;
  title: string;
  items: SiteWorkStatusItem[];
}

export interface SiteSoloWorkStatus {
  areas: SiteWorkStatusArea[];
  updatedAt?: string;
}

export interface Site {
  id: string;
  projectId: string;
  name: string;
  address: string;
  photos: string[];
  checklistPresetId?: string;
  checklistItems: SiteChecklistItem[];
  /** Site-level issues (separate from project blockages). */
  siteBlockages?: SiteBlockage[];
  /** Populated for Solo-type parent projects when using structured work status */
  soloWorkStatus?: SiteSoloWorkStatus;
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

export type ToolLifecycleStatus = 'Available' | 'In Use' | 'Under Repair';

export interface Tool {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseDate: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Under Repair' | 'Damaged';
  /** Doc lifecycle */
  lifecycleStatus?: ToolLifecycleStatus;
  assignedTo?: string;
  siteId?: string;
  usefulLifeYears?: number;
  salvageValue?: number;
  depreciationMethod?: 'SLM' | 'WDV';
  /** For WDV stub — annual % on block */
  wdvRatePercent?: number;
  lastUpdated: string;
  createdAt: string;
}

export type PresetType = 'Quotation' | 'SiteChecklist' | 'Invoice';

export type PresetCapacityCategory = 'Residential' | 'Commercial' | 'Industrial';

export interface Preset {
  id: string;
  name: string;
  type: PresetType;
  description: string;
  items: { materialId: string; quantity: number; note?: string }[];
  capacityCategory?: PresetCapacityCategory;
  capacityKW?: number;
  panelBrand?: string;
  panelWattage?: number;
  panelCount?: number;
  inverterBrand?: string;
  inverterCapacity?: string;
  structureType?: string;
  estimatedCost?: number;
  createdAt: string;
}

export type SupplierCategory =
  | 'Panels'
  | 'Inverters'
  | 'Batteries'
  | 'Structure'
  | 'Cables'
  | 'Tools'
  | 'Civil'
  | 'Transport'
  | 'Other';

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  category?: SupplierCategory | string;
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
  items: {
    materialId: string;
    quantity: number;
    rate: number;
    total: number;
    hsn?: string;
    gstRatePercent?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
  }[];
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

export interface InvoiceLineItem {
  description: string;
  hsn?: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
}

export interface InvoiceServiceLine {
  description: string;
  sac?: string;
  rate: number;
  gstRate: number;
  amount: number;
}

export interface GstBreakup {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  customerId: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  total: number;
  received: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  lineItems?: InvoiceLineItem[];
  serviceLines?: InvoiceServiceLine[];
  customerGstin?: string;
  placeOfSupply?: string;
  customerAddress?: string;
  customerContact?: string;
  paymentTerms?: string;
  notes?: string;
  quotationId?: string;
  gstBreakup?: GstBreakup;
  /** From quotation bank-documentation flow (loan papers) */
  bankDocumentationAmount?: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Loan Disbursement' | 'Cheque' | 'Credit Card';
  date: string;
  reference?: string;
  /** When true, amount is treated as advance / on-account until allocated (voucher phase). */
  isAdvance?: boolean;
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
  lineItems?: InvoiceLineItem[];
  serviceLines?: InvoiceServiceLine[];
  customerGstin?: string;
  placeOfSupply?: string;
  gstBreakup?: GstBreakup;
  createdAt: string;
}

export interface CompanyExpense {
  id: string;
  category: string;
  subCategory?: string;
  /** Stable key for CoA mapping, e.g. `company:vehicle:emi` */
  taxonomyKey?: string;
  amount: number;
  date: string;
  projectId?: string;
  paidBy: string;
  mode: string;
  notes: string;
  createdAt: string;
  /** Unified expense wizard: COMPANY | EMPLOYEE | OFFICE | SITE | OWNER | PARTNER */
  pillar?: string;
  payerType?: string;
  employeeId?: string;
  partnerId?: string;
  vendorId?: string;
  monthRef?: string;
  quantity?: number;
  quantityUnit?: string;
  attachmentUrl?: string;
  flags?: Record<string, boolean>;
  splits?: { payer: string; amount: number }[];
}

export interface IncomeRecord {
  id: string;
  pillar: string;
  category: string;
  subCategory?: string;
  /** Stable key for CoA mapping, e.g. `project:client:cash` */
  taxonomyKey?: string;
  amount: number;
  date: string;
  paymentMode: string;
  reference?: string;
  notes?: string;
  projectId?: string;
  partnerId?: string;
  employeeId?: string;
  personName?: string;
  contactNumber?: string;
  bankName?: string;
  loanAccount?: string;
  interestRate?: number;
  tenureMonths?: number;
  expectedReturnDate?: string;
  isOutgoing?: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
}

export type ApprovalKind = 'leave' | 'expense' | 'blockage';

export interface ApprovalRequest {
  id: string;
  kind: ApprovalKind;
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  detail: string;
  amount?: number;
  projectName?: string;
  employeeName?: string;
  payload: Record<string, unknown>;
  requestedAt: string;
}

/** Double-entry voucher header (incremental MMS #11). */
export type VoucherType = 'Sales' | 'Receipt' | 'Purchase' | 'Payment' | 'Journal' | 'Contra';

export interface Voucher {
  id: string;
  type: VoucherType;
  date: string;
  narration?: string;
  postedFrom?: { entityType: string; entityId: string };
  createdAt: string;
}

export interface LedgerLine {
  id: string;
  voucherId: string;
  accountId: string;
  debit: number;
  credit: number;
  narration?: string;
}

/** Double-entry lines linked to a voucher (MMS #11 incremental). */
export interface LedgerLine {
  id: string;
  voucherId: string;
  accountId: string;
  debit: number;
  credit: number;
  narration?: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  type: 'Sales' | 'Receipt' | 'Purchase' | 'Payment' | 'Journal' | 'Contra';
  date: string;
  narration?: string;
  postedFrom?: { entityType: string; entityId: string };
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName?: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  entityName?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface CompanyHoliday {
  id: string;
  date: string;
  label: string;
  createdAt: string;
}

export interface ToolMovement {
  id: string;
  toolId: string;
  type: 'issue' | 'return' | 'transfer';
  employeeId?: string;
  siteId?: string;
  condition?: string;
  notes?: string;
  date: string;
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

export interface MaterialReturn {
  id: string;
  materialId: string;
  /** Omitted when action is scrap (warehouse write-off). */
  projectId?: string;
  siteId?: string;
  quantityInIssueUnit: number;
  action: 'to_stock' | 'transfer_site' | 'scrap';
  targetSiteId?: string;
  conditionNotes?: string;
  /** Damage / write-off reason (esp. scrap) */
  damageReason?: string;
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
  /** Links optional approval workflow */
  approvalId?: string;
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
  incomeRecords: 'solar_incomeRecords',
  approvalRequests: 'solar_approvalRequests',
  auditLogs: 'solar_auditLogs',
  companyHolidays: 'solar_companyHolidays',
  toolMovements: 'solar_toolMovements',
  materialReturns: 'solar_materialReturns',
  vouchers: 'solar_vouchers',
  ledgerLines: 'solar_ledgerLines',
  seeded: 'solar_seeded',
  currentRole: 'solar_currentRole',
  schemaVersion: 'solar_schemaVersion',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
