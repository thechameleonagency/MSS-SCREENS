import { useState } from 'react';
import { VendorsList } from './Finance';
import { ChannelPartnersFinanceListEnhanced, PartnersFinanceListEnhanced } from './FinanceDetails';

type Tab = 'vendors' | 'partners' | 'channel';

export function FinancePartnersDesk() {
  const [tab, setTab] = useState<Tab>('vendors');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'vendors', label: 'Vendors' },
    { id: 'partners', label: 'Partners' },
    { id: 'channel', label: 'Channel partners' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'vendors' && <VendorsList />}
      {tab === 'partners' && <PartnersFinanceListEnhanced />}
      {tab === 'channel' && <ChannelPartnersFinanceListEnhanced />}
    </div>
  );
}
