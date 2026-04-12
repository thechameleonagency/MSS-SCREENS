# Frontend limitations (evidence-based)

## Architecture

- **No backend**: All persistence is **browser `localStorage`** (plus a few non-`STORAGE_KEYS` keys — see `docs/08-local-storage-design.md`). No API client for app data.
- **No real authentication**: The header **Role** `<select>` is a **permission simulator** stored as `solar_currentRole`, not proof of identity.
- **Multi-tab / multi-user**: No merge semantics; last writer wins on shared keys.

## RBAC vs navigation (implementation gaps)

- **`canAccessPath`** is enforced in **`Layout`** for the current pathname only. **Dashboard** (`src/pages/Dashboard.tsx`) and other pages still render **`<Link>`** targets that may be **denied** for the selected role:
  - Examples for **`Salesperson`**: links to **`/hr/tasks`**, **`/hr/deployment`**, **`/hr/attendance`**, **`/settings?tab=company`**, **`/finance/invoices/new`**, **`/finance/hub`** (drilldown footer), **`/inventory`**, **`/presets`**, etc. Following them leads to the **access denied** screen from `Layout`.
- **`Salesperson`** cannot open **`/inventory`** or **`/presets`** (not under allowed path prefixes in `permissions.ts`). Sidebar entries for those areas are **hidden** when filtered by `canAccessPath`, but bookmarks or manual URLs still hit the guard.
- **Quick add** menu (`Layout.tsx` → `QuickAddMenu`) **does** filter entries with `canAccessPath`.

## Data & seeding

- **Demo seed**: `runSeed()` in `src/lib/seedData.ts`; `DEMO_SEED_VERSION` forces re-seed when changed.
- **FK warnings**: `assertDemoSeedFksDev()` logs warnings in **development** only (`seedData.ts`).
- **Migrations**: `runDataMigrations()` wraps migration body in `try/catch` and **ignores** errors (`migrations.ts`).

## Unreachable or inconsistent UI (code facts)

- **Project detail — Financials sub-view `channel`**: `FinSubViewKey` in `src/lib/projectUi.ts` includes `'channel'`, and `ProjectDetail` in `src/pages/projects/Projects.tsx` renders `finView === 'channel'`. However, **`visibleFinSubViews()`** only returns `summary`, `payments`, `expenses`, `partner`, `food` (and omits `partner` for `Solo` type). It **never** adds `'channel'` to the tab list. The `useEffect` that clamps `finView` to allowed keys therefore **never** sets `finView` to `'channel'`. The **`channel` panel JSX is not reachable** via the financial sub-tab buttons.

## Product scope (UI-declared)

`PrototypeScopeNotice` (`src/components/PrototypeScopeNotice.tsx`) states the following are **not** included:

- Real authentication, server APIs, email/WhatsApp delivery, statutory GST filing.
- Full double-entry for every business event.
- Bank statement import and production-grade reconciliation.

It references `doc/ApplicationAuditDetails.md` for additional notes (repository root, outside this `docs/` folder).

## Audit trail

- `appendAudit` keeps at most **2000** entries (`auditLog.ts`).

## Performance

- `useLiveCollection` re-parses full JSON arrays when **`useDataRefresh().version`** increments.
- **GlobalSearch** subscribes to many collections at once (`GlobalSearch.tsx`).

## PDF / export

- Client-side PDF uses `jspdf` / `html2canvas` (`pdfExport.ts`); behaviour depends on browser and DOM.

## Version gate

- **`AppVersionBlocker`**: if stored `appVersion` ≠ `APP_VERSION`, user must clear memory and reload (`main.tsx`, `appVersion.ts`).
