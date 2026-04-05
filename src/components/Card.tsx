import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hero / KPI emphasis — gradient border tone, slightly stronger shadow */
  variant?: 'default' | 'feature';
  /** Hover lift (links / clickable rows) */
  interactive?: boolean;
};

const pad: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-4 sm:p-5',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  interactive,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border text-card-foreground shadow-sm',
        variant === 'feature'
          ? 'border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.06] shadow-md'
          : 'border-border bg-card',
        interactive && 'transition-colors duration-200 hover:border-primary/20 hover:shadow-md',
        pad[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const hasDesc = description != null && description !== '';
  return (
    <div className="mb-3 flex flex-col space-y-1 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-tight tracking-tight text-card-foreground sm:text-xl">{title}</h2>
        {hasDesc && <div className="text-xs text-muted-foreground sm:text-sm">{description}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
