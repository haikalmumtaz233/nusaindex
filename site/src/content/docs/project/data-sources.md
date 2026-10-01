---
title: Sumber data
description: Asal setiap dataset NusaIndex, regulasi di baliknya, dan cara datanya diperbarui.
---

Setiap dataset disimpan sebagai CSV di `data/`. Sumber, regulasi, tanggal ambil, jumlah baris, dan checksum SHA-256-nya dicatat di `data/manifest.json`. Go membaca CSV itu langsung, TypeScript membuat modul dari file yang sama, jadi isinya selalu sama.

| Dataset                 | Baris  | Dasar                                                                                                             |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| Wilayah                 | 91.599 | Kepmendagri 300.2.2-2138 Tahun 2025 sebagaimana diubah 300.2.2-2430 Tahun 2025                                    |
| Kode wilayah historis   | 663    | UU 14, 15, 16, dan 29 Tahun 2022 (Papua), serta UU 20 Tahun 2012 dan Permendagri 66 Tahun 2011 (Kalimantan Utara) |
| Kode plat               | 514    | Perpol 7 Tahun 2021, ditambah kode Korlantas 2024 untuk provinsi baru di Papua                                    |
| Kode area telepon tetap | 387    | Permenkominfo 14 Tahun 2018                                                                                       |
| Libur                   | 194    | SKB 3 Menteri 2020 sampai 2027 dan semua perubahannya, plus Keppres 22 Tahun 2020, 10 Tahun 2024, 33 Tahun 2024   |
| Bank                    | 125    | Tabel sandi bank dari PT Bank Central Asia Tbk (1 November 2024), bukan terbitan Bank Indonesia                   |

Prefix seluler dan susunan NIK, NPWP, serta NIP mengikuti regulasi yang disebut di halaman referensinya masing-masing.

## Cara datanya diperbarui

Skrip pemantau membandingkan data dengan sumber resmi dan menampilkan perubahannya sebagai diff. Setiap perubahan dicek manusia, lolos pengecekan skema, relasi, dan checksum, lalu menaikkan versi data (`YYYY.MM.N`) yang terpisah dari versi kode. Perubahan karena regulasi, misalnya nama wilayah baru atau libur tambahan, selalu rilis patch dan tidak pernah breaking.

## Yang tidak disertakan

- **Kode pos**: sumbernya cuma halaman pencarian, tanpa lisensi dan tanpa unduhan.
- **Panjang nomor rekening**: tidak ada sumber resminya.

## Lisensi

Kode dan data berlisensi MIT. File `NOTICE` mencantumkan sumber dan atribusi tiap dataset. Peraturan pemerintah adalah dokumen publik, tapi NusaIndex sendiri bukan publikasi resmi.
