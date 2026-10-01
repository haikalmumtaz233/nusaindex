import * as nik from "nusaindex/nik";

console.log(nik.isValid("7502010706599583"));

const parsed = nik.parse("7502010706599583");
if (parsed.ok) {
  const { districtCode, birthDate, sex, serial } = parsed.value;
  console.log(districtCode, birthDate, sex, serial);
}

const older = nik.parseAt("3315101003154137", 2010);
if (older.ok) {
  console.log(older.value.birthDate);
}

const formatted = nik.format("7502 0107 0659 9583");
if (formatted.ok) {
  console.log(formatted.value);
}

console.log(nik.mask("7502010706599583"));

const invalid = nik.parse("7502013206599583");
console.log(!invalid.ok && invalid.error.code === "date");
