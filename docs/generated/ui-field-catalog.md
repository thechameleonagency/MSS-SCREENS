# Generated UI field catalog

**Do not edit by hand.** Regenerate with `npm run docs:ui-catalog`.

- **Generated:** 2026-04-12T06:09:29.107Z
- **Source:** `src/**/*.tsx` (opening tags: `<input>`, `<select>`, `<textarea>`)
- **Total tags:** 443
- **Files with matches:** 20

## Notes

- Attributes shown are **string literals** only where regex could read them; `value={state}` and similar appear as `(no static …)`.
- **Controlled** React inputs often have no `name` — see the **preview** column.
- Tags spanning unusual nested braces may be truncated incorrectly; re-check the source line if needed.

## Catalog (by file)

### `src/components/GlobalSearch.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 123 | `input` | type="search" · placeholder="Search projects, customers, invoices…" · aria-label="Global search" | `<input type="search" placeholder="Search projects, customers, invoices…" aria-label="Global search" aria-expanded={open} className="h-10 w-full max-w-none rounded-full border border-input bg-backgr…` |

### `src/components/Layout.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 428 | `select` | (no static id/name/type/placeholder) | `<select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="max-w-[7rem] cursor-pointer rounded-md border-0 bg-transparent text-xs font-medium text-foreground focus:ring-0…` |

### `src/components/TablePaginationBar.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 39 | `select` | aria-label="Rows per page" | `<select className="select-shell h-9 w-[4.25rem] shrink-0 py-1 text-xs" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value) \|\| TABLE_DEFAULT_PAGE_SIZE)} aria-label="Rows per pa…` |

### `src/components/UnifiedExpenseModal.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 214 | `input` | type="number" · min=0 · required | `<input className="input-shell mt-1" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />` |
| 218 | `input` | type="date" | `<input className="input-shell mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />` |
| 223 | `input` | type="month" | `<input className="input-shell mt-1" type="month" value={monthRef} onChange={(e) => setMonthRef(e.target.value)} />` |
| 229 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>` |
| 242 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>` |
| 255 | `input` | placeholder="partner id" | `<input className="input-shell mt-1" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} placeholder="partner id" />` |
| 261 | `input` | type="number" · min=0 | `<input className="input-shell mt-1" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />` |
| 266 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={mode} onChange={(e) => setMode(e.target.value)}>` |
| 276 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />` |
| 289 | `input` | type="radio" · name="payer" | `<input type="radio" name="payer" checked={payer === p} onChange={() => setPayer(p)} />` |

### `src/components/UnifiedIncomeModal.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 234 | `input` | type="number" | `<input className="input-shell mt-1" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />` |
| 238 | `input` | type="date" | `<input className="input-shell mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />` |
| 242 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>` |
| 252 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={reference} onChange={(e) => setReference(e.target.value)} />` |
| 257 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>` |
| 270 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>` |
| 283 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} />` |
| 289 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={personName} onChange={(e) => setPersonName(e.target.value)} />` |
| 295 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />` |
| 301 | `input` | type="date" | `<input className="input-shell mt-1" type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />` |
| 307 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={bankName} onChange={(e) => setBankName(e.target.value)} />` |
| 313 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={loanAccount} onChange={(e) => setLoanAccount(e.target.value)} />` |
| 319 | `input` | type="number" | `<input className="input-shell mt-1" type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />` |
| 325 | `input` | type="number" | `<input className="input-shell mt-1" type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} />` |
| 330 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />` |

### `src/pages/finance/Finance.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 239 | `select` | required | `<select className="mt-1 w-full rounded border border-input bg-background px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)} required >` |
| 255 | `input` | placeholder="For CGST/SGST vs IGST" | `<input className="mt-1 w-full rounded border px-3 py-2" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} placeholder="For CGST/SGST vs IGST" />` |
| 264 | `input` | placeholder="State / code" | `<input className="mt-1 w-full rounded border px-3 py-2" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="State / code" />` |
| 272 | `input` | type="checkbox" | `<input type="checkbox" checked={forceIgst} onChange={(e) => setForceIgst(e.target.checked)} />` |
| 293 | `input` | (no static id/name/type/placeholder) | `<input className="w-full min-w-[6rem] rounded border px-2 py-1" value={li.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />` |
| 300 | `input` | (no static id/name/type/placeholder) | `<input className="w-20 rounded border px-2 py-1" value={li.hsn ?? ''} onChange={(e) => updateLine(idx, { hsn: e.target.value })} />` |
| 307 | `input` | type="number" · min=0 | `<input type="number" min={0} className="w-16 rounded border px-2 py-1" value={li.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) \|\| 0 })} />` |
| 316 | `input` | type="number" · min=0 | `<input type="number" min={0} className="w-24 rounded border px-2 py-1" value={li.rate} onChange={(e) => updateLine(idx, { rate: Number(e.target.value) \|\| 0 })} />` |
| 325 | `input` | type="number" · min=0 | `<input type="number" min={0} className="w-14 rounded border px-2 py-1" value={li.gstRate} onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) \|\| 0 })} />` |
| 557 | `input` | placeholder="Amount" | `<input className="w-full rounded border px-3 py-2" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />` |
| 558 | `select` | (no static id/name/type/placeholder) | `<select className="w-full rounded border px-3 py-2" value={mode} onChange={(e) => setMode(e.target.value as Payment['mode'])}>` |
| 565 | `input` | type="date" | `<input type="date" className="w-full rounded border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />` |
| 567 | `input` | type="checkbox" | `<input type="checkbox" checked={payAsAdvance} onChange={(e) => setPayAsAdvance(e.target.checked)} />` |
| 728 | `input` | placeholder="Amount" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={ramt} onChange={(e) => setRamt(e.target.value)} />` |
| 729 | `input` | type="date" | `<input type="date" className="mb-2 w-full rounded border px-3 py-2" value={rdate} onChange={(e) => setRdate(e.target.value)} />` |
| 827 | `input` | name="bn" · placeholder="Bill no." · required | `<input name="bn" required placeholder="Bill no." className="rounded border px-3 py-2" />` |
| 828 | `input` | type="date" · name="dt" · required | `<input name="dt" type="date" required className="rounded border px-3 py-2" />` |
| 829 | `select` | name="mid" | `<select name="mid" className="sm:col-span-2 rounded border px-3 py-2">` |
| 836 | `input` | type="number" · name="qty" · placeholder="Qty" | `<input name="qty" type="number" placeholder="Qty" className="rounded border px-3 py-2" defaultValue={1} />` |
| 837 | `input` | type="number" · name="rate" · placeholder="Rate" | `<input name="rate" type="number" placeholder="Rate" className="rounded border px-3 py-2" />` |
| 838 | `input` | name="hsn" · placeholder="HSN (optional)" | `<input name="hsn" placeholder="HSN (optional)" className="rounded border px-3 py-2" />` |
| 839 | `input` | type="number" · name="gst" · placeholder="GST % (optional)" | `<input name="gst" type="number" placeholder="GST % (optional)" className="rounded border px-3 py-2" />` |
| 840 | `input` | type="number" · name="total" · placeholder="Bill total" · required | `<input name="total" type="number" placeholder="Bill total" className="sm:col-span-2 rounded border px-3 py-2" required />` |
| 1022 | `input` | placeholder="Name, code, or id" | `<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, code, or id" className="rounded-lg border border-input bg-background px-3 py-2" />` |
| 1125 | `input` | name="cat" · placeholder="Category" · required | `<input name="cat" required placeholder="Category" className="rounded border px-3 py-2" />` |
| 1126 | `input` | name="sub" · placeholder="Sub category" | `<input name="sub" placeholder="Sub category" className="rounded border px-3 py-2" />` |
| 1127 | `input` | type="number" · name="amt" · placeholder="Amount" · required | `<input name="amt" type="number" required placeholder="Amount" className="rounded border px-3 py-2" />` |
| 1128 | `input` | type="date" · name="dt" · required | `<input name="dt" type="date" required className="rounded border px-3 py-2" />` |
| 1129 | `input` | name="pb" · placeholder="Paid by" | `<input name="pb" placeholder="Paid by" className="rounded border px-3 py-2" />` |
| 1130 | `input` | name="mode" · placeholder="Mode" | `<input name="mode" placeholder="Mode" className="rounded border px-3 py-2" />` |
| 1131 | `textarea` | name="notes" · placeholder="Notes" | `<textarea name="notes" placeholder="Notes" className="sm:col-span-2 rounded border px-3 py-2" rows={2} />` |

