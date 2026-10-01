import type { APIRoute } from "astro";
import { holidayYears, jsonResponse, payload } from "../../../lib/api";

export const GET: APIRoute = () =>
  jsonResponse(
    payload({
      holidays: holidayYears().map((year) => `/api/v1/holidays/${String(year)}.json`),
      provinces: "/api/v1/provinces.json",
      regencies: "/api/v1/regencies/{province}.json",
    }),
  );
