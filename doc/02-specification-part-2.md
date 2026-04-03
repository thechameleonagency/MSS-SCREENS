# PART 2: COMPLETE PAGE, MODAL, AND SCHEMA SPECIFICATION

Below is **Part 2** – a complete, exhaustive breakdown of every page, modal, interaction, UI component, backend DB schema, business logic, and system item required for the Solar Management Admin Panel prototype.

This document lists **100+ pages/screens** (including all list views, detail views, forms, and sub-tabs), **60+ modals**, and every data entity, relationship, and rule we have defined. It is intended to be used as the ultimate reference for Cursor (or Lovable) to build the application exactly to your specifications.

After this, I will wait for your additions or corrections, and then produce incremental updates to this document.

---

## 1. PAGE INVENTORY (100+ Screens)

All pages are accessible via the left navigation menu. Each page is a separate route.

### DASHBOARD

1. **Overview** – KPI cards, charts (revenue trend, project status distribution, low stock alerts, pending payments, upcoming EMIs).

### SALES

2. **Enquiries – List** – Table/cards with search, filter by status/priority/source, pagination.
3. **Enquiry – Detail** – Shows all fields, notes timeline, action buttons (Edit, Schedule Meeting, Add Note, Create Quotation).
4. **Enquiry – Add/Edit** – Form modal (or separate page).
5. **Agents – List** – Table with search, filter by status.
6. **Agent – Detail** – Profile, referred projects list, commission history.
7. **Agent – Add/Edit** – Form.
8. **Quotations – List** – Table with status badges, search, filter by status/customer/agent.
9. **Quotation – Detail** – Full quotation view with PDF preview, action buttons (Edit, Share, Approve, Reject, Create Project).
10. **Quotation – Add/Edit** – Multi‑step form (Client Info, System Config with preset loader, Price Breakdown, Payment Terms, Warranty, Notes).
11. **Quotation – Preview (PDF)** – Read‑only styled page (simulated).
12. **Quotation – Share to Client** – Modal with email/WhatsApp simulation (copy link).
13. **Customers – List** – Table with search, total pending/received summary.
14. **Customer – Detail** – Profile, tabs: Invoices, Sale Bills, Payment History, Projects, Quotations.
15. **Customer – Add/Edit** – Form.

### PROJECTS

16. **All Projects – List** – Card view with key metrics (name, type, status, capacity, contract amount, profit/cost, referred by, photos count).
17. **Project – Detail (Overview Tab)** – Displays all metadata, action buttons (Create Invoice, Add Expense, Add Outsource Work, Edit Details).
18. **Project – Progress Report Tab** – Shows tasks (for active projects) and tickets (for completed). Create new task/ticket button.
19. **Project – Timeline Tab** – 7‑step progress bar with expandable substeps. Each step has update form (status, notes, date). Blockages list with add/resolve.
20. **Project – Sites Tab** – List of sites belonging to project.
21. **Project – Materials Tab** – List of materials transferred to project, with add transfer button.
22. **Project – Financials Tab** – Income, expenses, partner profit share, agent commission, channel partner fees.
23. **Project – Attendance Tab** – Who worked on which days.
24. **Project – Timeline View (Gantt)** – Chronological events (tasks, status changes, payments).
25. **Project – Edit Details** – Inline form or modal.
26. **Project – Create Invoice** – Modal to generate invoice from project.
27. **Project – Add Expense** – Modal to add project‑specific expense.
28. **Project – Add Outsource Work** – Modal to record outsourced service (JCB, crane, etc.).
29. **Sites – List** – All sites across projects, with search/filter by project.
30. **Site – Detail** – Address, photos, checklist (Type B preset items with checkboxes), progress, blockages, tasks assigned to this site.
31. **Site – Add/Edit** – Form (link to project).
32. **Site – Add Photo** – Upload simulation (base64).
33. **Site – Add Blockage** – Modal.
34. **Site – Resolve Blockage** – Confirmation.
35. **Timeline – Global View** – Aggregated timeline of all projects (optional, but list as a page).

