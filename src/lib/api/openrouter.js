// src/lib/api/openrouter.js
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL ||
  "nvidia/nemotron-3-ultra-550b-a55b:free";

/**
 * Non-streaming completion. Use for one-shot answers and structured JSON.
 */
export async function chatCompletion(messages, options = {}) {
  if (!API_KEY) throw new Error("VITE_OPENROUTER_API_KEY is not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "AniVault",
    },
    body: JSON.stringify({
      model: options.model || MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
      response_format: options.json ? { type: "json_object" } : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Streaming completion. Calls `onToken(chunk)` as text arrives.
 * Returns the full concatenated string when done.
 */
export async function chatCompletionStream(messages, onToken, options = {}) {
  if (!API_KEY) throw new Error("VITE_OPENROUTER_API_KEY is not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "AniVault",
    },
    body: JSON.stringify({
      model: options.model || MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken?.(delta);
        }
      } catch {
        /* ignore malformed chunks */
      }
    }
  }

  return full;
}
