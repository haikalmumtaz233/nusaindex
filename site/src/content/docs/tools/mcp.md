---
title: MCP server
description: Give AI agents read-only, offline tools for Indonesian identifiers, regions, holidays, working days, and Rupiah.
---

`nusaindex-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that runs locally over stdio. Its tools are read-only: no file system, no shell, no network.

<img src="/demos/mcp.svg" width="760" height="366" alt="MCP client: asked for three test NIKs in Kota Bandung, the fake tool returns three NIKs; asked about 0859-5257-171, the parse tool returns +628595257171, a mobile number from XL (XLSmart)." />

## Setup

Most MCP clients (Claude Desktop, Claude Code, Cursor, VS Code) accept this configuration:

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

With Claude Code you can also run:

```sh
claude mcp add nusaindex -- npx -y nusaindex-mcp
```

The server needs Node.js 22.18 or later and starts in under 300 ms.

## Tools

| Tool            | Input                                                                     | Returns                                              |
| --------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `validate`      | `kind`, `values` (1 to 100)                                               | Valid or an error code for each value                |
| `parse`         | `kind`, `value`                                                           | Parsed fields; for a NIK also region names           |
| `region_search` | `query`, optional `level`, `within`, `limit`                              | Matching regions, best first                         |
| `region_get`    | `code`, optional `children`                                               | One region; `resolved` when an old code was followed |
| `holidays`      | `year`, or `from` and `to`                                                | Holidays with their legal basis                      |
| `workdays`      | `operation` (`is`, `add`, `count`), `date`, `days` or `to`                | Working-day results                                  |
| `rupiah`        | `operation` (`format`, `parse`, `terbilang`), `amount` or `text`          | Formatted text, number or words                      |
| `bank`          | optional `code` or `bic`; neither lists all                               | Matching banks                                       |
| `mask`          | `kind` and `values` (1 to 100), or `text`                                 | Masked values or text                                |
| `fake`          | `kind`, optional `seed`, `count` (up to 20), `region`, `birthDate`, `sex` | Test data (for tests only)                           |

For `validate` and `parse`, `kind` is one of `nik`, `npwp`, `phone`, `plate`, `nip`, `nisn`; `mask` takes `account` instead of `plate`. Every tool returns structured content plus the same data as JSON text.

## Privacy

:::caution
Anything you type into an AI chat is sent to the AI provider before it reaches this local server. Do not paste real NIKs, NPWPs or phone numbers into a chat. Ask the agent to use the `fake` tool for demos.
:::

The server never logs or stores input, and tool descriptions repeat this warning so agents can pass it on. A valid result means well-formed, not real.

## Example prompts

- "Generate 5 fake NIKs for women born in 1990 in Kota Bandung and check that they are valid."
- "How many working days are there in August 2026, and which holidays fall in that month?"
- "Spell Rp1.250.000 in Indonesian words."
- "Which regencies use plate code DR?"
