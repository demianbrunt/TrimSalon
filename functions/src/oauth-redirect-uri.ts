export type OAuthTokenExchange = (
  code: string,
  redirectUri: string,
) => Promise<unknown>;

export type GoogleOauthTokenError =
  | 'invalid_client'
  | 'invalid_grant'
  | 'redirect_uri_mismatch'
  | null;

export function buildRedirectUriCandidates(params: {
  origin: string;
  allowedOrigins: ReadonlySet<string>;
  customDomain: string;
  firebaseHostingDomain: string;
  firebaseAppDomain: string;
}): string[] {
  const {
    origin,
    allowedOrigins,
    customDomain,
    firebaseHostingDomain,
    firebaseAppDomain,
  } = params;

  const candidates: string[] = [];

  if (origin && allowedOrigins.has(origin)) {
    candidates.push(origin);
  }

  // GIS code flow may use 'postmessage' depending on UX mode.
  candidates.push('postmessage');

  // Fallbacks for known hosting domains.
  candidates.push(customDomain, firebaseHostingDomain, firebaseAppDomain);

  // Ensure uniqueness while preserving order.
  return Array.from(new Set(candidates));
}

export async function exchangeCodeWithRedirectUriFallback(params: {
  code: string;
  redirectUris: readonly string[];
  exchange: OAuthTokenExchange;
  getOauthError: (error: unknown) => GoogleOauthTokenError;
}): Promise<unknown> {
  const { code, redirectUris, exchange, getOauthError } = params;

  let lastError: unknown;

  for (const redirectUri of redirectUris) {
    try {
      return await exchange(code, redirectUri);
    } catch (error) {
      lastError = error;
      if (getOauthError(error) === 'redirect_uri_mismatch') {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
