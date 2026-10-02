const semverTag = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)$/;
const sectionHeading = /^## \[([^\]]+)\]/;

export function tagVersion(tag: string): string | null {
  return semverTag.exec(tag)?.[1] ?? null;
}

export function distTag(version: string): "latest" | "next" {
  return version.includes("-") ? "next" : "latest";
}

export function releaseNotes(changelog: string, version: string): string | null {
  const body: string[] = [];
  let inside = false;
  for (const line of changelog.split("\n")) {
    const heading = sectionHeading.exec(line);
    if (heading) {
      if (inside) {
        break;
      }
      inside = heading[1] === version;
      continue;
    }
    if (inside) {
      body.push(line);
    }
  }
  const notes = body.join("\n").trim();
  return notes === "" ? null : notes;
}
