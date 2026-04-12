# Components deep dive

All paths under `src/components/` unless noted. **Props** are taken from TypeScript in each file.

## `Layout.tsx` — `Layout`

- **Role**: Application shell: sidebar, header, `Outlet`, page header bar, filters slot, `PrototypeScopeNotice`.
- **State**: `sidebarOpen`, `quickAddOpen`, `pinTick`, `navOpen` (collapsible groups — default from `defaultNavOpenState()`).
- **Context**: `useRole`, `useDataRefresh` (for company profile memo), `PageHeaderProvider` wraps children in `export function Layout`.
- **Children**: `LayoutShell` (internal) uses `useMergedPageHeader`, `useLiveCollection` for `notifications`, `users`.
- **Events**: pin/unpin (`toggleNavPin`), mobile overlay, role `<select>`, quick add outside click.

## `AppVersionBlocker.tsx` — `AppVersionBlocker`

- **Props**: none.
- **Action**: button calls `clearAllAppMemory()` + `location.reload()`.

## `GlobalSearch.tsx` — `GlobalSearch`

- **Props**: none.
- **State**: `q`, `open`.
- **Data**: `useLiveCollection` for projects, customers, invoices, users, quotations, enquiries, tasks, suppliers, payments (with invoice lookup for labels).

## `Card.tsx` — `Card`, `CardHeader`

- **`Card` props**: `children`, `className?`, `padding?` (`none|sm|md|lg`), `variant?` (`default|feature`), `interactive?`.
- **`CardHeader` props**: `title`, `description?`, `action?`.

## `ShellButton.tsx` — `ShellButton`, `ShellIconButton`

- **`ShellButton`**: extends `ButtonHTMLAttributes` + `variant` (`default|primary|destructive|outline|secondary|ghost|link|accent`), `size` (`sm|md`).
- **`ShellIconButton`**: `label` (aria), `children`, button props.

## `Modal.tsx` — `Modal`

- **Props**: `open`, `title`, `children`, `onClose`, `wide?`.
- **Behaviour**: Escape closes; backdrop click closes.

## `DataTableShell.tsx` — `DataTableShell`, helpers

- **Exports**: `dataTableClasses` (CSS string for tables), `DATA_TABLE_LIST_BODY_MAX_HEIGHT`, `listTableBodyMaxHeight(pageSize)`, `DataTableShell`.
- **`DataTableShell` props**: `children`, `className?`, `bare?`, `bodyMaxHeight?`, `scrollChainToParent?`.

## `TablePaginationBar.tsx` — `TablePaginationBar`

- **Constants**: `TABLE_PAGE_SIZE_OPTIONS` = `[12,24,48,100]`, `TABLE_DEFAULT_PAGE_SIZE` = 24.
- **Props**: `page`, `totalPages`, `pageSize`, `totalCount`, `onPageChange`, `onPageSizeChange`, optional `pageSizeOptions`, `className`.

## `ListPageFiltersLayout.tsx` — `ListPageFiltersLayout`, chip helpers

- **`ListPageFiltersLayout` props**: `primary`, `secondary?`, `className?`.
- **Helpers**: `listPageStatChipButtonClass`, `listPageStatChipInner(active)`, `listPageStatChipLabel(active)` — classnames for stat chips.

## `SummaryCards.tsx` — `SummaryCards`

- **Type**: `SummaryItem` = `{ label, value, hint?, onClick? }`.
- **Props**: `items`, `columns?` (`2|3|4|5`).

## `KpiDrilldownModal.tsx` — `KpiDrilldownModal`

- **Type**: `DrillLink` = `{ label, to, meta? }`.
- **Props**: `open`, `title`, `subtitle?`, `links`, `footer?`, `onClose`.
- **Uses**: `Modal` `wide`.

## `DocumentPreviewFrame.tsx` — `DocumentPreviewFrame`

- **Types**: `PreviewCompany` (`name`, `gst?`, `address?`).
- **Props**: `company`, `partyTitle?`, `partyName`, `partyDetails?`, `documentKind?`, `reference?`, `dateLabel?`, `dateValue?`, `extraMeta?`, `summary?`, `className?`.

## `UnifiedExpenseModal.tsx` — `UnifiedExpenseModal`

- **Props**: `open`, `onClose`, `defaultProjectId?`, `currentUserId?` (default `'system'`), `currentUserName?` (default `'User'`).
- **State**: `step` 1–5; taxonomy selection; `amount`, `date`, `notes`, `mode` (`PAYMENT_MODES`); optional `projectId`, `employeeId`, `partnerId`, `monthRef`, `qty`; step 5 **payer** radios from pillar `allowedPayers`.
- **Effects**: `companyExpenses`, `postExpenseVoucher`, `appendAudit`, `bump()`, toast. See `docs/14-forms-validation-and-interactions.md` §2.

## `UnifiedIncomeModal.tsx` — `UnifiedIncomeModal`

- **Props**: same as expense modal.
- **State**: `step` 1–5; income taxonomy; detail fields per sub `flags` (project, employee, bank, loan metadata, etc.); step 5 confirm summary.
- **Effects**: `incomeRecords`, `appendAudit`, `bump()` (no voucher). See `docs/14-forms-validation-and-interactions.md` §3.

## `ProjectTypeTagBadge.tsx` — `CardCornerTypeTag`, `InlineTypeTagDot`

- **Props**: `label`, `dotClass`, optional `className` on corner tag.

## `PrototypeScopeNotice.tsx` — `PrototypeScopeNotice`

- **State**: `dismissed` from `sessionStorage` key `mms_proto_scope_notice_dismissed`.
- **No props.**

## `icons.tsx`

**Exports (complete file):** `IconHome`, `IconSearch`, `IconBell`, `IconBellRound`, `IconPlus`, `IconPin`, `IconNavPin`, `IconPanel`, `IconChevronLeft`, `IconChevronDown`, `IconChevronRight`, `IconSettings`.

**Internal:** `Icon` wrapper applies default `size={20}`, `strokeWidth={1.75}`, `viewBox="0 0 24 24"`, `aria-hidden`.

**Props:** `SVGProps<SVGSVGElement> & { size?: number }` for every export.

## `ui/EmptyState.tsx` — `EmptyState`

- **Props**: `title`, `description?`, `icon?`, `action?`, `className?`.

## Context providers (not under `components/` but UI-related)

- **`PageHeaderProvider` / `usePageHeader` / `useMergedPageHeader`** — `src/contexts/PageHeaderContext.tsx`.
- **`AppProviders` / `useDataRefresh` / `useRole` / `useToast`** — `src/contexts/AppProviders.tsx`.

## Hooks

- **`useLiveCollection`** — `src/hooks/useLiveCollection.ts`: single arg `StorageKey`, returns `T[]`.
