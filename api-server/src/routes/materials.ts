import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { generateId, generateMaterialId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import {
  jsonStoreCreateMaterial,
  jsonStoreDeleteMaterial,
  jsonStoreGetMaterial,
  jsonStoreGetMaterials,
  jsonStoreGetStats,
  jsonStoreUpdateMaterial,
} from "../lib/jsonStore.js";
import { getFirestoreDb } from "../lib/firebase.js";

const router = Router();

function formatMaterial(m: any, categoryName?: string) {
  return {
    id: m.id,
    materialId: m.materialId,
    title: m.title,
    altTitle: m.altTitle,
    creator: m.creator,
    description: m.description,
    date: m.date,
    categoryId: m.categoryId,
    categoryName: categoryName || null,
    access: m.access,
    format: m.format,
    fileSize: m.fileSize,
    pages: m.pages,
    language: m.language,
    publisher: m.publisher,
    status: m.status,
    thumbnailUrl: m.thumbnailUrl,
    createdAt: m.createdAt,
    createdBy: m.createdBy,
  };
}

function materialSeqFromMaterialId(materialId: string) {
  const match = materialId.match(/^(\d{2})iA(\d{2})(\d{7})$/);
  if (!match) return null;
  return Number(match[3]);
}

function matchesSearch(m: any, search: string) {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  const haystack = [m.title, m.materialId, m.creator, m.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(s);
}

router.get("/materials", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
  const search = req.query.search as string;
  const access = req.query.access as string;
  const categoryId = req.query.category as string;
  try {
    const db = getFirestoreDb();
    let query = db.collection("materials").where("status", "==", "published");
    if (access && ["public", "restricted", "confidential"].includes(access)) {
      query = query.where("access", "==", access);
    }
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    const snapshot = await query.get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid composite index requirement
    rows.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    const filtered = search ? rows.filter((m) => matchesSearch(m, search)) : rows;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = filtered.slice(offset, offset + limit);

    const catsSnap = await db.collection("categories").get();
    const catMap = Object.fromEntries(catsSnap.docs.map((c) => [c.id, (c.data() as any).name]));
    const materials = pageItems.map((m) => formatMaterial(m, m.categoryId ? catMap[m.categoryId] : undefined));
    res.json({ materials, total, page, limit, totalPages });
  } catch {
    res.json(
      jsonStoreGetMaterials({
        search,
        access,
        category: categoryId,
        page,
        limit,
      }),
    );
  }
});

router.post("/materials", requireAuth, async (req, res) => {
  const user = req.user!;
  const body = req.body;
  if (!body.title) { res.status(400).json({ error: "Title required" }); return; }
  try {
    const db = getFirestoreDb();
    const catsSnap = await db.collection("categories").get();
    const cats = catsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const cat = body.categoryId ? cats.find((c: any) => c.id === body.categoryId) : cats[0];
    const catNo = cat ? Number((cat as any).categoryNo) : 1;
    const materialsQuery = (cat as any)?.id
      ? db.collection("materials").where("categoryId", "==", (cat as any).id)
      : db.collection("materials");
    const materialsSnap = await materialsQuery.get();
    const maxSeq = materialsSnap.docs.reduce((acc, doc) => {
      const seq = materialSeqFromMaterialId((doc.data() as any).materialId || "");
      return seq == null ? acc : Math.max(acc, seq);
    }, 0);
    const seqNo = maxSeq + 1;
    const materialId = generateMaterialId(catNo, seqNo);
    const id = generateId();
    const sipId = `SIP-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}${String(new Date().getDate()).padStart(2,"0")}-${String(seqNo).padStart(3,"0")}`;
    const aipId = `AIP-${new Date().getFullYear()}-${String(seqNo).padStart(4,"0")}`;
    const ingestDate = new Date().toISOString().split("T")[0];
    const cataloger = user.name;
    const dateCataloged = ingestDate;
    const preferredCitation = body.preferredCitation || `${body.creator || "Author"}. (${body.date?.split("-")[0] || new Date().getFullYear()}). ${body.title}. Holy Cross of Davao College. [${materialId}]`;

    const now = new Date().toISOString();
    const newMat = {
      id,
      materialId,
      title: body.title,
      altTitle: body.altTitle ?? null,
      creator: body.creator ?? null,
      description: body.description ?? null,
      date: body.date ?? null,
      categoryId: body.categoryId ?? (cat as any)?.id ?? null,
      access: body.access || "public",
      format: body.format ?? null,
      fileSize: body.fileSize ?? null,
      pages: body.pages ?? null,
      language: body.language ?? null,
      publisher: body.publisher ?? null,
      contributor: body.contributor ?? null,
      subject: body.subject ?? null,
      type: body.type ?? null,
      source: body.source ?? null,
      rights: body.rights ?? null,
      relation: body.relation ?? null,
      coverage: body.coverage ?? null,
      identifier: body.identifier ?? null,
      archivalHistory: body.archivalHistory ?? null,
      custodialHistory: body.custodialHistory ?? null,
      accessionNo: body.accessionNo ?? null,
      scopeContent: body.scopeContent ?? null,
      arrangement: body.arrangement ?? null,
      sha256: body.sha256 ?? null,
      scanner: body.scanner ?? null,
      resolution: body.resolution ?? null,
      physicalLocation: body.physicalLocation ?? null,
      physicalCondition: body.physicalCondition ?? null,
      bindingType: body.bindingType ?? null,
      cataloger,
      dateCataloged,
      sipId,
      aipId,
      ingestDate,
      ingestBy: user.name,
      fixityStatus: body.sha256 ? "verified" : null,
      preferredCitation,
      fileUrl: body.fileUrl ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      status: "published",
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("materials").doc(id).set(newMat);
    await logAudit({ action: "CREATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Created material: ${body.title}` });
    const catName = body.categoryId ? (cats.find((c: any) => c.id === body.categoryId) as any)?.name : undefined;
    res.status(201).json(formatMaterial(newMat, catName));
  } catch {
    const created = jsonStoreCreateMaterial({ data: body, user: { userId: user.userId, name: user.name } });
    res.status(201).json(created);
  }
});

router.get("/materials/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    let docSnap = await db.collection("materials").doc(id).get();
    if (!docSnap.exists) {
      const byMaterialId = await db.collection("materials").where("materialId", "==", id).limit(1).get();
      docSnap = byMaterialId.docs[0];
    }
    if (!docSnap || !docSnap.exists) { res.status(404).json({ error: "Material not found" }); return; }
    const m = { id: docSnap.id, ...docSnap.data() } as any;
    const catsSnap = await db.collection("categories").get();
    const catMap = Object.fromEntries(catsSnap.docs.map((c) => [c.id, (c.data() as any).name]));
    let related: any[] = [];
    if (m.categoryId) {
      const relatedSnap = await db.collection("materials").where("categoryId", "==", m.categoryId).orderBy("createdAt", "desc").limit(8).get();
      related = relatedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.id !== m.id)
        .slice(0, 4);
    }
    res.json({
      ...formatMaterial(m, m.categoryId ? catMap[m.categoryId] : undefined),
      contributor: m.contributor, subject: m.subject, type: m.type, source: m.source,
      rights: m.rights, relation: m.relation, coverage: m.coverage, identifier: m.identifier,
      archivalHistory: m.archivalHistory, custodialHistory: m.custodialHistory,
      accessionNo: m.accessionNo, scopeContent: m.scopeContent, arrangement: m.arrangement,
      sha256: m.sha256, scanner: m.scanner, resolution: m.resolution,
      physicalLocation: m.physicalLocation, physicalCondition: m.physicalCondition,
      bindingType: m.bindingType, cataloger: m.cataloger, dateCataloged: m.dateCataloged,
      sipId: m.sipId, aipId: m.aipId, ingestDate: m.ingestDate, ingestBy: m.ingestBy,
      fixityStatus: m.fixityStatus, preferredCitation: m.preferredCitation, fileUrl: m.fileUrl,
      relatedItems: related.map((r) => formatMaterial(r, r.categoryId ? catMap[r.categoryId] : undefined)),
    });
  } catch {
    const mat = jsonStoreGetMaterial(id);
    if (!mat) { res.status(404).json({ error: "Material not found" }); return; }
    res.json(mat);
  }
});

async function handleUpdateMaterial(req: any, res: any) {
  const user = req.user!;
  const id = String(req.params.id);
  const body = req.body;
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("materials").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Material not found" }); return; }
    const m = snap.data() as any;
    await db.collection("materials").doc(id).update({
      title: body.title ?? m.title,
      altTitle: body.altTitle ?? m.altTitle ?? null,
      creator: body.creator ?? m.creator ?? null,
      description: body.description ?? m.description ?? null,
      date: body.date ?? m.date ?? null,
      categoryId: body.categoryId !== undefined ? body.categoryId : m.categoryId,
      access: body.access ?? m.access,
      format: body.format ?? m.format ?? null,
      fileSize: body.fileSize ?? m.fileSize ?? null,
      pages: body.pages ?? m.pages ?? null,
      language: body.language ?? m.language ?? null,
      publisher: body.publisher ?? m.publisher ?? null,
      fileUrl: body.fileUrl !== undefined ? body.fileUrl : m.fileUrl ?? null,
      thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl : m.thumbnailUrl ?? null,
      status: body.status ?? m.status,
      updatedAt: new Date().toISOString(),
    });
    await logAudit({ action: "UPDATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Updated material: ${m.title}` });
    const updated = await db.collection("materials").doc(id).get();
    res.json(formatMaterial({ id, ...updated.data() }));
  } catch {
    const updated = jsonStoreUpdateMaterial(id, body, { userId: user.userId, name: user.name });
    if (!updated) { res.status(404).json({ error: "Material not found" }); return; }
    res.json(updated);
  }
}

router.put("/materials/:id", requireAuth, (req, res) => handleUpdateMaterial(req, res));
router.patch("/materials/:id", requireAuth, (req, res) => handleUpdateMaterial(req, res));

router.delete("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("materials").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Material not found" }); return; }
    const m = snap.data() as any;
    await db.collection("materials").doc(id).delete();
    await logAudit({ action: "DELETE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Deleted material: ${m.title}` });
    res.json({ message: "Material deleted" });
  } catch {
    const ok = jsonStoreDeleteMaterial(id);
    if (!ok) { res.status(404).json({ error: "Material not found" }); return; }
    res.json({ message: "Material deleted" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    const matCount = await db.collection("materials").where("status", "==", "published").count().get();
    const catCount = await db.collection("categories").count().get();
    const userCount = await db.collection("users").where("status", "==", "active").count().get();
    const pendingReqs = await db.collection("accessRequests").where("status", "==", "pending").count().get();
    const pendingUsers = await db.collection("users").where("status", "==", "pending").count().get();
    const recentActivitySnap = await db.collection("auditLogs").orderBy("createdAt", "desc").limit(10).get();
    const recentActivity = recentActivitySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({
      totalMaterials: Number(matCount.data().count),
      totalCategories: Number(catCount.data().count),
      totalUsers: Number(userCount.data().count),
      pendingRequests: Number(pendingReqs.data().count),
      pendingUsers: Number(pendingUsers.data().count),
      recentActivity,
    });
  } catch {
    res.json(jsonStoreGetStats());
  }
});

export default router;
