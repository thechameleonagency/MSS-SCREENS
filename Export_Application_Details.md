# MMS / MAHI SCREENS — Application export (developer guide)

**Audience:** Engineers rebuilding or extending this **static React + Vite** prototype.  
**Persistence:** **localStorage only** — no backend APIs.  
**Primary sources of truth:** `src/types/index.ts` (models + `STORAGE_KEYS`), `src/lib/seedData.ts`, `src/lib/seedBulkExpansion.ts`, `src/App.tsx` (routes).

---

## 1. Stack & bootstrap

| Layer | Technology |
|--------|------------|
| UI | React 18, TypeScript, Tailwind CSS |
| Routing | `react-router-dom` (`BrowserRouter`, nested routes under `Layout`) |
| State refresh | `useDataRefresh().bump()` after writes so `useLiveCollection` re-reads localStorage |
| Toasts | `useToast().show()` (auto-dismiss ~3s) |
| Role simulation | `solar_currentRole` + `useRole()`; `canAccessPath()` gates nav and direct URL access |

**Entry:** `src/main.tsx` — version gate → `ensureSeed()` → React tree.

**Seed & migrations:** `ensureSeed()` in `src/lib/seedData.ts` calls `runSeed()` when `solar_seeded` is missing or `solar_demoSeedVersion` ≠ `DEMO_SEED_VERSION`, then `runDataMigrations()` in `src/lib/migrations.ts` (schema integer `solar_schemaVersion`, currently **4**).

---

## 2. All pages (routes, purpose, UI building blocks)

Routes are defined in `src/App.tsx`. All listed routes render inside `Layout` (sidebar, header, global search, role switcher, notifications link, `Outlet`, `PrototypeScopeNotice`).

