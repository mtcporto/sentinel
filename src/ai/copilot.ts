// Used only by server actions/routes. This service does not require an API key.
const ENDPOINT = 'https://copilot-mtcporto.vercel.app/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function completeCopilot(system: string, user: string, options: { json?: boolean; temperature?: number } = {}): Promise<string> {
  if (typeof window !== 'undefined') throw new Error('AI requests require a server runtime');
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      max_tokens: 2048,
      temperature: options.temperature ?? 0.4,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(60_000),
    redirect: 'error',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`AI request failed (HTTP ${response.status})`);
  const payload = await response.json();
  if (payload.model && payload.model !== MODEL && !payload.model.startsWith(`${MODEL}-`)) throw new Error('AI returned an unexpected model');
  const choice = payload.choices?.[0];
  if (choice?.finish_reason && choice.finish_reason !== 'stop') throw new Error('AI response was incomplete or blocked');
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI returned no text');
  return content.trim();
}

export function parseCopilotJson(content: string): unknown {
  // This endpoint may return fenced JSON even when json_object was requested.
  // Accept a single complete JSON block; do not extract arbitrary fragments.
  const text = content.trim();
  const block = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(text);
  return JSON.parse(block ? block[1].trim() : text);
}

export async function completeCopilotJson(system: string, user: string): Promise<unknown> {
  return parseCopilotJson(await completeCopilot(`${system}\nReturn only a valid JSON object, without Markdown.`, user, { json: true }));
}
