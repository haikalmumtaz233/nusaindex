# nusaindex-mcp

MCP server for [NusaIndex](https://github.com/haikalmumtaz233/nusaindex): validate and parse Indonesian identifiers (NIK, NPWP, phone numbers, plates, NIP, NISN), look up regions, holidays and working days, format and spell Rupiah, and generate fake test data. It runs locally over stdio, offline, with read-only tools.

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

Tools: `validate`, `parse`, `region_search`, `region_get`, `holidays`, `workdays`, `rupiah`, `bank`, `mask`, `fake`.

Privacy: anything you type into an AI chat has already been sent to the AI provider before it reaches this server. Use the `fake` tool for demos. The server never logs or stores input.

Valid means well-formed: NusaIndex cannot tell whether a number is real or who owns it. Unofficial; not affiliated with any Indonesian government agency.
