# Documentation map (audit index)

This folder defines the **Solar Management Admin** frontend as implemented in the repository. Files are **code-derived**; when behaviour changes, update the matching doc.

| Doc | Contents |
|-----|----------|
| `00-product-definition.md` | Product scope, modules, boundaries (no backend). |
| `01-system-architecture.md` | Entry, folders, shell hierarchy, patterns. |
| `02-core-logic.md` | Bootstrap, seed, migrations, KPIs, finance snapshot, vouchers, project tabs, permissions quirks. |
| `03-user-flows.md` | Cold start, role switch, search, seeds, redirects. |
| `04-feature-breakdown.md` | Features → files → storage keys. |
| `05-ui-pages.md` | Route → screen → data overview (field-level: `14-forms-validation-and-interactions.md`). |
| `06-components-deep-dive.md` | Reusable components, props, contexts, hooks. |
| `07-state-and-data-flow.md` | Contexts, `bump`, `useLiveCollection`, URL state. |
| `08-local-storage-design.md` | All storage keys and extra keys. |
| `09-routing-and-navigation.md` | Full route table, guards, redirects. |
| `10-frontend-limitations.md` | No API, RBAC gaps, dead UI (channel tab), prototype notice. |
| `11-backend-requirements.md` | Entity/API projection from frontend needs. |
| `12-permissions-rbac.md` | `canAccessPath` algorithm, roles, helpers. |
| `13-library-modules-index.md` | `src/lib/*.ts` purpose index. |
| `14-forms-validation-and-interactions.md` | Validators, modals, Dashboard, FormData forms, interaction patterns. |
| `15-domain-types-and-entity-index.md` | Types ↔ storage mapping. |

## Source file count (reference)

`src/**/*.ts` + `src/**/*.tsx` (excluding `vite-env.d.ts`): **100** modules — see workspace glob. **Vite** entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

## Audit notes (this revision)

- **Corrected** `Salesperson` permissions: all `/hr/*` paths are denied before the inner `/hr/tasks` disjunct; **`/inventory`** and **`/presets`** are denied for `Salesperson` (not covered by allowed prefixes).
- **Documented** unreachable **`channel`** financial sub-tab in `ProjectDetail` vs `visibleFinSubViews`.
- **Documented** dead **`path.startsWith('/hr/tasks')`** branch for `Salesperson` in `permissions.ts`.

## Generated appendix (machine-maintained)

| Output | Command |
|--------|---------|
| `docs/generated/ui-field-catalog.md` | `npm run docs:ui-catalog` |

Lists every **native** `<input>`, `<select>`, and `<textarea>` opening tag under `src/` (line number, parsed string attrs, tag preview). Regenerate after UI changes so the appendix stays aligned with code.

## Coverage limits (explicit)

- **Manual narrative** in **`docs/14-forms-validation-and-interactions.md`** covers shared validators, shell behaviour, Dashboard, `FormData` forms, and unified modals. **Exhaustive raw tag inventory** is in **`docs/generated/ui-field-catalog.md`** (run `npm run docs:ui-catalog`).
- **Every branch** of every `if` in the repo is **not** expanded in prose; conditional rules live in source. Cross-cutting rules (RBAC, migrations, vouchers) are documented in the hand-written files above.