### `src/pages/finance/FinanceDetails.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 117 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>` |
| 128 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} />` |
| 132 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />` |
| 135 | `input` | type="checkbox" | `<input type="checkbox" checked={forceIgst} onChange={(e) => setForceIgst(e.target.checked)} />` |
| 152 | `input` | (no static id/name/type/placeholder) | `<input className="w-full rounded border px-2 py-1" value={li.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />` |
| 159 | `input` | type="number" | `<input type="number" className="w-16 rounded border px-2 py-1" value={li.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) \|\| 0 })} />` |
| 167 | `input` | type="number" | `<input type="number" className="w-24 rounded border px-2 py-1" value={li.rate} onChange={(e) => updateLine(idx, { rate: Number(e.target.value) \|\| 0 })} />` |
| 175 | `input` | type="number" | `<input type="number" className="w-14 rounded border px-2 py-1" value={li.gstRate} onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) \|\| 0 })} />` |
| 347 | `input` | placeholder="Source / lender" · required | `<input required placeholder="Source / lender" className="w-full rounded border px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)} />` |
| 348 | `select` | (no static id/name/type/placeholder) | `<select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as Loan['type'])}>` |
| 353 | `input` | placeholder="Principal" | `<input placeholder="Principal" className="w-full rounded border px-3 py-2" value={principal} onChange={(e) => setPrincipal(e.target.value)} />` |
| 354 | `input` | placeholder="Rate % (optional)" | `<input placeholder="Rate % (optional)" className="w-full rounded border px-3 py-2" value={rate} onChange={(e) => setRate(e.target.value)} />` |
| 355 | `input` | placeholder="Payment info" | `<input placeholder="Payment info" className="w-full rounded border px-3 py-2" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} />` |
| 358 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>` |
| 499 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />` |
| 503 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} />` |
| 507 | `input` | type="email" | `<input type="email" className="input-shell mt-1 w-full" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />` |
| 511 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem] w-full" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />` |
| 515 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />` |
| 544 | `select` | (no static id/name/type/placeholder) | `<select className="mb-2 w-full rounded border px-3 py-2" value={billId} onChange={(e) => setBillId(e.target.value)}>` |
| 552 | `input` | placeholder="Amount" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={pamt} onChange={(e) => setPamt(e.target.value)} />` |
| 553 | `input` | type="date" | `<input type="date" className="mb-2 w-full rounded border px-3 py-2" value={pdate} onChange={(e) => setPdate(e.target.value)} />` |
| 776 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />` |
| 780 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} />` |
| 784 | `input` | type="number" · min=0 · max=100 · step=0.5 | `<input type="number" min={0} max={100} step={0.5} className="input-shell mt-1 w-full" value={editForm.profitSharePercent} onChange={(e) => setEditForm({ ...editForm, profitSharePercent: e.target.va…` |
| 800 | `select` | (no static id/name/type/placeholder) | `<select className="mb-2 w-full rounded border px-3 py-2" value={projPick} onChange={(e) => setProjPick(e.target.value)}>` |
| 808 | `input` | placeholder="Amount ₹" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount ₹" value={setAmt} onChange={(e) => setSetAmt(e.target.value)} />` |
| 809 | `textarea` | placeholder="Notes" | `<textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Notes" value={setNotes} onChange={(e) => setSetNotes(e.target.value)} />` |
| 824 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mb-2 w-full" value={projPick} onChange={(e) => setProjPick(e.target.value)}>` |
| 834 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={laborDesc} onChange={(e) => setLaborDesc(e.target.value)} />` |
| 838 | `input` | type="number" · min=0 · step=0.5 | `<input className="input-shell mt-1 w-full" type="number" min={0} step={0.5} value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />` |
| 842 | `input` | type="number" · min=0 · step=1 | `<input className="input-shell mt-1 w-full" type="number" min={0} step={1} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />` |
| 968 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />` |
| 972 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.vendorCode} onChange={(e) => setEditForm({ ...editForm, vendorCode: e.target.value })} />` |
| 976 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} />` |
| 980 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={editForm.feeStructure} onChange={(e) => setEditForm({ ...editForm, feeStructure: e.target.value as ChannelPartner['feeStructure'] })} >` |
| 992 | `input` | type="number" · min=0 · step=1 | `<input type="number" min={0} step={1} className="input-shell mt-1 w-full" value={editForm.feeAmount} onChange={(e) => setEditForm({ ...editForm, feeAmount: e.target.value })} />` |
| 1025 | `select` | (no static id/name/type/placeholder) | `<select className="mb-2 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>` |
| 1033 | `input` | placeholder="Amount" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />` |
| 1034 | `textarea` | placeholder="Notes" | `<textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />` |
| 1090 | `input` | placeholder="Name" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />` |
| 1091 | `input` | placeholder="Contact" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />` |
| 1092 | `input` | placeholder="Profit share %" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Profit share %" value={pct} onChange={(e) => setPct(e.target.value)} />` |
| 1153 | `input` | placeholder="Name" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />` |
| 1154 | `input` | placeholder="Vendor code" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Vendor code" value={code} onChange={(e) => setCode(e.target.value)} />` |
| 1155 | `input` | placeholder="Contact" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />` |
| 1156 | `select` | (no static id/name/type/placeholder) | `<select className="mb-2 w-full rounded border px-3 py-2" value={feeStructure} onChange={(e) => setFeeStructure(e.target.value as ChannelPartner['feeStructure'])}>` |
| 1161 | `input` | placeholder="Fee amount" | `<input className="mb-2 w-full rounded border px-3 py-2" placeholder="Fee amount" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />` |

### `src/pages/finance/FinanceTransactionsPage.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 81 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 block min-w-[10rem]" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} >` |
| 93 | `input` | placeholder="Category, date, project id…" | `<input className="input-shell mt-1 w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Category, date, project id…" />` |

