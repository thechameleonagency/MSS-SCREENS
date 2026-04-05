/**
 * Additional demo rows merged after base seed (5–10+ variance per collection).
 * IDs are stable strings; FKs reference base seed entities.
 */
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
  Customer,
  EmployeeExpense,
  Enquiry,
  IncomeRecord,
  Invoice,
  LedgerLine,
  Loan,
  MasterData,
  MaterialReturn,
  MaterialTransfer,
  OutsourceWork,
  Partner,
  PartnerSettlement,
  Payment,
  Project,
  PurchaseBill,
  Quotation,
  SaleBill,
  Task,
  Site,
  Supplier,
  Tool,
  ToolMovement,
  User,
  VendorPayment,
  Voucher,
} from '../types';
import { EXPENSE_TAXONOMY, expenseTaxonomyKey, type ExpensePillarId } from './expenseTaxonomy';
import { incomeTaxonomyKey } from './incomeTaxonomy';
import { computeEffectivePrice, defaultProgressSteps } from './helpers';

const PIDS = ['proj_1', 'proj_2', 'proj_3', 'proj_4', 'proj_5', 'proj_6'] as const;
const CIDS = ['cust_1', 'cust_2', 'cust_3', 'cust_4', 'cust_5'] as const;
const UIDS = ['usr_super', 'usr_admin', 'usr_mgmt', 'usr_sales1', 'usr_sales2', 'usr_inst1', 'usr_inst2'] as const;
const MATS = ['mat_panel_550', 'mat_inverter_5kw', 'mat_structure', 'mat_ac_cable', 'mat_dc_cable', 'mat_mc4'] as const;

function expensePath(pillarId: ExpensePillarId, catId: string, subId: string): string {
  const p = EXPENSE_TAXONOMY.find((x) => x.id === pillarId)!;
  const c = p.categories.find((x) => x.id === catId)!;
  const s = c.subs.find((x) => x.id === subId)!;
  return `${p.label} › ${c.label} › ${s.label}`;
}

export function bulkAgents(ts: string): Agent[] {
  const names = ['Vikash Tiwari', 'Anjali Menon', 'Deepa Iyer', 'Mohit Saxena', 'Kavita Deshmukh', 'Suresh Pillai'];
  return names.map((fullName, i) => ({
    id: `agt_bulk_${i}`,
    photo: '',
    fullName,
    mobile: `9199${String(1000000 + i).slice(0, 7)}`,
    email: `agent.bulk${i}@demo.in`,
    rateType: i % 2 === 0 ? ('Per kW' as const) : ('Flat' as const),
    rate: 800 + i * 150,
    address: `City ${i + 1}`,
    totalCommission: 10000 + i * 5000,
    paidCommission: 5000 + i * 2000,
    pendingCommission: 5000 + i * 3000,
    createdAt: ts,
  }));
}

export function bulkCustomers(ts: string): Customer[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `cust_bulk_${i}`,
    name: `Demo Customer ${i + 1}`,
    phone: `91${String(7700000000 + i)}`,
    email: `cust.bulk${i}@example.com`,
    address: `Plot ${i + 1}, Industrial Area`,
    type: i % 3 === 0 ? ('Company' as const) : ('Individual' as const),
    gstin: i % 3 === 0 ? `27BULK${i}1234F1Z${i}` : undefined,
    pan: `BULK${i}1234${i}`,
    state: 'Maharashtra',
    siteAddress: i % 2 === 0 ? `Site lane ${i}` : undefined,
    createdAt: ts,
  }));
}

export function bulkEnquiries(ts: string): Enquiry[] {
  const statuses: Enquiry['status'][] = ['New', 'Contacted', 'Converted', 'Lost'];
  const sources: Enquiry['source'][] = [
    { type: 'Agent', agentId: 'agt_ramesh' },
    { type: 'Direct', directSource: 'Instagram' },
    { type: 'Referral', referredBy: 'Existing client' },
    { type: 'Phone' },
    { type: 'WalkIn' },
    { type: 'Online', directSource: 'Google Ads' },
    { type: 'Social' },
  ];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `enq_bulk_${i}`,
    customerName: `Bulk Lead ${i + 1}`,
    phone: `91${String(8800000000 + i)}`,
    email: `lead.bulk${i}@test.com`,
    type: i % 2 === 0 ? 'Residential' : 'Commercial',
    source: sources[i % sources.length]!,
    priority: ['Low', 'Medium', 'High'][i % 3] as Enquiry['priority'],
    systemCapacity: 5 + i * 2,
    estimatedBudget: 150000 + i * 75000,
    assignedTo: UIDS[(i % 5) + 2] ?? UIDS[2]!,
    roofType: ['RCC', 'Sheet', 'Tiled'][i % 3],
    monthlyBillAmount: 2000 + i * 500,
    pipelineStage: ['Qualify', 'Survey', 'Proposal'][i % 3],
    notes: i % 4 === 0 ? [{ note: 'Follow-up scheduled', by: 'Sales', updatedBy: UIDS[3]!, timestamp: ts }] : [],
    status: statuses[i % 4]!,
    createdAt: ts,
    updatedAt: ts,
  }));
}

