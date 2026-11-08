import test from 'node:test';
import assert from 'node:assert/strict';
import { toolErrorResult, classifyError } from '../.test-dist/utils/mcp-errors.js';
import { GoogleNotConnectedError, GoogleOAuthConfigurationError } from '../.test-dist/bridge/google-connection.js';
import { GoogleApiError, GoogleWriteUncertainError } from '../.test-dist/bridge/google-api.js';

test('Google connection errors have actionable bilingual codes without secrets', () => {
  const cases = [
    [new GoogleNotConnectedError(), 'GOOGLE_NOT_CONNECTED'],
    [new GoogleOAuthConfigurationError(), 'GOOGLE_NOT_CONFIGURED'],
    [new GoogleApiError(403), 'GOOGLE_AUTH'],
    [new GoogleApiError(429), 'GOOGLE_API'],
    [new GoogleWriteUncertainError(), 'GOOGLE_WRITE_UNCERTAIN'],
  ];
  for (const [error, code] of cases) {
    assert.equal(classifyError(error).code, code);
    const response = toolErrorResult(error);
    assert.match(response.content[0].text, new RegExp(code));
    assert.match(response.content[0].text, /日本語:/);
    assert.match(response.content[0].text, /English:/);
  }
});

test('Google provider exception text cannot leak token-like strings', () => {
  const error = new GoogleApiError(401);
  error.message = 'private access token: secret-do-not-print';
  const result = toolErrorResult(error);
  assert.doesNotMatch(result.content[0].text, /secret-do-not-print/);
});
