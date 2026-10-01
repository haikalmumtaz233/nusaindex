import * as npwp from "nusaindex/npwp";

console.log(npwp.isValid("02.973.675.8-100.600"));

const parsed = npwp.parse("02.973.675.8-100.600");
if (parsed.ok) {
  const { npwp16, npwp15, taxOffice, isNik } = parsed.value;
  console.log(npwp16, npwp15, taxOffice, isNik);
}

const sixteen = npwp.to16("029736758100600");
if (sixteen.ok) {
  console.log(sixteen.value);
}

const formatted = npwp.format("029736758100600");
if (formatted.ok) {
  console.log(formatted.value);
}

console.log(npwp.mask("0029736758100600"));
