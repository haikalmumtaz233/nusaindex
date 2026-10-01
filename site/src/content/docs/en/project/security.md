---
title: Security and privacy
description: How NusaIndex protects the personal data that passes through it and how releases are protected.
---

## Your users' data

- **Offline**: the libraries, CLI and MCP server make no network requests. All reference data is embedded.
- **No logging or storage**: input is never logged, stored or sent. Error messages contain a code, never the value.
- **Bounded input**: identifiers are limited to 64 characters, searches to 256, free text to 1 MiB, and CLI batch lines to 1 MiB, checked before any other work.
- **Linear-time parsing**: no backtracking regular expressions; every parser is fuzz tested in Go.
- **Strict characters**: only ASCII digits and listed separators are accepted, so look-alike Unicode digits cannot slip through. Use `normalize` explicitly when you want to accept pasted text.
- **Safe redaction**: `mask.redact` never mutates input, never calls getters, ignores prototype keys, and survives cycles and deep nesting.

## This website

- Static pages with no server, cookies, analytics, or third-party scripts and fonts.
- A strict Content Security Policy: scripts and styles only from this site, pinned by hash for inline code; no framing.
- The [playground](/en/playground/) runs entirely in your browser.

## Supply chain

- Zero runtime dependencies in the libraries. The MCP server bundles the official MCP SDK and Zod, so it installs only `nusaindex`.
- Dependency install scripts are blocked by default, new versions are installed only after a waiting period, and dependencies are audited before every release.
- npm packages are published only from CI with trusted publishing and provenance, with no long-lived tokens. Go releases are immutable tags recorded in the Go checksum database.

## Reporting a vulnerability

Report vulnerabilities privately with the **Report a vulnerability** button on the Security tab of the [GitHub repository](https://github.com/haikalmumtaz233/nusaindex), not in a public issue. Do not include real personal data in reports.
