import { useMemo, useState } from 'react';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { appendAudit } from '../../lib/auditLog';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { AppNotification, ApprovalRequest, User } from '../../types';

export function NotificationsPage() {
  const items = useLiveCollection<AppNotification>('notifications');
  const approvals = useLiveCollection<ApprovalRequest>('approvalRequests');
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const [tab, setTab] = useState<'inbox' | 'approvals' | 'archive'>('inbox');
  const unread = items.filter((n) => !n.read).length;
  const pending = approvals.filter((a) => a.status === 'pending');

  const actor = () => ({
    userId: users[0]?.id ?? 'sys',
    userName: users[0]?.name,
  });

  function pushNote(message: string, type: AppNotification['type'] = 'info') {
    const list = getCollection<AppNotification>('notifications');
    setCollection('notifications', [
      {
        id: generateId('n'),
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...list,
    ]);
    bump();
  }

  function markRead(id: string) {
    const list = getCollection<AppNotification>('notifications');
    setCollection(
      'notifications',
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    bump();
  }

  function markAllRead() {
    const list = getCollection<AppNotification>('notifications');
    setCollection(
      'notifications',
      list.map((n) => ({ ...n, read: true }))
    );
    bump();
  }

  function resolveApproval(id: string, status: 'approved' | 'rejected') {
    const list = getCollection<ApprovalRequest>('approvalRequests');
    const row = list.find((a) => a.id === id);
    if (!row) return;
    setCollection(
      'approvalRequests',
      list.map((a) => (a.id === id ? { ...a, status } : a))
    );
    appendAudit({
      ...actor(),
      action: 'update',
      entityType: 'ApprovalRequest',
      entityId: id,
      entityName: row.title,
      field: 'status',
      oldValue: row.status,
      newValue: status,
    });
    pushNote(`${status === 'approved' ? 'Approved' : 'Rejected'}: ${row.title}`, status === 'approved' ? 'success' : 'warning');
    bump();
  }

  const header = useMemo(
    () => ({
      title: 'Notifications',
      subtitle:
        tab === 'approvals'
          ? `${pending.length} pending approval(s)`
          : unread
            ? `${unread} unread in inbox`
            : 'Inbox clear',
      actions:
        tab === 'inbox' && unread > 0 ? (
          <ShellButton variant="secondary" type="button" onClick={markAllRead}>
            Mark all read
          </ShellButton>
        ) : undefined,
    }),
    [unread, pending.length, tab]
  );
  usePageHeader(header);

  const inboxItems = items.filter((n) => !n.read);
  const archiveNotes = items.filter((n) => n.read);
  const archiveApprovals = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['inbox', 'Inbox'],
            ['approvals', 'Approvals'],
            ['archive', 'Archive'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setTab(k)}
          >
            {l}
            {k === 'inbox' && unread > 0 && ` (${unread})`}
            {k === 'approvals' && pending.length > 0 && ` (${pending.length})`}
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <Card>
          <ul className="divide-y divide-border">
            {inboxItems.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">No unread notifications.</li>
            )}
            {inboxItems.map((n) => (
              <li
                key={n.id}
                className="flex flex-col gap-2 py-4 text-sm first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <span className="mr-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {n.type}
                  </span>
                  <span className="text-foreground">{n.message}</span>
                  <div className="mt-1 text-xs text-muted-foreground">{n.createdAt.slice(0, 19).replace('T', ' ')}</div>
                </div>
                <ShellButton variant="ghost" size="sm" type="button" className="shrink-0" onClick={() => markRead(n.id)}>
                  Mark read
                </ShellButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'approvals' && (
        <Card>
          <ul className="divide-y divide-border">
            {pending.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">No pending approvals.</li>
            )}
            {pending.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    <span className="mr-2 rounded bg-muted px-2 py-0.5 text-xs uppercase">{a.kind}</span>
                    {a.title}
                  </p>
                  <p className="mt-1 text-muted-foreground">{a.detail}</p>
                  {a.amount != null && <p className="mt-1 text-xs">Amount: ₹{a.amount.toLocaleString('en-IN')}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Requested {a.requestedAt.slice(0, 10)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ShellButton type="button" variant="primary" size="sm" onClick={() => resolveApproval(a.id, 'approved')}>
                    Approve
                  </ShellButton>
                  <ShellButton type="button" variant="secondary" size="sm" onClick={() => resolveApproval(a.id, 'rejected')}>
                    Reject
                  </ShellButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'archive' && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Read notifications</h3>
          <ul className="divide-y divide-border text-sm opacity-90">
            {archiveNotes.length === 0 && <li className="py-4 text-muted-foreground">Empty.</li>}
            {archiveNotes.map((n) => (
              <li key={n.id} className="py-3">
                <span className="text-xs text-muted-foreground">{n.createdAt.slice(0, 10)}</span> · {n.message}
              </li>
            ))}
          </ul>
          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">Past approvals</h3>
          <ul className="divide-y divide-border text-sm">
            {archiveApprovals.length === 0 && <li className="py-4 text-muted-foreground">None.</li>}
            {archiveApprovals.map((a) => (
              <li key={a.id} className="py-2">
                {a.title} — <span className="text-muted-foreground">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
