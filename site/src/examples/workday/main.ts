import * as workday from "nusaindex/workday";

const open = workday.isWorkday("2026-08-17");
if (open.ok) {
  console.log(open.value);
}

const due = workday.add("2026-08-14", 3);
if (due.ok) {
  console.log(due.value);
}

const days = workday.count("2026-08-01", "2026-08-31");
if (days.ok) {
  console.log(days.value);
}

const sixDay = { weekend: [0], collectiveLeaveIsWorkday: true };
const sixDayCount = workday.count("2026-08-01", "2026-08-31", sixDay);
if (sixDayCount.ok) {
  console.log(sixDayCount.value);
}
