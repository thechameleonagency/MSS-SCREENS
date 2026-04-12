# System architecture (code-derived)

## Runtime stack

- **Build**: Vite 5, TypeScript 5.6 (`package.json`).
- **UI**: React 18, `react-router-dom` 6, Tailwind CSS 3 + `tailwindcss-animate`, `clsx`, `tailwind-merge`.
- **Client PDF/canvas**: `jspdf`, `html2canvas` (used from PDF utilities).
- **Entry**: `index.html` → `src/main.tsx` → `BrowserRouter` → `AppProviders` → `App` (routes).

## High-level folder roles

| Path | Role |
|------|------|
| `src/main.tsx` | Version gate, `ensureSeed()`, mount router and providers. |
| `src/App.tsx` | **Single route table**; all pages are children of `Layout`. |
| `src/components/` | Reusable UI: shell (`Layout`), tables, modals, search, cards, icons. |
| `src/pages/` | Route-level screens grouped by domain (`sales`, `finance`, `hr`, …). |
| `src/contexts/` | Global React context: data refresh counter, role, toasts, page header overrides. |
| `src/hooks/` | `useLiveCollection` — re-read `localStorage` collections when refresh version bumps. |
| `src/lib/` | Domain logic: storage, seed, migrations, finance metrics, taxonomies, PDF, permissions, etc. |
| `src/types/index.ts` | TypeScript models + `STORAGE_KEYS` map to `localStorage` key strings. |
| `src/routes/` | Small redirect helpers (e.g. legacy site URL → project + `?site=`). |

## Component hierarchy (shell)

```
BrowserRouter
  AppProviders (Data + Role + Toast)
    Layout (PageHeaderProvider)
      LayoutShell
        GlobalSearch | QuickAdd | Notifications link | Settings link | Role select
        Sidebar (filtered nav from canAccessPath)
        Outlet → active page component
        PrototypeScopeNotice (footer)
```

- **Page header**: `PageHeaderProvider` merges `getPageMeta(pathname)` from `src/lib/routeMeta.ts` with per-page overrides from `usePageHeader()` (`src/contexts/PageHeaderContext.tsx`). Overrides reset on `pathname` change.

## Page ↔ component pattern

- Pages import shared primitives: `Card`, `ShellButton`, `Modal`, `DataTableShell`, `SummaryCards`, filter layouts, unified expense/income modals, etc.
- List pages typically use `useLiveCollection<...>(storageKey)` and `useDataRefresh().bump()` after writes via `getCollection`/`setCollection`.
- **No global Redux/Zustand**; state is React local state + contexts + `localStorage`.

## Separation of concerns

- **Types** define entity shapes and storage key names (`STORAGE_KEYS`).
- **storage.ts** isolates JSON parse/stringify and array CRUD for collections.
- **seedData.ts** owns initial population; **migrations.ts** owns schema drift repair and `schemaVersion`.
- **permissions.ts** isolates route and settings rules from UI layout.
- **auditLog.ts** appends capped audit rows (`slice(0, 2000)`).

## Patterns observed

- **Desk pattern**: Composite routes (`FinanceBillingDesk`, `FinanceAccountingDesk`, `FinancePartnersDesk`, `InventoryDesk`, `SettingsDesk`) render **local tab state** and embed existing list/detail components.
- **Redirect routes**: Legacy paths (`/sales/customers`, `/projects/sites`, …) map to canonical URLs (`App.tsx`, `src/routes/SiteRedirects.tsx`).
