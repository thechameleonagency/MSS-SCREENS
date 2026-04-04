import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { IncomeRecord, Project, User } from '../types';
import { INCOME_TAXONOMY, incomeTaxonomyKey, type IncomePillarId } from '../lib/incomeTaxonomy';
import { appendAudit } from '../lib/auditLog';
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

export function UnifiedIncomeModal({
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
  const [pillarId, setPillarId] = useState<IncomePillarId | ''>('');
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<string>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [employeeId, setEmployeeId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [loanAccount, setLoanAccount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId ?? '');
  }, [open, defaultProjectId]);

  const pillar = INCOME_TAXONOMY.find((p) => p.id === pillarId);
  const category = pillar?.categories.find((c) => c.id === catId);
  const sub = category?.subs.find((s) => s.id === subId);
  const flags = sub?.flags ?? {};

  const reset = () => {
    setStep(1);
    setPillarId('');
    setCatId('');
    setSubId('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('Bank Transfer');
    setReference('');
    setNotes('');
    setProjectId(defaultProjectId ?? '');
    setEmployeeId('');
    setPartnerId('');
    setPersonName('');
    setContactNumber('');
    setExpectedReturnDate('');
    setBankName('');
    setLoanAccount('');
    setInterestRate('');
    setTenureMonths('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const label = useMemo(() => {
    if (!pillar || !category || !sub) return '';
    return `${pillar.label} › ${category.label} › ${sub.label}`;
  }, [pillar, category, sub]);

  function save() {
    const n = Number(amount);
    if (!pillarId || !catId || !subId || !n || n <= 0) {
      show('Complete amount and selections', 'error');
      return;
    }
    if (flags.requiresProject && !projectId) {
      show('Select project', 'error');
      return;
    }
    if (flags.requiresEmployee && !employeeId) {
      show('Select employee', 'error');
      return;
    }
    if (flags.requiresPartner && !partnerId) {
      show('Enter partner reference', 'error');
      return;
    }
    if (flags.requiresPersonName && !personName.trim()) {
      show('Enter person name', 'error');
      return;
    }
    if (flags.requiresContactNumber && !contactNumber.trim()) {
      show('Enter contact', 'error');
      return;
    }
    if (flags.requiresBankName && !bankName.trim()) {
      show('Enter bank name', 'error');
      return;
    }

    const row: IncomeRecord = {
      id: generateId('inc'),
      pillar: pillarId,
      category: category?.label ?? catId,
      subCategory: subId,
      taxonomyKey: incomeTaxonomyKey(pillarId, catId, subId),
      amount: flags.isOutgoing ? -Math.abs(n) : n,
      date,
      paymentMode,
      reference: reference || undefined,
      notes,
      projectId: projectId || undefined,
      employeeId: employeeId || undefined,
      partnerId: partnerId || undefined,
      personName: personName || undefined,
      contactNumber: contactNumber || undefined,
      expectedReturnDate: expectedReturnDate || undefined,
      bankName: bankName || undefined,
      loanAccount: loanAccount || undefined,
      interestRate: interestRate ? Number(interestRate) : undefined,
      tenureMonths: tenureMonths ? Number(tenureMonths) : undefined,
      isOutgoing: flags.isOutgoing,
      createdAt: new Date().toISOString(),
    };

    const list = getCollection<IncomeRecord>('incomeRecords');
    setCollection('incomeRecords', [...list, row]);
    appendAudit({
      userId: currentUserId,
      userName: currentUserName,
      action: 'create',
      entityType: 'IncomeRecord',
      entityId: row.id,
      entityName: label,
      newValue: String(row.amount),
    });
    bump();
    show('Income recorded', 'success');
    close();
  }

  let body: ReactNode;
  if (step === 1) {
    body = (
      <div className="grid gap-2 sm:grid-cols-2">
        {INCOME_TAXONOMY.map((p) => (
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
        <label className="block text-sm font-medium">
          Amount (₹)
          <input className="input-shell mt-1" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Date
          <input className="input-shell mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Payment mode *
          <select className="select-shell mt-1 w-full" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Reference
          <input className="input-shell mt-1" value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>
        {flags.requiresProject && (
          <label className="block text-sm font-medium">
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
          <label className="block text-sm font-medium">
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
          <label className="block text-sm font-medium">
            Partner id
            <input className="input-shell mt-1" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} />
          </label>
        )}
        {flags.requiresPersonName && (
          <label className="block text-sm font-medium">
            Person name
            <input className="input-shell mt-1" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          </label>
        )}
        {flags.requiresContactNumber && (
          <label className="block text-sm font-medium">
            Contact number
            <input className="input-shell mt-1" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </label>
        )}
        {flags.requiresExpectedReturnDate && (
          <label className="block text-sm font-medium">
            Expected return date
            <input className="input-shell mt-1" type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
          </label>
        )}
        {flags.requiresBankName && (
          <label className="block text-sm font-medium">
            Bank name
            <input className="input-shell mt-1" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </label>
        )}
        {flags.requiresLoanAccount && (
          <label className="block text-sm font-medium">
            Loan account
            <input className="input-shell mt-1" value={loanAccount} onChange={(e) => setLoanAccount(e.target.value)} />
          </label>
        )}
        {flags.requiresInterestRate && (
          <label className="block text-sm font-medium">
            Interest rate %
            <input className="input-shell mt-1" type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          </label>
        )}
        {flags.requiresTenure && (
          <label className="block text-sm font-medium">
            Tenure (months)
            <input className="input-shell mt-1" type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} />
          </label>
        )}
        <label className="block text-sm font-medium">
          Notes
          <textarea className="input-shell mt-1 min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>
      </div>
    );
  } else if (step === 5) {
    body = (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">₹{amount}</p>
        <p className="text-muted-foreground">{date}</p>
      </div>
    );
  } else {
    body = null;
  }

  function next() {
    if (step === 1 && !pillarId) return show('Choose pillar', 'error');
    if (step === 2 && !catId) return show('Choose category', 'error');
    if (step === 3 && !subId) return show('Choose sub-category', 'error');
    setStep((s) => Math.min(5, s + 1));
  }

  const titles = ['Pillar', 'Category', 'Sub-category', 'Details', 'Confirm'];

  return (
    <Modal open={open} title={`Add income — ${titles[step - 1]}`} onClose={close} wide>
      <div className="mb-4 flex flex-wrap gap-1 text-xs text-muted-foreground">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn('rounded-full px-2 py-0.5', step >= n ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            {n}
          </span>
        ))}
      </div>
      {body}
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {step > 1 && (
          <ShellButton type="button" variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>
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
            Confirm
          </ShellButton>
        )}
      </div>
    </Modal>
  );
}
