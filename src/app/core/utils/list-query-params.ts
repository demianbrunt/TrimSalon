import { ParamMap, Params } from '@angular/router';

export type QueryParamPrimitive = string | number | boolean | null | undefined;

export function readStringParam(
  paramMap: ParamMap,
  key: string,
  fallback = '',
): string {
  const value = paramMap.get(key);
  return value ?? fallback;
}

export function readNumberParam(
  paramMap: ParamMap,
  key: string,
  fallback: number,
): number {
  const raw = paramMap.get(key);
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readBooleanParam(
  paramMap: ParamMap,
  key: string,
  fallback = false,
): boolean {
  const raw = paramMap.get(key);
  if (raw === null) return fallback;

  // Accept common truthy/falsey variants.
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 't', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'f', 'no', 'n', 'off'].includes(normalized)) return false;

  return fallback;
}

export function sanitizePage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export function toQueryParams(
  input: Record<string, QueryParamPrimitive>,
): Params {
  const out: Params = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      out[key] = trimmed.length > 0 ? trimmed : null;
      continue;
    }

    if (typeof value === 'number') {
      out[key] = Number.isFinite(value) ? String(value) : null;
      continue;
    }

    if (typeof value === 'boolean') {
      out[key] = value ? '1' : null;
      continue;
    }

    out[key] = null;
  }

  return out;
}
