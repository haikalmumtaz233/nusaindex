import * as nik from "nusaindex/nik";
import * as phone from "nusaindex/phone";
import * as rupiah from "nusaindex/rupiah";

const person = nik.parse("3273275705901349");
if (person.ok) {
  console.log(person.value.birthDate, person.value.sex);
}

const mobile = phone.parse("0859-5257-171");
if (mobile.ok) {
  console.log(mobile.value.e164, mobile.value.brand);
}

const words = rupiah.terbilang(1_500_000.5);
if (words.ok) {
  console.log(words.value);
}
