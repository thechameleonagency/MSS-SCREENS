# State and data flow

## Where state lives

1. **React component state** (`useState`, `useMemo`) — filters, tabs, modal open flags, form fields, pagination.
2. **`localStorage`** — all durable entities (see `docs/08-local-storage-design.md`).
3. **React context** (`src/contexts/AppProviders.tsx`):
   - **Data refresh**: `{ version, bump }` — integer `version` incremented by `bump()` after mutations so subscribers reload from storage.
   - **Role**: `{ role, setRole }` — synced to `solar_currentRole`.
   - **Toast**: `{ show(message, type?) }` — ephemeral toasts, auto-remove after 3s.
4. **`PageHeaderContext`** — merged default meta from pathname + optional override from `usePageHeader`; cleared on route change.

## No global entity store

There is **no** Redux, Zustand, or React Query cache. Pages read storage through:

- `useLiveCollection<T>(key)` → depends on `[key, version]` from `useDataRefresh().version`.
- Direct `getCollection` / `getItem` in event handlers (sometimes combined with `bump()` after write).

## Update triggers

- After **mutating** storage, code calls **`bump()`** from `useDataRefresh()` so every `useLiveCollection` and any `useMemo` that depends on `version` (e.g. `Layout` company profile) refreshes.
- **Files calling `bump()`** include (non-exhaustive list from repository grep): `Finance.tsx`, `FinanceDetails.tsx`, `Projects.tsx`, `Enquiries.tsx`, `HR.tsx`, `Inventory.tsx`, `Quotations.tsx`, `Agents.tsx`, `Customers.tsx`, `Settings.tsx`, `ActiveSitesPage.tsx`, `Notifications.tsx`, `QuotationForm.tsx`, `QuotationDetailPage.tsx`, `UnifiedExpenseModal.tsx`, `UnifiedIncomeModal.tsx`.

## Prop drilling

- Mostly shallow: pages pass props into forms/modals/table shells.
- **Role** available globally via `useRole()` where imported.

## URL state

- **Settings**: `tab` query param (`SettingsDesk`).
- **Inventory desk**: `tab` query param (`InventoryDesk`).
- **Project detail**: `site` query param for site highlight (see project page implementation).

## Data lifecycle

1. **First load**: `ensureSeed()` may run full `runSeed()`; then `runDataMigrations()`.
2. **Session**: User edits → `setCollection` / `setItem` → `bump()` → UI re-reads.
3. **Version mismatch**: `AppVersionBlocker` blocks app until user clears storage (`clearAllAppMemory`).
