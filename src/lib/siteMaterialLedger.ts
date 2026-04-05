import { generateId } from './storage';
import type { Project, SiteMaterialLedgerRow } from '../types';

/** Balance in issue units: opening + issued − returned − scrap − consumed. */
export function siteLedgerBalance(
  r: Pick<SiteMaterialLedgerRow, 'openingQty' | 'issuedQty' | 'returnedQty' | 'scrapAtSiteQty' | 'consumedQty'>
): number {
  return r.openingQty + r.issuedQty - r.returnedQty - r.scrapAtSiteQty - r.consumedQty;
}

export function siteHasRecordedConsumption(project: Project, siteId: string): boolean {
  return (project.siteMaterialLedger ?? []).some((row) => row.siteId === siteId && row.consumedQty > 0);
}

const MATERIAL_STEP = /module|mount|structure|install|wiring|rail|panel|inverter|cabling|dc|ac|lay\s*plan|roof/i;

export function workItemRequiresMaterialConsumption(workItemTitle: string): boolean {
  return MATERIAL_STEP.test(workItemTitle);
}

export function upsertLedgerAfterIssue(
  project: Project,
  siteId: string | undefined,
  materialId: string,
  qtyIssue: number
): Project {
  if (!siteId || qtyIssue <= 0) return project;
  const ledger = [...(project.siteMaterialLedger ?? [])];
  const idx = ledger.findIndex((r) => r.siteId === siteId && r.materialId === materialId);
  const now = new Date().toISOString();
  if (idx >= 0) {
    const row = ledger[idx]!;
    ledger[idx] = { ...row, issuedQty: row.issuedQty + qtyIssue, lastUpdatedAt: now };
  } else {
    ledger.push({
      id: generateId('sml'),
      siteId,
      materialId,
      openingQty: 0,
      issuedQty: qtyIssue,
      returnedQty: 0,
      scrapAtSiteQty: 0,
      consumedQty: 0,
      lastUpdatedAt: now,
    });
  }
  return { ...project, siteMaterialLedger: ledger };
}
