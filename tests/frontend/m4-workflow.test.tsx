import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import {ApprovalDetail, ApprovalsPage, MyWorkPage, ReviewDetail, ReviewsPage} from '../../src/m4';
import {evoRailApi} from '../../src/api/evoRailApi';

const project = {id: 'project-a', code: 'LNA', name: 'Line A', permissions: {viewProject: true}};
const user = {id: 'user-a', name: 'Amina Kaci', email: 'amina@example.test', projects: [project]};
const revision = {id: 'revision-b', revision_code: 'B', title: 'Exact title', workflow_status: 'under_review', suitability_status: 'for_review', effective_state: 'superseded'} as const;
const review = {id: 'review-1', project_id: project.id, document_id: 'document-1', revision_id: revision.id, status: 'in_progress' as const, document: {id: 'document-1', document_number: 'LNA-EVO-TRK-DWG-S05-00142', title: 'Track alignment', discipline: 'TRK'}, revision, assignee: {id: user.id, name: user.name}, comments: []};
const approval = {id: 'approval-1', project_id: project.id, document_id: 'document-1', revision_id: revision.id, status: 'pending' as const, document: review.document, revision, approver: {id: user.id, name: user.name}, requested_by: {id: 'requester', name: 'Sara Mehdi'}, requested_at: '2026-09-30T10:00:00Z'};

vi.mock('../../src/api/EvoRailProvider', () => ({useEvoRail: () => ({project, user}), EvoRailProvider: ({children}: {children: unknown}) => children}));
vi.mock('../../src/api/projectLocation', () => ({navigateInProject: vi.fn(), projectHref: (path: string) => path, projectPathname: () => window.location.pathname}));

beforeEach(() => {
  window.history.replaceState({}, '', '/reviews');
  vi.restoreAllMocks();
  vi.spyOn(evoRailApi, 'reviews').mockResolvedValue({items: [review], pagination: {total: 1, current_page: 1, last_page: 1, per_page: 25}});
  vi.spyOn(evoRailApi, 'review').mockResolvedValue({review, activity: []});
  vi.spyOn(evoRailApi, 'commentReview').mockResolvedValue({id: 'comment-1', review_id: review.id, body: 'Needs check'});
  vi.spyOn(evoRailApi, 'transitionReview').mockResolvedValue({...review, status: 'completed'});
  vi.spyOn(evoRailApi, 'approvals').mockResolvedValue({items: [approval], pagination: {total: 1, current_page: 1, last_page: 1, per_page: 25}});
  vi.spyOn(evoRailApi, 'approval').mockResolvedValue({approval, activity: []});
  vi.spyOn(evoRailApi, 'decideApproval').mockResolvedValue({...approval, status: 'approved', decided_at: '2026-10-01T10:00:00Z'});
});

it('review queue uses server filters and displays the exact revision', async () => {
  window.history.replaceState({}, '', '/reviews?status=in_progress&overdue=1&revision_id=revision-b&page=2');
  render(<ReviewsPage />);
  await screen.findByText('LNA-EVO-TRK-DWG-S05-00142');
  expect(evoRailApi.reviews).toHaveBeenCalledWith(project.id, expect.objectContaining({status: 'in_progress', overdue: '1', revision_id: 'revision-b', page: '2'}));
  expect(screen.getByText('Rev B')).toBeInTheDocument();
});

it('review detail comments and transitions refresh without unsafe retries', async () => {
  render(<ReviewDetail id={review.id} />);
  await screen.findByText('Révision exacte');
  fireEvent.change(screen.getByLabelText('Ajouter un commentaire'), {target: {value: 'Needs check'}});
  fireEvent.submit(screen.getByLabelText('Ajouter un commentaire').closest('form')!);
  await waitFor(() => expect(evoRailApi.commentReview).toHaveBeenCalledWith(review.id, 'Needs check'));
  fireEvent.click(screen.getByRole('button', {name: 'Terminer'}));
  await waitFor(() => expect(evoRailApi.transitionReview).toHaveBeenCalledWith(review.id, 'complete'));
  expect(evoRailApi.transitionReview).toHaveBeenCalledTimes(1);
});

it('approval queue uses a real API and exact revision filter', async () => {
  window.history.replaceState({}, '', '/approvals?status=pending&revision_id=revision-b');
  render(<ApprovalsPage />);
  await screen.findByText('LNA-EVO-TRK-DWG-S05-00142');
  expect(evoRailApi.approvals).toHaveBeenCalledWith(project.id, expect.objectContaining({status: 'pending', revision_id: 'revision-b'}));
  expect(screen.getByText('Rev B')).toBeInTheDocument();
});

it('approval requires confirmation and hides final decision controls after success', async () => {
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.mocked(evoRailApi.approval).mockResolvedValueOnce({approval, activity: []}).mockResolvedValueOnce({approval: {...approval, status: 'approved', decided_at: '2026-10-01T10:00:00Z'}, activity: []});
  render(<ApprovalDetail id={approval.id} />);
  await screen.findByText('Décision');
  fireEvent.click(screen.getByRole('button', {name: 'Approuver'}));
  await waitFor(() => expect(evoRailApi.decideApproval).toHaveBeenCalledWith(approval.id, 'approve', undefined));
  expect(window.confirm).toHaveBeenCalled();
  expect(screen.queryByRole('button', {name: 'Approuver'})).toBeNull();
});

it('workflow detail shows backend errors without fixtures', async () => {
  vi.mocked(evoRailApi.review).mockRejectedValue(Object.assign(new Error('Forbidden'), {status: 403}));
  render(<ReviewDetail id="foreign-review" />);
  await screen.findByRole('alert');
  expect(screen.getByText('Accès refusé par les droits du projet.')).toBeInTheDocument();
  expect(screen.queryByText('Track alignment')).toBeNull();
});

it('My Work keeps assigned reviews and pending approvals visibly separate', async () => {
  window.history.replaceState({}, '', '/my-work');
  render(<MyWorkPage />);
  await screen.findByText('Avis assignés');
  await screen.findByText('Approbations en attente');
  expect(evoRailApi.reviews).toHaveBeenCalledWith(project.id, expect.objectContaining({assignee_user_id: user.id}));
  expect(evoRailApi.approvals).toHaveBeenCalledWith(project.id, expect.objectContaining({approver_user_id: user.id, status: 'pending'}));
  expect(screen.getByText('Avis')).toBeInTheDocument();
  expect(screen.getByText('Approbation')).toBeInTheDocument();
});
