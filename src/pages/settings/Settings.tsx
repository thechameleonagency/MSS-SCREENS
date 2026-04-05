import { useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { canDeleteUsers, canEditSettings } from '../../lib/permissions';
import { runSeed } from '../../lib/seedData';
import { generateId, getCollection, getItem, setCollection, setItem } from '../../lib/storage';
import type { CompanyProfile, MasterData, MasterDataType, User } from '../../types';

const MASTER_TYPES: MasterDataType[] = [
  'PanelBrand',
  'InverterBrand',
  'StructureType',
  'SystemCapacity',
  'ExpenseMainCategory',
  'ExpenseSubCategory',
  'DocumentTemplate',
  'EnquiryPipelineStage',
];

export function MasterDataPage() {
  const items = useLiveCollection<MasterData>('masterData');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();
  const [val, setVal] = useState('');
  const [type, setType] = useState<MasterData['type']>('PanelBrand');

  if (!canEditSettings(role)) {
    return <p className="text-muted-foreground">View only. Switch to Admin to edit master data.</p>;
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!val.trim()) return;
    const list = getCollection<MasterData>('masterData');
    setCollection('masterData', [
      ...list,
      {
        id: generateId('md'),
        type,
        value: val.trim(),
        order: list.filter((x) => x.type === type).length,
      },
    ]);
    setVal('');
    bump();
    show('Added', 'success');
  }

  const grouped = useMemo(() => {
    const map = new Map<MasterDataType, MasterData[]>();
    for (const t of MASTER_TYPES) map.set(t, []);
    items.forEach((i) => {
      const g = map.get(i.type) ?? [];
      g.push(i);
      map.set(i.type, g);
    });
    return MASTER_TYPES.map((t) => [t, map.get(t) ?? []] as const);
  }, [items]);

  return (
    <div className="min-w-0 space-y-3">
      <h2 className="text-base font-semibold text-foreground">Master data</h2>
      <p className="text-xs text-muted-foreground">Pick a type and add values — scroll cards horizontally on small screens.</p>
      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2 sm:p-3">
        <select className="rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as MasterData['type'])}>
          {MASTER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input className="rounded border px-3 py-2" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Value" />
        <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">
          Add
        </button>
      </form>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {grouped.map(([t, rows]) => (
          <div
            key={t}
            className="w-[min(100%,16rem)] shrink-0 rounded-lg border border-border bg-card sm:w-auto sm:min-w-0"
          >
            <div className="border-b border-border bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground">{t}</div>
            <ul className="max-h-48 divide-y divide-border overflow-y-auto text-xs sm:max-h-56">
              {rows.length === 0 && <li className="px-3 py-2 text-muted-foreground">No values</li>}
              {rows
                .slice()
                .sort((a, b) => a.order - b.order || a.value.localeCompare(b.value))
                .map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="truncate">{m.value}</span>
                    {m.parentId && <span className="shrink-0 text-[10px] text-muted-foreground">↳ {m.parentId}</span>}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserManagementPage() {
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const { role } = useRole();

  function setUserRole(id: string, r: User['role']) {
    const list = getCollection<User>('users');
    setCollection(
      'users',
      list.map((u) =>
        u.id === id
          ? {
              ...u,
              role: r,
              expenseTag: r === 'Salesperson' || r === 'Installation Team' ? 'Direct' : 'Indirect',
              updatedAt: new Date().toISOString(),
            }
          : u
      )
    );
    bump();
    show('Role updated', 'success');
  }

  return (
    <div className="min-w-0 space-y-3">
      <h2 className="text-base font-semibold text-foreground">User management</h2>
      <table className="w-full text-sm rounded-lg border border-border bg-card">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Username</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="px-3 py-2 text-left">Reset pwd</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">{u.username}</td>
              <td className="px-3 py-2">
                <select
                  disabled={!canDeleteUsers(role)}
                  value={u.role}
                  onChange={(e) => setUserRole(u.id, e.target.value as User['role'])}
                  className="rounded border px-2 py-1 text-xs"
                >
                  {(['Super Admin', 'Admin', 'CEO', 'Management', 'Salesperson', 'Installation Team'] as const).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                {canDeleteUsers(role) && (
                  <button
                    type="button"
                    className="text-primary text-xs"
                    onClick={() => {
                      const list = getCollection<User>('users');
                      setCollection(
                        'users',
                        list.map((x) => (x.id === u.id ? { ...x, password: 'reset123', updatedAt: new Date().toISOString() } : x))
                      );
                      bump();
                      show('Password reset to reset123', 'info');
                    }}
                  >
                    Reset
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompanyProfilePage() {
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const profile =
    getItem<CompanyProfile>('companyProfile') ?? {
      name: '',
      logo: '',
      gst: '',
      address: '',
      bankAccount: '',
    };
  const [form, setForm] = useState(profile);

  return (
    <div className="min-w-0 space-y-3">
      <h2 className="text-base font-semibold text-foreground">Company profile</h2>
      <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <label className="block text-sm">
          Name
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm">
          GST
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
        </label>
        <label className="block text-sm">
          Address
          <textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <label className="block text-sm">
          Bank
          <textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
        </label>
        <label className="block text-sm">
          Quotation discount approval threshold (₹ on subtotal, 0 = off)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.quotationDiscountApprovalThresholdInr ?? ''}
            placeholder="e.g. 25000 — block saves at or above"
            onChange={(e) =>
              setForm({
                ...form,
                quotationDiscountApprovalThresholdInr: e.target.value === '' ? undefined : Number(e.target.value) || 0,
              })
            }
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Non–Super Admin users cannot save a new quotation whose discount (₹ before GST) is at or above this amount.
          </span>
        </label>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => {
            setItem('companyProfile', form);
            bump();
            show('Saved', 'success');
          }}
        >
          Save
        </button>
      </div>
      <ResetDataSection />
    </div>
  );
}

function ResetDataSection() {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  function executeReset() {
    if (confirmPhrase.trim() !== 'RESET') {
      show('Type RESET exactly to confirm', 'error');
      return;
    }
    runSeed();
    show('Re-seeded', 'success');
    window.location.reload();
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
      <h2 className="font-semibold text-destructive">Danger zone</h2>
      <p className="mt-1 text-sm text-destructive/90">Clear localStorage and reload seed data.</p>
      <ShellButton type="button" variant="secondary" className="mt-2 border-destructive/50 text-destructive" onClick={() => setOpen(true)}>
        Reset data & re-seed…
      </ShellButton>
      <Modal open={open} title="Confirm full data reset" onClose={() => setOpen(false)}>
        <p className="mb-2 text-sm text-destructive">
          This wipes local demo data and reloads the seed. Type <strong>RESET</strong> to proceed.
        </p>
        <input
          className="input-shell mb-3 w-full"
          autoComplete="off"
          placeholder="Type RESET"
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <ShellButton type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </ShellButton>
          <ShellButton type="button" variant="primary" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={executeReset}>
            Reset and reload
          </ShellButton>
        </div>
      </Modal>
    </div>
  );
}

export function CompanyAndMasterPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <CompanyProfilePage />
        <MasterDataPage />
      </div>
    </div>
  );
}
