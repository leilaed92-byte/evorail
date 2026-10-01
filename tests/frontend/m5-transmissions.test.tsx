import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import {TransmissionComposer, TransmissionDetailPage, TransmissionsPage} from '../../src/m5';
import {evoRailApi} from '../../src/api/evoRailApi';

const project = {id: 'project-a', code: 'LNA', name: 'Line A', permissions: {viewProject: true}};
const user = {id: 'user-a', name: 'Amina Kaci', email: 'amina@example.test', projects: [project]};
const revision = {id: 'revision-c', document_id: 'document-1', revision_code: 'C', revision_order: 3, title: 'Alignment Rev C', workflow_status: 'completed', suitability_status: 'issued_for_construction', effective_state: 'superseded', file: {id: 'file-c', original_filename: 'alignment-c.pdf', mime_type: 'application/pdf', size: 10, checksum: 'checksum-c'}};
const item = {id: 'item-1', transmission_id: 'tx-1', document_id: 'document-1', revision_id: revision.id, document: {id: 'document-1', document_number: 'LNA-EVO-TRK-DWG-S05-00142', title: 'Track alignment', discipline: 'TRK'}, revision, snapshot: {document_number: 'LNA-EVO-TRK-DWG-S05-00142', document_title: 'Track alignment', revision_code: 'C', discipline: 'TRK', suitability: 'issued_for_construction', workflow: 'completed', effective_state: 'superseded', file_name: 'alignment-c.pdf', file_checksum: 'checksum-c'}};
const transmission = {id: 'tx-1', project_id: project.id, reference: 'TR-20261001-ABCD1234', subject: 'For review', purpose: 'Design review', status: 'issued' as const, created_by: {id: user.id, name: user.name}, issued_by: {id: user.id, name: user.name}, issued_at: '2026-10-01T10:00:00Z', recipients: [{id: 'recipient-1', transmission_id: 'tx-1', recipient_type: 'contact', recipient_name: 'PMC Atlas'}], items: [item]};

vi.mock('../../src/api/EvoRailProvider', () => ({useEvoRail: () => ({project, user}), EvoRailProvider: ({children}: {children: unknown}) => children}));
vi.mock('../../src/api/projectLocation', () => ({navigateInProject: vi.fn(), projectHref: (path: string) => path, projectPathname: () => window.location.pathname}));

beforeEach(() => {
  window.history.replaceState({}, '', '/transmittals');
  vi.restoreAllMocks();
  vi.spyOn(evoRailApi, 'transmissions').mockResolvedValue({items: [transmission], pagination: {total: 1, current_page: 1, last_page: 1, per_page: 25}});
  vi.spyOn(evoRailApi, 'transmission').mockResolvedValue({transmission, activity: []});
  vi.spyOn(evoRailApi, 'documents').mockResolvedValue({items: [{id: 'document-1', project_id: project.id, document_number: 'LNA-EVO-TRK-DWG-S05-00142', title: 'Track alignment', discipline: 'TRK', workflow_status: 'completed', suitability_status: 'issued_for_construction', effective_state: 'current', current_revision_id: revision.id}], pagination: {total: 1, current_page: 1, last_page: 1, per_page: 100}});
  vi.spyOn(evoRailApi, 'revisions').mockResolvedValue([revision]);
  vi.spyOn(evoRailApi, 'createTransmission').mockResolvedValue({...transmission, status: 'draft', reference: null, recipients: [], items: []});
  vi.spyOn(evoRailApi, 'addTransmissionRecipient').mockResolvedValue(transmission.recipients[0]);
  vi.spyOn(evoRailApi, 'addTransmissionItem').mockResolvedValue(item);
  vi.spyOn(evoRailApi, 'issueTransmission').mockResolvedValue(transmission);
});

it('transmission register uses server filters and shows issued state', async () => {
  window.history.replaceState({}, '', '/transmittals?status=issued&search=TR-2026');
  render(<TransmissionsPage />);
  await screen.findByText('TR-20261001-ABCD1234');
  expect(evoRailApi.transmissions).toHaveBeenCalledWith(project.id, {search: 'TR-2026', status: 'issued'});
  expect(screen.getByText('Émise')).toBeInTheDocument();
});

it('issued detail displays the exact frozen revision and download uses the protected API', async () => {
  vi.spyOn(evoRailApi, 'downloadTransmission').mockResolvedValue({transmission, manifest: [{item_id: item.id, document_id: item.document_id, revision_id: item.revision_id, revision_code: 'C', file_name: 'alignment-c.pdf', file_checksum: 'checksum-c', download_url: '/api/revisions/revision-c/download'}]});
  render(<TransmissionDetailPage id={transmission.id} />);
  await screen.findByText('Rev C');
  expect(screen.getByText('checksum-c')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Télécharger le manifeste'}));
  await waitFor(() => expect(evoRailApi.downloadTransmission).toHaveBeenCalledWith(transmission.id));
});

it('composer requires an explicit revision and issues only after confirmation', async () => {
  window.history.replaceState({}, '', '/transmittals/new');
  vi.stubGlobal('confirm', vi.fn(() => true));
  render(<TransmissionComposer />);
  fireEvent.change(screen.getByLabelText('Sujet'), {target: {value: 'Issue exact C'}});
  fireEvent.click(screen.getByRole('button', {name: 'Créer le brouillon'}));
  await screen.findByText('3. Items — révision exacte obligatoire');
  fireEvent.change(screen.getByLabelText('Nom'), {target: {value: 'PMC Atlas'}});
  fireEvent.click(screen.getByRole('button', {name: 'Ajouter le destinataire'}));
  fireEvent.change(screen.getByLabelText('Document'), {target: {value: 'document-1'}});
  await screen.findByText('Rev C · Alignment Rev C · superseded');
  fireEvent.change(screen.getByLabelText('Révision exacte'), {target: {value: 'revision-c'}});
  fireEvent.click(screen.getByRole('button', {name: "Ajouter l'item exact"}));
  await waitFor(() => expect(evoRailApi.addTransmissionItem).toHaveBeenCalledWith(expect.any(String), {documentId: 'document-1', revisionId: 'revision-c'}));
  await waitFor(() => expect(screen.getByRole('button', {name: 'Émettre le package'})).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', {name: 'Émettre le package'}));
  await waitFor(() => expect(evoRailApi.issueTransmission).toHaveBeenCalledTimes(1));
  expect(window.confirm).toHaveBeenCalled();
});

it('backend denial is rendered without fixture data', async () => {
  vi.mocked(evoRailApi.transmission).mockRejectedValue(Object.assign(new Error('Forbidden'), {status: 403}));
  render(<TransmissionDetailPage id="foreign-transmission" />);
  await screen.findByRole('alert');
  expect(screen.getByText('Accès refusé par les droits du projet.')).toBeInTheDocument();
  expect(screen.queryByText('Track alignment')).toBeNull();
});
