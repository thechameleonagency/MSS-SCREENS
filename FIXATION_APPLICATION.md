# FIXATION_APPLICATION — Mahisolar Solution vs Current Prototype

**Purpose:** Single source of **required corrections** so the application aligns with the **Master Business Requirements (Non-Technical)** document you provided.  
**Method:** Compared BR §1–§15 against the current React + localStorage prototype (`src/`, `Export_Application_Details.md`).  
**Principle:** **Keep** existing features that do not contradict BR; **extend** or **rename** where BR is additive; **flag** true gaps (especially offline/sync, dual apps, and auth).

**Canonical business naming:** **Mahisolar Solution** (alias **Mahi Solar Solution**).  
**Current product strings:** UI often shows **“Mahi MMS”**, **“Operations”**, seed emails `@solarco.in` — treat as **demo placeholders** to replace with Mahisolar branding and real domains where BR applies.

---

## A) Already aligned or largely aligned (keep & lightly tune)

| BR area | Current prototype evidence | Note |
|---------|---------------------------|------|
| End-to-end modules exist | Sales, Projects, Inventory, Finance, HR/Team, Analytics, Audit, Notifications, Settings | IA labels differ (see §B1). |
| Leads / inquiries | `Enquiry` model, enquiries pages | Status **values** differ from BR (see §C1). |
| Customers, agents, quotations | Dedicated routes and storage keys | Quotation has `quoteKind` Solar/Other; extra status **Confirmed** vs BR (see §C2). |
| Projects with sites, materials, blockages | `Project`, `Site`, `ProjectMaterialsSentLine`, blockages, operational flags | Sub-areas (DISCOM, loan, subsidy) partially stubbed in `operational` (see §C4). |
| Inventory materials | Issue / return / scrap, categories, `sizeSpec`, dual units (`purchaseUnit` / `issueUnit`) | BR wants list-level totals, per-site material form columns, gates (see §C5). |
| Tools lifecycle | `lifecycleStatus`: Available / In Use / Under Repair | Matches BR summary cards intent. |
| Tool condition | `Tool.condition` exists | **Enum mismatch** with BR (see §C6). |
| Presets | `Preset`, segment `capacityCategory`, `PresetType` includes Quotation + Invoice + SiteChecklist | BR wants explicit filters/summary counts/cards (see §C7). |
| Finance: invoices, payments, vendors, loans, partners, expenses/income | Multiple finance routes + unified modals | BR wants a **Finance & Accounts** IA: Dashboard / Transactions / Vendors / Loans / Partners + KPI definitions (see §C8). |
| Chart of accounts / ledger / audit | Routes and `vouchers` / `ledgerLines` / `auditLogs` | Align naming with “Financial Audit” in nav; ensure KPIs derive from same rules as BR. |
| Analytics export | JSON export on analytics page | BR wants period filters, KPI parity, distribution **100%**, top performers by tasks (see §C9). |
| Approval kinds | `ApprovalKind`: `leave` \| `expense` \| `blockage` | Matches BR queues conceptually; **UI** does not split tabs + counts per BR (see §C10). |
| Master data | `masterData` + `MasterDataPage` | Far simpler than BR **8-tab** Masters (see §C11). |
| Roles & route gating | `UserRole` + `canAccessPath` | **Not** BR’s Admin vs Employee **user types** or CEO/Manager/Welder job types (see §C12). |
| Agent chain | Enquiry `source.agentId`, project `agentId`, commissions in agent UI | BR chain Agent → Inquiry → Project → Payment is **partially** traceable; strengthen links in UI/export. |

---

## B) Information architecture & naming (global)

### B1) Sidebar vs BR §7.14 (“User Flow”)

| BR expectation | Current | Fixation |
|----------------|---------|----------|
| Top-level **Team** | Label **Team** ✓ (HR underneath) | Keep; ensure page titles say **HR** where BR says “Team area” for payroll/attendance — optional subtitle “Team”. |
| **Financial Audit** as sibling | Group **Insights** → Analytics + **Audit** | Rename group to **“Financial Audit”** or split: **Analytics** + **Financial Audit** (audit-only) per BR wording; update `routeMeta` / breadcrumbs if used. |
| Finance inner structure | Desks: hub, billing, partners-vendors, loans, accounting | Map to BR **§7.11**: **Dashboard** (hub or dedicated), **Transactions** (ledger/income+expense list), **Vendors**, **Loans and Repayments**, **Partners**; add **Export Finances** entry point on finance dashboard or header. |
| Settings sections: Profile, Company, Team, Masters, Appearance, Security, User Flow | Settings desk + company, users, master data — **no** Profile / Appearance / Security / User Flow pages | Add routes or tabs; see §C11, §C13. |

