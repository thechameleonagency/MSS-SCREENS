import { useState } from 'react';
import { ChartOfAccountsPage, ExpenseAuditPage } from './Finance';

type Tab = 'chart' | 'audit';

export function FinanceAccountingDesk() {
  const [tab, setTab] = useState<Tab>('chart');
  return (
    <div className="space-y-4">
      <div className="sticky-page-subnav -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 py-2.5 text-sm backdrop-blur-sm">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
            tab === 'chart' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('chart')}
        >
          Chart of accounts
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
            tab === 'audit' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('audit')}
        >
          Expense audit
        </button>
      </div>
      {tab === 'chart' && <ChartOfAccountsPage />}
      {tab === 'audit' && <ExpenseAuditPage />}
    </div>
  );
}
