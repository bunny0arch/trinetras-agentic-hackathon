import { TRPCError } from "@trpc/server";

export type PlacementRole = "candidate" | "recruiter";

export function requirePlacementRole(
  user: { placementRole: PlacementRole } | null | undefined,
  required: PlacementRole,
) {
  if (!user || user.placementRole !== required) {
    throw new TRPCError({ code: "FORBIDDEN", message: `This action requires the ${required} placement role.` });
  }
  return user;
}
