/** Project identity is shareable in the URL; storage is only a preference. */
export function projectIdFromLocation(): string | null {
  const match = window.location.pathname.match(/^\/projects\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : new URL(window.location.href).searchParams.get('project');
}

export function projectPathname(): string {
  return window.location.pathname.replace(/^\/projects\/[^/]+/, '') || '/overview';
}

export function writeProjectLocation(id: string, replace = false) {
  const url = new URL(window.location.href);
  // Switching projects must leave document-specific deep links behind.
  url.pathname = '/overview';
  url.searchParams.set('project', id);
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateInProject(path: string) {
  const url = new URL(path, window.location.origin);
  const project = projectIdFromLocation();
  if (project && path !== '/signin' && !url.searchParams.has('project')) url.searchParams.set('project', project);
  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function canonicalizeProjectLocation(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('project', id);
  window.history.replaceState({}, '', url);
}

export function projectHref(path: string): string {
  const url = new URL(path, window.location.origin);
  const project = projectIdFromLocation();
  if (project && path !== '/signin') url.searchParams.set('project', project);
  return `${url.pathname}${url.search}${url.hash}`;
}