### B2) Branding & company profile

- Replace **Mahi MMS** / **Operations** header with **Mahisolar Solution** (or configurable from `companyProfile.name`).
- Seed data: replace **@solarco.in** and generic names with Mahisolar-neutral or configurable demo strings.
- **Mission / Vision** (BR §1): store in company profile or static marketing page when filled.

---

## C) Module-by-module fixation list

### C1) Inquiry management (BR §12.1)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Statuses: **New, Contacted, Converted, Lost** | Type + UI: **New, In Progress, Converted, Closed** | **Migrate** `Enquiry.status` union and all filters, seeds, dashboards, analytics. Map **Closed** → **Lost** or keep **Closed** as superset with BR label “Lost” for lost deals. Replace **In Progress** with **Contacted** or add **Contacted** as distinct state (BR: qualification stage). |
| Pipeline copy | `pipelineStage` free text in seed | Optionally tie pipeline to BR work stages (§7.14) or keep as secondary label. |

**Files (representative):** `src/types/index.ts`, `src/pages/sales/Enquiries.tsx`, `src/lib/seedData.ts`, `src/lib/seedBulkExpansion.ts`, `src/lib/migrations.ts` (version bump + status map), `Dashboard.tsx`, any enquiry filters.

---

### C2) Quotation management (BR §7.1, §12.3)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Statuses: **Draft, Sent, Approved, Rejected** | Also **Confirmed** in type | Either map **Confirmed** → **Approved** for BR reports or document **Confirmed** as post-approval legal state; ensure analytics/filters consistent. |
| **Direct deal** — skip quotation | Project can exist with optional `quotationId` | **UI:** “Create project (direct deal)” wizard on Projects; enforce **customer + compliance** fields per BR §3. |
| Solar vs Other fields | Partially covered by `quoteKind`, line items, sections | Add **checklist UI** for required customer docs: PAN, Aadhaar, Passbook, **6-month electricity bill** (attach flags or document records on enquiry/customer/project). |
| **Unique** quotation number | `reference` used | Enforce uniqueness on create/edit + migration for duplicates. |
| **Discount above threshold → approval** | Not implemented | Add config in master/settings (threshold ₹); block save or spawn **ApprovalRequest** / notification. |
| **Expired** quotations cannot convert | `validityPeriodDays` exists | On “confirm / convert to project”, block if expired + message. |
| Warranty split product vs installation | `warrantyInfo` generic | Extend structure or labels to match BR solar template. |

**Files:** `src/types/index.ts` (`Quotation`, optional `CustomerDocument` or project file refs), `Quotations.tsx`, `Projects.tsx`, seeds.

---

### C3) Login, subsidy, loan-to-bank (BR §7.2)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Ordered steps: Login → install → subsidy (cash) vs loan path | `operational` has loose string fields | Model **enumerated stages** (e.g. `subsidyStage`, `bankFileStage`) + UI checklist matching **PM Surya → subsidy form → feasibility → customer docs → Loan File Book**. |
| Loan File Book: 1st / 2nd installment | Partially on **quotation** `bankLoanDetails` | BR §7.7 wants **project-level** installment tracking with receipt refs; add `LoanInstallment` lines on project or linked entity. |

**Files:** `src/types/index.ts` (`Project` / new interface), project detail UI, seed examples.

---

### C4) Structure, electrical, material list, photos (BR §7.3)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Material list form: opening, issued, returned, scrap, **installed/consumed**, balance, buy/sale price, updated by | Transfers/returns exist; **no full per-site ledger row** as specified | New structure e.g. `SiteMaterialLedgerLine` or extend `ProjectMaterialsSentLine` with **consumed**, **opening**, **scrap at site**, **balance**, **lastUpdatedBy**; UI tab per site. |
| Cannot mark structure/install complete **without** material usage update | No hard gate | Add validation on work-status checkbox or project stage transition. |
| **Photo verification**: Approved / Rejected / **Resubmit** | `SiteWorkStatusItem.approvalStatus` is `none/pending/approved/rejected` | Add **resubmit** (or map to rejected + reason); store **verifier name, date, remarks** per BR. |
| DCR, WCR, vendor confirmation | Not explicit | Project **Documents** or checklist items with types DCR/WCR + vendor link. |
| List: **total units** indicator; group header **count**; **spec** on row | Materials list may not show all | Materials list header/footer totals; group by category with count; always show `sizeSpec`. |
| Mixed units per line | `issueUnit` / `purchaseUnit` + conversion | Display “qty + unit” consistently on issue/return/scrap and project material views. |

