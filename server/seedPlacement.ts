import { ensurePlacementDemoData } from "./db";

async function seedPlacement() {
  await ensurePlacementDemoData();
  console.log("Placement demo data is ready.");
}

seedPlacement().catch((error) => {
  console.error("Failed to seed placement demo data", error);
  process.exitCode = 1;
});
