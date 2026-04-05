import { ShellButton } from './ShellButton';

export const TABLE_PAGE_SIZE_OPTIONS = [12, 24, 48, 100] as const;
export const TABLE_DEFAULT_PAGE_SIZE = 24;

type TablePaginationBarProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
};

export function TablePaginationBar({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  className = '',
}: TablePaginationBarProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground ${className}`.trim()}
    >
      <span className="tabular-nums">
        Showing {start}–{end} of {totalCount}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex max-w-full shrink-0 items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            className="select-shell h-9 w-[4.25rem] shrink-0 py-1 text-xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) || TABLE_DEFAULT_PAGE_SIZE)}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <ShellButton type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          Previous
        </ShellButton>
        <span className="tabular-nums text-foreground">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <ShellButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </ShellButton>
      </div>
    </div>
  );
}
