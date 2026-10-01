import type { APIRoute } from "astro";
import { jsonResponse, payload, provinces } from "../../../lib/api";

export const GET: APIRoute = async () => jsonResponse(payload(await provinces()));
