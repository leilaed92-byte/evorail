// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {apiErrorMessage, evoRailApi, serializeDocumentFilters} from '../../src/api/evoRailApi';
import {readRegisterState} from '../../src/api/m3';
const fetchMock = vi.fn();
const ok = (data: unknown) => new Response(JSON.stringify({data}), {headers: {'Content-Type': 'application/json'}});
beforeEach(() => {vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset();});
afterEach(() => vi.unstubAllGlobals());

describe('M3 canonical API', () => {
  it('serializes all server filters, sort, pagination and false without selected state', async () => {
    const filters = readRegisterState('?search=rail+%26+track&workflow_status=under_review&suitability=for_review&effective_state=current&discipline=TRK&revision=A&current_only=0&sort=-updated_at&page=3&per_page=10&selected=d1');
    const params = new URLSearchParams(serializeDocumentFilters(filters));
    expect(Object.fromEntries(params)).toEqual({search: 'rail & track', workflow_status: 'under_review', suitability: 'for_review', effective_state: 'current', discipline: 'TRK', revision: 'A', current_only: '0', sort: '-updated_at', page: '3', per_page: '10'});
    const pagination = {current_page: 3, last_page: 5, per_page: 10, total: 42};
    fetchMock.mockResolvedValue(ok({items: [], pagination}));
    expect(await evoRailApi.documents('project/id', filters)).toEqual({items: [], pagination});
    expect(fetchMock.mock.calls[0][0]).toContain('/api/projects/project%2Fid/documents?');
    expect(fetchMock.mock.calls[0][0]).toContain('page=3');
  });
  it('defaults to 25 rows and normalizes URL pagination', () => {
    expect(serializeDocumentFilters()).toBe('per_page=25');
    expect(readRegisterState('?page=-1&per_page=1000')).toMatchObject({page: 1, per_page: 100});
  });
  it.each([
    ['document', () => evoRailApi.document('doc-1'), {document: {id: 'doc-1'}}, {id: 'doc-1'}, '/api/documents/doc-1'],
    ['revision list', () => evoRailApi.revisions('doc-1'), {items: [{id: 'old'}]}, [{id: 'old'}], '/api/documents/doc-1/revisions'],
    ['exact old revision', () => evoRailApi.revision('old'), {revision: {id: 'old'}}, {id: 'old'}, '/api/revisions/old'],
    ['activity', () => evoRailApi.activity('doc-1'), {items: [{id: 'event'}]}, [{id: 'event'}], '/api/documents/doc-1/activity'],
    ['comparison', () => evoRailApi.compare('old', 'new'), {changes: {title: {from: 'A', to: 'B'}}}, {changes: {title: {from: 'A', to: 'B'}}}, '/api/revisions/old/compare/new'],
  ])('fetches %s using the canonical endpoint', async (_label, request, payload, result, path) => {
    fetchMock.mockResolvedValue(ok(payload));
    expect(await (request as () => Promise<unknown>)()).toEqual(result);
    expect(fetchMock.mock.calls[0][0]).toBe(`${evoRailApi.baseUrl}${path}`);
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });
  it.each(['preview', 'download'] as const)('fetches protected %s as a blob', async kind => {
    fetchMock.mockResolvedValue(new Response('file', {headers: {'Content-Type': 'application/pdf'}}));
    expect((await evoRailApi.file(kind, 'old')).size).toBe(4);
    expect(fetchMock.mock.calls[0][0]).toBe(`${evoRailApi.baseUrl}/api/revisions/old/${kind}`);
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });
  it.each([403, 404, 422])('preserves protected file error %s', async status => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({message: 'file error', code: 'preview_unavailable'}), {status}));
    await expect(evoRailApi.file('preview', 'old')).rejects.toMatchObject({status, code: 'preview_unavailable'});
  });
  it('posts FormData and the supplied idempotency key once', async () => {
    fetchMock.mockResolvedValue(ok({revision: {id: 'new'}}));
    const file = new File(['content'], 'drawing.pdf', {type: 'application/pdf'});
    expect(await evoRailApi.createRevision('doc', {revisionCode: 'B', title: 'Title', changeReason: 'Reason', file}, 'key-1')).toEqual({id: 'new'});
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.headers.get('Idempotency-Key')).toBe('key-1');
    expect(init.headers.has('Content-Type')).toBe(false);
    expect(init.body.get('revision_code')).toBe('B');
    expect(init.body.get('file').name).toBe('drawing.pdf');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([409, 422, 403])('does not retry creation after %s', async status => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({message: 'Rejected', errors: {revision_code: ['Duplicate or invalid']}}), {status}));
    await expect(evoRailApi.createRevision('doc', {revisionCode: 'B', title: 'Title', changeReason: 'Reason', file: new File(['x'], 'x.pdf')})).rejects.toMatchObject({status, errors: {revision_code: ['Duplicate or invalid']}});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('renders actionable validation and permission messages', () => {
    expect(apiErrorMessage(Object.assign(new Error('Invalid'), {status: 422, errors: {title: ['Required']}}))).toContain('title: Required');
    expect(apiErrorMessage(Object.assign(new Error('Duplicate'), {status: 409}))).toContain('Conflit');
    expect(apiErrorMessage(Object.assign(new Error(), {status: 403}))).toContain('Accès refusé');
  });
  it('empty production register and errors never return fixtures', async () => {
    fetchMock.mockResolvedValueOnce(ok({items: [], pagination: {total: 0, last_page: 1, current_page: 1, per_page: 25}}));
    expect((await evoRailApi.documents('project')).items).toEqual([]);
    fetchMock.mockRejectedValueOnce(new Error('Offline'));
    await expect(evoRailApi.documents('project')).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(new Response('{}', {status: 404}));
    await expect(evoRailApi.revision('old')).rejects.toMatchObject({status: 404});
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
