---
title: Data sources
description: Where every NusaIndex dataset comes from, under which regulation, and how it is kept current.
---

Every dataset lives as a CSV file in `data/` with its source documents, regulation, retrieval date, row count and SHA-256 checksum recorded in `data/manifest.json`. Go embeds the CSV files. TypeScript modules are generated from them at build time, so both libraries always use the same rows.

| Dataset                 | Rows   | Basis                                                                                                      |
| ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Regions                 | 91,599 | Kepmendagri 300.2.2-2138 Tahun 2025 as amended by 300.2.2-2430 Tahun 2025                                  |
| Historical region codes | 663    | UU 14, 15, 16 and 29 Tahun 2022 (Papua), UU 20 Tahun 2012 and Permendagri 66 Tahun 2011 (Kalimantan Utara) |
| Plate codes             | 514    | Perpol 7 Tahun 2021, Korlantas 2024 codes for the new Papua provinces                                      |
| Fixed-line area codes   | 387    | Permenkominfo 14 Tahun 2018                                                                                |
| Holidays                | 194    | SKB 3 Menteri 2020 to 2027 with every amendment, Keppres 22 Tahun 2020, 10 Tahun 2024, 33 Tahun 2024       |
| Banks                   | 125    | Bank code table published by PT Bank Central Asia Tbk (1 November 2024), not by Bank Indonesia             |

Mobile prefixes and the layouts of NIK, NPWP and NIP come from the regulations named on each reference page.

## Keeping data current

A watch script compares the data with the official sources and a public reference dataset, and reports changes as a reviewable diff. Every data change is reviewed by a person, passes schema, relation and checksum checks, and bumps the data version (`YYYY.MM.N`), which is separate from the code version. A regulation change (a new region name, an added holiday) is a patch release, never a breaking change.

## Not included

- **Postal codes**: the only source is a search page without a license or download.
- **Bank account number lengths**: there is no official source.

## License

Code and data are MIT licensed. `NOTICE` lists the source and attribution for each dataset. Government regulations are public documents. NusaIndex is not an official publication.
