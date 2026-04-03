# PROMPT FOR CURSOR – SOLAR MANAGEMENT ADMIN PANEL (STATIC PROTOTYPE)

Below is a **complete, ready‑to‑use prompt** for Cursor (or any AI coding assistant) to build a fully functional **static prototype** of the Solar Management Admin Panel. The prototype will use **localStorage** for data persistence and come pre‑loaded with **realistic dummy data** so you can test every feature end‑to‑end. Every module, relationship, business rule, and edge case we have discussed is included.

Copy and paste this prompt into Cursor (or your preferred AI coding environment) to generate the application.

---

## GOAL

Build a **single‑page web application** (React + TypeScript + Tailwind CSS) that implements the complete Solar Management Admin Panel as described below.

**No backend** – use `localStorage` for all data persistence.

Pre‑populate with **realistic dummy data** (at least 5‑10 examples per entity) so every page and action can be tested.

Implement **all business logic, validations, state transitions, and relationships** exactly as specified.

## CORE REQUIREMENTS

### 1. Technology Stack

- React (functional components, hooks)
- TypeScript (strict mode)
- Tailwind CSS for styling (no custom CSS unless needed)
- React Router for navigation (matching the left menu)
- `localStorage` as the sole data store
- No external APIs except for future integrations (mock them)
- Generate realistic dummy data on first load (if localStorage empty)

### 2. Left Navigation Menu (exactly as below)

```
Dashboard
├── Overview

Sales
├── Enquiries
├── Agents
├── Quotations
├── Customers

Projects
├── All Projects
├── Sites
├── Timeline

Inventory
├── Materials
├── Tools
├── Presets

Finance
├── Invoices
├── Sale Bills
├── Payments
├── Loans
├── Vendors
├── Partners
├── Channel Partners
├── Chart of Accounts
├── Expense Audit

HR & Team
├── Employees
├── Attendance
├── Payroll
├── Tasks

Settings
├── Master Data
├── User Management
├── Company Profile
```

### 3. User Roles (used for permission simulation – for prototype, show role selector in header)

- **Super Admin** (Indirect Expense)
- **Admin** (Indirect Expense)
- **Management** (Indirect Expense)
- **Salesperson** (Direct Expense)
- **Installation Team** (Technician, Welder) – Direct Expense
- **Agent** (External, no login – but data exists)
- **Partner** (External)
- **Channel Partner** (External)
- **Supplier** (External)

**Expense Tags** affect reporting: Direct expenses go to project cost; Indirect to overhead.

### 4. Data Entities & localStorage Structure

Use the following collections (each with appropriate fields). **Relationships are critical** – use IDs to link.