### `src/pages/hr/EmployeeForm.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 212 | `input` | type="file" | `<input type="file" accept="image/*,.pdf" className="max-w-[12rem] text-xs" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />` |
| 237 | `input` | placeholder="Enter full name" · required | `<input required className="input-shell mt-1 w-full" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} />` |
| 247 | `input` | placeholder="+91 XXXXX XXXXX" · required | `<input required className="input-shell mt-1 w-full" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />` |
| 257 | `input` | placeholder="Enter alternate number" | `<input className="input-shell mt-1 w-full" placeholder="Enter alternate number" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} />` |
| 266 | `input` | type="email" · required | `<input required type="email" className="input-shell mt-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />` |
| 276 | `input` | placeholder="Enter current address" | `<input className="input-shell mt-1 w-full" placeholder="Enter current address" value={address} onChange={(e) => setAddress(e.target.value)} />` |
| 285 | `input` | placeholder="XXXX XXXX XXXX" | `<input className="input-shell mt-1 w-full" placeholder="XXXX XXXX XXXX" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} />` |
| 294 | `input` | type="date" | `<input type="date" className="input-shell mt-1 w-full" value={dob} onChange={(e) => setDob(e.target.value)} />` |
| 304 | `input` | type="number" · placeholder="₹ Enter amount" · min=0 · required | `<input type="number" min={0} required className="input-shell mt-1 w-full" placeholder="₹ Enter amount" value={salary} onChange={(e) => setSalary(e.target.value)} />` |
| 316 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>` |
| 329 | `input` | placeholder="e.g. Senior installer" | `<input className="input-shell mt-1 w-full" placeholder="e.g. Senior installer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />` |
| 338 | `input` | type="date" · required | `<input type="date" required className="input-shell mt-1 w-full" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />` |
| 348 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value as 'Active' \| 'Inactive')} >` |
| 370 | `input` | placeholder="e.g. priya.sharma" · required | `<input required autoComplete="username" className="input-shell mt-1 w-full" placeholder="e.g. priya.sharma" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />` |
| 383 | `input` | type="password" · required | `<input type="password" autoComplete={mode === 'create' ? 'new-password' : 'new-password'} className="input-shell mt-1 w-full" placeholder={mode === 'edit' ? 'Leave blank to keep existing' : 'Min. 4…` |
| 428 | `input` | type="file" | `<input ref={otherInputRef} type="file" multiple className="mt-2 text-xs" onChange={(e) => void onOtherFiles(e.target.files)} />` |

### `src/pages/hr/HR.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 285 | `input` | placeholder="Name, email, phone…" · aria-label="Search employees" | `<input className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink" placeholder="Name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search employees" />` |
| 294 | `select` | aria-label="Filter by role" | `<select className="select-shell h-10 shrink-0" style={{ width: EMP_ROLE_FILTER_W }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role" >` |
| 311 | `select` | aria-label="Filter by expense tag" | `<select className="select-shell h-10 min-w-[10rem] shrink-0" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="Filter by expense tag" >` |
| 820 | `input` | type="date" | `<input type="date" className="input-shell mt-1 block h-10" value={hubDateFrom} onChange={(e) => setHubDateFrom(e.target.value)} />` |
| 829 | `input` | type="date" | `<input type="date" className="input-shell mt-1 block h-10" value={hubDateTo} onChange={(e) => setHubDateTo(e.target.value)} />` |
| 833 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 block h-10 min-w-[10rem]" value={expenseCatFilter} onChange={(e) => setExpenseCatFilter(e.target.value)} >` |
| 1403 | `input` | type="checkbox" | `<input type="checkbox" className="rounded border-input" checked={includeCompletedTicketSites} onChange={(e) => setIncludeCompletedTicketSites(e.target.checked)} />` |
| 1414 | `input` | type="date" | `<input type="date" className="input-shell mt-1 block h-10 max-w-[11rem]" value={date} onChange={(e) => setDate(e.target.value)} />` |
| 1569 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full max-w-[11rem] text-sm" disabled={readOnly} value={state.status} onChange={(e) => setStatus(u.id, e.target.value as Attendance['status'])} >` |
| 1636 | `input` | type="checkbox" | `<input type="checkbox" className="rounded border-input" checked={on} onChange={() => toggleMarkModalSite(s.id)} />` |
| 1739 | `input` | placeholder="e.g. Diwali break" · required | `<input className="input-shell mt-1 w-full" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder="e.g. Diwali break" required />` |
| 1749 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[8rem] w-full font-mono text-xs" value={batchDatesText} onChange={(e) => setBatchDatesText(e.target.value)} placeholder={'One date per line (YYYY-MM-DD),…` |
| 1896 | `input` | type="month" | `<input type="month" className="input-shell mt-1 max-w-xs" value={ym} onChange={(e) => setYm(e.target.value)} />` |
| 2114 | `select` | id="payroll-month-select" | `<select id="payroll-month-select" value={ym} onChange={(e) => setYm(e.target.value)} className={cn( 'h-9 w-full cursor-pointer appearance-none border-0 border-b-2 border-primary bg-transparent py-1…` |
| 2168 | `input` | type="checkbox" | `<input type="checkbox" className="rounded border-input" checked={releaseSelected.has(u.id)} disabled={paid} onChange={() => toggleReleaseUser(u.id)} />` |
| 2177 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell h-9 w-28 text-sm" value={releaseAmounts[u.id] ?? ''} onChange={(e) => setReleaseAmounts((a) => ({ ...a, [u.id]: e.target.value }))} disabled={pai…` |
| 2457 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSiteId(''); }} >` |
| 2483 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={siteId} onChange={(e) => setSiteId(e.target.value)}>` |
| 2494 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={kind} onChange={(e) => setKind(e.target.value as 'Task' \| 'Ticket')}>` |
| 2502 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={taskType} onChange={(e) => setTaskType(e.target.value as NonNullable<Task['taskType']>)} >` |
| 2515 | `input` | required | `<input className="input-shell mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />` |
| 2519 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 w-full" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />` |
| 2523 | `input` | type="date" | `<input type="date" className="input-shell mt-1 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />` |
| 2527 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} >` |
| 2543 | `input` | type="checkbox" | `<input type="checkbox" checked={assignees.includes(u.id)} onChange={() => toggleAssignee(u.id)} />` |
| 2591 | `input` | placeholder="Title or description…" · aria-label="Search tasks" | `<input className="input-shell h-10 w-full" placeholder="Title or description…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tasks" />` |
| 2601 | `select` | aria-label="Filter by status" | `<select className="select-shell h-10 w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" >` |
| 2617 | `select` | aria-label="Filter by project" | `<select className="select-shell h-10 w-full" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} aria-label="Filter by project" >` |
| 2633 | `select` | aria-label="Filter by assignee" | `<select className="select-shell h-10 w-full min-w-[10rem]" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} aria-label="Filter by assignee" >` |
| 2651 | `select` | aria-label="Filter by lifecycle" | `<select className="select-shell h-10 w-full" value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value as typeof lifecycleFilter)} aria-label="Filter by lifecycle" >` |
| 2939 | `input` | type="checkbox" | `<input type="checkbox" checked={task.assignedTo.includes(u.id)} onChange={() => { const next = task.assignedTo.includes(u.id) ? task.assignedTo.filter((x) => x !== u.id) : [...task.assignedTo, u.id…` |
| 2975 | `input` | placeholder="Add a comment…" | `<input className="input-shell min-w-0 flex-1" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />` |

### `src/pages/inventory/Inventory.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 108 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-2 w-full" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>` |
| 174 | `input` | required | `<input required className="mt-1 w-full rounded border px-3 py-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />` |
| 178 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Material['category'] })} >` |
| 192 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={f.hsn} onChange={(e) => setF({ ...f, hsn: e.target.value })} />` |
| 196 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={f.purchaseUnit} onChange={(e) => setF({ ...f, purchaseUnit: e.target.value as Material['purchaseUnit'] })}>` |
| 206 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={f.issueUnit} onChange={(e) => setF({ ...f, issueUnit: e.target.value as Material['issueUnit'] })}>` |
| 217 | `input` | placeholder="e.g. grams per foot" | `<input className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. grams per foot" value={f.conversionFactor} onChange={(e) => setF({ ...f, conversionFactor: e.target.value })} />` |
| 222 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={f.purchaseRate} onChange={(e) => setF({ ...f, purchaseRate: e.target.value })} />` |
| 226 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={f.saleRateRetail} onChange={(e) => setF({ ...f, saleRateRetail: e.target.value })} />` |
| 230 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={f.currentStock} onChange={(e) => setF({ ...f, currentStock: e.target.value })} />` |
| 234 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={f.minStock} onChange={(e) => setF({ ...f, minStock: e.target.value })} />` |
| 467 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>` |
| 477 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={sid} onChange={(e) => setSid(e.target.value)}>` |
| 488 | `input` | type="number" · min=0 | `<input type="number" min={0} className="mt-1 w-full rounded border px-3 py-2" value={issueQty} onChange={(e) => setIssueQty(e.target.value)} />` |
| 506 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>` |
| 516 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={sid} onChange={(e) => setSid(e.target.value)}>` |
| 527 | `input` | type="number" · min=0 | `<input type="number" min={0} className="mt-1 w-full rounded border px-3 py-2" value={retQty} onChange={(e) => setRetQty(e.target.value)} />` |
| 537 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={retNotes} onChange={(e) => setRetNotes(e.target.value)} />` |
| 550 | `input` | type="number" · min=0 | `<input type="number" min={0} className="mt-1 w-full rounded border px-3 py-2" value={scrapQty} onChange={(e) => setScrapQty(e.target.value)} />` |
| 560 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={scrapNotes} onChange={(e) => setScrapNotes(e.target.value)} />` |
| 773 | `select` | (no static id/name/type/placeholder) | `<select value={t.condition} onChange={(e) => setCondition(t.id, e.target.value as Tool['condition'])} className="rounded border px-2 py-1 text-xs">` |
| 782 | `select` | (no static id/name/type/placeholder) | `<select className="rounded border px-2 py-1 text-xs" value={t.assignedTo ?? ''} onChange={(e) => { const list = getCollection<Tool>('tools'); setCollection( 'tools', list.map((x) => x.id === t.id ?…` |
| 866 | `input` | placeholder="Name" · required | `<input required className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />` |
| 869 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={newCat} onChange={(e) => setNewCat(e.target.value)}>` |
| 886 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={issueEmp} onChange={(e) => setIssueEmp(e.target.value)}>` |
| 896 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={issueSite} onChange={(e) => setIssueSite(e.target.value)}>` |
| 1076 | `input` | placeholder="Name" · required | `<input required placeholder="Name" className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />` |
| 1077 | `textarea` | placeholder="Description" | `<textarea placeholder="Description" className="w-full rounded border px-3 py-2" value={desc} onChange={(e) => setDesc(e.target.value)} />` |
| 1078 | `select` | (no static id/name/type/placeholder) | `<select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as Preset['type'])}>` |
| 1087 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded border px-3 py-2" value={capCat} onChange={(e) => setCapCat(e.target.value as Preset['capacityCategory'])}>` |
| 1097 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={capKw} onChange={(e) => setCapKw(e.target.value)} />` |
| 1101 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={panelBrand} onChange={(e) => setPanelBrand(e.target.value)} />` |
| 1105 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={inverterBrand} onChange={(e) => setInverterBrand(e.target.value)} />` |
| 1110 | `select` | (no static id/name/type/placeholder) | `<select className="flex-1 rounded border px-3 py-2" value={matId} onChange={(e) => setMatId(e.target.value)}>` |
| 1118 | `input` | type="number" | `<input type="number" className="w-24 rounded border px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />` |

