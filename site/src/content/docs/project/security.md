---
title: Keamanan dan privasi
description: Cara NusaIndex menjaga data pribadi yang lewat dan cara rilisnya diamankan.
---

## Data pengguna kamu

- **Offline**: library, CLI, dan server MCP tidak pernah request ke jaringan. Semua data referensi sudah tertanam.
- **Tanpa log dan penyimpanan**: input tidak pernah di-log, disimpan, atau dikirim. Pesan error cuma berisi kode.
- **Input dibatasi**: nomor identitas maksimal 64 karakter, pencarian 256, teks bebas dan baris batch CLI 1 MiB. Batas ini dicek paling awal.
- **Parsing linear**: tidak ada regular expression yang backtracking, dan setiap parser diuji fuzz di Go.
- **Karakter ketat**: cuma digit ASCII dan pemisah yang disebut yang diterima, jadi digit Unicode yang mirip tidak bisa lolos. Panggil `normalize` kalau memang mau menerima teks tempelan.
- **Redaksi aman**: `mask.redact` tidak mengubah input, tidak memanggil getter, mengabaikan key prototype, dan tahan referensi melingkar serta nesting yang dalam.

## Situs ini

- Halaman statis tanpa server, cookie, analytics, atau script dan font pihak ketiga.
- Content Security Policy yang ketat. Script dan style cuma dari situs ini, kode inline dikunci dengan hash, dan halaman tidak bisa di-frame.
- [Playground](/playground/) dan semua alat interaktif jalan sepenuhnya di browser kamu.

## Supply chain

- Library tanpa dependensi runtime. Server MCP membundel SDK MCP resmi dan Zod, jadi yang terpasang cuma `nusaindex`.
- Install script dependensi diblokir, versi baru menunggu masa tunggu dulu, dan dependensi diaudit sebelum rilis.
- Paket npm cuma dipublish dari CI dengan trusted publishing dan provenance, tanpa token jangka panjang. Rilis Go berupa tag permanen yang tercatat di Go checksum database.

## Melaporkan kerentanan

Laporkan secara privat lewat tombol **Report a vulnerability** di tab Security [repositori GitHub](https://github.com/haikalmumtaz233/nusaindex), jangan lewat issue publik. Jangan sertakan data pribadi asli di laporan.
