import test from 'node:test';
import assert from 'node:assert/strict';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { createCheckConnectionTool } from '../.test-dist/tools/diagnostic-tools.js';
import { registerTools, toolResult } from '../.test-dist/tools/index.js';
import { isToolAllowed } from '../.test-dist/utils/tool-access.js';
import { RELEASES_URL, SERVER_VERSION } from '../.test-dist/config/config.js';

const validator = new AjvJsonSchemaValidator();

// Fictional credentials: they must never appear in the tool output.
const FAKE_EMAIL = 'fake-user@example.com';
const FAKE_PASSWORD = 'fake-password-123';

const calendarsFake = (calendars = [{ id: 1 }, { id: 2 }]) => ({
  signIn: async () => {},
  getCalendars: async () => calendars,
});

const failingSignIn = {
  signIn: async () => {
    throw new Error(`Invalid email or password for ${FAKE_EMAIL} / ${FAKE_PASSWORD}`);
  },
  getCalendars: async () => {
    throw new Error('getCalendars must not be called after a failed sign-in');
  },
};

/** A fetch stub that answers with the given payload and counts its calls. */
const fetchReturning = (payload, { ok = true } = {}) => {
  const calls = [];
  const fetchImpl = async (...args) => {
    calls.push(args);
    return { ok, json: async () => payload };
  };
  return { calls, fetchImpl };
};

const fetchThrowing = () => {
  const calls = [];
  const fetchImpl = async (...args) => {
    calls.push(args);
    throw new Error('network down');
  };
  return { calls, fetchImpl };
};

const runTool = async (apiClient, fetchImpl) => {
  const tool = createCheckConnectionTool(apiClient, { fetchImpl });
  const result = toolResult(tool, await tool.handler({}));
  assert.notEqual(result.isError, true, result.content[0].text);
  const check = validator.getValidator(tool.outputSchema)(result.structuredContent);
  assert.ok(check.valid, check.errorMessage);
  return { tool, result, output: result.structuredContent, text: result.content[0].text };
};

const withEnv = async (values, fn) => {
  const saved = {};
  for (const key of Object.keys(values)) {
    saved[key] = process.env[key];
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  try {
    return await fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
};

test('sign-in succeeds: reports the calendar count and an up-to-date version', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined, TIMETREE_READ_ONLY: undefined }, async () => {
    const { fetchImpl, calls } = fetchReturning({ version: SERVER_VERSION });
    const { output } = await runTool(calendarsFake(), fetchImpl);

    assert.equal(output.sign_in, 'ok');
    assert.equal(output.sign_in_message, undefined);
    assert.equal(output.calendars_count, 2);
    assert.equal(output.server_version, SERVER_VERSION);
    assert.equal(output.read_only_mode, false);
    assert.equal(output.latest_version, SERVER_VERSION);
    assert.equal(output.update_available, false);
    assert.equal(output.update_check, 'ok');
    assert.equal(calls.length, 1);
  });
});

test('sign-in failure: fixed messages, no calendar read, no credentials in output', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: 'false', TIMETREE_READ_ONLY: undefined }, async () => {
    const { output, text } = await runTool(failingSignIn, fetchReturning({}).fetchImpl);

    assert.equal(output.sign_in, 'failed');
    assert.match(output.sign_in_message, /サインイン/);
    assert.match(output.sign_in_message, /sign in/);
    assert.equal(output.calendars_count, undefined);
    assert.match(output.next_step, /メールアドレス/);
    assert.match(output.next_step, /email and password/);
    assert.equal(text.includes(FAKE_EMAIL), false);
    assert.equal(text.includes(FAKE_PASSWORD), false);
    assert.equal(text.includes('Invalid email or password'), false);
  });
});

test('calendar read failure after sign-in does not change sign_in', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: 'false' }, async () => {
    const apiClient = {
      signIn: async () => {},
      getCalendars: async () => {
        throw new Error('upstream timeout');
      },
    };
    const { output } = await runTool(apiClient, fetchReturning({}).fetchImpl);

    assert.equal(output.sign_in, 'ok');
    assert.equal(output.calendars_count, undefined);
  });
});

test('an available update names the release download for the extension install', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined, TIMETREE_INSTALL_SOURCE: 'mcpb' }, async () => {
    const { output } = await runTool(calendarsFake(), fetchReturning({ version: '99.0.0' }).fetchImpl);

    assert.equal(output.latest_version, '99.0.0');
    assert.equal(output.update_available, true);
    assert.equal(output.update_check, 'ok');
    assert.ok(output.next_step.includes(RELEASES_URL));
  });
});

test('an available update points git-clone installs at git pull', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined, TIMETREE_INSTALL_SOURCE: undefined }, async () => {
    const { output } = await runTool(calendarsFake(), fetchReturning({ version: '99.0.0' }).fetchImpl);

    assert.equal(output.update_available, true);
    assert.ok(output.next_step.includes('git pull origin main'));
  });
});

test('TIMETREE_UPDATE_CHECK=false makes no request and reports disabled', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: 'false' }, async () => {
    const { calls, fetchImpl } = fetchReturning({ version: '99.0.0' });
    const { output } = await runTool(calendarsFake(), fetchImpl);

    assert.equal(calls.length, 0);
    assert.equal(output.update_check, 'disabled');
    assert.equal(output.latest_version, null);
    assert.equal(output.update_available, false);
  });
});

test('a failed update check still returns success', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined }, async () => {
    const { output } = await runTool(calendarsFake(), fetchThrowing().fetchImpl);

    assert.equal(output.sign_in, 'ok');
    assert.equal(output.calendars_count, 2);
    assert.equal(output.update_check, 'failed');
    assert.equal(output.latest_version, null);
    assert.equal(output.update_available, false);
  });
});

test('a malformed update response counts as a failed check', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined }, async () => {
    const { output } = await runTool(calendarsFake(), fetchReturning({ version: 'not-a-version' }).fetchImpl);

    assert.equal(output.update_check, 'failed');
    assert.equal(output.latest_version, null);
  });
});

test('the update check sends no credentials or cookies to GitHub', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: undefined }, async () => {
    const { calls, fetchImpl } = fetchReturning({ version: SERVER_VERSION });
    await runTool(calendarsFake(), fetchImpl);

    assert.equal(calls.length, 1);
    const init = calls[0][1];
    assert.deepEqual(Object.keys(init), ['signal']);
  });
});

test('check_connection is listed and callable in read-only mode', async () => {
  await withEnv({ TIMETREE_UPDATE_CHECK: 'false', TIMETREE_READ_ONLY: 'true' }, async () => {
    const tool = registerTools(calendarsFake()).find((candidate) => candidate.name === 'check_connection');
    assert.ok(tool, 'check_connection is registered');
    assert.equal(isToolAllowed('check_connection', true), true);
    assert.equal(tool.annotations.readOnlyHint, true);

    const result = toolResult(tool, await tool.handler({}));
    assert.notEqual(result.isError, true);
    assert.equal(result.structuredContent.read_only_mode, true);
    assert.match(result.structuredContent.next_step, /読み取り専用/);
  });
});
