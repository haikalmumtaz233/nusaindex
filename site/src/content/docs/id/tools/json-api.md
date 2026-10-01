---
title: API JSON statis
description: File JSON read-only untuk libur, provinsi, dan kabupaten/kota, dibuat saat situs di-build.
---

Untuk proyek yang tidak bisa memakai library Go atau TypeScript, situs ini menerbitkan data referensi sebagai file JSON statis. File dibuat dari data yang sama saat situs di-build: tanpa server, tanpa query parameter, dan tanpa batasan selain caching biasa.

| Path                                | Isi                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `/api/v1/index.json`                | Versi data dan daftar endpoint                                           |
| `/api/v1/holidays/{year}.json`      | Libur nasional dan cuti bersama dalam setahun (2020 sampai 2027)         |
| `/api/v1/provinces.json`            | 38 provinsi                                                              |
| `/api/v1/regencies/{province}.json` | Kabupaten/kota dalam satu provinsi, misalnya `/api/v1/regencies/31.json` |

Setiap file memakai amplop yang sama:

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

Item memakai field yang sama dengan library: [`Holiday`](/id/reference/holiday/) dan [`Region`](/id/reference/region/). `dataVersion` berubah setiap ada dataset yang berubah.

Respons mengizinkan request lintas origin. Untuk kecamatan, desa, pencarian, dan apa pun yang melibatkan data pribadi, pakai library agar data tidak pernah keluar dari proses Anda.