```typescript
// Users (employees only)
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
  documents: { aadhaar: string; pan: string; photo: string; offerLetter: string };
  username: string;
  password: string; // plain text for prototype
  joiningDate: string;
}

// Attendance
interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Paid Leave' | 'Absent';
  siteId?: string; // if Present, which site
}

// Tasks
interface Task {
  id: string;
  projectId: string;
  siteId?: string;
  title: string;
  description: string;
  assignedTo: string[]; // employee IDs
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  createdAt: string;
  updatedAt: string;
  comments?: { userId: string; text: string; timestamp: string }[];
}

// Employee Expenses
interface EmployeeExpense {
  id: string;
  employeeId: string;
  date: string;
  category: 'Food' | 'Travel' | 'Stay' | 'Medical' | 'Transport' | 'Other';
  amount: number;
  projectId?: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  notes: string;
}

// Agents
interface Agent {
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
}

// Enquiries
interface Enquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  type: 'Residential' | 'Commercial';
  source: { type: 'Agent' | 'Direct'; agentId?: string; directSource?: string };
  priority: 'Low' | 'Medium' | 'High';
  systemCapacity: number; // kW
  estimatedBudget: number;
  assignedTo: string; // employeeId
  meetingDate?: string;
  notes: { text: string; updatedBy: string; timestamp: string }[];
  status: 'New' | 'In Progress' | 'Converted' | 'Closed';
  createdAt: string;
}

// Customers
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'Individual' | 'Company';
}

// Quotations
interface Quotation {
  id: string;
  customerId: string;
  enquiryId?: string;
  agentId?: string;
  reference: string; // auto-filled from project or enquiry
  systemConfigPresetId: string; // Type A preset
  lineItems: { materialId: string; quantity: number; rate: number; total: number }[];
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
  bankLoanDetails?: { kNumber: string; lender: string; amount: number; approvalStatus: string };
  createdAt: string;
}

// Projects
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
  capacity: number; // kW
  contractAmount: number;
  startDate: string;
  endDate?: string;
  address: string; // site address
  progressSteps: {
    step: 1|2|3|4|5|6|7;
    name: string;
    subOptions: any; // flexible per step
    status: 'Pending' | 'In Progress' | 'Completed';
    updatedBy?: string;
    updatedAt?: string;
  }[];
  blockages: { description: string; assignedTo: string; dueDate: string; resolved: boolean }[];
  // For Type 4: partner contributions
  partnerContributions?: {
    labor: { description: string; hours: number; cost: number }[];
    materials: { materialId: string; quantity: number; cost: number }[];
  };
}

// Sites (one project can have multiple)
interface Site {
  id: string;
  projectId: string;
  name: string;
  address: string;
  photos: string[];
  checklistPresetId?: string; // Type B preset
  checklistItems: { itemId: string; completed: boolean; completedAt?: string }[];
}

// Inventory – Materials
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
}

// Tools
interface Tool {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseDate: string;
  condition: 'Good' | 'Under Repair' | 'Damaged';
  assignedTo?: string; // employeeId
  siteId?: string;
  lastUpdated: string;
}

// Presets
interface Preset {
  id: string;
  name: string;
  type: 'Quotation' | 'SiteChecklist';
  description: string;
  items: { materialId: string; quantity: number; note?: string }[];
}

// Suppliers (Vendors)
interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  outstanding: number;
  totalPurchases: number;
  totalPaid: number;
}

// Purchase Bills
interface PurchaseBill {
  id: string;
  supplierId: string;
  billNumber: string;
  date: string;
  items: { materialId: string; quantity: number; rate: number; total: number }[];
  total: number;
  paid: number;
  due: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
}

// Loans
interface Loan {
  id: string;
  source: string;
  type: 'EMI' | 'One-Time' | 'Reminder';
  principal: number;
  rate?: number;
  paymentInfo: string; // e.g., "₹10,871/mo" or "Due 1 Jun 25"
  outstanding: number;
  status: 'Active' | 'Closed';
  projectId?: string;
  repayments: { amount: number; date: string }[];
}

// Partners (profit sharing)
interface Partner {
  id: string;
  name: string;
  contact: string;
  profitSharePercent: number; // for Type 2
  // For Type 4, contributions tracked per project
}

// Channel Partners
interface ChannelPartner {
  id: string;
  name: string;
  vendorCode: string;
  contact: string;
  pricingTier: 'Wholesale';
  feeStructure: 'Per kW' | 'Fixed' | 'Percentage';
  feeAmount: number;
}

// Invoices
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
}

// Payments (client payments)
interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Loan Disbursement';
  date: string;
}

// Expenses (company expenses, not employee)
interface CompanyExpense {
  id: string;
  category: string; // e.g., 'office-rent', 'site-commission'
  subCategory?: string;
  amount: number;
  date: string;
  projectId?: string;
  paidBy: string; // 'company' or employee name
  mode: string;
  notes: string;
}

// Chart of Accounts – predefined structure (static)
// Profit & Loss report – computed from data
```

### 5. Business Logic & Rules (implement in frontend)

- **Employee Expense Tagging**: When creating an employee, set expenseTag = 'Direct' for Salesperson/Installation Team, else 'Indirect'.
- **Attendance**:
  - Mark Present only at one site per day.
  - Paid Leave count per month = number of paid leaves taken.
  - Per‑day rate = monthly salary / total working days in month (hardcoded 26 days for prototype).
- **Tasks**:
  - Multiple employees can be assigned.
  - When task is marked Completed, update `updatedAt` and optionally add comment.
  - Overdue if current date > dueDate and status not Completed.
- **Quotation Workflow**:
  - From Draft → Sent: require at least one line item and customer.
  - Sent → Approved: no extra validation.
  - Approved → Confirmed: must select payment type. If Bank Loan, require K number and lender.
  - Confirmed → Create Project: automatically create a Solo project (or selected type). Copy customer, quotation amount, etc.
- **Project Types**:
  - **Solo**: standard 7-step progress, all profit to business.
  - **Partner (Profit Only)**: link to a Partner record, profit share % applied at settlement.
  - **Vendorship Fee**: simplified progress (only payment status and product stage). No cost tracking.
  - **Partner with Contributions**: allow adding labor/materials from partner during project. Settlement report shows profit share after deducting contributions.
- **Progress Steps** (for full timeline projects):
  - Steps: 1:File Login, 2:Subsidy Type, 3:Bank/Cash, 4:Work Status, 5:DISCOM, 6:Payment Status, 7:DCR.
  - Step 3: If payment type is Cash, auto-fill amount from contract amount (user can edit).
  - Each step can have blockages. Resolving a blockage updates step progress.
