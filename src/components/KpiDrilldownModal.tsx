import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';

export type DrillLink = { label: string; to: string; meta?: string };

export function KpiDrilldownModal({
  open,
  title,
  subtitle,
  links,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  links: DrillLink[];
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} wide>
      {subtitle && <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>}
      <ul className="max-h-[50vh] space-y-2 overflow-y-auto text-sm">
        {links.length === 0 && <li className="text-muted-foreground">No items.</li>}
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link className="font-medium text-primary hover:underline" to={l.to}>
              {l.label}
            </Link>
            {l.meta && <span className="ml-2 text-muted-foreground">{l.meta}</span>}
          </li>
        ))}
      </ul>
      {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
    </Modal>
  );
}
