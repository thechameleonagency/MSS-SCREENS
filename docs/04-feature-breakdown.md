# Feature breakdown (files + storage + triggers)

Format: **Feature** → **Implementation files** → **Primary `STORAGE_KEYS`** → **Refresh** (`bump` where used).

## Shell & platform

| Feature | Files | Storage / notes |
|---------|-------|-----------------|
| App bootstrap & version gate | `main.tsx`, `appVersion.ts`, `AppVersionBlocker.tsx` | `appVersion`, `clearAllAppMemory` clears MMS keys + version markers |
| Providers (role, toast, data version) | `contexts/AppProviders.tsx` | `currentRole` |
| Page title / breadcrumbs | `contexts/PageHeaderContext.tsx`, `lib/routeMeta.ts` | — |
| Layout, sidebar, quick add, pins | `components/Layout.tsx`, `lib/navPins.ts` | `mms_nav_pins_v1` |
| Global search | `components/GlobalSearch.tsx` | reads many collections via `useLiveCollection` |
| Prototype scope notice | `components/PrototypeScopeNotice.tsx` | `sessionStorage` only |

## Dashboard

| Feature | Files | Storage |
|---------|-------|---------|
| KPI cards & drilldown modal | `pages/Dashboard.tsx`, `components/KpiDrilldownModal.tsx` | `projects`, `invoices`, `saleBills`, `materials`, `loans`, `quotations`, `users`, `tasks`, `enquiries`, `payments`, `sites` |

## Sales

| Feature | Files | Storage |
|---------|-------|---------|
| Enquiries list/detail | `pages/sales/Enquiries.tsx`, `lib/enquiryConstants.ts`, `lib/enquiryProjectLock.ts` | `enquiries`, `customers`, `tasks`, … |
| Quotations list/new/edit/preview | `pages/sales/Quotations.tsx`, `QuotationForm.tsx`, `QuotationDetailPage.tsx` | `quotations`, `customers`, `materials`, `presets`, `projects` |
| Quotation PDF export | `lib/pdfExport.ts` (`exportDomToPdf`) | — |
| Quotation expiry helpers | `lib/quotationRules.ts` | — |
| Agents list/detail | `pages/sales/Agents.tsx`, `lib/introAgentEconomics.ts` | `agents`, `enquiries`, `projects`, `introAgentEconomics` |
| Customers (finance route) | `pages/sales/Customers.tsx` | `customers`, `projects`, `invoices`, `quotations` |

## Projects & operations

| Feature | Files | Storage |
|---------|-------|---------|
| Project list/detail, sites, install panels | `pages/projects/Projects.tsx`, `lib/projectUi.ts`, `lib/projectCardTags.ts`, `lib/projectDocumentRules.ts`, `lib/billingRules.ts`, `lib/solarProjectKind.ts` | `projects`, `sites`, `tasks`, `invoices`, `materials`, … |
| Project summaries | `pages/projects/ProjectSummaries.tsx` | `projects`, related |
| Active sites | `pages/operations/ActiveSitesPage.tsx` | `sites`, `projects` |
| Site URL redirect | `routes/SiteRedirects.tsx` | `sites` |

## Inventory & presets

| Feature | Files | Storage |
|---------|-------|---------|
| Inventory desk (tabs) | `pages/inventory/InventoryDesk.tsx` | query `tab` |
| Materials/tools/presets pages | `pages/inventory/Inventory.tsx` | `materials`, `tools`, `presets`, `materialTransfers`, `toolMovements`, … |
| Materials pack merge | `lib/materialsPack62.ts` | used in seed/migrations |
| Categories | `lib/inventoryConstants.ts` | — |

## Finance — hub & transactions

