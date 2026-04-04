import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatProgressStage } from '../../lib/progressStage';
import type { Customer, Project, Site } from '../../types';

const FILTERS = [
  { key: 'fileLogin', label: 'File login' },
  { key: 'subsidyType', label: 'Subsidy' },
  { key: 'bankFileType', label: 'Bank file' },
  { key: 'loanStage', label: 'Loan stage' },
  { key: 'workStatus', label: 'Work status' },
  { key: 'discomStatus', label: 'DISCOM' },
  { key: 'paymentStatus', label: 'Payment' },
] as const;

export function ActiveSitesPage() {
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const sites = useLiveCollection<Site>('sites');
  const [q, setQ] = useState('');
  const [filterKey, setFilterKey] = useState<string>('');
  const [filterVal, setFilterVal] = useState('');

  const active = useMemo(
    () => projects.filter((p) => p.status === 'In Progress' || p.status === 'On Hold'),
    [projects]
  );

  const filtered = useMemo(() => {
    return active.filter((p) => {
      const cust = customers.find((c) => c.id === p.customerId);
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (cust?.name.toLowerCase().includes(q.toLowerCase()) ?? false);
      if (!filterKey || !filterVal) return matchQ;
      const op = p.operational?.[filterKey as keyof NonNullable<Project['operational']>];
      return matchQ && String(op ?? '').toLowerCase().includes(filterVal.toLowerCase());
    });
  }, [active, customers, q, filterKey, filterVal]);

  usePageHeader({
    title: 'Active sites',
    subtitle: `Operational board · ${filtered.length} site(s) · last refresh ${new Date().toLocaleTimeString()}`,
  });

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="block flex-1 min-w-[12rem] text-sm font-medium">
            Search
            <input className="input-shell mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Project or client" />
          </label>
          <label className="block w-full text-sm font-medium lg:w-40">
            Filter field
            <select className="select-shell mt-1 w-full" value={filterKey} onChange={(e) => setFilterKey(e.target.value)}>
              <option value="">Any</option>
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full text-sm font-medium lg:w-48">
            Contains
            <input className="input-shell mt-1" value={filterVal} onChange={(e) => setFilterVal(e.target.value)} disabled={!filterKey} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Set operational fields on each project (detail → edit) to drive filters. Prototype keys: fileLogin, subsidyType, bankFileType, loanStage,
          workStatus, discomStatus, paymentStatus.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const cust = customers.find((c) => c.id === p.customerId);
          const firstSite = sites.find((s) => s.projectId === p.id);
          const projectTo =
            firstSite != null
              ? `/projects/${p.id}?site=${encodeURIComponent(firstSite.id)}`
              : `/projects/${p.id}`;
          const done = p.progressSteps.filter((s) => s.status === 'Completed').length;
          const pct = Math.round((done / Math.max(1, p.progressSteps.length)) * 100);
          return (
            <Card key={p.id} padding="md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{cust?.name}</p>
                </div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{p.status}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-primary">{formatProgressStage(p)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{p.capacity} kW · {p.address.slice(0, 40)}…</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{pct}% steps completed</p>
              <Link
                to={projectTo}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-md border border-input bg-secondary text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
              >
                Open project
              </Link>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground">No matching active projects.</p>}
    </div>
  );
}
