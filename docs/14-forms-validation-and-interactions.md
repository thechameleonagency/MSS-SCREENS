# Forms, validation, and interactions (code-derived)

This document records **shared validation helpers**, **central modals**, **shell interactions**, **Dashboard**, and **explicit HTML forms** where `FormData` is used. Screens with **dozens of fields** (e.g. `Enquiries.tsx`, `Projects.tsx`, `HR.tsx`, `Agents.tsx`) are summarized by **interaction class**; the **authoritative field list** is the JSX in each source file.

**Machine-generated appendix:** `docs/generated/ui-field-catalog.md` — every `<input>`, `<select>`, `<textarea>` in `src/**/*.tsx` (line + attrs + preview). Refresh with:

```bash
npm run docs:ui-catalog
```

This does **not** list inputs rendered inside **child components** (only tags written in each file).

---

## 1. Shared validation modules

### `src/lib/formValidation.ts`

| Function | Behaviour |
|----------|-----------|
| `requireNonEmptyTrimmed(value, fieldLabel)` | Returns `null` if `value.trim()` is non-empty; else `"${fieldLabel} is required"`. |
| `requirePositiveAmount(value, fieldLabel)` | Parses number from string or number; returns `null` if not finite or `<= 0`; else the positive number. **Note:** Second parameter is ignored in implementation (`_fieldLabel`). |
| `optionalNonNegativeNumber(value, fieldLabel)` | Empty string → `0`. Else parses number; returns `{ error: "${fieldLabel} must be zero or positive" }` if not finite or `< 0`; else the number. |

### `src/lib/validation.ts`

| Function | Behaviour |
|----------|-----------|
| `isEmail(s)` | `^[^\s@]+@[^\s@]+\.[^\s@]+$` on `s.trim()`. |
| `isPhone10(s)` | Last 10 digits (digits only) must match `^\d{10}$`. |
| `digitsPhone(s)` | `s.replace(/\D/g, '').slice(-10)`. |

### Files calling `formValidation` helpers (direct imports)

| File | Usage |
|------|--------|
| `src/pages/finance/FinanceDetails.tsx` | `requireNonEmptyTrimmed` on labor description; `requirePositiveAmount` on labor cost; `optionalNonNegativeNumber` on labor hours before recording outsource/labor-style row. |
| `src/pages/sales/QuotationDetailPage.tsx` | `requireNonEmptyTrimmed` on **rejection reason** when rejecting a quotation. |

**Most forms** use **inline checks** (`Number(...)`, truthy checks, `show(..., 'error')` from `useToast`) rather than `formValidation.ts`.

---

## 2. `UnifiedExpenseModal` (`src/components/UnifiedExpenseModal.tsx`)

**Props:** `open`, `onClose`, optional `defaultProjectId`, `currentUserId` (default `'system'`), `currentUserName` (default `'User'`).

**State machine:** `step` 1–5. Titles: `['Pillar', 'Category', 'Sub-category', 'Details', 'Who paid']`.

| Step | UI | User actions |
|------|-----|----------------|
| 1 | Grid of buttons, one per `EXPENSE_TAXONOMY` pillar | Click sets `pillarId`, clears `catId`/`subId`. |
| 2 | Buttons for categories in pillar | Click sets `catId`, clears `subId`. |
| 3 | Buttons for sub-categories | Click sets `subId`. |
| 4 | Amount (`type="number"`), date (`type="date"`), optional month (`type="month"` if `flags.requiresMonth`), optional project/employee/partner selects, optional quantity, payment mode `select` (`PAYMENT_MODES`), notes `textarea` | Conditional fields from `sub.flags`. |
| 5 | Summary text, amount display, **radio** group `paid by` from `allowedPayers` (pillar `allowedPayers` or `['Company']`) | Select payer. |

**Navigation:** Back (step &gt; 1), Cancel (calls `close` → `reset` + `onClose`), Next (steps 1–4: validates pillar/category/sub via `next()`), Save expense (step 5: `save()`).

**`save()` gates:** Pillar, category, sub, amount `Number(amount)` finite and `> 0`; `flags.requiresProject` → `projectId`; `requiresEmployee` → `employeeId`; `requiresPartner` → `partnerId`. On success: builds `CompanyExpense`, `setCollection('companyExpenses', ...)`, `postExpenseVoucher`, `appendAudit`, `bump()`, toast success, `close()`.

