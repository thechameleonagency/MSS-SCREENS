# UI pages (one section per routed screen)

Each subsection lists **route**, **component source file**, **header overrides** (if `usePageHeader` is used), **collections** via `useLiveCollection` or direct storage access, and **primary actions**.

**Field-level inputs, validation, and shell interactions** are catalogued in **`docs/14-forms-validation-and-interactions.md`**. Large page files (`Enquiries.tsx`, `Projects.tsx`, `HR.tsx`, …) list hundreds of inputs in JSX — that doc explains patterns and central modals; the source file remains the exhaustive list.

## `Dashboard` — `/dashboard`

- **File**: `src/pages/Dashboard.tsx`.
- **Header**: default meta from pathname.
- **Data**: `projects`, `invoices`, `saleBills`, `materials`, `loans`, `quotations`, `users`, `tasks`, `enquiries`, `payments`, `sites`.
- **Actions**: KPI click opens `KpiDrilldownModal` with links to finance/project/task routes; secondary links/cards for navigation.

## Sales

### `EnquiryList` — `/sales/enquiries`

- **File**: `src/pages/sales/Enquiries.tsx` (`EnquiryList` export).
- **Data**: `enquiries` and related CRM collections.
- **Actions**: filters via `ListPageFiltersLayout`, create/navigate to detail, status pipeline interactions (see file).

### `EnquiryDetail` — `/sales/enquiries/:id`

- **File**: `src/pages/sales/Enquiries.tsx` (`EnquiryDetail` export).
- **Actions**: notes, tasks, conversion hooks — see component body.

### `AgentsList` / `AgentDetail` — `/sales/agents`, `/sales/agents/:id`

- **File**: `src/pages/sales/Agents.tsx`.
- **Data**: `agents`, linked enquiries/projects/economics per file.

### `QuotationsList` / `QuotationNew` / `QuotationEdit` / `QuotationPreview` / `QuotationDetail`

- **Files**: `src/pages/sales/Quotations.tsx`, `QuotationForm.tsx`, `QuotationDetailPage.tsx` (detail re-exported from `Quotations.tsx`).
- **Routes**: list, `/new`, `/:id/edit`, `/:id/preview`, `/:id`.
- **Data**: `quotations`, `customers`, `presets`, `materials`, `companyProfile`, etc.

### `CustomersList` / `CustomerDetail` — `/finance/customers`, `/finance/customers/:id`

- **File**: `src/pages/sales/Customers.tsx`.
- **Note**: Sales customer URLs redirect to finance (`App.tsx`).

## Projects

### `ProjectsList` — `/projects`

- **File**: `src/pages/projects/Projects.tsx`.
- **Data**: `projects`, supporting collections for filters and cards.

### `ProjectDetail` — `/projects/:id`

- **File**: `src/pages/projects/Projects.tsx` (`ProjectDetail`).
- **Tabs/subviews**: driven by `lib/projectUi.ts` (`visibleProjectTabs`, `visibleFinSubViews`).
- **Query**: optional `?site=` for site emphasis (see file).

### `ActiveSitesPage` — `/projects/active-sites`

- **File**: `src/pages/operations/ActiveSitesPage.tsx`.

### `ProjectSummariesPage` — `/projects/summaries`

- **File**: `src/pages/projects/ProjectSummaries.tsx`.

## Inventory

### `InventoryDesk` — `/inventory`

- **File**: `src/pages/inventory/InventoryDesk.tsx`.
- **Query**: `tab=materials|tools`; renders `MaterialsList` or `ToolsList`.

### `MaterialsList` / `MaterialDetail` — `/inventory/materials`, `/inventory/materials/:id`

- **File**: `src/pages/inventory/Inventory.tsx`.

### `ToolsList` — `/inventory/tools`

- **File**: `src/pages/inventory/Inventory.tsx`.

### `PresetsPage` — `/presets`

- **File**: `src/pages/inventory/Inventory.tsx` (`PresetsPage`).

## Finance

### `FinanceHubPage` — `/finance/hub`

- **File**: `src/pages/finance/FinanceHubPage.tsx`.
- **Header**: `usePageHeader` with actions (transactions link, open expense/income modals).
- **Modals**: `UnifiedExpenseModal`, `UnifiedIncomeModal`.

### `FinanceTransactionsPage` — `/finance/transactions`

- **File**: `src/pages/finance/FinanceTransactionsPage.tsx`.
- **Actions**: filter, export CSV client-side.

### `FinanceBillingDesk` — `/finance/billing`

- **File**: `src/pages/finance/FinanceBillingDesk.tsx` — tabs → `InvoicesList`, `SaleBillsList`, `PaymentsList` from `Finance.tsx`.

### `FinanceAccountingDesk` — `/finance/accounting`

- **File**: `src/pages/finance/FinanceAccountingDesk.tsx` — `ChartOfAccountsPage`, `ExpenseAuditPage`.