export function bulkQuotations(ts: string, presetId: string): Quotation[] {
  return Array.from({ length: 14 }, (_, i) => {
    const cid = CIDS[i % CIDS.length]!;
    const lineItems = [
      {
        materialId: MATS[0]!,
        quantity: 8 + i,
        rate: 18000,
        total: (8 + i) * 18000,
      },
    ];
    const sub = lineItems.reduce((s, x) => s + x.total, 0);
    return {
      id: `quo_bulk_${i}`,
      customerId: cid,
      reference: `QUO-BULK-2026-${100 + i}`,
      systemConfigPresetId: presetId,
      lineItems,
      discountPercent: i % 3,
      gstPercent: 18,
      effectivePrice: computeEffectivePrice(sub, i % 3, 18),
      paymentTerms: [{ label: 'Advance', percent: 30 }, { label: 'Balance', percent: 70 }],
      warrantyInfo: [{ component: 'Panels', years: 25 }],
      additionalNotes: `Bulk seed quote ${i}`,
      status: ['Draft', 'Sent', 'Approved', 'Rejected', 'Confirmed'][i % 5] as Quotation['status'],
      createdAt: ts,
      updatedAt: ts,
    } satisfies Quotation;
  });
}

export function bulkProjects(ts: string): Project[] {
  const types: Project['type'][] = [
    'Solo',
    'Partner (Profit Only)',
    'Vendorship Fee',
    'Partner with Contributions',
  ];
  const stat: Project['status'][] = ['New', 'In Progress', 'Completed', 'On Hold', 'Closed'];
  return Array.from({ length: 14 }, (_, i) => {
    const t = types[i % types.length]!;
    const steps =
      t === 'Vendorship Fee'
        ? defaultProgressSteps()
            .slice(0, 2)
            .map((s, j) => ({ ...s, step: (j + 1) as 1 | 2, name: j === 0 ? 'Payment' : 'Product' }))
        : defaultProgressSteps();
    return {
      id: `proj_bulk_${i}`,
      name: `Bulk Project ${i + 1} — ${t}`,
      type: t,
      category: i % 2 === 0 ? 'Residential' : 'Commercial',
      status: stat[i % stat.length]!,
      customerId: CIDS[i % CIDS.length]!,
      quotationId: `quo_bulk_${i % 14}`,
      capacity: 4 + i,
      contractAmount: 200000 + i * 45000,
      startDate: `${new Date().getFullYear()}-0${(i % 9) + 1}-15`,
      address: `Bulk address ${i}, MH`,
      progressSteps: steps,
      blockages: [],
      agentId: 'agt_ramesh',
      createdAt: ts,
      updatedAt: ts,
    } satisfies Project;
  });
}

export function bulkSites(ts: string): Site[] {
  const out: Site[] = [];
  PIDS.forEach((pid, j) => {
    for (let k = 0; k < 2; k++) {
      out.push({
        id: `site_extra_${pid}_${k}`,
        projectId: pid,
        name: k === 0 ? 'Primary roof' : 'Secondary array',
        address: `Location ${j}-${k}, MH`,
        photos: [],
        checklistItems: [],
        createdAt: ts,
      });
    }
  });
  for (let i = 0; i < 14; i++) {
    out.push({
      id: `site_bulk_${i}`,
      projectId: `proj_bulk_${i}`,
      name: `Install loc ${i + 1}`,
      address: `Bulk site ${i}`,
      photos: [],
      checklistItems: [],
      createdAt: ts,
    });
  }
  return out;
}

