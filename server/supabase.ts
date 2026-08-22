import { createClient } from "@supabase/supabase-js";

type SupabaseClient = ReturnType<typeof createClient>;
let client: SupabaseClient | null = null;

function getSupabaseClient() {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server credentials are required for placement data access.");
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

/**
 * Resolve Supabase only when a placement operation actually needs it. This
 * keeps public authentication/health endpoints independent from placement
 * database configuration while preserving a precise server-side error for
 * missing placement credentials.
 */
export const supabase: { from: (table: string) => any } = {
  from: (table: string) => getSupabaseClient().from(table),
};
