---
title: Server MCP
description: Tool read-only dan offline untuk agent AI, mulai dari nomor identitas, wilayah, libur, hari kerja, sampai Rupiah.
---

`nusaindex-mcp` adalah server [Model Context Protocol](https://modelcontextprotocol.io) yang jalan lokal lewat stdio. Semua tool-nya cuma membaca, tanpa akses ke file system, shell, atau jaringan.

<img src="/demos/mcp.svg" width="760" height="386" alt="Klien MCP: diminta tiga NIK uji di Kota Bandung, tool fake mengembalikan tiga NIK. Ditanya soal 0859-5257-171, tool parse menjawab +628595257171, nomor seluler XL (XLSmart)." />

## Setup

Konfigurasi ini bisa dipakai di kebanyakan klien MCP (Claude Desktop, Claude Code, Cursor, VS Code):

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

Di Claude Code, bisa juga pakai perintah ini:

```sh
claude mcp add nusaindex -- npx -y nusaindex-mcp
```

Butuh Node.js 22.18 ke atas, dan server siap dalam kurang dari 300 ms.

## Tool

| Tool            | Input                                                                    | Hasil                                                 |
| --------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `validate`      | `kind`, `values` (1 sampai 100)                                          | Valid atau kode error untuk setiap nilai              |
| `parse`         | `kind`, `value`                                                          | Field hasil parse, plus nama wilayah untuk NIK        |
| `region_search` | `query`, opsional `level`, `within`, `limit`                             | Wilayah yang cocok, terbaik dulu                      |
| `region_get`    | `code`, opsional `children`                                              | Satu wilayah, plus `resolved` kalau kode lama diikuti |
| `holidays`      | `year`, atau `from` dan `to`                                             | Libur beserta dasar hukumnya                          |
| `workdays`      | `operation` (`is`, `add`, `count`), `date`, `days` atau `to`             | Hasil perhitungan hari kerja                          |
| `rupiah`        | `operation` (`format`, `parse`, `terbilang`), `amount` atau `text`       | Teks format, angka, atau terbilang                    |
| `bank`          | opsional `code` atau `bic`, tanpa keduanya tampil semua                  | Bank yang cocok                                       |
| `mask`          | `kind` dan `values` (1 sampai 100), atau `text`                          | Nilai atau teks yang sudah di-mask                    |
| `fake`          | `kind`, opsional `seed`, `count` (maks 20), `region`, `birthDate`, `sex` | Data uji (hanya untuk pengujian)                      |

Untuk `validate` dan `parse`, `kind` bisa `nik`, `npwp`, `phone`, `plate`, `nip`, atau `nisn`. `mask` menerima `account` sebagai ganti `plate`. Setiap tool mengembalikan structured content plus data yang sama dalam bentuk teks JSON.

## Privasi

:::caution
Apa pun yang kamu ketik di chat AI sudah terkirim ke penyedia AI sebelum sampai ke server lokal ini. Jangan tempel NIK, NPWP, atau nomor HP asli ke chat. Untuk demo, minta agent pakai tool `fake`.
:::

Server tidak pernah me-log atau menyimpan input. Deskripsi tool juga memuat peringatan ini supaya agent bisa ikut mengingatkan. Valid artinya strukturnya benar, bukan berarti nomornya asli.

## Contoh prompt

- "Buat 5 NIK palsu untuk perempuan kelahiran 1990 di Kota Bandung, lalu cek apakah valid."
- "Berapa hari kerja di Agustus 2026, dan libur apa saja di bulan itu?"
- "Terbilangnya Rp1.250.000 apa?"
- "Kabupaten mana saja yang memakai kode plat DR?"
