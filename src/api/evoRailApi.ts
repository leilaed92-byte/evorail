export type ApiUser = {
  id: string;
  name: string;
  email: string;
  projects: ApiProject[];
};

export type ApiProject = {
  id: string;
  code: string;
  name: string;
  phase?: string;
  status?: string;
  role?: string;
  permissions?: {
    viewProject?: boolean;
    createDocument?: boolean;
    createRevision?: boolean;
    viewAudit?: boolean;
  };
};

export type ApiDocument = {
  id: string;
  project_id: string;
  document_number: string;
  document_type?: 'document' | 'drawing';
  title: string;
  discipline: string;
  drawing_type?: string | null;
  zone?: string | null;
  location?: string | null;
  workflow_status: string;
  suitability_status: string;
  effective_state: string;
  current_revision_id: string | null;
  current_revision?: Pick<ApiRevision, 'id' | 'revision_code' | 'title' | 'workflow_status' | 'suitability_status' | 'effective_state'> | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiRevision = {
  id: string;
  document_id: string;
  revision_code: string;
  revision_order: number;
  title: string;
  workflow_status: string;
  suitability_status: string;
  effective_state: string;
  purpose_of_issue?: string | null;
  issue_date?: string | null;
  change_reason?: string | null;
  description?: string | null;
  metadata_snapshot?: Record<string, unknown> | null;
  file?: {
    id: string;
    original_filename: string;
    mime_type: string;
    size: number;
    checksum: string;
  } | null;
  created_at?: string;
};

export type DocumentFilters = Partial<Record<'search' | 'workflow_status' | 'suitability' | 'effective_state' | 'discipline' | 'document_type' | 'drawing_type' | 'zone' | 'location' | 'revision' | 'sort', string>> & {current_only?: boolean; page?: number; per_page?: number};
export type Pagination = {total: number; current_page: number; per_page: number; last_page: number};
export type RevisionComparison = {document_id: string; from: string; to: string; changes: Record<string, {from: unknown; to: unknown}>};
export type ApiPerson = {id: string; name: string; email?: string};
export type ApiReviewComment = {id: string; review_id: string; author?: ApiPerson; body: string; created_at?: string};
export type ApiReview = {
  id: string; project_id: string; document_id: string; revision_id: string; status: 'open' | 'in_progress' | 'returned' | 'completed' | 'cancelled';
  assignee?: ApiPerson | null; created_by?: ApiPerson | null; document?: {id: string; document_number: string; title: string; discipline?: string | null};
  revision?: Pick<ApiRevision, 'id' | 'revision_code' | 'title' | 'workflow_status' | 'suitability_status' | 'effective_state'>;
  due_at?: string | null; started_at?: string | null; completed_at?: string | null; returned_at?: string | null; comments?: ApiReviewComment[]; created_at?: string; updated_at?: string;
};
export type ApiApproval = {
  id: string; project_id: string; document_id: string; revision_id: string; status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approver?: ApiPerson | null; requested_by?: ApiPerson | null; document?: {id: string; document_number: string; title: string; discipline?: string | null};
  revision?: Pick<ApiRevision, 'id' | 'revision_code' | 'title' | 'workflow_status' | 'suitability_status' | 'effective_state'>;
  requested_at?: string; decided_at?: string | null; decision_reason?: string | null; approved_suitability_status?: string | null; created_at?: string; updated_at?: string;
};
export type ApiActivity = {id: string; event_type: string; entity_type: string; entity_id: string; metadata?: Record<string, unknown>; created_at?: string};
export type ApiTransmissionRecipient = {id: string; transmission_id: string; recipient_type: string; recipient_name: string; recipient_email?: string | null; recipient_address?: string | null; acknowledged_at?: string | null};
export type ApiTransmissionItem = {id: string; transmission_id: string; document_id: string; revision_id: string; document?: Pick<ApiDocument, 'id' | 'document_number' | 'title' | 'discipline'>; revision?: Pick<ApiRevision, 'id' | 'revision_code' | 'title' | 'workflow_status' | 'suitability_status' | 'effective_state'>; snapshot: {document_number: string; document_title: string; revision_code: string; discipline?: string | null; suitability?: string | null; workflow?: string | null; effective_state?: string | null; file_name?: string | null; file_checksum?: string | null; file_size?: number | null; file_mime_type?: string | null}};
export type ApiTransmission = {id: string; project_id: string; reference?: string | null; subject: string; purpose?: string | null; type?: string | null; status: 'draft' | 'issued' | 'cancelled'; created_by?: ApiPerson | null; issued_by?: ApiPerson | null; issued_at?: string | null; created_at?: string; updated_at?: string; recipients?: ApiTransmissionRecipient[]; items?: ApiTransmissionItem[]};
export type TransmissionFilters = {status?: string; issuer_user_id?: string; recipient?: string; date_from?: string; date_to?: string; search?: string; sort?: string; page?: number; per_page?: number};
export type ReviewFilters = {status?: string; assignee_user_id?: string; overdue?: boolean; due_from?: string; due_to?: string; discipline?: string; document_id?: string; revision_id?: string; sort?: string; page?: number; per_page?: number};
export type ApprovalFilters = {status?: string; approver_user_id?: string; discipline?: string; document_id?: string; revision_id?: string; sort?: string; page?: number; per_page?: number};
export function serializeDocumentFilters(filters: DocumentFilters = {}): string {
  const params = new URLSearchParams();
  for (const key of ['search', 'workflow_status', 'suitability', 'effective_state', 'discipline', 'document_type', 'drawing_type', 'zone', 'location', 'revision', 'current_only', 'sort', 'page', 'per_page'] as const) {
    const value = filters[key];
    if (value !== undefined && value !== '') params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  if (!params.has('per_page')) params.set('per_page', '25');
  return params.toString();
}
export function serializeWorkflowFilters(filters: ReviewFilters | ApprovalFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  if (!params.has('per_page')) params.set('per_page', '25');
  return params.toString();
}
export function serializeTransmissionFilters(filters: TransmissionFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value));
  if (!params.has('per_page')) params.set('per_page', '25');
  return params.toString();
}
export function apiErrorMessage(cause: unknown): string {
  const error = cause as Error & {status?: number; errors?: Record<string, string[]>};
  if (error.status === 403) return 'Accès refusé par les droits du projet.';
  if (error.status === 404) return 'Enregistrement ou fichier introuvable.';
  if (error.status === 409) return `Conflit : ${error.message}`;
  if (error.status === 422) return Object.entries(error.errors ?? {}).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`).join(' · ') || error.message;
  return error.message || 'API indisponible.';
}

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

// Empty means same-origin in production. Local development is configured in .env.local.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code?: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
  get unavailable() { return this.status === 0 || this.status >= 500; }
}

type FailureListener = (error: ApiError) => void;
const failureListeners = new Set<FailureListener>();
export function subscribeApiFailures(listener: FailureListener) {
  failureListeners.add(listener);
  return () => { failureListeners.delete(listener); };
}

function xsrfToken(): string | undefined {
  const cookie = document.cookie.split(';').map(item => item.trim()).find(item => item.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : undefined;
}

async function jsonRequest<T>(path: string, init: RequestInit = {}, notify = true): Promise<T> {
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');
    const token = xsrfToken();
    if (token && init.method && init.method !== 'GET') headers.set('X-XSRF-TOKEN', token);
    const response = await fetch(`${API_BASE_URL}${path}`, {...init, signal: init.signal ?? AbortSignal.timeout(15000), credentials: 'include', headers});
    const body = response.status === 204 ? {} : await response.json().catch(() => {
      if (!response.ok) return {};
      throw new ApiError('Invalid response from EvoRail API.');
    }) as ApiEnvelope<T>;
    if (!response.ok) throw new ApiError(body.message ?? `Request failed with status ${response.status}`, response.status, body.code, body.errors);
    return (body.data ?? body) as T;
  } catch (cause) {
    const error = cause instanceof ApiError ? cause : new ApiError('EvoRail API is unavailable.');
    if (notify) failureListeners.forEach(listener => listener(error));
    throw error;
  }
}

function requireUser(user: ApiUser | undefined): ApiUser {
  if (!user || typeof user.id !== 'string' || typeof user.name !== 'string' || typeof user.email !== 'string' || !Array.isArray(user.projects)) {
    throw new ApiError('Invalid user response from EvoRail API.');
  }
  return user;
}

export const evoRailApi = {
  baseUrl: API_BASE_URL,
  async csrf(): Promise<void> {
    await jsonRequest('/sanctum/csrf-cookie', {}, false);
  },
  async login(email: string, password: string): Promise<ApiUser> {
    await evoRailApi.csrf();
    const result = await jsonRequest<{user: ApiUser}>('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password}),
    }, false);
    return requireUser(result.user);
  },
  async logout(notify = true): Promise<void> {
    await evoRailApi.csrf();
    await jsonRequest('/api/logout', {method: 'POST'}, notify);
  },
  async me(notify = true): Promise<ApiUser> {
    const result = await jsonRequest<{user: ApiUser}>('/api/me', {}, notify);
    return requireUser(result.user);
  },
  async projects(notify = true): Promise<ApiProject[]> {
    const result = await jsonRequest<{items: ApiProject[]}>('/api/projects', {}, notify);
    if (!Array.isArray(result.items)) throw new ApiError('Invalid projects response from EvoRail API.');
    return result.items;
  },
  async project(id: string, notify = true): Promise<ApiProject> {
    const result = await jsonRequest<{project: ApiProject}>(`/api/projects/${encodeURIComponent(id)}`, {}, notify);
    return result.project;
  },
  async documents(projectId: string, filters: DocumentFilters | string = {}): Promise<{items: ApiDocument[]; pagination: Pagination}> {
    return jsonRequest(`/api/projects/${encodeURIComponent(projectId)}/documents?${serializeDocumentFilters(typeof filters === 'string' ? {search: filters} : filters)}`);
  },
  async drawings(projectId: string, filters: DocumentFilters | string = {}): Promise<{items: ApiDocument[]; pagination: Pagination}> {
    return jsonRequest(`/api/projects/${encodeURIComponent(projectId)}/drawings?${serializeDocumentFilters(typeof filters === 'string' ? {search: filters} : filters)}`);
  },
  async revision(id: string): Promise<ApiRevision> {
    const result = await jsonRequest<{revision: ApiRevision}>(`/api/revisions/${encodeURIComponent(id)}`);
    return result.revision;
  },
  async compare(revisionId: string, otherId: string): Promise<RevisionComparison> {
    return jsonRequest(`/api/revisions/${encodeURIComponent(revisionId)}/compare/${encodeURIComponent(otherId)}`);
  },
  async file(kind: 'preview' | 'download', revisionId: string): Promise<Blob> {
    try {
      const response = await fetch(evoRailApi.fileUrl(kind, revisionId), {credentials: 'include', headers: {Accept: 'application/pdf,image/*,application/octet-stream,application/json', 'X-Requested-With': 'XMLHttpRequest'}});
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(body.message ?? 'Fichier indisponible.', response.status, body.code, body.errors);
      }
      return await response.blob();
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError('Fichier indisponible.');
      failureListeners.forEach(listener => listener(error));
      throw error;
    }
  },
  async document(id: string): Promise<ApiDocument> {
    const result = await jsonRequest<{document: ApiDocument}>(`/api/documents/${encodeURIComponent(id)}`);
    return result.document;
  },
  async revisions(documentId: string): Promise<ApiRevision[]> {
    const result = await jsonRequest<{items: ApiRevision[]}>(`/api/documents/${encodeURIComponent(documentId)}/revisions`);
    return result.items;
  },
  async activity(documentId: string): Promise<Array<{id: string; event_type: string; entity_type: string; entity_id: string; metadata?: Record<string, unknown>; created_at?: string}>> {
    const result = await jsonRequest<{items: Array<{id: string; event_type: string; entity_type: string; entity_id: string; metadata?: Record<string, unknown>; created_at?: string}>}>(`/api/documents/${encodeURIComponent(documentId)}/activity`);
    return result.items;
  },
  async reviews(projectId: string, filters: ReviewFilters = {}): Promise<{items: ApiReview[]; pagination: Pagination}> {
    return jsonRequest(`/api/projects/${encodeURIComponent(projectId)}/reviews?${serializeWorkflowFilters(filters)}`);
  },
  async review(id: string): Promise<{review: ApiReview; activity: ApiActivity[]}> {
    return jsonRequest(`/api/reviews/${encodeURIComponent(id)}`);
  },
  async createReview(documentId: string, input: {revisionId: string; assigneeUserId?: string; dueAt?: string}): Promise<ApiReview> {
    const result = await jsonRequest<{review: ApiReview}>(`/api/documents/${encodeURIComponent(documentId)}/reviews`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({revision_id: input.revisionId, assignee_user_id: input.assigneeUserId, due_at: input.dueAt})});
    return result.review;
  },
  async commentReview(id: string, body: string): Promise<ApiReviewComment> {
    const result = await jsonRequest<{comment: ApiReviewComment}>(`/api/reviews/${encodeURIComponent(id)}/comments`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({body})});
    return result.comment;
  },
  async transitionReview(id: string, action: 'start' | 'complete' | 'return'): Promise<ApiReview> {
    const result = await jsonRequest<{review: ApiReview}>(`/api/reviews/${encodeURIComponent(id)}/${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({})});
    return result.review;
  },
  async approvals(projectId: string, filters: ApprovalFilters = {}): Promise<{items: ApiApproval[]; pagination: Pagination}> {
    return jsonRequest(`/api/projects/${encodeURIComponent(projectId)}/approvals?${serializeWorkflowFilters(filters)}`);
  },
  async transmissions(projectId: string, filters: TransmissionFilters = {}): Promise<{items: ApiTransmission[]; pagination: Pagination}> {
    return jsonRequest(`/api/projects/${encodeURIComponent(projectId)}/transmissions?${serializeTransmissionFilters(filters)}`);
  },
  async transmission(id: string): Promise<{transmission: ApiTransmission; activity: ApiActivity[]}> {
    return jsonRequest(`/api/transmissions/${encodeURIComponent(id)}`);
  },
  async createTransmission(projectId: string, input: {reference?: string; subject: string; purpose?: string; type?: string}, idempotencyKey = crypto.randomUUID()): Promise<ApiTransmission> {
    const result = await jsonRequest<{transmission: ApiTransmission}>(`/api/projects/${encodeURIComponent(projectId)}/transmissions`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey}, body: JSON.stringify({reference: input.reference, subject: input.subject, purpose: input.purpose, type: input.type})});
    return result.transmission;
  },
  async updateTransmission(id: string, input: Partial<Pick<ApiTransmission, 'reference' | 'subject' | 'purpose' | 'type'>>): Promise<ApiTransmission> {
    const result = await jsonRequest<{transmission: ApiTransmission}>(`/api/transmissions/${encodeURIComponent(id)}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(input)});
    return result.transmission;
  },
  async addTransmissionRecipient(id: string, input: {recipientType: string; recipientName: string; recipientEmail?: string; recipientAddress?: string}): Promise<ApiTransmissionRecipient> {
    const result = await jsonRequest<{recipient: ApiTransmissionRecipient}>(`/api/transmissions/${encodeURIComponent(id)}/recipients`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({recipient_type: input.recipientType, recipient_name: input.recipientName, recipient_email: input.recipientEmail, recipient_address: input.recipientAddress})});
    return result.recipient;
  },
  async removeTransmissionRecipient(id: string, recipientId: string): Promise<void> {
    await jsonRequest(`/api/transmissions/${encodeURIComponent(id)}/recipients/${encodeURIComponent(recipientId)}`, {method: 'DELETE'});
  },
  async addTransmissionItem(id: string, input: {documentId: string; revisionId: string}): Promise<ApiTransmissionItem> {
    const result = await jsonRequest<{item: ApiTransmissionItem}>(`/api/transmissions/${encodeURIComponent(id)}/items`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({document_id: input.documentId, revision_id: input.revisionId})});
    return result.item;
  },
  async removeTransmissionItem(id: string, itemId: string): Promise<void> {
    await jsonRequest(`/api/transmissions/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`, {method: 'DELETE'});
  },
  async issueTransmission(id: string, note?: string, idempotencyKey = crypto.randomUUID()): Promise<ApiTransmission> {
    const result = await jsonRequest<{transmission: ApiTransmission}>(`/api/transmissions/${encodeURIComponent(id)}/issue`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey}, body: JSON.stringify({note})});
    return result.transmission;
  },
  async downloadTransmission(id: string): Promise<{transmission: ApiTransmission; manifest: Array<{item_id: string; document_id: string; revision_id: string; revision_code: string; file_name?: string | null; file_checksum?: string | null; download_url: string}>}> {
    return jsonRequest(`/api/transmissions/${encodeURIComponent(id)}/download`);
  },
  async approval(id: string): Promise<{approval: ApiApproval; activity: ApiActivity[]}> {
    return jsonRequest(`/api/approvals/${encodeURIComponent(id)}`);
  },
  async createApproval(documentId: string, input: {revisionId: string; approverUserId: string}): Promise<ApiApproval> {
    const result = await jsonRequest<{approval: ApiApproval}>(`/api/documents/${encodeURIComponent(documentId)}/approvals`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({revision_id: input.revisionId, approver_user_id: input.approverUserId})});
    return result.approval;
  },
  async decideApproval(id: string, action: 'approve' | 'reject', reason?: string, suitabilityStatus?: string): Promise<ApiApproval> {
    const result = await jsonRequest<{approval: ApiApproval}>(`/api/approvals/${encodeURIComponent(id)}/${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({reason, suitability_status: suitabilityStatus})});
    return result.approval;
  },
  async createRevision(documentId: string, input: {revisionCode: string; title: string; changeReason: string; file: File}, idempotencyKey = crypto.randomUUID()): Promise<ApiRevision> {
    const form = new FormData();
    form.set('revision_code', input.revisionCode);
    form.set('title', input.title);
    form.set('change_reason', input.changeReason);
    form.set('file', input.file);
    const result = await jsonRequest<{revision: ApiRevision}>(`/api/documents/${encodeURIComponent(documentId)}/revisions`, {
      method: 'POST',
      headers: {'Idempotency-Key': idempotencyKey},
      body: form,
    });
    return result.revision;
  },
  fileUrl(kind: 'preview' | 'download', revisionId: string): string {
    return `${API_BASE_URL}/api/revisions/${encodeURIComponent(revisionId)}/${kind}`;
  },
};
