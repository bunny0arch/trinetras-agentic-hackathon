import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb, getUserByOpenId, listNotificationsForUser, upsertUser } from "./db";
import { supabase } from "./supabase";

describe("Supabase server integration", () => {
  it("authenticates with the REST API root", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/rest/v1/placement_drives?select=id&limit=1`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  }, 20_000);

  it("contains the required seeded placement drives and demo candidate", async () => {
    const [drives, candidate] = await Promise.all([
      supabase.from("placement_drives").select("company").in("company", ["Northstar Labs", "Vertex Systems", "Mosaic Finance"]),
      supabase.from("candidate_profiles").select("student_code").eq("student_code", "AARAV-2026").maybeSingle(),
    ]);
    expect(drives.error).toBeNull();
    expect(drives.data?.map((row) => row.company).sort()).toEqual(["Mosaic Finance", "Northstar Labs", "Vertex Systems"]);
    expect(candidate.error).toBeNull();
    expect(candidate.data?.student_code).toBe("AARAV-2026");
  }, 20_000);

  it("reads notifications through the Supabase repository", async () => {
    const notifications = await listNotificationsForUser(-999_999);
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications).toEqual([]);
  }, 20_000);

  it("synchronizes an identity and reads its first-session notification", async () => {
    const openId = `vitest-placement-${Date.now()}`;
    let manusUserId: number | undefined;
    let placementUserId: string | undefined;
    try {
      await upsertUser({ openId, name: "Vitest Placement User", email: "vitest@example.edu", loginMethod: "test", placementRole: "candidate" });
      const syncedUser = await getUserByOpenId(openId);
      expect(syncedUser?.placementRole).toBe("candidate");
      manusUserId = syncedUser?.id;
      expect(manusUserId).toBeTypeOf("number");
      const notifications = await listNotificationsForUser(manusUserId!);
      expect(notifications.some((item) => item.title === "Candidate workspace ready")).toBe(true);
      const identity = await supabase.from("placement_users").select("id").eq("open_id", openId).single();
      expect(identity.error).toBeNull();
      placementUserId = identity.data?.id;
    } finally {
      if (placementUserId) {
        await supabase.from("notifications").delete().eq("placement_user_id", placementUserId);
        await supabase.from("placement_users").delete().eq("id", placementUserId);
      }
      const authDb = await getDb();
      if (authDb) await authDb.delete(users).where(eq(users.openId, openId));
    }
  }, 30_000);
});
