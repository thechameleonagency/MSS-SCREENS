import type { AuditLogEntry } from '../types';
import { generateId, getCollection, setCollection } from './storage';

export function appendAudit(
  partial: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string }
): void {
  const list = getCollection<AuditLogEntry>('auditLogs');
  const row: AuditLogEntry = {
    id: partial.id ?? generateId('aud'),
    timestamp: new Date().toISOString(),
    userId: partial.userId,
    userName: partial.userName,
    action: partial.action,
    entityType: partial.entityType,
    entityId: partial.entityId,
    entityName: partial.entityName,
    field: partial.field,
    oldValue: partial.oldValue,
    newValue: partial.newValue,
  };
  setCollection('auditLogs', [row, ...list].slice(0, 2000));
}
