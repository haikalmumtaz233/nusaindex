export interface Span {
  readonly top: number;
  readonly bottom: number;
}

export interface View {
  readonly scrollTop: number;
  readonly height: number;
}

export function revealScrollTop(link: Span, view: View): number | null {
  if (link.top >= view.scrollTop && link.bottom <= view.scrollTop + view.height) {
    return null;
  }
  const middle = (link.top + link.bottom) / 2;
  return Math.max(0, Math.round(middle - view.height / 2));
}
