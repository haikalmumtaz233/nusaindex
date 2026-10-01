import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Frame {
  readonly at: number;
  readonly lines: readonly Row[];
  readonly typed?: number;
}

type Tone = "prompt" | "command" | "key" | "value" | "plain" | "user" | "tool" | "muted";

interface Piece {
  readonly text: string;
  readonly tone: Tone;
}

interface Row {
  readonly pieces: readonly Piece[];
  readonly indent?: number;
  readonly bubble?: "user" | "tool";
}

const outDir = join("site", "public", "demos");
const update = process.argv.includes("--update");
const cli = join("packages", "nusaindex", "dist", "cli.js");
const mcp = join("packages", "mcp", "dist", "main.js");

const width = 760;
const padX = 24;
const top = 76;
const lineHeight = 22;
const charWidth = 8.4;
const fontSize = 14;

const colors: Readonly<Record<Tone, string>> = {
  prompt: "#f2b53a",
  command: "#ffffff",
  key: "#8890bc",
  value: "#e6e8f5",
  plain: "#e6e8f5",
  user: "#12163a",
  tool: "#5fd3cf",
  muted: "#8890bc",
};

function escape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function round(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function outputRow(line: string): Row {
  const match = /^(\S+)( {2,})(.*)$/.exec(line);
  if (match === null) {
    return { pieces: [{ text: line, tone: "plain" }] };
  }
  const [, key = "", gap = "", value = ""] = match;
  return {
    pieces: [
      { text: key + gap, tone: "key" },
      { text: value, tone: "value" },
    ],
  };
}

function runCli(args: readonly string[]): string[] {
  const out = execFileSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  return out.replace(/\r\n/g, "\n").replaceAll("\t", "  ").trimEnd().split("\n");
}

function cliFrames(): Frame[] {
  const commands: readonly (readonly string[])[] = [
    ["nik", "3273275705901349"],
    ["phone", "0859-5257-171"],
    ["rupiah", "terbilang", "1500000.5"],
    ["mask", "text", "NIK 3273275705901349, HP 0859-5257-171"],
  ];
  const frames: Frame[] = [];
  let at = 0.4;
  for (const args of commands) {
    const shown = args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ");
    const typed = `nusa ${shown}`;
    frames.push({
      at,
      typed: typed.length,
      lines: [
        {
          pieces: [
            { text: "$ ", tone: "prompt" },
            { text: typed, tone: "command" },
          ],
        },
      ],
    });
    at += Math.min(1.6, typed.length * 0.04) + 0.3;
    frames.push({ at, lines: runCli(args).map(outputRow) });
    at += 1.5;
  }
  return frames;
}

interface RpcResponse {
  readonly id?: number;
  readonly result?: { readonly structuredContent?: unknown };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function callTools(
  calls: readonly { name: string; arguments: Record<string, unknown> }[],
): unknown[] {
  const requests = [
    {
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "site-demos", version: "0" },
      },
    },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    ...calls.map((params, i) => ({ jsonrpc: "2.0", id: i + 1, method: "tools/call", params })),
  ];
  const run = spawnSync(process.execPath, [mcp], {
    input: requests.map((r) => JSON.stringify(r)).join("\n") + "\n",
    encoding: "utf8",
  });
  const responses = run.stdout
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line): unknown => JSON.parse(line));
  return calls.map((_, i) => {
    const found = responses.find((r): r is RpcResponse => isRecord(r) && r["id"] === i + 1);
    const content = found?.result?.structuredContent;
    if (!isRecord(content) || content["ok"] !== true) {
      throw new Error(`mcp tool call ${String(i + 1)} failed`);
    }
    return content["value"];
  });
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function field(value: unknown, key: string): string {
  if (!isRecord(value)) {
    return "";
  }
  const found = value[key];
  return typeof found === "string" ? found : "";
}

function mcpFrames(): Frame[] {
  const fakeArgs = {
    kind: "nik",
    count: 3,
    seed: 42,
    region: "32.73",
    birthDate: "1990-05-17",
    sex: "female",
  };
  const [niks, parsed] = callTools([
    { name: "fake", arguments: fakeArgs },
    { name: "parse", arguments: { kind: "phone", value: "0859-5257-171" } },
  ]);
  const user = (text: string): Row => ({ pieces: [{ text, tone: "user" }], bubble: "user" });
  const tool = (text: string): Row => ({ pieces: [{ text, tone: "tool" }], bubble: "tool" });
  const result = (text: string): Row => ({ pieces: [{ text, tone: "value" }], indent: 2 });
  return [
    { at: 0.4, lines: [user("Buatin 3 NIK uji: Kota Bandung, lahir 1990-05-17, perempuan")] },
    { at: 1.6, lines: [tool("fake  kind=nik count=3 region=32.73 sex=female seed=42")] },
    { at: 2.4, lines: asStrings(niks).map(result) },
    { at: 4.4, lines: [user("Nomor 0859-5257-171 ini valid nggak?")] },
    { at: 5.6, lines: [tool("parse  kind=phone")] },
    {
      at: 6.4,
      lines: [
        result(`${field(parsed, "e164")}  ${field(parsed, "type")}`),
        result(`${field(parsed, "brand")} (${field(parsed, "operator")})`),
      ],
    },
  ];
}

