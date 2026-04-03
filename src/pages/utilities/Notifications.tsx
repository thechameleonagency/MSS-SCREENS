import { useMemo } from 'react';
import { Card } from '../../components/Card';
import { ShellButton } from '../../components/ShellButton';
import { useDataRefresh } from '../../contexts/AppProviders';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { useLiveCollection } from '../../hooks/useLiveCollection';
import { getCollection, setCollection } from '../../lib/storage';
import type { AppNotification } from '../../types';

export function NotificationsPage() {
  const items = useLiveCollection<AppNotification>('notifications');
  const { bump } = useDataRefresh();
  const unread = items.filter((n) => !n.read).length;

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

  const header = useMemo(
    () => ({
      title: 'Notifications',
      subtitle: unread ? `${unread} unread` : 'You are all caught up',
      actions:
        unread > 0 ? (
          <ShellButton variant="secondary" type="button" onClick={markAllRead}>
            Mark all read
          </ShellButton>
        ) : undefined,
    }),
    [unread]
  );
  usePageHeader(header);

  return (
    <Card>
      <ul className="divide-y divide-border">
        {items.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">
            No notifications. Reset seed in Settings if needed.
          </li>
        )}
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex flex-col gap-2 py-4 text-sm first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between ${
              n.read ? 'opacity-75' : ''
            }`}
          >
            <div>
              <span className="mr-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {n.type}
              </span>
              <span className="text-foreground">{n.message}</span>
              <div className="mt-1 text-xs text-muted-foreground">{n.createdAt.slice(0, 19).replace('T', ' ')}</div>
            </div>
            {!n.read && (
              <ShellButton variant="ghost" size="sm" type="button" className="shrink-0" onClick={() => markRead(n.id)}>
                Mark read
              </ShellButton>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
