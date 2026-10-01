import * as phone from "nusaindex/phone";

console.log(phone.isValid("0859-5257-171"));

const mobile = phone.parse("0859-5257-171");
if (mobile.ok) {
  const { e164, type, brand, operator } = mobile.value;
  console.log(e164, type, brand, operator);
}

const fixed = phone.parse("(021) 3456 789");
if (fixed.ok) {
  console.log(fixed.value.e164, fixed.value.type, fixed.value.areaCode);
}

const formatted = phone.format("+62 859 5257 171");
if (formatted.ok) {
  console.log(formatted.value);
}

const link = phone.whatsappLink("0859-5257-171");
if (link.ok) {
  console.log(link.value);
}

console.log(phone.mask("0859-5257-171"));

const foreign = phone.parse("+1 202 555 0100");
console.log(!foreign.ok && foreign.error.code === "country");
