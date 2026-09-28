# EvoRail MCP Server

The EvoRail MCP server is a thin adapter over the Laravel application. It does not connect to PostgreSQL and does not implement domain authorization itself.

## Local stdio

```powershell
$env:EVORAIL_MCP_BASE_URL = "http://127.0.0.1:8000"
$env:EVORAIL_MCP_TOKEN = "local-development-token"
$env:EVORAIL_MCP_PROJECT_ID = "project-uuid"
npm run mcp:stdio
```

## HTTP

```powershell
$env:EVORAIL_MCP_TOKEN = "local-development-token"
npm run mcp:http
```

The HTTP transport listens on `127.0.0.1:8787` by default and exposes `/health` and `/mcp`.

MCP is deliberately limited to authorized reads and safe draft operations. Approval, rejection, supersession, transmittal issue, contractual correspondence sending, permission changes, and audit mutation are not exposed.
