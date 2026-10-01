---
title: Command line
description: Validasi, mask, dan cari data Indonesia dari terminal, satu nilai atau satu CSV sekaligus.
---

Paket `nusaindex` memasang perintah `nusaindex` dengan alias pendek `nusa`. Butuh Node.js 22.18 atau lebih baru dan tanpa dependensi.

```sh
npm install --global nusaindex
npx nusaindex --help
```

## Perintah

| Perintah                                                 | Fungsi                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `nusaindex <nik\|npwp\|phone\|plate\|nip\|nisn> <nilai>` | Validasi dan parse satu nilai                             |
| `nusaindex mask <jenis\|text> <nilai>`                   | Mask nomor identitas (termasuk `account`) atau teks bebas |
| `nusaindex rupiah format\|parse\|terbilang <nilai>`      | Format, parse, atau terbilang nominal Rupiah              |
| `nusaindex region get\|children\|search\|nik <nilai>`    | Cari wilayah                                              |
| `nusaindex holiday <tahun>`                              | Libur dan cuti bersama dalam setahun                      |
| `nusaindex workday is\|add\|count …`                     | Perhitungan hari kerja                                    |
| `nusaindex fake <jenis> [--seed n] [--count n]`          | Data uji (hanya untuk pengujian)                          |

```sh
nusaindex nik 7502010706599583
nusaindex rupiah terbilang 1500000.5
nusaindex region search gambir --level district
nusaindex workday add 2026-08-14 3
nusaindex fake nik --seed 7 --region 31.71 --count 5
```

Jalankan `nusaindex --help` untuk semua opsi.

## Pemrosesan batch

Argumen command line tersimpan di riwayat shell, jadi kirim data asli lewat standard input:

```sh
nusaindex nik --stdin < niks.txt
nusaindex mask text --stdin < app.log > app.redacted.log
nusaindex phone --csv --column phone < customers.csv > checked.csv
nusaindex mask nik --csv --column nik < customers.csv > masked.csv
```

- `--stdin` membaca satu nilai per baris (maksimal 1 MiB per baris).
- `--csv --column <nama>` membaca CSV dengan header. Validasi menambah kolom `<kolom>_valid` dan `<kolom>_error`; `mask` dan `rupiah` mengganti isi sel. Setiap record harus muat dalam satu baris.

## Keluaran dan exit code

Tambahkan `--json` untuk keluaran yang bisa dibaca mesin. Pesan error memuat kode error, tidak pernah nilainya.

| Exit code | Arti                                                   |
| --------- | ------------------------------------------------------ |
| `0`       | Semua nilai valid                                      |
| `1`       | Ada nilai yang tidak valid                             |
| `2`       | Kesalahan pemakaian (perintah atau opsi tidak dikenal) |