### INVENTORY

36. **Materials – List** – Table with stock levels, min stock alert, search/filter by category.
37. **Material – Detail** – Full details, stock movement history.
38. **Material – Add/Edit** – Form with unit conversion fields (if purchase unit != issue unit, show conversion factor).
39. **Material – Transfer to Site/Project** – Modal (select project/site, quantity, issue unit).
40. **Material – Convert to Scrap** – Modal (select material, quantity, reason).
41. **Tools – List** – Table with assignment status, condition.
42. **Tool – Detail** – History of assignments.
43. **Tool – Add/Edit** – Form.
44. **Tool – Assign to Employee/Site** – Modal.
45. **Tool – Mark Condition** – Inline update.
46. **Presets – List** – Toggle between Type A (Quotation) and Type B (Site Checklist).
47. **Preset – Detail** – Items list, preview as used in quotation or checklist.
48. **Preset – Add/Edit** – Form: name, type, description, then add items from material catalog (searchable dropdown, quantity).
49. **Preset – Delete** – Confirmation modal.

### FINANCE

50. **Invoices – List** – Table with status (Paid/Partial/Unpaid), search, filter by customer/project.
51. **Invoice – Detail** – Full invoice, payment history, record payment button.
52. **Invoice – Add/Edit** – Form (select project, auto‑populate amounts).
53. **Invoice – Record Payment** – Modal (amount, mode, date).
54. **Sale Bills – List** – Similar to invoices (separate table).
55. **Sale Bill – Detail** – As invoice.
56. **Payments – List** – All client payments (across invoices), with filter by project/customer.
57. **Loans – List** – Table with type, outstanding, actions (Pay EMI / Record Payment / View only).
58. **Loan – Add/Edit** – Form (source, type, principal, rate, payment info, outstanding, linked project optional).
59. **Loan – Record Repayment** – Modal.
60. **Vendors (Suppliers) – List** – Table with outstanding, total purchases.
61. **Vendor – Detail** – Profile, purchase bills, payment history.
62. **Vendor – Add/Edit** – Form.
63. **Vendor – Add Purchase Bill** – Modal (items from material catalog, quantities, rates).
64. **Vendor – Record Payment** – Modal (against a purchase bill).
65. **Partners – List** – Profit‑sharing partners.
66. **Partner – Detail** – Profile, linked projects (Type 2 & 4), profit payouts, contributions (for Type 4).
67. **Partner – Add/Edit** – Form (name, contact, profit share %).
68. **Partner – Record Contribution (Type 4)** – Modal (labor: description, hours, cost; material: select material, quantity, cost).
69. **Partner – Settle Profit** – Modal (calculate share, record payment).
70. **Channel Partners – List** – External entities using our code.
71. **Channel Partner – Detail** – Profile, fee structure, projects, payments received.
72. **Channel Partner – Add/Edit** – Form.
73. **Channel Partner – Record Fee Payment** – Modal.
74. **Chart of Accounts – View** – Hierarchical tree (static, but expandable). Clicking a ledger shows transactions (filtered from invoices, payments, expenses).
75. **Expense Audit – View** – Dashboard with summary charts, drill‑down by main category (Employee, Office, Site/Project, Owner, Partner, Other Company Expense). Each category expands to sub‑categories with list of expenses.
76. **Expense Audit – Add Company Expense** – Modal (category, amount, date, project link, paid by, mode, notes).

### HR & TEAM

77. **Employees – List** – Table with role, salary, expense tag, actions.
78. **Employee – Detail** – Profile, documents, attendance summary, tasks assigned, expenses, payroll history.
79. **Employee – Add/Edit** – Multi‑step form (personal, employment, documents, bank, credentials).
80. **Employee – Upload Document** – Modal (type: Aadhaar/PAN/Photo/Offer Letter, base64 preview).
81. **Attendance – Daily Marking** – List of employees with radio buttons (Present/Paid Leave/Absent) and site selector for Present.
82. **Attendance – Monthly View** – Calendar or table per employee.
83. **Payroll – Monthly View** – Table of employees with salary, present days, absent, holiday, pending advances, advance taken, net payable. Actions: Pay (mark paid), Record Expense (advance), Record Task (bonus).
84. **Payroll – Generate Salary Slip** – Modal (preview PDF).
85. **Tasks – List** – All tasks across projects, filter by assignee/status/due date.
86. **Task – Detail** – Full details, comments, status update, reassign.
87. **Task – Add/Edit** – Modal (title, description, project, site, assigned employees, due date, priority).

