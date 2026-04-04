import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/** Apply to `<table>`: sticky header row, zebra body, comfortable row height. */
export const dataTableClasses =
  'min-w-full text-left text-sm [&_thead_tr]:border-b [&_thead_tr]:border-border [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-card [&_thead_th]:px-4 [&_thead_th]:py-3.5 [&_thead_th]:font-semibold [&_thead_th]:text-muted-foreground [&_tbody_tr]:border-b [&_tbody_tr]:border-border/50 [&_tbody_tr:nth-child(even)]:bg-muted/30 [&_tbody_td]:px-4 [&_tbody_td]:py-3.5';

type DataTableShellProps = {
  children: ReactNode;
  className?: string;
  /** Omit outer border/radius when nested inside a Card */
  bare?: boolean;
};

export function DataTableShell({ children, className, bare }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto',
        !bare && 'rounded-lg border border-border bg-card shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
