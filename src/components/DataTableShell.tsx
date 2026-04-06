import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/** Apply to `<table>`: sticky header row, zebra body, comfortable row height; sticky tfoot at bottom of scrollport. */
export const dataTableClasses =
  'min-w-full text-left text-sm [&_thead_tr]:border-b [&_thead_tr]:border-border [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[2] [&_thead_th]:bg-card [&_thead_th]:px-4 [&_thead_th]:py-3.5 [&_thead_th]:font-semibold [&_thead_th]:text-muted-foreground [&_tbody_tr]:border-b [&_tbody_tr]:border-border/50 [&_tbody_tr:nth-child(even)]:bg-muted/30 [&_tbody_td]:px-4 [&_tbody_td]:py-3.5 [&_tfoot_tr]:border-t-2 [&_tfoot_tr]:border-border [&_tfoot_td]:sticky [&_tfoot_td]:bottom-0 [&_tfoot_td]:z-[1] [&_tfoot_td]:bg-muted/40 [&_tfoot_td]:px-4 [&_tfoot_td]:py-3.5 [&_tfoot_th]:sticky [&_tfoot_th]:bottom-0 [&_tfoot_th]:z-[1] [&_tfoot_th]:bg-muted/40 [&_tfoot_th]:px-4 [&_tfoot_th]:py-3.5';

/** Default vertical cap for list tables (`bodyMaxHeight` on `DataTableShell`). */
export const DATA_TABLE_LIST_BODY_MAX_HEIGHT = 'min(70vh, 28rem)';

/** Target visible data rows (no inner scroll) per rows-per-page setting. */
const LIST_TABLE_VISIBLE_ROWS: Record<number, number> = {
  12: 7,
  24: 13,
  48: 18,
  100: 20,
};

const LIST_TABLE_HEAD_PX = 48;
const LIST_TABLE_ROW_PX = 52;
const LIST_TABLE_FOOT_PX = 48;

/** Scrollport height so ~N rows fit without scrolling; caps at 85vh for small screens. */
export function listTableBodyMaxHeight(pageSize: number): string {
  const visible = LIST_TABLE_VISIBLE_ROWS[pageSize] ?? 13;
  const px = LIST_TABLE_HEAD_PX + visible * LIST_TABLE_ROW_PX + LIST_TABLE_FOOT_PX;
  return `min(85vh, ${px}px)`;
}

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
  /**
   * When true (default with `bodyMaxHeight`), wheel at scroll top/bottom can chain to the page
   * (`overscroll-behavior-y: auto`). Set false to keep scroll contained in the table body.
   */
  scrollChainToParent?: boolean;
};

export function DataTableShell({ children, className, bare, bodyMaxHeight, scrollChainToParent }: DataTableShellProps) {
  const chain =
    bodyMaxHeight != null && scrollChainToParent !== false;
  const inner = bodyMaxHeight ? (
    <div
      className={cn('overflow-y-auto', chain ? 'overscroll-y-auto' : 'overscroll-contain')}
      style={{ maxHeight: bodyMaxHeight }}
    >
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
