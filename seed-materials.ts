import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as fs from "fs";
import { materialsTable } from "@workspace/db/schema";
import * as path from "path";

async function seedMaterials() {
  console.log("Connecting to Neon database...");
  const pool = new pg.Pool({
    connectionString: "postgresql://neondb_owner:npg_wKkV4o2sLfHc@ep-wandering-butterfly-aeg18imb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  });
  
  const db = drizzle(pool);
  
  console.log("Reading materials.json...");
  const rawData = fs.readFileSync("./materials.json", "utf-8");
  const materials = JSON.parse(rawData);

  console.log(`Found ${materials.length} materials. Seeding into Neon Database...`);
  
  try {
    for (const material of materials) {
      console.log(`Inserting material: ${material.title}`);
      
      await db.insert(materialsTable).values({
        id: material.id,
        materialId: material.uniqueId,
        title: material.title,
        altTitle: material.altTitle || null,
        creator: material.creator || null,
        description: material.description || null,
        date: material.date || null,
        // categories map by id, default to a category if needed, or null
        categoryId: null, // Left null if no direct map available 
        access: material.access || "public",
        format: material.format || null,
        fileSize: material.fileSize || material.extentAndMedium || null,
        pages: material.pages || null,
        language: material.language || null,
        publisher: material.publisher || null,
        contributor: material.contributor || null,
        subject: material.subject || null,
        type: material.type || null,
        source: material.immediateSource || null,
        rights: material.rights || null,
        relation: material.relation || null,
        coverage: material.coverage || null,
        identifier: material.referenceCode || null,
        archivalHistory: material.archivalHistory || null,
        custodialHistory: material.custodialHistory || null,
        accessionNo: null,
        scopeContent: material.scopeContent || null,
        arrangement: material.arrangement || null,
        sha256: material.sha256 || null,
        scanner: material.scanner || null,
        resolution: material.resolution || null,
        physicalLocation: material.physicalLocation || null,
        physicalCondition: material.physicalCondition || null,
        bindingType: null,
        cataloger: null,
        dateCataloged: null,
        sipId: material.sipId || null,
        aipId: material.aipId || null,
        ingestDate: material.ingestDate || null,
        ingestBy: material.ingestBy || null,
        fixityStatus: material.fixityStatus || null,
        preferredCitation: null,
        fileUrl: material.fileUrl || null,
        thumbnailUrl: material.thumbnailUrl || null,
        status: "published",
        createdBy: material.createdBy || "System",
        createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
        updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: materialsTable.materialId,
        set: { title: material.title, updatedAt: new Date() }
      });
    }
    console.log("Successfully seeded all materials!");
  } catch (error) {
    console.error("Error inserting materials:", error);
  } finally {
    pool.end();
    process.exit(0);
  }
}

seedMaterials();
