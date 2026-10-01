# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-01

### Added

- Reference data `2026.10.5` in `data/` (regions, historical region codes, plate codes, fixed-line area codes, holidays and bank codes), with the source document, regulation and checksum of every dataset in `data/manifest.json` and attributions in `NOTICE`.
- `bank`: list banks and look them up by 3-digit bank code (including their sharia units) or by BIC.
- `workday`: check a date, add or subtract working days, and count working days in a range, skipping weekends, national holidays and (optionally) collective leave. The weekend days are configurable.
- `holiday`: national holidays and collective leave for 2020-2027 by year, date range or single date, each with its Indonesian and English name and the SKB or Keppres it comes from.
- `region`: get, list children, search and resolve provinces, regencies, districts and villages from Kepmendagri 300.2.2-2138/2025 (as amended by 2430/2025), including historical codes from the 2012 Kalimantan Utara and 2022 Papua splits. `byPlate` lists the regencies registered under a vehicle plate code, and `byAreaCode` the province or regencies behind a fixed-line area code (Permenkominfo 14/2018). `fromNik` turns the district code in a NIK into current province, regency and district names, following renumbered codes and flagging them as historical. The TypeScript API is asynchronous and loads district and village data per province on demand.
- `nip`: `parse` reports `kind` (`pns` or `pppk`) and, for PPPK numbers, the work `agreement` count.

### Changed

- `plate`: `parse`, `isValid` and `format` reject region codes that are not in Perpol 7/2021 or the 2024 Papua codes, with the new error code `region`. `RI` stays valid.

### Fixed

- `nip`: accept PPPK numbers, whose 13th and 14th digits hold the work agreement count starting at `21` instead of the appointment month; `appointmentDate` is the appointment year for these numbers.

## [0.1.0] - 2026-09-30

### Added

- `nik`: validate, parse (region codes, birth date, sex, serial), format and mask 16-digit NIK, with `parseAt` for a fixed reference year.
- `npwp`: validate, parse, format, mask and convert NPWP in the 15-digit, 16-digit (including NIK) and 22-digit NITKU forms.
- `phone`: normalize Indonesian phone numbers to E.164, identify mobile brand and operator (Telkomsel, Indosat Ooredoo Hutchison, XLSmart) or fixed-line area code, build `wa.me` links and mask.
- `plate`: validate, parse and format vehicle registration plates (region letters, number, suffix).
- `nip`: validate, parse (birth date, appointment month, sex, serial), format and mask 18-digit civil servant NIP.
- `nisn`: validate, format and mask 10-digit student NISN.
- `normalize`: explicit input normalization that maps full-width characters, Arabic-Indic digits, Unicode dashes and spaces to ASCII and drops zero-width characters (Go and TypeScript).