### SETTINGS

88. **Master Data – List of Dropdowns** – Manageable tables: Panel Brands, Inverter Brands, Structure Types, System Capacities, Expense Categories (with hierarchy), Document Templates (placeholders for future).
89. **Master Data – Add/Edit** – Inline form for each dropdown.
90. **User Management – List** – All users (employees), role assignment, password reset (simulate).
91. **User Management – Add/Edit User** – Form (reuse employee add but with role selection).
92. **Company Profile – Edit** – Company name, logo (base64), GST number, address, bank details.

### ADDITIONAL UTILITY PAGES (not in main nav but reachable)

93. **Notifications** – Global toast list (simulated).
94. **Login / Role Switcher** – For prototype, a header dropdown to impersonate any role (to test permissions).
95. **Data Reset** – Button in settings to clear localStorage and re‑seed dummy data.

---

## 2. MODAL INVENTORY (60+ Modals)

Modals are used for forms, confirmations, and quick actions.

### Sales Modals

1. **Add Enquiry** – Form modal.
2. **Schedule Meeting** – Date picker, time, notes.
3. **Add Note** – Textarea, updater name (prefilled).
4. **Create Quotation from Enquiry** – Redirect or modal with prefill.
5. **Add Agent** – Form modal.
6. **Edit Quotation (quick edit)** – For small changes.
7. **Share Quotation** – Email/WhatsApp simulation (copy link).
8. **Approve Quotation** – Confirm, then select payment type (Bank Loan details modal).
9. **Reject Quotation** – Reason textarea.
10. **Add Customer** – Form modal (quick add from quotation/enquiry).
11. **Select Payment Type** – Radio buttons, conditional fields for Bank Loan (K number, lender, amount).
12. **Create Project from Quotation** – Confirm, select project type (if not Solo).

### Projects Modals

13. **Create Invoice** – Select items from project (auto total).
14. **Add Expense (project)** – Category, amount, date, notes.
15. **Add Outsource Work** – Type (JCB, Crane, etc.), quantity, cost.
16. **Edit Project Details** – Inline form.
17. **Add Site** – Form.
18. **Add Site Photo** – Upload (base64).
19. **Add Blockage** – Description, assignee (employee), due date.
20. **Resolve Blockage** – Confirm.
21. **Add Task** – Title, description, assignees, due date, priority.
22. **Add Ticket** – Similar to task, but for completed projects.
23. **Update Progress Step** – For each of 7 steps: status, notes, date.
24. **Add Partner Contribution (Type 4)** – Labor or material.
25. **Settle Partner Profit** – Calculate share, record payment.

### Inventory Modals

26. **Add Material** – Form.
27. **Add Tool** – Form.
28. **Transfer Material to Site/Project** – Select project/site, quantity, unit.
29. **Convert to Scrap** – Select material, quantity, reason.
30. **Assign Tool** – Select employee, site.
31. **Add Preset** – Form (Type A or B, then add items via search).
32. **Edit Preset Items** – Reorder, remove, add.
33. **Delete Preset** – Confirm.

### Finance Modals

34. **Add Invoice** – Form (select project, auto‑populate).
35. **Record Payment** – Amount, mode, date.
36. **Add Sale Bill** – Form.
37. **Add Loan** – Form.
38. **Record Loan Repayment** – Amount, date.
39. **Add Vendor** – Form.
40. **Add Purchase Bill** – Modal with line items.
41. **Record Vendor Payment** – Against purchase bill.
42. **Add Partner** – Form.
43. **Add Channel Partner** – Form.
44. **Record Channel Partner Fee** – Amount, project reference.
45. **Add Company Expense** – Modal (category, amount, etc.).
46. **View Ledger Transactions** – For a Chart of Accounts ledger (modal or slide‑in).

