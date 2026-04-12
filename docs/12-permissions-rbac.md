# Permissions and roles (code-derived)

Source of truth: `src/lib/permissions.ts` — evaluated against the **full pathname** string in `LayoutShell` (`src/components/Layout.tsx`).

## `UserRole` union

Defined in `src/types/index.ts`:

- `Super Admin`
- `Admin`
- `CEO`
- `Management`
- `Salesperson`
- `Installation Team`

## `ROLES` array (selector order)

`src/contexts/AppProviders.tsx` exports `ROLES` in the same order as above for the header `<select>`.

## Persistence

- `localStorage` key `STORAGE_KEYS.currentRole` (`solar_currentRole`).
- Initial state: read from storage if value is in `ROLES`; else default **`Super Admin`**.
- `setRole` writes storage then updates React state.

## `canAccessPath(role, path)` — exact algorithm

Prefix constants: `financePrefixes = ['/finance']`, `hrPrefixes = ['/hr']`, `settingsPrefixes = ['/settings']`.

1. **If** `role` is `Super Admin` **or** `Admin` **or** `CEO` **or** `Management` → return **`true`** (no further checks).

2. **Else if** `role === 'Salesperson'`:
   - **If** `path.startsWith('/finance/customers')` → **`true`** (includes `/finance/customers/:id`).
   - **Else if** `path.startsWith('/finance')` (via `financePrefixes`) → **`false`**.
   - **Else if** `path.startsWith('/hr')` (via `hrPrefixes`) → **`false`** — **every** HR path is blocked here, including `/hr/tasks` and `/hr/tasks/new`.
   - **Else if** `path.startsWith('/settings')` → **`false`**.
   - **Else if** `path.startsWith('/audit')` → **`false`**.
   - **Else** return whether **any** of these holds:
     - `path.startsWith('/dashboard')`
     - `path.startsWith('/sales')`
     - `path.startsWith('/projects')`
     - `path.startsWith('/hr/tasks')` — **unreachable in practice**: any `/hr/tasks` path already matched `hrPrefixes` and returned **`false`** above (dead branch in source).
     - `path.startsWith('/analytics')`
     - `path.startsWith('/utilities')`
     - `path === '/'`

   **Effective allow list for Salesperson** (reachable paths): **`/finance/customers`…**, **`/dashboard`…**, **`/sales`…**, **`/projects`…**, **`/analytics`…**, **`/utilities`…**, **`/`**.  
   **Denied examples:** all other `/finance/*`, **all** `/hr/*`, all `/settings/*`, all `/audit/*`, **`/inventory`**, **`/presets`**, etc., unless matched by the allowed prefixes (they are **not** — so inventory and presets are **denied** for Salesperson).

   **Corollary:** Dashboard and other pages may still show **links** to denied routes; `Layout` blocks rendering when navigated (see `docs/10-frontend-limitations.md`).

3. **Else if** `role === 'Installation Team'`:
   - Return **`true`** only if one of:
     - `path.startsWith('/dashboard')`
     - `path.startsWith('/projects')`
     - `path.startsWith('/utilities')`
     - `path === '/'`
     - `path === '/hr'`
     - `path === '/hr/attendance'` **or** `path.startsWith('/hr/attendance/')`
     - `path === '/hr/tasks'` **or** `path.startsWith('/hr/tasks/')`
   - Otherwise → **`false`**.

4. **Else** (any other role value not matched above) → **`true`** (fallback).

## Other permission helpers

- `canDeleteUsers(role)`: `true` iff role is `Super Admin`, `Admin`, or `CEO`.
- `canEditSettings(role)`: same three roles.

## `EPC_SPEC_ROLE_APP_ROLES`

Maps labels `Admin`, `Internal_Ops`, `Installer`, `Partner`, `Vendor` to arrays of `UserRole`. **`Partner` and `Vendor` map to empty arrays** (comment in source: extend when dedicated portals exist).

## Layout enforcement

`LayoutShell` renders an access-denied screen (message + **Go to Dashboard** button) when `!canAccessPath(role, loc.pathname)` — **no redirect**.

Sidebar links and quick-add links are **pre-filtered** with `canAccessPath`, but **in-page `<Link>` / `navigate()`** elsewhere are not automatically hidden by role.