| Feature | Files | Storage |
|---------|-------|---------|
| Finance hub KPIs | `pages/finance/FinanceHubPage.tsx`, `lib/financeMetrics.ts` | `invoices`, `saleBills`, `payments`, `companyExpenses`, `incomeRecords` |
| Transactions CSV | `pages/finance/FinanceTransactionsPage.tsx` | `companyExpenses`, `incomeRecords` |
| Unified expense/income modals | `components/UnifiedExpenseModal.tsx`, `UnifiedIncomeModal.tsx`, `lib/expenseTaxonomy.ts`, `incomeTaxonomy.ts` | `companyExpenses`, `incomeRecords`, vouchers via posting |
| Billing desk | `pages/finance/FinanceBillingDesk.tsx` | composes `Finance.tsx` lists |
| Accounting desk | `pages/finance/FinanceAccountingDesk.tsx` | `ChartOfAccountsPage`, `ExpenseAuditPage` |
| Partners desk | `pages/finance/FinancePartnersDesk.tsx` | vendors/partners/channel lists from `Finance.tsx` / `FinanceDetails.tsx` |

## Finance — core lists & details

| Feature | Files | Storage |
|---------|-------|---------|
| Invoices, payments, sale bills, loans, vendors, COA, expense audit | `pages/finance/Finance.tsx` | `invoices`, `payments`, `saleBills`, `loans`, `suppliers`, `vouchers`, `ledgerLines`, … |
| Extended finance details | `pages/finance/FinanceDetails.tsx` | `saleBills`, `loans`, `suppliers`, `partners`, `channelPartners`, payments, … |
| COA data | `lib/chartOfAccounts.ts`, `lib/coaMapping.ts` | static `CHART_OF_ACCOUNTS` + runtime lines |
| Voucher posting | `lib/voucherPosting.ts` | `vouchers`, `ledgerLines`, `appendAudit` |
| GST compute | `lib/gstCompute.ts` | used where GST calculated |
| Finance insights / audit analytics | `lib/financeInsights.ts` | pure functions over collections |
| Project finance metrics | `lib/projectClientCollection.ts` | helper over invoices |

## Analytics & audit UI

| Feature | Files | Storage |
|---------|-------|---------|
| Analytics page | `pages/analytics/AnalyticsPage.tsx` | aggregates |
| Audit module pages | `pages/audit/AuditModule.tsx` | read-only views + `auditLogs` for logs tab |

## HR

| Feature | Files | Storage |
|---------|-------|---------|
| Employees, attendance, payroll, holidays, deployment, tasks | `pages/hr/HR.tsx`, `pages/hr/EmployeeForm.tsx` | `users`, `attendance`, `payrollRecords`, `tasks`, `companyHolidays`, `approvalRequests`, … |

## Settings & utilities

| Feature | Files | Storage |
|---------|-------|---------|
| Settings desk | `pages/settings/SettingsDesk.tsx`, `pages/settings/Settings.tsx` | `companyProfile`, `masterData`, `users` |
| Notifications & approvals | `pages/utilities/Notifications.tsx` | `notifications`, `approvalRequests`, `attendance` |

## Cross-cutting

| Feature | Files | Storage |
|---------|-------|---------|
| Audit log append | `lib/auditLog.ts` | `auditLogs` |
| Seed & bulk demo | `lib/seedData.ts`, `lib/seedBulkExpansion.ts`, `lib/seedTaxonomyCoverage.ts` | all keys |
| Migrations | `lib/migrations.ts` | `schemaVersion` |
| CSV helper | `lib/csvDownload.ts` | — |
| Site material ledger | `lib/siteMaterialLedger.ts` | `materials`, project/site logic |
| Tool depreciation math | `lib/toolDepreciation.ts` | — |
| Site eligibility / attendance | `lib/siteEligibility.ts` | — |
| Progress stages | `lib/progressStage.ts` | — |
| Form validation snippets | `lib/formValidation.ts`, `lib/validation.ts` | — |

## Permissions

| Feature | Files | Notes |
|---------|-------|-------|
| RBAC route checks | `lib/permissions.ts` | used in `Layout.tsx`, settings delete/edit, quick add |

This table is a **map to source**; line-level branching is implemented inside each listed file.