**`PAYMENT_MODES`:** `['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Credit Card']`.

---

## 3. `UnifiedIncomeModal` (`src/components/UnifiedIncomeModal.tsx`)

**Props:** Same pattern as expense modal (`open`, `onClose`, optional `defaultProjectId`, `currentUserId`, `currentUserName`).

**State machine:** `step` 1–5. Titles: `['Pillar', 'Category', 'Sub-category', 'Details', 'Confirm']`.

| Step | Content |
|------|---------|
| 1–3 | Same pillar → category → sub pattern over `INCOME_TAXONOMY`. |
| 4 | Amount, date, payment mode, reference, conditional project/employee/partner/person/contact/bank/loan fields per `flags`, notes. |
| 5 | Read-only summary: label, amount, date. |

**`next()`:** Requires pillar, category, sub selections (toasts on failure).

**`save()`:** Validates amount, taxonomy selections, conditional flags (`requiresProject`, `requiresEmployee`, `requiresPartner`, `requiresPersonName`, `requiresContactNumber`, `requiresBankName`). Builds `IncomeRecord` (negative amount if `flags.isOutgoing`). **Does not** call voucher posting. Writes `incomeRecords`, `appendAudit`, `bump()`, toast, `close()`.

**Primary actions (step 5):** Button label **Confirm** → `save()`.

---

## 4. `Layout` / shell (`src/components/Layout.tsx`)

| Element | Type | Condition / outcome |
|---------|------|---------------------|
| Mobile menu open | `button` | Sets `sidebarOpen` true. |
| Sidebar overlay | `button` | Sets `sidebarOpen` false. |
| Logo area | `Link` to `/dashboard` | Clears mobile sidebar on click. |
| `GlobalSearch` | component | See §5. |
| Quick add | `button` toggles menu | Outside click closes; links filtered by `canAccessPath`. |
| Notifications | `Link` to `/utilities/notifications` | Rendered only if `canAccessPath(role, '/utilities/notifications')`; badge shows unread count. |
| Settings | `Link` to `/settings?tab=company` | If `canAccessPath(role, '/settings')`. |
| Role | `select` | `ROLES` options; `onChange` → `setRole`. |
| Sidebar groups | `button` expand/collapse | Toggles `navOpen[group.label]`. |
| Nav links | `Link` | `navItemActive` highlights; click sets `sidebarOpen` false on mobile. |
| Pin / unpin | `button` | `toggleNavPin(to)`; prevent default on pin buttons. |
| Access denied | `ShellButton` | Navigates to `/dashboard` when path forbidden. |

**Pinned section:** Reads `getNavPins()`; `storage` + `mms-nav-pins` events increment `pinTick`.

---

## 5. `GlobalSearch` (`src/components/GlobalSearch.tsx`)

| Input | Behaviour |
|-------|-----------|
| `input type="search"` | `q` state; `onChange` sets `q` and `open` true; `onFocus` opens; `onBlur` 200ms timeout sets `open` false. |
| Results | Shown when `open && q.trim().length >= 2`; each row is `Link` clearing query on click. |

**Limits:** `MAX_TOTAL = 14`, `PER_TYPE = 4` (users slice uses `3` in code). **Hidden** on small screens (`hidden … sm:block` on wrapper).

---

## 6. `Dashboard` (`src/pages/Dashboard.tsx`)

**State:** `drill` — `null` | `'revenue'` \| `'active'` \| `'pending'` \| `'employees'` \| `'lowstock'` \| `'emi'` \| `'quo'` \| `'hold'`.