### `src/pages/operations/ActiveSitesPage.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 106 | `input` | type="checkbox" | `<input type="checkbox" className="rounded border-input" checked={includeCompletedWithTickets} onChange={(e) => setIncludeCompletedWithTickets(e.target.checked)} />` |
| 116 | `input` | placeholder="Project or client" | `<input className="input-shell mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Project or client" />` |
| 120 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={filterKey} onChange={(e) => setFilterKey(e.target.value)}>` |
| 131 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={filterVal} onChange={(e) => setFilterVal(e.target.value)} disabled={!filterKey} />` |
| 185 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell max-w-[9.5rem] shrink-0 text-xs" value={p.status} onChange={(e) => setProjectStatus(p.id, e.target.value as Project['status'])} >` |

### `src/pages/projects/Projects.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 183 | `input` | placeholder="Photo URL (https://…)" | `<input className="input-shell min-w-[12rem] flex-1 text-sm" placeholder="Photo URL (https://…)" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />` |
| 321 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell max-w-[9rem] shrink-0 text-xs" value={p.status} onChange={(e) => patchProjectStatus(p.id, e.target.value as Project['status'])} >` |
| 466 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 min-w-[11rem]" value={statusScope} onChange={(e) => setStatusScope(e.target.value as typeof statusScope)} >` |
| 554 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={ddCustomer} onChange={(e) => setDdCustomer(e.target.value)} >` |
| 569 | `input` | placeholder="Defaults to Customer + kW" | `<input className="input-shell mt-1 w-full" value={ddName} onChange={(e) => setDdName(e.target.value)} placeholder="Defaults to Customer + kW" />` |
| 578 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={ddCap} onChange={(e) => setDdCap(e.target.value)} />` |
| 582 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={ddCat} onChange={(e) => setDdCat(e.target.value as Project['category'])}>` |
| 592 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={ddType} onChange={(e) => { const t = e.target.value as Project['type']; setDdType(t); if (t === 'Partner (Profit Only)' \|\| t === 'Partner with Co…` |
| 617 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={ddPartnerId} onChange={(e) => { const v = e.target.value; setDdPartnerId(v); setDdCoPartnerIds((prev) => prev.filter((id) => id !== v)); }} >` |
| 642 | `input` | type="checkbox" | `<input type="checkbox" checked={ddCoPartnerIds.includes(p.id)} onChange={() => setDdCoPartnerIds((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id] ) } />` |
| 662 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={ddChannelId} onChange={(e) => setDdChannelId(e.target.value)}>` |
| 674 | `input` | placeholder="Defaults to customer billing address" | `<input className="input-shell mt-1 w-full" value={ddAddr} onChange={(e) => setDdAddr(e.target.value)} placeholder="Defaults to customer billing address" />` |
| 729 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={pid} onChange={(e) => setPid(e.target.value)}>` |
| 1164 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 block max-w-xs rounded border px-2 py-1.5 text-sm" value={newLedgerMatId} onChange={(e) => setNewLedgerMatId(e.target.value)} >` |
| 1238 | `input` | (no static id/name/type/placeholder) | `<input className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20" value={d.opening} onChange={(e) => setD('opening', e.target.value)} />` |
| 1246 | `input` | (no static id/name/type/placeholder) | `<input className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20" value={d.returned} onChange={(e) => setD('returned', e.target.value)} />` |
| 1253 | `input` | (no static id/name/type/placeholder) | `<input className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20" value={d.scrap} onChange={(e) => setD('scrap', e.target.value)} />` |
| 1260 | `input` | (no static id/name/type/placeholder) | `<input className="w-16 rounded border px-1 py-1 tabular-nums sm:w-20" value={d.consumed} onChange={(e) => setD('consumed', e.target.value)} />` |
| 1287 | `select` | (no static id/name/type/placeholder) | `<select className="rounded border px-2 py-1.5 text-sm" value={docKind} onChange={(e) => setDocKind(e.target.value as SiteDocumentKind)} >` |
| 1298 | `input` | placeholder="Title" | `<input className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm" placeholder="Title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />` |
| 1304 | `input` | placeholder="URL (optional)" | `<input className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm" placeholder="URL (optional)" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />` |
| 1310 | `input` | placeholder="Notes" | `<input className="min-w-[8rem] flex-1 rounded border px-2 py-1.5 text-sm" placeholder="Notes" value={docNotes} onChange={(e) => setDocNotes(e.target.value)} />` |
| 1347 | `input` | placeholder="https://…" | `<input className="min-w-[12rem] flex-1 rounded border px-3 py-2 text-sm" placeholder="https://…" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />` |
| 1377 | `input` | placeholder="Describe blockage / issue" | `<input className="min-w-[12rem] flex-1 rounded border px-3 py-2 text-sm" placeholder="Describe blockage / issue" value={blkNew} onChange={(e) => setBlkNew(e.target.value)} />` |
| 1407 | `input` | type="checkbox" | `<input type="checkbox" checked={it.completed} onChange={() => toggleItem(idx)} />` |
| 1443 | `input` | type="checkbox" | `<input type="checkbox" checked={it.done} onChange={() => toggleWorkStatusItem(a.id, it.id)} />` |
| 1457 | `select` | (no static id/name/type/placeholder) | `<select className="rounded border px-2 py-1" value={it.approvalStatus ?? 'none'} onChange={(e) => patchWorkItem(a.id, it.id, { approvalStatus: e.target.value as SiteWorkStatusItem['approvalStatus']…` |
| 1472 | `input` | placeholder="Verifier name" | `<input className="min-w-[6rem] flex-1 rounded border px-2 py-1" placeholder="Verifier name" value={it.verifierName ?? ''} onChange={(e) => patchWorkItem(a.id, it.id, { verifierName: e.target.value …` |
| 1478 | `input` | placeholder="Remarks" | `<input className="min-w-[10rem] flex-[2] rounded border px-2 py-1" placeholder="Remarks" value={it.verificationRemarks ?? ''} onChange={(e) => patchWorkItem(a.id, it.id, { verificationRemarks: e.ta…` |
| 2164 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 block min-w-[10rem]" value={project.status} disabled={readOnly} onChange={(e) => patchProject({ status: e.target.value as Project['status'] })} >` |
| 2198 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" disabled={readOnly} value={project.solarKind ?? inferSolarKind(project)} onChange={(e) => patchProject({ solarKind: e.target.value as SolarProjectKind }…` |
| 2213 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" disabled={readOnly} value={project.vendorId ?? ''} onChange={(e) => patchProject({ vendorId: e.target.value \|\| undefined })} >` |
| 2229 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1 w-full" disabled={readOnly} value={project.internalCostEstimateInr ?? ''} onChange={(e) => patchProject({ internalCostEstimateInr: e.target.…` |
| 2244 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1 w-full" disabled={readOnly} value={project.fixedBackendPriceInr ?? ''} onChange={(e) => patchProject({ fixedBackendPriceInr: e.target.value …` |
| 2259 | `input` | type="checkbox" | `<input type="checkbox" className="rounded border-input" disabled={readOnly} checked={!!project.createdWithoutQuotation} onChange={(e) => patchProject({ createdWithoutQuotation: e.target.checked })} />` |
| 2271 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" disabled={readOnly} value={project.partnerEpicVendorOwnership ?? ''} onChange={(e) => patchProject({ partnerEpicVendorOwnership: e.target.value === '' ?…` |
| 2293 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" disabled={readOnly} value={project.fixedEpicVendor ?? ''} onChange={(e) => patchProject({ fixedEpicVendor: e.target.value === '' ? undefined : (e.target…` |
| 2424 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={project.partnerId ?? ''} onChange={(e) => setPrimaryPartnerId(e.target.value)} >` |
| 2448 | `input` | type="checkbox" | `<input type="checkbox" checked={(project.coPartnerIds ?? []).includes(p.id)} onChange={() => toggleCoPartner(p.id)} />` |
| 2474 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={project.channelPartnerId ?? ''} onChange={(e) => setChannelPartnerOnProject(e.target.value)} >` |
| 2538 | `input` | type="number" | `<input type="number" className="w-28 rounded border px-2 py-1 tabular-nums" value={li.amountInr} onChange={(e) => updateLoanInstallmentRow(li.id, { amountInr: Number(e.target.value) \|\| 0 }) } />` |
| 2552 | `input` | type="date" | `<input type="date" className="rounded border px-2 py-1" value={li.dueDate ?? ''} onChange={(e) => updateLoanInstallmentRow(li.id, { dueDate: e.target.value \|\| undefined })} />` |
| 2564 | `input` | type="date" | `<input type="date" className="rounded border px-2 py-1" value={li.receivedDate ?? ''} onChange={(e) => updateLoanInstallmentRow(li.id, { receivedDate: e.target.value \|\| undefined }) } />` |
| 2578 | `input` | (no static id/name/type/placeholder) | `<input className="w-full min-w-[6rem] rounded border px-2 py-1" value={li.receiptRef ?? ''} onChange={(e) => updateLoanInstallmentRow(li.id, { receiptRef: e.target.value \|\| undefined }) } />` |
| 2784 | `textarea` | placeholder="Step notes…" | `<textarea className="input-shell w-full text-sm" rows={2} placeholder="Step notes…" value={notesDraft[si] !== undefined ? notesDraft[si]! : (s.notes ?? '')} onChange={(e) => setNotesDraft({ ...note…` |
| 3268 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={blk.title} onChange={(e) => setBlk({ ...blk, title: e.target.value })} />` |
| 3276 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem] w-full" rows={2} value={blk.description} onChange={(e) => setBlk({ ...blk, description: e.target.value })} />` |
| 3285 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={blk.reason} onChange={(e) => setBlk({ ...blk, reason: e.target.value })} />` |
| 3289 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={blk.howToSolve} onChange={(e) => setBlk({ ...blk, howToSolve: e.target.value })} />` |
| 3297 | `input` | type="date" | `<input type="date" className="input-shell mt-1 w-full" value={blk.resolveByDate} onChange={(e) => setBlk({ ...blk, resolveByDate: e.target.value })} />` |
| 3306 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={blk.projectStage} onChange={(e) => setBlk({ ...blk, projectStage: e.target.value })} />` |
| 3314 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={blk.timelineStage} onChange={(e) => setBlk({ ...blk, timelineStage: e.target.value })} />` |
| 3320 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full sm:col-span-2" value={blk.assignedTo} onChange={(e) => setBlk({ ...blk, assignedTo: e.target.value })} >` |
| 3334 | `input` | type="date" | `<input type="date" className="input-shell mt-1 w-full" value={blk.dueDate} onChange={(e) => setBlk({ ...blk, dueDate: e.target.value })} />` |
| 3360 | `textarea` | placeholder="Resolution notes (optional)" | `<textarea className="input-shell mb-3 min-h-[4rem] w-full text-sm" placeholder="Resolution notes (optional)" value={resolutionNotesDraft} onChange={(e) => setResolutionNotesDraft(e.target.value)} />` |
| 3400 | `input` | placeholder="Type (JCB, Crane, …)" | `<input className="input-shell w-full" placeholder="Type (JCB, Crane, …)" value={outForm.type} onChange={(e) => setOutForm({ ...outForm, type: e.target.value })} />` |
| 3406 | `input` | type="number" · placeholder="Quantity" | `<input type="number" className="input-shell w-full" placeholder="Quantity" value={outForm.quantity} onChange={(e) => setOutForm({ ...outForm, quantity: e.target.value })} />` |
| 3413 | `input` | type="number" · placeholder="Cost" | `<input type="number" className="input-shell w-full" placeholder="Cost" value={outForm.cost} onChange={(e) => setOutForm({ ...outForm, cost: e.target.value })} />` |
| 3420 | `input` | type="date" | `<input type="date" className="input-shell w-full" value={outForm.date} onChange={(e) => setOutForm({ ...outForm, date: e.target.value })} />` |
| 3426 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell min-h-[4rem] w-full" rows={2} value={outForm.notes} onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })} />` |
| 3440 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell sm:col-span-2 w-full" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />` |
| 3445 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell sm:col-span-2 min-h-[4rem] w-full" rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />` |
| 3451 | `input` | type="number" · placeholder="Capacity kW" | `<input type="number" className="input-shell w-full" placeholder="Capacity kW" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />` |
| 3458 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Project['status'] })} >` |
| 3477 | `input` | placeholder="Site name" | `<input className="input-shell w-full" placeholder="Site name" value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} />` |
| 3483 | `textarea` | placeholder="Address" | `<textarea className="input-shell min-h-[4rem] w-full" placeholder="Address" rows={2} value={siteForm.address} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} />` |
| 3498 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full" value={xfer.materialId} onChange={(e) => setXfer({ ...xfer, materialId: e.target.value })} >` |
| 3510 | `input` | type="number" | `<input type="number" placeholder={`Qty in issue unit`} className="input-shell w-full" value={xfer.qty} onChange={(e) => setXfer({ ...xfer, qty: e.target.value })} />` |
| 3517 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full" value={xfer.siteId} onChange={(e) => setXfer({ ...xfer, siteId: e.target.value })} >` |
| 3539 | `input` | placeholder="Description" | `<input className="input-shell w-full" placeholder="Description" value={contribLabor.description} onChange={(e) => setContribLabor({ ...contribLabor, description: e.target.value })} />` |
| 3545 | `input` | type="number" · placeholder="Hours" | `<input type="number" className="input-shell w-full" placeholder="Hours" value={contribLabor.hours} onChange={(e) => setContribLabor({ ...contribLabor, hours: e.target.value })} />` |
| 3552 | `input` | type="number" · placeholder="Cost (₹)" | `<input type="number" className="input-shell w-full" placeholder="Cost (₹)" value={contribLabor.cost} onChange={(e) => setContribLabor({ ...contribLabor, cost: e.target.value })} />` |
| 3559 | `input` | type="date" | `<input type="date" className="input-shell w-full" value={contribLabor.date} onChange={(e) => setContribLabor({ ...contribLabor, date: e.target.value })} />` |
| 3571 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell w-full" value={contribMat.materialId} onChange={(e) => setContribMat({ ...contribMat, materialId: e.target.value })} >` |
| 3583 | `input` | type="number" · placeholder="Quantity" | `<input type="number" className="input-shell w-full" placeholder="Quantity" value={contribMat.quantity} onChange={(e) => setContribMat({ ...contribMat, quantity: e.target.value })} />` |
| 3590 | `input` | type="number" · placeholder="Cost (₹)" | `<input type="number" className="input-shell w-full" placeholder="Cost (₹)" value={contribMat.cost} onChange={(e) => setContribMat({ ...contribMat, cost: e.target.value })} />` |
| 3597 | `input` | type="date" | `<input type="date" className="input-shell w-full" value={contribMat.date} onChange={(e) => setContribMat({ ...contribMat, date: e.target.value })} />` |

