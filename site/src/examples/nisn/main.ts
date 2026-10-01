import * as nisn from "nusaindex/nisn";

console.log(nisn.isValid("6299763315"));

const parsed = nisn.parse(" 6299763315 ");
if (parsed.ok) {
  console.log(parsed.value.nisn);
}

const formatted = nisn.format("6299763315");
if (formatted.ok) {
  console.log(formatted.value);
}

console.log(nisn.mask("6299763315"));
