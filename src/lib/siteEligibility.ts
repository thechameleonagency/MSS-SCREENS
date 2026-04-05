import type { Project, Site, Task } from '../types';

export function projectIsActivePipeline(status: Project['status']): boolean {
  return status === 'New' || status === 'In Progress' || status === 'On Hold';
}

export function projectIsCompletedClosed(status: Project['status']): boolean {
  return status === 'Completed' || status === 'Closed';
}

/** Open tickets = Ticket kind and not completed. */
export function projectHasOpenTickets(projectId: string, tasks: Task[]): boolean {
  return tasks.some(
    (t) =>
      t.kind === 'Ticket' &&
      t.projectId === projectId &&
      t.status !== 'Completed'
  );
}

export function siteEligibleForAttendance(
  site: Site,
  projects: Project[],
  tasks: Task[],
  opts: { includeCompletedWithTickets: boolean }
): boolean {
  const proj = projects.find((p) => p.id === site.projectId);
  if (!proj) return false;
  if (projectIsActivePipeline(proj.status)) return true;
  if (!opts.includeCompletedWithTickets) return false;
  if (!projectIsCompletedClosed(proj.status)) return false;
  return tasks.some(
    (t) =>
      t.kind === 'Ticket' &&
      t.projectId === proj.id &&
      (!t.siteId || t.siteId === site.id)
  );
}

export function filterSitesForAttendance(
  sites: Site[],
  projects: Project[],
  tasks: Task[],
  opts: { includeCompletedWithTickets: boolean }
): Site[] {
  return sites.filter((s) => siteEligibleForAttendance(s, projects, tasks, opts));
}