- **Presets**:
  - Type A (Quotation): when loading into quotation, use `saleRateRetail` and hide purchaseRate.
  - Type B (Site Checklist): show all details (including purchaseRate) and allow checking off items.
- **Inventory Unit Conversion**:
  - If purchaseUnit != issueUnit, display conversion helper. When issuing material, calculate stock in purchase unit.
- **Commission Calculation**:
  - For Agent: if rateType = 'Per kW', commission = rate * project.capacity. If 'Flat', commission = rate.
- **Partner Profit Share**:
  - For Type 2: profit = (client payments - project expenses) * partner.profitSharePercent.
  - For Type 4: profit = (client payments - project expenses - partner contributions value) * sharePercent; then partner also gets their contribution cost back.
- **Manual Date Input**: All user‑entered dates (task due, meeting, purchase bill date, etc.) are editable text fields; no auto‑calculation unless specified.

### 6. Page Implementations (Minimum Viable)

For each navigation item, implement a page that:

- Lists the entities (if applicable) with CRUD operations (Create, Read, Update, Delete) using localStorage.
- Shows relationships (e.g., on Quotation page, dropdown to select Customer from existing Customers).
- Implements the specific workflow actions (e.g., "Convert to Project" button on Quotation detail).
- Prefills dummy data on first load (generate 5‑10 realistic records for each entity).

**Critical Pages** (must be fully functional):

- Dashboard Overview (KPIs: total revenue, active projects, pending payments, low stock, etc.)
- Enquiries (list + detail with Create Quotation button)
- Agents (list + add/edit)
- Quotations (list + create/edit, preview, share (simulate), approval workflow)
- Customers (list + detail)
- All Projects (list + detail with tabs: Overview, Progress Report, Timeline, etc.)
- Sites (list + detail with checklist)
- Materials & Tools (CRUD, stock management)
- Presets (CRUD for both types)
- Employees (CRUD, attendance marking, task assignment)
- Attendance (daily marking)
- Payroll (monthly view)
- Invoices (list + record payment)
- Vendors, Partners, Channel Partners (CRUD)
- Expense Audit (view expenses by category)
- Chart of Accounts (static view, but link to ledger entries)
- Settings / Master Data (edit dropdown options – store in localStorage)

### 7. Dummy Data Generation

On first load (if localStorage empty), generate:

- 3 Agents (Ramesh Verma – ₹1000/kW, etc.)
- 5 Customers
- 10 Enquiries (mix of sources, priorities)
- 8 Quotations (various statuses)
- 6 Projects (mix of types)
- 15 Materials (panels, inverters, wires, etc.)
- 8 Tools
- 4 Presets (2 Type A, 2 Type B)
- 7 Employees (including roles)
- Attendance for current month (some present, some leave)
- 5 Invoices (with payments)
- 3 Suppliers
- 2 Purchase Bills
- 4 Loans (EMI and one-time)
- 2 Partners (profit share)
- 1 Channel Partner
- 20 Company Expenses (various categories)

Ensure all relationships are consistent (e.g., quotation linked to customer, project linked to quotation, etc.)

### 8. Styling & UX

- Use Tailwind CSS for a clean, professional admin layout.
- Responsive sidebar (collapsible on mobile).
- Use modals for forms where appropriate.
- Provide toast notifications for success/error messages.
- All forms must have validation (e.g., required fields, number ranges).
- Use realistic Indian currency formatting (₹).

### 9. Testing Checklist (Self-Verify)

Before final output, ensure:

- [ ] All navigation links work and show data.
- [ ] CRUD operations on every entity persist to localStorage.
- [ ] Quotation approval workflow (Draft → Sent → Approved → Confirmed) works.
- [ ] Creating a project from a confirmed quotation pre‑fills correctly.
- [ ] Project timeline steps can be updated and blockages added.
- [ ] Attendance marking updates employee summary.
- [ ] Payroll shows correct numbers based on attendance.
- [ ] Material stock decreases when issued to project.
- [ ] Agent commission appears on project financials.
- [ ] Partner profit share calculation works (at least for Type 2).
- [ ] All dummy data is realistic and interconnected.

### 10. Output

Provide the complete code as a single ZIP or multiple files in the chat (React project structure). Include:

- `package.json` with dependencies (react, react-dom, react-router-dom, tailwindcss, etc.)
- All components, pages, hooks, types, utils.
- `localStorage` service functions (get, set, update, delete).
- A `seedData.ts` that initializes dummy data.
- Instructions to run (`npm install && npm run dev`).

---

**This prompt is exhaustive. Build exactly as described, leaving nothing out.**
