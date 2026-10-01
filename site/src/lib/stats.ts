export interface LevelCounts {
  readonly province: number;
  readonly regency: number;
  readonly district: number;
  readonly village: number;
}

export function levelCounts(csv: string): LevelCounts {
  const counts = { province: 0, regency: 0, district: 0, village: 0 };
  for (const line of csv.split("\n").slice(1)) {
    switch (line.indexOf(",")) {
      case 2:
        counts.province += 1;
        break;
      case 5:
        counts.regency += 1;
        break;
      case 8:
        counts.district += 1;
        break;
      case 13:
        counts.village += 1;
        break;
    }
  }
  return counts;
}