### `src/pages/sales/Agents.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 144 | `input` | placeholder="Name, mobile, email…" · aria-label="Search agents" | `<input className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink" placeholder="Name, mobile, email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search agents" />` |
| 154 | `select` | aria-label="Filter by rate type" | `<select className="select-shell h-10 shrink-0 grow-0" style={{ width: AGENTS_RATE_FILTER_W }} value={rateFilter} onChange={(e) => setRateFilter((e.target.value \|\| '') as '' \| Agent['rateType'])} ar…` |
| 331 | `input` | required | `<input required className="input-shell mt-1" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />` |
| 340 | `input` | required | `<input required className="input-shell mt-1" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />` |
| 349 | `input` | placeholder="If different from mobile" | `<input className="input-shell mt-1" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="If different from mobile" />` |
| 358 | `input` | type="email" | `<input type="email" className="input-shell mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />` |
| 366 | `input` | type="checkbox" | `<input type="checkbox" checked={form.isProfitSharePartner} onChange={(e) => setForm({ ...form, isProfitSharePartner: e.target.checked })} />` |
| 381 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value as Agent['rateType'] })} >` |
| 392 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />` |
| 396 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />` |
| 405 | `input` | type="file" | `<input type="file" accept="image/*" className="mt-1 block w-full text-sm text-muted-foreground" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloa…` |
| 933 | `input` | type="file" | `<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => persistPhoto(Stri…` |
| 1174 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell h-9 w-28 py-1 text-sm" value={row.estimatedSiteCostInr} onChange={(e) => { const v = Number(e.target.value) \|\| 0; patchEconomicsRow(row.id, { estimatedSiteCostInr: v }…` |
| 1188 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell h-9 w-28 py-1 text-sm" value={row.estimatedGrossProfitInr} onChange={(e) => { const v = Number(e.target.value) \|\| 0; patchEconomicsRow(row.id, { estimatedGrossProfitIn…` |
| 1406 | `input` | required | `<input required className="input-shell mt-1 w-full" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />` |
| 1415 | `input` | required | `<input required className="input-shell mt-1 w-full" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />` |
| 1424 | `input` | placeholder="If different from mobile" | `<input className="input-shell mt-1 w-full" value={editForm.whatsappNumber} onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })} placeholder="If different from mobile" />` |
| 1433 | `input` | type="email" | `<input type="email" className="input-shell mt-1 w-full" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />` |
| 1441 | `input` | type="checkbox" | `<input type="checkbox" checked={editForm.isProfitSharePartner} onChange={(e) => setEditForm({ ...editForm, isProfitSharePartner: e.target.checked })} />` |
| 1450 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={editForm.rateType} onChange={(e) => setEditForm({ ...editForm, rateType: e.target.value as Agent['rateType'] })} >` |
| 1461 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={editForm.rate} onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })} />` |
| 1465 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem] w-full" rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />` |
| 1509 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={payKind} onChange={(e) => setPayKind(e.target.value as IntroAgentPayoutKind)} >` |
| 1529 | `input` | type="number" · min=1 | `<input className="input-shell mt-1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} type="number" min={1} />` |
| 1539 | `input` | type="date" | `<input type="date" className="input-shell mt-1" value={payDate} onChange={(e) => setPayDate(e.target.value)} />` |
| 1543 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />` |
| 1566 | `input` | type="number" · min=1 | `<input className="input-shell mt-1" value={fifoAmount} onChange={(e) => setFifoAmount(e.target.value)} type="number" min={1} />` |
| 1570 | `input` | type="date" | `<input type="date" className="input-shell mt-1" value={payDate} onChange={(e) => setPayDate(e.target.value)} />` |
| 1574 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />` |

