import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import App from '../../src/App';
import {canNavigate} from '../../src/api/permissions';

beforeEach(() => {
  history.replaceState({}, '', '/overview');
  vi.stubGlobal('ResizeObserver', class {observe() {} unobserve() {} disconnect() {}});
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener() {}, removeEventListener() {}}));
});

it('production API outage shows recovery without fixture identity or sign-in', async () => {
  vi.stubEnv('PROD', true);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  render(<App />);
  expect(await screen.findByText('Connexion au serveur indisponible')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Réessayer'})).toBeInTheDocument();
  expect(screen.queryByText('Sara Mehdi')).not.toBeInTheDocument();
  expect(screen.queryByText('Ligne A · LNA')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Se connecter'})).not.toBeInTheDocument();
});

it('uses real account and switcher projects in the preserved shell', async () => {
  const projects = [{id: 'a', name: 'API Alpha', code: 'AA', permissions: {viewProject: true}}, {id: 'b', name: 'API Beta', code: 'BB', permissions: {viewProject: true}}];
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const path = new URL(input, location.origin).pathname;
    const data = path === '/api/me' ? {user: {id: 'u', name: 'Actual User', email: 'user@example.test', projects: []}} : path === '/api/projects' ? {items: projects} : path.startsWith('/api/projects/') ? {project: projects.find(project => path.endsWith(project.id))} : {items: []};
    return new Response(JSON.stringify({data}));
  }));
  render(<App />);
  const trigger = await screen.findByRole('button', {name: 'API Alpha · AA'});
  expect(screen.getAllByText('Actual User').length).toBeGreaterThan(0);
  expect(screen.queryByRole('link', {name: 'Organisations'})).not.toBeInTheDocument();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('button', {name: 'API Beta · BB'}));
  await waitFor(() => expect(screen.getByRole('button', {name: 'API Beta · BB'})).toHaveAttribute('aria-expanded', 'false'));
  expect(new URL(location.href).searchParams.get('project')).toBe('b');
});

it('fails closed on missing capabilities and hides unsupported administration', () => {
  expect(canNavigate(null, '/documents')).toBe(false);
  expect(canNavigate({id: 'a', code: 'A', name: 'A'}, '/overview')).toBe(false);
  const project = {id: 'a', code: 'A', name: 'A', permissions: {viewProject: true, viewAudit: false}};
  expect(canNavigate(project, '/documents')).toBe(true);
  expect(canNavigate(project, '/organizations')).toBe(false);
  expect(canNavigate(project, '/settings')).toBe(false);
  expect(canNavigate(project, '/reports')).toBe(false);
  expect(canNavigate({...project, permissions: {...project.permissions, viewAudit: true}}, '/reports')).toBe(true);
});

it('defaults to same-origin when production has no API base URL configured', async () => {
  vi.stubEnv('VITE_API_BASE_URL', '');
  vi.stubEnv('PROD', true);
  vi.resetModules();
  const {evoRailApi} = await import('../../src/api/evoRailApi');
  expect(evoRailApi.baseUrl).toBe('');
});
