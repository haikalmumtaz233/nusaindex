import * as plate from "nusaindex/plate";

console.log(plate.isValid("DR 2826 IBN"));

const parsed = plate.parse("dr2826ibn");
if (parsed.ok) {
  console.log(parsed.value.region, parsed.value.number, parsed.value.suffix);
}

const formatted = plate.format("b-1234-xyz");
if (formatted.ok) {
  console.log(formatted.value);
}

const unknown = plate.parse("QQ 1234 AB");
console.log(!unknown.ok && unknown.error.code === "region");
