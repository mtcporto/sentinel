import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { completeCopilot, completeCopilotJson, parseCopilotJson } from '../src/ai/copilot.ts';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('uses selected endpoint/model, no auth, non-streaming JSON', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://copilot-mtcporto.vercel.app/v1/chat/completions');
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gpt-4o');
    assert.equal(body.stream, false);
    assert.equal(body.response_format.type, 'json_object');
    assert.equal(body.messages[1].content, 'synthetic test input');
    return Response.json({ model: 'gpt-4o-2024-11-20', choices: [{ finish_reason: 'stop', message: { content: '```json\n{"ok":true}\n```' } }] });
  };
  assert.deepEqual(await completeCopilotJson('Return JSON', 'synthetic test input'), { ok: true });
});
test('parses plain or fenced JSON without accepting explanatory prose', () => {
  assert.deepEqual(parseCopilotJson(' {"ok":true} '), { ok: true });
  assert.deepEqual(parseCopilotJson('```\n{"ok":true}\n```'), { ok: true });
  assert.throws(() => parseCopilotJson('Explanation {"ok":true}'), SyntaxError);
  assert.throws(() => parseCopilotJson('```json\n{"ok":true}\n``` trailing'), SyntaxError);
});
test('rejects errors, empty content, truncated output and another model', async () => {
  globalThis.fetch = async () => new Response('private upstream detail', { status: 502 });
  await assert.rejects(completeCopilot('s', 'u'), { message: 'AI request failed (HTTP 502)' });
  globalThis.fetch = async () => Response.json({ choices: [] });
  await assert.rejects(completeCopilot('s', 'u'), /no text/);
  globalThis.fetch = async () => Response.json({ choices: [{ finish_reason: 'length', message: { content: 'partial' } }] });
  await assert.rejects(completeCopilot('s', 'u'), /incomplete/);
  globalThis.fetch = async () => Response.json({ model: 'gpt-4.1', choices: [{ message: { content: 'other model' } }] });
  await assert.rejects(completeCopilot('s', 'u'), /unexpected model/);
});
