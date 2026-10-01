---
title: Static JSON API
description: Read-only JSON files for holidays, provinces, and regencies, generated when the site is built.
---

For projects that cannot use the Go or TypeScript library, this site publishes reference data as static JSON files. They are generated from the same data when the site is built: there is no server, no query parameters, and no rate limit beyond normal caching.

| Path                                | Contents                                                                |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `/api/v1/index.json`                | Data version and the list of endpoints                                  |
| `/api/v1/holidays/{year}.json`      | National holidays and collective leave in a year (2020 to 2027)         |
| `/api/v1/provinces.json`            | The 38 provinces                                                        |
| `/api/v1/regencies/{province}.json` | Regencies and cities in a province, such as `/api/v1/regencies/31.json` |

Every file has the same envelope:

```json
{
  "dataVersion": "2026.10.5",
  "data": [
    {
      "code": "31.71",
      "name": "Kota Administrasi Jakarta Pusat",
      "level": "regency",
      "parentCode": "31"
    }
  ]
}
```

Items have the same fields as the library: [`Holiday`](/reference/holiday/) and [`Region`](/reference/region/). `dataVersion` changes whenever a dataset changes.

Responses allow cross-origin requests. For districts, villages, search, and anything involving personal data, use the library so data never leaves your process.