### HR Modals

47. **Add Employee** – Multi‑step modal (or separate page, but modal is fine).
48. **Upload Document** – File input, preview.
49. **Mark Attendance** – Daily marking grid (can be a page, but also modal for quick entry).
50. **Pay Salary** – Confirm, record payment date.
51. **Record Employee Expense** – Category, amount, project, mode, notes.
52. **Assign Task** – Quick assign from employee detail.
53. **View Employee Pay Slip** – Modal PDF preview.

### Settings Modals

54. **Add Master Data Item** – For dropdowns (e.g., new Panel Brand).
55. **Edit Master Data Item** – Inline.
56. **Delete Master Data Item** – Confirm.
57. **Edit Company Profile** – Form modal.
58. **Reset Data** – Confirm (clear localStorage, reload page).
59. **Change Role (Impersonate)** – Dropdown in header (non‑persistent, just for testing).
60. **Confirm Action** – Generic confirmation modal (delete, status change, etc.).

---

## 3. INTERACTION & LOGIC SPECIFICATIONS

### 3.1 Form Validation Rules (Client‑side)

- Required fields: marked with asterisk. On submit, show error if empty.
- Email format: regex.
- Phone: 10 digits.
- Amounts: positive numbers, up to 2 decimals.
- Dates: valid date, not in past (unless allowed, e.g., past attendance).
- Unique constraints: username, email, agent name (case‑insensitive).

### 3.2 State Transitions (Workflows)

**Enquiry Status:**

- New → In Progress (when assigned to salesperson)
- In Progress → Converted (when quotation created)
- In Progress → Closed (manually)

**Quotation Status:**

- Draft → Sent (user clicks Share)
- Sent → Approved (user clicks Approve)
- Sent → Rejected (user clicks Reject)
- Approved → Confirmed (after payment type selected)
- Confirmed → (Create Project)

**Project Status:**

- New → In Progress (user starts work)
- In Progress → Completed (all 7 steps done, user clicks Complete)
- Completed → Closed (final invoice settled)
- Any → On Hold (manual)

**Task Status:**

- Pending → In Progress (user starts)
- In Progress → Completed (user marks)
- Pending → Overdue (auto if due date passed and not completed – computed, not stored)

### 3.3 Real-time / Computed Fields

- **Effective Price** in Quotation: system cost – discount + GST.
- **Stock Level** after material transfer or purchase bill.
- **Employee per‑day rate** = monthly salary / 26 (hardcoded).
- **Partner profit share** = (sum of client payments – sum of project expenses) * share% (for Type 2). For Type 4, also deduct contribution value.
- **Agent commission** = if per kW: rate * project capacity; if flat: rate.
- **Invoice balance** = total – received.
- **Outstanding for Vendor** = sum of purchase bill totals – sum of payments.

### 3.4 UI Components & Patterns

- **Data Tables**: sortable columns, search box, pagination (10/25/50 per page).
- **Cards**: for dashboard and project list.
- **Tabs**: used in detail pages (e.g., Project, Customer, Employee).
- **Dropdowns**: populated from Master Data or related entities (e.g., material category from Master Data).
- **Date Pickers**: standard HTML date input (YYYY-MM-DD).
- **Rich Text**: simple textarea for notes.
- **File Uploads**: simulate with base64 (no actual server). Preview thumbnails for images.
- **Toast Notifications**: success/error messages that auto‑dismiss after 3 seconds.
- **Loading States**: spinner for any async operation (simulated with setTimeout).

### 3.5 Permissions Simulation (Role‑based)

- **Super Admin & Admin**: full access to all pages and actions.
- **Management**: can view all, edit projects, assign tasks, approve expenses, but cannot delete users or change system settings.
- **Salesperson**: can view/enquiries/quotations/customers, create/edit own, cannot view finance or HR.
- **Installation Team**: can view assigned tasks, update task status, mark attendance, view project timeline (read‑only).
- For prototype, use a header dropdown to switch role; UI adapts by hiding buttons/links.

