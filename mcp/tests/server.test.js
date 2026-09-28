import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { EvoRailClient } from "../dist/backend.js";
import { loadConfig } from "../dist/config.js";
import { createMcpServer } from "../dist/tools.js";

test("MCP advertises only authorized read and safe-draft tools", async () => {
  const config = loadConfig({ EVORAIL_MCP_BASE_URL: "http://127.0.0.1:9" });
  const server = createMcpServer(new EvoRailClient(config), config);
  const client = new Client({ name: "test-client", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.listTools();
  const names = result.tools.map((tool) => tool.name).sort();

  assert.ok(names.includes("search_documents"));
  assert.ok(names.includes("create_revision_draft"));
  assert.ok(names.includes("create_transmittal_draft"));
  assert.ok(!names.includes("approve_revision"));
  assert.ok(!names.includes("issue_transmittal"));
  assert.ok(!names.includes("change_permissions"));

  const resources = await client.listResourceTemplates();
  assert.ok(resources.resourceTemplates.some((resource) => resource.name === "overview"));

  const prompts = await client.listPrompts();
  assert.ok(prompts.prompts.some((prompt) => prompt.name === "project_control_summary"));

  await client.close();
  await server.close();
});

test("missing project context is returned as a safe tool error", async () => {
  const config = loadConfig({ EVORAIL_MCP_BASE_URL: "http://127.0.0.1:9" });
  const server = createMcpServer(new EvoRailClient(config), config);
  const client = new Client({ name: "test-client", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.callTool({ name: "get_project_overview", arguments: {} });

  assert.equal(result.isError, true);
  assert.match(String(result.content?.[0]?.text), /projectId is required/);

  await client.close();
  await server.close();
});
