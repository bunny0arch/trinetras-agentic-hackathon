import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0001_placement_portal.sql", import.meta.url), "utf8");
await writeFile(
  "/tmp/campus-placement-supabase-migration.json",
  JSON.stringify({
    project_id: "czjkckicpfzsogdgcakd",
    name: "placement_portal_schema",
    query,
  }),
);