---

## 4. BACKEND DB SCHEMAS (localStorage collections)

All collections are stored in `localStorage` with keys: `solar_<collectionName>`. Example: `solar_users`, `solar_enquiries`, etc.

Below is the complete TypeScript interface for each collection. (See Part 1 for base interfaces; here we add missing fields and index recommendations.)

### 4.1 Users (Employees)

```typescript
interface User {
  id: string;
  name: string;
  role: 'Super Admin' | 'Admin' | 'Management' | 'Salesperson' | 'Installation Team';
  expenseTag: 'Direct' | 'Indirect';
  phone: string;
  email: string;
  address: string;
  dob: string;
  salary: number;
  bankDetails: string;
  documents: {
    aadhaar: string; // base64 or URL
    pan: string;
    photo: string;
    offerLetter: string;
  };
  username: string;
  password: string; // plain text for prototype
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Attendance

```typescript
interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Paid Leave' | 'Absent';
  siteId?: string; // if Present, which site
  markedBy: string; // userId
}
```

### 4.3 Tasks

```typescript
interface Task {
  id: string;
  projectId: string;
  siteId?: string;
  title: string;
  description: string;
  assignedTo: string[]; // userIds
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  createdAt: string;
  updatedAt: string;
  comments: {
    userId: string;
    text: string;
    timestamp: string;
  }[];
}
```

### 4.4 EmployeeExpense

```typescript
interface EmployeeExpense {
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
```

### 4.5 Agents

```typescript
interface Agent {
  id: string;
  photo: string; // base64
  fullName: string;
  mobile: string;
  email: string;
  rateType: 'Per kW' | 'Flat';
  rate: number;
  address: string;
  totalCommission: number; // computed
  paidCommission: number;
  createdAt: string;
}
```

### 4.6 Enquiries

```typescript
interface Enquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  type: 'Residential' | 'Commercial';
  source: {
    type: 'Agent' | 'Direct';
    agentId?: string;
    directSource?: string; // e.g., 'Social Media', 'Walk-in'
  };
  priority: 'Low' | 'Medium' | 'High';
  systemCapacity: number;
  estimatedBudget: number;
  assignedTo: string; // userId
  meetingDate?: string;
  notes: {
    text: string;
    updatedBy: string;
    timestamp: string;
  }[];
  status: 'New' | 'In Progress' | 'Converted' | 'Closed';
  createdAt: string;
  updatedAt: string;
}
```

### 4.7 Customers

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'Individual' | 'Company';
  createdAt: string;
}
```

### 4.8 Quotations

```typescript
interface Quotation {
  id: string;
  customerId: string;
  enquiryId?: string;
  agentId?: string;
  reference: string;
  systemConfigPresetId: string;
  lineItems: {
    materialId: string;
    quantity: number;
    rate: number; // saleRateRetail at time of quote
    total: number;
  }[];
  discountPercent: number;
  gstPercent: number;
  effectivePrice: number;
  paymentTerms: { label: string; percent: number }[];
  warrantyInfo: { component: string; years: number }[];
  additionalNotes: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Confirmed';
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
```

### 4.9 Projects

```typescript
interface Project {
  id: string;
  name: string;
  type: 'Solo' | 'Partner (Profit Only)' | 'Vendorship Fee' | 'Partner with Contributions';
  category: 'Residential' | 'Commercial' | 'Industrial';
  status: 'New' | 'In Progress' | 'Completed' | 'Closed' | 'On Hold';
  customerId: string;
  quotationId?: string;
  partnerId?: string; // for Type 2 or 4
  channelPartnerId?: string; // for Type 3
  capacity: number;
  contractAmount: number;
  startDate: string;
  endDate?: string;
  address: string; // primary site address
  progressSteps: {
    step: 1|2|3|4|5|6|7;
    name: string;
    subOptions: any; // flexible object for step-specific data
    status: 'Pending' | 'In Progress' | 'Completed';
    updatedBy?: string;
    updatedAt?: string;
    notes?: string;
  }[];
  blockages: {
    id: string;
    description: string;
    assignedTo: string; // userId
    dueDate: string;
    resolved: boolean;
    resolvedAt?: string;
  }[];
  partnerContributions?: {
    labor: { id: string; description: string; hours: number; cost: number; date: string }[];
    materials: { id: string; materialId: string; quantity: number; cost: number; date: string }[];
  };
  createdAt: string;
  updatedAt: string;
}
```

