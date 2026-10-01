---
title: Server MCP
description: Beri agent AI tool read-only dan offline untuk nomor identitas, wilayah, libur, hari kerja, dan Rupiah.
---

`nusaindex-mcp` adalah server [Model Context Protocol](https://modelcontextprotocol.io) yang berjalan lokal lewat stdio. Semua tool-nya read-only: tanpa akses file system, shell, maupun jaringan.

## Setup

Sebagian besar klien MCP (Claude Desktop, Claude Code, Cursor, VS Code) menerima konfigurasi ini:

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

Di Claude Code Anda juga bisa menjalankan:

```sh
claude mcp add nusaindex -- npx -y nusaindex-mcp
```

Server butuh Node.js 22.18 atau lebih baru dan siap dalam waktu kurang dari 300 ms.

## Tool

| Tool            | Input                                                                    | Hasil                                          |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `validate`      | `kind`, `values` (1 sampai 100)                                          | Valid atau kode error untuk setiap nilai       |
| `parse`         | `kind`, `value`                                                          | Field hasil parse; untuk NIK juga nama wilayah |
| `region_search` | `query`, opsional `level`, `within`, `limit`                             | Wilayah yang cocok, terbaik dulu               |
| `region_get`    | `code`, opsional `children`                                              | Satu wilayah, mengikuti kode yang berubah      |
| `holidays`      | `year`, atau `from` dan `to`                                             | Libur beserta dasar hukumnya                   |
| `workdays`      | `operation` (`is`, `add`, `count`), `date`, `days` atau `to`             | Hasil perhitungan hari kerja                   |
| `rupiah`        | `operation` (`format`, `parse`, `terbilang`), `amount` atau `text`       | Teks format, angka, atau terbilang             |
| `fake`          | `kind`, opsional `seed`, `count` (maks 20), `region`, `birthDate`, `sex` | Data uji (hanya untuk pengujian)               |

`kind` salah satu dari `nik`, `npwp`, `phone`, `plate`, `nip`, `nisn`. Setiap tool mengembalikan structured content plus data yang sama dalam bentuk teks JSON.

## Privasi

:::caution
Apa pun yang Anda ketik di chat AI sudah terkirim ke penyedia AI sebelum sampai ke server lokal ini. Jangan menempelkan NIK, NPWP, atau nomor HP asli ke chat. Minta agent memakai tool `fake` untuk demo.
:::

Server tidak pernah me-log atau menyimpan input, dan deskripsi tool mengulang peringatan ini agar agent bisa menyampaikannya. Hasil valid berarti strukturnya benar, bukan berarti asli.

## Contoh prompt

- "Buat 5 NIK palsu untuk perempuan kelahiran 1990 di Kota Bandung, lalu cek apakah valid."
- "Berapa hari kerja di Agustus 2026, dan libur apa saja di bulan itu?"
- "Tuliskan terbilang untuk Rp1.250.000."
- "Kabupaten mana saja yang memakai kode plat DR?"
