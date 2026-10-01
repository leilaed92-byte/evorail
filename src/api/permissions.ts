import type {ApiProject} from './evoRailApi';

// These hints only control UX. Every API endpoint still authorizes on the server.
export function canNavigate(project: ApiProject | null, path: string): boolean {
  if (path === '/signin') return true;
  if (project?.permissions?.viewProject !== true) return false;
  // The M2 contract exposes no organization/settings administration capability.
  if (path === '/organizations' || path === '/settings') return false;
  if (path === '/reports') return project.permissions.viewAudit === true;
  return true;
}
