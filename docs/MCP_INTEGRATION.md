# EvoRail MCP integration

The MCP server is an adapter over the Laravel application. It does not connect directly to PostgreSQL and does not implement a second authorization system.

## Transports

- stdio: `npm run mcp:stdio`, intended for Codex and local development;
- Streamable HTTP: `npm run mcp:http`, intended for authenticated team deployments.

## Authorization

The Laravel API resolves the authenticated person, tenant, project membership, role, permission set, scope, and confidentiality decision. Hidden records are returned as not-found or omitted from search. Tool inputs never establish tenant authority.

## Allowed MCP behavior

MCP supports authorized discovery, document/revision context, workflow context, reports, comments, and safe draft creation.

MCP does not expose approval, rejection, supersession, transmittal issue, contractual correspondence sending, permission changes, issued-history withdrawal, or audit mutation.

## Required Laravel endpoints

The adapter expects the following versioned endpoint families:

```text
GET  /api/mcp/v1/projects/{project}/overview
GET  /api/mcp/v1/projects/{project}/documents/search
GET  /api/mcp/v1/projects/{project}/documents/{document}
GET  /api/mcp/v1/projects/{project}/documents/{document}/revisions
GET  /api/mcp/v1/projects/{project}/documents/{document}/revisions/{revision}
GET  /api/mcp/v1/projects/{project}/my-work
GET  /api/mcp/v1/projects/{project}/transmittals/{transmittal}
GET  /api/mcp/v1/projects/{project}/correspondence/search
POST /api/mcp/v1/projects/{project}/documents/{document}/revisions
POST /api/mcp/v1/projects/{project}/revisions/{revision}/comments
POST /api/mcp/v1/projects/{project}/transmittals
POST /api/mcp/v1/projects/{project}/correspondence/drafts
```

All POST requests require an `Idempotency-Key` and must delegate to canonical domain actions.
