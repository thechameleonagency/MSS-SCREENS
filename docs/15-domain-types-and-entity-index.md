# Domain types and entity index

**Authoritative schema:** `src/types/index.ts` (single module). This section indexes **exported types and interfaces** used as **persisted** or **derived** domain shapes. For **exact field-by-field** definitions, read the source file; line numbers drift with edits.

## Storage-backed entity types (by `StorageKey`)

Each key in `STORAGE_KEYS` maps to either:

- **Array JSON:** `getCollection` / `setCollection` → element type below.
- **Singleton JSON:** `getItem` / `setItem` — **`companyProfile`** → `CompanyProfile`.

| Storage key | Primary TypeScript type(s) |
|-------------|----------------------------|
| `users` | `User` |
| `attendance` | `Attendance` |
| `tasks` | `Task` |
| `employeeExpenses` | `EmployeeExpense` |
| `agents` | `Agent` |
| `enquiries` | `Enquiry` |
| `customers` | `Customer` |
| `quotations` | `Quotation` |
| `projects` | `Project` |
| `sites` | `Site` |
| `materials` | `Material` |
| `tools` | `Tool` |
| `presets` | `Preset` |
| `suppliers` | `Supplier` |
| `purchaseBills` | `PurchaseBill` |
| `vendorPayments` | `VendorPayment` |
| `loans` | `Loan` |
| `partners` | `Partner` |
| `channelPartners` | `ChannelPartner` |
| `invoices` | `Invoice` |
| `payments` | `Payment` |
| `saleBills` | `SaleBill` |
| `companyExpenses` | `CompanyExpense` |
| `masterData` | `MasterData` |
| `companyProfile` | `CompanyProfile` |
| `materialTransfers` | `MaterialTransfer` |
| `outsourceWork` | `OutsourceWork` |
| `payrollRecords` | `PayrollRecord` |
| `partnerSettlements` | `PartnerSettlement` |
| `channelFees` | `ChannelPartnerFee` |
| `notifications` | `AppNotification` |
| `incomeRecords` | `IncomeRecord` |
| `approvalRequests` | `ApprovalRequest` |
| `auditLogs` | `AuditLogEntry` |
| `companyHolidays` | `CompanyHoliday` |
| `toolMovements` | `ToolMovement` |
| `materialReturns` | `MaterialReturn` |
| `vouchers` | `Voucher` |
| `ledgerLines` | `LedgerLine` |
| `introAgentEconomics` | `AgentIntroProjectEconomics` |
| `seeded` | string flag (`'1'`) — not a domain type |
| `currentRole` | string matching `UserRole` |
| `schemaVersion` | numeric string |

## Supporting exported types (selection)

Also defined in `src/types/index.ts`: `UserRole`, `ExpenseTag`, `UserOtherDocument`, `SalaryLedgerAdjustment`, `AgentIntroProjectEconomics`, enquiry/quotation/project enums, `SolarProjectKind`, billing enums (`BillingDirection`, `BillingDocumentKind`, …), `ProjectProgressStep`, `ProjectBlockage`, site document types, `GstBreakup`, `InvoiceLineItem`, `InvoiceServiceLine`, `ApprovalKind`, `VoucherType`, `MasterDataType`, `StorageKey`, etc.

## Non-persisted auxiliary types

Examples: `PreviewCompany` in `DocumentPreviewFrame.tsx`, `DrillLink` in `KpiDrilldownModal.tsx`, `SummaryItem` in `SummaryCards.tsx`, `CoaAccount` in `chartOfAccounts.ts` — used for UI or static COA, not always written to `STORAGE_KEYS`.

## Related documentation

- **Keys and side keys:** `docs/08-local-storage-design.md`
- **Lib index:** `docs/13-library-modules-index.md`
- **Backend projection:** `docs/11-backend-requirements.md`
