import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import {DocumentsPage, DocumentDetail} from '../../src/App';
import {ProtectedPreview} from '../../src/api/m3';
import {evoRailApi, type ApiDocument, type ApiRevision} from '../../src/api/evoRailApi';
vi.mock('../../src/api/EvoRailProvider', () => ({useEvoRail: () => ({project: {id: 'p', permissions: {createRevision: true}}}), EvoRailProvider: ({children}: {children: unknown}) => children}));
const old: ApiRevision = {id: 'old', document_id: 'doc', revision_code: 'A', revision_order: 1, title: 'Historical title', workflow_status: 'completed', suitability_status: 'for_information', effective_state: 'superseded', file: null};
const current: ApiRevision = {...old, id: 'current', revision_code: 'B', title: 'Current title', revision_order: 2, effective_state: 'current'};
const newest: ApiRevision = {...old, id: 'newest', revision_code: 'C', title: 'New draft', revision_order: 3};
const doc: ApiDocument = {id: 'doc', project_id: 'p', document_number: 'CODE', title: 'Current title', discipline: 'TRK', workflow_status: 'completed', suitability_status: 'for_information', effective_state: 'current', current_revision_id: 'current', current_revision: current};
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()})));
  window.history.replaceState({}, '', '/documents');
  vi.spyOn(evoRailApi, 'document').mockResolvedValue(doc);
  vi.spyOn(evoRailApi, 'revision').mockResolvedValue(old);
  vi.spyOn(evoRailApi, 'revisions').mockResolvedValue([newest, current, old]);
  vi.spyOn(evoRailApi, 'activity').mockResolvedValue([]);
  vi.spyOn(evoRailApi, 'documents').mockResolvedValue({items: [], pagination: {total: 0, current_page: 1, last_page: 1, per_page: 25}});
});
it('register reads URL filters and paginates on the server', async () => {
  window.history.replaceState({}, '', '/documents?search=bridge&workflow_status=returned&page=2&per_page=10&sort=-title&selected=CODE');
  vi.mocked(evoRailApi.documents).mockResolvedValue({items: [doc], pagination: {total: 30, current_page: 2, last_page: 3, per_page: 10}});
  render(<DocumentsPage />);
  await waitFor(() => expect(evoRailApi.documents).toHaveBeenCalledWith('p', expect.objectContaining({search: 'bridge', workflow_status: 'returned', page: 2, per_page: 10, sort: '-title'})));
  await screen.findByText('CODE');
  fireEvent.click(screen.getByLabelText('Page suivante'));
  await waitFor(() => expect(evoRailApi.documents).toHaveBeenLastCalledWith('p', expect.objectContaining({page: 3})));
  expect(window.location.search).toContain('selected=CODE');
  expect(window.location.search).toContain('search=bridge');
});
it('an empty register does not show production fixtures', async () => {
  render(<DocumentsPage />);
  await screen.findByText('Aucun document correspondant.');
  expect(screen.queryByText('Interface drainage de quai')).toBeNull();
});
it('exact historical links display the exact revision instead of latest', async () => {
  render(<DocumentDetail id="doc" exactRevisionId="old" />);
  await screen.findAllByText('Historical title');
  expect(evoRailApi.revision).toHaveBeenCalledWith('old');
  expect(screen.queryByText('New draft')).toBeNull();
  expect(window.location.pathname).toBe('/documents');
});
it('a 404 exact revision never falls back to current', async () => {
  vi.mocked(evoRailApi.revision).mockRejectedValue(Object.assign(new Error('Missing'), {status: 404}));
  render(<DocumentDetail id="doc" exactRevisionId="missing" />);
  await screen.findByRole('alert');
  expect(evoRailApi.document).not.toHaveBeenCalled();
  expect(screen.queryByText('Current title')).toBeNull();
});
it('document preview targets current_revision_id, not the newest draft', async () => {
  const withFile = {...current, file: {id: 'f', original_filename: 'current.pdf', mime_type: 'application/pdf', size: 1, checksum: 'x'}};
  vi.mocked(evoRailApi.revisions).mockResolvedValue([newest, withFile, old]);
  vi.spyOn(evoRailApi, 'file').mockRejectedValue(Object.assign(new Error('Denied'), {status: 403}));
  render(<DocumentDetail id="doc" />);
  await screen.findByText('Accès refusé par les droits du projet.');
  expect(evoRailApi.file).toHaveBeenCalledWith('preview', 'current');
});
it('unsupported CAD and missing files have explicit preview states', () => {
  const {rerender} = render(<ProtectedPreview revision={{...old, file: {id: 'f', original_filename: 'rail.dwg', mime_type: 'application/dwg', size: 1, checksum: 'x'}}} />);
  expect(screen.getByText(/Aperçu CAD/)).toBeInTheDocument();
  rerender(<ProtectedPreview revision={old} />);
  expect(screen.getByText('Fichier manquant.')).toBeInTheDocument();
});
it('revision history links retain each exact revision ID', async () => {
  window.history.replaceState({}, '', '/documents/doc?tab=versions');
  render(<DocumentDetail id="doc" />);
  fireEvent.click(await screen.findByText('Rev A · Historical title'));
  expect(window.location.pathname).toBe('/documents/doc/revisions/old');
});
it('create revision success refetches detail, history and activity', async () => {
  window.history.replaceState({}, '', '/documents/doc?tab=versions');
  vi.spyOn(evoRailApi, 'createRevision').mockResolvedValue(newest);
  render(<DocumentDetail id="doc" />);
  await screen.findByText('Rev A · Historical title');
  fireEvent.change(screen.getByLabelText('Motif du changement'), {target: {value: 'Updated geometry'}});
  fireEvent.change(screen.getByLabelText('Fichier contrôlé'), {target: {files: [new File(['pdf'], 'x.pdf', {type: 'application/pdf'})]}});
  fireEvent.submit(screen.getByLabelText('Fichier contrôlé').closest('form')!);
  await screen.findByText('Révision créée.');
  await waitFor(() => expect(evoRailApi.revisions).toHaveBeenCalledTimes(2));
  expect(evoRailApi.document).toHaveBeenCalledTimes(2);
  expect(evoRailApi.activity).toHaveBeenCalledTimes(2);
  expect(old.title).toBe('Historical title');
});
it.each([409, 422, 403])('creation displays %s without retry or refresh', async status => {
  window.history.replaceState({}, '', '/documents/doc?tab=versions');
  vi.spyOn(evoRailApi, 'createRevision').mockRejectedValue(Object.assign(new Error('Duplicate revision'), {status, errors: {revision_code: ['Invalid code']}}));
  render(<DocumentDetail id="doc" />);
  await screen.findByText('Rev A · Historical title');
  fireEvent.change(screen.getByLabelText('Fichier contrôlé'), {target: {files: [new File(['pdf'], 'x.pdf')]}});
  fireEvent.submit(screen.getByLabelText('Fichier contrôlé').closest('form')!);
  await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  expect(evoRailApi.createRevision).toHaveBeenCalledTimes(1);
  expect(evoRailApi.revisions).toHaveBeenCalledTimes(1);
});
it.each(['application/pdf', 'image/png'])('renders protected %s and revokes its URL on unmount', async mime => {
  const create = vi.fn(() => 'blob:protected');
  const revoke = vi.fn();
  vi.stubGlobal('URL', Object.assign(URL, {createObjectURL: create, revokeObjectURL: revoke}));
  vi.spyOn(evoRailApi, 'file').mockResolvedValue(new Blob(['x'], {type: mime}));
  const {unmount} = render(<ProtectedPreview revision={{...old, file: {id: 'f', original_filename: 'x', mime_type: mime, size: 1, checksum: 'x'}}} />);
  await waitFor(() => expect(create).toHaveBeenCalled());
  if (mime === 'application/pdf') expect(screen.getByTitle('Aperçu protégé de la révision')).toHaveAttribute('src', 'blob:protected');
  else expect(screen.getByAltText('Révision A')).toHaveAttribute('src', 'blob:protected');
  unmount();
  expect(revoke).toHaveBeenCalledWith('blob:protected');
});
it('compares revision metadata through the API and preserves selection in URL', async () => {
  window.history.replaceState({}, '', '/documents/doc?tab=versions');
  vi.spyOn(evoRailApi, 'compare').mockResolvedValue({document_id: 'doc', from: 'B', to: 'A', changes: {title: {from: 'Current title', to: 'Historical title'}}});
  render(<DocumentDetail id="doc" />);
  await screen.findByText('Rev A · Historical title');
  fireEvent.change(screen.getByLabelText('Comparer les révisions'), {target: {value: 'old'}});
  await screen.findByRole('cell', {name: 'Historical title'});
  expect(evoRailApi.compare).toHaveBeenCalledWith('current', 'old');
  expect(window.location.search).toContain('compare=old');
});
it('document detail exposes 403 without showing another record', async () => {
  vi.mocked(evoRailApi.document).mockRejectedValue(Object.assign(new Error('Forbidden'), {status: 403}));
  render(<DocumentDetail id="doc" />);
  await screen.findByRole('alert', {name: ''});
  expect(screen.getByText('Accès refusé par les droits du projet.')).toBeInTheDocument();
  expect(screen.queryByText('Current title')).toBeNull();
});
it('activity history displays canonical events', async () => {
  window.history.replaceState({}, '', '/documents/doc?tab=history');
  vi.mocked(evoRailApi.activity).mockResolvedValue([{id: 'event', event_type: 'revision.created', entity_id: 'old', entity_type: 'revision', created_at: '2026-10-01T12:00:00Z'}]);
  render(<DocumentDetail id="doc" />);
  await screen.findByText('revision · created');
  expect(evoRailApi.activity).toHaveBeenCalledWith('doc');
});
it('register selected download targets the current revision and shows denial', async () => {
  vi.mocked(evoRailApi.revision).mockResolvedValue(current);
  window.history.replaceState({}, '', '/documents?selected=CODE');
  vi.mocked(evoRailApi.documents).mockResolvedValue({items: [doc], pagination: {total: 1, current_page: 1, last_page: 1, per_page: 25}});
  vi.spyOn(evoRailApi, 'file').mockRejectedValue(Object.assign(new Error('Denied'), {status: 403}));
  render(<DocumentsPage />);
  await screen.findByText('CODE');
  fireEvent.click(screen.getByRole('button', {name: 'Télécharger'}));
  await screen.findByRole('alert');
  expect(evoRailApi.revision).toHaveBeenCalledWith('current');
  expect(evoRailApi.file).toHaveBeenCalledWith('download', 'current');
});
