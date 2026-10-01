import * as mask from "nusaindex/mask";

console.log(mask.nik("7502010706599583"));
console.log(mask.npwp("0029736758100600"));
console.log(mask.phone("0859-5257-171"));
console.log(mask.nip("198812272008092553"));
console.log(mask.nisn("6299763315"));
console.log(mask.account("1234567890"));

const line = mask.text("customer 7502010706599583 called from 085952571710");
if (line.ok) {
  console.log(line.value);
}

const record = {
  name: "Budi",
  nik: "7502010706599583",
  notes: ["call 085952571710"],
};
console.log(JSON.stringify(mask.redact(record)));
