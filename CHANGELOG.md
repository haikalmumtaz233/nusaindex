# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `nik`: validate, parse (region codes, birth date, sex, serial), format and mask 16-digit NIK, with `parseAt` for a fixed reference year.
- `normalize`: explicit input normalization that maps full-width characters, Arabic-Indic digits, Unicode dashes and spaces to ASCII and drops zero-width characters (Go and TypeScript).