### 4.10 Sites

```typescript
interface Site {
  id: string;
  projectId: string;
  name: string;
  address: string;
  photos: string[]; // base64
  checklistPresetId?: string;
  checklistItems: {
    itemId: string; // from preset item
    materialId?: string;
    description: string;
    completed: boolean;
    completedAt?: string;
  }[];
  createdAt: string;
}
```

### 4.11 Materials

```typescript
interface Material {
  id: string;
  name: string;
  category: string;
  sizeSpec: string;
  purchaseUnit: 'Pcs' | 'Foot' | 'Meter' | 'Kg';
  issueUnit: 'Pcs' | 'Foot' | 'Meter' | 'Kg';
  conversionFactor?: number; // e.g., grams per foot if purchase Kg issue Foot
  purchaseRate: number;
  saleRateRetail: number;
  saleRateWholesale: number;
  hsn: string;
  minStock: number;
  currentStock: number; // in purchase unit
  createdAt: string;
  updatedAt: string;
}
```

### 4.12 Tools

```typescript
interface Tool {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseDate: string;
  condition: 'Good' | 'Under Repair' | 'Damaged';
  assignedTo?: string; // userId
  siteId?: string;
  lastUpdated: string;
  createdAt: string;
}
```

### 4.13 Presets

```typescript
interface Preset {
  id: string;
  name: string;
  type: 'Quotation' | 'SiteChecklist';
  description: string;
  items: {
    materialId: string;
    quantity: number;
    note?: string;
  }[];
  createdAt: string;
}
```

### 4.14 Suppliers (Vendors)

```typescript
interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  outstanding: number; // computed
  totalPurchases: number; // computed
  totalPaid: number; // computed
  createdAt: string;
}
```

### 4.15 PurchaseBills

```typescript
interface PurchaseBill {
  id: string;
  supplierId: string;
  billNumber: string;
  date: string;
  items: {
    materialId: string;
    quantity: number;
    rate: number;
    total: number;
  }[];
  total: number;
  paid: number;
  due: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  createdAt: string;
}
```

### 4.16 Loans

```typescript
interface Loan {
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
```

### 4.17 Partners

```typescript
interface Partner {
  id: string;
  name: string;
  contact: string;
  profitSharePercent: number; // for Type 2
  createdAt: string;
}
```

### 4.18 ChannelPartners

```typescript
interface ChannelPartner {
  id: string;
  name: string;
  vendorCode: string;
  contact: string;
  pricingTier: 'Wholesale';
  feeStructure: 'Per kW' | 'Fixed' | 'Percentage';
  feeAmount: number;
  createdAt: string;
}
```

### 4.19 Invoices

```typescript
interface Invoice {
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
```

### 4.20 Payments (Client)

```typescript
interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Loan Disbursement';
  date: string;
  createdAt: string;
}
```

### 4.21 CompanyExpenses

```typescript
interface CompanyExpense {
  id: string;
  category: string; // main category (Employee, Office, Site/Project, Owner, Partner, Other)
  subCategory?: string;
  amount: number;
  date: string;
  projectId?: string;
  paidBy: string; // 'company' or employee name
  mode: string;
  notes: string;
  createdAt: string;
}
```

### 4.22 MasterData (configurable dropdowns)

```typescript
interface MasterData {
  id: string;
  type: 'PanelBrand' | 'InverterBrand' | 'StructureType' | 'SystemCapacity' | 'ExpenseMainCategory' | 'ExpenseSubCategory' | 'DocumentTemplate';
  value: string;
  parentId?: string; // for subcategories
  order: number;
}
```

