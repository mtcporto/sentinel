import test from 'node:test';
import assert from 'node:assert/strict';
import { readSystemLog, validateLogLimit } from '../src/lib/system-logs.ts';

test('rejects shell metacharacters, arbitrary paths and traversal before executing', async () => {
  for (const file of ['/var/log/syslog;id', '/var/log/$(id)', '/etc/passwd', '../syslog', '/var/log/syslog\nwhoami', '--help']) {
    await assert.rejects(readSystemLog(file, 20), /Invalid log file/);
  }
});

test('rejects invalid and unbounded limits, including untyped server action arguments', async () => {
  for (const limit of ['20;id', '20', 0, -1, 1001, 1.5, NaN, Infinity, null, undefined]) {
    assert.throws(() => validateLogLimit(limit), /Log limit must/);
    await assert.rejects(readSystemLog('/var/log/syslog', limit), /Log limit must/);
  }
});

test('accepts supported numeric limits', () => {
  for (const limit of [1, 20, 50, 1000]) assert.doesNotThrow(() => validateLogLimit(limit));
});
