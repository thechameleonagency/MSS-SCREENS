import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveCollection } from '../hooks/useLiveCollection';
import type {
  Customer,
  Enquiry,
  Invoice,
  Payment,
  Project,
  Quotation,
  Supplier,
  Task,
  User,
} from '../types';

type SearchHit = { label: string; to: string; type: string };

const MAX_TOTAL = 14;
const PER_TYPE = 4;

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const invoices = useLiveCollection<Invoice>('invoices');
  const users = useLiveCollection<User>('users');
  const quotations = useLiveCollection<Quotation>('quotations');
  const enquiries = useLiveCollection<Enquiry>('enquiries');
  const tasks = useLiveCollection<Task>('tasks');
  const suppliers = useLiveCollection<Supplier>('suppliers');
  const payments = useLiveCollection<Payment>('payments');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [] as SearchHit[];
    const out: SearchHit[] = [];

    const push = (hits: SearchHit[]) => {
      for (const h of hits) {
        if (out.length >= MAX_TOTAL) return;
        out.push(h);
      }
    };

    push(
      projects
        .filter((p) => p.name.toLowerCase().includes(s))
        .slice(0, PER_TYPE)
        .map((p) => ({ type: 'Project', label: p.name, to: `/projects/${p.id}` }))
    );
    push(
      customers
        .filter((c) => c.name.toLowerCase().includes(s) || c.phone.replace(/\D/g, '').includes(s.replace(/\D/g, '')))
        .slice(0, PER_TYPE)
        .map((c) => ({ type: 'Customer', label: c.name, to: `/sales/customers/${c.id}` }))
    );
    push(
      invoices
        .filter((i) => i.invoiceNumber.toLowerCase().includes(s))
        .slice(0, PER_TYPE)
        .map((i) => ({ type: 'Invoice', label: i.invoiceNumber, to: `/finance/invoices/${i.id}` }))
    );
    push(
      users
        .filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
        .slice(0, 3)
        .map((u) => ({ type: 'Employee', label: u.name, to: `/hr/employees/${u.id}` }))
    );
    push(
      quotations
        .filter((q0) => q0.reference.toLowerCase().includes(s))
        .slice(0, PER_TYPE)
        .map((q0) => ({ type: 'Quotation', label: q0.reference, to: `/sales/quotations/${q0.id}` }))
    );
    push(
      enquiries
        .filter(
          (e) =>
            e.customerName.toLowerCase().includes(s) ||
            e.phone.replace(/\D/g, '').includes(s.replace(/\D/g, '')) ||
            e.email.toLowerCase().includes(s)
        )
        .slice(0, PER_TYPE)
        .map((e) => ({ type: 'Enquiry', label: e.customerName, to: `/sales/enquiries/${e.id}` }))
    );
    push(
      tasks
        .filter((t) => t.title.toLowerCase().includes(s))
        .slice(0, PER_TYPE)
        .map((t) => ({ type: 'Task', label: t.title, to: `/hr/tasks/${t.id}` }))
    );
    push(
      suppliers
        .filter((v) => v.name.toLowerCase().includes(s) || v.contact.replace(/\D/g, '').includes(s.replace(/\D/g, '')))
        .slice(0, PER_TYPE)
        .map((v) => ({ type: 'Supplier', label: v.name, to: `/finance/vendors/${v.id}` }))
    );
    const payHits: SearchHit[] = [];
    for (const p of payments) {
      if (payHits.length >= PER_TYPE) break;
      const inv = invoices.find((i) => i.id === p.invoiceId);
      const hay = `${p.amount} ${p.date} ${inv?.invoiceNumber ?? ''} ${p.mode}`.toLowerCase();
      if (hay.includes(s)) {
        payHits.push({
          type: 'Payment',
          label: inv ? `${inv.invoiceNumber} · ${p.date}` : `Payment ${p.date}`,
          to: '/finance/payments',
        });
      }
    }
    push(payHits);

    return out.slice(0, MAX_TOTAL);
  }, [q, projects, customers, invoices, users, quotations, enquiries, tasks, suppliers, payments]);

  return (
    <div className="relative hidden max-w-xs flex-1 sm:block md:max-w-[200px] lg:max-w-xs">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">⌕</span>
      <input
        type="search"
        placeholder="Search…"
        aria-label="Global search"
        aria-expanded={open}
        className="h-10 w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md">
          {results.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>}
          {results.map((r, i) => (
            <Link
              key={`${r.to}-${r.type}-${i}`}
              to={r.to}
              className="block px-3 py-2 text-sm hover:bg-accent"
              onClick={() => {
                setQ('');
                setOpen(false);
              }}
            >
              <span className="text-xs text-muted-foreground">{r.type}</span>
              <span className="ml-2 font-medium text-foreground">{r.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
