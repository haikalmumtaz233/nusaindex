# nusaindex-mcp

Server MCP untuk [NusaIndex](https://github.com/haikalmumtaz233/nusaindex). Cek dan baca isi nomor identitas Indonesia (NIK, NPWP, nomor HP, plat, NIP, NISN), cari wilayah, libur, hari kerja, dan kode bank, format dan terbilang Rupiah, mask data pribadi, serta buat data uji. Jalan lokal lewat stdio, offline, dan semua tool-nya cuma membaca.

```json
{
  "mcpServers": {
    "nusaindex": { "command": "npx", "args": ["-y", "nusaindex-mcp"] }
  }
}
```

Tool: `validate`, `parse`, `region_search`, `region_get`, `holidays`, `workdays`, `rupiah`, `bank`, `mask`, `fake`.

Privasi: apa pun yang kamu ketik di chat AI sudah terkirim ke penyedia AI sebelum sampai ke server ini. Pakai tool `fake` untuk demo. Server tidak pernah me-log atau menyimpan input.

Valid artinya strukturnya benar. NusaIndex tidak bisa memastikan nomor itu asli atau siapa pemiliknya. Tidak resmi dan tidak berafiliasi dengan instansi pemerintah mana pun.

English: an offline, read-only MCP server for Indonesian identifiers, regions, holidays, working days, bank codes and Rupiah. See the [English README](https://github.com/haikalmumtaz233/nusaindex/blob/main/README.en.md).