export function bulkTools(ts: string): Tool[] {
  const names = ['Laser level', 'Cable puller', 'Scaffold set', 'Welding mask', 'Gen-set 3kVA', 'Chain pulley'];
  return names.map((name, i) => ({
    id: `tool_bulk_${i}`,
    name,
    category: 'Installation',
    purchaseRate: 3500 + i * 1200,
    purchaseDate: `${new Date().getFullYear() - 1}-08-${String(i + 1).padStart(2, '0')}`,
    usefulLifeYears: 5 + (i % 4),
    salvageValue: 500 + i * 100,
    condition: (['Good', 'Minor Damage', 'Not Working', 'Good', 'Good', 'Major Damage'] as const)[i] ?? 'Good',
    lifecycleStatus:
      i === 2 || i === 5 ? ('Under Repair' as const) : (['Available', 'In Use', 'Available'] as const)[i % 3],
    lastUpdated: ts,
    createdAt: ts,
    assignedTo: i % 2 === 0 ? UIDS[5] : undefined,
    siteId: i % 3 === 0 ? 'site_extra_proj_1_0' : undefined,
  }));
}

export function bulkTasks(ts: string): Task[] {
  const steps = [1, 2, 3, 4, 5, 6, 7] as const;
  return Array.from({ length: 18 }, (_, i) => ({
    id: `task_bulk_${i}`,
    projectId: PIDS[i % PIDS.length]!,
    siteId: i % 4 === 0 ? 'site_extra_proj_1_0' : undefined,
    title: `Bulk task ${i + 1}`,
    description: 'Auto-generated demo task',
    assignedTo: [UIDS[(i % 3) + 4]!],
    dueDate: `${new Date().getFullYear()}-${String((i % 11) + 1).padStart(2, '0')}-${String((i % 26) + 1).padStart(2, '0')}`,
    priority: (['Low', 'Medium', 'High'] as Task['priority'][])[i % 3]!,
    status: (['Pending', 'In Progress', 'Completed', 'Overdue'] as Task['status'][])[i % 4]!,
    kind: i % 7 === 0 ? ('Ticket' as const) : ('Task' as const),
    taskType: (['work', 'call', 'meeting'] as const)[i % 3],
    progressStep: i % 7 === 0 ? undefined : steps[i % 7],
    createdAt: ts,
    updatedAt: ts,
    comments: i % 5 === 0 ? [{ userId: UIDS[3]!, text: 'Note on task', timestamp: ts }] : [],
  }));
}

