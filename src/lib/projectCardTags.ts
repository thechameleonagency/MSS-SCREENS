/**
 * Per-card / per-section dedupe: if the full project type label would appear 2+ times in the same
 * card (or row), show one corner badge + dots inline. Different cards on the same page are scored
 * independently — each keeps full text when it only has one slot.
 */
import type { Project } from '../types';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripTypeSuffixFromName(name: string, type: string): string {
  const re = new RegExp(`\\s*[—–-]\\s*${escapeRe(type)}\\s*$`, 'i');
  return name.replace(re, '').trim();
}

/** Project name carries the full type label (e.g. suffix "— Partner with Contributions"). */
export function projectNameEmbedsTypeLabel(project: Project): boolean {
  return stripTypeSuffixFromName(project.name, project.type) !== project.name.trim();
}

/**
 * How many UI slots in a typical list/site card show the full `project.type` string:
 * one in the meta line, plus one when the title also embeds the type.
 */
export function projectTypeFullLabelSlotsListCard(project: Project): number {
  return (projectNameEmbedsTypeLabel(project) ? 1 : 0) + 1;
}

/** Hero card: title + subtitle line both may show the type label. */
export function projectTypeFullLabelSlotsHeroCard(project: Project): number {
  return projectTypeFullLabelSlotsListCard(project);
}

/** Dossier preview block: project line + type/status line. */
export function projectTypeFullLabelSlotsDossierPreview(project: Project): number {
  return projectTypeFullLabelSlotsListCard(project);
}

/** When the same card/section would show the full type label 2+ times, use corner badge + dots in rows. */
export function shouldPromoteProjectTypeInSection(fullLabelSlotCount: number): boolean {
  return fullLabelSlotCount >= 2;
}

export function shouldPromoteProjectTypeOnListCard(project: Project): boolean {
  return shouldPromoteProjectTypeInSection(projectTypeFullLabelSlotsListCard(project));
}

/** @deprecated use shouldPromoteProjectTypeOnListCard */
export function shouldPromoteProjectTypeTag(project: Project): boolean {
  return shouldPromoteProjectTypeOnListCard(project);
}

export function projectDisplayTitleForCard(project: Project): string {
  if (!projectNameEmbedsTypeLabel(project)) return project.name;
  const stripped = stripTypeSuffixFromName(project.name, project.type);
  return stripped || project.name;
}

export function projectTypeDotClass(type: Project['type']): string {
  switch (type) {
    case 'Partner with Contributions':
      return 'bg-amber-800 dark:bg-amber-600';
    case 'Partner (Profit Only)':
      return 'bg-violet-600';
    case 'Solo':
      return 'bg-slate-500';
    default:
      return 'bg-muted-foreground';
  }
}
