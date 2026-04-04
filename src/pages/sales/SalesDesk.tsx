import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useRole } from '../../contexts/AppProviders';
import { canAccessPath } from '../../lib/permissions';

const LINKS: { to: string; label: string; description: string }[] = [
  { to: '/sales/enquiries', label: 'Enquiries', description: 'Pipeline, notes, and follow-ups' },
  { to: '/sales/agents', label: 'Agents', description: 'Commission and agent records' },
  { to: '/sales/quotations', label: 'Quotations', description: 'Solar / other, PDF, share history' },
  { to: '/sales/customers', label: 'Customers', description: 'GSTIN, history, and contacts' },
];

export function SalesDesk() {
  const { role } = useRole();
  const header = useMemo(
    () => ({
      title: 'Sales desk',
      subtitle: 'Enquiries through closure — open a workspace below',
    }),
    []
  );
  usePageHeader(header);

  const links = LINKS.filter((l) => canAccessPath(role, l.to));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="block">
          <Card interactive className="h-full">
            <div className="font-semibold text-foreground">{l.label}</div>
            <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
