import type {
  Agent,
  AppNotification,
  ApprovalRequest,
  Attendance,
  AuditLogEntry,
  ChannelPartner,
  ChannelPartnerFee,
  CompanyExpense,
  CompanyHoliday,
  CompanyProfile,
  Customer,
  EmployeeExpense,
  Enquiry,
  IncomeRecord,
  Invoice,
  LedgerLine,
  Loan,
  MasterData,
  Material,
  MaterialReturn,
  MaterialTransfer,
  OutsourceWork,
  Partner,
  PartnerSettlement,
  Payment,
  PayrollRecord,
  Preset,
  Project,
  PurchaseBill,
  Quotation,
  SaleBill,
  Site,
  Supplier,
  Task,
  Tool,
  ToolMovement,
  User,
  VendorPayment,
  Voucher,
} from '../types';
import { STORAGE_KEYS } from '../types';
import {
  clearAllSolarKeys,
  getCollection,
  setCollection,
  setItem,
} from './storage';
import { runDataMigrations } from './migrations';
import { computeEffectivePrice, defaultExpenseTagForRole, defaultProgressSteps } from './helpers';
import { mergeMaterialsPack62IfAbsent } from './materialsPack62';
import { EXPENSE_TAXONOMY, expenseTaxonomyKey, type ExpensePillarId } from './expenseTaxonomy';
import { incomeTaxonomyKey } from './incomeTaxonomy';
import {
  bulkAgents,
  bulkApprovals,
  bulkAttendance,
  bulkAudit,
  bulkChannelFees,
  bulkChannelPartners,
  bulkCompanyExpenses,
  bulkCustomers,
  bulkEmployeeExpenses,
  bulkEnquiries,
  bulkHolidays,
  bulkIncome,
  bulkInvoicesPayments,
  bulkLoans,
  bulkMasterData,
  bulkMaterialReturns,
  bulkMaterialTransfers,
  bulkNotifications,
  bulkOutsource,
  bulkPartnerSettlements,
  bulkPartners,
  bulkProjects,
  bulkPurchaseBills,
  bulkQuotations,
  bulkSaleBills,
  bulkSites,
  bulkSuppliers,
  bulkTasks,
  bulkToolMovements,
  bulkTools,
  bulkVendorPayments,
  bulkVouchersLedger,
} from './seedBulkExpansion';

/** Bump when demo dataset changes so localStorage refreshes on next load. */
export const DEMO_SEED_VERSION = 'mms-2026.04h-audit-completion';

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);
const y = new Date().getFullYear();
const m = String(new Date().getMonth() + 1).padStart(2, '0');

export const IDS = {
  u1: 'usr_super',
  u2: 'usr_admin',
  u3: 'usr_mgmt',
  u4: 'usr_sales1',
  u5: 'usr_sales2',
  u6: 'usr_inst1',
  u7: 'usr_inst2',
  a1: 'agt_ramesh',
  a2: 'agt_sunita',
  a3: 'agt_raj',
  c1: 'cust_1',
  c2: 'cust_2',
  c3: 'cust_3',
  c4: 'cust_4',
  c5: 'cust_5',
  mat1: 'mat_panel_550',
  mat2: 'mat_inverter_5kw',
  mat3: 'mat_structure',
  mat4: 'mat_ac_cable',
  mat5: 'mat_dc_cable',
  pr1: 'preset_res_5kw',
  pr2: 'preset_com_20kw',
  pr3: 'chk_res_std',
  pr4: 'chk_com_std',
  en1: 'enq_1',
  q1: 'quo_1',
  p1: 'proj_1',
  s1: 'site_1',
  sup1: 'sup_adani',
  part1: 'part_ajay',
  ch1: 'ch_tata',
};

function seedUsers(): User[] {
  const base = (u: Omit<User, 'expenseTag' | 'createdAt' | 'updatedAt'>): User => ({
    ...u,
    expenseTag: defaultExpenseTagForRole(u.role),
    createdAt: now,
    updatedAt: now,
  });
  return [
    base({
      id: IDS.u1,
      name: 'Vikram Mehta',
      role: 'Super Admin',
      phone: '9876543210',
      email: 'vikram@solarco.in',
      address: 'Pune, MH',
      dob: '1985-03-12',
      salary: 120000,
      bankDetails: 'HDFC ****4421',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'vikram',
      password: 'admin',
      joiningDate: '2020-01-15',
    }),
    base({
      id: IDS.u2,
      name: 'Neha Sharma',
      role: 'Admin',
      phone: '9876543211',
      email: 'neha@solarco.in',
      address: 'Mumbai, MH',
      dob: '1990-07-22',
      salary: 95000,
      bankDetails: 'ICICI ****8890',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'neha',
      password: 'admin',
      joiningDate: '2021-04-01',
    }),
    base({
      id: IDS.u3,
      name: 'Rahul Desai',
      role: 'Management',
      phone: '9876543212',
      email: 'rahul@solarco.in',
      address: 'Nashik, MH',
      dob: '1988-11-05',
      salary: 88000,
      bankDetails: 'SBI ****1122',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'rahul',
      password: 'admin',
      joiningDate: '2019-08-10',
    }),
    base({
      id: IDS.u4,
      name: 'Priya Kulkarni',
      role: 'Salesperson',
      phone: '9876543213',
      email: 'priya@solarco.in',
      address: 'Pune, MH',
      dob: '1995-01-30',
      salary: 45000,
      bankDetails: 'Axis ****3344',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'priya',
      password: 'sales',
      joiningDate: '2022-06-01',
    }),
    base({
      id: IDS.u5,
      name: 'Amit Patil',
      role: 'Salesperson',
      phone: '9876543214',
      email: 'amit@solarco.in',
      address: 'Kolhapur, MH',
      dob: '1993-09-18',
      salary: 42000,
      bankDetails: 'HDFC ****5566',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'amit',
      password: 'sales',
      joiningDate: '2023-01-10',
    }),
    base({
      id: IDS.u6,
      name: 'Suresh Yadav',
      role: 'Installation Team',
      phone: '9876543215',
      email: 'suresh@solarco.in',
      address: 'Satara, MH',
      dob: '1992-04-25',
      salary: 38000,
      bankDetails: 'BOI ****7788',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'suresh',
      password: 'install',
      joiningDate: '2021-11-20',
    }),
    base({
      id: IDS.u7,
      name: 'Deepak Jadhav',
      role: 'Installation Team',
      phone: '9876543216',
      email: 'deepak@solarco.in',
      address: 'Sangli, MH',
      dob: '1991-12-08',
      salary: 40000,
      bankDetails: 'PNB ****9900',
      documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' },
      username: 'deepak',
      password: 'install',
      joiningDate: '2022-03-05',
    }),
  ];
}

/** Extra demo users so the Employees list reaches ~15 rows with repeated roles. */
function seedDemoUsersExtra(): User[] {
  const base = (u: Omit<User, 'expenseTag' | 'createdAt' | 'updatedAt'>): User => ({
    ...u,
    expenseTag: defaultExpenseTagForRole(u.role),
    createdAt: now,
    updatedAt: now,
  });
  const rows: Omit<User, 'expenseTag' | 'createdAt' | 'updatedAt'>[] = [
    { id: 'usr_demo_0', name: 'Kavita Rao', role: 'Salesperson', phone: '9876500001', email: 'kavita@solarco.in', address: 'Pune', dob: '1994-02-01', salary: 44000, bankDetails: 'SBI ****1001', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'kavita', password: 'sales', joiningDate: '2023-08-01' },
    { id: 'usr_demo_1', name: 'Manoj Kulkarni', role: 'Salesperson', phone: '9876500002', email: 'manoj@solarco.in', address: 'Nashik', dob: '1991-06-15', salary: 43000, bankDetails: 'HDFC ****1002', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'manoj', password: 'sales', joiningDate: '2023-09-12' },
    { id: 'usr_demo_2', name: 'Anita Deshpande', role: 'Management', phone: '9876500003', email: 'anita@solarco.in', address: 'Mumbai', dob: '1987-11-20', salary: 92000, bankDetails: 'ICICI ****1003', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'anita', password: 'admin', joiningDate: '2018-05-01' },
    { id: 'usr_demo_3', name: 'Ravi Sonawane', role: 'Installation Team', phone: '9876500004', email: 'ravi@solarco.in', address: 'Satara', dob: '1990-03-08', salary: 39000, bankDetails: 'BOI ****1004', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'ravi', password: 'install', joiningDate: '2022-02-14' },
    { id: 'usr_demo_4', name: 'Sneha Patwardhan', role: 'Admin', phone: '9876500005', email: 'sneha@solarco.in', address: 'Pune', dob: '1992-09-30', salary: 88000, bankDetails: 'Axis ****1005', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'sneha', password: 'admin', joiningDate: '2020-11-01' },
    { id: 'usr_demo_5', name: 'Ganesh Mane', role: 'Salesperson', phone: '9876500006', email: 'ganesh@solarco.in', address: 'Kolhapur', dob: '1996-01-22', salary: 41000, bankDetails: 'HDFC ****1006', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'ganesh', password: 'sales', joiningDate: '2024-01-08' },
    { id: 'usr_demo_6', name: 'Pooja Bhosale', role: 'Management', phone: '9876500007', email: 'pooja@solarco.in', address: 'Pune', dob: '1989-07-11', salary: 90000, bankDetails: 'SBI ****1007', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'pooja', password: 'admin', joiningDate: '2019-03-20' },
    { id: 'usr_demo_7', name: 'Nitin Gaikwad', role: 'Installation Team', phone: '9876500008', email: 'nitin@solarco.in', address: 'Sangli', dob: '1993-12-05', salary: 38500, bankDetails: 'PNB ****1008', documents: { aadhaar: '', pan: '', photo: '', offerLetter: '' }, username: 'nitin', password: 'install', joiningDate: '2021-07-18' },
  ];
  return rows.map((r) => base(r));
}

