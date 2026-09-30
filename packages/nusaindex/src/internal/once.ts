export function once<T>(build: () => T): () => T {
  let value: { readonly v: T } | undefined;
  return () => {
    value ??= { v: build() };
    return value.v;
  };
}
