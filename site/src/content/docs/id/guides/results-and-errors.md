---
title: Hasil dan error
description: Cara NusaIndex melaporkan input tidak valid di Go dan TypeScript.
---

Input tidak valid adalah hasil yang wajar, bukan exception. Kedua library tidak pernah melempar exception atau panic untuk input yang salah.

## Go: error sebagai nilai

Fungsi mengembalikan `(nilai, error)`. Setiap paket mengekspor sentinel error yang dinamai sesuai kode error, misalnya `nik.ErrLength` atau `phone.ErrPrefix`. Bandingkan dengan `errors.Is`, yang tetap berfungsi walaupun error dibungkus:

```go
_, err := nik.Parse(input)
switch {
case errors.Is(err, nik.ErrLength):
	return "NIK harus 16 digit"
case errors.Is(err, nik.ErrDate):
	return "tanggal lahir di NIK bukan tanggal yang ada"
case err != nil:
	return "NIK tidak valid"
}
```

`err.Error()` berbentuk `nik: invalid date` dan tidak pernah memuat input.

## TypeScript: `Result`

Fungsi yang bisa gagal mengembalikan `Result`:

```ts
type Result<T, E extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: E } };
```

Setiap modul mengekspor union kode error-nya (`NikErrorCode`, `PhoneErrorCode`, …), sehingga `switch` pada `error.code` dicek oleh compiler:

```ts
const result = nik.parse(input);
if (!result.ok) {
  switch (result.error.code) {
    case "length":
      return "NIK harus 16 digit";
    case "date":
      return "tanggal lahir di NIK bukan tanggal yang ada";
    default:
      return "NIK tidak valid";
  }
}
```

Fungsi di `region` dan `fake.nik` mengembalikan `Promise<Result<…>>` karena data wilayah dimuat per provinsi saat dibutuhkan.

## Kode error

| Kode      | Arti                                                                                |
| --------- | ----------------------------------------------------------------------------------- |
| `length`  | Jumlah digit salah, atau input melebihi batas (64 karakter)                         |
| `charset` | Ada karakter di luar digit dan pemisah yang diterima modul itu                      |
| `region`  | Kode wilayah tidak ada (kecamatan di NIK, kode plat)                                |
| `date`    | Bukan tanggal yang ada, atau tanggal di posisi yang salah                           |
| `serial`  | Nomor urut nol atau tidak mungkin                                                   |
| `sex`     | Digit jenis kelamin NIP bukan 1 atau 2                                              |
| `nik`     | NPWP 16 digit berupa NIK, tetapi NIK-nya tidak valid                                |
| `country` | Nomor telepon dengan kode negara selain +62                                         |
| `prefix`  | Prefix nomor HP yang tidak dialokasikan                                             |
| `format`  | Teks tidak mengikuti susunan yang diharapkan (plat, Rupiah)                         |
| `unknown` | Kode yang strukturnya benar tetapi tidak ada di data referensi                      |
| `options` | Opsi tidak valid, misalnya level wilayah atau hari akhir pekan yang tidak dikenal   |
| `range`   | Nilai di luar rentang yang didukung (tahun tanpa data libur, nominal terlalu besar) |

Halaman referensi tiap modul mencantumkan kode yang bisa dikembalikannya.
