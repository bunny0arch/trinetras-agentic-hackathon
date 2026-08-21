import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "../shared/const";
import { placementDestination } from "../client/src/lib/placementRouting";
import { getDb, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { supabase } from "./supabase";

async function cleanupIdentity(openId: string) {
  const identity = await supabase.from("placement_users").select("id").eq("open_id", openId).maybeSingle();
  if (identity.data?.id) {
    await supabase.from("notifications").delete().eq("placement_user_id", identity.data.id);
    await supabase.from("placement_users").delete().eq("id", identity.data.id);
  }
  const authDb = await getDb();
  if (authDb) await authDb.delete(users).where(eq(users.openId, openId));
}

describe("authenticated placement HTTP flow", () => {
  it.each(["candidate", "recruiter"] as const)("returns the %s placement role from the live auth endpoint", async (placementRole) => {
    const openId = `http-placement-${placementRole}-${Date.now()}`;
    try {
      await upsertUser({ openId, name: "HTTP Placement Test", email: `${placementRole}@example.edu`, loginMethod: "test", placementRole });
      const token = await sdk.createSessionToken(openId, { name: "HTTP Placement Test" });
      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.me?input=%7B%22json%22%3Anull%7D", {
        headers: { Cookie: `${COOKIE_NAME}=${token}` },
      });
      expect(response.ok).toBe(true);
      const payload = await response.json() as { result?: { data?: { json?: { placementRole?: string } } } };
      const resolvedRole = payload.result?.data?.json?.placementRole;
      expect(resolvedRole).toBe(placementRole);
      expect(placementDestination(resolvedRole as "candidate" | "recruiter")).toBe(placementRole === "candidate" ? "/candidate" : "/recruiter");
    } finally {
      await cleanupIdentity(openId);
    }
  }, 30_000);
});
