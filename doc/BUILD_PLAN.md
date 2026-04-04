# MMS — build plan (spec ↔ application)

This plan reconciles the external specs (CoA #11, lifecycle #08, inventory #07, taxonomy #06, finance #05, modules #03) with **this codebase**. It is the single roadmap for completeness; execute top-to-bottom in phases.

## 1. Canonical model (do not rename blindly)

| Spec term | This app | Notes |
|-----------|----------|--------|
| `ownerType: solo` | `ProjectType: 'Solo'` | Same intent |
| `ownerType: partnership` | `Partner (Profit Only)` + `Partner with Contributions` | Split by whether contributions are tracked |
| `ownerType: outsourced` (given/taken) | `Vendorship Fee` + **`outsourceDirection: 'given' \| 'taken'`** | One type; direction disambiguates |
| `progressStage` (enquiry → completed) | **`progressStage` optional field** + **`deriveProgressStage()`** from `status`, `operational{}`, invoices/payments | Stored value wins when set; else derived |
| `Project.type: EPC/INC/OTHER` | Keep **`ProjectType`** + **`category`** (Residential / Commercial / Industrial) | Do not replace with EPC enum without migration design |
| 7-stage timeline | **`progressSteps[]`** (7 names) | Rich sub-stages live in **`subOptions`** JSON; work-status photo/video matrix is a **future** UI layer |
| 62 materials | **`MATERIAL_CATALOG_REFERENCE`** + existing **`materials`** collection | Catalog is reference/import; no auto-duplication into live stock |
| Loans `sourceType` | **`Loan.sourceType?: 'Bank' \| 'NBFC' \| 'Person' \| 'Partner'`** | Maps to CoA liability ledgers |
| Expense taxonomy keys | **`CompanyExpense.taxonomyKey`** = `PILLAR:categoryId:subId` | Enables CoA ledger preview without guessing labels |
| Income taxonomy keys | **`IncomeRecord.taxonomyKey`** | Same |

## 2. Phase P0 — Accounting shell (done in this iteration)

- [x] Structured **Chart of Accounts** tree (primary → sub-group → ledger) in `src/lib/chartOfAccountsData.ts`
- [x] **Taxonomy → ledger** map + **ledger preview** from real `companyExpenses`, `incomeRecords`, `payments`, `invoices` (no fabricated amounts)
- [x] **Chart of Accounts page** refactor: collapsible tree, ledger detail, voucher-type summary
- [x] **`taxonomyKey`** on new unified expense/income rows
- [x] **Project**: `progressStage`, `bankDocumentationAmount`, `outsourceDirection`, `outsourcedTerms`, migration
- [x] **`deriveProgressStage`**, badge on project overview
- [x] **Vendorship** edit fields (party, amounts, direction)
- [x] **Loan** `sourceType`, migration
- [x] **62-item material catalog** reference file (names/units/HSN from spec)

## 3. Phase P1 — Taxonomy parity with doc #06

- Extend **`expenseTaxonomy.ts`** to full category/sub trees (company physical marketing, office water/tea/phone/misc, site categories, employee buckets, partner expense).
- Extend **`incomeTaxonomy.ts`** (partner contribution valued, loan EMI ref, employee reimbursement outgoing).
- Expand **`coaTaxonomyMap.ts`** for every new `taxonomyKey`.
- Optional: **`CompanyExpense.reimbursement`** block when `allowReimbursement`.

## 4. Phase P2 — Vouchers & double-entry (prototype → real)

- Voucher entities: `Sales`, `Purchase`, `Payment`, `Receipt`, `Contra`, `Journal` with **balanced lines** referencing **ledgerId**.
- Emit vouchers from: invoice create, sale bill, vendor bill, payment record, unified expense/income (configurable).
- **GST Payable / Input** from existing `gstBreakup` + vendor line GST when modeled.

## 5. Phase P3 — Project lifecycle depth (#08)

- **Work status** matrix: sub-items, photo/video flags, approval workflow (ties to `ApprovalRequest` + tasks).
- **DISCOM / Payment / DCR** substates inside `progressSteps[].subOptions` + UI per step.
- **Blockage** `timelineSubStage` picklist aligned to 7 stages.
- **Invoice amounts**: `bankDocumentationAmount` on project + quotation; UI hint for loan vs cash invoice total.

## 6. Phase P4 — Inventory (#07)

- Weighted-average / FIFO valuation fields on **`Material`** (avg cost, lot optional).
- **Return / damage** reasons on **`MaterialReturn`** (already scrap); extend return reasons.
- **Tools**: depreciation fields (SLM/WDV), link to CoA **Accumulated Depreciation**.
- Presets: wire **MATERIAL_CATALOG_REFERENCE** into “add from catalog” in Materials / Quotation flows.

## 7. Phase P5 — Modules #03 gaps

- Enquiry: `roofType`, `monthlyBillAmount`, status enum alignment.
- Customer: `siteAddress`, `pan` (some already present — verify).
- Quotation: `validityPeriod`, `discountType`/`discountValue`, `bankDocumentationAmount`.
- Vendor / vendor bills: GST line fields, bank details (verify `PurchaseBill`).

## 8. Verification

- After each phase: `npm run build`, smoke test role matrix (`permissions.ts`), seed reload.
- CoA: pick each **taxonomyKey** in dev and confirm preview hits correct ledger.

---

*Update this file when a phase completes or scope changes.*