| Route | Component | Purpose / main UI |
|-------|-----------|-------------------|
| `/` | redirect | → `/dashboard` |
| `/dashboard` | `Dashboard` | KPI cards, drill-down modal, recent payments, quick links; data from multiple collections |
| `/sales` | `SalesDesk` | Card links to sales sub-areas |
| `/sales/enquiries` | `EnquiryList` | Table, filters, new/edit enquiry modals, notes, meeting |
| `/sales/enquiries/:id` | `EnquiryDetail` | Detail + actions |
| `/sales/agents` | `AgentsList` | Agents table, add agent modal |
| `/sales/agents/:id` | `AgentDetail` | Agent profile / commission summary |
| `/sales/quotations` | `QuotationsList` | Quotations list + workflows |
| `/sales/quotations/new` | `QuotationNew` | Multi-section quotation form |
| `/sales/quotations/:id` | `QuotationDetail` | Edit/view, share/reject/confirm/create project modals |
| `/sales/quotations/:id/preview` | `QuotationPreview` | Print-style preview + `DocumentPreviewFrame` |
| `/sales/customers` | `CustomersList` | Customers + add modal |
| `/sales/customers/:id` | `CustomerDetail` | Profile, edit modal |
| `/projects` | `ProjectsList` | Project cards/table, search params `?view=locations` |
| `/projects/active-sites` | `ActiveSitesPage` | Ops view of active install sites |
| `/projects/sites` | redirect | → `/projects?view=locations` |
| `/projects/sites/:id` | `SiteToProjectRedirect` | Resolves site → project route |
| `/projects/timeline` | `GlobalTimeline` | Cross-project timeline |
| `/projects/:id` | `ProjectDetail` | Tabs: financials, materials, tools, blockages, sites, outsource, income/expense modals, many modals |
| `/inventory` | `InventoryDesk` | Links to inventory areas |
| `/inventory/materials` | `MaterialsList` | Materials, stock, issue/return/scrap modals |
| `/inventory/materials/:id` | `MaterialDetail` | Single material |
| `/inventory/tools` | `ToolsList` | Tools + add/issue modals |
| `/inventory/presets` | `PresetsPage` | System presets + new preset modal |
| `/finance/hub` | `FinanceHubPage` | KPIs, trend, `UnifiedExpenseModal` / `UnifiedIncomeModal` |
| `/finance/billing` | `FinanceBillingDesk` | Links: invoices, sale bills, payments |
| `/finance/partners-vendors` | `FinancePartnersDesk` | Links: vendors, partners, channel partners |
| `/finance/accounting` | `FinanceAccountingDesk` | Chart of accounts, expense audit |
| `/finance/invoices` … | `InvoicesList`, `InvoiceNew`, `InvoiceDetail` | Billing; preview frame on detail |
| `/finance/sale-bills` … | `SaleBillsList`, `SaleBillNew`, `SaleBillDetail` | Sale bills |
| `/finance/payments` | `PaymentsList` | Payments + record modal |
| `/finance/loans` … | `LoansList`, `LoanNew` | Loans + repayment modal |
| `/finance/vendors` … | `VendorsList`, `VendorDetail` | Vendors + payment modal |
| `/finance/partners` … | `PartnersFinanceListEnhanced`, `PartnerDetail` | Partners + settlement modals |
| `/finance/channel-partners` … | `ChannelPartnersFinanceListEnhanced`, `ChannelPartnerDetail` | Channel partners + fee modal |
| `/finance/chart-of-accounts` | `ChartOfAccountsPage` | COA read/edit patterns |
| `/finance/expense-audit` | `ExpenseAuditPage` | Expense audit |
| `/analytics` | `AnalyticsPage` | Charts/metrics from stored aggregates |
| `/audit` | `AuditDashboardPage` | Audit hub |
| `/audit/chart-of-accounts` | `AuditChartOfAccountsRedirect` | Redirect into finance COA |
| `/audit/profit-loss` | `AuditProfitLossPage` | P&L style audit |
| `/audit/inventory` | `AuditInventoryPage` | Inventory audit |
| `/audit/debtors-creditors` | `AuditDebtorsCreditorsPage` | AR/AP style |
| `/audit/gst` | `AuditGstPage` | GST audit |
| `/audit/cash-bank` | `AuditCashBankPage` | Cash/bank |
| `/audit/expenses` | `AuditExpensesPage` | Expense audit |
| `/audit/assets` | `AuditAssetsPage` | Assets |
| `/audit/logs` | `AuditLogsPage` | Reads `auditLogs` |
| `/audit/reports` | `AuditReportsPage` | Reports |
| `/audit/data-flow` | `AuditDataFlowPage` | Data-flow narrative |
| `/hr` | redirect | → `/hr/desk` |
| `/hr/desk` | `HRDesk` | HR landing cards |
| `/hr/employees` … | `EmployeesList`, `EmployeeDetail` | Employees + add modal |
| `/hr/attendance` … | `AttendancePage`, `AttendanceMonthlyPage` | Attendance marking |
| `/hr/payroll` | `PayrollPage` | Payroll run UI |
| `/hr/holidays` | `HolidaysPage` | Holidays |
| `/hr/deployment` | `DeploymentPage` | Deployment |
| `/hr/tasks` … | `TasksList`, `TaskNew`, `TaskDetail` | Tasks |
| `/settings` | `SettingsDesk` | Settings hub |
| `/settings/master-data` | `MasterDataPage` | Master data editor |
| `/settings/users` | `UserManagementPage` | Users CRUD (permission-gated) |
| `/settings/company` | `CompanyProfilePage` | Company profile + **danger zone** reset modal |
| `/utilities/notifications` | `NotificationsPage` | Notifications list, mark read |

**Shared layout components:** `Layout.tsx` (nav groups, `GlobalSearch`, quick-add menu, role `<select>`, mobile sidebar), `PageHeaderBar` (breadcrumbs/actions from `PageHeaderContext`), `Card`, `DataTableShell`, `ShellButton`, `Modal`, `EmptyState`, `SummaryCards` (where used), `KpiDrilldownModal`, `UnifiedExpenseModal`, `UnifiedIncomeModal`, `DocumentPreviewFrame` (quotation preview, invoice/sale bill, vendor document).

---

## 3. Logic architecture (how code is organized)

### 3.1 Storage I/O

| Function | File | Behavior |
|----------|------|----------|
| `getCollection<T>(key)` | `src/lib/storage.ts` | `JSON.parse` array or `[]` |
| `setCollection(key, data)` | same | `JSON.stringify` → localStorage |
| `getItem` / `setItem` | same | Single JSON object |
| `removeKey` | same | Remove one key |
| `clearAllSolarKeys` | same | Removes every value in `STORAGE_KEYS` |
| `generateId(prefix)` | same | Time-based id |

