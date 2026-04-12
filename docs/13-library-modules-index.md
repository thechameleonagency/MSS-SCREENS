# Library modules index (`src/lib/*.ts`)

Short index of **exported purposes** (read each file for full signatures). Duplicates from path variants are the same file.

| Module | Role |
|--------|------|
| `appVersion.ts` | `APP_VERSION`, storage key, mismatch check, `clearAllAppMemory`. |
| `auditLog.ts` | `appendAudit` capped log. |
| `billingRules.ts` | Billing directions / summary lines for solar project kinds. |
| `branding.ts` | Default company short name and app subtitle strings. |
| `chartOfAccounts.ts` | Static COA list, tree, filter, descendants. |
| `coaMapping.ts` | Map expenses/income/payments/invoices to ledger account ids. |
| `csvDownload.ts` | Browser CSV download helper. |
| `enquiryConstants.ts` | Enquiry/task constants and meeting kinds. |
| `enquiryProjectLock.ts` | Lock rules for introducer economics (used by quotations). |
| `expenseTaxonomy.ts` | Expense pillar/category hierarchy and keys. |
| `financeInsights.ts` | P&amp;L, GST, debtors/creditors, cash/bank, inventory valuation, audit CSV string, rollups. |
| `financeMetrics.ts` | `computeFinanceSnapshot`. |
| `formValidation.ts` | Trimmed string / amount validators for forms. |
| `gstCompute.ts` | GST calculation helpers. |
| `helpers.ts` | INR formatting, enquiry/task helpers, pricing, agent commission, entity getters. |
| `incomeTaxonomy.ts` | Income taxonomy hierarchy. |
| `inventoryConstants.ts` | Material/tool category unions. |
| `introAgentEconomics.ts` | Introducer payout mode and share breakdown. |
| `materialsPack62.ts` | Extra material catalog merge for seed. |
| `migrations.ts` | `runDataMigrations`, schema 9. |
| `navPins.ts` | Sidebar pin storage. |
| `pdfExport.ts` | `exportDomToPdf`. |
| `permissions.ts` | RBAC helpers, EPC role mapping. |
| `progressStage.ts` | Derive/display project progress stage. |
| `projectCardTags.ts` | Project naming/tag display helpers. |
| `projectClientCollection.ts` | Invoice grouping / partner payout checks. |
| `projectDocumentRules.ts` | Document set rules per project. |
| `projectUi.ts` | Tab visibility for project detail and finance subviews. |
| `quotationRules.ts` | Quotation expiry. |
| `routeMeta.ts` | Breadcrumbs and titles from pathname. |
| `seedBulkExpansion.ts` | Bulk synthetic rows for seed. |
| `seedData.ts` | `runSeed`, `ensureSeed`, `DEMO_SEED_VERSION`, demo IDs. |
| `seedTaxonomyCoverage.ts` | Taxonomy coverage rows for seed. |
| `siteEligibility.ts` | Site/task eligibility for attendance. |
| `siteMaterialLedger.ts` | Site material ledger balance and issue upsert. |
| `solarProjectKind.ts` | Map legacy project type to solar kind. |
| `storage.ts` | `localStorage` get/set/clear/id. |
| `toolDepreciation.ts` | SLM and WDV depreciation math. |
| `utils.ts` | `cn` (clsx + tailwind-merge). |
| `validation.ts` | Email/phone helpers. |
| `voucherPosting.ts` | Create vouchers + ledger lines from invoice/payment/expense. |
