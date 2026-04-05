import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal, issueToPurchaseQty } from '../../lib/helpers';
import { annualDepreciationSlm, annualDepreciationWdvFirstYear } from '../../lib/toolDepreciation';
import { MATERIAL_CATEGORIES, TOOL_CATEGORIES } from '../../lib/inventoryConstants';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { Material, MaterialReturn, MaterialTransfer, Preset, Project, Site, Tool, ToolMovement } from '../../types';

export function MaterialsList() {
  const materials = useLiveCollection<Material>('materials');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [f, setF] = useState({
    name: '',
    category: MATERIAL_CATEGORIES[0] as Material['category'],
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

  const visible = catFilter ? materials.filter((m) => m.category === catFilter) : materials;

  const totalUnits = useMemo(() => visible.reduce((s, m) => s + m.currentStock, 0), [visible]);
  const stockValue = useMemo(() => visible.reduce((s, m) => s + m.currentStock * m.purchaseRate, 0), [visible]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Material[]>();
    for (const m of visible) {
      const g = map.get(m.category) ?? [];
      g.push(m);
      map.set(m.category, g);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Items shown</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{visible.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total units (qty)</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalUnits.toLocaleString('en-IN')}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Stock value (at cost)</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{formatINRDecimal(stockValue)}</p>
        </Card>
        <Card padding="md">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Filter by category
            <select className="select-shell mt-2 w-full" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </Card>
      </div>
      {byCategory.map(([cat, rows]) => (
        <Card key={cat} padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">
              {cat}{' '}
              <span className="font-normal text-muted-foreground">({rows.length} items)</span>
            </h3>
            <span className="text-xs text-muted-foreground">
              Σ units {rows.reduce((s, m) => s + m.currentStock, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Spec / size</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Stock</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Min</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Retail</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-t border-border transition hover:bg-muted/80 ${m.currentStock <= m.minStock ? 'bg-warning/10' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">{m.name}</td>
                    <td className="max-w-[10rem] truncate px-4 py-2.5 text-xs text-muted-foreground">{m.sizeSpec || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {m.currentStock} {m.issueUnit}
                      {m.purchaseUnit !== m.issueUnit && (
                        <span className="block text-[10px] text-muted-foreground/80">store: {m.purchaseUnit}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.minStock}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{formatINRDecimal(m.saleRateRetail)}</td>
                    <td className="px-4 py-2.5">
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
      ))}
      <Modal open={open} title="Add material" onClose={() => setOpen(false)} wide>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={save}>
          <label className="sm:col-span-2">
            <span className="text-xs">Name *</span>
            <input required className="mt-1 w-full rounded border px-3 py-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label>
            <span className="text-xs">Category</span>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value as Material['category'] })}
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
  const returns = useLiveCollection<MaterialReturn>('materialReturns');
  const projects = useLiveCollection<Project>('projects');
  const sites = useLiveCollection<Site>('sites');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [issueOpen, setIssueOpen] = useState(false);
  const [retOpen, setRetOpen] = useState(false);
  const [scrapOpen, setScrapOpen] = useState(false);
  const [pid, setPid] = useState(projects[0]?.id ?? '');
  const [sid, setSid] = useState('');
  const [issueQty, setIssueQty] = useState('1');
  const [retQty, setRetQty] = useState('1');
  const [retNotes, setRetNotes] = useState('');
  const [scrapQty, setScrapQty] = useState('1');
  const [scrapNotes, setScrapNotes] = useState('');

  const m = materials.find((x) => x.id === id);
  if (!m) return <p>Not found</p>;
  const mat = m;
  const hist = transfers.filter((t) => t.materialId === id);
  const retHist = returns.filter((r) => r.materialId === id && r.action !== 'scrap');
  const scrapHist = returns.filter((r) => r.materialId === id && r.action === 'scrap');
  const projSites = sites.filter((s) => s.projectId === pid);

  function issueToProject() {
    const qtyIssue = Number(issueQty) || 0;
    if (!qtyIssue || !pid) {
      show('Project and quantity required', 'error');
      return;
    }
    const deduct = issueToPurchaseQty(qtyIssue, mat);
    if (deduct > mat.currentStock) {
      show('Insufficient stock', 'error');
      return;
    }
    setCollection(
      'materials',
      getCollection<Material>('materials').map((x) =>
        x.id === mat.id ? { ...x, currentStock: x.currentStock - deduct, updatedAt: new Date().toISOString() } : x
      )
    );
    const mt = getCollection<MaterialTransfer>('materialTransfers');
    const d = new Date().toISOString().slice(0, 10);
    setCollection('materialTransfers', [
      ...mt,
      {
        id: generateId('xfer'),
        materialId: mat.id,
        projectId: pid,
        siteId: sid || undefined,
        quantityInIssueUnit: qtyIssue,
        quantityDeductedPurchase: deduct,
        date: d,
        createdAt: new Date().toISOString(),
      },
    ]);
    const projs = getCollection<Project>('projects');
    setCollection(
      'projects',
      projs.map((proj) =>
        proj.id !== pid
          ? proj
          : {
              ...proj,
              materialsSent: [
                ...(proj.materialsSent ?? []),
                {
                  id: generateId('msent'),
                  materialId: mat.id,
                  quantity: qtyIssue,
                  date: d,
                  siteId: sid || undefined,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
      )
    );
    bump();
    setIssueOpen(false);
    show('Issued to project', 'success');
  }

  function returnToStock() {
    const qtyIssue = Number(retQty) || 0;
    if (!qtyIssue || !pid) {
      show('Project and quantity required', 'error');
      return;
    }
    const add = issueToPurchaseQty(qtyIssue, mat);
    const mats = getCollection<Material>('materials');
    setCollection(
      'materials',
      mats.map((x) =>
        x.id === mat.id ? { ...x, currentStock: x.currentStock + add, updatedAt: new Date().toISOString() } : x
      )
    );
    const mr = getCollection<MaterialReturn>('materialReturns');
    const rec: MaterialReturn = {
      id: generateId('mret'),
      materialId: mat.id,
      projectId: pid,
      siteId: sid || undefined,
      quantityInIssueUnit: qtyIssue,
      action: 'to_stock',
      conditionNotes: retNotes || undefined,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    setCollection('materialReturns', [...mr, rec]);
    bump();
    setRetOpen(false);
    show('Return recorded; stock increased', 'success');
  }

  function recordScrap() {
    const qtyIssue = Number(scrapQty) || 0;
    if (!qtyIssue) {
      show('Quantity required', 'error');
      return;
    }
    const deduct = issueToPurchaseQty(qtyIssue, mat);
    if (deduct > mat.currentStock) {
      show('Insufficient stock to scrap', 'error');
      return;
    }
    setCollection(
      'materials',
      getCollection<Material>('materials').map((x) =>
        x.id === mat.id ? { ...x, currentStock: x.currentStock - deduct, updatedAt: new Date().toISOString() } : x
      )
    );
    const mr = getCollection<MaterialReturn>('materialReturns');
    const rec: MaterialReturn = {
      id: generateId('scrap'),
      materialId: mat.id,
      projectId: pid || undefined,
      siteId: sid || undefined,
      quantityInIssueUnit: qtyIssue,
      action: 'scrap',
      conditionNotes: scrapNotes || undefined,
      damageReason: scrapNotes || undefined,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    setCollection('materialReturns', [...mr, rec]);
    bump();
    setScrapOpen(false);
    setScrapNotes('');
    show('Scrap recorded; stock reduced', 'success');
  }

  return (
    <div className="space-y-4">
      <Link to="/inventory/materials" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{mat.name}</h1>
      <p className="text-sm">
        Category: {mat.category} · Stock: {mat.currentStock} {mat.purchaseUnit} · Issue as {mat.issueUnit}
        {mat.purchaseUnit !== mat.issueUnit && mat.conversionFactor && ` · factor ${mat.conversionFactor}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <ShellButton type="button" variant="primary" onClick={() => setIssueOpen(true)}>
          Issue to project
        </ShellButton>
        <ShellButton type="button" variant="secondary" onClick={() => setRetOpen(true)}>
          Return to stock
        </ShellButton>
        <ShellButton type="button" variant="ghost" onClick={() => setScrapOpen(true)}>
          Record scrap
        </ShellButton>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Transfers out</h2>
        <ul className="mt-2 text-sm">
          {hist.map((t) => (
            <li key={t.id}>
              {t.date}: −{t.quantityDeductedPurchase} ({t.quantityInIssueUnit} {mat.issueUnit}) → project{' '}
              {projects.find((p) => p.id === t.projectId)?.name ?? t.projectId}
            </li>
          ))}
          {hist.length === 0 && <li className="text-muted-foreground">No issues yet.</li>}
        </ul>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Returns</h2>
        <ul className="mt-2 text-sm">
          {retHist.map((r) => (
            <li key={r.id}>
              {r.date}: +{r.quantityInIssueUnit} {mat.issueUnit} ({r.action})
            </li>
          ))}
          {retHist.length === 0 && <li className="text-muted-foreground">No returns.</li>}
        </ul>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Scrap / write-off</h2>
        <ul className="mt-2 text-sm">
          {scrapHist.map((r) => (
            <li key={r.id}>
              {r.date}: −{r.quantityInIssueUnit} {mat.issueUnit}
              {r.conditionNotes ? ` — ${r.conditionNotes}` : ''}
            </li>
          ))}
          {scrapHist.length === 0 && <li className="text-muted-foreground">No scrap entries.</li>}
        </ul>
      </div>

      <Modal open={issueOpen} title="Issue to project" onClose={() => setIssueOpen(false)} wide>
        <div className="space-y-3 text-sm">
          <label className="block">
            Project
            <select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Site (optional)
            <select className="mt-1 w-full rounded border px-3 py-2" value={sid} onChange={(e) => setSid(e.target.value)}>
              <option value="">—</option>
              {projSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Qty ({mat.issueUnit})
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-3 py-2"
              value={issueQty}
              onChange={(e) => setIssueQty(e.target.value)}
            />
          </label>
          <ShellButton type="button" variant="primary" onClick={issueToProject}>
            Confirm issue
          </ShellButton>
        </div>
      </Modal>

      <Modal open={retOpen} title="Return to stock" onClose={() => setRetOpen(false)} wide>
        <div className="space-y-3 text-sm">
          <label className="block">
            From project
            <select className="mt-1 w-full rounded border px-3 py-2" value={pid} onChange={(e) => setPid(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Site (optional)
            <select className="mt-1 w-full rounded border px-3 py-2" value={sid} onChange={(e) => setSid(e.target.value)}>
              <option value="">—</option>
              {projSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Qty ({mat.issueUnit})
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-3 py-2"
              value={retQty}
              onChange={(e) => setRetQty(e.target.value)}
            />
          </label>
          <label className="block">
            Notes
            <input className="mt-1 w-full rounded border px-3 py-2" value={retNotes} onChange={(e) => setRetNotes(e.target.value)} />
          </label>
          <ShellButton type="button" variant="primary" onClick={returnToStock}>
            Record return
          </ShellButton>
        </div>
      </Modal>

      <Modal open={scrapOpen} title="Record scrap (write-off)" onClose={() => setScrapOpen(false)} wide>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Reduces warehouse stock. Use for damaged or unusable material.</p>
          <label className="block">
            Qty ({mat.issueUnit})
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-3 py-2"
              value={scrapQty}
              onChange={(e) => setScrapQty(e.target.value)}
            />
          </label>
          <label className="block">
            Reason / notes
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={scrapNotes}
              onChange={(e) => setScrapNotes(e.target.value)}
            />
          </label>
          <ShellButton type="button" variant="primary" onClick={recordScrap}>
            Confirm scrap
          </ShellButton>
        </div>
      </Modal>
    </div>
  );
}

export function ToolsList() {
  const tools = useLiveCollection<Tool>('tools');
  const movements = useLiveCollection<ToolMovement>('toolMovements');
  const sites = useLiveCollection<Site>('sites');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [newCat, setNewCat] = useState<string>(TOOL_CATEGORIES[0]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selTool, setSelTool] = useState<Tool | null>(null);
  const [issueEmp, setIssueEmp] = useState('');
  const [issueSite, setIssueSite] = useState('');
  const users = useLiveCollection<{ id: string; name: string }>('users');

  const toolHeader = useMemo(
    () => ({
      title: 'Tools',
      subtitle: 'Categories, assignment, issue/return trail',
      actions: (
        <ShellButton type="button" variant="primary" onClick={() => setOpen(true)}>
          Add tool
        </ShellButton>
      ),
    }),
    []
  );
  usePageHeader(toolHeader);

  const depreciationRows = useMemo(() => {
    return tools.map((t) => {
      const salvage = t.salvageValue ?? 0;
      const life = t.usefulLifeYears ?? 0;
      const slm =
        t.depreciationMethod === 'SLM' && life > 0 ? annualDepreciationSlm(t.purchaseRate, salvage, life) : null;
      const wdv =
        t.depreciationMethod === 'WDV' && (t.wdvRatePercent ?? 0) > 0
          ? annualDepreciationWdvFirstYear(t.purchaseRate, t.wdvRatePercent ?? 0)
          : null;
      return { t, slm, wdv };
    });
  }, [tools]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Tool>('tools');
    setCollection('tools', [
      ...list,
      {
        id: generateId('tool'),
        name,
        category: newCat,
        purchaseRate: 0,
        purchaseDate: new Date().toISOString().slice(0, 10),
        condition: 'Good',
        lifecycleStatus: 'Available',
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
      list.map((t) => {
        if (t.id !== id) return t;
        const lifecycleStatus = c === 'Not Working' ? ('Under Repair' as const) : t.lifecycleStatus;
        return { ...t, condition: c, lifecycleStatus, lastUpdated: new Date().toISOString() };
      })
    );
    bump();
  }

  function recordIssue() {
    if (!selTool || !issueEmp) {
      show('Select employee', 'error');
      return;
    }
    if (selTool.condition === 'Not Working' || selTool.lifecycleStatus === 'Under Repair') {
      show('Tool is not working or under repair — cannot issue until verified.', 'error');
      return;
    }
    const list = getCollection<Tool>('tools');
    setCollection(
      'tools',
      list.map((x) =>
        x.id === selTool.id
          ? {
              ...x,
              assignedTo: issueEmp,
              siteId: issueSite || undefined,
              lifecycleStatus: 'In Use' as const,
              lastUpdated: new Date().toISOString(),
            }
          : x
      )
    );
    const mv = getCollection<ToolMovement>('toolMovements');
    const row: ToolMovement = {
      id: generateId('tm'),
      toolId: selTool.id,
      type: 'issue',
      employeeId: issueEmp,
      siteId: issueSite || undefined,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    setCollection('toolMovements', [...mv, row]);
    bump();
    setIssueOpen(false);
    setSelTool(null);
    show('Tool issued', 'success');
  }

  function recordReturn(tool: Tool) {
    const list = getCollection<Tool>('tools');
    setCollection(
      'tools',
      list.map((x) =>
        x.id === tool.id
          ? {
              ...x,
              assignedTo: undefined,
              siteId: undefined,
              lifecycleStatus: 'Available' as const,
              lastUpdated: new Date().toISOString(),
            }
          : x
      )
    );
    const mv = getCollection<ToolMovement>('toolMovements');
    setCollection('toolMovements', [
      ...mv,
      {
        id: generateId('tm'),
        toolId: tool.id,
        type: 'return',
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      },
    ]);
    bump();
    show('Tool returned', 'success');
  }

  const toolStats = useMemo(() => {
    const total = tools.length;
    const avail = tools.filter((t) => (t.lifecycleStatus ?? 'Available') === 'Available').length;
    const inUse = tools.filter((t) => t.lifecycleStatus === 'In Use').length;
    const repair = tools.filter((t) => t.lifecycleStatus === 'Under Repair').length;
    return { total, avail, inUse, repair };
  }, [tools]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total tools</p>
          <p className="mt-1 text-2xl font-semibold">{toolStats.total}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Available</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{toolStats.avail}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">In use</p>
          <p className="mt-1 text-2xl font-semibold">{toolStats.inUse}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase text-muted-foreground">Under repair</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-400">{toolStats.repair}</p>
        </Card>
      </div>
      <Card padding="none" className="overflow-hidden">
        <table className="w-full overflow-hidden text-left text-sm">
          <thead className="border-b border-border bg-muted/90">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Condition</th>
              <th className="px-3 py-2">Assign</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.category}</td>
                <td className="px-3 py-2 text-xs">{t.lifecycleStatus ?? '—'}</td>
                <td className="px-3 py-2">
                  <select value={t.condition} onChange={(e) => setCondition(t.id, e.target.value as Tool['condition'])} className="rounded border px-2 py-1 text-xs">
                    {(['Good', 'Minor Damage', 'Major Damage', 'Not Working'] as const).map((c) => (
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
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <ShellButton type="button" size="sm" variant="secondary" onClick={() => { setSelTool(t); setIssueEmp(t.assignedTo ?? users[0]?.id ?? ''); setIssueSite(t.siteId ?? ''); setIssueOpen(true); }}>
                      Issue log
                    </ShellButton>
                    {(t.lifecycleStatus === 'In Use' || t.assignedTo) && (
                      <ShellButton type="button" size="sm" variant="ghost" onClick={() => recordReturn(t)}>
                        Return
                      </ShellButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Depreciation (stub report)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          SLM = straight-line annual ₹; WDV = first-year charge on cost at rate % (simplified block).
        </p>
        <div className="mt-3 overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1 pr-2">Tool</th>
                <th className="py-1 pr-2">Method</th>
                <th className="py-1 pr-2">Annual est.</th>
              </tr>
            </thead>
            <tbody>
              {depreciationRows.map(({ t, slm, wdv }) => (
                <tr key={t.id} className="border-t border-border/60">
                  <td className="py-1 pr-2">{t.name}</td>
                  <td className="py-1 pr-2">{t.depreciationMethod ?? '—'}</td>
                  <td className="py-1 pr-2 tabular-nums">
                    {slm != null && formatINRDecimal(slm)}
                    {wdv != null && formatINRDecimal(wdv)}
                    {slm == null && wdv == null && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-sm font-semibold text-foreground">Recent movements</h2>
        <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-muted-foreground">
          {movements
            .slice(-20)
            .reverse()
            .map((mv) => (
              <li key={mv.id}>
                {mv.date} · {mv.type} · tool {tools.find((x) => x.id === mv.toolId)?.name ?? mv.toolId}
              </li>
            ))}
        </ul>
      </Card>
      <Modal open={open} title="Add tool" onClose={() => setOpen(false)} wide>
        <form onSubmit={add} className="space-y-2">
          <input required className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block text-sm">
            Category
            <select className="mt-1 w-full rounded border px-3 py-2" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
              {TOOL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <ShellButton type="submit" variant="primary">
            Save
          </ShellButton>
        </form>
      </Modal>
      <Modal open={issueOpen} title="Record tool issue" onClose={() => setIssueOpen(false)} wide>
        <div className="space-y-2 text-sm">
          <label className="block">
            Employee
            <select className="mt-1 w-full rounded border px-3 py-2" value={issueEmp} onChange={(e) => setIssueEmp(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Site (optional)
            <select className="mt-1 w-full rounded border px-3 py-2" value={issueSite} onChange={(e) => setIssueSite(e.target.value)}>
              <option value="">—</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <ShellButton type="button" variant="primary" onClick={recordIssue}>
            Save movement
          </ShellButton>
        </div>
      </Modal>
    </div>
  );
}

export function PresetsPage() {
  const presets = useLiveCollection<Preset>('presets');
  const materials = useLiveCollection<Material>('materials');
  const [type, setType] = useState<Preset['type']>('Quotation');
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'quotation' | 'invoice'>('all');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [matId, setMatId] = useState('');
  const [qty, setQty] = useState('1');
  const [items, setItems] = useState<Preset['items']>([]);
  const [capCat, setCapCat] = useState<Preset['capacityCategory']>('Residential');
  const [capKw, setCapKw] = useState('5');
  const [panelBrand, setPanelBrand] = useState('');
  const [inverterBrand, setInverterBrand] = useState('');

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
        capacityCategory: type === 'Quotation' || type === 'Invoice' ? capCat : undefined,
        capacityKW: type === 'Quotation' || type === 'Invoice' ? Number(capKw) || undefined : undefined,
        panelBrand: panelBrand || undefined,
        inverterBrand: inverterBrand || undefined,
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

  const summary = useMemo(() => {
    const res = presets.filter((p) => p.capacityCategory === 'Residential').length;
    const com = presets.filter((p) => p.capacityCategory === 'Commercial').length;
    const ind = presets.filter((p) => p.capacityCategory === 'Industrial').length;
    return { total: presets.length, res, com, ind };
  }, [presets]);

  const typeFiltered = useMemo(() => {
    let list = presets.filter((p) => p.type === type);
    if (purposeFilter === 'quotation') list = list.filter((p) => p.type === 'Quotation');
    if (purposeFilter === 'invoice') list = list.filter((p) => p.type === 'Invoice');
    return list;
  }, [presets, type, purposeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h1 className="text-2xl font-bold">Presets</h1>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
          Add preset
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Total presets</p>
          <p className="mt-1 text-2xl font-semibold">{summary.total}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Residential</p>
          <p className="mt-1 text-2xl font-semibold">{summary.res}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Commercial</p>
          <p className="mt-1 text-2xl font-semibold">{summary.com}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-muted-foreground">Industrial</p>
          <p className="mt-1 text-2xl font-semibold">{summary.ind}</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['Quotation', 'Invoice', 'SiteChecklist'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setType(t)}
          >
            {t === 'SiteChecklist' ? 'Site checklist' : t === 'Invoice' ? 'Invoice preset' : 'Quotation'}
          </button>
        ))}
      </div>
      {(type === 'Quotation' || type === 'Invoice') && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['quotation', 'For quotations'],
              ['invoice', 'For invoice & inventory matching'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                purposeFilter === k ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setPurposeFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-2">
        {typeFiltered.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-card p-4 text-sm shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <strong className="text-foreground">{p.name}</strong>
                <p className="mt-0.5 text-muted-foreground">{p.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {p.type === 'Invoice' ? 'Invoice & inventory' : p.type}
              </span>
            </div>
            {(p.capacityCategory || p.capacityKW != null) && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{p.capacityKW != null ? `${p.capacityKW} kW` : ''}</span>
                {p.capacityCategory && ` · ${p.capacityCategory}`}
                {p.panelBrand && ` · Panels: ${p.panelBrand}`}
                {p.inverterBrand && ` · Inverter: ${p.inverterBrand}`}
                {p.structureType && ` · Structure: ${p.structureType}`}
              </p>
            )}
            <p className="mt-1 text-xs font-medium text-tertiary">{p.items.length} line items in BOM</p>
            {p.estimatedCost != null && (
              <p className="text-xs text-muted-foreground">Est. cost {formatINRDecimal(p.estimatedCost)}</p>
            )}
            <ul className="mt-2 max-h-28 overflow-y-auto text-xs text-muted-foreground">
              {p.items.slice(0, 8).map((it, i) => (
                <li key={i}>
                  {materials.find((m) => m.id === it.materialId)?.name} × {it.quantity}
                </li>
              ))}
              {p.items.length > 8 && <li>… +{p.items.length - 8} more</li>}
            </ul>
          </li>
        ))}
      </ul>
      <Modal open={open} title="New preset" onClose={() => setOpen(false)} wide>
        <form className="space-y-3" onSubmit={savePreset}>
          <input required placeholder="Name" className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea placeholder="Description" className="w-full rounded border px-3 py-2" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as Preset['type'])}>
            <option value="Quotation">Quotation</option>
            <option value="Invoice">Invoice</option>
            <option value="SiteChecklist">Site checklist</option>
          </select>
          {(type === 'Quotation' || type === 'Invoice') && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                Capacity category
                <select className="mt-1 w-full rounded border px-3 py-2" value={capCat} onChange={(e) => setCapCat(e.target.value as Preset['capacityCategory'])}>
                  {(['Residential', 'Commercial', 'Industrial'] as const).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                kW
                <input className="mt-1 w-full rounded border px-3 py-2" value={capKw} onChange={(e) => setCapKw(e.target.value)} />
              </label>
              <label className="text-sm sm:col-span-2">
                Panel brand (optional)
                <input className="mt-1 w-full rounded border px-3 py-2" value={panelBrand} onChange={(e) => setPanelBrand(e.target.value)} />
              </label>
              <label className="text-sm sm:col-span-2">
                Inverter brand (optional)
                <input className="mt-1 w-full rounded border px-3 py-2" value={inverterBrand} onChange={(e) => setInverterBrand(e.target.value)} />
              </label>
            </div>
          )}
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
