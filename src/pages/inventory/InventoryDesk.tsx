import { useSearchParams } from 'react-router-dom';
import { MaterialsList, PresetsPage, ToolsList } from './Inventory';

const TABS = [
  { id: 'materials', label: 'Materials' },
  { id: 'tools', label: 'Tools' },
  { id: 'presets', label: 'Presets' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function InventoryDesk() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('tab') ?? 'materials';
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'materials';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
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
      {tab === 'presets' && <PresetsPage />}
    </div>
  );
}
