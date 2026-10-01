# NusaIndex

Validate, parse, and format Indonesian data, with reference data that stays current. For Go, TypeScript, and AI agents.

NIK, NPWP (including the 16-digit format and NITKU), phone numbers, vehicle plates, NIP, NISN, bank codes, regions down to village level, national holidays and collective leave, working days, and Rupiah.

> Unofficial. Not affiliated with Dukcapil, DJP, Komdigi, Polri, Bank Indonesia, or any Indonesian government agency.

## Features

- Native Go and TypeScript libraries with the same API and identical behavior, checked by shared test vectors
- Zero runtime dependencies and fully offline: your users' data never leaves your process
- Parse what a number encodes: region, birth date and sex from a NIK, brand and operator from a phone number
- Region data from the latest Ministry of Home Affairs decree, with old codes mapped to their current regions, and every dataset traced to its source document in `data/manifest.json`
- Holidays, collective leave, and working-day arithmetic for payroll, SLAs, and due dates
- Rupiah formatting and spelling in words, PII masking for logs, and realistic test data
- Zod and Valibot schemas, a CLI, and an MCP server for AI agents

## What it does not do

It checks that a number is well-formed. It cannot tell you whether a NIK, NPWP, plate, or phone number is real, or who it belongs to. Use the official verification services for that.

## Status

In active development. Not ready for general use yet.

## Requirements

- Go 1.25 or later, or
- Node.js 22.18 or later, a modern browser, Bun, or Deno

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
