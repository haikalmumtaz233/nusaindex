import { describe, expect, it } from "vitest";
import { scriptElement, styleElement } from "../html-tags.ts";

function captures(pattern: RegExp, html: string): string[][] {
  return [...html.matchAll(pattern)].map((match) => match.slice(1));
}

describe("scriptElement", () => {
  it("captures attributes and body", () => {
    expect(captures(scriptElement, '<script type="module">run()</script>')).toEqual([
      [' type="module"', "run()"],
    ]);
  });

  it("matches end tags the browser accepts", () => {
    expect(captures(scriptElement, "<script>a</script >")).toEqual([["", "a"]]);
    expect(captures(scriptElement, '<script>b</script foo="bar">')).toEqual([["", "b"]]);
    expect(captures(scriptElement, "<SCRIPT>c</Script>")).toEqual([["", "c"]]);
  });

  it("matches every element in order", () => {
    expect(captures(scriptElement, "<script>a</script><p></p><script src=x></script>")).toEqual([
      ["", "a"],
      [" src=x", ""],
    ]);
  });

  it("ignores other tag names", () => {
    expect(captures(scriptElement, "<scripts>a</scripts>")).toEqual([]);
  });
});

describe("styleElement", () => {
  it("captures attributes and body", () => {
    expect(captures(styleElement, '<style media="print">p{}</style>')).toEqual([
      [' media="print"', "p{}"],
    ]);
  });

  it("matches end tags the browser accepts", () => {
    expect(captures(styleElement, "<STYLE>a</style >")).toEqual([["", "a"]]);
    expect(captures(styleElement, "<style>b</style x>")).toEqual([["", "b"]]);
  });

  it("ignores other tag names", () => {
    expect(captures(styleElement, "<styles>a</styles>")).toEqual([]);
  });
});
