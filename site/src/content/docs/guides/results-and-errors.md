---
title: Hasil dan error
description: Cara NusaIndex melaporkan input yang tidak valid di Go dan TypeScript.
---

Input yang salah itu hal biasa, jadi diperlakukan sebagai hasil, bukan exception. Kedua library tidak pernah melempar exception atau panic gara-gara input.

## Go: error sebagai nilai

Fungsi mengembalikan `(nilai, error)`. Tiap paket punya sentinel error sesuai kode error-nya, misalnya `nik.ErrLength` atau `phone.ErrPrefix`. Cek dengan `errors.Is`, yang tetap jalan walaupun error-nya dibungkus:

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

`err.Error()` bentuknya seperti `nik: invalid date` dan tidak pernah memuat input.

## TypeScript: `Result`

Fungsi yang bisa gagal mengembalikan `Result`:

```ts
type Result<T, E extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: E } };
```

Tiap modul mengekspor union kode error-nya (`NikErrorCode`, `PhoneErrorCode`, dan seterusnya), jadi `switch` pada `error.code` ikut dicek compiler:

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

| Kode      | Artinya                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| `length`  | Jumlah digit salah, atau input lebih dari 64 karakter                          |
| `charset` | Ada karakter selain digit dan pemisah yang diterima modul itu                  |
| `region`  | Kode wilayah tidak ada (kecamatan di NIK, kode plat)                           |
| `date`    | Bukan tanggal yang ada, atau tanggalnya di posisi yang salah                   |
| `serial`  | Nomor urut nol atau tidak mungkin                                              |
| `sex`     | Digit jenis kelamin NIP bukan 1 atau 2                                         |
| `nik`     | NPWP 16 digit berupa NIK, tapi NIK-nya tidak valid                             |
| `country` | Nomor telepon dengan kode negara selain +62                                    |
| `prefix`  | Prefix nomor HP yang tidak pernah dialokasikan                                 |
| `format`  | Susunan teksnya tidak sesuai (plat, Rupiah)                                    |
| `unknown` | Strukturnya benar, tapi kodenya tidak ada di data referensi                    |
| `options` | Opsinya salah, misalnya level wilayah atau hari akhir pekan yang tidak dikenal |
| `range`   | Di luar rentang yang didukung (tahun tanpa data libur, nominal terlalu besar)  |

Halaman referensi tiap modul menyebut kode apa saja yang bisa muncul.
