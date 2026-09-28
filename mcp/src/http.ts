import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { EvoRailClient } from "./backend.js";
import { loadConfig } from "./config.js";
import { createMcpServer } from "./tools.js";

const config = loadConfig();
const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => response.json({ status: "ok", service: "evorail-mcp" }));

app.all("/mcp", async (request, response) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: { code: "unauthenticated", message: "Bearer token required" } });
    return;
  }

  const requestToken = authorization.slice("Bearer ".length).trim();
  if (!requestToken || (config.token && requestToken !== config.token)) {
    response.status(401).json({ error: { code: "unauthenticated", message: "Invalid bearer token" } });
    return;
  }

  const server = createMcpServer(new EvoRailClient({ ...config, token: requestToken }), config);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({ error: { code: "mcp_internal_error", message: error instanceof Error ? error.message : "MCP request failed" } });
    }
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
});

app.listen(config.port, config.host, () => {
  console.error(`EvoRail MCP listening on http://${config.host}:${config.port}`);
});
