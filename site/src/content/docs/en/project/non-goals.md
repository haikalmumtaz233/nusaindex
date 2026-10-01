---
title: Non-goals
description: What NusaIndex will not do, and why.
---

NusaIndex checks that data is **well-formed**. Some things it deliberately does not do:

- **No ownership lookups.** It will never tell you who owns a NIK, NPWP, plate or phone number, or where a person lives. That would turn a validation library into a tool for profiling people.
- **No verification against government systems.** There are no calls to Dukcapil, DJP, Samsat, or operators. A valid result does not mean the number was issued or is still active. Use the official, authorized services for that.
- **No network access.** Everything works offline. Datasets are updated through releases, not fetched at runtime.
- **No guessing.** Rules come only from regulations that can be read and cited. Where no official rule exists (an NPWP check digit, NISN structure, account number lengths), NusaIndex checks less rather than inventing one.
- **No official status.** NusaIndex is unofficial and not affiliated with Dukcapil, DJP, Komdigi, Polri, Bank Indonesia, or any Indonesian government agency. Dataset names refer to regulations; they are not official publications.

Generated test data from [`fake`](/en/reference/fake/) is for tests only. It can collide with real numbers.
