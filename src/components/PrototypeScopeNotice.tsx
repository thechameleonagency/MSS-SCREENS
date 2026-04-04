import { useCallback, useState } from 'react';
import { ShellButton } from './ShellButton';

const SESSION_KEY = 'mms_proto_scope_notice_dismissed';

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Mirrors doc/ApplicationAuditDetails.md — "Intentionally out of scope (prototype)",
 * including accounting limits (double-entry, bank reconciliation).
 */
export function PrototypeScopeNotice() {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private mode / quota */
    }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <aside className="mt-10 border-t border-border/80 pt-4" aria-label="Prototype limitations">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">Prototype scope</p>
          <p>
            Local browser demo only. The following are intentionally{' '}
            <strong className="font-medium text-foreground">not</strong> included (see{' '}
            <span className="font-mono text-[11px] text-foreground/90">doc/ApplicationAuditDetails.md</span>
            ):
          </p>
          <ul className="list-inside list-disc space-y-1 pl-0.5">
            <li>Real authentication, server APIs, email/WhatsApp delivery, statutory GST filing.</li>
            <li>Full double-entry for every business event.</li>
            <li>Bank statement import and production-grade reconciliation.</li>
          </ul>
        </div>
        <ShellButton type="button" variant="outline" size="sm" className="shrink-0 self-start" onClick={dismiss}>
          Hide for this session
        </ShellButton>
      </div>
    </aside>
  );
}
