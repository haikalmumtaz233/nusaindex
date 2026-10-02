# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CLI: `nusaindex bank <code|bic|list>` looks up banks by transfer code or BIC, and `nusaindex region resolve <code>` follows codes renumbered by the 2012 and 2022 region splits and prints `resolvedFrom` with the code it was given.
- MCP: a `bank` tool for bank codes and BICs, and a `mask` tool that masks values of one kind or every identifier-like number in free text.
- Documentation site: a copyright line in the footer of every page.

### Changed

- MCP `region_get` adds `resolved` with the code asked for and the current code when it follows a renumbered code, so agents can tell users the code has changed.
- Documentation site and README: Indonesian is now the default language. English pages move to `/en/` and the English README to `README.en.md`. The Indonesian text is shorter and more casual, and a new use cases page shows where NusaIndex helps, from local government and school forms to payroll, logistics and AI agents.
- Documentation site: every identifier page opens with a live decoder that colours each digit by what it means (region, birth date, operator, tax office and more) and explains errors in plain words. Holidays show on a year calendar, regions on a level diagram with live search, and the Rupiah, masking, test data and working-day pages have small tools that run in the browser. The home page and the CLI and MCP pages show animated demos generated from real output, and the site uses a self-hosted Plus Jakarta Sans font.

### Fixed

- Documentation site: dropdown arrows no longer sit on the edge of their field, the theme and language selects fit Indonesian labels, all dropdowns share one style, and the table of contents marks the last section when a page is scrolled to the end.
- Documentation site: the sidebar scrolls the current page into view, so links low in the list such as Playground stay visible when opened from the home page. The number decoder no longer repeats the in-browser note.

## [0.9.0-rc.1] - 2026-10-01

Release candidate for 1.0.0. No changes since 0.5.0.

## [0.5.0] - 2026-10-01

### Added

- Documentation site in English and Indonesian (Astro Starlight): a reference page for every module with Go and TypeScript examples that run as tests, guides on results, errors, input and privacy, the CLI and MCP server, a browser-only playground, and static JSON files for holidays, provinces and regencies. Pages ship a hash-based Content Security Policy with no third-party scripts, fonts or analytics.

### Fixed

- Go `mask.Redact` passed structs, typed maps and slices (`map[string]string`, `[]string`), pointers and integer types other than `int` and `int64` through unchanged, so identifiers inside them were not redacted. It now walks any value: structs become maps keyed by their JSON names, `[]byte` is treated as text, `time.Time` is kept, and values it cannot inspect (functions, channels) become `[redacted]`.
- Go `mask.NewHandler` now also redacts integer, float and `slog.Any` attribute values; before, only strings and groups were redacted.

## [0.4.0] - 2026-10-01

### Added

- `nusaindex-mcp`: a stdio MCP server with eight read-only tools (`validate`, `parse`, `region_search`, `region_get`, `holidays`, `workdays`, `rupiah`, `fake`). Tool descriptions warn that chat input has already reached the AI provider and that valid only means well-formed; the server never logs input. It bundles the official MCP SDK (v2) and Zod, listed with their licenses in `THIRD_PARTY_NOTICES.md`, so its only dependency is `nusaindex`.
- CLI `nusaindex` (alias `nusa`) in the `nusaindex` package: validate and parse NIK, NPWP, phone numbers, plates, NIP and NISN; mask values and free text; format, parse and spell Rupiah; look up regions, holidays and working days; and generate test data with `fake`. `--stdin` processes one value per line (up to 1 MiB each) and `--csv --column` checks or rewrites one CSV column; `--json` prints JSON. Exit code `0` means valid, `1` invalid and `2` a usage error. Error messages never repeat the input.

## [0.3.0] - 2026-10-01

### Added

