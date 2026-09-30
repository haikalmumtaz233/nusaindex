# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `nik`: validate, parse (region codes, birth date, sex, serial), format and mask 16-digit NIK, with `parseAt` for a fixed reference year.
- `npwp`: validate, parse, format, mask and convert NPWP in the 15-digit, 16-digit (including NIK) and 22-digit NITKU forms.
- `phone`: normalize Indonesian phone numbers to E.164, identify mobile brand and operator (Telkomsel, Indosat Ooredoo Hutchison, XLSmart) or fixed-line area code, build `wa.me` links and mask.
- `plate`: validate, parse and format vehicle registration plates (region letters, number, suffix).
- `nip`: validate, parse (birth date, appointment month, sex, serial), format and mask 18-digit civil servant NIP.
- `nisn`: validate, format and mask 10-digit student NISN.
- `normalize`: explicit input normalization that maps full-width characters, Arabic-Indic digits, Unicode dashes and spaces to ASCII and drops zero-width characters (Go and TypeScript).
