---
title: Command line
description: Validate, mask, and look up Indonesian data from the terminal, one value or a whole CSV at a time.
---

The `nusaindex` package installs a `nusaindex` command with the shorter alias `nusa`. It needs Node.js 22.18 or later and has no dependencies.

<img src="/demos/cli.svg" width="760" height="554" alt="Terminal session: nusa nik decodes a NIK into its fields, nusa phone finds the XL brand, nusa rupiah terbilang spells 1,500,000.50 in words, and nusa mask text hides a NIK and a phone number in a sentence." />

```sh
npm install --global nusaindex
npx nusaindex --help
```

## Commands

| Command                                                        | Does                                                |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `nusaindex <nik\|npwp\|phone\|plate\|nip\|nisn> <value>`       | Validate and parse one value                        |
| `nusaindex mask <kind\|text> <value>`                          | Mask an identifier (`account` too) or free text     |
| `nusaindex rupiah format\|parse\|terbilang <value>`            | Format, parse or spell a Rupiah amount              |
| `nusaindex region get\|resolve\|children\|search\|nik <value>` | Look up regions; `resolve` follows renumbered codes |
| `nusaindex holiday <year>`                                     | Holidays and collective leave in a year             |
| `nusaindex bank <code\|bic\|list>`                             | Look up banks by transfer code or BIC               |
| `nusaindex workday is\|add\|count …`                           | Working-day arithmetic                              |
| `nusaindex fake <kind> [--seed n] [--count n]`                 | Test data (for tests only)                          |

```sh
nusaindex nik 7502010706599583
nusaindex rupiah terbilang 1500000.5
nusaindex region search gambir --level district
nusaindex workday add 2026-08-14 3
nusaindex fake nik --seed 7 --region 31.71 --count 5
```

Run `nusaindex --help` for every option.

## Batch processing

Command-line arguments end up in your shell history, so pass real data on standard input:

```sh
nusaindex nik --stdin < niks.txt
nusaindex mask text --stdin < app.log > app.redacted.log
nusaindex phone --csv --column phone < customers.csv > checked.csv
nusaindex mask nik --csv --column nik < customers.csv > masked.csv
```

- `--stdin` reads one value per line (up to 1 MiB per line).
- `--csv --column <name>` reads a CSV with a header. Validation adds `<column>_valid` and `<column>_error` columns; `mask` and `rupiah` replace the cell. Records must fit on one line.

## Output and exit codes

Add `--json` for machine-readable output. Error messages contain the error code, never the value.

| Exit code | Meaning                                 |
| --------- | --------------------------------------- |
| `0`       | Every value is valid                    |
| `1`       | At least one value is invalid           |
| `2`       | Usage error (unknown command or option) |
