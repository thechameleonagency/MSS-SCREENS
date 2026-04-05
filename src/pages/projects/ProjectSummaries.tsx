import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { formatINRDecimal } from '../../lib/helpers';
import { formatProgressStage } from '../../lib/progressStage';
import type { Agent, ChannelPartner, Customer, Partner, Project, Quotation, Site } from '../../types';

export function ProjectSummariesPage() {
  const projects = useLiveCollection<Project>('projects');
  const customers = useLiveCollection<Customer>('customers');
  const quotations = useLiveCollection<Quotation>('quotations');
  const agents = useLiveCollection<Agent>('agents');
  const partners = useLiveCollection<Partner>('partners');
  const channelPartners = useLiveCollection<ChannelPartner>('channelPartners');
  const sites = useLiveCollection<Site>('sites');

  usePageHeader({
    title: 'Project summaries',
    subtitle: 'Cross-project snapshot — financials, ownership, and execution health',
  });

  const rows = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((p) => {
        const cust = customers.find((c) => c.id === p.customerId);
        const quo = p.quotationId ? quotations.find((q) => q.id === p.quotationId) : undefined;
        const ag = p.agentId ? agents.find((a) => a.id === p.agentId) : undefined;
        const par = p.partnerId ? partners.find((x) => x.id === p.partnerId) : undefined;
        const ch = p.channelPartnerId ? channelPartners.find((x) => x.id === p.channelPartnerId) : undefined;
        const siteList = sites.filter((s) => s.projectId === p.id);
        const openBlk = p.blockages.filter((b) => !b.resolved).length;
        const done = p.progressSteps.filter((s) => s.status === 'Completed').length;
        const pct = Math.round((done / Math.max(1, p.progressSteps.length)) * 100);
        return {
          p,
          cust,
          quo,
          ag,
          par,
          ch,
          siteList,
          openBlk,
          pct,
        };
      });
  }, [projects, customers, quotations, agents, partners, channelPartners, sites]);

  const totals = useMemo(() => {
    const contract = projects.reduce((s, p) => s + p.contractAmount, 0);
    const quoted = projects.reduce((s, p) => {
      const q = p.quotationId ? quotations.find((x) => x.id === p.quotationId) : undefined;
      return s + (q?.effectivePrice ?? 0);
    }, 0);
    return { contract, quoted, n: projects.length };
  }, [projects, quotations]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card padding="md" className="border-border/80">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projects</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totals.n}</p>
        </Card>
        <Card padding="md" className="border-border/80">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total contract (₹)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatINRDecimal(totals.contract)}</p>
        </Card>
        <Card padding="md" className="border-border/80">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Linked quotations total (₹)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatINRDecimal(totals.quoted)}</p>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden border-border/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Contract</th>
                <th className="px-4 py-3 text-right">Quote</th>
                <th className="px-4 py-3">Commercial</th>
                <th className="px-4 py-3">Execution</th>
                <th className="px-4 py-3 w-24">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, cust, quo, ag, par, ch, siteList, openBlk, pct }) => (
                <tr key={p.id} className="border-b border-border/60 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 align-top">
                    <Link className="font-semibold text-primary hover:underline" to={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.capacity} kW · {p.category}</p>
                    {!p.quotationId && (
                      <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-200">
                        Direct deal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{cust?.name ?? '—'}</td>
                  <td className="px-4 py-3 align-top text-xs">{p.type}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 align-top text-right tabular-nums font-medium">{formatINRDecimal(p.contractAmount)}</td>
                  <td className="px-4 py-3 align-top text-right tabular-nums text-muted-foreground">
                    {quo ? (
                      <Link className="text-primary hover:underline" to={`/sales/quotations/${quo.id}`}>
                        {formatINRDecimal(quo.effectivePrice)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {ag && <div>Agent: {ag.fullName}</div>}
                    {par && <div>Partner: {par.name}</div>}
                    {ch && <div>OEM: {ch.name}</div>}
                    {!ag && !par && !ch && '—'}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <div className="font-medium text-foreground">{formatProgressStage(p)}</div>
                    <div className="text-muted-foreground">{siteList.length} site(s) · {pct}% steps</div>
                    {openBlk > 0 && <div className="text-destructive">{openBlk} open blockage(s)</div>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      className="text-xs font-medium text-primary hover:underline"
                      to={`/projects/${p.id}`}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No projects in the workspace.</p>
        )}
      </Card>
    </div>
  );
}