function seedAgents(): Agent[] {
  return [
    {
      id: IDS.a1,
      photo: '',
      fullName: 'Ramesh Verma',
      mobile: '9123456780',
      email: 'ramesh.v@agents.in',
      rateType: 'Per kW',
      rate: 1000,
      address: 'Indore, MP',
      totalCommission: 45000,
      paidCommission: 20000,
      pendingCommission: 25000,
      createdAt: now,
    },
    {
      id: IDS.a2,
      photo: '',
      fullName: 'Sunita Rao',
      mobile: '9123456781',
      email: 'sunita.r@agents.in',
      rateType: 'Flat',
      rate: 15000,
      address: 'Hyderabad, TS',
      totalCommission: 30000,
      paidCommission: 30000,
      createdAt: now,
    },
    {
      id: IDS.a3,
      photo: '',
      fullName: 'Raj Malhotra',
      mobile: '9123456782',
      email: 'raj.m@agents.in',
      rateType: 'Per kW',
      rate: 800,
      address: 'Jaipur, RJ',
      totalCommission: 12000,
      paidCommission: 5000,
      createdAt: now,
    },
  ];
}

function seedMaterials(): Material[] {
  const mk = (
    id: string,
    name: string,
    cat: string,
    retail: number,
    purchase: number,
    stock: number,
    pu: Material['purchaseUnit'],
    iu: Material['issueUnit'],
    cf?: number
  ): Material => ({
    id,
    name,
    category: cat,
    sizeSpec: 'std',
    purchaseUnit: pu,
    issueUnit: iu,
    conversionFactor: cf,
    purchaseRate: purchase,
    saleRateRetail: retail,
    saleRateWholesale: retail * 0.92,
    hsn: '85414011',
    minStock: 10,
    currentStock: stock,
    createdAt: now,
    updatedAt: now,
  });
  return [
    mk(IDS.mat1, 'Mono PERC 550W Panel', 'Panel', 18500, 14200, 120, 'Pcs', 'Pcs'),
    mk(IDS.mat2, '5kW String Inverter', 'Inverter', 52000, 41000, 25, 'Pcs', 'Pcs'),
    mk(IDS.mat3, 'GI Structure 5kW Kit', 'Structure', 28000, 19500, 40, 'Pcs', 'Pcs'),
    mk(IDS.mat4, 'AC Cable 4 sqmm', 'Cables', 95, 62, 500, 'Meter', 'Meter'),
    mk(IDS.mat5, 'DC Cable 4 sqmm', 'Cables', 85, 55, 800, 'Meter', 'Meter'),
    mk('mat_mc4', 'MC4 Connectors (pair)', 'Accessories', 120, 75, 200, 'Pcs', 'Pcs'),
    mk('mat_acdb', 'ACDB 32A', 'Protection', 4200, 3100, 30, 'Pcs', 'Pcs'),
    mk('mat_dcdb', 'DCDB 2 in 2 out', 'Protection', 3800, 2800, 30, 'Pcs', 'Pcs'),
    mk('mat_earthing', 'Earthing Kit', 'Safety', 2200, 1500, 50, 'Pcs', 'Pcs'),
    mk('mat_lug', 'Cable Lugs set', 'Accessories', 450, 280, 100, 'Pcs', 'Pcs'),
    mk('mat_junction', 'DC Junction Box', 'Protection', 1800, 1200, 40, 'Pcs', 'Pcs'),
    mk('mat_net_meter', 'Net Meter enclosure', 'Metering', 3500, 2400, 15, 'Pcs', 'Pcs'),
    mk('mat_alu_wire', 'Aluminium Wire roll', 'Cables', 3200, 2100, 20, 'Kg', 'Foot', 850),
    mk('mat_conduit', 'PVC Conduit 25mm', 'Conduit', 45, 28, 300, 'Meter', 'Meter'),
    mk('mat_lightning', 'Lightning Arrestor kit', 'Safety', 6500, 4800, 12, 'Pcs', 'Pcs'),
  ];
}