- `nusaindex/zod` and `nusaindex/valibot`: schemas for NIK, NPWP, phone numbers, NIP, NISN and plates, plus `rupiah()` that parses a Rupiah string into a number. Zod and Valibot are optional peer dependencies (`zod@^4`, `valibot@^1`); failed checks carry the error code but never the input in the message. The README shows how to register the Go `Valid` functions with go-playground/validator without adding a dependency.
- `fake` (for testing only): generate structurally valid NIK, NPWP, mobile numbers, NIP, NISN and vehicle plates from a 32-bit seed, with identical results in Go and TypeScript. NIKs use a real district code and can be pinned to a province, regency or district, a birth date and a sex; NIPs take a birth date and sex; plates use the Perpol 7/2021 region codes. Generated numbers may belong to real people, so never use them outside tests. In TypeScript `fake` is only available from `nusaindex/fake`, and `fake.nik` is asynchronous because district data loads per province.
- `mask`: mask NIK, NPWP, NIP, NISN and bank account numbers (last 4 digits) and phone numbers (`+62` and the last 3 digits) from one place; `text` redacts every identifier-like number with 10 or more digits in free text up to 1 MiB, using a linear scanner; `redact` (TypeScript and Go) returns a redacted deep copy of objects, arrays, strings and integers without mutating the input, calling getters, or copying `__proto__`, `constructor` and `prototype` keys, and marks cycles and nesting beyond 32 levels. Go adds `mask.NewHandler`, a `log/slog` handler that redacts the message and every string attribute, key and group before passing the record on.
- `rupiah`: format amounts (`Rp1.500.000,50`, optional fixed sen and no symbol), parse Indonesian-style input (`Rp`, `Rp.` or `IDR`, dot thousands, comma sen, `,-`), and spell amounts in words (`satu juta lima ratus ribu rupiah lima puluh sen`) up to 999 trillion. Amounts with sen are limited to below 10 trillion so TypeScript numbers stay exact. Go uses the `Amount` type in sen (`150_000 * rupiah.Rupiah`), TypeScript a number in rupiah.

## [0.2.0] - 2026-10-01

### Added

- Reference data `2026.10.5` in `data/` (regions, historical region codes, plate codes, fixed-line area codes, holidays and bank codes), with the source document, regulation and checksum of every dataset in `data/manifest.json` and attributions in `NOTICE`.
- `bank`: list banks and look them up by 3-digit bank code (including their sharia units) or by BIC.
- `workday`: check a date, add or subtract working days, and count working days in a range, skipping weekends, national holidays and (optionally) collective leave. The weekend days are configurable.
- `holiday`: national holidays and collective leave for 2020-2027 by year, date range or single date, each with its Indonesian and English name and the SKB or Keppres it comes from.
- `region`: get, list children, search and resolve provinces, regencies, districts and villages from Kepmendagri 300.2.2-2138/2025 (as amended by 2430/2025), including historical codes from the 2012 Kalimantan Utara and 2022 Papua splits. `byPlate` lists the regencies registered under a vehicle plate code, and `byAreaCode` the province or regencies behind a fixed-line area code (Permenkominfo 14/2018). `fromNik` turns the district code in a NIK into current province, regency and district names, following renumbered codes and flagging them as historical. The TypeScript API is asynchronous and loads district and village data per province on demand.
- `nip`: `parse` reports `kind` (`pns` or `pppk`) and, for PPPK numbers, the work `agreement` count.

### Changed

- `plate`: `parse`, `isValid` and `format` reject region codes that are not in Perpol 7/2021 or the 2024 Papua codes, with the new error code `region`. `RI` stays valid.

### Fixed

- `nip`: accept PPPK numbers, whose 13th and 14th digits hold the work agreement count starting at `21` instead of the appointment month; `appointmentDate` is the appointment year for these numbers.

## [0.1.0] - 2026-09-30

### Added

- `nik`: validate, parse (region codes, birth date, sex, serial), format and mask 16-digit NIK, with `parseAt` for a fixed reference year.
- `npwp`: validate, parse, format, mask and convert NPWP in the 15-digit, 16-digit (including NIK) and 22-digit NITKU forms.
- `phone`: normalize Indonesian phone numbers to E.164, identify mobile brand and operator (Telkomsel, Indosat Ooredoo Hutchison, XLSmart) or fixed-line area code, build `wa.me` links and mask.
- `plate`: validate, parse and format vehicle registration plates (region letters, number, suffix).
- `nip`: validate, parse (birth date, appointment month, sex, serial), format and mask 18-digit civil servant NIP.
- `nisn`: validate, format and mask 10-digit student NISN.
- `normalize`: explicit input normalization that maps full-width characters, Arabic-Indic digits, Unicode dashes and spaces to ASCII and drops zero-width characters (Go and TypeScript).
