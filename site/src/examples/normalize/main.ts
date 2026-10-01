import * as nik from "nusaindex/nik";
import * as normalize from "nusaindex/normalize";

const pasted = "７５０２０１０７０６５９９５８３\u200b";

const raw = nik.parse(pasted);
console.log(!raw.ok && raw.error.code === "charset");

const clean = normalize.text(pasted);
console.log(clean, nik.isValid(clean));
