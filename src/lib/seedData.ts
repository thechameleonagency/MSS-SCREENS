import type {
  Agent,
  AppNotification,
  Attendance,
  ChannelPartner,
  ChannelPartnerFee,
  CompanyExpense,
  CompanyProfile,
  Customer,
  EmployeeExpense,
  Enquiry,
  Invoice,
  Loan,
  MasterData,
  Material,
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
  User,
} from '../types';
import { STORAGE_KEYS } from '../types';
import {
  clearAllSolarKeys,
  setCollection,
  setItem,
} from './storage';
import { computeEffectivePrice, defaultExpenseTagForRole, defaultProgressSteps } from './helpers';

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
  ];
}

function seedCustomers(): Customer[] {
  return [
    {
      id: IDS.c1,
      name: 'Kiran Joshi',
      phone: '9988776655',
      email: 'kiran.j@gmail.com',
      address: 'Baner, Pune',
      type: 'Individual',
      createdAt: now,
    },
    {
      id: IDS.c2,
      name: 'Shree Foods Pvt Ltd',
      phone: '9988776654',
      email: 'accounts@shreefoods.in',
      address: 'MIDC, Nashik',
      type: 'Company',
      createdAt: now,
    },
    {
      id: IDS.c3,
      name: 'Meera Nair',
      phone: '9988776653',
      email: 'meera.n@yahoo.com',
      address: 'Kothrud, Pune',
      type: 'Individual',
      createdAt: now,
    },
    {
      id: IDS.c4,
      name: 'Patil Agro',
      phone: '9988776652',
      email: 'patil@agro.co',
      address: 'Sangli',
      type: 'Company',
      createdAt: now,
    },
    {
      id: IDS.c5,
      name: 'Anil Kapoor',
      phone: '9988776651',
      email: 'anil.k@gmail.com',
      address: 'Wakad, Pune',
      type: 'Individual',
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
    notes: [],
    status: (['New', 'In Progress', 'Converted', 'Closed', 'New', 'In Progress', 'In Progress', 'Closed', 'New', 'In Progress'][
      i - 1
    ] ?? 'New') as Enquiry['status'],
    createdAt: now,
    updatedAt: now,
    ...partial,
  });
  return [
    mk(1, { id: IDS.en1, customerName: 'Kiran Joshi', status: 'In Progress', phone: '9988776655', email: 'kiran.j@gmail.com' }),
    mk(2, { id: 'enq_2', customerName: 'New Lead A', status: 'New' }),
    mk(3, { id: 'enq_3', customerName: 'New Lead B', status: 'In Progress', source: { type: 'Agent', agentId: IDS.a2 } }),
    mk(4, { id: 'enq_4', customerName: 'Warehouse Co', type: 'Commercial', systemCapacity: 50 }),
    mk(5, { id: 'enq_5', customerName: 'Farm House', status: 'Converted' }),
    mk(6, { id: 'enq_6', customerName: 'Closed Lead', status: 'Closed' }),
    mk(7, { id: 'enq_7', customerName: 'High Pri', priority: 'High' }),
    mk(8, { id: 'enq_8', customerName: 'Medium Pri', priority: 'Medium' }),
    mk(9, { id: 'enq_9', customerName: 'Direct FB', source: { type: 'Direct', directSource: 'Facebook' } }),
    mk(10, { id: 'enq_10', customerName: 'Agent Raj', source: { type: 'Agent', agentId: IDS.a3 } }),
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
    mk(IDS.p1, 'Joshi Residence 5kW', IDS.c1, 'Solo', 'In Progress', 5, 385000),
    mk('proj_2', 'Shree Foods 20kW', IDS.c2, 'Partner (Profit Only)', 'New', 20, 1200000, {
      category: 'Commercial',
    }),
    mk('proj_3', 'Meera Nair 3kW', IDS.c3, 'Solo', 'Completed', 3, 245000, {
      progressSteps: defaultProgressSteps().map((s) => ({ ...s, status: 'Completed' as const })),
    }),
    mk('proj_4', 'Patil Agro 8kW', IDS.c4, 'Partner with Contributions', 'In Progress', 8, 520000, {
      category: 'Industrial',
    }),
    mk('proj_5', 'Channel OEM batch', IDS.c5, 'Vendorship Fee', 'In Progress', 15, 400000, {
      category: 'Commercial',
    }),
    mk('proj_6', 'Kapoor 4kW', IDS.c5, 'Solo', 'On Hold', 4, 310000),
  ];
}

