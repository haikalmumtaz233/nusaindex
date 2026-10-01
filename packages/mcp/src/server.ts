import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../package.json" with { type: "json" };
import { type ToolContext, type ToolDefinition, tools } from "./tools.js";

const INSTRUCTIONS =
  "NusaIndex validates and parses Indonesian identifiers (NIK, NPWP, phone, plate, NIP, NISN), looks up regions, holidays, working days and bank codes, masks identifiers, and formats Rupiah, fully offline. " +
  "Results are structural checks, not proof that a number is real. Unofficial; not affiliated with any Indonesian government agency.";

function register(server: McpServer, tool: ToolDefinition, ctx: ToolContext): void {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: tool.idempotent,
        openWorldHint: false,
      },
    },
    async (args: unknown) => {
      const out = { ...(await tool.call(args, ctx)) };
      return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out };
    },
  );
}

export function createServer(ctx: ToolContext): McpServer {
  const server = new McpServer(
    { name: "nusaindex", version: pkg.version },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  );
  for (const tool of Object.values(tools)) {
    register(server, tool, ctx);
  }
  return server;
}
