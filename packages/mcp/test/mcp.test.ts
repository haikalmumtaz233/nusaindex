import { InMemoryTransport, type JSONRPCMessage } from "@modelcontextprotocol/server";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";
import { tools } from "../src/tools.js";

const FAKE_NIK = "3171014501909999";
const ctx = { randomSeed: () => 7 };

async function connect(): Promise<(message: object) => Promise<unknown>> {
  const [client, server] = InMemoryTransport.createLinkedPair();
  const pending = new Map<number, (result: unknown) => void>();
  client.onmessage = (message: JSONRPCMessage) => {
    const id: unknown = Reflect.get(message, "id");
    if (typeof id === "number") {
      pending.get(id)?.(message);
    }
  };
  await createServer(ctx).connect(server);
  await client.start();
  let next = 0;
  return (message) => {
    next++;
    const id = next;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      void client.send({ jsonrpc: "2.0", id, ...message } as JSONRPCMessage);
    });
  };
}

describe("mcp server", () => {
  it("lists eight read-only tools and answers calls", async () => {
    const request = await connect();
    const init = await request({
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test", version: "0" },
      },
    });
    expect(init).toMatchObject({ result: { serverInfo: { name: "nusaindex" } } });
    const list = await request({ method: "tools/list" });
    const listed: unknown = Reflect.get(Reflect.get(Object(list), "result"), "tools");
    expect(Array.isArray(listed) && listed.length).toBe(8);
    expect(JSON.stringify(listed)).toContain('"readOnlyHint":true');
    const call = await request({
      method: "tools/call",
      params: { name: "validate", arguments: { kind: "nik", values: [FAKE_NIK] } },
    });
    expect(call).toMatchObject({
      result: { structuredContent: { results: [{ index: 0, valid: true }] } },
    });
  });

  it("warns about privacy where personal data goes in", () => {
    for (const tool of [tools.validate, tools.parse]) {
      expect(tool.description).toContain("already been sent to the AI provider");
    }
    expect(tools.fakes.description).toContain("For tests only");
  });
});

describe("mcp tools", () => {
  it("validates and parses identifiers", async () => {
    expect(await tools.validate.call({ kind: "nik", values: [FAKE_NIK, "12"] }, ctx)).toEqual({
      results: [
        { index: 0, valid: true },
        { index: 1, valid: false, error: "length" },
      ],
    });
    expect(await tools.parse.call({ kind: "phone", value: "0812-0000-0001" }, ctx)).toMatchObject({
      ok: true,
      value: { operator: "Telkomsel" },
    });
    expect(await tools.parse.call({ kind: "nik", value: FAKE_NIK }, ctx)).toMatchObject({
      place: { district: { name: "Gambir" } },
    });
    expect(await tools.parse.call({ kind: "nik", value: "1" }, ctx)).toMatchObject({ ok: false });
  });

  it("searches and gets regions", async () => {
    expect(await tools.regionSearch.call({ query: "gambir" }, ctx)).toMatchObject({ ok: true });
    const scoped = await tools.regionSearch.call(
      { query: "gambir", level: "village", within: "31", limit: 1 },
      ctx,
    );
    expect(scoped).toMatchObject({ ok: true, value: [{ code: "31.71.01.1001" }] });
    expect(await tools.regionGet.call({ code: "31.71" }, ctx)).toMatchObject({
      ok: true,
      value: { level: "regency" },
    });
    const withChildren = await tools.regionGet.call({ code: "31.71", children: true }, ctx);
    expect(Reflect.get(withChildren, "children")).toHaveLength(8);
    expect(await tools.regionGet.call({ code: "99", children: true }, ctx)).toMatchObject({
      ok: false,
    });
  });

  it("answers holidays and workdays", async () => {
    expect(await tools.holidays.call({ year: 2026 }, ctx)).toMatchObject({ ok: true });
    expect(await tools.holidays.call({ from: "2026-08-01", to: "2026-08-31" }, ctx)).toMatchObject({
      ok: true,
      value: [{ date: "2026-08-17" }, { date: "2026-08-25" }],
    });
    expect(await tools.holidays.call({}, ctx)).toEqual({ ok: false, error: { code: "options" } });
    expect(await tools.workdays.call({ operation: "is", date: "2026-08-17" }, ctx)).toEqual({
      ok: true,
      value: false,
    });
    expect(
      await tools.workdays.call(
        { operation: "add", date: "2026-08-14", days: 1, weekend: [0, 6] },
        ctx,
      ),
    ).toEqual({ ok: true, value: "2026-08-18" });
    expect(
      await tools.workdays.call(
        {
          operation: "count",
          date: "2026-03-01",
          to: "2026-03-31",
          collectiveLeaveIsWorkday: true,
        },
        ctx,
      ),
    ).toEqual({ ok: true, value: 21 });
    for (const operation of ["add", "count"]) {
      expect(await tools.workdays.call({ operation, date: "2026-03-01" }, ctx)).toEqual({
        ok: false,
        error: { code: "options" },
      });
    }
  });

  it("formats, parses and spells rupiah", async () => {
    expect(await tools.money.call({ operation: "format", amount: 1500.5 }, ctx)).toEqual({
      ok: true,
      value: "Rp1.500,50",
    });
    expect(await tools.money.call({ operation: "terbilang", amount: 1000 }, ctx)).toEqual({
      ok: true,
      value: "seribu rupiah",
    });
    expect(await tools.money.call({ operation: "parse", text: "Rp15.000,-" }, ctx)).toEqual({
      ok: true,
      value: 15000,
    });
    for (const operation of ["parse", "format"]) {
      expect(await tools.money.call({ operation }, ctx)).toEqual({
        ok: false,
        error: { code: "options" },
      });
    }
  });

  it("generates fake data", async () => {
    expect(await tools.fakes.call({ kind: "nik", seed: 1, count: 2 }, ctx)).toEqual({
      ok: true,
      value: ["5105011707791121", "3315101006730262"],
      seed: 1,
    });
    for (const kind of ["npwp", "phone", "nip", "nisn", "plate"]) {
      expect(await tools.fakes.call({ kind }, ctx)).toMatchObject({ ok: true, seed: 7 });
    }
    const pinned = await tools.fakes.call(
      { kind: "nik", region: "31.71", birthDate: "1990-01-01", sex: "male" },
      ctx,
    );
    expect(pinned).toMatchObject({ ok: true });
    expect(await tools.fakes.call({ kind: "plate", region: "ZZ" }, ctx)).toEqual({
      ok: false,
      error: { code: "region" },
    });
  });
});