export function bulkEmployeeExpenses(ts: string, today: string): EmployeeExpense[] {
  const cats: EmployeeExpense['category'][] = ['Food', 'Travel', 'Stay', 'Medical', 'Transport', 'Other'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ee_bulk_${i}`,
    employeeId: UIDS[(i % 4) + 3]!,
    date: today,
    category: cats[i % cats.length]!,
    amount: 300 + i * 220,
    projectId: i % 2 === 0 ? PIDS[i % PIDS.length] : undefined,
    paymentMode: (['Cash', 'UPI', 'Bank Transfer'] as EmployeeExpense['paymentMode'][])[i % 3]!,
    notes: `Employee expense demo ${i}`,
    createdAt: ts,
  }));
}

export function bulkCompanyExpenses(ts: string, y: number): CompanyExpense[] {
  const defs: { pillar: ExpensePillarId; cat: string; sub: string }[] = [
    { pillar: 'SITE', cat: 'labour', sub: 'lr' },
    { pillar: 'SITE', cat: 'material', sub: 'purchase' },
    { pillar: 'OFFICE', cat: 'internet', sub: 'inet' },
    { pillar: 'COMPANY', cat: 'vehicle', sub: 'fuel' },
    { pillar: 'EMPLOYEE', cat: 'uniform', sub: 'ppe' },
    { pillar: 'PARTNER', cat: 'pprofit', sub: 'pp' },
    { pillar: 'OWNER', cat: 'withdraw', sub: 'w' },
  ];
  return Array.from({ length: 25 }, (_, i) => {
    const def = defs[i % defs.length]!;
    return {
      id: `cexp_bulk_${i}`,
      category: expensePath(def.pillar, def.cat, def.sub),
      subCategory: def.sub,
      taxonomyKey: expenseTaxonomyKey(def.pillar, def.cat, def.sub),
      pillar: def.pillar,
      payerType: i % 2 === 0 ? 'Company' : 'Employee',
      amount: 1200 + i * 900,
      date: `${y}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 20) + 1).padStart(2, '0')}`,
      projectId: i % 3 === 0 ? PIDS[i % PIDS.length] : undefined,
      paidBy: 'Company',
      mode: (['UPI', 'Bank Transfer', 'Cash'] as string[])[i % 3]!,
      notes: `Bulk expense ${i}`,
      createdAt: ts,
    };
  });
}

export function bulkIncome(ts: string, y: number): IncomeRecord[] {
  const rows: IncomeRecord[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 3;
    const pillar = (['PROJECT', 'COMPANY', 'PARTNER'] as const)[r]!;
    const keys =
      r === 0
        ? { cat: 'Client payment', sub: 'cash', tk: incomeTaxonomyKey('PROJECT', 'client', 'cash') }
        : r === 1
          ? { cat: 'Interest income', sub: 'fd', tk: incomeTaxonomyKey('COMPANY', 'interest', 'fd') }
          : { cat: 'Partner investment', sub: 'co', tk: incomeTaxonomyKey('PARTNER', 'invest', 'co') };
    rows.push({
      id: `inc_bulk_${i}`,
      pillar,
      category: keys.cat,
      subCategory: keys.sub,
      taxonomyKey: keys.tk,
      amount: 8000 + i * 4000,
      date: `${y}-${String((i % 10) + 1).padStart(2, '0')}-10`,
      paymentMode: 'Bank Transfer',
      projectId: r === 0 ? PIDS[i % PIDS.length] : undefined,
      partnerId: r === 2 ? 'part_ajay' : undefined,
      employeeId: undefined,
      notes: `Bulk income ${i}`,
      createdAt: ts,
    });
  }
  return rows;
}

export function bulkInvoicesPayments(
  ts: string,
  y: number
): { invoices: Invoice[]; payments: Payment[] } {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  let n = 0;
  for (let i = 0; i < 18; i++) {
    const pid = PIDS[i % PIDS.length]!;
    const cid = CIDS[i % CIDS.length]!;
    const total = 80000 + i * 12000;
    const received = i % 4 === 0 ? 0 : Math.round(total * 0.4);
    const id = `inv_bulk_${i}`;
    const taxable = Math.round(total / 1.18);
    const totalTax = total - taxable;
    const halfTax = Math.round(totalTax / 2);
    invoices.push({
      id,
      projectId: pid,
      customerId: cid,
      invoiceNumber: `INV-BULK-${200 + i}`,
      date: `${y}-04-${String((i % 28) + 1).padStart(2, '0')}`,
      total,
      received,
      balance: total - received,
      status: received === 0 ? 'Unpaid' : received >= total ? 'Paid' : 'Partial',
      gstBreakup:
        i % 5 !== 0
          ? { taxableValue: taxable, cgst: halfTax, sgst: halfTax, igst: 0, totalTax }
          : {
              taxableValue: taxable,
              cgst: 0,
              sgst: 0,
              igst: totalTax,
              totalTax,
            },
      lineItems: [
        {
          description: i % 5 !== 0 ? 'Solar EPC supply & install' : 'Inter-state supply (IGST)',
          hsn: '85044090',
          quantity: 1,
          rate: taxable,
          gstRate: 18,
          amount: taxable,
        },
      ],
      createdAt: ts,
    });
    if (received > 0) {
      payments.push({
        id: `pay_bulk_${n++}`,
        invoiceId: id,
        amount: received,
        mode: (['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card'] as Payment['mode'][])[i % 5]!,
        date: `${y}-04-${String(i + 3).padStart(2, '0')}`,
        isAdvance: i % 6 === 0,
        createdAt: ts,
      });
    }
  }
  return { invoices, payments };
}

export function bulkSaleBills(ts: string, y: number): SaleBill[] {
  return Array.from({ length: 14 }, (_, i) => {
    const total = 15000 + i * 3000;
    const received = i % 3 === 0 ? 0 : 8000 + i * 1000;
    const taxable = Math.round(total / 1.18);
    const tt = total - taxable;
    const h = Math.round(tt / 2);
    return {
      id: `sb_bulk_${i}`,
      projectId: PIDS[i % PIDS.length]!,
      customerId: CIDS[i % CIDS.length]!,
      billNumber: `SB-BULK-${i}`,
      date: `${y}-03-${String(i + 5).padStart(2, '0')}`,
      total,
      received,
      balance: total - received,
      status: (['Paid', 'Partial', 'Unpaid'] as SaleBill['status'][])[i % 3]!,
      gstBreakup: { taxableValue: taxable, cgst: h, sgst: h, igst: 0, totalTax: tt },
      createdAt: ts,
    };
  });
}

export function bulkSuppliers(ts: string): Supplier[] {
  return Array.from({ length: 14 }, (_, i) => ({
    id: `sup_bulk_${i}`,
    name: `Supplier Demo ${i + 1}`,
    contact: `90${String(1110000000 + i)}`,
    email: `sup${i}@vendor.demo`,
    address: `Warehouse ${i}`,
    category: (['Panels', 'Cables', 'Structure', 'Other'] as const)[i % 4],
    outstanding: i * 5000,
    totalPurchases: 100000 + i * 25000,
    totalPaid: 80000 + i * 20000,
    createdAt: ts,
  }));
}

export function bulkPurchaseBills(ts: string, y: number): PurchaseBill[] {
  return Array.from({ length: 14 }, (_, i) => {
    const qty = 10 + i;
    const rate = 1000 + i * 100;
    const lineTotal = qty * rate;
    const interState = i === 7;
    const cgst = interState ? undefined : Math.round(lineTotal * 0.09);
    const sgst = interState ? undefined : Math.round(lineTotal * 0.09);
    const igst = interState ? Math.round(lineTotal * 0.18) : undefined;
    return {
      id: `pb_bulk_${i}`,
      supplierId: `sup_bulk_${i % 14}`,
      billNumber: `PB-BULK-${300 + i}`,
      date: `${y}-02-${String(i + 1).padStart(2, '0')}`,
      items: [
        {
          materialId: MATS[i % MATS.length]!,
          quantity: qty,
          rate,
          total: lineTotal,
          hsn: '85414011',
          gstRatePercent: 18,
          cgst,
          sgst,
          igst,
        },
      ],
      total: lineTotal,
      paid: i % 2 === 0 ? lineTotal : Math.round(lineTotal * 0.5),
      due: 0,
      status: (['Paid', 'Partial', 'Unpaid'] as PurchaseBill['status'][])[i % 3]!,
      createdAt: ts,
    } satisfies PurchaseBill;
  }).map((b) => ({ ...b, due: b.total - b.paid }));
}

export function bulkVendorPayments(ts: string, y: number): VendorPayment[] {
  return Array.from({ length: 14 }, (_, i) => ({
    id: `vp_bulk_${i}`,
    purchaseBillId: `pb_bulk_${i % 14}`,
    supplierId: `sup_bulk_${i % 14}`,
    amount: 10000 + i * 5000,
    date: `${y}-03-${String(i + 1).padStart(2, '0')}`,
    createdAt: ts,
  }));
}

export function bulkLoans(ts: string, y: number): Loan[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `loan_bulk_${i}`,
    source: `Lender ${i + 1}`,
    type: (['EMI', 'One-Time', 'Reminder'] as Loan['type'][])[i % 3]!,
    principal: 100000 + i * 50000,
    rate: 10 + i * 0.5,
    paymentInfo: `EMI demo ${i}`,
    outstanding: i % 4 === 0 ? 0 : 50000 + i * 10000,
    status: i % 4 === 0 ? ('Closed' as const) : ('Active' as const),
    projectId: i % 2 === 0 ? PIDS[i % PIDS.length] : undefined,
    repayments: i % 3 === 0 ? [{ amount: 5000, date: `${y}-01-10` }] : [],
    createdAt: ts,
  }));
}

export function bulkPartners(ts: string): Partner[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `part_bulk_${i}`,
    name: `Partner Co ${i + 1}`,
    contact: `91${String(9900000000 + i)}`,
    profitSharePercent: 10 + i * 2,
    createdAt: ts,
  }));
}

export function bulkChannelPartners(ts: string): ChannelPartner[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `ch_bulk_${i}`,
    name: `Channel Hub ${i + 1}`,
    vendorCode: `CH-${100 + i}`,
    contact: `91${String(9800000000 + i)}`,
    pricingTier: 'Wholesale',
    feeStructure: (['Per kW', 'Fixed', 'Percentage'] as ChannelPartner['feeStructure'][])[i % 3]!,
    feeAmount: 200 + i * 50,
    createdAt: ts,
  }));
}

export function bulkChannelFees(ts: string, y: number): ChannelPartnerFee[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `cf_bulk_${i}`,
    channelPartnerId: `ch_bulk_${i % 6}`,
    projectId: PIDS[i % PIDS.length],
    amount: 2000 + i * 800,
    date: `${y}-03-${String((i % 25) + 1).padStart(2, '0')}`,
    notes: `Channel fee bulk ${i}`,
    createdAt: ts,
  }));
}

export function bulkPartnerSettlements(ts: string, y: number): PartnerSettlement[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `ps_bulk_${i}`,
    partnerId: i % 2 === 0 ? 'part_ajay' : 'part_bulk_0',
    projectId: PIDS[i % PIDS.length],
    amount: 12000 + i * 4000,
    date: `${y}-02-${String((i % 20) + 1).padStart(2, '0')}`,
    notes: `Settlement bulk ${i}`,
    createdAt: ts,
  }));
}

export function bulkMaterialTransfers(ts: string, y: number): MaterialTransfer[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `xfer_bulk_${i}`,
    materialId: MATS[i % MATS.length]!,
    projectId: PIDS[i % PIDS.length]!,
    siteId: i % 2 === 0 ? `site_extra_proj_1_0` : undefined,
    quantityInIssueUnit: 5 + i,
    quantityDeductedPurchase: 5 + i,
    date: `${y}-03-${String((i % 15) + 1).padStart(2, '0')}`,
    createdAt: ts,
  }));
}

export function bulkMaterialReturns(ts: string, y: number): MaterialReturn[] {
  const actions: MaterialReturn['action'][] = ['to_stock', 'transfer_site', 'scrap'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `mret_bulk_${i}`,
    materialId: MATS[i % MATS.length]!,
    projectId: PIDS[i % PIDS.length],
    siteId: 'site_extra_proj_1_0',
    quantityInIssueUnit: 2 + i,
    action: actions[i % 3]!,
    targetSiteId: actions[i % 3] === 'transfer_site' ? 'site_extra_proj_2_0' : undefined,
    conditionNotes: i % 4 === 0 ? 'Minor scuff' : undefined,
    damageReason: actions[i % 3] === 'scrap' ? 'Demo scrap' : undefined,
    date: `${y}-03-${String((i % 10) + 1).padStart(2, '0')}`,
    createdAt: ts,
  }));
}

export function bulkOutsource(ts: string, y: number): OutsourceWork[] {
  const types = ['JCB', 'Crane', 'Civil mason', 'Scaffolding', 'Transport'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `os_bulk_${i}`,
    projectId: PIDS[i % PIDS.length]!,
    type: types[i % types.length]!,
    quantity: 1 + (i % 4),
    cost: 5000 + i * 1500,
    date: `${y}-02-${String((i % 18) + 1).padStart(2, '0')}`,
    notes: `Outsource bulk ${i}`,
    createdAt: ts,
  }));
}

export function bulkToolMovements(ts: string, y: number): ToolMovement[] {
  const types: ToolMovement['type'][] = ['issue', 'return', 'transfer'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `tm_bulk_${i}`,
    toolId: `tool_bulk_${i % 6}`,
    type: types[i % 3]!,
    employeeId: UIDS[5],
    siteId: i % 2 === 0 ? 'site_extra_proj_1_0' : undefined,
    date: `${y}-03-${String((i % 12) + 1).padStart(2, '0')}`,
    notes: `Tool move ${i}`,
    createdAt: ts,
  }));
}

export function bulkHolidays(ts: string, y: number): CompanyHoliday[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `hol_bulk_${i}`,
    date: `${y}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    label: `Holiday ${i + 1}`,
    createdAt: ts,
  }));
}

