import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { placementDestination } from "../client/src/lib/placementRouting";

function contextFor(placementRole: "candidate" | "recruiter") {
  return {
    user: {
      id: placementRole === "candidate" ? 41 : 42,
      openId: `test-${placementRole}`,
      name: `${placementRole} test`,
      email: `${placementRole}@example.edu`,
      loginMethod: "test",
      role: "user",
      placementRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as unknown as TrpcContext;
}

describe("role-aware placement access", () => {
  it("routes each authenticated placement role to its allowed portal", () => {
    expect(placementDestination("candidate")).toBe("/candidate");
    expect(placementDestination("recruiter")).toBe("/recruiter");
  });

  it("allows a recruiter dashboard query and blocks candidate access", async () => {
    const recruiter = appRouter.createCaller(contextFor("recruiter"));
    const dashboard = await recruiter.placement.recruiter.dashboard();
    expect(dashboard.stats.activeDrives).toBe(3);

    const candidate = appRouter.createCaller(contextFor("candidate"));
    await expect(candidate.placement.recruiter.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a candidate dashboard query and blocks recruiter access", async () => {
    const candidate = appRouter.createCaller(contextFor("candidate"));
    const dashboard = await candidate.placement.candidate.dashboard();
    expect(dashboard.drives).toHaveLength(3);

    const recruiter = appRouter.createCaller(contextFor("recruiter"));
    await expect(recruiter.placement.candidate.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