### 3.2 React data binding

| Hook / context | Role |
|----------------|------|
| `useLiveCollection(key)` | `useMemo(() => getCollection(key), [key, version])` |
| `useDataRefresh().bump()` | Increment `version` to force re-read |
| `useRole()` | Read/write `solar_currentRole` |
| `useToast().show(msg, type)` | Ephemeral toasts |
| `usePageHeader({...})` | Per-page title, breadcrumbs, toolbar |

### 3.3 Domain libraries (selected)

| Module | Responsibility |
|--------|------------------|
| `seedData.ts` | `runSeed`, `ensureSeed`, `DEMO_SEED_VERSION`, base demo graph |
| `seedBulkExpansion.ts` | Extra rows (agents, customers, projects, etc.) |
| `migrations.ts` | Schema version migrations on collections |
| `helpers.ts` | INR formatting, project financial helpers, task status, etc. |
| `permissions.ts` | `canAccessPath`, `canDeleteUsers`, `canEditSettings` |
| `expenseTaxonomy.ts` / `incomeTaxonomy.ts` | Taxonomy trees for unified modals |
| `voucherPosting.ts` | Posts vouchers/ledger lines from some finance actions |
| `gstCompute.ts` | GST calculations where used |
| `pdfExport.ts` | `exportDomToPdf` for printable views |
| `auditLog.ts` | `appendAudit` → prepends to `auditLogs` (cap 2000) |
| `formValidation.ts` | `requireNonEmptyTrimmed`, `requirePositiveAmount`, `optionalNonNegativeNumber` |
| `chartOfAccounts.ts` / `coaMapping.ts` | COA helpers |
| `projectUi.ts` | Visible tabs/subviews per project type |
| `progressStage.ts` | Progress stage labels |
| `routeMeta.ts` | Route metadata (if referenced) |
| `appVersion.ts` | `APP_VERSION`, mismatch detection, `clearAllAppMemory` |

**Event handlers** are colocated in page components: typical pattern is read with `getCollection` / `useLiveCollection`, mutate with `setCollection` or `setItem`, then `bump()` and `show(...)`. Not every handler is named; grep for `setCollection`, `setItem`, `bump(` in `src/pages` and `src/components`.

### 3.4 Validation

- **Central helpers:** `src/lib/formValidation.ts` (used where imported).
- **Ad hoc:** Many forms use inline checks (`Number`, `trim`, URL constructor for site photos, `RESET` phrase in settings reset, quotation/expense/income wizard steps).

---

## 4. Database items (localStorage)

### 4.1 Canonical keys (`STORAGE_KEYS` in `src/types/index.ts`)

