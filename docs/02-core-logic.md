# Core logic

## Application bootstrap (`main.tsx`)

1. If `shouldBlockOnVersionMismatch()` (`src/lib/appVersion.ts`): stored `appVersion` exists **and** differs from `APP_VERSION` (`'1.0.0'`) → render only `AppVersionBlocker`.
2. Else: `ensureSeed()` (`src/lib/seedData.ts`), then `localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION)`, then render `BrowserRouter` → `AppProviders` → `App`.

## Seeding (`ensureSeed` / `runSeed`)

- `ensureSeed`: if `solar_seeded` missing **or** `solar_demoSeedVersion` ≠ `DEMO_SEED_VERSION` (`'mms-2026.04m-agents-partner-wa'`), call `runSeed()`.
- `runSeed`: `clearAllSolarKeys()`, build demo graph (users, CRM, projects, finance, HR, ledger samples, etc.), `setCollection` / `setItem` for all `StorageKey` entries used, set `seeded`, force `currentRole` to `Super Admin`, set demo seed version string.
- After seed: `runDataMigrations()` always runs from `ensureSeed`.

## Migrations (`runDataMigrations`)

- `CURRENT_SCHEMA = 9` (`src/lib/migrations.ts`). If `solar_schemaVersion` ≥ 9, return early.
- Otherwise run collection-specific migrators (enquiries, projects, attendance, tasks, tools, suppliers, expenses, income, materials, users, approval requests) inside `try/catch` (failures ignored), then set `schemaVersion` to 9.
- `ensureEmptyCollections`: ensures empty arrays exist for keys that might be missing when migrating.
- `ensureEnquiryPipelineMasterRows`: adds default `EnquiryPipelineStage` master rows if absent.

## Finance aggregates

- **`computeFinanceSnapshot`** (`src/lib/financeMetrics.ts`):  
  - `paymentRevenue` = sum `invoice.received` + sum `saleBill.received`.  
  - `incomeTotal` = sum of `max(0, incomeRecord.amount)`.  
  - `totalRevenue` = `paymentRevenue` + `incomeTotal`.  
  - `totalExpenses` = sum `companyExpense.amount`.  
  - `outstandingReceivables` = sum invoice balances + sum sale bill balances.  
  - `netProfit` = `totalRevenue` - `totalExpenses`.

## Dashboard KPIs (`Dashboard.tsx`)

Derived in `useMemo` from live collections:

- **Total revenue**: sum `invoice.received` + sum `saleBill.received` (not the same as `computeFinanceSnapshot` which adds income records — dashboard uses only invoices + sale bills here).
- **Active projects**: count `project.status === 'In Progress'`.
- **Completed**: count `status === 'Completed' || status === 'Closed'`.
- **Pending (currency)**: sum `invoice.balance` where `invoice.status !== 'Paid'`; **pendingCount** counts such invoices.
- **Low stock**: materials where `currentStock <= minStock`.
- **EMI active**: loans where `status === 'Active' && type === 'EMI'` (count).
- **Pending quotations**: `Draft` or `Sent`.
- **On hold**: projects with `status === 'On Hold'`.
- **Active employees**: users where `role !== 'Installation Team'`.
- **Active sites**: sites whose `projectId` is in the set of in-progress project ids.
- **Open enquiries**: `isOpenEnquiryStatus(e.status)` from helpers.
- **Overdue tasks**: `taskEffectiveStatus(t) === 'Overdue'` and `t.status !== 'Completed'`.

**Drilldown**: `KpiDrilldownModal` receives link lists built per drill key (`revenue`, `active`, `pending`, etc.).

## Voucher posting (`voucherPosting.ts`)

Exported functions (complete file):

