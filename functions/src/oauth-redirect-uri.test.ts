import assert = require('node:assert/strict');
import test = require('node:test');
import {
  buildRedirectUriCandidates,
  exchangeCodeWithRedirectUriFallback,
} from './oauth-redirect-uri';

test('buildRedirectUriCandidates: includes origin first when allowed', () => {
  const allowed = new Set<string>([
    'https://trim.demianbrunt.nl',
    'https://trimsalon-9b823.web.app',
  ]);

  const result = buildRedirectUriCandidates({
    origin: 'https://trim.demianbrunt.nl',
    allowedOrigins: allowed,
    customDomain: 'https://trim.demianbrunt.nl',
    firebaseHostingDomain: 'https://trimsalon-9b823.web.app',
    firebaseAppDomain: 'https://trimsalon-9b823.firebaseapp.com',
  });

  assert.equal(result[0], 'https://trim.demianbrunt.nl');
  assert.ok(result.includes('postmessage'));
});

test('buildRedirectUriCandidates: omits origin when not allowed', () => {
  const result = buildRedirectUriCandidates({
    origin: 'https://evil.example',
    allowedOrigins: new Set<string>(['https://trim.demianbrunt.nl']),
    customDomain: 'https://trim.demianbrunt.nl',
    firebaseHostingDomain: 'https://trimsalon-9b823.web.app',
    firebaseAppDomain: 'https://trimsalon-9b823.firebaseapp.com',
  });

  assert.notEqual(result[0], 'https://evil.example');
  assert.equal(result[0], 'postmessage');
});

test('exchangeCodeWithRedirectUriFallback: retries on redirect_uri_mismatch', async () => {
  const attempts: string[] = [];

  const exchange = async (_code: string, redirectUri: string) => {
    attempts.push(redirectUri);
    if (redirectUri === 'postmessage') {
      const err = new Error('redirect_uri_mismatch');
      throw err;
    }
    return { ok: true, used: redirectUri };
  };

  const result = await exchangeCodeWithRedirectUriFallback({
    code: 'abc',
    redirectUris: ['postmessage', 'https://trim.demianbrunt.nl'],
    exchange,
    getOauthError: (error) =>
      (error as { message?: string })?.message === 'redirect_uri_mismatch'
        ? 'redirect_uri_mismatch'
        : null,
  });

  assert.deepEqual(attempts, ['postmessage', 'https://trim.demianbrunt.nl']);
  assert.deepEqual(result, { ok: true, used: 'https://trim.demianbrunt.nl' });
});

test('exchangeCodeWithRedirectUriFallback: does not retry non-mismatch errors', async () => {
  const exchange = async () => {
    throw new Error('invalid_grant');
  };

  await assert.rejects(
    () =>
      exchangeCodeWithRedirectUriFallback({
        code: 'abc',
        redirectUris: ['postmessage', 'https://trim.demianbrunt.nl'],
        exchange,
        getOauthError: (error) =>
          (error as { message?: string })?.message === 'redirect_uri_mismatch'
            ? 'redirect_uri_mismatch'
            : null,
      }),
    /invalid_grant/,
  );
});
