import type { McpConfig } from "./config.js";

export type BackendResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export class EvoRailClient {
  constructor(private readonly config: McpConfig) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<BackendResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    if (this.config.token) headers.set("Authorization", `Bearer ${this.config.token}`);
    headers.set("X-EvoRail-MCP", "1");

    try {
      const response = await fetch(`${this.config.baseUrl}/api/mcp/v1${path}`, {
        ...init,
        headers,
        signal: controller.signal
      });
      const body = (await response.json().catch(() => undefined)) as
        | BackendResponse<T>
        | { error?: { code?: string; message?: string; fields?: Record<string, string[]> } }
        | undefined;

      if (!response.ok) {
        const error = body && "error" in body ? body.error : undefined;
        throw new BackendError(
          response.status,
          error?.code ?? "backend_error",
          error?.message ?? `EvoRail request failed with HTTP ${response.status}`,
          error?.fields
        );
      }

      return body as BackendResponse<T>;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string): Promise<BackendResponse<T>> {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown, idempotencyKey?: string): Promise<BackendResponse<T>> {
    const headers = new Headers();
    if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
    return this.request<T>(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  }
}
