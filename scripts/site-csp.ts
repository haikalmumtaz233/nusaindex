import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scriptElement, styleElement } from "./html-tags.ts";

const distDir = join("site", "dist");
const metaMarker = '<meta http-equiv="content-security-policy"';

const baseDirectives = [
  "default-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "style-src-attr 'unsafe-inline'",
];

const eventHandler = /<[a-z][^>]*\son[a-z]+\s*=/i;
const javascriptUrl = /(?:href|src|action)\s*=\s*["']?\s*javascript:/i;
const externalResource =
  /<(?:script|img|iframe|source|audio|video|embed)\b[^>]*\ssrc\s*=\s*["']?(?:https?:)?\/\/|<link\b[^>]*\srel\s*=\s*["']?(?:stylesheet|preload|modulepreload|icon)[^>]*\shref\s*=\s*["']?(?:https?:)?\/\//i;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return htmlFiles(path);
    }
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

function hash(content: string): string {
  return `'sha256-${createHash("sha256").update(content, "utf8").digest("base64")}'`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function policyFor(html: string): string {
  const scripts = [...html.matchAll(scriptElement)]
    .filter(([, attrs = ""]) => !/\ssrc\s*=/.test(attrs))
    .map(([, , body = ""]) => hash(body));
  const styles = [...html.matchAll(styleElement)].map(([, , body = ""]) => hash(body));
  return [
    ...baseDirectives,
    ["script-src 'self' 'wasm-unsafe-eval'", ...unique(scripts)].join(" "),
    ["style-src 'self'", ...unique(styles)].join(" "),
  ].join("; ");
}

function problemsIn(html: string): string[] {
  const problems: string[] = [];
  if (eventHandler.test(html)) {
    problems.push("inline event handler");
  }
  if (javascriptUrl.test(html)) {
    problems.push("javascript: URL");
  }
  if (externalResource.test(html)) {
    problems.push("third-party resource");
  }
  if (html.includes(metaMarker)) {
    problems.push("existing CSP meta");
  }
  return problems;
}

const failures: string[] = [];
const files = htmlFiles(distDir);
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const problems = problemsIn(html);
  if (problems.length > 0) {
    failures.push(`${file}: ${problems.join(", ")}`);
    continue;
  }
  const head = /<meta charset="utf-8"\s*\/?>/i.exec(html) ?? /<head[^>]*>/.exec(html);
  if (head === null) {
    failures.push(`${file}: missing <head>`);
    continue;
  }
  const at = head.index + head[0].length;
  const meta = `${metaMarker} content="${policyFor(html)}">`;
  writeFileSync(file, html.slice(0, at) + meta + html.slice(at));
}

if (failures.length > 0) {
  process.stderr.write(`site CSP check failed:\n${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`site CSP: ${String(files.length)} pages\n`);