**Files:** `src/types/index.ts`, `Projects.tsx`, `Inventory.tsx`, `ActiveSitesPage.tsx`, migrations.

---

### C5) Material verification, transport, returns (BR §7.5)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Pre-issue verification (supervisor + store) | Not modeled | Optional `MaterialDispatchVerification` or flags on `MaterialTransfer`. |
| Transport: vehicle, liability, charges | Not modeled | New entity `MaterialTransport` linked to transfer/dispatch. |
| Return categories: good / damaged / scrap + financial adjustment | `MaterialReturn` has `action` + `conditionNotes` | Align labels with BR; add **approval** workflow for damaged/lost value. |

---

### C6) Tools (BR §7.6)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Condition: Good, **Minor Damage**, **Major Damage**, **Not Working** | Type: `Good \| Fair \| Poor \| Under Repair \| Damaged` | **Migrate** enum + seed; map old values. BR: **Not Working** forces **Under Repair** and blocks issue — enforce in issue flow. |
| Issue/return: **issued by, received by, signature** | Tool movements may lack full trail | Extend `ToolMovement` (or equivalent) with parties + timestamp; UI capture. |
| Summary card **Under Repair** | Likely partial in UI | Ensure KPI matches `lifecycleStatus === 'Under Repair'`. |

**Files:** `src/types/index.ts` (`Tool`), `Inventory.tsx` (tools section), `seedData` / migrations.

---

