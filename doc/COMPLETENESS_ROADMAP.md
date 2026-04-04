# Application completeness roadmap

This document turns the gap between the current prototype and `doc/02-specification-part-2.md` (plus prior product messages) into a **sequenced plan**. Execute phases in order; each phase should end with a short QA pass and `npm run build`.

## Guiding principles

1. **Spec as source of truth** — Every screen in part 2 gets a checklist row: *not started / partial / done*.
2. **Data model first** — Add or extend types in `src/types`, migrations in `src/lib/migrations.ts`, and seed in `src/lib/seedData.ts` before UI.
3. **One vertical slice at a time** — e.g. “Quotation → Project” end-to-end before spreading thin across modules.
4. **Reuse patterns** — `ShellButton`, `Card`, `Modal`, `usePageHeader` (`actions`, `toolbarBelow`, `backTo`), unified modals, `appendAudit` where applicable.

## Phase A — Sales & CRM (highest surface area)

| Area | Spec refs | Work |
|------|-----------|------|
| **Enquiries** | Notes, stages, assignments, SLAs, attachments | Full field set, status workflow, file URLs or upload stub, reminders |
| **Quotations** | Solar vs Other templates, line editor, taxes, terms, versions | Quick edit, revision history UI, all line fields from spec, validation |
| **Customers / Agents** | KYC, documents, commission rules | Document links, history tables, missing summary widgets |
| **Sales desk** | — | Ensure every sub-route reachable from hub + sidebar groups |

**Exit:** Quotation create/edit/preview matches spec fields; enquiry lifecycle complete on happy path.

## Phase B — Projects & operations

| Area | Spec refs | Work |
|------|-----------|------|
| **Project types** | Solo / Partner / Vendorship / Contributions | Conditional steps, financials, and create-project wizard fields |
| **Active sites board** | Columns, filters, WIP limits | All column fields and drag/read-only rules per role |
| **Timeline / blockages** | Reasons, owners, SLAs | Notifications hook + reporting |
| **Materials on project** | Issues, returns, transfers | Align with inventory spec |

**Exit:** One project type fully demoable from creation → completion with no dead buttons.

## Phase C — Inventory & assets

| Area | Work |
|------|------|
| Materials | Categories, reorder levels, batches (if spec’d), full movement history |
| Tools | Assignment lifecycle, maintenance due |
| Presets | All preset types and validation |

**Exit:** Stock numbers reconcile with transfers/issues/returns/scrap in UI.

## Phase D — Finance

| Area | Work |
|------|------|
| Invoices / sale bills | Full line tax UI, credit notes, write-offs if spec’d |
| Payments | Allocations, partials, reversals |
| Partners / channel | Settlements, fee schedules, statements |
| Loans | Disbursement schedule UI |
| Hub | KPIs tied to real aggregations from stores |

**Exit:** GST PDFs and registers match spec line items.

## Phase E — HR

| Area | Work |
|------|------|
| Attendance | Policies, half-day, corrections, exports |
| Payroll | Components, arrears, payslip preview |
| Tasks / tickets | Due-date edit, recurrence, attachments |
| Deployment | Full field set vs spec |

**Exit:** Monthly payroll path complete for one demo employee.

## Phase F — Settings, notifications, audit

| Area | Work |
|------|------|
| Master data | CRUD for every master type in spec |
| Users / roles | Permission matrix vs `permissions.ts` |
| Notifications | All event types; approval flows |
| Audit | Immutable log coverage for financial writes |

**Exit:** Admin can configure masters without touching localStorage manually.

## Phase G — Analytics & polish

- Dashboard widgets wired to same queries as Finance/Projects.
- Empty states, loading skeletons, error toasts.
- Accessibility pass (focus order, labels on new filter rows).

## Ongoing maintenance

- After each feature: update a **spec coverage matrix** (spreadsheet or markdown table) keyed by part 2 section IDs.
- Prefer **feature flags** or route-level `readOnly` for demo vs production builds if needed.

## Immediate next steps (suggested sprint)

1. Extract from `02-specification-part-2.md` a **CSV/table** of screens with columns: module, route idea, priority P0–P2.
2. Implement **Quotation** missing fields and **Enquiry** stage UI (P0).
3. Add **E2E or smoke checklist** in `doc/` for manual QA before demos.

---

*Created to align engineering work with the stated goal of full spec coverage; adjust priorities with product as needed.*

## Spec § → implementation (Phase 1 foundation)

| Spec area | Location |
|-----------|----------|
| Expense taxonomy (#06 / unified wizard) | `src/lib/expenseTaxonomy.ts`, `src/components/UnifiedExpenseModal.tsx` |
| Income taxonomy | `src/lib/incomeTaxonomy.ts`, `src/components/UnifiedIncomeModal.tsx` |
| Stable `taxonomyKey` on saved rows | `src/types/index.ts` (`CompanyExpense`, `IncomeRecord`), `src/lib/migrations.ts` (schema v3 backfill) |
| Chart of Accounts tree | `src/lib/chartOfAccounts.ts` |
| CoA mapping (preview only, not vouchers) | `src/lib/coaMapping.ts` |
| CoA UI | `ChartOfAccountsPage` in `src/pages/finance/Finance.tsx` |
