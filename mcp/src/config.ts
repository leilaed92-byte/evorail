export type McpConfig = {
  baseUrl: string;
  token?: string;
  projectId?: string;
  host: string;
  port: number;
  requestTimeoutMs: number;
};

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  return {
    baseUrl: (env.EVORAIL_MCP_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, ""),
    token: env.EVORAIL_MCP_TOKEN,
    projectId: env.EVORAIL_MCP_PROJECT_ID,
    host: env.EVORAIL_MCP_HOST ?? "127.0.0.1",
    port: positiveInteger(env.EVORAIL_MCP_PORT, 8787),
    requestTimeoutMs: positiveInteger(env.EVORAIL_MCP_TIMEOUT_MS, 15000)
  };
}

export function requireProjectId(input: { projectId?: string }, config: McpConfig): string {
  const projectId = input.projectId ?? config.projectId;
  if (!projectId) {
    throw new Error("projectId is required either as a tool argument or EVORAIL_MCP_PROJECT_ID");
  }
  return projectId;
}
