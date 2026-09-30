import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

interface Finding {
  file: string;
  line: number;
}

const goDirectives = ["//go:build", "//go:embed"];
const hashFiles = [".gitignore", ".prettierignore", ".gitattributes", ".editorconfig"];

function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  });
  return out.split("\n").filter((f) => f !== "");
}

function lineOf(text: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
}

function scriptComments(file: string, text: string): number[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const positions = new Set<number>();
  const record = (ranges: ts.CommentRange[] | undefined): void => {
    for (const range of ranges ?? []) {
      positions.add(range.pos);
    }
  };
  const visit = (node: ts.Node): void => {
    record(ts.getLeadingCommentRanges(text, node.pos));
    record(ts.getTrailingCommentRanges(text, node.end));
    for (const child of node.getChildren(source)) {
      visit(child);
    }
  };
  visit(source);
  return [...positions].map((pos) => lineOf(text, pos));
}

function goComments(text: string): number[] {
  const lines: number[] = [];
  let line = 1;
  let i = 0;
  let lineStart = true;
  while (i < text.length) {
    const c = text.charAt(i);
    const next = text.charAt(i + 1);
    if (c === "\n") {
      line++;
      lineStart = true;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      const end = text.indexOf("\n", i);
      const body = text.slice(i, end === -1 ? text.length : end);
      const directive = lineStart && goDirectives.some((d) => body.startsWith(d + " "));
      if (!directive) {
        lines.push(line);
      }
      i = end === -1 ? text.length : end;
      continue;
    }
    if (c === "/" && next === "*") {
      lines.push(line);
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      for (let j = i; j < stop; j++) {
        if (text.charCodeAt(j) === 10) {
          line++;
        }
      }
      i = stop;
      lineStart = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < text.length && text.charAt(j) !== c) {
        if (c !== "`" && text.charAt(j) === "\\") {
          j++;
        }
        if (text.charAt(j) === "\n") {
          line++;
        }
        j++;
      }
      i = j + 1;
      lineStart = false;
      continue;
    }
    if (c !== " " && c !== "\t" && c !== "\r") {
      lineStart = false;
    }
    i++;
  }
  return lines;
}

function hashComments(text: string): number[] {
  return text.split("\n").flatMap((l, idx) => (l.trimStart().startsWith("#") ? [idx + 1] : []));
}

function commentLines(file: string, text: string): number[] {
  if (/\.(?:[cm]?[jt]s)$/.test(file)) {
    return scriptComments(file, text);
  }
  if (file.endsWith(".go")) {
    return goComments(text);
  }
  if (/\.ya?ml$/.test(file) || hashFiles.some((h) => file.endsWith(h))) {
    return hashComments(text);
  }
  return [];
}

const findings: Finding[] = [];
for (const file of trackedFiles()) {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const line of commentLines(file, text)) {
    findings.push({ file, line });
  }
}

if (findings.length > 0) {
  for (const f of findings) {
    process.stderr.write(`${f.file}:${String(f.line)}: comment is not allowed\n`);
  }
  process.exit(1);
}
process.stdout.write("comments: none found\n");
