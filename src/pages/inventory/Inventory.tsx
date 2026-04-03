import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { Material, MaterialTransfer, Preset, Tool } from '../../types';

export function MaterialsList() {
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: '',
    category: 'Panel',
    purchaseUnit: 'Pcs' as Material['purchaseUnit'],
    issueUnit: 'Pcs' as Material['issueUnit'],
    conversionFactor: '',
    purchaseRate: '0',
    saleRateRetail: '0',
    minStock: '5',
    currentStock: '0',
    hsn: '85414011',
    sizeSpec: '',
  });

  const pageHeader = useMemo(
    () => ({
      title: 'Materials',
      subtitle: 'Stock levels, rates, and transfers',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => setOpen(true)}>
          Add material
        </ShellButton>
      ),
    }),
    []
  );
  usePageHeader(pageHeader);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Material>('materials');
    const m: Material = {
      id: generateId('mat'),
      name: f.name,
      category: f.category,
      sizeSpec: f.sizeSpec || 'std',
      purchaseUnit: f.purchaseUnit,
      issueUnit: f.issueUnit,
      conversionFactor: f.conversionFactor ? Number(f.conversionFactor) : undefined,
      purchaseRate: Number(f.purchaseRate) || 0,
      saleRateRetail: Number(f.saleRateRetail) || 0,
      saleRateWholesale: Number(f.saleRateRetail) * 0.92 || 0,
      hsn: f.hsn,
      minStock: Number(f.minStock) || 0,
      currentStock: Number(f.currentStock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollection('materials', [...list, m]);
    bump();
    setOpen(false);
    show('Material added', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/90">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Stock</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Min</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Retail</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr
                  key={m.id}
                  className={`border-t border-border transition hover:bg-muted/80 ${m.currentStock <= m.minStock ? 'bg-warning/10' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.currentStock} {m.purchaseUnit}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.minStock}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatINRDecimal(m.saleRateRetail)}</td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary hover:text-primary/90" to={`/inventory/materials/${m.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} title="Add material" onClose={() => setOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={save}>
          <label className="sm:col-span-2">
            <span className="text-xs">Name *</span>
            <input required className="mt-1 w-full rounded border px-3 py-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Category</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">HSN</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.hsn} onChange={(e) => setF({ ...f, hsn: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Purchase unit</span>
            <select className="mt-1 w-full rounded border px-3 py-2" value={f.purchaseUnit} onChange={(e) => setF({ ...f, purchaseUnit: e.target.value as Material['purchaseUnit'] })}>
              {(['Pcs', 'Foot', 'Meter', 'Kg'] as const).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs">Issue unit</span>
            <select className="mt-1 w-full rounded border px-3 py-2" value={f.issueUnit} onChange={(e) => setF({ ...f, issueUnit: e.target.value as Material['issueUnit'] })}>
              {(['Pcs', 'Foot', 'Meter', 'Kg'] as const).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          {f.purchaseUnit !== f.issueUnit && (
            <label className="sm:col-span-2">
              <span className="text-xs">Conversion factor (helper)</span>
              <input className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. grams per foot" value={f.conversionFactor} onChange={(e) => setF({ ...f, conversionFactor: e.target.value })} />
            </label>
          )}
          <label>
            <span className="text-xs">Purchase rate</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.purchaseRate} onChange={(e) => setF({ ...f, purchaseRate: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Retail rate</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.saleRateRetail} onChange={(e) => setF({ ...f, saleRateRetail: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Current stock</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.currentStock} onChange={(e) => setF({ ...f, currentStock: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Min stock</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={f.minStock} onChange={(e) => setF({ ...f, minStock: e.target.value })} />
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="rounded border px-4 py-2" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function MaterialDetail() {
  const { id } = useParams();
  const materials = useLiveCollection<Material>('materials');
  const transfers = useLiveCollection<MaterialTransfer>('materialTransfers');
  const m = materials.find((x) => x.id === id);
  if (!m) return <p>Not found</p>;
  const hist = transfers.filter((t) => t.materialId === id);
  return (
    <div className="space-y-4">
      <Link to="/inventory/materials" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{m.name}</h1>
      <p className="text-sm">
        Stock: {m.currentStock} {m.purchaseUnit} · Issue as {m.issueUnit}
        {m.purchaseUnit !== m.issueUnit && m.conversionFactor && ` · factor ${m.conversionFactor}`}
      </p>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Transfers out</h2>
        <ul className="mt-2 text-sm">
          {hist.map((t) => (
            <li key={t.date}>
              {t.date}: -{t.quantityDeductedPurchase}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ToolsList() {
  const tools = useLiveCollection<Tool>('tools');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const users = useLiveCollection<{ id: string; name: string }>('users');

  function add(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Tool>('tools');
    setCollection('tools', [
      ...list,
      {
        id: generateId('tool'),
        name,
        category: 'Installation',
        purchaseRate: 0,
        purchaseDate: new Date().toISOString().slice(0, 10),
        condition: 'Good',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    setName('');
    show('Tool added', 'success');
  }

  function setCondition(id: string, c: Tool['condition']) {
    const list = getCollection<Tool>('tools');
    setCollection(
      'tools',
      list.map((t) => (t.id === id ? { ...t, condition: c, lastUpdated: new Date().toISOString() } : t))
    );
    bump();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Tools</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add tool
        </button>
      </div>
      <table className="w-full overflow-hidden rounded-lg border border-border bg-card text-left text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Condition</th>
            <th className="px-3 py-2">Assign</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="px-3 py-2">{t.name}</td>
              <td className="px-3 py-2">
                <select value={t.condition} onChange={(e) => setCondition(t.id, e.target.value as Tool['condition'])} className="rounded border px-2 py-1 text-xs">
                  {(['Good', 'Under Repair', 'Damaged'] as const).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <select
                  className="rounded border px-2 py-1 text-xs"
                  value={t.assignedTo ?? ''}
                  onChange={(e) => {
                    const list = getCollection<Tool>('tools');
                    setCollection(
                      'tools',
                      list.map((x) =>
                        x.id === t.id ? { ...x, assignedTo: e.target.value || undefined, lastUpdated: new Date().toISOString() } : x
                      )
                    );
                    bump();
                  }}
                >
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={open} title="Add tool" onClose={() => setOpen(false)}>
        <form onSubmit={add} className="space-y-2">
          <input required className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}

export function PresetsPage() {
  const presets = useLiveCollection<Preset>('presets');
  const materials = useLiveCollection<Material>('materials');
  const [type, setType] = useState<Preset['type']>('Quotation');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [matId, setMatId] = useState('');
  const [qty, setQty] = useState('1');
  const [items, setItems] = useState<Preset['items']>([]);

  function addItem() {
    if (!matId) return;
    setItems([...items, { materialId: matId, quantity: Number(qty) || 1 }]);
    setQty('1');
  }

  function savePreset(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Preset>('presets');
    setCollection('presets', [
      ...list,
      {
        id: generateId('pre'),
        name,
        type,
        description: desc,
        items,
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    setOpen(false);
    setName('');
    setDesc('');
    setItems([]);
    show('Preset saved', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h1 className="text-2xl font-bold">Presets</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add preset
        </button>
      </div>
      <div className="flex gap-2">
        {(['Quotation', 'SiteChecklist'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setType(t)}
          >
            {t === 'SiteChecklist' ? 'Site checklist' : 'Quotation'}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {presets
          .filter((p) => p.type === type)
          .map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <strong>{p.name}</strong> — {p.description}
              <ul className="mt-1 text-xs text-muted-foreground">
                {p.items.map((it, i) => (
                  <li key={i}>
                    {materials.find((m) => m.id === it.materialId)?.name} × {it.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
      </ul>
      <Modal open={open} title="New preset" onClose={() => setOpen(false)} wide>
        <form className="space-y-3" onSubmit={savePreset}>
          <input required placeholder="Name" className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea placeholder="Description" className="w-full rounded border px-3 py-2" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as Preset['type'])}>
            <option value="Quotation">Quotation (Type A)</option>
            <option value="SiteChecklist">Site checklist (Type B)</option>
          </select>
          <div className="flex gap-2">
            <select className="flex-1 rounded border px-3 py-2" value={matId} onChange={(e) => setMatId(e.target.value)}>
              <option value="">Material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input type="number" className="w-24 rounded border px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />
            <button type="button" className="rounded bg-secondary px-3" onClick={addItem}>
              Add line
            </button>
          </div>
          <ul className="text-sm">
            {items.map((it, i) => (
              <li key={i}>
                {materials.find((m) => m.id === it.materialId)?.name} × {it.quantity}
              </li>
            ))}
          </ul>
          <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Save preset
          </button>
        </form>
      </Modal>
    </div>
  );
}
