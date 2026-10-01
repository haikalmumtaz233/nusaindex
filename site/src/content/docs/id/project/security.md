---
title: Keamanan dan privasi
description: Cara NusaIndex melindungi data pribadi yang melewatinya dan cara rilis dilindungi.
---

## Data pengguna Anda

- **Offline**: library, CLI, dan server MCP tidak melakukan request jaringan. Semua data referensi sudah tertanam.
- **Tanpa log dan penyimpanan**: input tidak pernah di-log, disimpan, atau dikirim. Pesan error hanya berisi kode, tidak pernah nilainya.
- **Input dibatasi**: nomor identitas maksimal 64 karakter, pencarian 256, teks bebas 1 MiB, dan baris batch CLI 1 MiB, dicek sebelum pemrosesan lain.
- **Parsing linear**: tanpa regular expression yang backtracking; setiap parser diuji fuzz di Go.
- **Karakter ketat**: hanya digit ASCII dan pemisah yang tercantum yang diterima, sehingga digit Unicode yang mirip tidak bisa lolos. Panggil `normalize` secara eksplisit jika ingin menerima teks tempelan.
- **Redaksi aman**: `mask.redact` tidak pernah mengubah input, tidak memanggil getter, mengabaikan key prototype, dan tahan terhadap referensi melingkar serta nesting yang dalam.

## Situs ini

- Halaman statis tanpa server, cookie, analytics, atau script dan font pihak ketiga.
- Content Security Policy yang ketat: script dan style hanya dari situs ini, dengan hash untuk kode inline; tidak bisa di-frame.
- [Playground](/id/playground/) sepenuhnya berjalan di browser Anda.

## Supply chain

- Library tanpa dependensi runtime. Server MCP membundel SDK MCP resmi dan Zod, sehingga hanya memasang `nusaindex`.
- Install script dependensi diblokir secara default, versi baru baru dipasang setelah masa tunggu, dan dependensi diaudit sebelum setiap rilis.
- Paket npm hanya dipublish dari CI dengan trusted publishing dan provenance, tanpa token jangka panjang. Rilis Go berupa tag permanen yang tercatat di Go checksum database.

## Melaporkan kerentanan

Laporkan kerentanan secara privat lewat tombol **Report a vulnerability** di tab Security [repositori GitHub](https://github.com/haikalmumtaz233/nusaindex), bukan lewat issue publik. Jangan sertakan data pribadi asli dalam laporan.
