"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRedirectUriCandidates = buildRedirectUriCandidates;
exports.exchangeCodeWithRedirectUriFallback =
  exchangeCodeWithRedirectUriFallback;
function buildRedirectUriCandidates(params) {
  const {
    origin,
    allowedOrigins,
    customDomain,
    firebaseHostingDomain,
    firebaseAppDomain,
  } = params;
  const candidates = [];
  if (origin && allowedOrigins.has(origin)) {
    candidates.push(origin);
  }
  // GIS code flow may use 'postmessage' depending on UX mode.
  candidates.push("postmessage");
  // Fallbacks for known hosting domains.
  candidates.push(customDomain, firebaseHostingDomain, firebaseAppDomain);
  // Ensure uniqueness while preserving order.
  return Array.from(new Set(candidates));
}
async function exchangeCodeWithRedirectUriFallback(params) {
  const { code, redirectUris, exchange, getOauthError } = params;
  let lastError;
  for (const redirectUri of redirectUris) {
    try {
      return await exchange(code, redirectUri);
    } catch (error) {
      lastError = error;
      if (getOauthError(error) === "redirect_uri_mismatch") {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
//# sourceMappingURL=oauth-redirect-uri.js.map
