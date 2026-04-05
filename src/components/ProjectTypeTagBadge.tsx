import { cn } from '../lib/utils';

export function CardCornerTypeTag({
  label,
  dotClass,
  className,
}: {
  label: string;
  dotClass: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-2 top-2 z-10 flex max-w-[min(14rem,55%)] items-center gap-1.5 rounded-md border border-border/70 bg-card/95 px-2 py-1 shadow-sm backdrop-blur-sm',
        className
      )}
      title={label}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} aria-hidden />
      <span className="truncate text-[10px] font-semibold leading-tight text-foreground">{label}</span>
    </div>
  );
}

export function InlineTypeTagDot({ label, dotClass }: { label: string; dotClass: string }) {
  return (
    <span
      title={label}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50"
      aria-label={label}
    >
      <span className={cn('h-2 w-2 rounded-full', dotClass)} aria-hidden />
    </span>
  );
}
