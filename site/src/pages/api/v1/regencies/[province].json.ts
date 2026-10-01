import type { APIRoute, GetStaticPaths } from "astro";
import { jsonResponse, payload, provinces, regenciesOf } from "../../../../lib/api";

export const getStaticPaths = (async () =>
  (await provinces()).map((p) => ({
    params: { province: p.code },
    props: { code: p.code },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ code: string }> = async ({ props }) =>
  jsonResponse(payload(await regenciesOf(props.code)));
