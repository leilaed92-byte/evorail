import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EvoRailClient } from "./backend.js";
import { loadConfig } from "./config.js";
import { createMcpServer } from "./tools.js";

const config = loadConfig();
const server = createMcpServer(new EvoRailClient(config), config);
const transport = new StdioServerTransport();
await server.connect(transport);
