import {test, expect, type Page} from '@playwright/test';
import {createHash} from 'node:crypto';

const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:8002';
const emailA = process.env.E2E_EMAIL_A ?? 'user-a@example.test';
const emailB = process.env.E2E_EMAIL_B ?? 'user-b@example.test';
const password = process.env.E2E_PASSWORD ?? 'password';

async function login(page: Page, email: string) {
  await page.goto('/signin');
  await page.getByLabel('Adresse e-mail professionnelle').fill(email);
  await page.getByLabel(/^Mot de passe/).fill(password);
  await page.getByRole('button', {name: 'Se connecter', exact: true}).click();
  await expect(page).toHaveURL(/overview/);
  await expect.poll(async () => (await page.request.get(`${api}/api/me`)).status()).toBe(200);
}

test('login → project → documents → search/filter → exact A → create B → refresh leaves A unchanged', async ({page}) => {
  await login(page, emailA);
  const projects = await (await page.request.get(`${api}/api/projects`)).json();
  const projectId = projects.data.items[0].id;
  const list = await (await page.request.get(`${api}/api/projects/${projectId}/documents`)).json();
  expect(list.data.items.length).toBeGreaterThan(0);
  const document = list.data.items[0];
  const revisionId = document.current_revision_id;
  expect(revisionId).toBeTruthy();
  const before = await (await page.request.get(`${api}/api/revisions/${revisionId}`)).json();
  const bytesBefore = await (await page.request.get(`${api}/api/revisions/${revisionId}/download`)).body();

  await page.goto(`/documents?project=${projectId}`);
  await page.getByRole('textbox', {name: 'Rechercher des documents'}).fill(document.document_number);
  await page.getByRole('button', {name: /Actuels/}).click();
  await page.getByRole('button', {name: new RegExp(document.document_number)}).first().click();
  await page.getByRole('tab', {name: /Versions/}).click();
  await page.getByRole('button', {name: new RegExp(`Rev ${before.data.revision.revision_code} ·`)}).click();
  await expect(page).toHaveURL(new RegExp(`/revisions/${revisionId}`));
  await page.reload();
  await expect(page.getByText(before.data.revision.title, {exact: true}).first()).toBeVisible();

  await page.goto(`/documents/${document.id}?project=${projectId}&tab=versions`);
  const code = `B-${Date.now().toString(36)}`;
  await page.getByLabel('Code de révision').fill(code);
  await page.getByLabel('Titre', {exact: true}).fill('E2E revision B');
  await page.getByLabel('Motif du changement').fill('M3 browser immutability verification');
  await page.getByLabel('Fichier contrôlé').setInputFiles({name: 'revision-b.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nE2E revision B\n')});
  await page.getByRole('button', {name: 'Créer la révision', exact: true}).click();
  await expect(page.getByText('Révision créée.')).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Rev ${code} · E2E revision B`)).toBeVisible();
  const after = await (await page.request.get(`${api}/api/revisions/${revisionId}`)).json();
  const bytesAfter = await (await page.request.get(`${api}/api/revisions/${revisionId}/download`)).body();
  expect(after.data.revision).toEqual(before.data.revision);
  expect(bytesAfter).toEqual(bytesBefore);
  expect(createHash('sha256').update(bytesAfter).digest('hex')).toBe(before.data.revision.file.checksum);
});

test('User A is denied direct Project B, Document B, Revision B, Preview B and Download B', async ({page, browser}) => {
  const other = await browser.newContext({baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174', extraHTTPHeaders: {Origin: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'}});
  try {
    const pageB = await other.newPage();
    await login(pageB, emailB);
    const projects = await (await pageB.request.get(`${api}/api/projects`)).json();
    const projectB = projects.data.items[0].id;
    const documents = await (await pageB.request.get(`${api}/api/projects/${projectB}/documents`)).json();
    const documentB = documents.data.items[0];
    await login(page, emailA);
    for (const path of [`projects/${projectB}`, `projects/${projectB}/documents`, `documents/${documentB.id}`, `documents/${documentB.id}/revisions`, `revisions/${documentB.current_revision_id}`, `revisions/${documentB.current_revision_id}/preview`, `revisions/${documentB.current_revision_id}/download`]) {
      const response = await page.request.get(`${api}/api/${path}`);
      expect(response.status(), path).toBe(403);
      expect((await response.json()).code).toBe('forbidden');
    }
    await page.goto(`/documents?project=${projectB}`);
    await expect(page.getByText(/Accès au projet refusé|Accès refusé|unauthorized/i).first()).toBeVisible();
    expect(await page.getByText(documentB.document_number, {exact: true}).count()).toBe(0);
  } finally {
    await other.close();
  }
});

test('User A cannot create a revision in Document B through browser multipart upload', async ({page, browser}) => {
  const other = await browser.newContext({baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174', extraHTTPHeaders: {Origin: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'}});
  try {
    const pageB = await other.newPage();
    await login(pageB, emailB);
    const projects = await (await pageB.request.get(`${api}/api/projects`)).json();
    const documents = await (await pageB.request.get(`${api}/api/projects/${projects.data.items[0].id}/documents`)).json();
    const documentB = documents.data.items[0];
    await login(page, emailA);
    const denied = await page.evaluate(async ({api, id}) => {
      const csrf = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('XSRF-TOKEN='));
      const form = new FormData();
      form.set('revision_code', 'FORBIDDEN'); form.set('title', 'Forbidden'); form.set('change_reason', 'IDOR test');
      form.set('file', new File(['%PDF-1.4\nDenied'], 'denied.pdf', {type: 'application/pdf'}));
      const response = await fetch(`${api}/api/documents/${id}/revisions`, {method: 'POST', credentials: 'include', headers: {Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': decodeURIComponent(csrf?.slice('XSRF-TOKEN='.length) ?? ''), 'Idempotency-Key': crypto.randomUUID()}, body: form});
      return response.status;
    }, {api, id: documentB.id});
    expect(denied).toBe(403);
    const after = await (await pageB.request.get(`${api}/api/documents/${documentB.id}/revisions`)).json();
    expect(after.data.items.some((revision: {revision_code: string}) => revision.revision_code === 'FORBIDDEN')).toBe(false);
  } finally {
    await other.close();
  }
});

test('unauthenticated and unavailable API never show demo documents', async ({page}) => {
  await page.route('**/api/me', route => route.fulfill({status: 401, contentType: 'application/json', body: JSON.stringify({message: 'Unauthenticated.', code: 'unauthenticated'})}));
  await page.goto('/documents');
  await expect(page.getByRole('button', {name: 'Se connecter', exact: true})).toBeVisible();
  expect(await page.getByText('Interface drainage de quai', {exact: true}).count()).toBe(0);
  await page.unroute('**/api/me');
  await page.route('**/api/me', route => route.abort('failed'));
  await page.reload();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.getByText('Interface drainage de quai', {exact: true}).count()).toBe(0);
});
