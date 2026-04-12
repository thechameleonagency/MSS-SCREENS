# Local storage design (exact keys from code)

All persisted business data uses **`STORAGE_KEYS`** string values in `src/types/index.ts`. Access goes through `getCollection` / `setCollection` / `getItem` / `setItem` in `src/lib/storage.ts` (JSON serialization).

## Collection keys (`StorageKey` → `localStorage` string)

| Logical key | `localStorage` key |
|-------------|-------------------|
| `users` | `solar_users` |
| `attendance` | `solar_attendance` |
| `tasks` | `solar_tasks` |
| `employeeExpenses` | `solar_employeeExpenses` |
| `agents` | `solar_agents` |
| `enquiries` | `solar_enquiries` |
| `customers` | `solar_customers` |
| `quotations` | `solar_quotations` |
| `projects` | `solar_projects` |
| `sites` | `solar_sites` |
| `materials` | `solar_materials` |
| `tools` | `solar_tools` |
| `presets` | `solar_presets` |
| `suppliers` | `solar_suppliers` |
| `purchaseBills` | `solar_purchaseBills` |
| `vendorPayments` | `solar_vendorPayments` |
| `loans` | `solar_loans` |
| `partners` | `solar_partners` |
| `channelPartners` | `solar_channelPartners` |
| `invoices` | `solar_invoices` |
| `payments` | `solar_payments` |
| `saleBills` | `solar_saleBills` |
| `companyExpenses` | `solar_companyExpenses` |
| `masterData` | `solar_masterData` |
| `companyProfile` | `solar_companyProfile` (single object via `getItem`/`setItem`) |
| `materialTransfers` | `solar_materialTransfers` |
| `outsourceWork` | `solar_outsourceWork` |
| `payrollRecords` | `solar_payrollRecords` |
| `partnerSettlements` | `solar_partnerSettlements` |
| `channelFees` | `solar_channelFees` |
| `notifications` | `solar_notifications` |
| `incomeRecords` | `solar_incomeRecords` |
| `approvalRequests` | `solar_approvalRequests` |
| `auditLogs` | `solar_auditLogs` |
| `companyHolidays` | `solar_companyHolidays` |
| `toolMovements` | `solar_toolMovements` |
| `materialReturns` | `solar_materialReturns` |
| `vouchers` | `solar_vouchers` |
| `ledgerLines` | `solar_ledgerLines` |
| `introAgentEconomics` | `solar_introAgentEconomics` |
| `seeded` | `solar_seeded` |
| `currentRole` | `solar_currentRole` |
| `schemaVersion` | `solar_schemaVersion` |

## Additional keys (not in `STORAGE_KEYS`)

| Key | Purpose | Read/write locations |
|-----|---------|----------------------|
| `appVersion` | Build compatibility marker | `src/lib/appVersion.ts` (`APP_VERSION_STORAGE_KEY`), `main.tsx`, `clearAllAppMemory` |
| `solar_demoSeedVersion` | Demo seed content version | `seedData.ts` (`ensureSeed`, `runSeed`), cleared in `clearAllAppMemory` |
| `mms_nav_pins_v1` | Sidebar pinned routes (JSON string array) | `src/lib/navPins.ts` |

## Session storage

| Key | Purpose |
|-----|---------|
| `mms_proto_scope_notice_dismissed` | When `'1'`, `PrototypeScopeNotice` is hidden for the browser tab session (`src/components/PrototypeScopeNotice.tsx`). |

## Write patterns

- **Collections**: Full array replace via `setCollection(key, data)` — any partial update in app code is implemented by read-modify-write in the calling module.
- **Singleton objects**: `companyProfile` via `setItem('companyProfile', ...)`.
- **Seed**: `runSeed()` calls `clearAllSolarKeys()` first (wipes all `STORAGE_KEYS` values), then writes all collections and sets `seeded`, `currentRole` to `Super Admin`, and `solar_demoSeedVersion` to `DEMO_SEED_VERSION` (`src/lib/seedData.ts`).
- **Migrations**: `runDataMigrations()` reads `schemaVersion`; if below `CURRENT_SCHEMA` (9), runs transforms then sets `schemaVersion` to current. `ensureEmptyCollections` initializes empty arrays for keys missing from storage when migration runs (`src/lib/migrations.ts`).
- **Audit log**: `appendAudit` prepends new entry, caps at **2000** rows (`src/lib/auditLog.ts`).

## Read patterns

- `useLiveCollection<T>(key)` returns `getCollection<T>(key)` and **re-runs when** `useDataRefresh().version` changes (`src/hooks/useLiveCollection.ts`).
- `Layout` reads `companyProfile` with `getItem` keyed to data refresh version for logo/name display.

## Sync / consistency risks (inherent to design)

- **Single-tab model**: No cross-tab locking; `storage` event on `window` is only used to refresh **nav pin** state in `Layout.tsx`, not full data sync.
- **No transactions**: Concurrent writes from multiple tabs can corrupt JSON.
- **Corrupt JSON**: `getCollection` returns `[]` on parse failure; migrations wrap in `try/catch` and ignore errors.
