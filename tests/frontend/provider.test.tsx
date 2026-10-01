import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {EvoRailProvider, useEvoRail} from '../../src/api/EvoRailProvider';
import {evoRailApi} from '../../src/api/evoRailApi';

const a = {id: 'a', code: 'A', name: 'Project A', permissions: {viewProject: true}};
const b = {id: 'b', code: 'B', name: 'Project B', permissions: {viewProject: true}};
const user = {id: 'user-a', name: 'User A', email: 'a@example.test', projects: [a]};
let routes: Record<string, unknown>;
const response = (data: unknown, status = 200) => new Response(JSON.stringify({data}), {status});
const fetchMock = vi.fn<typeof fetch>();
function Probe() {
  const value = useEvoRail();
  return <><output data-testid="state">{JSON.stringify(value)}</output><button onClick={() => void value.signIn(user.email, 'password').catch(() => {})}>Login</button><button onClick={() => void value.signOut().catch(() => {})}>Logout</button><button onClick={() => void value.refresh()}>Refresh</button><button onClick={() => void value.selectProject('b')}>Switch</button></>;
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!);
const mount = () => render(<EvoRailProvider><Probe /></EvoRailProvider>);
const ready = () => waitFor(() => expect(state().projectStatus).toBe('ready'));
beforeEach(() => {
  window.history.replaceState({}, '', '/overview');
  localStorage.clear();
  routes = {'/api/me': {user}, '/api/login': {user}, '/api/logout': {logged_out: true}, '/api/projects': {items: [a, b]}, '/api/projects/a': {project: a}, '/api/projects/b': {project: b}};
  fetchMock.mockReset().mockImplementation(async input => {
    const path = new URL(String(input), window.location.origin).pathname;
    if (path === '/sanctum/csrf-cookie') return new Response(null, {status: 204});
    const value = routes[path];
    if (value instanceof Error) throw value;
    if (value instanceof Response) return value.clone();
    if (!value) throw new Error(`Unexpected endpoint ${path}`);
    return response(value);
  });
  vi.stubGlobal('fetch', fetchMock);
});

