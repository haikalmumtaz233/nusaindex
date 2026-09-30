export interface Failure<E extends string> {
  readonly ok: false;
  readonly error: { readonly code: E };
}

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export type Result<T, E extends string = string> = Success<T> | Failure<E>;

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E extends string>(code: E): Failure<E> {
  return { ok: false, error: { code } };
}
