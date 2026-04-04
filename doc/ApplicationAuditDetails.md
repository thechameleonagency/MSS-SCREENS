# MMS prototype — application audit details

This document records the **static/localStorage** MMS admin prototype audit (April 2026) and the completion work applied in code.

## Architecture

- **UI:** React, React Router ([`src/App.tsx`](../src/App.tsx)).
- **Persistence:** Browser `localStorage` via [`src/lib/storage.ts`](../src/lib/storage.ts); keys in [`STORAGE_KEYS`](../src/types/index.ts).
- **Seed:** [`runSeed()`](../src/lib/seedData.ts) + [`seedBulkExpansion.ts`](../src/lib/seedBulkExpansion.ts); version gate [`DEMO_SEED_VERSION`](../src/lib/seedData.ts) + `ensureSeed()`.

## Route coverage

All primary routes are registered under the layout in `App.tsx`: Dashboard, Sales (desk, enquiries, agents, quotations, customers), Projects (list, detail, active sites, timeline, site redirects), Inventory, Finance (hubs, billing, partners, accounting, invoices, sale bills, payments, loans, vendors, partners, channel partners, COA, expense audit), Analytics, Audit suite, HR, Settings, Notifications.

## Storage keys → primary UI

| Key | Typical surfaces |
|-----|------------------|
| users, attendance, tasks, employeeExpenses | HR desk, attendance, payroll, tasks |
| agents, enquiries, customers, quotations | Sales desk, pipelines |
| projects, sites | Projects, active sites, project detail |
| materials, tools, presets | Inventory |
| invoices, payments, saleBills, suppliers, purchaseBills, vendorPayments | Finance billing |
| loans, partners, channelPartners, channelFees, partnerSettlements | Finance partners |
| companyExpenses, incomeRecords | Finance hub, unified modals, analytics |
| companyProfile, masterData | Settings |
| notifications, approvalRequests | Utilities / notifications |
| materialTransfers, materialReturns, outsourceWork, toolMovements | Project + inventory flows |
| payrollRecords, companyHolidays | HR |
| vouchers, ledgerLines | Accounting / audit (partial) |
| auditLogs | Audit logs page |

## Findings addressed in this pass

1. **Browser prompts:** `window.prompt` / `window.confirm` on quotation reject, partner labor contribution, project blockage resolution, and settings reset were replaced with **Modal + fields** (and typed **RESET** confirmation for data wipe).
2. **Validation helpers:** [`src/lib/formValidation.ts`](../src/lib/formValidation.ts) centralizes non-empty string, positive amount, and optional non-negative number.
3. **Toasts:** Partner settlement, channel fee entry, and related paths now surface errors when amounts are invalid (instead of silent no-ops).
4. **Global search:** [`GlobalSearch`](../src/components/GlobalSearch.tsx) now includes quotations, enquiries, tasks, suppliers, and payments (capped), in addition to projects, customers, invoices, users.
5. **Audit stubs:** [`AuditModule`](../src/pages/audit/AuditModule.tsx) stub pages include **checklists** and **“Open in…”** links to Finance, Analytics, Inventory, etc.
6. **Seed scale:** Users extended to **15** (7 canonical + 8 demo); **presets** extended to **13** total rows; **DEMO_SEED_VERSION** bumped so fresh loads pick up data.
7. **Dev FK check:** After seed, in **development only**, `assertDemoSeedFksDev()` logs console warnings for broken `projectId` / `customerId` / `invoiceId` links on tasks, sites, invoices, payments, quotations.
8. **In-app prototype notice:** [`PrototypeScopeNotice`](../src/components/PrototypeScopeNotice.tsx) shows the same out-of-scope bullets (including double-entry and bank reconciliation limits) at the bottom of every screen; dismissible per session.

## Intentionally out of scope (prototype)

- Real authentication, server APIs, email/WhatsApp delivery, statutory GST filing.
- Full double-entry for every business event.
- Bank statement import and production-grade reconciliation.

## In-app notice

The same out-of-scope bullets (including **full double-entry for every business event** and **bank import / production-grade reconciliation**) appear at the bottom of the main layout via [`PrototypeScopeNotice`](../src/components/PrototypeScopeNotice.tsx). Users can hide the panel for the current browser session only; it does not alter stored data.

## Verification

- Run `npm run build`.
- Reset seed from Settings (type `RESET`) or clear site data; confirm lists populate and search returns hits.
- Switch roles via header selector and confirm [`permissions.ts`](../src/lib/permissions.ts) gates (e.g. Salesperson blocked from finance/HR).

## Related plan

The phased completion plan that drove this work is the **MMS audit completion** plan (Cursor); this file is the durable audit record for the repository.
