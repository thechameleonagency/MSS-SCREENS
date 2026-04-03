import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ShellButton } from '../../components/ShellButton';
import { useToast, useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { Agent } from '../../types';

export function AgentsList() {
  const agents = useLiveCollection<Agent>('agents');
  const { bump } = useDataRefresh();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const pageHeader = useMemo(
    () => ({
      title: 'Sales agents',
      subtitle: 'Channel partners, rates, and commission',
      actions: (
        <ShellButton variant="primary" type="button" onClick={() => setOpen(true)}>
          Add agent
        </ShellButton>
      ),
    }),
    []
  );
  usePageHeader(pageHeader);
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    rateType: 'Per kW' as Agent['rateType'],
    rate: '1000',
    address: '',
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    const list = getCollection<Agent>('agents');
    const a: Agent = {
      id: generateId('agt'),
      photo: '',
      fullName: form.fullName,
      mobile: form.mobile.replace(/\D/g, '').slice(-10),
      email: form.email,
      rateType: form.rateType,
      rate: Number(form.rate) || 0,
      address: form.address,
      totalCommission: 0,
      paidCommission: 0,
      createdAt: new Date().toISOString(),
    };
    setCollection('agents', [...list, a]);
    bump();
    setOpen(false);
    show('Agent added', 'success');
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/90">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Mobile</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Rate</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Commission</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-border transition hover:bg-muted/80">
                  <td className="px-4 py-3 font-medium text-foreground">{a.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.mobile}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    ₹{a.rate} {a.rateType === 'Per kW' ? '/kW' : ' flat'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    ₹{a.paidCommission} / ₹{a.totalCommission}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-primary transition hover:text-primary/90"
                      to={`/sales/agents/${a.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} title="Add agent" onClose={() => setOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Full name *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Mobile *</span>
            <input
              required
              className="input-shell mt-1"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="input-shell mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Rate type</span>
            <select
              className="select-shell mt-1"
              value={form.rateType}
              onChange={(e) => setForm({ ...form, rateType: e.target.value as Agent['rateType'] })}
            >
              <option value="Per kW">Per kW</option>
              <option value="Flat">Flat</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Rate (₹)</span>
            <input
              className="input-shell mt-1"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Address</span>
            <textarea
              className="input-shell mt-1 min-h-[4rem]"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <ShellButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ShellButton>
            <ShellButton type="submit" variant="primary">
              Save
            </ShellButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agents = useLiveCollection<Agent>('agents');
  const enquiries = useLiveCollection<{ id: string; source: { agentId?: string } }>('enquiries');
  const projects = useLiveCollection<{ id: string; agentId?: string; name: string }>('projects');
  const a = agents.find((x) => x.id === id);

  const detailHeader = useMemo(() => {
    if (!a) return { title: 'Agent', subtitle: '' };
    return {
      title: a.fullName,
      subtitle: 'Profile, referrals, and linked projects',
      actions: (
        <ShellButton variant="secondary" type="button" onClick={() => navigate('/sales/agents')}>
          ← Back to list
        </ShellButton>
      ),
    };
  }, [a, navigate]);
  usePageHeader(detailHeader);

  if (!a) return <p className="text-muted-foreground">Not found</p>;
  const referred = enquiries.filter((e) => e.source.agentId === a.id).length;
  const projs = projects.filter((p) => p.agentId === a.id);
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 text-base font-semibold text-foreground">Contact & rates</h2>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Mobile</span>
            <br />
            <span className="font-medium text-foreground">{a.mobile}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Email</span>
            <br />
            <span className="font-medium text-foreground">{a.email || '—'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Rate</span>
            <br />
            <span className="font-medium text-foreground">
              ₹{a.rate} ({a.rateType})
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Commission</span>
            <br />
            <span className="font-medium text-foreground">
              ₹{a.paidCommission} / ₹{a.totalCommission}
            </span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Address</span>
            <br />
            <span className="font-medium text-foreground">{a.address || '—'}</span>
          </p>
        </div>
      </Card>
      <Card>
        <h2 className="mb-1 text-base font-semibold text-foreground">Referred enquiries</h2>
        <p className="text-3xl font-semibold tracking-tight text-primary">{referred}</p>
      </Card>
      <Card>
        <h2 className="mb-3 text-base font-semibold text-foreground">Projects</h2>
        <ul className="space-y-2 text-sm">
          {projs.map((p) => (
            <li key={p.id}>
              <Link className="font-medium text-primary hover:text-primary/90" to={`/projects/${p.id}`}>
                {p.name}
              </Link>
            </li>
          ))}
          {projs.length === 0 && <li className="text-muted-foreground">No linked projects</li>}
        </ul>
      </Card>
    </div>
  );
}