| Region | Interaction | Result |
|--------|---------------|--------|
| Spotlight row | `Link` to `/hr/tasks`, `button` sets drill `'hold'`, `Link` `/hr/deployment`, `Link` `/utilities/notifications` | Opens routes or drill modal. |
| Pipeline | `Link` `/sales/enquiries`, `/sales/quotations`, `/projects` | Navigation. |
| Cash card | `button` drill `'pending'`; recent payments list; `Link` `/finance/payments` | Drill modal or navigate. |
| Operations | `button` drill `'lowstock'`; `Link` `/projects/active-sites` | Drill or navigate. |
| Quick actions | `ShellButton` `navigate` to `/sales/quotations/new`, `/projects`, `/finance/invoices/new`, `/projects/active-sites` | **Not** role-filtered in this component. |
| Explore metrics | `button` per `explorerCards` key sets `drill` to that key | Opens `KpiDrilldownModal`. |
| `KpiDrilldownModal` | `onClose` clears drill; footer `Link` to `/finance/hub` when `drill === 'revenue'` | Navigation. |
| Project mix | display only | — |
| More shortcuts | `Link` to `/sales/enquiries`, `/sales/quotations`, `/hr/attendance`, `/settings?tab=company` | **Not** role-filtered. |

**Drill link construction:** Implemented in `useMemo` on `drill` — see source for per-key filters (e.g. revenue merges invoices + sale bills).

---

## 7. HTML `FormData` forms (explicit field names)

### `VendorsList` — add purchase bill (`Finance.tsx`)

**Trigger:** “Add bill” on vendor row → modal; **`form onSubmit={addBill}`**.

| `name` | HTML | Required | Used in handler |
|--------|------|----------|-----------------|
| `bn` | text | yes | `billNumber` |
| `dt` | date | yes | `date` |
| `mid` | select materials | implicit | `materialId` (fallback `materials[0]?.id`) |
| `qty` | number | no (default 1) | quantity |
| `rate` | number | no | rate |
| `hsn` | text | no | optional on line |
| `gst` | number | no | GST % → CGST/SGST split |
| `total` | number | yes | `PurchaseBill.total` |

On success: append `purchaseBills`, increase material `currentStock`, `bump()`, toast, `form.reset()`.

### `ExpenseAuditPage` — add expense (`Finance.tsx`)

**Trigger:** “Add expense” → modal; **`form onSubmit={addExpense}`**.

| `name` | Type | Required |
|--------|------|----------|
| `cat` | text | yes |
| `sub` | text | no |
| `amt` | number | yes |
| `dt` | date | yes |
| `pb` | text | no (defaults to `company` in code) |
| `mode` | text | no (defaults `Bank Transfer`) |
| `notes` | textarea | no |

Builds `CompanyExpense` **without** `taxonomyKey` / `pillar` (manual flat form).

---

## 8. Other pages — interaction classes

Without duplicating every line of large files, the following patterns appear:

| Area | Files | Patterns |
|------|-------|----------|
| Sales lists | `Enquiries.tsx`, `Quotations.tsx`, `Agents.tsx`, `Customers.tsx` | Search/filter `input`/`select`, stat chips via `ListPageFiltersLayout`, pagination via `TablePaginationBar`, modals for create/edit, `Link` to detail routes. |
| Quotations | `QuotationForm.tsx`, `QuotationDetailPage.tsx` | Large controlled form; PDF via `exportDomToPdf`; status actions. |
| Projects | `Projects.tsx` | Project list filters; `ProjectDetail` multi-tab UI, `useSearchParams` for `site`, document checklists, financial sub-tabs, `checkbox` for progress items, partner/channel `select`s. |
| Inventory | `Inventory.tsx` | Material create/edit numeric fields; tool condition `select`; preset builder with dynamic lines. |
| Finance | `Finance.tsx`, `FinanceDetails.tsx` | Invoice line items, GST toggles, payment modals, loan forms, vendor/partner/channel CRUD. |
| HR | `HR.tsx`, `EmployeeForm.tsx` | Attendance date hubs, payroll month, task assignee checkboxes, task filters. |
| Settings | `Settings.tsx` | Master data type/value; company profile fields; user management. |
| Analytics | `AnalyticsPage.tsx` | Period `select` (`month`/`quarter`/`year`), tab `financial`/`operations`. |
| Audit | `AuditModule.tsx` | Mostly read-only tables; CSV export buttons where implemented. |
| Notifications | `Notifications.tsx` | Tabs inbox/approvals/archive; approve/reject buttons calling `resolveApproval`. |

**Rule:** Any **input** not listed in this file is still defined only in its **`src/pages/...` or `src/components/...`** source.
