import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CompanyExpense, Project, User } from '../types';
import { EXPENSE_TAXONOMY, expenseTaxonomyKey, findSub, type ExpensePillarId } from '../lib/expenseTaxonomy';
import { appendAudit } from '../lib/auditLog';
import { postExpenseVoucher } from '../lib/voucherPosting';
import { generateId, getCollection, setCollection } from '../lib/storage';
import { useDataRefresh, useToast } from '../contexts/AppProviders';
import { Modal } from './Modal';
import { ShellButton } from './ShellButton';
import { cn } from '../lib/utils';

const PAYMENT_MODES = ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Credit Card'] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  currentUserId?: string;
  currentUserName?: string;
};

export function UnifiedExpenseModal({
  open,
  onClose,
  defaultProjectId,
  currentUserId = 'system',
  currentUserName = 'User',
}: Props) {
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const projects = getCollection<Project>('projects');
  const users = getCollection<User>('users');

  const [step, setStep] = useState(1);
  const [pillarId, setPillarId] = useState<ExpensePillarId | ''>('');
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<string>('Bank Transfer');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [employeeId, setEmployeeId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [monthRef, setMonthRef] = useState(() => new Date().toISOString().slice(0, 7));
  const [qty, setQty] = useState('1');
  const [payer, setPayer] = useState('Company');

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId ?? '');
  }, [open, defaultProjectId]);

  const pillar = EXPENSE_TAXONOMY.find((p) => p.id === pillarId);
  const category = pillar?.categories.find((c) => c.id === catId);
  const sub = pillarId && catId && subId ? findSub(pillarId, catId, subId) : undefined;

  const flags = sub?.flags ?? {};

  const allowedPayers = pillar?.allowedPayers ?? ['Company'];

  const reset = () => {
    setStep(1);
    setPillarId('');
    setCatId('');
    setSubId('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setMode('Bank Transfer');
    setProjectId(defaultProjectId ?? '');
    setEmployeeId('');
    setPartnerId('');
    setQty('1');
    setPayer('Company');
  };

  const close = () => {
    reset();
    onClose();
  };

  const categoryLabel = useMemo(() => {
    if (!pillar || !category || !sub) return '';
    return `${pillar.label} › ${category.label} › ${sub.label}`;
  }, [pillar, category, sub]);

  function save() {
    const n = Number(amount);
    if (!pillarId || !catId || !subId || !n || n <= 0) {
      show('Complete amount and category', 'error');
      return;
    }
    if (flags.requiresProject && !projectId) {
      show('Select a project', 'error');
      return;
    }
    if (flags.requiresEmployee && !employeeId) {
      show('Select an employee', 'error');
      return;
    }
    if (flags.requiresPartner && !partnerId) {
      show('Select a partner', 'error');
      return;
    }

    const exp: CompanyExpense = {
      id: generateId('cexp'),
      category: categoryLabel,
      subCategory: subId,
      taxonomyKey: expenseTaxonomyKey(pillarId, catId, subId),
      amount: n,
      date,
      projectId: projectId || undefined,
      paidBy: payer,
      payerType: payer,
      mode,
      notes,
      pillar: pillarId,
      employeeId: employeeId || undefined,
      partnerId: partnerId || undefined,
      monthRef: flags.requiresMonth ? monthRef : undefined,
      quantity: flags.requiresQuantity ? Number(qty) || 1 : undefined,
      quantityUnit: flags.requiresQuantity ? 'unit' : undefined,
      createdAt: new Date().toISOString(),
    };

    const list = getCollection<CompanyExpense>('companyExpenses');
    setCollection('companyExpenses', [...list, exp]);
    postExpenseVoucher(exp, currentUserId, currentUserName);
    appendAudit({
      userId: currentUserId,
      userName: currentUserName,
      action: 'create',
      entityType: 'CompanyExpense',
      entityId: exp.id,
      entityName: categoryLabel,
      newValue: String(n),
    });
    bump();
    show('Expense recorded', 'success');
    close();
  }

  const stepTitle = ['Pillar', 'Category', 'Sub-category', 'Details', 'Who paid'][step - 1];

  let body: ReactNode;
  if (step === 1) {
    body = (
      <div className="grid gap-2 sm:grid-cols-2">
        {EXPENSE_TAXONOMY.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cn(
              'rounded-lg border border-border p-3 text-left text-sm font-medium transition hover:bg-accent',
              pillarId === p.id && 'border-primary ring-2 ring-ring/30'
            )}
            onClick={() => {
              setPillarId(p.id);
              setCatId('');
              setSubId('');
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  } else if (step === 2 && pillar) {
    body = (
      <div className="space-y-2">
        {pillar.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(
              'w-full rounded-lg border border-border p-3 text-left text-sm transition hover:bg-accent',
              catId === c.id && 'border-primary ring-2 ring-ring/30'
            )}
            onClick={() => {
              setCatId(c.id);
              setSubId('');
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    );
  } else if (step === 3 && category) {
    body = (
      <div className="space-y-2">
        {category.subs.map((s) => (
          <button
            key={s.id}
            type="button"
            className={cn(
              'w-full rounded-lg border border-border p-3 text-left text-sm transition hover:bg-accent',
              subId === s.id && 'border-primary ring-2 ring-ring/30'
            )}
            onClick={() => setSubId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    );
  } else if (step === 4 && sub) {
    body = (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Amount (₹)
          <input className="input-shell mt-1" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Date
          <input className="input-shell mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {flags.requiresMonth && (
          <label className="block text-sm font-medium text-foreground">
            Month
            <input className="input-shell mt-1" type="month" value={monthRef} onChange={(e) => setMonthRef(e.target.value)} />
          </label>
        )}
        {flags.requiresProject && (
          <label className="block text-sm font-medium text-foreground">
            Project
            <select className="select-shell mt-1 w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {flags.requiresEmployee && (
          <label className="block text-sm font-medium text-foreground">
            Employee
            <select className="select-shell mt-1 w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {flags.requiresPartner && (
          <label className="block text-sm font-medium text-foreground">
            Partner ID (text)
            <input className="input-shell mt-1" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} placeholder="partner id" />
          </label>
        )}
        {flags.requiresQuantity && (
          <label className="block text-sm font-medium text-foreground">
            Quantity
            <input className="input-shell mt-1" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
        )}
        <label className="block text-sm font-medium text-foreground">
          Payment mode
          <select className="select-shell mt-1 w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Notes
          <textarea className="input-shell mt-1 min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>
      </div>
    );
  } else if (step === 5) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{categoryLabel}</p>
        <p className="text-lg font-semibold text-foreground">₹{amount || '0'}</p>
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Paid by</span>
          {allowedPayers.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input type="radio" name="payer" checked={payer === p} onChange={() => setPayer(p)} />
              {p}
            </label>
          ))}
        </div>
      </div>
    );
  } else {
    body = <p className="text-sm text-muted-foreground">Go back and complete previous steps.</p>;
  }

  function next() {
    if (step === 1 && !pillarId) return show('Choose a pillar', 'error');
    if (step === 2 && !catId) return show('Choose a category', 'error');
    if (step === 3 && !subId) return show('Choose a sub-category', 'error');
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <Modal open={open} title={`Add expense — ${stepTitle}`} onClose={close} wide>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn('rounded-full px-2 py-0.5', step >= n ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            {n}
          </span>
        ))}
      </div>
      {body}
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {step > 1 && (
          <ShellButton type="button" variant="secondary" onClick={back}>
            Back
          </ShellButton>
        )}
        <ShellButton type="button" variant="ghost" onClick={close}>
          Cancel
        </ShellButton>
        {step < 5 ? (
          <ShellButton type="button" variant="primary" onClick={next}>
            Next
          </ShellButton>
        ) : (
          <ShellButton type="button" variant="primary" onClick={save}>
            Save expense
          </ShellButton>
        )}
      </div>
    </Modal>
  );
}