function seedSites(projectId: string): Site[] {
  const preset = IDS.pr3;
  return [
    {
      id: IDS.s1,
      projectId,
      name: 'Main Rooftop',
      address: 'Baner, Pune',
      photos: [],
      checklistPresetId: preset,
      checklistItems: [
        { itemId: 'ci1', materialId: IDS.mat1, description: 'Panels received', completed: true, completedAt: today },
        { itemId: 'ci2', materialId: IDS.mat2, description: 'Inverter mount', completed: false },
      ],
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
    const received = idx < 3 ? Math.round(total * 0.5) : 0;
    const id = `inv_${++i}`;
    inv.push({
      id,
      projectId: proj.id,
      customerId: cust.id,
      invoiceNumber: `INV-2026-${100 + i}`,
      date: `${y}-02-${10 + i}`,
      total,
      received,
      balance: total - received,
      status: received === 0 ? 'Unpaid' : received >= total ? 'Paid' : 'Partial',
      createdAt: now,
    });
    if (received > 0) {
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
        { materialId: IDS.mat1, quantity: 50, rate: 14200, total: 50 * 14200 },
        { materialId: IDS.mat2, quantity: 5, rate: 41000, total: 5 * 41000 },
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
  const cats = [
    ['Office', 'rent'],
    ['Office', 'utilities'],
    ['Site/Project', 'transport'],
    ['Employee', 'reimbursement'],
    ['Partner', 'payout'],
    ['Owner', 'drawings'],
    ['Other', 'misc'],
  ];
  const expenses: CompanyExpense[] = Array.from({ length: 20 }, (_, i) => {
    const [c, sub] = cats[i % cats.length]!;
    return {
      id: `cexp_${i}`,
      category: c!,
      subCategory: sub,
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
      createdAt: now,
    },
  ];
  return { suppliers, bills, loans, partners, channel, expenses, saleBills };
}

function seedMasterData(): MasterData[] {
  const types: MasterData['type'][] = [
    'PanelBrand',
    'InverterBrand',
    'StructureType',
    'SystemCapacity',
  ];
  const vals = ['Waaree', 'Adani', 'Elevated', '5kW', '10kW'];
  return types.flatMap((t) =>
    vals.slice(0, 4).map((v, j) => ({
      id: `md_${t}_${j}`,
      type: t,
      value: `${v}`,
      order: j,
    }))
  );
}

export function runSeed(): void {
  clearAllSolarKeys();
  const users = seedUsers();
  const agents = seedAgents();
  const materials = seedMaterials();
  const presets = seedPresets(materials);
  const customers = seedCustomers();
  const enquiries = seedEnquiries();
  const quotations = seedQuotations(presets);
  const projects = seedProjects(quotations);
  const sites = seedSites(IDS.p1);
  const tools = seedTools();
  const tasks = seedTasks(projects);
  const attendance = seedAttendance(users);
  const { inv, pay } = seedInvoicesPayments(projects, customers);
  const fin = seedFinanceRest();
  const masterData = seedMasterData();
  const profile: CompanyProfile = {
    name: 'GreenRay Solar Pvt Ltd',
    logo: '',
    gst: '27AABCG1234F1Z5',
    address: '402, Business Park, Pune 411045',
    bankAccount: 'HDFC Current A/c 50100*****21',
  };

  setCollection('users', users);
  setCollection('agents', agents);
  setCollection('materials', materials);
  setCollection('presets', presets);
  setCollection('customers', customers);
  setCollection('enquiries', enquiries);
  setCollection('quotations', quotations);
  setCollection('projects', projects);
  setCollection('sites', sites);
  setCollection('tools', tools);
  setCollection('tasks', tasks);
  setCollection('attendance', attendance);
  setCollection('invoices', inv);
  setCollection('payments', pay);
  setCollection('suppliers', fin.suppliers);
  setCollection('purchaseBills', fin.bills);
  setCollection('vendorPayments', []);
  setCollection('loans', fin.loans);
  setCollection('partners', fin.partners);
  setCollection('channelPartners', fin.channel);
  setCollection('companyExpenses', fin.expenses);
  setCollection('saleBills', fin.saleBills);
  setCollection('employeeExpenses', [] as EmployeeExpense[]);
  setCollection('masterData', masterData);
  setCollection('materialTransfers', []);
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
  setCollection('outsourceWork', outsourceSample);
  setCollection('payrollRecords', [] as PayrollRecord[]);
  setCollection('partnerSettlements', [] as PartnerSettlement[]);
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
  ] as ChannelPartnerFee[]);
  const notifs: AppNotification[] = [
    { id: 'n1', message: 'Low stock: review Materials', type: 'warning', read: false, createdAt: now },
    { id: 'n2', message: 'Invoice INV-2026-101 pending payment', type: 'info', read: false, createdAt: now },
    { id: 'n3', message: 'Quotation QUO-2026-003 awaiting approval', type: 'info', read: true, createdAt: now },
  ];
  setCollection('notifications', notifs);
  setItem('companyProfile', profile);
  localStorage.setItem(STORAGE_KEYS.seeded, '1');
  localStorage.setItem(STORAGE_KEYS.currentRole, 'Super Admin');
}

export function ensureSeed(): void {
  if (!localStorage.getItem(STORAGE_KEYS.seeded)) {
    runSeed();
  }
}
