import * as holiday from "nusaindex/holiday";
import * as region from "nusaindex/region";
import manifest from "../../../data/manifest.json" with { type: "json" };

export interface Payload<T> {
  readonly dataVersion: string;
  readonly data: T;
}

export const dataVersion: string = manifest.dataVersion;

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string } }): T {
  if (!result.ok) {
    throw new Error(`static API data failed: ${result.error.code}`);
  }
  return result.value;
}

export function payload<T>(data: T): Payload<T> {
  return { dataVersion, data };
}

export function holidayYears(): number[] {
  const { from, to } = holiday.years();
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export function holidaysIn(year: number): holiday.Holiday[] {
  return unwrap(holiday.inYear(year));
}

export async function provinces(): Promise<region.Region[]> {
  return unwrap(await region.children(""));
}

export async function regenciesOf(province: string): Promise<region.Region[]> {
  return unwrap(await region.children(province));
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