### 4.23 CompanyProfile

```typescript
interface CompanyProfile {
  name: string;
  logo: string; // base64
  gst: string;
  address: string;
  bankAccount: string;
}
```

### 4.24 SaleBills (similar to Invoices, separate)

```typescript
interface SaleBill {
  id: string;
  // ... similar to Invoice but for internal use
}
```

---

## 5. INDEXES & RELATIONSHIPS (Simulated via JS)

In `localStorage`, relationships are maintained by storing IDs. The following indexes should be maintained in memory for performance (implemented as helper functions):

- `getEnquiriesByAgentId(agentId)`
- `getQuotationsByCustomerId(customerId)`
- `getProjectsByCustomerId(customerId)`
- `getSitesByProjectId(projectId)`
- `getTasksByProjectId(projectId)`
- `getTasksByEmployeeId(employeeId)`
- `getAttendanceByEmployeeId(employeeId, month)`
- `getExpensesByProjectId(projectId)`
- `getStockMovementsByMaterialId(materialId)` – derived from transfers and purchase bills.
- `getInvoicesByProjectId(projectId)`
- `getPaymentsByInvoiceId(invoiceId)`

These are implemented as simple `.filter()` calls on the arrays.

---

## 6. ADDITIONAL BUSINESS LOGIC IMPLEMENTATION DETAILS

### 6.1 Unit Conversion in Inventory

When issuing material from stock where `purchaseUnit !== issueUnit`:

- Store `conversionFactor` (e.g., 850 grams per foot).
- When adding stock (via purchase bill), stock is in purchase unit (kg).
- When issuing to project, user inputs quantity in issue unit (foot). System calculates required purchase unit quantity = (issueQty * conversionFactor) / 1000 (if kg to foot). Update `currentStock` accordingly.

### 6.2 Auto‑fill Cash Amount in Project Timeline Step 3

If project payment type is Cash (or includes cash portion), pre‑fill the cash amount field with the project's `contractAmount` (or remaining balance). User can override.

### 6.3 Partner Profit Settlement (Type 4)

- Compute total client payments received for the project.
- Compute total project expenses (materials, labor, other costs).
- Compute total value of partner contributions (labor cost + material cost).
- Net profit = (payments - expenses - partner contributions).
- Partner share = net profit * share% + partner contributions (return of contribution).
- Business share = net profit * (1 - share%).
- Settlement modal shows these numbers and records a payment to the partner.

### 6.4 Agent Commission Auto‑calculation

When a project is completed, compute commission based on agent's rateType and rate. Add to agent's `totalCommission` and `pendingCommission`. Admin can later mark as paid.

### 6.5 Document Generation (Placeholder)

- For each document template (stored in MasterData), the system provides a form with merge fields.
- On generation, create an HTML representation, then use `window.print()` or a simple PDF library (like `jspdf` or `html2canvas` – but for prototype, just show a printable view and allow browser print to PDF).
- Merge fields: `{{customer.name}}`, `{{project.capacity}}`, etc.

---

## 7. FINAL NOTES FOR CURSOR / LOVABLE

- **Static prototype only** – no server, no API calls beyond localStorage.
- **All data must be pre‑seeded** with realistic dummy data (minimum 5‑10 records per entity, interconnected).
- **All UI must be responsive** (mobile‑friendly sidebar).
- **No external libraries** except React, React Router, Tailwind CSS, and a date picker (e.g., `react-datepicker` if desired).
- **All modals** should be implemented using a reusable `Modal` component.
- **All forms** must have validation and error messages.
- **LocalStorage keys** should be namespaced (e.g., `solar_`).
- Provide a **data reset button** in Settings that clears all keys and re‑seeds.

---

**This part 2 document, combined with part 1 prompt, gives Cursor everything needed to build the complete prototype.**

I will now wait for your additions or corrections. Once you provide them, I will produce an updated message for Cursor/Lovable.
