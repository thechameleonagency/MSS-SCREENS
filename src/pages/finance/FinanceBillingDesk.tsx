import { useState } from 'react';
import { InvoicesList, PaymentsList, SaleBillsList } from './Finance';

type Tab = 'invoices' | 'saleBills' | 'payments';

export function FinanceBillingDesk() {
  const [tab, setTab] = useState<Tab>('invoices');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'saleBills', label: 'Sale bills' },
    { id: 'payments', label: 'Payments' },
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
      {tab === 'invoices' && <InvoicesList />}
      {tab === 'saleBills' && <SaleBillsList />}
      {tab === 'payments' && <PaymentsList />}
    </div>
  );
}