- **`postSalesVoucherFromInvoice`**: `Voucher` type `Sales`; lines Dr `coa_debtors`, Cr `coa_sales` for `inv.total`; writes `vouchers`, `ledgerLines`; `appendAudit`.
- **`postReceiptVoucherFromPayment`**: `Voucher` type `Receipt`; asset account from `paymentToLedger(pay)`; Cr receivables; audit.
- **`postExpenseVoucher`**: `Voucher` type `Journal`; expense debit from `expenseToLedger(exp).accountId`; Cr `coa_bank` for `exp.amount`; postedFrom `CompanyExpense`; audit.

Callers include invoice/payment save flows in finance pages and `UnifiedExpenseModal` (expense voucher).

## Audit log

- **`appendAudit`**: prepend to `auditLogs`, cap **2000** entries (`src/lib/auditLog.ts`).

## Global search (`GlobalSearch.tsx`)

- Query must be **≥ 2** characters.
- Max **14** total hits; **4** per type (users capped at 3); types include Project, Customer, Invoice, Employee, Quotation, Enquiry, Task, Supplier, Payment (payments route to `/finance/payments` list).
- Hidden on **narrow** view (`hidden … sm:block` on wrapper).

## Project detail tabs (`projectUi.ts`)

- **`ProjectDetailTabKey`**: `timeline` | `documents` | `progress` | `events` | `financials` | `materials` | `att`.
- **`visibleProjectTabs(type)`**: If `type === 'Vendorship Fee'`, only **`timeline`** and **`documents`**; else **all** keys in `PROJECT_DETAIL_TAB_LABELS`.
- **`FinSubViewKey`**: `summary` | `payments` | `expenses` | `partner` | `food` | `channel`.
- **`visibleFinSubViews(type)`**: Returns **empty** for `Vendorship Fee`. Otherwise builds `['summary','payments','expenses','partner','food']` and removes **`partner`** when `type === 'Solo'`. It **does not** include **`channel`** (the `'channel'` key exists on the type and has a label in `FIN_LABELS`, but **`Projects.tsx` branch `finView === 'channel'` is not reachable** via tab buttons — see `docs/10-frontend-limitations.md`).

## `canAccessPath` — Salesperson HR contradiction

In `permissions.ts`, **`hrPrefixes`** causes an early **`false`** for any path starting with **`/hr`**, so the later disjunct **`path.startsWith('/hr/tasks')`** in the same `Salesperson` block is **never satisfied**. Documented as dead branch in `docs/12-permissions-rbac.md`.

## Navigation pins (`navPins.ts`)

- Stored at `mms_nav_pins_v1` as JSON string array of path strings.
- `toggleNavPin` updates storage and dispatches `mms-nav-pins` event; `Layout` listens and re-reads pins.

## Permissions

- **`canAccessPath`** gates sidebar links and full-page access in `Layout` (see `docs/12-permissions-rbac.md`).

## Taxonomy modals

- **`UnifiedExpenseModal`**: multi-step expense entry using `EXPENSE_TAXONOMY` (`expenseTaxonomy.ts`), writes `companyExpenses`, may call `appendAudit`, `postExpenseVoucher` (`voucherPosting.ts`), `bump()`.
- **`UnifiedIncomeModal`**: income taxonomy (`incomeTaxonomy.ts`), writes `incomeRecords`, audit, `bump()`.

## Notifications / approvals (`NotificationsPage`)

- Tabs: **inbox**, **approvals** (sub: leave / expense / blockage), **archive**.
- **`resolveApproval`**: updates `approvalRequests`, optional **`applyApprovedLeaveToAttendance`** when approved leave (adds `Attendance` row `Paid Leave` if no duplicate), `appendAudit`, pushes notification, `bump()`.

## Helpers (selection)

- **`src/lib/helpers.ts`**: formatting, enquiry status checks, task status, INR helpers — consumed across pages.
- **`src/lib/formValidation.ts`**, **`src/lib/validation.ts`**: validation utilities used by forms (see call sites via grep).

## PDF

- **`exportDomToPdf`** and related in `src/lib/pdfExport.ts` — used where quotations/invoices render printable regions.
