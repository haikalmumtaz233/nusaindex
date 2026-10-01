---
title: API JSON statis
description: File JSON read-only untuk libur, provinsi, dan kabupaten/kota, dibuat saat situs di-build.
---

Kalau proyekmu tidak bisa memakai library Go atau TypeScript, data referensinya juga tersedia sebagai file JSON statis. File dibuat dari data yang sama saat build. Tidak ada server, query parameter, atau rate limit.

| Path                                | Isi                                                                   |
| ----------------------------------- | --------------------------------------------------------------------- |
| `/api/v1/index.json`                | Versi data dan daftar endpoint                                        |
| `/api/v1/holidays/{year}.json`      | Libur nasional dan cuti bersama setahun (2020 sampai 2027)            |
| `/api/v1/provinces.json`            | 38 provinsi                                                           |
| `/api/v1/regencies/{province}.json` | Kabupaten/kota di satu provinsi, misalnya `/api/v1/regencies/31.json` |

Semua file punya bentuk yang sama:

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

Field-nya sama dengan di library: [`Holiday`](/reference/holiday/) dan [`Region`](/reference/region/). `dataVersion` berubah setiap ada dataset yang berubah.

Request lintas origin diizinkan. Untuk kecamatan, desa, pencarian, atau apa pun yang menyangkut data pribadi, pakai library supaya datanya tidak keluar dari aplikasimu.
