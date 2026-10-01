import {test, expect, type Page} from '@playwright/test';

const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:8002';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.test';
const password = process.env.E2E_PASSWORD ?? 'password';

async function login(page: Page) {
  await page.goto('/signin');
  await page.getByLabel('Adresse e-mail professionnelle').fill(adminEmail);
  await page.getByLabel(/^Mot de passe/).fill(password);
  await page.getByRole('button', {name: 'Se connecter', exact: true}).click();
  await expect(page).toHaveURL(/overview/);
}

async function postAsBrowser(page: Page, path: string, body: Record<string, string>, idempotencyKey?: string) {
  return page.evaluate(async ({api, path, body, idempotencyKey}) => {
    const xsrf = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('XSRF-TOKEN='));
    const headers: Record<string, string> = {Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.slice('XSRF-TOKEN='.length) ?? '')};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const response = await fetch(`${api}${path}`, {method: 'POST', credentials: 'include', headers, body: JSON.stringify(body)});
    return {status: response.status, body: await response.json()};
  }, {api, path, body, idempotencyKey});
}

test('draft → exact revision → review → issue → later revision leaves snapshot frozen', async ({page}) => {
  await login(page);
  const projects = await (await page.request.get(`${api}/api/projects`)).json();
  const projectId = projects.data.items[0].id;
  const documents = await (await page.request.get(`${api}/api/projects/${projectId}/documents`)).json();
  const document = documents.data.items[0];
  const revision = (await (await page.request.get(`${api}/api/revisions/${document.current_revision_id}`)).json()).data.revision;
  const created = await postAsBrowser(page, `/api/projects/${projectId}/transmissions`, {subject: `M5 browser ${Date.now()}`, purpose: 'For review'}, `m5-create-${Date.now()}`);
  expect(created.status).toBe(201);
  const transmissionId = created.body.data.transmission.id;
  expect((await postAsBrowser(page, `/api/transmissions/${transmissionId}/recipients`, {recipient_type: 'contact', recipient_name: 'PMC Atlas'})).status).toBe(201);
  expect((await postAsBrowser(page, `/api/transmissions/${transmissionId}/items`, {document_id: document.id, revision_id: revision.id})).status).toBe(201);

  await page.goto(`/transmittals/${transmissionId}?project=${projectId}`);
  await expect(page.getByText(`Rev ${revision.revision_code}`, {exact: false}).first()).toBeVisible();
  await page.getByRole('button', {name: 'Ouvrir le compositeur'}).click();
  await expect(page).toHaveURL(new RegExp(`/transmittals/${transmissionId}/edit`));
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Émettre le package'}).click();
  await expect(page.getByText('INSTANTANÉ ÉMIS')).toBeVisible();
  await expect(page.getByText(`Rev ${revision.revision_code}`, {exact: false}).first()).toBeVisible();

  const issued = await (await page.request.get(`${api}/api/transmissions/${transmissionId}`)).json();
  expect(issued.data.transmission.status).toBe('issued');
  expect(issued.data.transmission.items[0].revision_id).toBe(revision.id);
  expect(issued.data.transmission.items[0].snapshot.file_checksum).toBe(revision.file.checksum);
  const laterCode = `M5-${Date.now().toString(36)}`;
  await page.goto(`/documents/${document.id}?project=${projectId}&tab=versions`);
  await page.getByLabel('Code de révision').fill(laterCode);
  await page.getByLabel('Titre', {exact: true}).fill('M5 later revision');
  await page.getByLabel('Motif du changement').fill('Verify issued transmission snapshot remains historical');
  await page.getByLabel('Fichier contrôlé').setInputFiles({name: 'm5-later.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nM5 later\n')});
  await page.getByRole('button', {name: 'Créer la révision', exact: true}).click();
  await expect(page.getByText('Révision créée.')).toBeVisible();
  await page.goto(`/transmittals/${transmissionId}?project=${projectId}`);
  await expect(page.getByText(`Rev ${revision.revision_code}`, {exact: false}).first()).toBeVisible();
  expect(await page.getByText(`Rev ${laterCode}`, {exact: false}).count()).toBe(0);
  const manifest = await (await page.request.get(`${api}/api/transmissions/${transmissionId}/download`)).json();
  expect(manifest.data.manifest[0].revision_code).toBe(revision.revision_code);
  expect(manifest.data.activity).toBeUndefined();

  const concurrent = await postAsBrowser(page, `/api/projects/${projectId}/transmissions`, {subject: `M5 concurrent ${Date.now()}`, purpose: 'Concurrency'}, `m5-concurrent-create-${Date.now()}`);
  const concurrentId = concurrent.body.data.transmission.id;
  await postAsBrowser(page, `/api/transmissions/${concurrentId}/recipients`, {recipient_type: 'contact', recipient_name: 'PMC Atlas'});
  await postAsBrowser(page, `/api/transmissions/${concurrentId}/items`, {document_id: document.id, revision_id: revision.id});
  const issueResponses = await Promise.all([
    postAsBrowser(page, `/api/transmissions/${concurrentId}/issue`, {}, `m5-concurrent-a-${Date.now()}`),
    postAsBrowser(page, `/api/transmissions/${concurrentId}/issue`, {}, `m5-concurrent-b-${Date.now()}`),
  ]);
  expect(issueResponses.map(response => response.status).sort()).toEqual([200, 409]);
  const concurrentAudit = await (await page.request.get(`${api}/api/transmissions/${concurrentId}`)).json();
  expect(concurrentAudit.data.transmission.status).toBe('issued');
});
