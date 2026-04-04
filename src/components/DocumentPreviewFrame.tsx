import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type PreviewCompany = {
  name: string;
  gst?: string;
  address?: string;
};

type MetaRow = { label: string; value: string };

type DocumentPreviewFrameProps = {
  company: PreviewCompany;
  partyTitle?: string;
  partyName: string;
  partyDetails?: ReactNode;
  documentKind?: string;
  reference?: string;
  dateLabel?: string;
  dateValue?: string;
  extraMeta?: MetaRow[];
  summary?: ReactNode;
  className?: string;
};

/** Shared “From / party / meta” header for invoice, sale bill, quotation PDF areas. */
export function DocumentPreviewFrame({
  company,
  partyTitle = 'Bill to',
  partyName,
  partyDetails,
  documentKind,
  reference,
  dateLabel = 'Date',
  dateValue,
  extraMeta,
  summary,
  className,
}: DocumentPreviewFrameProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</p>
          <p className="text-lg font-semibold leading-tight text-foreground">{company.name}</p>
          {company.address ? <p className="text-sm text-muted-foreground">{company.address}</p> : null}
          {company.gst ? <p className="text-sm text-muted-foreground">GSTIN: {company.gst}</p> : null}
        </div>
        <div className="min-w-0 space-y-1 sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{partyTitle}</p>
          <p className="text-base font-semibold text-foreground">{partyName}</p>
          {partyDetails ? <div className="text-sm text-muted-foreground sm:ml-auto sm:max-w-sm">{partyDetails}</div> : null}
        </div>
      </div>
      {(documentKind || reference || dateValue || (extraMeta && extraMeta.length > 0)) && (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-border/80 pt-3 text-xs text-muted-foreground">
          {documentKind ? (
            <span className="text-sm font-semibold uppercase tracking-wide text-foreground">{documentKind}</span>
          ) : null}
          {reference ? (
            <span>
              Ref: <span className="font-medium text-foreground">{reference}</span>
            </span>
          ) : null}
          {dateValue ? (
            <span>
              {dateLabel}: <span className="font-medium text-foreground">{dateValue}</span>
            </span>
          ) : null}
          {extraMeta?.map((m) => (
            <span key={`${m.label}-${m.value}`}>
              {m.label}: <span className="font-medium text-foreground">{m.value}</span>
            </span>
          ))}
        </div>
      )}
      {summary ? <div className="grid gap-3 border-y border-border/60 py-3 sm:grid-cols-3">{summary}</div> : null}
    </div>
  );
}
