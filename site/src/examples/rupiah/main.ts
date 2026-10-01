import * as rupiah from "nusaindex/rupiah";

const price = 1_500_000.5;

const text = rupiah.format(price);
if (text.ok) {
  console.log(text.value);
}

const plain = rupiah.format(2_000_000, { decimals: true, symbol: false });
if (plain.ok) {
  console.log(plain.value);
}

console.log(rupiah.isValid("Rp 25.000,-"));

const amount = rupiah.parse("Rp 25.000,-");
if (amount.ok) {
  console.log(amount.value);
}

const words = rupiah.terbilang(price);
if (words.ok) {
  console.log(words.value);
}
