import { type ReactNode, useEffect } from 'react';
import { cn } from '../lib/utils';

export function Modal({
  open,
  title,
  children,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-background p-6 text-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-200',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
