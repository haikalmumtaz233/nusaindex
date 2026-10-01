import * as bank from "nusaindex/bank";

console.log(bank.list().length > 100);

const banks = bank.byCode("014");
if (banks.ok) {
  for (const b of banks.value) {
    console.log(b.code, b.shortName, b.bic, b.shariaUnit);
  }
}

const found = bank.byBic("BMRIIDJA");
if (found.ok) {
  console.log(found.value.code, found.value.name);
}
