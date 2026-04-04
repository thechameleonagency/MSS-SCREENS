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
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
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
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col space-y-1.5 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold leading-none tracking-tight text-card-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
