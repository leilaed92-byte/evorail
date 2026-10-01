import {test, expect, type Page} from '@playwright/test';

const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:8002';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.test';
const password = process.env.E2E_PASSWORD ?? 'password';

async function login(page: Page, email = adminEmail) {
  await page.goto('/signin');
  await page.getByLabel('Adresse e-mail professionnelle').fill(email);
  await page.getByLabel(/^Mot de passe/).fill(password);
  await page.getByRole('button', {name: 'Se connecter', exact: true}).click();
  await expect(page).toHaveURL(/overview/);
}

async function postAsBrowser(page: Page, path: string, body: Record<string, string>) {
  return page.evaluate(async ({api, path, body}) => {
    const xsrf = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${api}${path}`, {method: 'POST', credentials: 'include', headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.slice('XSRF-TOKEN='.length) ?? '')}, body: JSON.stringify(body)});
    return {status: response.status, body: await response.json()};
  }, {api, path, body});
}

test('review and approval flows keep exact revision and immutable audit history', async ({page}) => {
  await login(page);
  const projects = await (await page.request.get(`${api}/api/projects`)).json();
  const projectId = projects.data.items[0].id;
  const documents = await (await page.request.get(`${api}/api/projects/${projectId}/documents`)).json();
  const document = documents.data.items[0];
  const revisionId = document.current_revision_id;
  const me = await (await page.request.get(`${api}/api/me`)).json();
  const created = await postAsBrowser(page, `/api/documents/${document.id}/reviews`, {revision_id: revisionId, assignee_user_id: me.data.user.id, due_at: new Date(Date.now() + 86_400_000).toISOString()});
  expect(created.status).toBe(201);
  const reviewId = created.body.data.review.id;
  await page.goto(`/reviews/${reviewId}?project=${projectId}`);
  await expect(page.getByText('Révision exacte', {exact: true})).toBeVisible();
  await page.getByLabel('Ajouter un commentaire').fill('Browser review comment');
  await page.getByRole('button', {name: 'Commenter'}).click();
  await page.getByRole('button', {name: 'Démarrer'}).click();
  await page.getByRole('button', {name: 'Terminer'}).click();
  await expect(page.getByText('Cette revue est terminée')).toBeVisible();
  const activity = await (await page.request.get(`${api}/api/reviews/${reviewId}`)).json();
  expect(activity.data.review.revision_id).toBe(revisionId);
  expect(activity.data.activity.some((event: {event_type: string}) => event.event_type === 'review.completed')).toBe(true);
  const returned = await postAsBrowser(page, `/api/documents/${document.id}/reviews`, {revision_id: revisionId, assignee_user_id: me.data.user.id});
  expect(returned.status).toBe(201);
  const returnedId = returned.body.data.review.id;
  await page.goto(`/reviews/${returnedId}?project=${projectId}`);
  await page.getByRole('button', {name: 'Démarrer'}).click();
  await page.getByRole('button', {name: 'Retourner'}).click();
  await expect(page.getByText('Retourné', {exact: true})).toBeVisible();
  const approvalCreated = await postAsBrowser(page, `/api/documents/${document.id}/approvals`, {revision_id: document.current_revision_id, approver_user_id: me.data.user.id});
  expect(approvalCreated.status).toBe(201);
  const approvalId = approvalCreated.body.data.approval.id;
  await page.goto(`/approvals/${approvalId}?project=${projectId}`);
  await expect(page.getByText('Révision exacte', {exact: true})).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Approuver'}).click();
  await expect(page.getByText('Les contrôles de décision sont masqués')).toBeVisible();
  expect(await page.getByRole('button', {name: 'Approuver'}).count()).toBe(0);
  const final = await (await page.request.get(`${api}/api/approvals/${approvalId}`)).json();
  expect(final.data.approval.status).toBe('approved');
  expect(final.data.approval.revision_id).toBe(document.current_revision_id);
  const rejected = await postAsBrowser(page, `/api/documents/${document.id}/approvals`, {revision_id: document.current_revision_id, approver_user_id: me.data.user.id});
  expect(rejected.status).toBe(201);
  const rejectedId = rejected.body.data.approval.id;
  await page.goto(`/approvals/${rejectedId}?project=${projectId}`);
  await page.getByRole('button', {name: 'Rejeter'}).click();
  await expect(page.getByText('Les contrôles de décision sont masqués')).toBeVisible();
  const rejectedFinal = await (await page.request.get(`${api}/api/approvals/${rejectedId}`)).json();
  expect(rejectedFinal.data.approval.status).toBe('rejected');
});