### `src/pages/sales/Customers.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 92 | `input` | placeholder="Name, phone, or email…" · aria-label="Search customers" | `<input className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink" placeholder="Name, phone, or email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />` |
| 261 | `input` | required | `<input required className="input-shell mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />` |
| 270 | `input` | required | `<input required className="input-shell mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />` |
| 279 | `input` | type="email" | `<input type="email" className="input-shell mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />` |
| 288 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />` |
| 297 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Customer['type'] })} >` |
| 308 | `input` | placeholder="Optional" | `<input className="input-shell mt-1" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="Optional" />` |
| 317 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[3rem]" rows={2} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />` |
| 326 | `input` | placeholder="Optional" | `<input className="input-shell mt-1" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} placeholder="Optional" />` |
| 335 | `input` | placeholder="e.g. Maharashtra" | `<input className="input-shell mt-1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Maharashtra" />` |
| 574 | `input` | required | `<input required className="input-shell mt-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />` |
| 583 | `input` | required | `<input required className="input-shell mt-1" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />` |
| 592 | `input` | type="email" | `<input type="email" className="input-shell mt-1" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />` |
| 601 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />` |
| 610 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Customer['type'] })} >` |
| 621 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.gstin} onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })} />` |
| 629 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[3rem]" rows={2} value={editForm.siteAddress} onChange={(e) => setEditForm({ ...editForm, siteAddress: e.target.value })} />` |
| 638 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.pan} onChange={(e) => setEditForm({ ...editForm, pan: e.target.value })} />` |
| 646 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />` |

