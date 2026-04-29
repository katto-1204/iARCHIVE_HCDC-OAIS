import fs from "fs";
import path from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccountJson() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureFirebaseApp() {
  if (getApps().length > 0) return;
  const serviceAccount = getServiceAccountJson();
  const projectId = process.env["FIREBASE_PROJECT_ID"] || serviceAccount?.project_id;
  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID (or FIREBASE_SERVICE_ACCOUNT_JSON with project_id)");
  }
  if (!serviceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadFirstExistingJson(paths, fallback) {
  for (const p of paths) {
    const data = loadJson(p, null);
    if (data !== null) return data;
  }
  return fallback;
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  return String(value);
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function writeBatch(collection, docs, dryRun) {
  const db = getFirestore();
  const batches = chunk(docs, 500);
  for (const batchDocs of batches) {
    if (dryRun) continue;
    const batch = db.batch();
    for (const doc of batchDocs) {
      const ref = db.collection(collection).doc(doc.id);
      batch.set(ref, doc, { merge: true });
    }
    await batch.commit();
  }
}

async function main() {
  ensureFirebaseApp();
  const db = getFirestore();
  const dryRun = process.env["DRY_RUN"] === "true";

  const baseDir = path.resolve(process.cwd(), "..");
  const categories = loadFirstExistingJson(
    [
      path.join(baseDir, "categories.json"),
      path.join(process.cwd(), "categories.json"),
    ],
    [],
  );
  const materials = loadFirstExistingJson(
    [
      path.join(baseDir, "materials.json"),
      path.join(process.cwd(), "materials.json"),
    ],
    [],
  );
  const users = loadFirstExistingJson(
    [
      path.join(baseDir, "users.json"),
      path.join(process.cwd(), "users.json"),
    ],
    [],
  );
  const usersCopy = loadFirstExistingJson(
    [
      path.join(baseDir, "users copy.json"),
      path.join(process.cwd(), "users copy.json"),
    ],
    [],
  );
  const accessRequests = loadFirstExistingJson(
    [
      path.join(baseDir, "access_requests.json"),
      path.join(process.cwd(), "access_requests.json"),
    ],
    [],
  );
  const ingestRequests = loadFirstExistingJson(
    [
      path.join(baseDir, "ingest_requests.json"),
      path.join(process.cwd(), "ingest_requests.json"),
    ],
    [],
  );

  const mappedCategories = categories.map((c) => {
    const createdAt = toIso(c.created_at || c.createdAt);
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      categoryNo: Number(c.category_no ?? c.categoryNo ?? 0),
      level: c.level || "fonds",
      parentId: c.parent_id ?? c.parentId ?? null,
      createdAt,
      updatedAt: toIso(c.updated_at || c.updatedAt || createdAt),
    };
  });

  const mappedMaterials = materials.map((m) => {
    const createdAt = toIso(m.created_at || m.createdAt);
    return {
      id: m.id,
      materialId: m.material_id ?? m.materialId,
      title: m.title,
      altTitle: m.alt_title ?? m.altTitle ?? null,
      creator: m.creator ?? null,
      description: m.description ?? null,
      date: m.date ?? null,
      categoryId: m.category_id ?? m.categoryId ?? null,
      access: m.access ?? "public",
      format: m.format ?? null,
      fileSize: m.file_size ?? m.fileSize ?? null,
      pages: m.pages ?? null,
      language: m.language ?? null,
      publisher: m.publisher ?? null,
      contributor: m.contributor ?? null,
      subject: m.subject ?? null,
      type: m.type ?? null,
      source: m.source ?? null,
      rights: m.rights ?? null,
      relation: m.relation ?? null,
      coverage: m.coverage ?? null,
      identifier: m.identifier ?? null,
      archivalHistory: m.archival_history ?? m.archivalHistory ?? null,
      custodialHistory: m.custodial_history ?? m.custodialHistory ?? null,
      accessionNo: m.accession_no ?? m.accessionNo ?? null,
      scopeContent: m.scope_content ?? m.scopeContent ?? null,
      arrangement: m.arrangement ?? null,
      sha256: m.sha256 ?? null,
      scanner: m.scanner ?? null,
      resolution: m.resolution ?? null,
      physicalLocation: m.physical_location ?? m.physicalLocation ?? null,
      physicalCondition: m.physical_condition ?? m.physicalCondition ?? null,
      bindingType: m.binding_type ?? m.bindingType ?? null,
      cataloger: m.cataloger ?? null,
      dateCataloged: m.date_cataloged ?? m.dateCataloged ?? null,
      sipId: m.sip_id ?? m.sipId ?? null,
      aipId: m.aip_id ?? m.aipId ?? null,
      ingestDate: m.ingest_date ?? m.ingestDate ?? null,
      ingestBy: m.ingest_by ?? m.ingestBy ?? null,
      fixityStatus: m.fixity_status ?? m.fixityStatus ?? null,
      preferredCitation: m.preferred_citation ?? m.preferredCitation ?? null,
      fileUrl: m.file_url ?? m.fileUrl ?? null,
      thumbnailUrl: m.thumbnail_url ?? m.thumbnailUrl ?? null,
      status: m.status ?? "published",
      createdBy: m.created_by ?? m.createdBy ?? null,
      createdAt,
      updatedAt: toIso(m.updated_at || m.updatedAt || createdAt),
    };
  });

  const usersCombined = [...users, ...usersCopy];
  const seen = new Set();
  const mappedUsers = usersCombined
    .filter((u) => {
      if (!u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    })
    .map((u) => {
      const createdAt = toIso(u.createdAt || u.created_at);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        userCategory: u.userCategory ?? u.user_category ?? u.role ?? null,
        institution: u.institution ?? null,
        purpose: u.purpose ?? null,
        status: u.status ?? "pending",
        createdAt,
        updatedAt: toIso(u.updatedAt || u.updated_at || createdAt),
      };
    });

  const mappedRequests = accessRequests.map((r) => {
    const createdAt = toIso(r.createdAt || r.created_at);
    return {
      id: r.id,
      materialId: r.materialId ?? r.material_id,
      userId: r.userId ?? r.user_id,
      purpose: r.purpose ?? "",
      status: r.status ?? "pending",
      rejectionReason: r.rejectionReason ?? r.rejection_reason ?? null,
      reviewedBy: r.reviewedBy ?? r.reviewed_by ?? null,
      createdAt,
      updatedAt: toIso(r.updatedAt || r.updated_at || createdAt),
    };
  });

  const mappedIngestRequests = ingestRequests.map((r) => {
    const requestedAt = toIso(r.requestedAt || r.requested_at || r.createdAt || r.created_at);
    return {
      id: r.id,
      materialId: r.materialId ?? r.material_id ?? "",
      materialTitle: r.materialTitle ?? r.material_title ?? "",
      hierarchyPath: r.hierarchyPath ?? r.hierarchy_path ?? "",
      requestedBy: r.requestedBy ?? r.requested_by ?? "Unknown",
      requestedAt,
      status: r.status ?? "pending",
    };
  });

  console.log("Preparing Firestore migration...");
  console.log(`Categories: ${mappedCategories.length}`);
  console.log(`Materials: ${mappedMaterials.length}`);
  console.log(`Users: ${mappedUsers.length}`);
  console.log(`Access Requests: ${mappedRequests.length}`);
  console.log(`Ingest Requests: ${mappedIngestRequests.length}`);
  console.log(dryRun ? "DRY_RUN enabled. No writes will be performed." : "Writing to Firestore...");

  await writeBatch("categories", mappedCategories, dryRun);
  await writeBatch("materials", mappedMaterials, dryRun);
  await writeBatch("users", mappedUsers, dryRun);
  await writeBatch("accessRequests", mappedRequests, dryRun);
  await writeBatch("ingestRequests", mappedIngestRequests, dryRun);

  const stats = await Promise.all([
    db.collection("categories").count().get(),
    db.collection("materials").count().get(),
    db.collection("users").count().get(),
    db.collection("accessRequests").count().get(),
    db.collection("ingestRequests").count().get(),
  ]);
  console.log("Firestore counts:");
  console.log({
    categories: stats[0].data().count,
    materials: stats[1].data().count,
    users: stats[2].data().count,
    accessRequests: stats[3].data().count,
    ingestRequests: stats[4].data().count,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
