"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("node:assert/strict");
const test = require("node:test");
const oauth_redirect_uri_1 = require("./oauth-redirect-uri");
test("buildRedirectUriCandidates: includes origin first when allowed", () => {
  const allowed = new Set([
    "https://trim.demianbrunt.nl",
    "https://trimsalon-9b823.web.app",
  ]);
  const result = (0, oauth_redirect_uri_1.buildRedirectUriCandidates)({
    origin: "https://trim.demianbrunt.nl",
    allowedOrigins: allowed,
    customDomain: "https://trim.demianbrunt.nl",
    firebaseHostingDomain: "https://trimsalon-9b823.web.app",
    firebaseAppDomain: "https://trimsalon-9b823.firebaseapp.com",
  });
  assert.equal(result[0], "https://trim.demianbrunt.nl");
  assert.ok(result.includes("postmessage"));
});
test("buildRedirectUriCandidates: omits origin when not allowed", () => {
  const result = (0, oauth_redirect_uri_1.buildRedirectUriCandidates)({
    origin: "https://evil.example",
    allowedOrigins: new Set(["https://trim.demianbrunt.nl"]),
    customDomain: "https://trim.demianbrunt.nl",
    firebaseHostingDomain: "https://trimsalon-9b823.web.app",
    firebaseAppDomain: "https://trimsalon-9b823.firebaseapp.com",
  });
  assert.notEqual(result[0], "https://evil.example");
  assert.equal(result[0], "postmessage");
});
test("exchangeCodeWithRedirectUriFallback: retries on redirect_uri_mismatch", async () => {
  const attempts = [];
  const exchange = async (_code, redirectUri) => {
    attempts.push(redirectUri);
    if (redirectUri === "postmessage") {
      const err = new Error("redirect_uri_mismatch");
      throw err;
    }
    return { ok: true, used: redirectUri };
  };
  const result = await (0,
  oauth_redirect_uri_1.exchangeCodeWithRedirectUriFallback)({
    code: "abc",
    redirectUris: ["postmessage", "https://trim.demianbrunt.nl"],
    exchange,
    getOauthError: (error) =>
      error?.message === "redirect_uri_mismatch"
        ? "redirect_uri_mismatch"
        : null,
  });
  assert.deepEqual(attempts, ["postmessage", "https://trim.demianbrunt.nl"]);
  assert.deepEqual(result, { ok: true, used: "https://trim.demianbrunt.nl" });
});
test("exchangeCodeWithRedirectUriFallback: does not retry non-mismatch errors", async () => {
  const exchange = async () => {
    throw new Error("invalid_grant");
  };
  await assert.rejects(
    () =>
      (0, oauth_redirect_uri_1.exchangeCodeWithRedirectUriFallback)({
        code: "abc",
        redirectUris: ["postmessage", "https://trim.demianbrunt.nl"],
        exchange,
        getOauthError: (error) =>
          error?.message === "redirect_uri_mismatch"
            ? "redirect_uri_mismatch"
            : null,
      }),
    /invalid_grant/,
  );
});
//# sourceMappingURL=oauth-redirect-uri.test.js.map
