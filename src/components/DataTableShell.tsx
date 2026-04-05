import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/** Apply to `<table>`: sticky header row, zebra body, comfortable row height. */
export const dataTableClasses =
  'min-w-full text-left text-sm [&_thead_tr]:border-b [&_thead_tr]:border-border [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-card [&_thead_th]:px-4 [&_thead_th]:py-3.5 [&_thead_th]:font-semibold [&_thead_th]:text-muted-foreground [&_tbody_tr]:border-b [&_tbody_tr]:border-border/50 [&_tbody_tr:nth-child(even)]:bg-muted/30 [&_tbody_td]:px-4 [&_tbody_td]:py-3.5';

/** Default vertical cap for list tables (`bodyMaxHeight` on `DataTableShell`). */
export const DATA_TABLE_LIST_BODY_MAX_HEIGHT = 'min(70vh, 28rem)';

type DataTableShellProps = {
  children: ReactNode;
  className?: string;
  /** Omit outer border/radius when nested inside a Card */
  bare?: boolean;
  /**
   * Max height for the table viewport; enables vertical scroll so `thead` stays visible
   * (sticky relative to this region). Horizontal scroll remains on the outer wrapper.
   */
  bodyMaxHeight?: string;
};

export function DataTableShell({ children, className, bare, bodyMaxHeight }: DataTableShellProps) {
  const inner = bodyMaxHeight ? (
    <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: bodyMaxHeight }}>
      {children}
    </div>
  ) : (
    children
  );
  return (
    <div
      className={cn(
        'overflow-x-auto',
        !bare && 'rounded-lg border border-border bg-card shadow-sm',
        className
      )}
    >
      {inner}
    </div>
  );
}
