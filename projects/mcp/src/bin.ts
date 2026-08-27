#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadData } from './data.js';
import { createMkKitServer } from './index.js';

// stdout is the MCP channel — every human-facing line goes to stderr.
const data = await loadData();
const server = createMkKitServer(data);
await server.connect(new StdioServerTransport());
console.error(`mk-kit MCP server ready — ${data.api.package} ${data.api.version} (${data.source})`);
