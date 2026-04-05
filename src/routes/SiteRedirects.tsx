import { Navigate, useParams } from 'react-router-dom';
import { getCollection } from '../lib/storage';
import type { Site } from '../types';

/** Resolves legacy `/projects/sites/:id` bookmarks to project-centric URL with site highlight. */
export function SiteToProjectRedirect() {
  const { id } = useParams();
  const sites = getCollection<Site>('sites');
  const site = sites.find((s) => s.id === id);
  if (!site) return <Navigate to="/projects" replace />;
  return <Navigate to={`/projects/${site.projectId}?site=${encodeURIComponent(site.id)}`} replace />;
}
