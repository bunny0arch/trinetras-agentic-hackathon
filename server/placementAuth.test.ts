import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { requirePlacementRole } from "./placementAuth";

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
});