### `FinancePartnersDesk` — `/finance/partners-vendors`

- **File**: `src/pages/finance/FinancePartnersDesk.tsx` — vendors/partners/channel lists.

### Lists and forms in `Finance.tsx` and `FinanceDetails.tsx`

 Routed individually in `App.tsx`:

- `InvoicesList`, `InvoiceNew`, `InvoiceDetail`
- `SaleBillsList`, `SaleBillNew` (`FinanceDetails.tsx`), `SaleBillDetail`
- `PaymentsList`
- `LoansList`, `LoanNew`
- `VendorsList`, `VendorDetail`
- `PartnersFinanceListEnhanced`, `PartnerDetail`
- `ChannelPartnersFinanceListEnhanced`, `ChannelPartnerDetail`
- `ChartOfAccountsPage`, `ExpenseAuditPage`

## Analytics

### `AnalyticsPage` — `/analytics`

- **File**: `src/pages/analytics/AnalyticsPage.tsx`.
- **Header**: `usePageHeader` (see file for title/subtitle).
- **Data**: `useLiveCollection` for invoices, sale bills, company expenses, income records, payments, projects, tasks, users, materials, purchase bills, etc. (imports in file).
- **Logic**: `computeFinanceSnapshot`, `rollupExpensesByTaxonomyKey`, `rollupIncomeByTaxonomyKey`, `buildProfitLossStatement`, `aggregateGstActivity`, `lastNMonthlyFlows`, `taskEffectiveStatus`, period bounds (`month` / `quarter` / `year`).
- **UI**: Tab keys **`financial`** and **`operations`** (`TabKey`); period selector `Period`; bar rows and tables per tab.

## Audit

### Pages in `src/pages/audit/AuditModule.tsx`

Static `LINKS` in the file describes each tile’s **note** (profit & loss, inventory, debtors/creditors, GST, cash/bank, expense taxonomy, fixed assets/tools, audit logs, reports/export, data flow).

- `/audit` — `AuditDashboardPage` — `AuditHome`: snapshot card (project/invoice/expense counts) + grid of links above.
- `/audit/chart-of-accounts` — `AuditChartOfAccountsRedirect` — message that COA is maintained under Finance; link to `/finance/chart-of-accounts`.
- `/audit/profit-loss` — `AuditProfitLossPage` — `buildProfitLossStatement`; copy explains revenue uses **received** on invoices and sale bills; “management view, not statutory books”.
- `/audit/inventory` — `AuditInventoryPage` — `inventoryValuation(materials)`; table capped to **120** rows in slice.
- `/audit/debtors-creditors` — `AuditDebtorsCreditorsPage` — `debtorsByCustomer`, `creditorsFromSuppliers`.
- `/audit/gst` — `AuditGstPage` — `aggregateGstActivity` (see file).
- `/audit/cash-bank` — `AuditCashBankPage` — `cashBankByMode` (see file).
- `/audit/expenses` — `AuditExpensesPage` — expense taxonomy rollup (see file).
- `/audit/assets` — `AuditAssetsPage` — `toolsAsFixedAssets` (see file).
- `/audit/logs` — `AuditLogsPage` — `auditLogs` collection.
- `/audit/reports` — `AuditReportsPage` — CSV export via `exportAuditCsv` (see file).
- `/audit/data-flow` — `AuditDataFlowPage` — relationship/counts view (see file).

## HR (`src/pages/hr/HR.tsx`)

- `/hr/employees` — `EmployeesList`
- `/hr/employees/:id` — `EmployeeDetail`
- `/hr/attendance` — `AttendancePage`
- `/hr/attendance/monthly` — `AttendanceMonthlyPage`
- `/hr/payroll` — `PayrollPage`
- `/hr/holidays` — `HolidaysPage`
- `/hr/deployment` — `DeploymentPage`
- `/hr/tasks` — `TasksList`
- `/hr/tasks/new` — `TaskNew`
- `/hr/tasks/:id` — `TaskDetail`

**Shared form**: `src/pages/hr/EmployeeForm.tsx` imported where used.

## Settings (`src/pages/settings/`)

- `/settings` — `SettingsDesk` (`SettingsDesk.tsx`) with `?tab=company|users`.
- `/settings/master-data`, `/settings/company` — `CompanyAndMasterPage` (`Settings.tsx`).
- `/settings/users` — `UserManagementPage`.

## Utilities

### `NotificationsPage` — `/utilities/notifications`

- **File**: `src/pages/utilities/Notifications.tsx`.
- **Tabs**: inbox, approvals (leave/expense/blockage), archive; approval resolution writes storage and may update attendance.

## Layout-only

- **`Layout`** wraps all routes; access denied UI when `canAccessPath` false.
- **`SiteToProjectRedirect`** is not a page — redirect component (`routes/SiteRedirects.tsx`).
