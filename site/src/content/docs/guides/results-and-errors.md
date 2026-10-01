---
title: Results and errors
description: How NusaIndex reports invalid input in Go and TypeScript.
---

Invalid input is an expected outcome, not an exception. Neither library throws or panics for bad input.

## Go: error values

Functions return `(value, error)`. Each package exports sentinel errors named after the error code, such as `nik.ErrLength` or `phone.ErrPrefix`. Compare with `errors.Is`, which keeps working when you wrap the error:

```go
_, err := nik.Parse(input)
switch {
case errors.Is(err, nik.ErrLength):
	return "NIK must have 16 digits"
case errors.Is(err, nik.ErrDate):
	return "birth date in NIK is not a real date"
case err != nil:
	return "invalid NIK"
}
```

`err.Error()` reads like `nik: invalid date`. It never contains the input.

## TypeScript: `Result`

Functions that can fail return a `Result`:

```ts
type Result<T, E extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: E } };
```

Each module exports its error code union (`NikErrorCode`, `PhoneErrorCode`, …), so a `switch` on `error.code` is checked by the compiler:

```ts
const result = nik.parse(input);
if (!result.ok) {
  switch (result.error.code) {
    case "length":
      return "NIK must have 16 digits";
    case "date":
      return "birth date in NIK is not a real date";
    default:
      return "invalid NIK";
  }
}
```

Functions in `region` and `fake.nik` return `Promise<Result<…>>` because region data loads per province on demand.

## Error codes

| Code      | Meaning                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| `length`  | Wrong number of digits, or input longer than the limit (64 characters)       |
| `charset` | A character outside the digits and separators that module accepts            |
| `region`  | Region code that does not exist (NIK district, plate area)                   |
| `date`    | Not a real date, or a date in the wrong place                                |
| `serial`  | Serial part is zero or otherwise impossible                                  |
| `sex`     | NIP sex digit is not 1 or 2                                                  |
| `nik`     | 16-digit NPWP that is a NIK, but not a valid one                             |
| `country` | Phone number with a country code other than +62                              |
| `prefix`  | Phone prefix that is not allocated                                           |
| `format`  | Text that does not follow the expected layout (plates, Rupiah)               |
| `unknown` | Well-formed code that is not in the reference data                           |
| `options` | Invalid option, such as an unknown region level or weekend day               |
| `range`   | Value outside the supported range (years without holiday data, huge amounts) |

The reference page of each module lists the codes it can return.
