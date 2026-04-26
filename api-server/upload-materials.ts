import { getFirestoreDb } from "./src/lib/firebase";
import * as fs from "fs";
import * as path from "path";

async function run() {
  const db = getFirestoreDb();
  if (!db) {
    console.error("Firestore not initialized.");
    process.exit(1);
  }

  const materialsPath = path.resolve(process.cwd(), "../materials.json");
  if (!fs.existsSync(materialsPath)) {
    console.error("materials.json not found at", materialsPath);
    process.exit(1);
  }

  const matStr = fs.readFileSync(materialsPath, "utf-8");
  const data = JSON.parse(matStr);

  const materialsArray = Array.isArray(data) ? data : data.materials;
  if (!materialsArray || !Array.isArray(materialsArray)) {
    console.error("materials is not an array");
    process.exit(1);
  }

  let count = 0;
  for (const item of materialsArray) {
    // Generate an ID if needed or use existing
    const id = item.id || item.uniqueId || require('crypto').randomUUID();
    item.id = id;
    
    // Default approvalStatus if not set so they show up
    if (!item.approvalStatus) {
      item.approvalStatus = "approved";
    }

    try {
      await db.collection("materials").doc(id).set(item);
      count++;
      console.log(`Uploaded ${item.uniqueId || item.title || id}`);
    } catch (e: any) {
      console.error(`Failed to upload ${id}:`, e.message);
    }
  }

  console.log(`Finished uploading ${count} materials.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
