import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { isPresentationDemoUser, requireLivePlacementMutation, requirePlacementRole } from "./placementAuth";

describe("requirePlacementRole", () => {
  it("returns an authenticated user with the required placement role", () => {
    const user = { placementRole: "recruiter" as const, id: 7 };
    expect(requirePlacementRole(user, "recruiter")).toBe(user);
  });

  it("rejects a candidate from recruiter-only data", () => {
    expect(() => requirePlacementRole({ placementRole: "candidate" }, "recruiter")).toThrow(TRPCError);
  });

  it("rejects an unauthenticated placement request", () => {
    expect(() => requirePlacementRole(null, "candidate")).toThrow(TRPCError);
  });

  it("identifies presentation demo users without matching ordinary users", () => {
    expect(isPresentationDemoUser({ openId: "demo-presentation-candidate", placementRole: "candidate" })).toBe(true);
    expect(isPresentationDemoUser({ openId: "oauth-user-123", placementRole: "candidate" })).toBe(false);
  });

  it("blocks state-changing placement operations for presentation demos", () => {
    expect(() => requireLivePlacementMutation({ openId: "demo-presentation-recruiter", placementRole: "recruiter" })).toThrow(TRPCError);
    expect(() => requireLivePlacementMutation({ openId: "oauth-user-123", placementRole: "recruiter" })).not.toThrow();
  });
});
