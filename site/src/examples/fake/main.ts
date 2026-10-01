import * as fake from "nusaindex/fake";

const id = await fake.nik(7, { region: "31.71", birthDate: "1990-05-17", sex: "female" });
if (id.ok) {
  console.log(id.value);
}

for (const generated of [fake.npwp(3), fake.phone(11), fake.nisn(7)]) {
  if (generated.ok) {
    console.log(generated.value);
  }
}

const employee = fake.nip(5, { birthDate: "1990-05-17", sex: "female" });
if (employee.ok) {
  console.log(employee.value);
}

const car = fake.plate(7, { region: "B" });
if (car.ok) {
  console.log(car.value);
}
