import {beforeEach, describe, expect, it, vi} from 'vitest';
import {evoRailApi} from '../../src/api/evoRailApi';

const fetchMock = vi.fn<typeof fetch>();
const user = {id: 'user-a', name: 'User A', email: 'a@example.test', projects: []};
const respond = (data: unknown, status = 200) => new Response(JSON.stringify({data}), {status});

beforeEach(() => vi.stubGlobal('fetch', fetchMock.mockReset()));

describe('M2 session API', () => {
  it('bootstraps /api/me with credentials and JSON headers', async () => {
    fetchMock.mockResolvedValue(respond({user}));
    expect(await evoRailApi.me()).toEqual(user);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${evoRailApi.baseUrl}/api/me`);
    expect(options?.credentials).toBe('include');
    expect(new Headers(options?.headers).get('Accept')).toBe('application/json');
  });

  it('obtains CSRF before login and sends the decoded XSRF token', async () => {
    document.cookie = 'XSRF-TOKEN=token%3Dvalue; path=/';
    fetchMock.mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(respond({user}));
    expect(await evoRailApi.login(user.email, 'secret')).toEqual(user);
    expect(fetchMock.mock.calls[0][0]).toBe(`${evoRailApi.baseUrl}/sanctum/csrf-cookie`);
    const [, options] = fetchMock.mock.calls[1];
    expect(options?.method).toBe('POST');
    expect(options?.credentials).toBe('include');
    expect(new Headers(options?.headers).get('X-XSRF-TOKEN')).toBe('token=value');
    expect(JSON.parse(options?.body as string)).toEqual({email: user.email, password: 'secret'});
  });

  it('logs out using the session and returns authorized project items', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(respond({logged_out: true})).mockResolvedValueOnce(respond({items: [{id: 'project-a'}]}));
    await evoRailApi.logout();
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
    expect(await evoRailApi.projects()).toEqual([{id: 'project-a'}]);
  });

  it.each([401, 403, 409, 422, 503])('preserves HTTP %i and structured errors', async status => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({message: 'Denied', code: 'denied', errors: {title: ['Required']}}), {status}));
    await expect(evoRailApi.me()).rejects.toMatchObject({status, message: 'Denied', code: 'denied', errors: {title: ['Required']}});
  });

  it('stops login when CSRF initialization fails', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({message: 'CSRF unavailable'}), {status: 503}));
    await expect(evoRailApi.login(user.email, 'secret')).rejects.toMatchObject({status: 503});
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('preserves 401 even if an upstream response is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Unauthorized</html>', {status: 401}));
    await expect(evoRailApi.me()).rejects.toMatchObject({status: 401});
  });

  it('fails closed on a malformed auth payload', async () => {
    fetchMock.mockResolvedValue(respond({user: {name: 'Fixture-like identity'}}));
    await expect(evoRailApi.me()).rejects.toMatchObject({status: 0, unavailable: true});
  });

  it('reports server unavailability without fabricating user data', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(evoRailApi.me()).rejects.toMatchObject({unavailable: true, status: 0});
  });
});

describe('M3 document API', () => {
  it('encodes project and search inputs and returns list pagination', async () => {
    fetchMock.mockResolvedValue(respond({items: [], pagination: {total: 0}}));
    expect(await evoRailApi.documents('project/a', 'bridge & rail')).toEqual({items: [], pagination: {total: 0}});
    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(url.pathname).toBe('/api/projects/project%2Fa/documents');
    expect(url.searchParams.get('search')).toBe('bridge & rail');
  });

  it('unwraps document detail and revision history', async () => {
    fetchMock.mockResolvedValueOnce(respond({document: {id: 'doc-a'}})).mockResolvedValueOnce(respond({items: [{id: 'rev-a'}]}));
    expect(await evoRailApi.document('doc-a')).toEqual({id: 'doc-a'});
    expect(await evoRailApi.revisions('doc-a')).toEqual([{id: 'rev-a'}]);
  });

  it.each(['preview', 'download'] as const)('addresses %s using the exact revision ID', kind => {
    expect(evoRailApi.fileUrl(kind, 'revision/a')).toBe(`${evoRailApi.baseUrl}/api/revisions/revision%2Fa/${kind}`);
  });

  it('uploads a new revision with a fresh idempotency key and browser multipart boundary', async () => {
    fetchMock.mockImplementation(async () => respond({revision: {id: 'rev-b', revision_code: 'B'}}));
    const input = {revisionCode: 'B', title: 'Bridge', changeReason: 'Updated geometry', file: new File(['new bytes'], 'b.pdf', {type: 'application/pdf'})};
    await evoRailApi.createRevision('doc-a', input);
    await evoRailApi.createRevision('doc-a', input);
    const [, first] = fetchMock.mock.calls[0];
    const [, second] = fetchMock.mock.calls[1];
    expect(first?.method).toBe('POST');
    expect(first?.body).toBeInstanceOf(FormData);
    expect((first?.body as FormData).get('revision_code')).toBe('B');
    expect((first?.body as FormData).get('file')).toBe(input.file);
    const headers = new Headers(first?.headers);
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.get('Idempotency-Key')).toBeTruthy();
    expect(headers.get('Idempotency-Key')).not.toBe(new Headers(second?.headers).get('Idempotency-Key'));
  });
});
