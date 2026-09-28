import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EvoRailClient } from "./backend.js";
import { requireProjectId, type McpConfig } from "./config.js";

const projectInput = {
  projectId: z.string().min(1).optional().describe("Authorized EvoRail project UUID")
};

const pageInput = {
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(100).optional().default(25)
};

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }]
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown EvoRail error";
  return {
    isError: true,
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }]
  };
}

async function safe<T>(operation: () => Promise<T>) {
  try {
    return textResult(await operation());
  } catch (error) {
    return errorResult(error);
  }
}

export function createMcpServer(client: EvoRailClient, config: McpConfig): McpServer {
  const server = new McpServer({
    name: "evorail",
    version: "0.1.0"
  });

  server.registerTool(
    "search_documents",
    {
      title: "Search documents",
      description: "Search documents visible to the authenticated EvoRail person.",
      inputSchema: {
        ...projectInput,
        query: z.string().min(1),
        ...pageInput
      }
    },
    ({ projectId, query, page, perPage }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/documents/search?${new URLSearchParams({ query, page: String(page), per_page: String(perPage) })}`)).data
    )
  );

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "Get an authorized document register record and its current revision summary.",
      inputSchema: { ...projectInput, documentId: z.string().min(1) }
    },
    ({ projectId, documentId }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/documents/${documentId}`)).data
    )
  );

  server.registerTool(
    "get_revision",
    {
      title: "Get revision",
      description: "Get an authorized exact revision, including workflow and suitability axes.",
      inputSchema: { ...projectInput, documentId: z.string().min(1), revisionId: z.string().min(1) }
    },
    ({ projectId, documentId, revisionId }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/documents/${documentId}/revisions/${revisionId}`)).data
    )
  );

  server.registerTool(
    "list_revision_history",
    {
      title: "List revision history",
      description: "List visible historical revisions without changing their state.",
      inputSchema: { ...projectInput, documentId: z.string().min(1) }
    },
    ({ projectId, documentId }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/documents/${documentId}/revisions`)).data
    )
  );

  server.registerTool(
    "get_my_work",
    {
      title: "Get my work",
      description: "Get the authenticated person's authorized action queue.",
      inputSchema: { ...projectInput, ...pageInput }
    },
    ({ projectId, page, perPage }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/my-work?${new URLSearchParams({ page: String(page), per_page: String(perPage) })}`)).data
    )
  );

  server.registerTool(
    "get_project_overview",
    {
      title: "Get project overview",
      description: "Get authorized project attention counts and recent activity.",
      inputSchema: projectInput
    },
    ({ projectId }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/overview`)).data
    )
  );

  server.registerTool(
    "get_transmittal",
    {
      title: "Get transmittal",
      description: "Get an authorized transmittal and its immutable item snapshots.",
      inputSchema: { ...projectInput, transmittalId: z.string().min(1) }
    },
    ({ projectId, transmittalId }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/transmittals/${transmittalId}`)).data
    )
  );

  server.registerTool(
    "search_correspondence",
    {
      title: "Search correspondence",
      description: "Search visible correspondence using server-side authorization.",
      inputSchema: { ...projectInput, query: z.string().min(1), ...pageInput }
    },
    ({ projectId, query, page, perPage }) => safe(async () =>
      (await client.get(`/projects/${requireProjectId({ projectId }, config)}/correspondence/search?${new URLSearchParams({ query, page: String(page), per_page: String(perPage) })}`)).data
    )
  );

  server.registerTool(
    "create_revision_draft",
    {
      title: "Create revision draft",
      description: "Create a new draft revision through the authorized Laravel domain action.",
      inputSchema: {
        ...projectInput,
        documentId: z.string().min(1),
        reason: z.string().min(1),
        idempotencyKey: z.string().min(8)
      }
    },
    ({ projectId, documentId, reason, idempotencyKey }) => safe(async () =>
      (await client.post(`/projects/${requireProjectId({ projectId }, config)}/documents/${documentId}/revisions`, { reason }, idempotencyKey)).data
    )
  );

  server.registerTool(
    "add_review_comment",
    {
      title: "Add review comment",
      description: "Add a comment to one exact revision and review cycle.",
      inputSchema: {
        ...projectInput,
        revisionId: z.string().min(1),
        reviewCycleId: z.string().min(1),
        body: z.string().min(1),
        severity: z.enum(["major", "minor", "observation"]),
        idempotencyKey: z.string().min(8)
      }
    },
    ({ projectId, revisionId, reviewCycleId, body, severity, idempotencyKey }) => safe(async () =>
      (await client.post(`/projects/${requireProjectId({ projectId }, config)}/revisions/${revisionId}/comments`, { review_cycle_id: reviewCycleId, body, severity }, idempotencyKey)).data
    )
  );

  server.registerTool(
    "create_transmittal_draft",
    {
      title: "Create transmittal draft",
      description: "Create an editable draft transmittal; issuing is intentionally unavailable to MCP.",
      inputSchema: {
        ...projectInput,
        subject: z.string().min(1),
        recipientOrganizationIds: z.array(z.string().min(1)).min(1),
        revisionIds: z.array(z.string().min(1)).min(1),
        idempotencyKey: z.string().min(8)
      }
    },
    ({ projectId, subject, recipientOrganizationIds, revisionIds, idempotencyKey }) => safe(async () =>
      (await client.post(`/projects/${requireProjectId({ projectId }, config)}/transmittals`, { subject, recipient_organization_ids: recipientOrganizationIds, revision_ids: revisionIds }, idempotencyKey)).data
    )
  );

  server.registerTool(
    "create_correspondence_draft",
    {
      title: "Create correspondence draft",
      description: "Create an unsent correspondence draft with optional exact revision links.",
      inputSchema: {
        ...projectInput,
        type: z.enum(["incoming_letter", "outgoing_letter", "instruction", "notice", "technical", "minutes", "memo"]),
        subject: z.string().min(1),
        body: z.string().min(1),
        revisionIds: z.array(z.string().min(1)).optional().default([]),
        idempotencyKey: z.string().min(8)
      }
    },
    ({ projectId, type, subject, body, revisionIds, idempotencyKey }) => safe(async () =>
      (await client.post(`/projects/${requireProjectId({ projectId }, config)}/correspondence/drafts`, { type, subject, body, revision_ids: revisionIds }, idempotencyKey)).data
    )
  );

  const registerProjectResource = (name: string, path: (projectId: string) => string, description: string) => {
    server.registerResource(
      name,
      new ResourceTemplate("evorail://projects/{projectId}/" + name, { list: undefined }),
      { description, mimeType: "application/json" },
      async (uri, variables) => {
        const projectId = String(variables.projectId ?? "");
        if (!projectId) {
          return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ error: "projectId is required" }) }] };
        }
        try {
          const data = (await client.get(path(projectId))).data;
          return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ error: error instanceof Error ? error.message : "EvoRail resource unavailable" }) }] };
        }
      }
    );
  };

  registerProjectResource("overview", (projectId) => `/projects/${projectId}/overview`, "Authorized project overview and attention counts.");
  registerProjectResource("my-work", (projectId) => `/projects/${projectId}/my-work`, "Authorized action queue for the current person.");

  server.registerPrompt(
    "project_control_summary",
    {
      title: "Project control summary",
      description: "Guide an authorized project-control investigation using EvoRail read tools.",
      argsSchema: { projectId: z.string().min(1).optional() }
    },
    ({ projectId }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Use EvoRail's authorized project overview, My Work, document search, and exact revision tools to summarize project control attention. Project: ${projectId ?? config.projectId ?? "use the configured project"}. Do not infer authority from revision code, and do not propose approval or transmittal issue actions.`
        }
      }]
    })
  );

  server.registerPrompt(
    "document_revision_review",
    {
      title: "Document revision review",
      description: "Guide a revision-bound review without granting approval authority.",
      argsSchema: { documentId: z.string().min(1), revisionId: z.string().min(1), projectId: z.string().min(1).optional() }
    },
    ({ documentId, revisionId, projectId }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Review exact EvoRail document ${documentId}, revision ${revisionId}, in project ${projectId ?? config.projectId ?? "the configured project"}. Use the exact revision, workflow, suitability, effective state, comments, and transmittal history. Review is not approval.`
        }
      }]
    })
  );

  return server;
}