| Key constant | localStorage key string | Typical content |
|--------------|-------------------------|-----------------|
| `users` | `solar_users` | `User[]` |
| `attendance` | `solar_attendance` | `Attendance[]` |
| `tasks` | `solar_tasks` | `Task[]` |
| `employeeExpenses` | `solar_employeeExpenses` | `EmployeeExpense[]` |
| `agents` | `solar_agents` | `Agent[]` |
| `enquiries` | `solar_enquiries` | `Enquiry[]` |
| `customers` | `solar_customers` | `Customer[]` |
| `quotations` | `solar_quotations` | `Quotation[]` |
| `projects` | `solar_projects` | `Project[]` |
| `sites` | `solar_sites` | `Site[]` |
| `materials` | `solar_materials` | `Material[]` |
| `tools` | `solar_tools` | `Tool[]` |
| `presets` | `solar_presets` | `Preset[]` |
| `suppliers` | `solar_suppliers` | `Supplier[]` |
| `purchaseBills` | `solar_purchaseBills` | `PurchaseBill[]` |
| `vendorPayments` | `solar_vendorPayments` | `VendorPayment[]` |
| `loans` | `solar_loans` | `Loan[]` |
| `partners` | `solar_partners` | `Partner[]` |
| `channelPartners` | `solar_channelPartners` | `ChannelPartner[]` |
| `invoices` | `solar_invoices` | `Invoice[]` |
| `payments` | `solar_payments` | `Payment[]` |
| `saleBills` | `solar_saleBills` | `SaleBill[]` |
| `companyExpenses` | `solar_companyExpenses` | `CompanyExpense[]` |
| `masterData` | `solar_masterData` | `MasterData` |
| `companyProfile` | `solar_companyProfile` | `CompanyProfile` |
| `materialTransfers` | `solar_materialTransfers` | `MaterialTransfer[]` |
| `outsourceWork` | `solar_outsourceWork` | `OutsourceWork[]` |
| `payrollRecords` | `solar_payrollRecords` | `PayrollRecord[]` |
| `partnerSettlements` | `solar_partnerSettlements` | `PartnerSettlement[]` |
| `channelFees` | `solar_channelFees` | `ChannelPartnerFee[]` |
| `notifications` | `solar_notifications` | `AppNotification[]` |
| `incomeRecords` | `solar_incomeRecords` | `IncomeRecord[]` |
| `approvalRequests` | `solar_approvalRequests` | `ApprovalRequest[]` |
| `auditLogs` | `solar_auditLogs` | `AuditLogEntry[]` |
| `companyHolidays` | `solar_companyHolidays` | `CompanyHoliday[]` |
| `toolMovements` | `solar_toolMovements` | `ToolMovement[]` |
| `materialReturns` | `solar_materialReturns` | `MaterialReturn[]` |
| `vouchers` | `solar_vouchers` | `Voucher[]` |
| `ledgerLines` | `solar_ledgerLines` | `LedgerLine[]` |
| `seeded` | `solar_seeded` | `'1'` flag |
| `currentRole` | `solar_currentRole` | `UserRole` string |
| `schemaVersion` | `solar_schemaVersion` | integer string |

### 4.2 Additional keys (not in `STORAGE_KEYS`)

| Key | Purpose |
|-----|---------|
| `solar_demoSeedVersion` | Compared to `DEMO_SEED_VERSION` in `seedData.ts` to decide full re-seed |
| `appVersion` | Compared to `APP_VERSION` in `src/lib/appVersion.ts` for deploy/update gate |

### 4.3 Example IDs (seed traceability)

Base seed constants live in `IDS` inside `src/lib/seedData.ts` (abbreviated):

- **Users (7):** `usr_super`, `usr_admin`, `usr_mgmt`, `usr_sales1`, `usr_sales2`, `usr_inst1`, `usr_inst2`
- **Agents (3 + bulk):** `agt_ramesh`, `agt_sunita`, `agt_raj`, plus `agt_bulk_0` … from `bulkAgents`
- **Customers (5 + bulk):** `cust_1` … `cust_5`, plus `cust_bulk_*`
- **Materials:** `mat_panel_550`, `mat_inverter_5kw`, `mat_structure`, `mat_ac_cable`, `mat_dc_cable`, …
- **Projects (bulk array):** `proj_1` … `proj_6` per `seedBulkExpansion.ts` (`PIDS`), many more in full seed
- **Enquiry / quotation / project anchors:** `enq_1`, `quo_1`, `proj_1`, `site_1`, `sup_adani`, `part_ajay`, `ch_tata`

`seedBulkExpansion.ts` adds **6+** demo rows per several entity types (e.g. `bulkCustomers` length 6, `bulkAgents` 6 names, projects tied to `PIDS`, materials `MATS`, users `UIDS`). Together with `runSeed()` merges, **most collections exceed 10–15 records** after first load. For exact rows, inspect the two seed files.

**Computed / derived UI values** (not stored): KPI totals, net amounts, filtered tables — all traceable to formulas over the arrays above (see `Dashboard.tsx`, `FinanceHubPage.tsx`, `helpers.ts`).

---

## 5. Input fields (catalog strategy)

The prototype has **hundreds** of inputs across multi-step forms. Pattern:

