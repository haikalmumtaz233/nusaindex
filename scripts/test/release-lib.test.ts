import { describe, expect, it } from "vitest";
import { distTag, releaseNotes, tagVersion } from "../release-lib.ts";

const changelog = [
  "# Changelog",
  "",
  "## [Unreleased]",
  "",
  "## [1.0.0] - 2026-10-10",
  "",
  "### Added",
  "",
  "- First public release.",
  "",
  "## [1.0.0-rc.1] - 2026-10-05",
  "",
  "Release candidate.",
  "",
  "## [0.5.0] - 2026-10-01",
  "",
  "- Older notes.",
  "",
].join("\n");

describe("release notes from the changelog", () => {
  it("returns the body of the matching version only", () => {
    expect(releaseNotes(changelog, "1.0.0")).toBe("### Added\n\n- First public release.");
  });

  it("does not mix a pre-release with its final version", () => {
    expect(releaseNotes(changelog, "1.0.0-rc.1")).toBe("Release candidate.");
  });

  it("reads the last section up to the end of the file", () => {
    expect(releaseNotes(changelog, "0.5.0")).toBe("- Older notes.");
  });

  it("returns null for a version without a section or with an empty one", () => {
    expect(releaseNotes(changelog, "2.0.0")).toBeNull();
    expect(releaseNotes(changelog, "Unreleased")).toBeNull();
  });
});

describe("tag and npm dist-tag", () => {
  it("strips the v prefix from a release tag", () => {
    expect(tagVersion("v1.0.0")).toBe("1.0.0");
    expect(tagVersion("v1.2.3-rc.1")).toBe("1.2.3-rc.1");
  });

  it("rejects tags that are not semantic versions", () => {
    expect(tagVersion("1.0.0")).toBeNull();
    expect(tagVersion("v1.0")).toBeNull();
    expect(tagVersion("v1.0.0;rm")).toBeNull();
  });

  it("publishes pre-releases under next and the rest under latest", () => {
    expect(distTag("1.0.0")).toBe("latest");
    expect(distTag("1.1.0-rc.2")).toBe("next");
  });
});
