const END_SLACK = 2;

export function atPageEnd(scrollY: number, viewport: number, height: number): boolean {
  return scrollY + viewport >= height - END_SLACK;
}

export function lastVisible(tops: readonly number[], viewport: number): number {
  let found = -1;
  tops.forEach((top, i) => {
    if (top < viewport) {
      found = i;
    }
  });
  return found;
}
