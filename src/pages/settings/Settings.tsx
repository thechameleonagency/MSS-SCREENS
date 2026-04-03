import { useState } from 'react';
import { useToast, useDataRefresh, useRole } from '../../contexts/AppProviders';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { canDeleteUsers, canEditSettings } from '../../lib/permissions';
import { runSeed } from '../../lib/seedData';
import { generateId, getCollection, getItem, setCollection, setItem } from '../../lib/storage';
import type { CompanyProfile, MasterData, User } from '../../types';

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Master data</h1>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <select className="rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as MasterData['type'])}>
          {(['PanelBrand', 'InverterBrand', 'StructureType', 'SystemCapacity', 'ExpenseMainCategory'] as const).map((t) => (
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
      <ul className="text-sm space-y-1">
        {items.map((m) => (
          <li key={m.id}>
            {m.type}: {m.value}
          </li>
        ))}
      </ul>
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User management</h1>
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
                  {(['Super Admin', 'Admin', 'Management', 'Salesperson', 'Installation Team'] as const).map((r) => (
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
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Company profile</h1>
      <div className="space-y-3 rounded-lg border bg-card p-4">
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
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
      <h2 className="font-semibold text-destructive">Danger zone</h2>
      <p className="mt-1 text-sm text-destructive/90">Clear localStorage and reload seed data.</p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground"
        onClick={() => {
          if (!window.confirm('Reset all data?')) return;
          runSeed();
          show('Re-seeded', 'success');
          window.location.reload();
        }}
      >
        Reset data & re-seed
      </button>
    </div>
  );
}
