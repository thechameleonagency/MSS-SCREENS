import { useMemo, useState } from 'react';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { appendAudit } from '../../lib/auditLog';
import { generateId, getCollection, setCollection } from '../../lib/storage';
import type { AppNotification, ApprovalRequest, Attendance, User } from '../../types';

type MainTab = 'inbox' | 'approvals' | 'archive';
type ApprovalSub = 'leave' | 'expense' | 'blockage';

export function NotificationsPage() {
  const items = useLiveCollection<AppNotification>('notifications');
  const approvals = useLiveCollection<ApprovalRequest>('approvalRequests');
  const users = useLiveCollection<User>('users');
  const { bump } = useDataRefresh();
  const [tab, setTab] = useState<MainTab>('inbox');
  const [apSub, setApSub] = useState<ApprovalSub>('leave');
  const unread = items.filter((n) => !n.read).length;

  const pendingAll = useMemo(() => approvals.filter((a) => a.status === 'pending'), [approvals]);
  const pendingLeave = useMemo(() => pendingAll.filter((a) => a.kind === 'leave'), [pendingAll]);
  const pendingExpense = useMemo(() => pendingAll.filter((a) => a.kind === 'expense'), [pendingAll]);
  const pendingBlockage = useMemo(() => pendingAll.filter((a) => a.kind === 'blockage'), [pendingAll]);

  const subPending = useMemo(() => {
    if (apSub === 'leave') return pendingLeave;
    if (apSub === 'expense') return pendingExpense;
    return pendingBlockage;
  }, [apSub, pendingLeave, pendingExpense, pendingBlockage]);

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

  function applyApprovedLeaveToAttendance(row: ApprovalRequest) {
    const payload = row.payload ?? {};
    let employeeId = payload.employeeId as string | undefined;
    if (!employeeId && row.employeeName) {
      const u = users.find((x) => x.name === row.employeeName);
      employeeId = u?.id;
    }
    const date = (payload.date as string) ?? new Date().toISOString().slice(0, 10);
    if (!employeeId) return;
    const att = getCollection<Attendance>('attendance');
    if (att.some((a) => a.employeeId === employeeId && a.date === date)) return;
    const rowA: Attendance = {
      id: generateId('att'),
      employeeId,
      date,
      status: 'Paid Leave',
      markedBy: actor().userId,
    };
    setCollection('attendance', [...att, rowA]);
  }

  function resolveApproval(id: string, status: 'approved' | 'rejected') {
    const list = getCollection<ApprovalRequest>('approvalRequests');
    const row = list.find((a) => a.id === id);
    if (!row) return;
    const act = actor();
    setCollection(
      'approvalRequests',
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              resolvedBy: act.userName ?? act.userId,
              resolvedAt: new Date().toISOString(),
            }
          : a
      )
    );
    if (status === 'approved' && row.kind === 'leave') {
      applyApprovedLeaveToAttendance(row);
    }
    appendAudit({
      ...act,
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
          ? `${pendingAll.length} pending approval(s) · Leave (${pendingLeave.length}) · Expenses (${pendingExpense.length}) · Blockages (${pendingBlockage.length})`
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
    [unread, pendingAll.length, pendingLeave.length, pendingExpense.length, pendingBlockage.length, tab]
  );
  usePageHeader(header);

  const inboxItems = items.filter((n) => !n.read);
  const archiveNotes = items.filter((n) => n.read);
  const archiveApprovals = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-4">
      <div className="sticky-page-subnav -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 py-2.5 backdrop-blur-sm">
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(k)}
          >
            {l}
            {k === 'inbox' && unread > 0 && ` (${unread})`}
            {k === 'approvals' && pendingAll.length > 0 && ` (${pendingAll.length})`}
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
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card/80 p-2">
            {(
              [
                ['leave', 'Leave', pendingLeave.length] as const,
                ['expense', 'Expenses', pendingExpense.length] as const,
                ['blockage', 'Blockages', pendingBlockage.length] as const,
              ] as const
            ).map(([k, label, count]) => (
              <button
                key={k}
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  apSub === k ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => setApSub(k)}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {subPending.length === 0 && (
                <li className="py-10 text-center text-sm text-muted-foreground">No pending items in this queue.</li>
              )}
              {subPending.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 py-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      <span className="mr-2 rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {a.ticketNo ?? a.id.slice(0, 10)}
                      </span>
                      {a.title}
                    </p>
                    {a.reasonCode && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-tertiary">{a.reasonCode}</p>
                    )}
                    <p className="mt-1 text-muted-foreground">{a.detail}</p>
                    {a.projectName && (
                      <p className="mt-1 text-xs text-foreground">
                        Project: {a.projectName}
                        {a.projectCapacityKw != null ? ` · ${a.projectCapacityKw} kW` : ''}
                      </p>
                    )}
                    {a.employeeName && <p className="mt-1 text-xs text-muted-foreground">Employee: {a.employeeName}</p>}
                    {a.amount != null && <p className="mt-1 text-xs tabular-nums">Amount: ₹{a.amount.toLocaleString('en-IN')}</p>}
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
        </div>
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
                <span className="font-mono text-[11px] text-muted-foreground">{a.ticketNo ?? a.id.slice(0, 8)}</span> · {a.title} —{' '}
                <span className="text-muted-foreground">{a.status}</span>
                {a.resolvedBy && <span className="text-xs text-muted-foreground"> · by {a.resolvedBy}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