### `src/pages/sales/Enquiries.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 372 | `input` | placeholder="Name, phone, or pipeline stage…" · aria-label="Search by customer name, phone, or pipeline stage" | `<input className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink" placeholder="Name, phone, or pipeline stage…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by cu…` |
| 382 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell h-10 shrink-0 grow-0" style={{ width: ENQ_STATUS_SELECT_W }} value={status} onChange={(e) => setStatus(e.target.value)} >` |
| 398 | `select` | aria-label="Filter by priority" | `<select className="select-shell h-10 shrink-0 grow-0" style={{ width: ENQ_PRIORITY_SELECT_W }} value={priorityOnly} onChange={(e) => setPriorityOnly(e.target.value)} aria-label="Filter by priority" >` |
| 538 | `input` | required | `<input required className="input-shell mt-1" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />` |
| 547 | `input` | required | `<input required className="input-shell mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />` |
| 556 | `input` | type="email" | `<input type="email" className="input-shell mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />` |
| 565 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Enquiry['type'] })} >` |
| 576 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Enquiry['priority'] })} >` |
| 590 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.systemCapacity} onChange={(e) => setForm({ ...form, systemCapacity: e.target.value })} />` |
| 598 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.estimatedBudget} onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })} />` |
| 606 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} >` |
| 621 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />` |
| 629 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value as 'Individual' \| 'Company' })} >` |
| 640 | `input` | type="date" | `<input type="date" className="input-shell mt-1" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />` |
| 649 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[3rem]" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} />` |
| 658 | `input` | placeholder="e.g. RCC, sheet" | `<input className="input-shell mt-1" value={form.roofType} onChange={(e) => setForm({ ...form, roofType: e.target.value })} placeholder="e.g. RCC, sheet" />` |
| 667 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.monthlyBillAmount} onChange={(e) => setForm({ ...form, monthlyBillAmount: e.target.value })} />` |
| 677 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.pipelineStage} onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })} >` |
| 692 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value as Enquiry['source']['type'], agentId: e.target.value === 'Agent' ? form…` |
| 718 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} >` |
| 736 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.newAgentName} onChange={(e) => setForm({ ...form, newAgentName: e.target.value })} />` |
| 744 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.newAgentMobile} onChange={(e) => setForm({ ...form, newAgentMobile: e.target.value })} />` |
| 756 | `input` | required | `<input required className="input-shell mt-1" value={form.referredBy} onChange={(e) => setForm({ ...form, referredBy: e.target.value })} />` |
| 766 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={form.directSource} onChange={(e) => setForm({ ...form, directSource: e.target.value })} />` |
| 781 | `input` | type="radio" · name="addStdComm" | `<input type="radio" name="addStdComm" checked={form.stdCommissionMode === 'referral_flat'} onChange={() => setForm({ ...form, stdCommissionMode: 'referral_flat' })} />` |
| 790 | `input` | type="radio" · name="addStdComm" | `<input type="radio" name="addStdComm" checked={form.stdCommissionMode === 'referral_per_kw'} onChange={() => setForm({ ...form, stdCommissionMode: 'referral_per_kw' })} />` |
| 802 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.introReferralFlatInr} onChange={(e) => setForm({ ...form, introReferralFlatInr: e.target.value })} />` |
| 813 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.introReferralPerKwInr} onChange={(e) => setForm({ ...form, introReferralPerKwInr: e.target.value })} />` |
| 833 | `input` | type="radio" · name="addPartnerComm" | `<input type="radio" name="addPartnerComm" checked={form.partnerCommissionMode === 'profit_share'} onChange={() => setForm({ ...form, partnerCommissionMode: 'profit_share' })} />` |
| 842 | `input` | type="radio" · name="addPartnerComm" | `<input type="radio" name="addPartnerComm" checked={form.partnerCommissionMode === 'referral_flat'} onChange={() => setForm({ ...form, partnerCommissionMode: 'referral_flat' })} />` |
| 851 | `input` | type="radio" · name="addPartnerComm" | `<input type="radio" name="addPartnerComm" checked={form.partnerCommissionMode === 'referral_per_kw'} onChange={() => setForm({ ...form, partnerCommissionMode: 'referral_per_kw' })} />` |
| 863 | `input` | type="number" · placeholder="e.g. 12" · min=0 · max=100 · step=0.5 | `<input type="number" min={0} max={100} step={0.5} className="input-shell mt-1" value={form.partnerProfitSharePercent} onChange={(e) => setForm({ ...form, partnerProfitSharePercent: e.target.value }…` |
| 878 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.introReferralFlatInr} onChange={(e) => setForm({ ...form, introReferralFlatInr: e.target.value })} />` |
| 890 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.introReferralPerKwInr} onChange={(e) => setForm({ ...form, introReferralPerKwInr: e.target.value })} />` |
| 901 | `input` | type="number" · placeholder="If the lead has a set price" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={form.fixedDealAmountInr} onChange={(e) => setForm({ ...form, fixedDealAmountInr: e.target.value })} placeholder="If the lead has a s…` |
| 1593 | `input` | placeholder="Optional" | `<input className="input-shell mt-1" value={noteBy} onChange={(e) => setNoteBy(e.target.value)} placeholder="Optional" />` |
| 1595 | `textarea` | placeholder="Write an update for the timeline…" | `<textarea className="input-shell min-h-[6rem]" placeholder="Write an update for the timeline…" value={note} onChange={(e) => setNote(e.target.value)} />` |
| 1614 | `input` | type="date" | `<input type="date" className="input-shell mt-1" value={meetDate} onChange={(e) => setMeetDate(e.target.value)} />` |
| 1623 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={meetKind} onChange={(e) => setMeetKind(e.target.value as EnquiryMeetingTaskKindId)} >` |
| 1651 | `input` | type="checkbox" | `<input type="checkbox" checked={meetAssignees.includes(u.id)} onChange={() => toggleMeetAssignee(u.id)} />` |
| 1667 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[4rem]" value={meetNotes} onChange={(e) => setMeetNotes(e.target.value)} />` |
| 1697 | `input` | type="checkbox" | `<input type="checkbox" className="mt-1" checked={waSelected.has(r.key)} onChange={() => toggleWaRecipient(r.key)} />` |
| 1721 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[5.5rem] w-full text-sm" value={waDrafts[r.key] ?? ''} onChange={(e) => setWaDrafts((d) => ({ ...d, [r.key]: e.target.value }))} spellCheck />` |
| 1747 | `input` | required | `<input required className="input-shell mt-1" value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} />` |
| 1756 | `input` | required | `<input required className="input-shell mt-1" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />` |
| 1765 | `input` | type="email" | `<input type="email" className="input-shell mt-1" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />` |
| 1774 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Enquiry['type'] })} >` |
| 1785 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Enquiry['priority'] })} >` |
| 1799 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.systemCapacity} onChange={(e) => setEditForm({ ...editForm, systemCapacity: e.target.value })} />` |
| 1807 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.estimatedBudget} onChange={(e) => setEditForm({ ...editForm, estimatedBudget: e.target.value })} />` |
| 1815 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Enquiry['status'] })} >` |
| 1829 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })} >` |
| 1844 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.customerType} onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value as 'Individual' \| 'Company' })} >` |
| 1855 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.customerAddress} onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })} />` |
| 1863 | `input` | type="date" | `<input type="date" className="input-shell mt-1" value={editForm.followUpDate} onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })} />` |
| 1872 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.pipelineStage} onChange={(e) => setEditForm({ ...editForm, pipelineStage: e.target.value })} >` |
| 1887 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.roofType} onChange={(e) => setEditForm({ ...editForm, roofType: e.target.value })} />` |
| 1895 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1" value={editForm.monthlyBillAmount} onChange={(e) => setEditForm({ ...editForm, monthlyBillAmount: e.target.value })} />` |
| 1905 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.sourceType} onChange={(e) => setEditForm({ ...editForm, sourceType: e.target.value as Enquiry['source']['type'], agentId: e.target.value === 'A…` |
| 1931 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1" value={editForm.agentId} onChange={(e) => setEditForm({ ...editForm, agentId: e.target.value })} >` |
| 1949 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.newAgentName} onChange={(e) => setEditForm({ ...editForm, newAgentName: e.target.value })} />` |
| 1957 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.newAgentMobile} onChange={(e) => setEditForm({ ...editForm, newAgentMobile: e.target.value })} />` |
| 1969 | `input` | required | `<input required className="input-shell mt-1" value={editForm.referredBy} onChange={(e) => setEditForm({ ...editForm, referredBy: e.target.value })} />` |
| 1979 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1" value={editForm.directSource} onChange={(e) => setEditForm({ ...editForm, directSource: e.target.value })} />` |
| 1998 | `input` | type="radio" · name="editStdComm" | `<input type="radio" name="editStdComm" disabled={commissionLocked} checked={editForm.stdCommissionMode === 'referral_flat'} onChange={() => setEditForm({ ...editForm, stdCommissionMode: 'referral_f…` |
| 2008 | `input` | type="radio" · name="editStdComm" | `<input type="radio" name="editStdComm" disabled={commissionLocked} checked={editForm.stdCommissionMode === 'referral_per_kw'} onChange={() => setEditForm({ ...editForm, stdCommissionMode: 'referral…` |
| 2021 | `input` | type="number" · min=0 | `<input type="number" min={0} disabled={commissionLocked} className="input-shell mt-1" value={editForm.introReferralFlatInr} onChange={(e) => setEditForm({ ...editForm, introReferralFlatInr: e.targe…` |
| 2033 | `input` | type="number" · min=0 | `<input type="number" min={0} disabled={commissionLocked} className="input-shell mt-1" value={editForm.introReferralPerKwInr} onChange={(e) => setEditForm({ ...editForm, introReferralPerKwInr: e.tar…` |
| 2053 | `input` | type="radio" · name="editPartnerComm" | `<input type="radio" name="editPartnerComm" disabled={commissionLocked} checked={editForm.partnerCommissionMode === 'profit_share'} onChange={() => setEditForm({ ...editForm, partnerCommissionMode: …` |
| 2063 | `input` | type="radio" · name="editPartnerComm" | `<input type="radio" name="editPartnerComm" disabled={commissionLocked} checked={editForm.partnerCommissionMode === 'referral_flat'} onChange={() => setEditForm({ ...editForm, partnerCommissionMode:…` |
| 2073 | `input` | type="radio" · name="editPartnerComm" | `<input type="radio" name="editPartnerComm" disabled={commissionLocked} checked={editForm.partnerCommissionMode === 'referral_per_kw'} onChange={() => setEditForm({ ...editForm, partnerCommissionMod…` |
| 2086 | `input` | type="number" · min=0 · max=100 · step=0.5 | `<input type="number" min={0} max={100} step={0.5} disabled={commissionLocked} className="input-shell mt-1" value={editForm.partnerProfitSharePercent} onChange={(e) => setEditForm({ ...editForm, par…` |
| 2101 | `input` | type="number" · min=0 | `<input type="number" min={0} disabled={commissionLocked} className="input-shell mt-1" value={editForm.introReferralFlatInr} onChange={(e) => setEditForm({ ...editForm, introReferralFlatInr: e.targe…` |
| 2114 | `input` | type="number" · min=0 | `<input type="number" min={0} disabled={commissionLocked} className="input-shell mt-1" value={editForm.introReferralPerKwInr} onChange={(e) => setEditForm({ ...editForm, introReferralPerKwInr: e.tar…` |
| 2126 | `input` | type="number" · min=0 | `<input type="number" min={0} disabled={commissionLocked} className="input-shell mt-1" value={editForm.fixedDealAmountInr} onChange={(e) => setEditForm({ ...editForm, fixedDealAmountInr: e.target.va…` |
| 2139 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[3rem]" value={editForm.requirements} onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })} rows={2} />` |

### `src/pages/sales/QuotationDetailPage.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 511 | `input` | (no static id/name/type/placeholder) | `<input readOnly className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" value={previewAbs} />` |
| 558 | `textarea` | placeholder="Reason for rejection" | `<textarea className="input-shell mb-3 min-h-[5rem] w-full text-sm" placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />` |
| 578 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded-lg border px-3 py-2" value={payType} onChange={(e) => setPayType(e.target.value as PaymentTypeChoice)} >` |
| 592 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded-lg border px-3 py-2" value={kNum} onChange={(e) => setKNum(e.target.value)} />` |
| 596 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded-lg border px-3 py-2" value={lender} onChange={(e) => setLender(e.target.value)} />` |
| 609 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projType} onChange={(e) => { const t = e.target.value as Project['type']; setProjType(t); if (t === 'Partner (Profit Only)' \|\| t === 'Partner wit…` |
| 634 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projPartnerId} onChange={(e) => { const v = e.target.value; setProjPartnerId(v); setProjCoPartnerIds((prev) => prev.filter((pid) => pid !== v)); …` |
| 659 | `input` | type="checkbox" | `<input type="checkbox" checked={projCoPartnerIds.includes(p.id)} onChange={() => setProjCoPartnerIds((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id] ) } />` |
| 679 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={projChannelId} onChange={(e) => setProjChannelId(e.target.value)} >` |

### `src/pages/sales/QuotationForm.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 566 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full max-w-xl" value={enquiryId} onChange={(e) => onEnquiryIdChange(e.target.value)} >` |
| 610 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={introMode} onChange={(e) => setIntroMode(e.target.value as IntroducingPartnerPayMode)} >` |
| 623 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1 w-full" value={introFlat} onChange={(e) => setIntroFlat(e.target.value)} />` |
| 635 | `input` | type="number" · min=0 | `<input type="number" min={0} className="input-shell mt-1 w-full" value={introPerKw} onChange={(e) => setIntroPerKw(e.target.value)} />` |
| 651 | `input` | type="checkbox" | `<input type="checkbox" checked={incPay} onChange={(e) => { setIncPay(e.target.checked); if (e.target.checked && paymentTerms.length === 0) setPaymentTerms([...DEFAULT_QUOTE_PAYMENT_TERMS]); }} />` |
| 662 | `input` | type="checkbox" | `<input type="checkbox" checked={incWar} onChange={(e) => { setIncWar(e.target.checked); if (e.target.checked && warrantyInfo.length === 0) setWarrantyInfo([...DEFAULT_QUOTE_WARRANTY]); }} />` |
| 690 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell mt-1 w-full" value={customerId} onChange={(e) => setCustomerId(e.target.value)} >` |
| 709 | `select` | (no static id/name/type/placeholder) | `<select className="mt-1 w-full rounded-lg border px-3 py-2" value={presetId} onChange={(e) => onPresetSelect(e.target.value)} >` |
| 725 | `input` | type="number" · placeholder="Optional" · min=0 | `<input type="number" min={0} className="input-shell mt-1 w-full" value={systemKw} onChange={(e) => setSystemKw(e.target.value)} placeholder="Optional" />` |
| 753 | `input` | type="number" · min=0 | `<input type="number" min={0} className="w-20 rounded border px-2 py-1" value={li.quantity} onChange={(e) => { const qn = Number(e.target.value) \|\| 0; const next = [...lineItems]; next[idx] = { ...l…` |
| 767 | `input` | type="number" · min=0 | `<input type="number" min={0} className="w-24 rounded border px-2 py-1" value={li.rate} onChange={(e) => { const r = Number(e.target.value) \|\| 0; const next = [...lineItems]; next[idx] = { ...li, ra…` |
| 798 | `select` | (no static id/name/type/placeholder) | `<select className="select-shell ml-2 mt-1 max-w-xs" value={addMaterialId} onChange={(e) => { const v = e.target.value; setAddMaterialId(v); if (v) appendMaterialLine(v); }} >` |
| 820 | `select` | (no static id/name/type/placeholder) | `<select className="ml-2 rounded border px-2 py-1" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' \| 'amount')} >` |
| 832 | `input` | type="number" | `<input type="number" className="ml-2 w-20 rounded border px-2 py-1" value={discount} onChange={(e) => setDiscount(Number(e.target.value) \|\| 0)} />` |
| 842 | `input` | type="number" | `<input type="number" className="ml-2 w-28 rounded border px-2 py-1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />` |
| 852 | `input` | type="number" | `<input type="number" className="ml-2 w-20 rounded border px-2 py-1" value={gst} onChange={(e) => setGst(Number(e.target.value) \|\| 0)} />` |
| 863 | `input` | type="number" · min=0 | `<input type="number" min={0} className="ml-2 w-20 rounded border px-2 py-1" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />` |
| 873 | `input` | type="number" · placeholder="Optional" · min=0 | `<input type="number" min={0} className="ml-2 w-28 rounded border px-2 py-1" value={clientAgreed} onChange={(e) => setClientAgreed(e.target.value)} placeholder="Optional" />` |
| 884 | `input` | type="number" · placeholder="Loan papers" · min=0 | `<input type="number" min={0} className="ml-2 w-28 rounded border px-2 py-1" value={bankDocAmount} onChange={(e) => setBankDocAmount(e.target.value)} placeholder="Loan papers" />` |
| 908 | `input` | type="checkbox" | `<input type="checkbox" checked={pdfSec[key]} onChange={(e) => setPdfSec({ ...pdfSec, [key]: e.target.checked })} />` |
| 923 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="input-shell mt-1 min-h-[7rem] w-full" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />` |
| 956 | `input` | required | `<input required className="input-shell mt-1 w-full" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />` |
| 965 | `input` | placeholder="+91…" · required | `<input required className="input-shell mt-1 w-full" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} placeholder="+91…" />` |
| 975 | `input` | type="email" | `<input type="email" className="input-shell mt-1 w-full" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />` |
| 984 | `input` | (no static id/name/type/placeholder) | `<input className="input-shell mt-1 w-full" value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} />` |

### `src/pages/sales/Quotations.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 93 | `input` | placeholder="Reference, customer, or phone…" · aria-label="Search quotations" | `<input className="input-shell h-10 w-auto min-w-[12rem] max-w-[20rem] shrink" placeholder="Reference, customer, or phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search quotat…` |
| 103 | `select` | aria-label="Filter by status" | `<select className="select-shell h-10 shrink-0 grow-0" style={{ width: QUO_STATUS_SELECT_W }} value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status" >` |

### `src/pages/settings/Settings.tsx`

| Line | Tag | Parsed attrs | Preview |
|------|-----|--------------|--------|
| 68 | `select` | (no static id/name/type/placeholder) | `<select className="rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as MasterData['type'])}>` |
| 75 | `input` | placeholder="Value" | `<input className="rounded border px-3 py-2" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Value" />` |
| 149 | `select` | (no static id/name/type/placeholder) | `<select disabled={!canDeleteUsers(role)} value={u.role} onChange={(e) => setUserRole(u.id, e.target.value as User['role'])} className="rounded border px-2 py-1 text-xs" >` |
| 208 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />` |
| 212 | `input` | (no static id/name/type/placeholder) | `<input className="mt-1 w-full rounded border px-3 py-2" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />` |
| 216 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />` |
| 220 | `textarea` | (no static id/name/type/placeholder) | `<textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />` |
| 224 | `input` | type="number" · placeholder="e.g. 25000 — block saves at or above" · min=0 | `<input type="number" min={0} className="mt-1 w-full rounded border px-3 py-2" value={form.quotationDiscountApprovalThresholdInr ?? ''} placeholder="e.g. 25000 — block saves at or above" onChange={(…` |
| 284 | `input` | placeholder="Type RESET" | `<input className="input-shell mb-3 w-full" autoComplete="off" placeholder="Type RESET" value={confirmPhrase} onChange={(e) => setConfirmPhrase(e.target.value)} />` |

