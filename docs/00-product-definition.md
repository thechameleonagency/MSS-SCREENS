# Product definition (code-derived)

This document describes **only** what the repository implements. The application is a **single-page React (Vite) frontend** named **Solar Management Admin** (`index.html` title; `package.json` name `solar-management-admin`). There is **no server, no REST/GraphQL client, and no real authentication** in code.

## Problem addressed (as implemented)

The UI models **solar/EPC-style operations** in one place: sales pipeline (enquiries, quotations, agents), **project and site** tracking, **materials and tools** inventory, **finance** (invoices, sale bills, payments, loans, vendors, partners, channel partners, chart of accounts, expense audit), **HR** (employees, attendance, payroll, holidays, deployment, tasks), **analytics**, a **financial audit** suite of read-only-style views, **settings** (company profile, master data, users), and **notifications**. All business data is **read and written in the browser** via `localStorage` helpers in `src/lib/storage.ts`.

## What users can actually do

- **Switch role** in the shell (`AppProviders`): `Super Admin`, `Admin`, `CEO`, `Management`, `Salesperson`, `Installation Team`. The choice is persisted under `STORAGE_KEYS.currentRole`. Access to routes is filtered by `canAccessPath` in `src/lib/permissions.ts` (see `docs/12-permissions-rbac.md`).
- **Navigate** the sidebar (grouped links), use **global search** (desktop), **quick add** menu, **notifications** link, **settings** shortcut, **pin** favourite nav targets.
- **CRUD and workflows** on seeded/demo data across modules: exact behaviours are implemented per page (see `docs/05-ui-pages.md` and `docs/04-feature-breakdown.md`).
- **Export** some artefacts client-side (e.g. CSV from finance transactions; PDF flows where `jspdf` / `html2canvas` are used in `src/lib/pdfExport.ts` and callers).
- **Clear incompatible storage**: if `appVersion` in `localStorage` does not match `APP_VERSION` from `src/lib/appVersion.ts`, the app shows `AppVersionBlocker` until the user clears memory and reloads.

## Major modules (route-aligned)

| Area | Primary routes | Core data keys (`STORAGE_KEYS`) |
|------|----------------|----------------------------------|
| Dashboard | `/dashboard` | Aggregates many collections |
| Sales | `/sales/*` | `enquiries`, `quotations`, `agents`, `customers` |
| Projects & sites | `/projects/*`, `/projects/active-sites` | `projects`, `sites`, … |
| Inventory | `/inventory`, `/inventory/materials`, `/inventory/tools` | `materials`, `tools`, … |
| Presets | `/presets` | `presets` |
| Finance hub & desks | `/finance/*` | `invoices`, `payments`, `saleBills`, `companyExpenses`, `incomeRecords`, `loans`, `suppliers`, `partners`, `channelPartners`, … |
| Analytics | `/analytics` | Derived from collections |
| Audit | `/audit/*` | Reads finance/inventory data; `auditLogs` for log view |
| HR | `/hr/*` | `users`, `attendance`, `payrollRecords`, `tasks`, `companyHolidays`, … |
| Settings | `/settings` | `companyProfile`, `masterData`, `users` |
| Utilities | `/utilities/notifications` | `notifications` |

## System boundaries (what does **not** exist in code)

- **No backend API**; no `fetch` to application APIs for persistence.
- **No login/session server**: “current user” in the shell is a **display derivation** from `users` collection and selected `role`, not authenticated identity.
- **No email/WhatsApp/GST filing** (stated in `PrototypeScopeNotice`).
- **Prototype notice** also states full double-entry for every event and production bank reconciliation are **out of scope**; voucher posting exists in a **limited** form (`src/lib/voucherPosting.ts`) used from expense flows.

## Bootstrap & versioning

- On load (when version matches): `ensureSeed()` in `src/lib/seedData.ts` runs if seed markers are missing or demo seed version changed, then `runDataMigrations()` in `src/lib/migrations.ts`.
- `main.tsx` sets `localStorage` `appVersion` to `APP_VERSION` after `ensureSeed()`.

See `docs/08-local-storage-design.md` and `docs/10-frontend-limitations.md`.

**Documentation index:** `docs/DOCUMENTATION-MAP.md` lists all spec files and audit notes. **Effective route access by role** (including `Salesperson` reach: dashboard, sales, projects, finance customers only, analytics, utilities — **not** HR, inventory, presets, most finance) is defined in `docs/12-permissions-rbac.md`.
