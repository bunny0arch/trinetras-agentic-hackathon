type OpenRouterMessage = { role: "system" | "user" | "assistant"; content: string };
type OpenRouterRequest = {
  messages: OpenRouterMessage[];
  response_format?: Record<string, unknown>;
  temperature?: number;
};

const model = "google/gemini-3.7-flash";

export async function invokePlacementModel({ messages, response_format, temperature = 0.2 }: OpenRouterRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter server credential is unavailable.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://campus-placement-ops.manus.space",
      "X-Title": "Campus Placement Operations",
    },
    body: JSON.stringify({ model, messages, response_format, temperature, max_tokens: 1200 }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter placement request failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter placement request returned no textual answer.");
  return { choices: [{ message: { content } }] };
}
