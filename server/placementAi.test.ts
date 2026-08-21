import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const candidateContext = {
  user: {
    id: 1,
    openId: "placement-ai-test",
    name: "Placement AI Test",
    email: "placement-ai-test@example.edu",
    loginMethod: "test",
    role: "user",
    placementRole: "candidate",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} },
  res: { clearCookie: () => undefined },
} as unknown as TrpcContext;

describe("placement AI", () => {
  it("returns a structured eligibility assessment grounded in Supabase drive and candidate data", async () => {
    const caller = appRouter.createCaller(candidateContext);
    const assessment = await caller.ai.checkEligibility({ opportunityTitle: "Frontend Engineer" });
    expect(["Eligible", "Review needed", "Not eligible"]).toContain(assessment.status);
    expect(assessment.criteria.length).toBeGreaterThan(0);
    expect(assessment.explanation.length).toBeGreaterThan(0);
  }, 45_000);
});