describe('M2 auth and canonical project context', () => {
  it('bootstraps through me, projects and canonical detail without M3 calls', async () => {
    mount(); expect(state().status).toBe('loading'); await ready();
    expect(state()).toMatchObject({status: 'authenticated', user, projects: [a, b], project: a, documents: []});
    expect(fetchMock.mock.calls.map(call => new URL(String(call[0]), location.origin).pathname)).toEqual(['/api/me', '/api/projects', '/api/projects/a']);
  });
  it('uses a saved project only if present in the authoritative list', async () => {
    localStorage.setItem('evorail.projectId', 'foreign'); mount(); await ready(); expect(state().project).toEqual(a);
  });
  it('loads the saved project through its authorized detail endpoint', async () => {
    localStorage.setItem('evorail.projectId', 'b'); mount(); await ready(); expect(state().project).toEqual(b);
  });
  it('logs in from initial 401, then logs out and clears selection', async () => {
    routes['/api/me'] = response({}, 401); mount();
    await waitFor(() => expect(state().status).toBe('unauthenticated'));
    fireEvent.click(screen.getByText('Login')); await ready();
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(state().status).toBe('unauthenticated'));
    expect(state()).toMatchObject({user: null, project: null, projects: [], documents: []});
    expect(localStorage.getItem('evorail.projectId')).toBeNull();
  });
  it('reports a subsequent protected 401 as session expired', async () => {
    mount(); await ready(); routes['/api/projects/a'] = response({}, 401);
    await act(async () => { await evoRailApi.project('a').catch(() => {}); });
    expect(state()).toMatchObject({status: 'session-expired', user: null, project: null});
  });
  it('handles 419 as session expiry', async () => {
    mount(); await ready(); routes['/api/projects/a'] = response({}, 419);
    await act(async () => { await evoRailApi.project('a').catch(() => {}); });
    expect(state().status).toBe('session-expired');
  });
  it('keeps authentication on project 403 and clears selected project', async () => {
    mount(); await ready(); routes['/api/projects/b'] = response({}, 403);
    fireEvent.click(screen.getByText('Switch'));
    await waitFor(() => expect(state().projectStatus).toBe('forbidden'));
    expect(state()).toMatchObject({status: 'authenticated', user, project: null});
  });
  it.each([new TypeError('Failed to fetch'), response({}, 503)])('keeps backend unavailability distinct from logged-out state', async failure => {
    mount(); await ready(); routes['/api/me'] = failure;
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(state().status).toBe('backend-unavailable'));
    expect(state()).toMatchObject({user, project: null, authenticated: false, documents: []});
  });
  it('recovers after initial server unavailability', async () => {
    routes['/api/me'] = new TypeError('Failed to fetch'); mount();
    await waitFor(() => expect(state().status).toBe('backend-unavailable'));
    routes['/api/me'] = {user}; fireEvent.click(screen.getByText('Refresh')); await ready();
    expect(state().status).toBe('authenticated');
  });
  it('does not report a failed logout as a successful logout', async () => {
    mount(); await ready(); routes['/api/logout'] = new TypeError('Failed to fetch');
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(state().status).toBe('backend-unavailable'));
    expect(state().user).toEqual(user);
  });
  it('switches and restores the project with browser navigation', async () => {
    mount(); await ready(); fireEvent.click(screen.getByText('Switch'));
    await waitFor(() => expect(state().project).toEqual(b));
    expect(new URL(location.href).searchParams.get('project')).toBe('b');
    await act(async () => { history.replaceState({}, '', '/overview?project=a'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await waitFor(() => expect(state().project).toEqual(a));
  });
  it.each(['/documents?project=b', '/projects/b/documents'])('validates project deep link %s', async path => {
    history.replaceState({}, '', path); mount(); await ready(); expect(state().project).toEqual(b);
  });
  it('does not silently substitute another project for an unauthorized deep link', async () => {
    history.replaceState({}, '', '/projects/foreign/documents'); routes['/api/projects/foreign'] = response({}, 403);
    mount(); await waitFor(() => expect(state().projectStatus).toBe('forbidden'));
    expect(state()).toMatchObject({status: 'authenticated', project: null, documents: []});
    expect(location.pathname).toBe('/projects/foreign/documents');
  });
  it('fails closed when detail capability is missing', async () => {
    routes['/api/projects/a'] = {project: {...a, permissions: {}}}; mount();
    await waitFor(() => expect(state().projectStatus).toBe('forbidden')); expect(state().project).toBeNull();
  });
  it('accepts no-project users without inventing fixtures', async () => {
    routes['/api/projects'] = {items: []}; mount();
    await waitFor(() => expect(state().projectStatus).toBe('empty'));
    expect(state()).toMatchObject({status: 'authenticated', project: null, projects: [], documents: []});
  });
  it('canonicalizes the initial selection so browser back restores it', async () => {
    mount(); await ready(); expect(new URL(location.href).searchParams.get('project')).toBe('a');
    fireEvent.click(screen.getByText('Switch'));
    await waitFor(() => expect(state().project).toEqual(b));
    await act(async () => window.history.back());
    await waitFor(() => expect(state().project).toEqual(a));
  });
  it('ignores an expired older selection after a newer project succeeds', async () => {
    mount(); await ready();
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
    fireEvent.click(screen.getByText('Switch'));
    await act(async () => { history.replaceState({}, '', '/overview?project=a'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await waitFor(() => expect(state().project).toEqual(a));
    await act(async () => finish(response({}, 401)));
    expect(state()).toMatchObject({status: 'authenticated', project: a});
  });
  it('ignores an older project response after a newer selection', async () => {
    mount(); await ready();
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
    fireEvent.click(screen.getByText('Switch'));
    await act(async () => { history.replaceState({}, '', '/overview?project=a'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await waitFor(() => expect(state().project).toEqual(a));
    await act(async () => finish(response({project: b})));
    expect(state().project).toEqual(a);
  });
});
