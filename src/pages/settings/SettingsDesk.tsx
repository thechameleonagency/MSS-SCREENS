import { useSearchParams } from 'react-router-dom';
import { CompanyAndMasterPage, UserManagementPage } from './Settings';

const TABS = [
  { id: 'company', label: 'Company & master data' },
  { id: 'users', label: 'Users' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsDesk() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('tab') ?? 'company';
  const tab: TabId = raw === 'users' ? 'users' : 'company';

  return (
    <div className="space-y-3">
      <div className="sticky-page-subnav -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 py-2 text-sm backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors sm:text-sm ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSp({ tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'company' && <CompanyAndMasterPage />}
      {tab === 'users' && <UserManagementPage />}
    </div>
  );
}
