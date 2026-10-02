# NusaIndex

[Bahasa Indonesia](https://github.com/haikalmumtaz233/nusaindex/blob/main/README.md) | **English**

[![npm](https://img.shields.io/npm/v/nusaindex)](https://www.npmjs.com/package/nusaindex)
[![Go Reference](https://pkg.go.dev/badge/github.com/haikalmumtaz233/nusaindex.svg)](https://pkg.go.dev/github.com/haikalmumtaz233/nusaindex)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/haikalmumtaz233/nusaindex/blob/main/LICENSE)

Validate, parse, and format Indonesian data, with reference data that stays current. For Go, TypeScript, and AI agents.

NIK, NPWP (including the 16-digit format and NITKU), phone numbers, vehicle plates, NIP, NISN, bank codes, regions down to village level, national holidays and collective leave, working days, and Rupiah.

Full documentation and a playground live at **[nusaindex.haikalmumtaz.com/en](https://nusaindex.haikalmumtaz.com/en/)**.

> Unofficial. Not affiliated with Dukcapil, DJP, Komdigi, Polri, Bank Indonesia, or any Indonesian government agency.

![Terminal session: nusa nik decodes a NIK into its fields, nusa phone finds the XL brand, nusa rupiah terbilang spells 1,500,000.50 in words, and nusa mask text hides a NIK and a phone number in a sentence.](site/public/demos/cli.svg)

## Features

- Native Go and TypeScript libraries with the same API and identical behavior, checked by shared test vectors
- Zero runtime dependencies and fully offline: your users' data never leaves your process
- Parse what a number encodes: region, birth date and sex from a NIK, brand and operator from a phone number
- Region data from the latest Ministry of Home Affairs decree, with old codes mapped to their current regions, and every dataset traced to its source document in `data/manifest.json`
- Holidays, collective leave, and working-day arithmetic for payroll, SLAs, and due dates
- Rupiah formatting and spelling in words, PII masking for logs, and realistic test data
- Zod and Valibot schemas, a CLI, and an MCP server for AI agents

## Use cases

Public service and local government forms, school enrolment, fintech and e-commerce, HR and payroll, logistics, PDP Law compliance, testing, and chatbots. See the [use cases page](https://nusaindex.haikalmumtaz.com/en/use-cases/) for details.

## What it does not do

It checks that a number is well-formed. It cannot tell you whether a NIK, NPWP, plate, or phone number is real, or who it belongs to. Use the official verification services for that.

## Install

Go 1.25 or later:

```sh
go get github.com/haikalmumtaz233/nusaindex
```

Node.js 22.18 or later, Bun, Deno, edge runtimes, or a modern browser:

```sh
npm install nusaindex
pnpm add nusaindex
bun add nusaindex
deno add npm:nusaindex
```

## Quick start

```go
person, err := nik.Parse("3273275705901349")
if err == nil {
	fmt.Println(person.BirthDate, person.Sex)
}
```

```ts
import * as nik from "nusaindex/nik";

const person = nik.parse("3273275705901349");
if (person.ok) {
  console.log(person.value.birthDate, person.value.sex);
}
```

Both print `1990-05-17 female`. Nothing throws on invalid input: Go returns an `error` and TypeScript returns `{ ok: false, error }`. Every number in this README comes from `fake`.

## Status

Stable since v1.0.0. The public API follows [Semantic Versioning](https://semver.org/), and data updates for new regulations ship as patch releases.

## Command line

The `nusaindex` package ships a `nusaindex` command (alias `nusa`):

```sh
nusaindex nik 3171014501909999
nusaindex rupiah terbilang 1500000.5
nusaindex region search gambir --level district
nusaindex workday add 2026-08-14 3
nusaindex mask text --stdin < app.log > app.redacted.log
nusaindex nik --csv --column nik < customers.csv
```

Arguments can end up in your shell history, so pass real data with `--stdin` or `--csv`. Add `--json` for machine-readable output. The exit code is `0` when every value is valid, `1` when one is not, and `2` for a usage error.

## MCP server

`nusaindex-mcp` exposes the same features to AI agents over stdio with ten read-only tools:

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

In Claude Code it is one command:

```sh
claude mcp add nusaindex -- npx -y nusaindex-mcp
```

Setup for Cursor, VS Code, Codex, and other apps is in the [MCP setup guide](https://nusaindex.haikalmumtaz.com/en/tools/mcp/). If Claude Desktop on Windows cannot start `npx`, use `"command": "cmd"` with `"args": ["/c", "npx", "-y", "nusaindex-mcp"]`.

Anything typed into an AI chat has already been sent to the AI provider before it reaches the local server, so use the `fake` tool for demos.

![MCP client: asked for three test NIKs in Kota Bandung, the fake tool returns three NIKs. Asked about 0859-5257-171, the parse tool returns +628595257171, a mobile number from XL (XLSmart).](site/public/demos/mcp.svg)

## Validation libraries

TypeScript schemas live in their own subpaths, so `zod` and `valibot` stay optional peer dependencies:

```ts
import { z } from "zod";
import * as id from "nusaindex/zod";

const Customer = z.object({ nik: id.nik(), phone: id.phone(), deposit: id.rupiah() });
```

`nusaindex/valibot` exports the same functions. Failed checks never include the input in the message.

In Go, register the `Valid` functions with [go-playground/validator](https://github.com/go-playground/validator). NusaIndex itself does not depend on it:

```go
validate := validator.New()
_ = validate.RegisterValidation("nik", func(fl validator.FieldLevel) bool {
	return nik.Valid(fl.Field().String())
})

type Customer struct {
	NIK string `validate:"required,nik"`
}
```

## Test data

`fake` (Go package, TypeScript `nusaindex/fake`) generates valid-looking NIK, NPWP, phone numbers, NIP, NISN and plates from a seed, with the same output in Go and TypeScript. It is for tests only: generated numbers can belong to real people.

## Security

Report vulnerabilities privately with the **Report a vulnerability** button on the Security tab. See [SECURITY.md](https://github.com/haikalmumtaz233/nusaindex/blob/main/SECURITY.md).

## License

[MIT](https://github.com/haikalmumtaz233/nusaindex/blob/main/LICENSE) for both code and data. The source and regulation behind each dataset are listed in [NOTICE](https://github.com/haikalmumtaz233/nusaindex/blob/main/NOTICE) and `data/manifest.json`.
