import { Card } from './Card';
import { cn } from '../lib/utils';

export type SummaryItem = {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
};

export function SummaryCards({ items, columns = 4 }: { items: SummaryItem[]; columns?: 2 | 3 | 4 | 5 }) {
  const grid =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : columns === 5
          ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
          : 'sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={cn('grid gap-4', grid)}>
      {items.map((i) => {
        const inner = (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{i.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{i.value}</p>
            {i.hint && <p className="mt-1 text-sm text-muted-foreground">{i.hint}</p>}
          </>
        );
        return i.onClick ? (
          <button key={i.label} type="button" className="w-full text-left" onClick={i.onClick}>
            <Card padding="md" interactive>
              {inner}
            </Card>
          </button>
        ) : (
          <Card key={i.label} padding="md">
            {inner}
          </Card>
        );
      })}
    </div>
  );
}
