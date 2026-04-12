# Backend requirements (inferred from frontend only)

This section lists **what a future API layer must support** to replace `localStorage` **without** changing route or screen behaviour, based strictly on **collections, fields, and operations** implied by the TypeScript types (`src/types/index.ts`) and read/write patterns in pages/libs.

**Entity ↔ storage key matrix:** `docs/15-domain-types-and-entity-index.md`.

## Dual paths for company expenses

The UI can create **`CompanyExpense`** rows in two ways:

1. **`UnifiedExpenseModal`:** Sets `taxonomyKey`, `pillar`, structured `category` label, optional `employeeId` / `partnerId`, and triggers **`postExpenseVoucher`**.
2. **`ExpenseAuditPage` manual form (`Finance.tsx`):** Flat `cat` / `sub` / `amt` / `dt` / `pb` / `mode` / `notes` via `FormData` — **no** `taxonomyKey` / `pillar` in the object literal.

A backend should accept **both shapes** or normalize to one canonical expense model.

## General

- **Persistence**: Replace each `STORAGE_KEYS` collection with a resource; replace `companyProfile` with a singleton document API.
- **Concurrency**: Frontend assumes **last write wins** today; backend should define versioning or ETags if multi-user.
- **Auth**: Current app has **no login**; a backend must introduce **session/JWT** and map to `User` records; **role** must be server-authoritative (today it is client-stored).

## Entity resources (grouped)

### Identity & org

- **Users** (`users`): CRUD; fields per `User` interface (role, employment, salary, documents, etc. — see types).
- **Company profile** (`companyProfile`): get/update singleton; includes GST, bank, quotation discount threshold.
- **Master data** (`masterData`): list of typed key/value rows (`MasterData`).

### CRM / sales

- **Agents**, **Customers**, **Enquiries**, **Quotations**: full CRUD + status transitions as enforced in UI modules.
- Link quotations to customers/presets/materials as in current forms.

### Projects & sites

- **Projects**, **Sites**: CRUD; project types / `solarKind` / billing fields per `Project` type.
- **Tasks** (incl. enquiry placeholder project id `__enquiry__` from `enquiryConstants.ts`).
- **Outsource work** (`outsourceWork`).

### Inventory

- **Materials**, **Tools**, **Presets**, **Material transfers**, **Material returns**, **Tool movements**.

### Finance

- **Invoices**, **Payments**, **Sale bills**, **Loans**, **Purchase bills**, **Vendor payments**
- **Suppliers** (vendors), **Partners**, **Channel partners**, **Partner settlements**, **Channel fees**
- **Company expenses**, **Employee expenses**, **Income records**
- **Payroll records**
- **Vouchers**, **Ledger lines** (posting from `voucherPosting.ts` and COA in `chartOfAccounts.ts`)
- **Intro agent economics** (`introAgentEconomics`)

### HR

- **Attendance**, **Company holidays**, **Approval requests** (kinds: expense, leave, blockage per notifications page)

### System

- **Notifications** (`AppNotification`)
- **Audit logs** (`AuditLogEntry`, capped list today — backend may use infinite retention)

## Suggested API shapes (illustrative)

Exact fields must mirror **`src/types/index.ts`**. Representative patterns:

### Collection list + get

- `GET /api/{resource}` → array of entity.
- `GET /api/{resource}/:id` → single entity.

### Mutations

- `POST /api/{resource}` create (body = entity minus client-generated id or with server id).
- `PATCH /api/{resource}/:id` partial update matching UI forms.
- `DELETE` where UI deletes (e.g. users with `canDeleteUsers` guard on client — must re-enforce server-side).

### Singleton

- `GET /api/company-profile`, `PUT /api/company-profile`

### Aggregates (optional optimization)

The UI computes KPIs client-side (`Dashboard`, `FinanceHubPage`, `financeMetrics`, `financeInsights`). Backend may expose:

- `GET /api/dashboard/summary` — optional mirror of KPI formulas in `Dashboard.tsx` / `computeFinanceSnapshot`.
- `GET /api/finance/snapshot` — same inputs as `computeFinanceSnapshot`.

## Search

Replace `GlobalSearch` client filter with:

- `GET /api/search?q=` returning mixed hits with `{ type, label, id, href }` or typed discriminated union; match current caps (`MAX_TOTAL`, `PER_TYPE` in `GlobalSearch.tsx`) or document new limits.

## Versioning & migrations

- **`schemaVersion`**: server-side migrations replace `runDataMigrations`; client should not patch raw JSON.
- **`APP_VERSION`**: deployment compatibility — replace with API min client version or schema negotiation.

## Approvals workflow

- Approve/reject endpoints should apply **leave → attendance** side effect as in `Notifications.tsx` (`applyApprovedLeaveToAttendance`), or server moves that logic to a domain service.

## Files / uploads

- User `dataUrl` / document fields on entities imply **future blob storage**; current code stores data URLs in JSON — backend should accept multipart uploads and return URLs.

## Reporting / PDF

- `exportDomToPdf` is **client-only**; backend may later generate PDFs server-side for parity.

## Non-functional

- **CSV export** (`FinanceTransactionsPage`, `financeInsights` CSV helper): streaming `text/csv` endpoints optional.
- **Id generation**: today `generateId(prefix)` — server should issue canonical IDs.