| Concern | Where documented in code |
|---------|---------------------------|
| Enquiry create/edit | `src/pages/sales/Enquiries.tsx` |
| Customer add/edit | `src/pages/sales/Customers.tsx` |
| Agent add | `src/pages/sales/Agents.tsx` |
| Quotation new/detail | `src/pages/sales/Quotations.tsx` |
| Project detail modals | `src/pages/projects/Projects.tsx` |
| Finance lists/modals | `src/pages/finance/Finance.tsx`, `FinanceDetails.tsx` |
| HR employees / attendance / payroll / tasks | `src/pages/hr/HR.tsx` |
| Inventory materials/tools/presets | `src/pages/inventory/Inventory.tsx` |
| Settings / master / users / company | `src/pages/settings/Settings.tsx` |
| Unified expense/income | `src/components/UnifiedExpenseModal.tsx`, `UnifiedIncomeModal.tsx` |

**Typical field attributes:** `type="text"`, `number`, `date`, `search`, `select`, `textarea`; labels in surrounding copy; validation as in section 3.4.

**Storage:** User-driven creates/updates call `setCollection` / `setItem` on the relevant `StorageKey`; display uses `useLiveCollection` or `getItem`.

---

## 6. Modals (triggers, content, persistence)

| Location | Modal title / trigger | Persists to |
|----------|------------------------|-------------|
| `Agents.tsx` | Add agent — “Add agent” | `agents` |
| `Customers.tsx` | Add / Edit customer | `customers` |
| `Enquiries.tsx` | New enquiry, Add note, Schedule meeting, Edit enquiry | `enquiries` |
| `Quotations.tsx` | Share, Reject, Confirm, Create project | `quotations`, may create `projects` / related |
| `Inventory.tsx` | Add material, Issue, Return, Scrap; Add tool, Issue; New preset | `materials`, `tools`, `presets`, movements/returns |
| `Finance.tsx` | Record payment, Repayment, Purchase bill, Company expense | `payments`, `loans`, `purchaseBills`, `companyExpenses`, … |
| `FinanceDetails.tsx` | Vendor payment, Partner settlement, Channel fee, Add partner/channel partner | finance collections |
| `Projects.tsx` | Multiple: new project from context, materials, tools, blockages, outsource, edit project, site, transfer, partner contribution, etc. | `projects`, `sites`, `materialTransfers`, `outsourceWork`, … |
| `HR.tsx` | Add employee, Salary slip preview | `users` / payroll views |
| `Settings.tsx` | Confirm full data reset (`RESET`) | `runSeed()` → wipes `STORAGE_KEYS` via `clearAllSolarKeys` |
| `Dashboard.tsx` | `KpiDrilldownModal` — KPI click | Read-only links / lists |
| `UnifiedExpenseModal` | Finance hub & project | `companyExpenses`, vouchers/ledger per `postExpenseVoucher`, `appendAudit` |
| `UnifiedIncomeModal` | Finance hub & project | `incomeRecords` |
| `KpiDrilldownModal` | Drill-down list | N/A |

Modal shell: `src/components/Modal.tsx` — `open`, `onClose`, optional `wide`.

---

## 7. Interactions (global)

| Interaction | Behavior |
|-------------|----------|
| Sidebar links | `Link` navigation; filtered by `canAccessPath(role, path)` |
| Mobile menu | Toggle sidebar; backdrop click closes |
| Nav section accordion | Click group header expands/collapses |
| Global search | Focus/typing in header search; ≥2 chars filters entities; click result navigates (`GlobalSearch.tsx`). **No global keyboard shortcut** is wired in code (only native input focus). |
| Quick add (+) | Opens menu; links depend on role |
| Notifications bell | Link to `/utilities/notifications`; badge = unread count |
| Settings gear | Link to `/settings?tab=company` |
| Role `<select>` | Writes `solar_currentRole`, updates gated routes |
| Unauthorized route | Full-screen message + “Go to Dashboard” |
| `PrototypeScopeNotice` | Static footer notice component |

**Hovers:** Mostly Tailwind `hover:` on links/buttons/cards — no drag-and-drop APIs in core flows.

**Keyboard:** Standard form tab order; no app-wide shortcut table.

---

## 8. UI → action → storage (representative map)

