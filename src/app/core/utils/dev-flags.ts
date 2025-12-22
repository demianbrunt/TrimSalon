import { isDevMode } from '@angular/core';

const MOCK_GOOGLE_STORAGE_KEY = 'trimSalon_mockGoogle';

type MockGoogleQueryParam = '1' | '0' | 'true' | 'false';

function getMockGoogleQueryParam(): MockGoogleQueryParam | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('mockGoogle');
    if (
      value === '1' ||
      value === '0' ||
      value === 'true' ||
      value === 'false'
    ) {
      return value;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Dev-only feature flag to bypass Google Auth/Calendar integration.
 *
 * Enable:
 * - Add `?mockGoogle=1` (or `true`) to the URL (persists to localStorage), OR
 * - Set localStorage key `trimSalon_mockGoogle=1`
 *
 * Disable:
 * - Add `?mockGoogle=0` (or `false`) to the URL (clears localStorage)
 */
export function isMockGoogleEnabled(): boolean {
  // Hard safety gate: never allow in production builds.
  if (!isDevMode()) return false;
  if (typeof window === 'undefined') return false;

  const query = getMockGoogleQueryParam();
  if (query === '1' || query === 'true') {
    try {
      localStorage.setItem(MOCK_GOOGLE_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    return true;
  }

  if (query === '0' || query === 'false') {
    try {
      localStorage.removeItem(MOCK_GOOGLE_STORAGE_KEY);
    } catch {
      // ignore
    }
    return false;
  }

  try {
    return localStorage.getItem(MOCK_GOOGLE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
