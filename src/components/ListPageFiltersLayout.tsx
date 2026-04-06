import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

const outerClass =
  'flex flex-col gap-3 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3';

type ListPageFiltersLayoutProps = {
  /** Search + dropdowns (left cluster on wide screens). */
  primary: ReactNode;
  /** Stat chips / underline toggles (right cluster). */
  secondary?: ReactNode;
  className?: string;
};

/**
 * Shared filters toolbar shell for list pages (used inside `usePageHeader({ filtersToolbar })`).
 * Matches Enquiries / Quotations / Agents spacing.
 */
export function ListPageFiltersLayout({ primary, secondary, className }: ListPageFiltersLayoutProps) {
  return (
    <div className={cn(outerClass, className)}>
      <div className="flex min-w-0 flex-wrap items-end gap-2">{primary}</div>
      {secondary != null ? (
        <div
          className="flex flex-wrap items-baseline justify-start gap-x-4 gap-y-2 text-sm sm:justify-end"
          role="group"
        >
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

/** Stat chip button — borderless, underline active state. */
export function listPageStatChipButtonClass() {
  return cn(
    'rounded-none border-0 bg-transparent p-0 shadow-none text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  );
}

export function listPageStatChipInner(active: boolean) {
  return cn(
    'inline-flex flex-col items-start border-b-2 pb-0.5',
    active
      ? 'border-foreground font-medium text-foreground'
      : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
  );
}

export function listPageStatChipLabel(active: boolean) {
  return cn(
    'text-[10px] font-normal uppercase tracking-wide',
    active ? 'text-foreground' : 'text-muted-foreground'
  );
}