| UI element | Action | Storage |
|------------|--------|---------|
| “Save” on company profile | `setItem('companyProfile', form)` | `solar_companyProfile` |
| “Add enquiry” submit | push to enquiries array | `solar_enquiries` |
| “Add expense” (unified modal) | push expense, optional voucher | `solar_companyExpenses`, `solar_vouchers`, `solar_ledgerLines` |
| Issue material to project | decrement stock, transfer record | `solar_materials`, `solar_materialTransfers` |
| Record payment (invoice) | payment row + invoice balance update | `solar_payments`, `solar_invoices` |
| Mark notification read | map notification | `solar_notifications` |
| Reset data (settings) | `runSeed()` | All `STORAGE_KEYS` cleared then re-filled |
| Role switch | `setRole` | `solar_currentRole` |

---

## 9. DB triggers (localStorage read/write/delete)

| When | What happens |
|------|----------------|
| App load (normal path) | `ensureSeed()` may write many keys; `runDataMigrations()` may rewrite collections + set `solar_schemaVersion` |
| After successful load | `appVersion` set to `APP_VERSION` (`main.tsx`) |
| Each `useLiveCollection` render | Read via `getCollection` |
| User submit / button handlers | `setCollection` / `setItem` + `bump()` |
| `appendAudit` | Read/write `auditLogs` |
| `runSeed` | `clearAllSolarKeys` then populate all collections + `solar_seeded`, `solar_demoSeedVersion`, default role |
| Version mismatch path | **No** `ensureSeed` until user clears (see below) |
| Clear memory & reload | `clearAllAppMemory()` removes all app keys + `appVersion` + `solar_demoSeedVersion` |

---

## 10. Versioning & update handling (implemented)

### 10.1 Requirements mapping

| Requirement | Implementation |
|-------------|----------------|
| `APP_VERSION` in code | `src/lib/appVersion.ts` → `export const APP_VERSION = '1.0.0'` |
| Persist `appVersion` | `localStorage` key **`appVersion`** (`APP_VERSION_STORAGE_KEY`) |
| On load, compare | `shouldBlockOnVersionMismatch()` — true if stored **exists** and ≠ `APP_VERSION` |
| First visit | Stored `appVersion` is **null** → **no** block; after `ensureSeed()`, `main.tsx` sets `appVersion` |
| Mismatch | Render **only** `AppVersionBlocker` — full-screen, **no dismiss** except the one button |
| Message | “Please clear memory to see the latest changes.” |
| Button | “Clear memory & reload” → `clearAllAppMemory()` + `location.reload()` |
| Match | Run `ensureSeed()`, set `appVersion`, render app |

### 10.2 Exact code (reference)

**Constants & helpers — `src/lib/appVersion.ts`:**

```ts
export const APP_VERSION = '1.0.0';
export const APP_VERSION_STORAGE_KEY = 'appVersion';

export function shouldBlockOnVersionMismatch(): boolean {
  const stored = localStorage.getItem(APP_VERSION_STORAGE_KEY);
  return stored !== null && stored !== APP_VERSION;
}

export function clearAllAppMemory(): void {
  clearAllSolarKeys();
  localStorage.removeItem(APP_VERSION_STORAGE_KEY);
  localStorage.removeItem('solar_demoSeedVersion');
}
```

**Blocker UI — `src/components/AppVersionBlocker.tsx`:** full-screen `role="alertdialog"` with the required copy and button calling `clearAllAppMemory()` then reload.

**Bootstrap — `src/main.tsx` (placement: before `createRoot` render branch):**

```ts
if (shouldBlockOnVersionMismatch()) {
  createRoot(rootEl).render(
    <StrictMode>
      <AppVersionBlocker />
    </StrictMode>
  );
} else {
  ensureSeed();
  localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
  createRoot(rootEl).render(/* BrowserRouter → AppProviders → App */);
}
```

**Bump policy:** When releasing a breaking prototype build, increment `APP_VERSION` in `appVersion.ts` (and document in changelog if desired).

**Edge case:** Users who already have MMS data from a build **before** `appVersion` existed will have **no** stored `appVersion` on first load after this feature ships. They are treated like first-time visitors for the version gate (no modal); `main.tsx` then writes `appVersion`. If you need to **force** every existing browser to clear once, ship a one-off migration that sets `appVersion` to a sentinel before bumping `APP_VERSION`, or temporarily set `localStorage.setItem('appVersion', '0')` in a migration (not currently implemented).