export function bulkMasterData(): MasterData[] {
  const types: MasterData['type'][] = [
    'PanelBrand',
    'InverterBrand',
    'StructureType',
    'SystemCapacity',
    'ExpenseMainCategory',
    'ExpenseSubCategory',
    'DocumentTemplate',
    'EnquiryPipelineStage',
  ];
  const out: MasterData[] = [];
  let o = 0;
  types.forEach((t) => {
    for (let j = 0; j < 5; j++) {
      out.push({ id: `md_bulk_${t}_${j}`, type: t, value: `${t} value ${j}`, order: o++ });
    }
  });
  return out;
}

export function bulkNotifications(ts: string): AppNotification[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `n_bulk_${i}`,
    message: `Notification demo ${i + 1}: review module ${i % 4}`,
    type: (['info', 'success', 'warning'] as AppNotification['type'][])[i % 3]!,
    read: i % 4 !== 0,
    approvalId: i < 9 ? `apr_bulk_${i % 8}` : undefined,
    createdAt: ts,
  }));
}

const PROJECT_LABEL: Record<(typeof PIDS)[number], string> = {
  proj_1: 'Joshi Residence 5kW',
  proj_2: 'Shree Foods 20kW',
  proj_3: 'Meera Nair 3kW',
  proj_4: 'Patil Agro 8kW',
  proj_5: 'Channel OEM batch',
  proj_6: 'Kapoor 4kW',
};

