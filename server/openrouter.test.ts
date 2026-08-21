import { describe, expect, it } from "vitest";
import { invokePlacementModel } from "./openrouter";

describe("OpenRouter server integration", () => {
  it("authenticates against the live model catalog", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    expect(response.ok).toBe(true);
    const body = await response.json() as { data?: Array<{ id?: string }> };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data?.length).toBeGreaterThan(0);
  }, 20_000);

  it("returns a response from the selected fast placement model", async () => {
    const response = await invokePlacementModel({
      messages: [{ role: "user", content: "Reply with exactly: ready" }],
      temperature: 0,
    });
    expect(response.choices[0]?.message.content.toLowerCase()).toContain("ready");
  }, 40_000);
});