function seedPresets(materials: Material[]): Preset[] {
  const p = materials;
  const find = (n: string) => p.find((x) => x.name.includes(n))?.id ?? p[0]!.id;
  return [
    {
      id: IDS.pr1,
      name: 'Residential 5kW Standard',
      type: 'Quotation',
      description: 'Typical rooftop 5kW',
      items: [
        { materialId: find('550W'), quantity: 10, note: '5.5kWp' },
        { materialId: find('5kW String'), quantity: 1 },
        { materialId: find('GI Structure'), quantity: 1 },
        { materialId: find('AC Cable'), quantity: 30 },
        { materialId: find('DC Cable'), quantity: 80 },
      ],
      createdAt: now,
    },
    {
      id: IDS.pr2,
      name: 'Commercial 20kW',
      type: 'Quotation',
      description: 'Shed mount',
      items: [
        { materialId: find('550W'), quantity: 37 },
        { materialId: find('5kW String'), quantity: 4 },
        { materialId: find('GI Structure'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: IDS.pr3,
      name: 'Site checklist – Residential',
      type: 'SiteChecklist',
      description: 'Type B',
      items: [
        { materialId: find('550W'), quantity: 1, note: 'Visual inspection' },
        { materialId: find('5kW String'), quantity: 1 },
        { materialId: find('Earthing'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: IDS.pr4,
      name: 'Site checklist – Commercial',
      type: 'SiteChecklist',
      description: 'Type B',
      items: [
        { materialId: find('ACDB'), quantity: 1 },
        { materialId: find('Lightning'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_5',
      name: 'Residential 8kW Premium',
      type: 'Quotation',
      description: 'Higher capacity residential',
      items: [
        { materialId: find('550W'), quantity: 15, note: '8.25kWp' },
        { materialId: find('5kW String'), quantity: 1 },
        { materialId: find('GI Structure'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_6',
      name: 'Industrial 50kW shed',
      type: 'Quotation',
      description: 'Large shed mount',
      items: [
        { materialId: find('550W'), quantity: 92 },
        { materialId: find('5kW String'), quantity: 10 },
        { materialId: find('GI Structure'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_7',
      name: 'Battery backup add-on',
      type: 'Quotation',
      description: 'Optional storage package',
      items: [
        { materialId: find('550W'), quantity: 4 },
        { materialId: find('Earthing'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_8',
      name: 'Site checklist – Ground mount',
      type: 'SiteChecklist',
      description: 'Ground array',
      items: [
        { materialId: find('Structure'), quantity: 1, note: 'Pile foundation' },
        { materialId: find('550W'), quantity: 1, note: 'Layout check' },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_9',
      name: 'O&M preset (annual)',
      type: 'Quotation',
      description: 'Service retainer',
      items: [
        { materialId: find('AC Cable'), quantity: 1, note: 'Spares bundle' },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_10',
      name: 'DC extension pack',
      type: 'Quotation',
      description: 'Long run DC',
      items: [
        { materialId: find('DC Cable'), quantity: 120 },
        { materialId: find('MC4'), quantity: 20 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_11',
      name: 'Lightning protection kit',
      type: 'Quotation',
      description: 'Add-on safety',
      items: [{ materialId: find('Lightning'), quantity: 1 }],
      createdAt: now,
    },
    {
      id: 'preset_demo_12',
      name: 'Site checklist – Hybrid inverter',
      type: 'SiteChecklist',
      description: 'Hybrid site',
      items: [
        { materialId: find('5kW String'), quantity: 1 },
        { materialId: find('Earthing'), quantity: 1 },
      ],
      createdAt: now,
    },
    {
      id: 'preset_demo_13',
      name: 'Micro-grid pilot',
      type: 'Quotation',
      description: 'Demo micro-grid BOM',
      items: [
        { materialId: find('550W'), quantity: 40 },
        { materialId: find('5kW String'), quantity: 2 },
      ],
      createdAt: now,
    },
  ];
}

function seedCustomers(): Customer[] {
  return [
    {
      id: IDS.c1,
      name: 'Kiran Joshi',
      phone: '9988776655',
      email: 'kiran.j@gmail.com',
      address: '402 A, Skyline Apt, Baner, Pune 411045',
      type: 'Individual',
      gstin: undefined,
      pan: 'ABCPJ1234D',
      state: 'Maharashtra',
      siteAddress: 'Rooftop install — same as billing',
      createdAt: now,
    },
    {
      id: IDS.c2,
      name: 'Shree Foods Pvt Ltd',
      phone: '9988776654',
      email: 'accounts@shreefoods.in',
      address: 'Plot 12, MIDC, Nashik 422010',
      type: 'Company',
      gstin: '27AABCS1234F1Z1',
      pan: 'AABCS1234F',
      state: 'Maharashtra',
      siteAddress: 'Factory roof — Gate 2, same MIDC',
      createdAt: now,
    },
    {
      id: IDS.c3,
      name: 'Meera Nair',
      phone: '9988776653',
      email: 'meera.n@yahoo.com',
      address: 'Kothrud, Pune 411038',
      type: 'Individual',
      pan: 'NAIRM8899K',
      state: 'Maharashtra',
      siteAddress: 'Independent bungalow — lane 4',
      createdAt: now,
    },
    {
      id: IDS.c4,
      name: 'Patil Agro',
      phone: '9988776652',
      email: 'patil@agro.co',
      address: 'Sangli 416416',
      type: 'Company',
      gstin: '27AADFP5678E1Z3',
      pan: 'AADFP5678E',
      state: 'Maharashtra',
      siteAddress: 'Cold storage block — rear shed',
      createdAt: now,
    },
    {
      id: IDS.c5,
      name: 'Anil Kapoor',
      phone: '9988776651',
      email: 'anil.k@gmail.com',
      address: 'Wakad, Pune 411057',
      type: 'Individual',
      pan: 'KAPPA9012L',
      state: 'Maharashtra',
      createdAt: now,
    },
  ];
}

function seedEnquiries(): Enquiry[] {
  const mk = (i: number, partial: Partial<Enquiry> & Pick<Enquiry, 'id' | 'customerName'>): Enquiry => ({
    phone: `9${String(800000000 + i).slice(0, 9)}`,
    email: `lead${i}@example.com`,
    type: i % 2 === 0 ? 'Commercial' : 'Residential',
    source:
      i % 3 === 0
        ? { type: 'Agent', agentId: IDS.a1 }
        : { type: 'Direct', directSource: i % 2 ? 'Walk-in' : 'Social Media' },
    priority: ['Low', 'Medium', 'High'][i % 3] as Enquiry['priority'],
    systemCapacity: 3 + i,
    estimatedBudget: 200000 + i * 50000,
    assignedTo: i % 2 === 0 ? IDS.u4 : IDS.u5,
    roofType: i % 4 === 0 ? 'RCC flat' : i % 4 === 1 ? 'Sheet roof' : 'Tiled',
    monthlyBillAmount: 3500 + i * 400,
    pipelineStage: ['Qualify', 'Survey', 'Proposal', 'Won', 'Lost'][i % 5],
    notes: [],
    status: (['New', 'In Progress', 'Converted', 'Closed', 'New', 'In Progress', 'In Progress', 'Closed', 'New', 'In Progress'][
      i - 1
    ] ?? 'New') as Enquiry['status'],
    createdAt: now,
    updatedAt: now,
    ...partial,
  });
  return [
    mk(1, {
      id: IDS.en1,
      customerName: 'Kiran Joshi',
      status: 'In Progress',
      phone: '9988776655',
      email: 'kiran.j@gmail.com',
      notes: [
        {
          note: 'Customer prefers mono PERC; site survey Tue 10am',
          by: 'Priya Kulkarni',
          updatedBy: IDS.u4,
          timestamp: now,
        },
      ],
      meetingDate: `${y}-${m}-12`,
      followUpDate: `${y}-${m}-20`,
      customerAddress: 'Baner, Pune',
      requirements: 'Net metering + 1 backup port',
    }),
    mk(2, { id: 'enq_2', customerName: 'New Lead A', status: 'New' }),
    mk(3, { id: 'enq_3', customerName: 'New Lead B', status: 'In Progress', source: { type: 'Agent', agentId: IDS.a2 } }),
    mk(4, { id: 'enq_4', customerName: 'Warehouse Co', type: 'Commercial', systemCapacity: 50, roofType: 'Industrial sheet' }),
    mk(5, {
      id: 'enq_5',
      customerName: 'Farm House',
      status: 'Converted',
      notes: [{ note: 'Converted to QUO-2026-008', by: 'Amit Patil', updatedBy: IDS.u5, timestamp: now }],
    }),
    mk(6, { id: 'enq_6', customerName: 'Closed Lead', status: 'Closed' }),
    mk(7, { id: 'enq_7', customerName: 'High Pri', priority: 'High' }),
    mk(8, { id: 'enq_8', customerName: 'Medium Pri', priority: 'Medium' }),
    mk(9, { id: 'enq_9', customerName: 'Direct FB', source: { type: 'Direct', directSource: 'Facebook' } }),
    mk(10, { id: 'enq_10', customerName: 'Agent Raj', source: { type: 'Referral', referredBy: 'Old client Mr. Desai' } }),
    mk(11, {
      id: 'enq_11',
      customerName: 'Tech Park Phase 2',
      type: 'Commercial',
      systemCapacity: 100,
      status: 'New',
      source: { type: 'Online', directSource: 'Website form' },
      assignedTo: IDS.u4,
      pipelineStage: 'Qualify',
    }),
  ];
}

function seedQuotations(presets: Preset[]): Quotation[] {
  const line = (mid: string, q: number, r: number) => ({
    materialId: mid,
    quantity: q,
    rate: r,
    total: q * r,
  });
  const items = [
    line(IDS.mat1, 10, 18500),
    line(IDS.mat2, 1, 52000),
    line(IDS.mat3, 1, 28000),
  ];
  const sub = items.reduce((s, x) => s + x.total, 0);
  const eff = computeEffectivePrice(sub, 2, 18);
  const base: Omit<Quotation, 'id' | 'status' | 'createdAt' | 'updatedAt'> = {
    customerId: IDS.c1,
    enquiryId: IDS.en1,
    agentId: IDS.a1,
    reference: 'QUO-2026-001',
    systemConfigPresetId: presets[0]!.id,
    lineItems: items,
    discountPercent: 2,
    gstPercent: 18,
    effectivePrice: eff,
    paymentTerms: [
      { label: 'Advance', percent: 20 },
      { label: 'On install', percent: 60 },
      { label: 'On DCR', percent: 20 },
    ],
    warrantyInfo: [
      { component: 'Panels', years: 25 },
      { component: 'Inverter', years: 10 },
    ],
    additionalNotes: 'Net metering included',
  };
  const ts = now;
  return [
    {
      ...base,
      id: IDS.q1,
      status: 'Confirmed',
      paymentType: 'Bank Loan + Cash',
      bankLoanDetails: {
        kNumber: 'K-778899',
        lender: 'SBI',
        amount: 300000,
        approvalStatus: 'Approved',
      },
      validityPeriodDays: 21,
      discountType: 'percent',
      discountValue: 2,
      clientAgreedAmount: eff,
      bankDocumentationAmount: 280000,
      shareHistory: [
        { at: ts, channel: 'whatsapp' },
        { at: ts, channel: 'email' },
      ],
      sectionVisibility: { header: true, lineItems: true, paymentTerms: true, warranty: true, notes: true, pricing: true },
      sentDate: ts,
      approvedDate: ts,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_2',
      customerId: IDS.c2,
      reference: 'QUO-2026-002',
      status: 'Approved',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_3',
      customerId: IDS.c3,
      reference: 'QUO-2026-003',
      enquiryId: undefined,
      status: 'Sent',
      sentDate: ts,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_4',
      customerId: IDS.c4,
      reference: 'QUO-2026-004',
      status: 'Draft',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_5',
      customerId: IDS.c5,
      reference: 'QUO-2026-005',
      status: 'Rejected',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_6',
      customerId: IDS.c1,
      reference: 'QUO-2026-006',
      status: 'Draft',
      lineItems: [line(IDS.mat1, 20, 18500)],
      effectivePrice: computeEffectivePrice(20 * 18500, 0, 18),
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_7',
      customerId: IDS.c2,
      reference: 'QUO-2026-007',
      status: 'Sent',
      sentDate: ts,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_8',
      customerId: IDS.c3,
      reference: 'QUO-2026-008',
      status: 'Confirmed',
      paymentType: 'Cash',
      enquiryId: 'enq_5',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_9',
      customerId: IDS.c2,
      reference: 'QUO-2026-009',
      quoteKind: 'Other',
      systemConfigPresetId: presets[0]!.id,
      lineItems: [
        { materialId: IDS.mat2, quantity: 1, rate: 20339, total: 20339, description: 'AMC / O&M bundle (non-standard line)' },
      ],
      effectivePrice: computeEffectivePrice(20339, 0, 18),
      discountPercent: 0,
      gstPercent: 18,
      discountType: 'amount',
      discountValue: 1000,
      validityPeriodDays: 14,
      status: 'Sent',
      sentDate: ts,
      enquiryId: 'enq_4',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      ...base,
      id: 'quo_10',
      customerId: IDS.c1,
      reference: 'QUO-2026-010',
      status: 'Draft',
      shareHistory: [{ at: ts, channel: 'link' }],
      createdAt: ts,
      updatedAt: ts,
    },
  ];
}

function seedProjects(quotations: Quotation[]): Project[] {
  const steps = defaultProgressSteps();
  steps[0]!.status = 'Completed';
  steps[1]!.status = 'In Progress';
  const mk = (
    id: string,
    name: string,
    customerId: string,
    type: Project['type'],
    status: Project['status'],
    cap: number,
    amt: number,
    extra: Partial<Project> = {}
  ): Project => ({
    id,
    name,
    type,
    category: 'Residential',
    status,
    customerId,
    quotationId: quotations.find((q) => q.customerId === customerId)?.id,
    capacity: cap,
    contractAmount: amt,
    startDate: `${y}-01-15`,
    address: 'Pune, MH',
    progressSteps: type === 'Vendorship Fee' ? steps.slice(0, 2) : [...steps],
    blockages: [
      {
        id: 'blk_1',
        description: 'DISCOM inspection slot pending',
        assignedTo: IDS.u3,
        dueDate: `${y}-${m}-15`,
        resolved: false,
      },
    ],
    partnerContributions:
      type === 'Partner with Contributions'
        ? {
            labor: [
              {
                id: 'l1',
                description: 'Welding support',
                hours: 16,
                cost: 12000,
                date: today,
              },
            ],
            materials: [{ id: 'm1', materialId: IDS.mat4, quantity: 20, cost: 2000, date: today }],
          }
        : undefined,
    partnerId: type.includes('Partner') ? IDS.part1 : undefined,
    channelPartnerId: type === 'Vendorship Fee' ? IDS.ch1 : undefined,
    agentId: IDS.a1,
    paymentType: 'Bank Loan + Cash',
    createdAt: now,
    updatedAt: now,
    ...extra,
  });
  return [
    mk(IDS.p1, 'Joshi Residence 5kW', IDS.c1, 'Solo', 'In Progress', 5, 385000, {
      quotationId: IDS.q1,
      progressStage: 'execution',
      operational: {
        fileLogin: 'DISCOM portal — submitted',
        subsidyType: 'State rooftop',
        bankFileType: 'Loan sanction pack',
        loanStage: 'Sanctioned',
        workStatus: 'DC side complete',
        discomStatus: 'Inspection slot requested',
        paymentStatus: 'Advance + partial',
      },
      materialsSent: [
        { id: 'ms_1', materialId: IDS.mat1, quantity: 10, date: `${y}-02-01`, siteId: IDS.s1 },
        { id: 'ms_2', materialId: IDS.mat2, quantity: 1, date: `${y}-02-05`, siteId: IDS.s1 },
        { id: 'ms_3', materialId: IDS.mat3, quantity: 1, date: `${y}-02-06`, siteId: IDS.s1 },
      ],
    }),
    mk('proj_2', 'Shree Foods 20kW', IDS.c2, 'Partner (Profit Only)', 'New', 20, 1200000, {
      category: 'Commercial',
      quotationId: 'quo_2',
      progressStage: 'proposal',
    }),
    mk('proj_3', 'Meera Nair 3kW', IDS.c3, 'Solo', 'Completed', 3, 245000, {
      progressSteps: defaultProgressSteps().map((s) => ({ ...s, status: 'Completed' as const })),
      endDate: `${y}-01-20`,
      quotationId: 'quo_8',
      progressStage: 'completed',
    }),
    mk('proj_4', 'Patil Agro 8kW', IDS.c4, 'Partner with Contributions', 'In Progress', 8, 520000, {
      category: 'Industrial',
      quotationId: 'quo_4',
      progressStage: 'execution',
    }),
    mk('proj_5', 'Channel OEM batch', IDS.c5, 'Vendorship Fee', 'In Progress', 15, 400000, {
      category: 'Commercial',
      quotationId: 'quo_7',
      progressStage: 'contract_active',
    }),
    mk('proj_6', 'Kapoor 4kW', IDS.c5, 'Solo', 'On Hold', 4, 310000, {
      progressStage: 'on_hold',
      quotationId: 'quo_6',
    }),
  ];
}

function seedSites(): Site[] {
  const preset = IDS.pr3;
  const demoPhoto = 'https://picsum.photos/seed/mms-roof/640/360';
  return [
    {
      id: IDS.s1,
      projectId: IDS.p1,
      name: 'Main Rooftop',
      address: 'Baner, Pune',
      photos: [demoPhoto],
      checklistPresetId: preset,
      checklistItems: [
        { itemId: 'ci1', materialId: IDS.mat1, description: 'Panels received', completed: true, completedAt: today },
        { itemId: 'ci2', materialId: IDS.mat2, description: 'Inverter mount', completed: false },
        { itemId: 'ci3', materialId: IDS.mat3, description: 'Structure alignment', completed: true, completedAt: today },
      ],
      siteBlockages: [
        { id: 'sb_demo', description: 'DISCOM inspection slot pending — customer notified', resolved: false, createdAt: now },
      ],
      soloWorkStatus: {
        updatedAt: now,
        areas: [
          {
            id: 'wsa1',
            title: 'Roof & civil',
            items: [
              { id: 'wsi1', title: 'Waterproofing check', done: true, approvalStatus: 'approved' },
              { id: 'wsi2', title: 'Rail layout marking', done: false, approvalStatus: 'pending' },
            ],
          },
          {
            id: 'wsa2',
            title: 'Electrical',
            items: [{ id: 'wsi3', title: 'Earthing pit & pit test', done: false }],
          },
        ],
      },
      createdAt: now,
    },
    {
      id: 'site_2',
      projectId: 'proj_2',
      name: 'Factory roof',
      address: 'Nashik MIDC',
      photos: [],
      checklistItems: [],
      createdAt: now,
    },
    {
      id: 'site_3',
      projectId: 'proj_3',
      name: 'Nair home — west wing',
      address: 'Kothrud, Pune',
      photos: [demoPhoto],
      checklistPresetId: preset,
      checklistItems: [
        { itemId: 'c3a', materialId: IDS.mat1, description: 'Final walkthrough & sign-off', completed: true, completedAt: today },
      ],
      createdAt: now,
    },
    {
      id: 'site_4',
      projectId: 'proj_4',
      name: 'Agro processing shed',
      address: 'Sangli',
      photos: [],
      checklistItems: [],
      createdAt: now,
    },
    {
      id: 'site_5',
      projectId: 'proj_5',
      name: 'Channel partner batch site',
      address: 'Chakan industrial belt',
      photos: [],
      checklistItems: [],
      createdAt: now,
    },
    {
      id: 'site_6',
      projectId: 'proj_6',
      name: 'Kapoor rooftop',
      address: 'Wakad, Pune',
      photos: [],
      siteBlockages: [{ id: 'sb2', description: 'Inverter shipment delayed (resolved in system)', resolved: true, createdAt: now }],
      checklistItems: [],
      createdAt: now,
    },
  ];
}

function seedTools(): Tool[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `tool_${i + 1}`,
    name: ['Crimping kit', 'Multimeter', 'Drill', 'Angle grinder', 'Torque wrench', 'Safety harness', 'Ladder 12ft', 'Cable tray bender'][i]!,
    category: 'Installation',
    purchaseRate: 2000 + i * 500,
    purchaseDate: `${y - 1}-06-${String(i + 1).padStart(2, '0')}`,
    condition: (['Good', 'Good', 'Under Repair', 'Good', 'Good', 'Damaged', 'Good', 'Good'][i] ?? 'Good') as Tool['condition'],
    lastUpdated: now,
    createdAt: now,
    assignedTo: i < 2 ? IDS.u6 : undefined,
    ...(i === 0
      ? { usefulLifeYears: 5, salvageValue: 400, depreciationMethod: 'SLM' as const }
      : i === 1
        ? { usefulLifeYears: 4, salvageValue: 200, depreciationMethod: 'WDV' as const, wdvRatePercent: 25 }
        : {}),
  }));
}

function seedTasks(projects: Project[]): Task[] {
  const p = projects[0]!;
  const completed = projects.find((x) => x.status === 'Completed');
  const base: Task[] = [
    {
      id: 'task_1',
      projectId: p.id,
      siteId: IDS.s1,
      title: 'Panel mounting row A',
      description: 'Complete first row',
      assignedTo: [IDS.u6, IDS.u7],
      dueDate: `${y}-${m}-28`,
      priority: 'High',
      status: 'In Progress',
      kind: 'Task',
      progressStep: 4,
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'task_2',
      projectId: p.id,
      title: 'DC wiring',
      description: '',
      assignedTo: [IDS.u6],
      dueDate: `${y}-${m}-05`,
      priority: 'Medium',
      status: 'Pending',
      kind: 'Task',
      progressStep: 3,
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
  ];
  if (completed) {
    base.push({
      id: 'tkt_1',
      projectId: completed.id,
      title: 'AMC follow-up call',
      description: 'Post-completion ticket',
      assignedTo: [IDS.u4],
      dueDate: `${y}-${m}-20`,
      priority: 'Low',
      status: 'Pending',
      kind: 'Ticket',
      createdAt: now,
      updatedAt: now,
      comments: [{ userId: IDS.u4, text: 'Call scheduled week 12', timestamp: now }],
    });
  }
  const p2 = projects.find((x) => x.id === 'proj_2');
  if (p2) {
    base.push({
      id: 'task_3',
      projectId: p2.id,
      siteId: 'site_2',
      title: 'Structural sign-off with consultant',
      description: 'Share load calculations',
      assignedTo: [IDS.u3],
      dueDate: `${y}-${m}-22`,
      priority: 'High',
      status: 'In Progress',
      kind: 'Task',
      taskType: 'meeting',
      progressStep: 2,
      createdAt: now,
      updatedAt: now,
      comments: [],
    });
  }
  const p4 = projects.find((x) => x.id === 'proj_4');
  if (p4) {
    base.push({
      id: 'task_4',
      projectId: p4.id,
      title: 'Cable pull — shed length',
      assignedTo: [IDS.u6, IDS.u7],
      dueDate: `${y}-${m}-30`,
      priority: 'Medium',
      status: 'Pending',
      kind: 'Task',
      taskType: 'work',
      progressStep: 5,
      description: '',
      createdAt: now,
      updatedAt: now,
      comments: [],
    });
  }
  return base;
}

function seedAttendance(users: User[]): Attendance[] {
  const out: Attendance[] = [];
  let n = 0;
  for (let d = 1; d <= 15; d++) {
    const date = `${y}-${m}-${String(d).padStart(2, '0')}`;
    users.slice(0, 7).forEach((u) => {
      const st = d % 7 === 0 ? 'Paid Leave' : d % 11 === 0 ? 'Absent' : 'Present';
      out.push({
        id: `att_${n++}`,
        employeeId: u.id,
        date,
        status: st as Attendance['status'],
        siteId: st === 'Present' ? IDS.s1 : undefined,
        markedBy: IDS.u2,
      });
    });
  }
  return out;
}

function seedInvoicesPayments(projects: Project[], customers: Customer[]): { inv: Invoice[]; pay: Payment[] } {
  const inv: Invoice[] = [];
  const pay: Payment[] = [];
  let i = 0;
  projects.slice(0, 5).forEach((proj, idx) => {
    const cust = customers.find((c) => c.id === proj.customerId) ?? customers[0]!;
    const total = Math.round(proj.contractAmount * 0.4);
    const baseReceived = idx < 3 ? Math.round(total * 0.5) : 0;
    const advanceExtra = idx === 1 ? Math.round(total * 0.1) : 0;
    const received = baseReceived + advanceExtra;
    const id = `inv_${++i}`;
    const taxable = Math.round(total / 1.18);
    const taxTotal = total - taxable;
    const baseInv: Invoice = {
      id,
      projectId: proj.id,
      customerId: cust.id,
      invoiceNumber: `INV-2026-${100 + i}`,
      date: `${y}-02-${10 + i}`,
      dueDate: `${y}-03-${String(15 + i).padStart(2, '0')}`,
      total,
      received,
      balance: total - received,
      status: received === 0 ? 'Unpaid' : received >= total ? 'Paid' : 'Partial',
      createdAt: now,
    };
    if (idx === 0) {
      inv.push({
        ...baseInv,
        lineItems: [
          {
            description: 'Solar EPC — supply, install, net metering (5kW)',
            hsn: '998714',
            quantity: 1,
            rate: taxable,
            gstRate: 18,
            amount: taxable,
          },
        ],
        gstBreakup: {
          taxableValue: taxable,
          cgst: Math.round(taxTotal / 2),
          sgst: taxTotal - Math.round(taxTotal / 2),
          igst: 0,
          totalTax: taxTotal,
        },
        bankDocumentationAmount: 250000,
        quotationId: IDS.q1,
        customerGstin: cust.gstin,
        placeOfSupply: cust.state ?? 'Maharashtra',
        customerAddress: cust.siteAddress ?? cust.address,
        customerContact: cust.phone,
        paymentTerms: '40% advance · 50% on install · 10% on DCR',
        notes: 'Demo row with full GST line for PDF / register views',
      });
    } else {
      inv.push(baseInv);
    }
    if (received > 0 && idx === 0) {
      const loanPart = Math.min(35000, received);
      const bankPart = received - loanPart;
      pay.push({
        id: `pay_${i}_bank`,
        invoiceId: id,
        amount: bankPart,
        mode: 'Bank Transfer',
        date: `${y}-02-${12 + i}`,
        reference: 'NEFT-REF-DEMO-001',
        createdAt: now,
      });
      pay.push({
        id: `pay_${i}_loan`,
        invoiceId: id,
        amount: loanPart,
        mode: 'Loan Disbursement',
        date: `${y}-02-14`,
        reference: 'SBI tranche — demo',
        createdAt: now,
      });
    } else if (received > 0 && idx === 1) {
      pay.push({
        id: `pay_${i}`,
        invoiceId: id,
        amount: baseReceived,
        mode: 'UPI',
        date: `${y}-02-${12 + i}`,
        createdAt: now,
      });
      pay.push({
        id: `pay_${i}_adv`,
        invoiceId: id,
        amount: advanceExtra,
        mode: 'UPI',
        date: `${y}-02-${18 + i}`,
        isAdvance: true,
        createdAt: now,
      });
    } else if (received > 0) {
      pay.push({
        id: `pay_${i}`,
        invoiceId: id,
        amount: received,
        mode: 'UPI',
        date: `${y}-02-${12 + i}`,
        createdAt: now,
      });
    }
  });
  return { inv, pay };
}

function seedFinanceRest(): {
  suppliers: Supplier[];
  bills: PurchaseBill[];
  loans: Loan[];
  partners: Partner[];
  channel: ChannelPartner[];
  expenses: CompanyExpense[];
  saleBills: SaleBill[];
} {
  const suppliers: Supplier[] = [
    {
      id: IDS.sup1,
      name: 'Adani Solar Dist.',
      contact: '9022334455',
      email: 'sales@adani-dist.in',
      address: 'Mumbai',
      outstanding: 125000,
      totalPurchases: 890000,
      totalPaid: 765000,
      createdAt: now,
    },
    {
      id: 'sup_2',
      name: 'Waaree Partner',
      contact: '9022334466',
      email: 'b2b@waaree.in',
      address: 'Ahmedabad',
      outstanding: 45000,
      totalPurchases: 450000,
      totalPaid: 405000,
      createdAt: now,
    },
    {
      id: 'sup_3',
      name: 'Polycab Industrial',
      contact: '9022334477',
      email: 'ind@polycab.com',
      address: 'Halol',
      outstanding: 0,
      totalPurchases: 120000,
      totalPaid: 120000,
      createdAt: now,
    },
  ];
  const bills: PurchaseBill[] = [
    {
      id: 'pb_1',
      supplierId: IDS.sup1,
      billNumber: 'ADN-88992',
      date: `${y}-03-01`,
      items: [
        {
          materialId: IDS.mat1,
          quantity: 50,
          rate: 14200,
          total: 50 * 14200,
          hsn: '85414011',
          gstRatePercent: 18,
          cgst: Math.round((50 * 14200 * 0.18) / 2),
          sgst: Math.round((50 * 14200 * 0.18) / 2),
        },
        {
          materialId: IDS.mat2,
          quantity: 5,
          rate: 41000,
          total: 5 * 41000,
          hsn: '85044010',
          gstRatePercent: 18,
          cgst: Math.round((5 * 41000 * 0.18) / 2),
          sgst: Math.round((5 * 41000 * 0.18) / 2),
        },
      ],
      total: 50 * 14200 + 5 * 41000,
      paid: 400000,
      due: 50 * 14200 + 5 * 41000 - 400000,
      status: 'Partial',
      createdAt: now,
    },
    {
      id: 'pb_2',
      supplierId: 'sup_2',
      billNumber: 'WR-11223',
      date: `${y}-03-10`,
      items: [{ materialId: IDS.mat3, quantity: 20, rate: 19500, total: 20 * 19500 }],
      total: 20 * 19500,
      paid: 20 * 19500,
      due: 0,
      status: 'Paid',
      createdAt: now,
    },
  ];
  const loans: Loan[] = [
    {
      id: 'loan_1',
      source: 'HDFC Business Loan',
      type: 'EMI',
      principal: 2500000,
      rate: 11.5,
      paymentInfo: '₹27,450/mo',
      outstanding: 1800000,
      status: 'Active',
      projectId: IDS.p1,
      repayments: [{ amount: 27450, date: `${y}-03-05` }],
      createdAt: now,
    },
    {
      id: 'loan_2',
      source: 'Vendor credit',
      type: 'One-Time',
      principal: 200000,
      paymentInfo: `Due 1 Jun ${String(y).slice(2)}`,
      outstanding: 200000,
      status: 'Active',
      repayments: [],
      createdAt: now,
    },
    {
      id: 'loan_3',
      source: 'Equipment lease',
      type: 'EMI',
      principal: 500000,
      paymentInfo: '₹12,100/mo',
      outstanding: 320000,
      status: 'Active',
      repayments: [],
      createdAt: now,
    },
    {
      id: 'loan_4',
      source: 'Old term loan',
      type: 'One-Time',
      principal: 100000,
      paymentInfo: 'Closed',
      outstanding: 0,
      status: 'Closed',
      repayments: [{ amount: 100000, date: `${y - 1}-12-01` }],
      createdAt: now,
    },
  ];
  const partners: Partner[] = [
    { id: IDS.part1, name: 'Ajay Partners LLP', contact: '9011122233', profitSharePercent: 25, createdAt: now },
    { id: 'part_2', name: 'Solar Ventures', contact: '9044455566', profitSharePercent: 15, createdAt: now },
  ];
  const channel: ChannelPartner[] = [
    {
      id: IDS.ch1,
      name: 'Tata Power Solar Store',
      vendorCode: 'TPS-WH-01',
      contact: '9088877766',
      pricingTier: 'Wholesale',
      feeStructure: 'Per kW',
      feeAmount: 350,
      createdAt: now,
    },
  ];
  const seedExpenseDefs: { pillar: ExpensePillarId; cat: string; sub: string }[] = [
    { pillar: 'OFFICE', cat: 'rent', sub: 'mrent' },
    { pillar: 'OFFICE', cat: 'electric', sub: 'ebill' },
    { pillar: 'SITE', cat: 'transport', sub: 'cv' },
    { pillar: 'EMPLOYEE', cat: 'food', sub: 'site' },
    { pillar: 'PARTNER', cat: 'pprofit', sub: 'pp' },
    { pillar: 'OWNER', cat: 'withdraw', sub: 'w' },
    { pillar: 'COMPANY', cat: 'other', sub: 'misc' },
  ];
  function expenseCategoryPath(pillarId: ExpensePillarId, catId: string, subId: string): string {
    const p = EXPENSE_TAXONOMY.find((x) => x.id === pillarId)!;
    const c = p.categories.find((x) => x.id === catId)!;
    const s = c.subs.find((x) => x.id === subId)!;
    return `${p.label} › ${c.label} › ${s.label}`;
  }
  const expenses: CompanyExpense[] = Array.from({ length: 20 }, (_, i) => {
    const def = seedExpenseDefs[i % seedExpenseDefs.length]!;
    const { pillar, cat, sub } = def;
    return {
      id: `cexp_${i}`,
      category: expenseCategoryPath(pillar, cat, sub),
      subCategory: sub,
      taxonomyKey: expenseTaxonomyKey(pillar, cat, sub),
      pillar,
      payerType: i % 3 === 0 ? 'Company' : 'Employee',
      amount: 5000 + i * 1250,
      date: `${y}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
      projectId: i % 4 === 0 ? IDS.p1 : undefined,
      paidBy: i % 3 === 0 ? 'company' : 'Neha Sharma',
      mode: 'Bank Transfer',
      notes: `Expense ${i + 1}`,
      createdAt: now,
    };
  });
  const saleBills: SaleBill[] = [
    {
      id: 'sb_1',
      projectId: IDS.p1,
      customerId: IDS.c1,
      billNumber: 'SB-2026-01',
      date: `${y}-02-20`,
      total: 50000,
      received: 50000,
      balance: 0,
      status: 'Paid',
      lineItems: [
        { description: 'Additional ACDB upgrade', hsn: '85044010', quantity: 1, rate: 42373, gstRate: 18, amount: 42373 },
      ],
      gstBreakup: { taxableValue: 42373, cgst: 3814, sgst: 3813, igst: 0, totalTax: 7627 },
      placeOfSupply: 'Maharashtra',
      createdAt: now,
    },
    {
      id: 'sb_2',
      projectId: 'proj_3',
      customerId: IDS.c3,
      billNumber: 'SB-2026-02',
      date: `${y}-01-25`,
      total: 12000,
      received: 6000,
      balance: 6000,
      status: 'Partial',
      notes: 'AMC invoice — demo partial',
      createdAt: now,
    },
  ];
  return { suppliers, bills, loans, partners, channel, expenses, saleBills };
}

function seedIncomeRecords(): IncomeRecord[] {
  return [
    {
      id: 'inc_1',
      pillar: 'PROJECT',
      category: 'Client payment',
      subCategory: 'adv',
      taxonomyKey: incomeTaxonomyKey('PROJECT', 'client', 'adv'),
      amount: 48000,
      date: `${y}-02-10`,
      paymentMode: 'Bank Transfer',
      projectId: IDS.p1,
      reference: 'UTR991122',
      notes: 'Advance — milestone 1',
      createdAt: now,
    },
    {
      id: 'inc_2',
      pillar: 'PROJECT',
      category: 'Other project income',
      subCategory: 'misc',
      taxonomyKey: incomeTaxonomyKey('PROJECT', 'other', 'misc'),
      amount: 12500,
      date: `${y}-01-15`,
      paymentMode: 'Cash',
      projectId: 'proj_3',
      notes: 'AMC top-up (completed project)',
      createdAt: now,
    },
    {
      id: 'inc_3',
      pillar: 'PARTNER',
      category: 'Partner investment',
      subCategory: 'co',
      taxonomyKey: incomeTaxonomyKey('PARTNER', 'invest', 'co'),
      amount: 200000,
      date: `${y}-03-01`,
      paymentMode: 'Bank Transfer',
      partnerId: IDS.part1,
      notes: 'Capital infusion — Q1 demo',
      createdAt: now,
    },
    {
      id: 'inc_4',
      pillar: 'COMPANY',
      category: 'Interest income',
      subCategory: 'fd',
      taxonomyKey: incomeTaxonomyKey('COMPANY', 'interest', 'fd'),
      amount: 3400,
      date: `${y}-03-05`,
      paymentMode: 'Bank Transfer',
      notes: 'FD interest (prototype)',
      createdAt: now,
    },
    {
      id: 'inc_5',
      pillar: 'EMPLOYEE',
      category: 'Employee paid for company',
      subCategory: 'exp',
      taxonomyKey: incomeTaxonomyKey('EMPLOYEE', 'paid', 'exp'),
      amount: 2200,
      date: `${y}-02-22`,
      paymentMode: 'UPI',
      employeeId: IDS.u6,
      notes: 'Petty material purchase reimbursed',
      createdAt: now,
    },
  ];
}

function seedEmployeeExpenses(): EmployeeExpense[] {
  return [
    {
      id: 'ee_1',
      employeeId: IDS.u4,
      date: today,
      category: 'Travel',
      amount: 1850,
      projectId: IDS.p1,
      paymentMode: 'UPI',
      notes: 'Pune client visit',
      createdAt: now,
    },
    {
      id: 'ee_2',
      employeeId: IDS.u5,
      date: today,
      category: 'Food',
      amount: 420,
      paymentMode: 'Cash',
      notes: 'Field lunch',
      createdAt: now,
    },
    {
      id: 'ee_3',
      employeeId: IDS.u6,
      date: today,
      category: 'Stay',
      amount: 1200,
      projectId: IDS.p1,
      paymentMode: 'UPI',
      notes: 'Outstation night halt',
      createdAt: now,
    },
  ];
}

function seedMaterialDemo(): { transfers: MaterialTransfer[]; returns: MaterialReturn[] } {
  return {
    transfers: [
      {
        id: 'xfer_1',
        materialId: IDS.mat4,
        projectId: IDS.p1,
        siteId: IDS.s1,
        quantityInIssueUnit: 40,
        quantityDeductedPurchase: 40,
        date: `${y}-02-02`,
        createdAt: now,
      },
      {
        id: 'xfer_2',
        materialId: IDS.mat1,
        projectId: 'proj_4',
        siteId: 'site_4',
        quantityInIssueUnit: 4,
        quantityDeductedPurchase: 4,
        date: `${y}-03-01`,
        createdAt: now,
      },
    ],
    returns: [
      {
        id: 'mret_1',
        materialId: IDS.mat4,
        projectId: IDS.p1,
        siteId: IDS.s1,
        quantityInIssueUnit: 5,
        action: 'to_stock',
        date: `${y}-02-20`,
        createdAt: now,
      },
      {
        id: 'mret_2',
        materialId: IDS.mat5,
        projectId: IDS.p1,
        quantityInIssueUnit: 10,
        action: 'scrap',
        damageReason: 'Rodent damage — demo write-off',
        date: `${y}-02-22`,
        conditionNotes: 'Unusable length',
        createdAt: now,
      },
      {
        id: 'mret_3',
        materialId: IDS.mat3,
        projectId: 'proj_2',
        siteId: 'site_2',
        quantityInIssueUnit: 1,
        action: 'transfer_site',
        targetSiteId: IDS.s1,
        date: `${y}-03-02`,
        createdAt: now,
      },
    ],
  };
}

function seedToolMovements(): ToolMovement[] {
  return [
    {
      id: 'tm_1',
      toolId: 'tool_1',
      type: 'issue',
      employeeId: IDS.u6,
      siteId: IDS.s1,
      date: `${y}-02-01`,
      notes: 'Crimping kit for Joshi site',
      createdAt: now,
    },
    {
      id: 'tm_2',
      toolId: 'tool_1',
      type: 'return',
      employeeId: IDS.u6,
      date: `${y}-02-25`,
      condition: 'Good',
      createdAt: now,
    },
    {
      id: 'tm_3',
      toolId: 'tool_3',
      type: 'transfer',
      siteId: 'site_4',
      date: `${y}-03-03`,
      notes: 'Drill moved to Agro shed job',
      createdAt: now,
    },
  ];
}

function seedPayroll(users: User[]): PayrollRecord[] {
  const monthKey = `${y}-${m}`;
  return users
    .filter((u) => u.role !== 'Super Admin')
    .slice(0, 6)
    .map((u, i) => ({
      id: `payroll_${u.id}`,
      employeeId: u.id,
      month: monthKey,
      year: y,
      netPayable: 28000 + i * 1750,
      paid: i < 4,
      paidDate: i < 4 ? today : undefined,
      createdAt: now,
    }));
}

function seedPartnerSettlements(): PartnerSettlement[] {
  return [
    {
      id: 'ps_1',
      partnerId: IDS.part1,
      projectId: 'proj_2',
      amount: 85000,
      date: `${y}-02-28`,
      notes: 'Profit share accrual (demo)',
      createdAt: now,
    },
    {
      id: 'ps_2',
      partnerId: 'part_2',
      amount: 15000,
      date: `${y}-03-01`,
      notes: 'Ad-hoc settlement',
      createdAt: now,
    },
  ];
}

function seedVendorPayments(): VendorPayment[] {
  return [
    {
      id: 'vp_1',
      purchaseBillId: 'pb_1',
      supplierId: IDS.sup1,
      amount: 400000,
      date: `${y}-03-02`,
      createdAt: now,
    },
    {
      id: 'vp_2',
      purchaseBillId: 'pb_1',
      supplierId: IDS.sup1,
      amount: 50000,
      date: `${y}-03-08`,
      createdAt: now,
    },
  ];
}

function seedHolidays(): CompanyHoliday[] {
  return [
    { id: 'h1', date: `${y}-01-26`, label: 'Republic Day', createdAt: now },
    { id: 'h2', date: `${y}-03-14`, label: 'Holi', createdAt: now },
    { id: 'h3', date: `${y}-08-15`, label: 'Independence Day', createdAt: now },
  ];
}

function seedAudit(users: User[]): AuditLogEntry[] {
  const u1 = users.find((u) => u.id === IDS.u1);
  const u2 = users.find((u) => u.id === IDS.u2);
  const u4 = users.find((u) => u.id === IDS.u4);
  return [
    {
      id: 'aud_1',
      timestamp: now,
      userId: IDS.u1,
      userName: u1?.name,
      action: 'create',
      entityType: 'Invoice',
      entityId: 'inv_1',
      entityName: 'INV-2026-101',
    },
    {
      id: 'aud_2',
      timestamp: now,
      userId: IDS.u2,
      userName: u2?.name,
      action: 'update',
      entityType: 'Project',
      entityId: IDS.p1,
      field: 'status',
      oldValue: 'New',
      newValue: 'In Progress',
    },
    {
      id: 'aud_3',
      timestamp: now,
      userId: IDS.u4,
      userName: u4?.name,
      action: 'create',
      entityType: 'Quotation',
      entityId: IDS.q1,
      entityName: 'QUO-2026-001',
    },
  ];
}

function seedLedgerDemo(): { vouchers: Voucher[]; lines: LedgerLine[] } {
  const vouchers: Voucher[] = [
    {
      id: 'vch_1',
      type: 'Receipt',
      date: today,
      narration: 'Bank receipt against invoice (demo voucher)',
      postedFrom: { entityType: 'payment', entityId: 'pay_1_bank' },
      createdAt: now,
    },
    {
      id: 'vch_2',
      type: 'Journal',
      date: today,
      narration: 'Month-end rounding — demo',
      createdAt: now,
    },
  ];
  const lines: LedgerLine[] = [
    {
      id: 'll_1',
      voucherId: 'vch_1',
      accountId: 'coa_bank',
      debit: 42000,
      credit: 0,
      narration: 'HDFC receipt',
      createdAt: now,
    },
    {
      id: 'll_2',
      voucherId: 'vch_1',
      accountId: 'coa_debtors',
      debit: 0,
      credit: 42000,
      narration: 'Reduce receivable',
      createdAt: now,
    },
    {
      id: 'll_3',
      voucherId: 'vch_2',
      accountId: 'coa_gst_output',
      debit: 50,
      credit: 0,
      createdAt: now,
    },
    {
      id: 'll_4',
      voucherId: 'vch_2',
      accountId: 'coa_inc_other',
      debit: 0,
      credit: 50,
      createdAt: now,
    },
  ];
  return { vouchers, lines };
}

function seedMasterData(): MasterData[] {
  const blocks: { type: MasterData['type']; values: string[] }[] = [
    { type: 'PanelBrand', values: ['Waaree', 'Adani', 'Canadian Solar', 'Trina'] },
    { type: 'InverterBrand', values: ['Growatt', 'SMA', 'Fronius', 'Enphase'] },
    { type: 'StructureType', values: ['Elevated', 'Flush', 'Shed mount', 'Ground'] },
    { type: 'SystemCapacity', values: ['3kW', '5kW', '8kW', '10kW', '20kW', '50kW'] },
    { type: 'ExpenseMainCategory', values: ['Site', 'Office', 'Vehicle', 'Marketing'] },
    { type: 'ExpenseSubCategory', values: ['Transport', 'Rent', 'Fuel', 'Events'] },
    { type: 'DocumentTemplate', values: ['Quotation PDF v2', 'Invoice GST', 'LOA standard'] },
  ];
  return blocks.flatMap((b) =>
    b.values.map((v, j) => ({
      id: `md_${b.type}_${j}`,
      type: b.type,
      value: v,
      order: j,
    }))
  );
}

function assertDemoSeedFksDev(): void {
  if (!import.meta.env.DEV) return;
  const projects = getCollection<Project>('projects');
  const customers = getCollection<Customer>('customers');
  const invoices = getCollection<Invoice>('invoices');
  const pids = new Set(projects.map((x) => x.id));
  const cids = new Set(customers.map((x) => x.id));
  const iids = new Set(invoices.map((x) => x.id));
  for (const t of getCollection<Task>('tasks')) {
    if (!pids.has(t.projectId)) console.warn('[seed FK]', 'task', t.id, 'bad projectId', t.projectId);
  }
  for (const s of getCollection<Site>('sites')) {
    if (!pids.has(s.projectId)) console.warn('[seed FK]', 'site', s.id, 'bad projectId', s.projectId);
  }
  for (const inv of invoices) {
    if (!pids.has(inv.projectId)) console.warn('[seed FK]', 'invoice', inv.id, 'bad projectId', inv.projectId);
    if (!cids.has(inv.customerId)) console.warn('[seed FK]', 'invoice', inv.id, 'bad customerId', inv.customerId);
  }
  for (const pay of getCollection<Payment>('payments')) {
    if (!iids.has(pay.invoiceId)) console.warn('[seed FK]', 'payment', pay.id, 'bad invoiceId', pay.invoiceId);
  }
  for (const q of getCollection<Quotation>('quotations')) {
    if (!cids.has(q.customerId)) console.warn('[seed FK]', 'quotation', q.id, 'bad customerId', q.customerId);
  }
}

export function runSeed(): void {
  clearAllSolarKeys();
  const users = [...seedUsers(), ...seedDemoUsersExtra()];
  const agents = seedAgents();
  const materials = mergeMaterialsPack62IfAbsent(seedMaterials(), now);
  const presets = seedPresets(materials);
  const customers = seedCustomers();
  const enquiries = seedEnquiries();
  const quotations = [...seedQuotations(presets), ...bulkQuotations(now, presets[0]!.id)];
  const quotationsBaseOnly = quotations.filter((q) => !q.id.startsWith('quo_bulk_'));
  const projects = [...seedProjects(quotationsBaseOnly), ...bulkProjects(now)];
  const sites = [...seedSites(), ...bulkSites(now)];
  const tools = [...seedTools(), ...bulkTools(now)];
  const projectsBaseOnly = projects.filter((p) => !p.id.startsWith('proj_bulk_'));
  const tasks = [...seedTasks(projectsBaseOnly), ...bulkTasks(now)];
  const attendance = [...seedAttendance(users), ...bulkAttendance(users, y, m)];
  const { inv, pay } = seedInvoicesPayments(projectsBaseOnly, customers);
  const bulkInvPay = bulkInvoicesPayments(now, y);
  const fin = seedFinanceRest();
  const masterData = seedMasterData();
  const incomeRecords = seedIncomeRecords();
  const employeeExpenses = seedEmployeeExpenses();
  const { transfers: materialTransfers, returns: materialReturns } = seedMaterialDemo();
  const toolMovements = seedToolMovements();
  const payrollRecords = seedPayroll(users);
  const partnerSettlements = seedPartnerSettlements();
  const vendorPayments = seedVendorPayments();
  const companyHolidays = seedHolidays();
  const auditLogs = seedAudit(users);
  const { vouchers, lines: ledgerLines } = seedLedgerDemo();
  const profile: CompanyProfile = {
    name: 'GreenRay Solar Pvt Ltd',
    logo: '',
    gst: '27AABCG1234F1Z5',
    address: '402, Business Park, Pune 411045',
    bankAccount: 'HDFC Current A/c 50100*****21',
  };

  const bulkVL = bulkVouchersLedger(now, y);

  setCollection('users', users);
  setCollection('agents', [...agents, ...bulkAgents(now)]);
  setCollection('materials', materials);
  setCollection('presets', presets);
  setCollection('customers', [...customers, ...bulkCustomers(now)]);
  setCollection('enquiries', [...enquiries, ...bulkEnquiries(now)]);
  setCollection('quotations', quotations);
  setCollection('projects', projects);
  setCollection('sites', sites);
  setCollection('tools', tools);
  setCollection('tasks', tasks);
  setCollection('attendance', attendance);
  setCollection('invoices', [...inv, ...bulkInvPay.invoices]);
  setCollection('payments', [...pay, ...bulkInvPay.payments]);
  setCollection('suppliers', [...fin.suppliers, ...bulkSuppliers(now)]);
  setCollection('purchaseBills', [...fin.bills, ...bulkPurchaseBills(now, y)]);
  setCollection('vendorPayments', [...vendorPayments, ...bulkVendorPayments(now, y)]);
  setCollection('loans', [...fin.loans, ...bulkLoans(now, y)]);
  setCollection('partners', [...fin.partners, ...bulkPartners(now)]);
  setCollection('channelPartners', [...fin.channel, ...bulkChannelPartners(now)]);
  setCollection('companyExpenses', [...fin.expenses, ...bulkCompanyExpenses(now, y)]);
  setCollection('saleBills', [...fin.saleBills, ...bulkSaleBills(now, y)]);
  setCollection('employeeExpenses', [...employeeExpenses, ...bulkEmployeeExpenses(now, today)]);
  setCollection('masterData', [...masterData, ...bulkMasterData()]);
  setCollection('materialTransfers', [...materialTransfers, ...bulkMaterialTransfers(now, y)]);
  const outsourceSample: OutsourceWork[] = [
    {
      id: 'os_1',
      projectId: IDS.p1,
      type: 'JCB hire',
      quantity: 2,
      cost: 8000,
      date: `${y}-02-15`,
      notes: 'Foundation pit',
      createdAt: now,
    },
  ];
  setCollection('payrollRecords', payrollRecords);
  setCollection('partnerSettlements', [...partnerSettlements, ...bulkPartnerSettlements(now, y)]);
  setCollection('channelFees', [
    {
      id: 'cf_1',
      channelPartnerId: IDS.ch1,
      projectId: 'proj_5',
      amount: 5250,
      date: `${y}-03-01`,
      notes: 'Fee for 15kW batch',
      createdAt: now,
    },
    ...bulkChannelFees(now, y),
  ] as ChannelPartnerFee[]);
  const notifs: AppNotification[] = [
    { id: 'n1', message: 'Low stock: open Materials desk and run reorder review', type: 'warning', read: false, createdAt: now },
    { id: 'n2', message: 'Invoice INV-2026-101 — balance due (demo)', type: 'info', read: false, createdAt: now },
    { id: 'n3', message: 'Quotation QUO-2026-003 sent to customer', type: 'info', read: true, createdAt: now },
    { id: 'n4', message: 'Partner settlement ps_1 recorded for Shree Foods project', type: 'success', read: false, createdAt: now },
    { id: 'n5', message: 'Tool #1 returned from site — good condition', type: 'info', read: true, createdAt: now },
    {
      id: 'n6',
      message: 'Approval pending: Site travel — Nashik run',
      type: 'info',
      read: false,
      approvalId: 'apr_1',
      createdAt: now,
    },
  ];
  setCollection('notifications', [...notifs, ...bulkNotifications(now)]);
  setCollection('incomeRecords', [...incomeRecords, ...bulkIncome(now, y)]);
  setCollection('approvalRequests', [
    {
      id: 'apr_1',
      kind: 'expense',
      status: 'pending',
      title: 'Site travel — Nashik run',
      detail: 'Toll + fuel for Shree Foods survey',
      amount: 3200,
      payload: {},
      requestedAt: now,
      employeeName: 'Amit Patil',
    },
    {
      id: 'apr_2',
      kind: 'leave',
      status: 'approved',
      title: 'Casual leave (1 day)',
      detail: 'Family function',
      payload: {},
      requestedAt: now,
      employeeName: 'Priya Kulkarni',
    },
    {
      id: 'apr_3',
      kind: 'blockage',
      status: 'pending',
      title: 'DISCOM inspection queue',
      detail: 'Customer Joshi — slot not allocated',
      projectName: 'Joshi Residence 5kW',
      payload: {},
      requestedAt: now,
    },
    ...bulkApprovals(now),
  ] as ApprovalRequest[]);
  setCollection('auditLogs', [...auditLogs, ...bulkAudit(users, now)]);
  setCollection('companyHolidays', [...companyHolidays, ...bulkHolidays(now, y)]);
  setCollection('toolMovements', [...toolMovements, ...bulkToolMovements(now, y)]);
  setCollection('materialReturns', [...materialReturns, ...bulkMaterialReturns(now, y)]);
  setCollection('outsourceWork', [...outsourceSample, ...bulkOutsource(now, y)]);
  setCollection('vouchers', [...vouchers, ...bulkVL.vouchers]);
  setCollection('ledgerLines', [...ledgerLines, ...bulkVL.lines]);
  setItem('companyProfile', profile);
  assertDemoSeedFksDev();
  localStorage.setItem(STORAGE_KEYS.seeded, '1');
  localStorage.setItem(STORAGE_KEYS.currentRole, 'Super Admin');
  localStorage.setItem('solar_demoSeedVersion', DEMO_SEED_VERSION);
}

export function ensureSeed(): void {
  const v = localStorage.getItem('solar_demoSeedVersion');
  if (!localStorage.getItem(STORAGE_KEYS.seeded) || v !== DEMO_SEED_VERSION) {
    runSeed();
  }
  runDataMigrations();
}
