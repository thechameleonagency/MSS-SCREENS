# Routing and navigation (from `src/App.tsx`)

Top-level structure: **`Layout`** wraps all routes; there is **no React Router `loader` or data API**.

## Route table (path → component)

Paths are relative to the parent `Layout` route (no prefix in `Route` definitions; React Router joins under `/`).

| Path | Component |
|------|-----------|
| `/` | `Navigate` → `/dashboard` |
| `/dashboard` | `Dashboard` |
| `/sales` | `Navigate` → `/sales/enquiries` |
| `/sales/enquiries` | `EnquiryList` |
| `/sales/enquiries/:id` | `EnquiryDetail` |
| `/sales/agents` | `AgentsList` |
| `/sales/agents/:id` | `AgentDetail` |
| `/sales/quotations` | `QuotationsList` |
| `/sales/quotations/new` | `QuotationNew` |
| `/sales/quotations/:id/edit` | `QuotationEdit` |
| `/sales/quotations/:id/preview` | `QuotationPreview` |
| `/sales/quotations/:id` | `QuotationDetail` |
| `/sales/customers` | `Navigate` → `/finance/customers` |
| `/sales/customers/:id` | `LegacySalesCustomerRedirect` → `/finance/customers/:id` |
| `/projects` | `ProjectsList` |
| `/projects/active-sites` | `ActiveSitesPage` |
| `/projects/summaries` | `ProjectSummariesPage` |
| `/projects/sites` | `Navigate` → `/projects` |
| `/projects/sites/:id` | `SiteToProjectRedirect` |
| `/projects/timeline` | `Navigate` → `/projects/summaries` |
| `/projects/:id` | `ProjectDetail` |
| `/inventory` | `InventoryDesk` |
| `/inventory/materials` | `MaterialsList` |
| `/inventory/materials/:id` | `MaterialDetail` |
| `/inventory/tools` | `ToolsList` |
| `/inventory/presets` | `Navigate` → `/presets` |
| `/presets` | `PresetsPage` |
| `/finance/hub` | `FinanceHubPage` |
| `/finance/customers` | `CustomersList` |
| `/finance/customers/:id` | `CustomerDetail` |
| `/finance/transactions` | `FinanceTransactionsPage` |
| `/finance/billing` | `FinanceBillingDesk` |
| `/finance/partners-vendors` | `FinancePartnersDesk` |
| `/finance/accounting` | `FinanceAccountingDesk` |
| `/finance/invoices` | `InvoicesList` |
| `/finance/invoices/new` | `InvoiceNew` |
| `/finance/invoices/:id` | `InvoiceDetail` |
| `/finance/sale-bills` | `SaleBillsList` |
| `/finance/sale-bills/new` | `SaleBillNew` |
| `/finance/sale-bills/:id` | `SaleBillDetail` |
| `/finance/payments` | `PaymentsList` |
| `/finance/loans` | `LoansList` |
| `/finance/loans/new` | `LoanNew` |
| `/finance/vendors` | `VendorsList` |
| `/finance/vendors/:id` | `VendorDetail` |
| `/finance/partners` | `PartnersFinanceListEnhanced` |
| `/finance/partners/:id` | `PartnerDetail` |
| `/finance/channel-partners` | `ChannelPartnersFinanceListEnhanced` |
| `/finance/channel-partners/:id` | `ChannelPartnerDetail` |
| `/finance/chart-of-accounts` | `ChartOfAccountsPage` |
| `/finance/expense-audit` | `ExpenseAuditPage` |
| `/analytics` | `AnalyticsPage` |
| `/audit` | `AuditDashboardPage` |
| `/audit/chart-of-accounts` | `AuditChartOfAccountsRedirect` |
| `/audit/profit-loss` | `AuditProfitLossPage` |
| `/audit/inventory` | `AuditInventoryPage` |
| `/audit/debtors-creditors` | `AuditDebtorsCreditorsPage` |
| `/audit/gst` | `AuditGstPage` |
| `/audit/cash-bank` | `AuditCashBankPage` |
| `/audit/expenses` | `AuditExpensesPage` |
| `/audit/assets` | `AuditAssetsPage` |
| `/audit/logs` | `AuditLogsPage` |
| `/audit/reports` | `AuditReportsPage` |
| `/audit/data-flow` | `AuditDataFlowPage` |
| `/hr` | `Navigate` → `/hr/employees` |
| `/hr/employees` | `EmployeesList` |
| `/hr/employees/:id` | `EmployeeDetail` |
| `/hr/attendance` | `AttendancePage` |
| `/hr/attendance/monthly` | `AttendanceMonthlyPage` |
| `/hr/payroll` | `PayrollPage` |
| `/hr/holidays` | `HolidaysPage` |
| `/hr/deployment` | `DeploymentPage` |
| `/hr/tasks` | `TasksList` |
| `/hr/tasks/new` | `TaskNew` |
| `/hr/tasks/:id` | `TaskDetail` |
| `/settings/master-data` | `CompanyAndMasterPage` |
| `/settings/users` | `UserManagementPage` |
| `/settings/company` | `CompanyAndMasterPage` |
| `/settings` | `SettingsDesk` |
| `/utilities/notifications` | `NotificationsPage` |

## Navigation UI

- **Sidebar**: Defined in `src/components/Layout.tsx` as static `nav` groups; each link filtered by `canAccessPath(role, c.to)`.
- **Active state**: `navItemActive` implements **prefix and special cases** (e.g. `/finance/billing` active for invoices/sale-bills/payments paths).
- **Quick add** (`QuickAddMenu`): Links to `/sales/quotations/new`, `/finance/invoices/new`, `/hr/tasks/new`, `/projects`, `/sales/enquiries` — each wrapped in `canAccessPath` check.
- **Breadcrumbs / titles**: `getPageMeta` + `SEGMENT_LABELS` in `src/lib/routeMeta.ts`; IDs in URL often show as label **“Details”** when `isLikelyId(segment)` is true.

## Guards

- **Role guard**: If `!canAccessPath(role, loc.pathname)`, `LayoutShell` renders access denied + button to `/dashboard` (not a redirect).
- **Version guard**: Before router mounts, `shouldBlockOnVersionMismatch()` can replace entire app with `AppVersionBlocker` (`src/main.tsx`).

## Deep linking

- Supported for any listed path; **no auth redirect** to login.
- `SiteToProjectRedirect`: loads `sites` from storage, resolves `projectId`, navigates to `/projects/:projectId?site=<siteId>` (`src/routes/SiteRedirects.tsx`).

## Query parameters

- **Settings** `?tab=company` \| `users` — `SettingsDesk` (`src/pages/settings/SettingsDesk.tsx`).
- **Inventory desk** `?tab=materials` \| `tools` — `InventoryDesk` (`src/pages/inventory/InventoryDesk.tsx`).
- **Project detail** may use `?site=` for site highlight (from redirect); behaviour is in `Projects.tsx` implementation.