---

## 11. Complete logic flows (journeys)

### 11.1 Create enquiry

1. User opens `/sales/enquiries`, clicks new enquiry.  
2. Modal fields → submit handler builds `Enquiry` object with `generateId`.  
3. `setCollection('enquiries', [...])`, `bump()`, toast.  
4. List re-renders from `useLiveCollection('enquiries')`.

### 11.2 Quotation → project

1. User opens quotation detail, uses “Create project” (or equivalent).  
2. Modal collects project fields.  
3. Writes to `projects` (and may link `enquiryId` / `quotationId` per implementation in `Quotations.tsx` / `Projects.tsx`).  
4. `bump()`, navigate optional.

### 11.3 Record unified expense

1. Open `UnifiedExpenseModal` from `/finance/hub` or project detail.  
2. Step through taxonomy (pillar → category → sub).  
3. Validate amount, conditional project/employee/partner.  
4. Append `CompanyExpense`, call `postExpenseVoucher`, `appendAudit`, `bump()`.

### 11.4 Inventory issue to project

1. Materials list → “Issue to project”.  
2. Select project/qty; update `materials` stock; append `materialTransfers` (and related).  
3. `bump()`.

### 11.5 Search

1. User types in global search (≥2 chars).  
2. Memoized filter across in-memory arrays.  
3. Click row → `react-router` navigation.

### 11.6 Filter / sort / pagination

- **Pattern:** Local `useState` + `useMemo` on arrays from `useLiveCollection`; tables use `DataTableShell` where applicable — not all tables share one pagination component. Inspect per page.

### 11.7 Delete

- Where implemented: typically `filter` id from array + `setCollection`. User delete permissions via `canDeleteUsers` on settings users page.

### 11.8 Read-only audit views

- Audit pages aggregate or list from `auditLogs` and finance/inventory collections without new persistence (verify per `AuditModule.tsx` exports).

---

## 12. Gaps vs. “exhaustive” documentation (honest list)

The following are **not** fully expanded in this single document to literal “every handler / every input name” granularity. They **are** fully traceable in source.

| Gap | Plan to complete |
|-----|------------------|
| Per-field matrix (every `<input>` name, type, validation) | Generate a table from AST or maintain `doc/forms-inventory.md` by module; prioritize finance + sales + project first. |
| Literal enumeration of every `onClick` | Run `rg "onClick"` / IDE outline per file; group by route. |
| “Every function” line-by-line | Already covered by architectural layers; for rebuild, use TypeScript “find references” on `StorageKey` and `setCollection`. |
| Global keyboard shortcuts (e.g. ⌘K) | **Not implemented**; add `useEffect` listener in `Layout` or `GlobalSearch` to focus search + document shortcut in MMS_DesignSystem. |
| Backend / API | Out of scope; prototype remains static. |
| Automated tests for localStorage contracts | Add Vitest + in-memory localStorage shim per collection. |
| `APP_VERSION` vs `DEMO_SEED_VERSION` | Two mechanisms: **deploy** gate (`appVersion`) vs **demo dataset** refresh (`solar_demoSeedVersion`). Document for PMs; consider unifying UX copy in settings. |
| Third-party keys on same origin | `clearAllAppMemory` only clears MMS keys + two meta keys; does not `localStorage.clear()` (safer for shared origins). If full wipe required, switch to `localStorage.clear()` deliberately. |

---

## 13. Rebuild checklist (minimal)

1. Copy `src/types/index.ts` models + `STORAGE_KEYS`.  
2. Copy `storage.ts`, `seedData.ts`, `seedBulkExpansion.ts`, `migrations.ts`, `appVersion.ts`.  
3. Wire `main.tsx` bootstrap (version gate + seed).  
4. Implement `AppProviders` + `Layout` + routes from `App.tsx`.  
5. Port pages in dependency order: Settings (master/profile) → Sales → Projects → Inventory → Finance → HR → Analytics/Audit.  
6. Verify `bump()` after every write path.  
7. Bump `APP_VERSION` whenever incompatible changes ship.

---

*Generated to reflect the repository state at export time. Update this file when routes, keys, or seed contracts change.*