export function bulkApprovals(ts: string): ApprovalRequest[] {
  const kinds: ApprovalRequest['kind'][] = ['expense', 'leave', 'blockage'];
  const status: ApprovalRequest['status'][] = ['pending', 'approved', 'rejected'];
  return Array.from({ length: 10 }, (_, i) => {
    const pid = PIDS[i % PIDS.length]!;
    return {
      id: `apr_bulk_${i}`,
      kind: kinds[i % 3]!,
      status: status[i % 3]!,
      ticketNo: `TKT-BLK-${String(i).padStart(3, '0')}`,
      reasonCode: kinds[i % 3]!,
      title: `Approval ${i + 1}`,
      detail: 'Bulk demo approval row',
      amount: 500 + i * 200,
      payload: { projectId: pid },
      requestedAt: ts,
      employeeName: ['Priya Kulkarni', 'Amit Patil', 'Rahul Verma', 'Neha Shah'][i % 4]!,
      projectName: PROJECT_LABEL[pid],
    };
  });
}

export function bulkAudit(users: User[], ts: string): AuditLogEntry[] {
  const base = new Date(ts).getTime();
  return Array.from({ length: 48 }, (_, i) => ({
    id: `aud_bulk_${i}`,
    timestamp: new Date(base - i * 3600_000).toISOString(),
    userId: users[i % users.length]!.id,
    userName: users[i % users.length]!.name,
    action: (['create', 'update', 'delete'] as AuditLogEntry['action'][])[i % 3]!,
    entityType: (
      [
        'Project',
        'Invoice',
        'Payment',
        'CompanyExpense',
        'Quotation',
        'Task',
        'MaterialTransfer',
        'PartnerSettlement',
      ] as const
    )[i % 8]!,
    entityId: `ent_${i}`,
    entityName: `Entity ${i}`,
    field: i % 4 === 0 ? 'status' : undefined,
    newValue: i % 4 === 0 ? 'Updated' : undefined,
  }));
}

