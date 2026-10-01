import type { APIRoute, GetStaticPaths } from "astro";
import { holidayYears, holidaysIn, jsonResponse, payload } from "../../../../lib/api";

export const getStaticPaths = (() =>
  holidayYears().map((year) => ({
    params: { year: String(year) },
    props: { year },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ year: number }> = ({ props }) =>
  jsonResponse(payload(holidaysIn(props.year)));
