import * as region from "nusaindex/region";

const regency = await region.get("31.71");
if (regency.ok) {
  console.log(regency.value.name, regency.value.level, regency.value.parentCode);
}

const districts = await region.children("31.71");
if (districts.ok) {
  console.log(districts.value.length, districts.value[0]?.name);
}

const found = await region.search("gambir", { level: "district", limit: 2 });
if (found.ok) {
  for (const r of found.value) {
    console.log(r.code, r.name);
  }
}

const current = await region.resolve("91.04");
if (current.ok) {
  console.log(current.value.code, current.value.name);
}

const byPlate = await region.byPlate("DR");
if (byPlate.ok) {
  console.log(byPlate.value.length, byPlate.value[0]?.name);
}

const byArea = await region.byAreaCode("0274");
if (byArea.ok) {
  console.log(byArea.value[0]?.code, byArea.value[0]?.name);
}

const place = await region.fromNik("7502010706599583");
if (place.ok) {
  const { province, regency: kab, district, historical } = place.value;
  console.log(province.name, kab?.name, district?.name, historical);
}