export function bulkVouchersLedger(ts: string, y: number): { vouchers: Voucher[]; lines: LedgerLine[] } {
  const types: Voucher['type'][] = ['Sales', 'Receipt', 'Purchase', 'Payment', 'Journal', 'Contra'];
  const vouchers: Voucher[] = types.map((type, i) => ({
    id: `vch_bulk_${i}`,
    type,
    date: `${y}-03-${String(i + 10).padStart(2, '0')}`,
    narration: `Demo ${type} voucher`,
    createdAt: ts,
  }));
  const lines: LedgerLine[] = [];
  vouchers.forEach((v, i) => {
    const amt = 1000 + i * 500;
    lines.push(
      {
        id: `ll_b_${i}_d`,
        voucherId: v.id,
        accountId: 'coa_bank',
        debit: amt,
        credit: 0,
        createdAt: ts,
      },
      {
        id: `ll_b_${i}_c`,
        voucherId: v.id,
        accountId: 'coa_sales',
        debit: 0,
        credit: amt,
        createdAt: ts,
      }
    );
  });
  return { vouchers, lines };
}

export function bulkAttendance(users: User[], y: number, m: string): Attendance[] {
  const out: Attendance[] = [];
  let n = 0;
  for (let d = 16; d <= 22; d++) {
    const date = `${y}-${m}-${String(d).padStart(2, '0')}`;
    users.forEach((u) => {
      const st = d % 5 === 0 ? 'Paid Leave' : d % 9 === 0 ? 'Absent' : 'Present';
      out.push({
        id: `att_bulk_${n++}`,
        employeeId: u.id,
        date,
        status: st as Attendance['status'],
        siteId: st === 'Present' ? 'site_extra_proj_1_0' : undefined,
        markedBy: 'usr_admin',
      });
    });
  }
  return out;
}