function rowText(row: Row): string {
  return row.pieces.map((p) => p.text).join("");
}

function renderRow(row: Row, y: number, cls: string): string {
  const x = padX + (row.indent ?? 0) * charWidth;
  const text = row.pieces
    .map((p) => `<tspan fill="${colors[p.tone]}">${escape(p.text)}</tspan>`)
    .join("");
  const length = rowText(row).length;
  if (row.bubble === "user") {
    const w = length * charWidth + 24;
    const bx = width - padX - w;
    return `<g class="${cls}"><rect x="${round(bx)}" y="${round(y - 16)}" width="${round(w)}" height="26" rx="13" fill="#f2b53a"/><text x="${round(bx + 12)}" y="${round(y + 1)}">${text}</text></g>`;
  }
  if (row.bubble === "tool") {
    const w = length * charWidth + 20;
    return `<g class="${cls}"><rect x="${round(x)}" y="${round(y - 16)}" width="${round(w)}" height="26" rx="6" fill="none" stroke="#2c3366"/><text x="${round(x + 10)}" y="${round(y + 1)}">${text}</text></g>`;
  }
  return `<text class="${cls}" x="${round(x)}" y="${round(y)}">${text}</text>`;
}

function keyframes(name: string, start: number, total: number): string {
  const s = (start / total) * 100;
  const end = ((total - 0.6) / total) * 100;
  return `@keyframes ${name}{0%,${round(Math.max(0, s - 0.01))}%{opacity:0}${round(s)}%,${round(end)}%{opacity:1}100%{opacity:0}}`;
}

function typing(
  name: string,
  start: number,
  duration: number,
  total: number,
  shift: number,
  steps: number,
): string {
  const s = (start / total) * 100;
  const e = ((start + duration) / total) * 100;
  return `@keyframes ${name}{0%,${round(s)}%{transform:translateX(0);animation-timing-function:steps(${String(steps)},end)}${round(e)}%,100%{transform:translateX(${round(shift)}px)}}`;
}

function render(title: string, frames: readonly Frame[], spacing: number): string {
  const last = frames.at(-1);
  const total = (last?.at ?? 0) + 3.5;
  const body: string[] = [];
  const styles: string[] = [];
  let y = top;
  frames.forEach((frame, f) => {
    frame.lines.forEach((row, r) => {
      const cls = `a f${String(f)}r${String(r)}`;
      const name = `k${String(f)}r${String(r)}`;
      styles.push(`.f${String(f)}r${String(r)}{animation:${name} ${round(total)}s infinite}`);
      styles.push(keyframes(name, frame.at, total));
      body.push(renderRow(row, y, cls));
      if (frame.typed !== undefined) {
        const coverX = padX + 2 * charWidth;
        const coverW = frame.typed * charWidth + charWidth;
        const duration = Math.min(1.6, frame.typed * 0.04);
        const cover = `t${String(f)}`;
        styles.push(`.${cover}{animation:${cover} ${round(total)}s infinite}`);
        styles.push(typing(cover, frame.at, duration, total, coverW, frame.typed));
        body.push(
          `<rect class="cover ${cover}" x="${round(coverX)}" y="${round(y - 16)}" width="${round(coverW)}" height="${String(lineHeight)}" fill="#12163a"/>`,
        );
      }
      y += row.bubble === undefined ? lineHeight : lineHeight + 10;
    });
    y += spacing;
  });
  const height = Math.ceil(y + 12);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}" role="img" aria-label="${escape(title)}">`,
    `<style>text{font-family:ui-monospace,"Cascadia Mono","SF Mono",Menlo,Consolas,monospace;font-size:${String(fontSize)}px;white-space:pre}${styles.join("")}@media (prefers-reduced-motion:reduce){.a{animation:none}.cover{display:none}}</style>`,
    `<rect width="${String(width)}" height="${String(height)}" rx="12" fill="#12163a"/>`,
    `<rect x="0.5" y="0.5" width="${String(width - 1)}" height="${String(height - 1)}" rx="12" fill="none" stroke="#2c3366"/>`,
    `<text x="${String(padX)}" y="28" fill="#8890bc">${escape(title)}</text>`,
    `<line x1="0" y1="40" x2="${String(width)}" y2="40" stroke="#2c3366"/>`,
    ...body,
    "</svg>",
    "",
  ].join("\n");
}

const demos: readonly { file: string; svg: () => string }[] = [
  { file: "cli.svg", svg: () => render("nusa di terminal", cliFrames(), 6) },
  { file: "mcp.svg", svg: () => render("nusaindex-mcp di klien MCP", mcpFrames(), 10) },
];

const stale: string[] = [];
mkdirSync(outDir, { recursive: true });
for (const demo of demos) {
  const path = join(outDir, demo.file);
  const svg = demo.svg();
  if (update) {
    writeFileSync(path, svg);
  }
  const current = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== svg) {
    stale.push(path);
  }
}

if (stale.length > 0) {
  process.stderr.write(
    `site demos are stale, run node scripts/site-demos.ts --update:\n${stale.join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(`site demos: ${String(demos.length)} up to date\n`);
