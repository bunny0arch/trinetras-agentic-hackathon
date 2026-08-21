export type PlacementRole = "candidate" | "recruiter";

export function placementDestination(role: PlacementRole | undefined) {
  return role === "recruiter" ? "/recruiter" : "/candidate";
}