### C7) Presets (BR §7.8)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Filters: **All | For Quotations | For Invoice & Inventory Matching** | UI may not expose | Add filter chips; use `Preset.type` + tags. |
| Summary: total presets, residential/commercial/**industrial** counts | Not on page | Summary cards at top of Presets page. |
| Card: line count, panel/inverter/structure summaries, estimated cost, purpose tag | Partial fields exist | Bind `panelCount`, `estimatedCost`, etc., to card layout per BR table examples. |
| **Edit** / **Delete** preset | Confirm in UI | Wire full CRUD + seed-safe behavior. |

**Files:** `src/pages/inventory/Inventory.tsx` (`PresetsPage`), types `Preset`.

---

### C8) Bill to book, invoice, payments (BR §7.7, §12.5–12.6)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| **Bill to book** register before/parallel to invoice | `SaleBill` exists; linkage to project/quotation may be incomplete | Explicit **BillBookEntry** or strengthen `SaleBill` links: customer, project/site, quotation ref, payment mode; **unique** reference; correction with approval reason. |
| Invoice: continuous numbering, no gaps | Validate on create | Enforce + audit log on void. |
| Multiple invoices per project | Supported in principle | UI from project: “Add phase invoice”. |
| Payment modes **Cash, Bank, Loan** | Various enums | Align naming with BR and Loan File Book. |
| **Company** loans vs **customer** EMIs | BR stresses separation | UI copy + model: company loans under Finance; customer installments under project/loan file. |

**Files:** `Finance.tsx`, `FinanceDetails.tsx`, types `Invoice`, `SaleBill`, `Payment`, `Loan`.

---

### C9) Finance & Accounts surface (BR §7.11)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| KPIs: **Total Revenue, Total Expenses, Outstanding, Net Profit** | Hub shows revenue (payments), expenses, net; may differ from BR definitions | **Define** revenue = invoices+sale bills received vs income records; outstanding = invoice balance + AR rules; net = revenue − expenses; **one** definition in `helpers` or `financeMetrics.ts` reused by Dashboard + Analytics. |
| **Transactions** single ledger view | Scattered lists | New page or unified tab: income + expense + key links, sort/filter, export. |
| **Export Finances** global | Partial exports | CSV/PDF or structured export; permission-gated. |
| Vendors rollups: with outstanding, categories count | Vendor list exists | Add summary cards matching BR. |
| Partners rollups: invested, profit paid, pending | Partner screens exist | Match labels and formulas to BR. |

**Files:** New or refactor `FinanceHubPage.tsx`, desk pages, `AnalyticsPage.tsx`, `Dashboard.tsx`.

---

### C10) Analytics & reports (BR §7.12, §15)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Period: **This month | Quarter | Year | Yearly** | No global period filter | State + filter all KPI queries. |
| Project distribution **Residential/Commercial/Industrial/Other** → **100%** | `projMix` raw counts | Add **Other**; compute **percentages**; chart. |
| **Top performers** by task completion | Not present | Aggregate `Task` completed/assigned by user in period. |
| KPI parity with Finance/Inventory/HR | Manual counts | Centralize metrics function shared with Finance hub. |
| Standard reports list §15 | Ad hoc | Add report stubs or export templates: profitability, inventory usage, agent performance, etc. |

**Files:** `AnalyticsPage.tsx`, `helpers.ts` or new `analyticsMetrics.ts`.

---

### C11) Notifications (BR §7.13)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Header **total pending** + tabs **Leave (n) | Expenses (n) | Blockages (n)** | Tabs: Inbox / Approvals / Archive | **Restructure** approvals tab into three sub-tabs with counts from `approvalRequests.filter(kind)` + `status==='pending'`. |
| Leave **types**, expense **categories**, blockage **types** | `title`/`detail` free text | Extend `ApprovalRequest` with `subtype` or `reasonCode` enums + optional note; seed examples per BR. |
| **Reference / ticket number** per item | Only `id` | Display `id` or human `ticketNo` field. |
| **Resolved by** on blockages | Partial on `ProjectBlockage` | Align notification card fields: project name, system size, description, date, actions. |
| Approved leave → attendance | Not automated | On `resolveApproval` for `leave`, insert holiday or leave mark for employee/date in `attendance` or payroll logic. |

**Files:** `Notifications.tsx`, `types/index.ts` (`ApprovalRequest`), `AppProviders` or a small hook for counts.

---

### C12) HR — Attendance & payroll (BR §7.10)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Attendance: **selected date**, past edit hint, **Mark Holiday** | HR attendance page may differ | Match BR card layout: monthly summary, P/H/PL legend, **per day rate**, earnings, paid leave availability, **Present/Absent** for selected date. |
| Payroll table columns: Salary, Present, Absent, Holiday, Pending, Advance, Actions **Pay / Expense / Task** | Current payroll UI may differ | Align table + row actions; link **Expense** to employee expense and **Task** to task assignment. |
| Roles on cards: Site Supervisor, Electrician, etc. | `User.role` is app permission role, not job title | Add **`jobTitle` or `designation`** on `User` (or link to HR masters) separate from **system role**. |

**Files:** `HR.tsx`, `types/index.ts` (`User`), seeds, masters.

---

### C13) Settings (BR §7.14)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| **Profile** (photo, name, phone, email) | No dedicated profile page | Route `/settings/profile` bound to “current user” from role prototype (pick first user or future auth id). |
| **Company** | `CompanyProfilePage` exists | Ensure GST, address, legal name match BR; authorized edit only. |
| **Team** in settings | `UserManagementPage` | Rename/copy to “Team”; show member + **role**; add member flow. |
| **Masters** — 8 tabs (Projects, Expenses, Inventory & Tools, Finance, Quotations, HR & Team, GST & Tax, System) | Single page with **7** `MasterDataType`s | Extend `MasterDataType` enum + grouped UI with expand/collapse, item counts, **Create Master**, **inactive** flag instead of delete. |
| **Appearance**: Light / Dark / System + accent | Theme mostly fixed in CSS | Wire to `localStorage` + CSS variables (or Tailwind dark class). |
| **Security**: change password | Login is prototype (password on user row) | Form: verify current password against selected user, update `User.password` + validation rules. |
| **User Flow** config | Static | BR says configurable — v1: static markdown/help panel; v2: JSON-driven steps in master data. |

**Files:** `Settings.tsx`, `SettingsDesk.tsx`, `App.tsx` routes, `types/index.ts`, new small contexts for theme.

---

### C14) User types & roles (BR §10)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| **Two user types:** Admin vs Employee (mutually exclusive) | Only `UserRole` (Super Admin, Admin, Management, Salesperson, Installation Team) | Add `userType: 'admin' \| 'employee'`; migrate seeds; **permissions:** employee type cannot open admin routes (or use separate bundle later). |
| Admin roles: **Super Admin, Admin, CEO, Manager** | No **CEO**; **Management** approximates | Add CEO; map Manager to new role or future flag. |
| Employee job types: **Welder, Site Supervisor, Civil Worker, Technician** | Not modeled | Use **designation** + masters; optional separate `JobRole` enum for employee portal. |
| First admin via **onboarding** | Seed creates users | Document as prototype limitation; add **setup wizard** route for empty DB. |
| Employee **portal** vs **admin app** | Single SPA + role switcher | BR: long-term **two shells**; short-term: **role-based layout** + hide nav for “employee” type. |

**Files:** `types/index.ts`, `permissions.ts`, `Layout.tsx`, `seedData.ts`, `App.tsx`.

---

### C15) Files, gallery, offline (BR §7.9)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Files per customer/site/project with metadata | URLs on sites/photos; no file entity | Introduce `ProjectFile` / `Attachment` with `name, type, uploadedAt, uploadedBy, url, projectId, milestone`. |
| Gallery by category + verification | Site `photos` array | Extend to structured gallery items with category (plant, inverter, meter) + verification status. |
| **Offline** queue / pending sync | Not applicable to pure static localStorage | **Document** as **future** (Service Worker + IndexedDB + sync API); prototype can show **UI placeholders** “Pending sync” only if backend exists. |

---

### C16) Agent management (BR §11)

| Requirement | Gap | Fixation |
|-------------|-----|----------|
| Chain **Agent → Inquiry → Project → Payment** | Data exists; UI/report may not show chain | Agent detail: linked enquiries + projects + payments/commission; export. |

---

### C17) Key relationships (BR §14)

| Requirement | Fixation |
|-------------|----------|
| Optional Quotation on Project | Already `quotationId?` — surface “Direct deal” badge when absent. |
| Project → invoices/payments | Enforce FK consistency in UI when creating invoices. |
| Commission ↔ payment | Link settlement records to project payment events in reports. |

---

## D) Technical debt to fix while aligning

| Issue | Action |
|-------|--------|
| Duplicate `LedgerLine` interface in `src/types/index.ts` (two blocks) | Merge into one definition; run `tsc`. |
| `useRole` simulates one global “current role” | BR needs **logged-in user** + **userType**; refactor toward `currentUserId` from auth or profile selection. |
| `DEMO_SEED_VERSION` vs `APP_VERSION` | Keep both; document when to bump each (`Export_Application_Details.md`). |

---

## E) Suggested implementation phases (priority)

1. **Naming & IA:** Mahisolar branding, Financial Audit nav, Finance subsection labels, enquiry/quotation status migrations.  
2. **Data integrity:** Unique quote/invoice numbers, expired quote guard, direct-deal project wizard.  
3. **Notifications UI:** Three approval tabs + counts + reason codes.  
4. **Materials & sites:** Per-site ledger columns, list totals/group counts, completion gates.  
5. **Tools:** Condition enum migration + issue rules.  
6. **Finance hub:** Single KPI definition + Transactions page + export.  
7. **Analytics:** Period filter, % mix, top performers.  
8. **Settings expansion:** Masters tabs, theme, security, profile.  
9. **User model:** `userType`, CEO, job title, permission matrix.  
10. **Subsidy/loan/bank file** stage model + Loan File Book installments.  
11. **Offline/files:** Backend or scoped prototype attachments.

---

## F) Traceability

- **Business requirements source:** User-provided “Master Business Requirements (Non-Technical)” (§1–§15).  
- **Application snapshot:** React routes in `src/App.tsx`, models in `src/types/index.ts`, persistence in `STORAGE_KEYS`, seeds in `src/lib/seedData.ts` + `seedBulkExpansion.ts`.

This file should be updated as BR sections marked “[To be filled]” are completed and as fixes are implemented (check off or link PRs/commits next to each row).
-------------









FOR ALL UI RELATEDCHANGES LIKE DESIGN, HIEREACHY, LEFT NAV ERTC ETC I WANT YOU TO KEEP THOSE AS THEY ARE AND INFACT REFINE THESE THE BEST USER EXPERIENCE AS YOU LIKE / SHOULD BE FOR THE WHOLE APPLICTAION, RETHINK THIS APPLICATION IF NEEDED BUILD THE BEST. 