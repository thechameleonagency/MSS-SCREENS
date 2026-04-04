import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Design-system empty state for lists and panels (prototype / demo). */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/40 to-muted/20 px-6 py-14 text-center',
        className
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary-muted text-tertiary-muted-foreground shadow-inner">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
