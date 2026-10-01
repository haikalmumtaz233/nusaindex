import * as holiday from "nusaindex/holiday";

const coverage = holiday.years();
console.log(coverage.from, coverage.to);

const all = holiday.inYear(2026);
if (all.ok) {
  console.log(all.value.length, all.value[0]?.date, all.value[0]?.nameEn);
}

const august = holiday.between("2026-08-01", "2026-08-31");
if (august.ok) {
  for (const h of august.value) {
    console.log(h.date, h.kind, h.name);
  }
}

const christmas = holiday.on("2026-12-25");
if (christmas.ok) {
  console.log(christmas.value.length, christmas.value[0]?.basis);
}
