import * as nip from "nusaindex/nip";

console.log(nip.isValid("198812272008092553"));

const civil = nip.parse("198812272008092553");
if (civil.ok) {
  const { kind, birthDate, appointmentDate, sex } = civil.value;
  console.log(kind, birthDate, appointmentDate, sex);
}

const contract = nip.parse("199005172021212541");
if (contract.ok) {
  console.log(contract.value.kind, contract.value.appointmentDate, contract.value.agreement);
}

const formatted = nip.format("198812272008092553");
if (formatted.ok) {
  console.log(formatted.value);
}

console.log(nip.mask("198812272008092553"));
