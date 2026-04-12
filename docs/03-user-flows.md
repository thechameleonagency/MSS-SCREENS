# User flows (navigation + state transitions)

Conventions: **role guard** applies before shell content (`Layout.tsx`). **Data** changes require **`bump()`** where implemented so lists refresh.

## Cold start

1. User loads app URL.
2. If `localStorage.appVersion` exists and ≠ `APP_VERSION` → **Update required** screen → user clicks **Clear memory & reload** → storage cleared including MMS keys → reload.
3. Else `ensureSeed()` may reset or migrate data → main app loads → default route `/` redirects to `/dashboard`.
4. **Role** restored from `solar_currentRole` if valid; else `Super Admin`.

## Role switch

1. User changes **Role** `<select>` in header.
2. `setRole` writes `solar_currentRole`, updates context.
3. Sidebar filters with `canAccessPath`; if current `pathname` becomes forbidden → access denied view with **Go to Dashboard**.

## Global search (desktop)

1. User types ≥ 2 characters in search input.
2. Dropdown lists mixed entity hits (caps per `GlobalSearch.tsx`).
3. User clicks row → navigates to detail route → input clears on click.

## Quick add

1. User opens **+** menu.
2. Sees links filtered by `canAccessPath` (quotation new, invoice new, task new, projects list, enquiries).
3. Navigates to target route.

## Sales: enquiry → quotation → project (typical)

Exact creation rules live in `Enquiries.tsx`, `QuotationForm.tsx`, `Projects.tsx`. At a high level (verify in those files for conditions):

1. **Enquiries list** → open enquiry detail `/sales/enquiries/:id`.
2. From enquiry flow, user may create/link **quotation** (`/sales/quotations/new` or edit routes).
3. **Quotation** may convert to **project** when implemented in quotation/project pages (grep `setCollection('projects'` and navigation in `QuotationForm` / `Projects`).

## Finance: invoice and payment

1. Lists under `/finance/invoices`, `/finance/payments` (also reachable via **Billing** desk tabs).
2. **New invoice** `/finance/invoices/new` → save writes storage; may trigger voucher helpers per `Finance.tsx`.
3. Recording **payment** updates payment collection and related invoice balances where coded.

## HR: leave approval affecting attendance

1. User opens **Notifications** `/utilities/notifications`, **Approvals** tab.
2. User **approves** leave request → `resolveApproval` updates approval + may insert `attendance` row with `Paid Leave` if not duplicate (`Notifications.tsx`).

## Settings

1. `/settings` or header gear → `SettingsDesk` reads `?tab=` — **`company`** (default) or **`users`**.
2. **Company & master** and **Users** pages persist via `setCollection` / `setItem` and `bump()`.

## Inventory desk

1. `/inventory` loads `InventoryDesk` with `?tab=materials` default or `tools`.
2. Tab switches rewrite query param; embedded `MaterialsList` or `ToolsList` render.

## Legacy redirects

- **`/sales/customers/:id`** → **`/finance/customers/:id`** (`LegacySalesCustomerRedirect`).
- **`/projects/sites/:id`** → **`/projects/:projectId?site=:siteId`** (`SiteToProjectRedirect`).

## Pinned navigation

1. User clicks **pin** on a sidebar child link → path added to `mms_nav_pins_v1`.
2. Pinned items appear at top of sidebar with unpin control.

## Prototype notice

1. Footer shows **Prototype scope** card.
2. **Hide for this session** sets `sessionStorage` key → notice hidden until new session.
