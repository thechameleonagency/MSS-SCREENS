import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { MaterialsList, ToolsList } from './Inventory';

const TABS = [
  { id: 'materials', label: 'Materials' },
  { id: 'tools', label: 'Tools' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function InventoryDesk() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('tab') ?? 'materials';
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'materials';

  usePageHeader(
    useMemo(
      () => ({
        title: 'Materials & Tools',
        subtitle: 'Warehouse materials and tool lifecycle',
      }),
      []
    )
  );

  return (
    <div className="space-y-4">
      <div className="sticky-page-subnav -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 py-2.5 text-sm backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSp({ tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'materials' && <MaterialsList />}
      {tab === 'tools' && <ToolsList />}
    </div>
  );
}
