---
title: Sumber data
description: Asal setiap dataset NusaIndex, regulasi yang mendasarinya, dan cara menjaganya tetap terbaru.
---

Setiap dataset tersimpan sebagai file CSV di `data/`, dengan dokumen sumber, regulasi, tanggal pengambilan, jumlah baris, dan checksum SHA-256 yang dicatat di `data/manifest.json`. Go meng-embed file CSV-nya; modul TypeScript dibuat dari file yang sama saat build, sehingga kedua library selalu memakai baris yang sama.

| Dataset                 | Baris  | Dasar                                                                                                          |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Wilayah                 | 91.599 | Kepmendagri 300.2.2-2138 Tahun 2025 sebagaimana diubah 300.2.2-2430 Tahun 2025                                 |
| Kode wilayah historis   | 663    | UU 14, 15, 16, dan 29 Tahun 2022 (Papua); UU 20 Tahun 2012 dan Permendagri 66 Tahun 2011 (Kalimantan Utara)    |
| Kode plat               | 514    | Perpol 7 Tahun 2021; kode Korlantas 2024 untuk provinsi baru di Papua                                          |
| Kode area telepon tetap | 387    | Permenkominfo 14 Tahun 2018                                                                                    |
| Libur                   | 194    | SKB 3 Menteri 2020 sampai 2027 beserta semua perubahannya; Keppres 22 Tahun 2020, 10 Tahun 2024, 33 Tahun 2024 |
| Bank                    | 125    | Tabel sandi bank terbitan PT Bank Central Asia Tbk (1 November 2024), bukan terbitan Bank Indonesia            |

Prefix seluler dan susunan NIK, NPWP, serta NIP berasal dari regulasi yang disebut di halaman referensi masing-masing.

## Menjaga data tetap terbaru

Sebuah skrip pemantau membandingkan data dengan sumber resmi dan dataset referensi publik, lalu melaporkan perubahan sebagai diff yang bisa direview. Setiap perubahan data direview manusia, lolos pengecekan skema, relasi, dan checksum, serta menaikkan versi data (`YYYY.MM.N`) yang terpisah dari versi kode. Perubahan karena regulasi (nama wilayah baru, libur tambahan) adalah rilis patch, tidak pernah breaking change.

## Tidak disertakan

- **Kode pos**: satu-satunya sumber adalah halaman pencarian tanpa lisensi atau unduhan.
- **Panjang nomor rekening**: tidak ada sumber resmi.

## Lisensi

Kode dan data berlisensi MIT. `NOTICE` mencantumkan sumber dan atribusi tiap dataset. Peraturan pemerintah adalah dokumen publik; NusaIndex bukan publikasi resmi.
