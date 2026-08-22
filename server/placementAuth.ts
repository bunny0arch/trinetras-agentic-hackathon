import { TRPCError } from "@trpc/server";

export type PlacementRole = "candidate" | "recruiter";

type PlacementUser = { openId?: string; placementRole: PlacementRole };

export function isPresentationDemoUser(user: PlacementUser | null | undefined) {
  return Boolean(user?.openId?.startsWith("demo-presentation-"));
}

export function requireLivePlacementMutation(user: PlacementUser | null | undefined) {
  if (isPresentationDemoUser(user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Presentation demo access is read-only." });
  }
}

export function requirePlacementRole(
  user: { placementRole: PlacementRole } | null | undefined,
  required: PlacementRole,
) {
  if (!user || user.placementRole !== required) {
    throw new TRPCError({ code: "FORBIDDEN", message: `This action requires the ${required} placement role.` });
  }
  return user;
}
