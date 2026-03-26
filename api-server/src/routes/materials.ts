import { Router } from "express";
import { db, materialsTable, categoriesTable, usersTable } from "@workspace/db";
import { eq, ilike, or, count, and, sql } from "drizzle-orm";
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

router.get("/materials", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const access = req.query.access as string;
  const categoryId = req.query.category as string;
  try {
    const conditions: any[] = [eq(materialsTable.status, "published")];
    if (search) {
      conditions.push(or(
        ilike(materialsTable.title, `%${search}%`),
        ilike(materialsTable.materialId, `%${search}%`),
        ilike(materialsTable.creator, `%${search}%`),
        ilike(materialsTable.description, `%${search}%`)
      ));
    }
    if (access && ["public", "restricted", "confidential"].includes(access)) {
      conditions.push(eq(materialsTable.access, access as any));
    }
    if (categoryId) {
      conditions.push(eq(materialsTable.categoryId, categoryId));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];
    const [{ count: total }] = await db.select({ count: count() }).from(materialsTable).where(where);
    const rows = await db.select().from(materialsTable).where(where).limit(limit).offset(offset).orderBy(sql`${materialsTable.createdAt} desc`);
    const cats = await db.select().from(categoriesTable);
    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const materials = rows.map(m => formatMaterial(m, m.categoryId ? catMap[m.categoryId] : undefined));
    res.json({ materials, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
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
    const cats = await db.select().from(categoriesTable);
    const cat = body.categoryId ? cats.find(c => c.id === body.categoryId) : cats[0];
    const catNo = cat ? cat.categoryNo : 1;
    const [{ count: seqCount }] = await db.select({ count: count() }).from(materialsTable);
    const seqNo = Number(seqCount) + 1;
    const materialId = generateMaterialId(catNo, seqNo);
    const id = generateId();
    const sipId = `SIP-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}${String(new Date().getDate()).padStart(2,"0")}-${String(seqNo).padStart(3,"0")}`;
    const aipId = `AIP-${new Date().getFullYear()}-${String(seqNo).padStart(4,"0")}`;
    const ingestDate = new Date().toISOString().split("T")[0];
    const cataloger = user.name;
    const dateCataloged = ingestDate;
    const preferredCitation = body.preferredCitation || `${body.creator || "Author"}. (${body.date?.split("-")[0] || new Date().getFullYear()}). ${body.title}. Holy Cross of Davao College. [${materialId}]`;

    await db.insert(materialsTable).values({
      id, materialId,
      title: body.title, altTitle: body.altTitle, creator: body.creator,
      description: body.description, date: body.date, categoryId: body.categoryId,
      access: body.access || "public", format: body.format, fileSize: body.fileSize,
      pages: body.pages, language: body.language, publisher: body.publisher,
      contributor: body.contributor, subject: body.subject, type: body.type,
      source: body.source, rights: body.rights, relation: body.relation,
      coverage: body.coverage, archivalHistory: body.archivalHistory,
      custodialHistory: body.custodialHistory, accessionNo: body.accessionNo,
      scopeContent: body.scopeContent, arrangement: body.arrangement,
      sha256: body.sha256, scanner: body.scanner, resolution: body.resolution,
      physicalLocation: body.physicalLocation, physicalCondition: body.physicalCondition,
      bindingType: body.bindingType, cataloger, dateCataloged,
      sipId, aipId, ingestDate, ingestBy: user.name,
      fixityStatus: body.sha256 ? "verified" : null,
      preferredCitation, fileUrl: body.fileUrl, thumbnailUrl: body.thumbnailUrl,
      status: "published", createdBy: user.userId,
    });
    await logAudit({ action: "CREATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Created material: ${body.title}` });
    const [newMat] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
    const catName = body.categoryId ? cats.find(c => c.id === body.categoryId)?.name : undefined;
    res.status(201).json(formatMaterial(newMat, catName));
  } catch {
    const created = jsonStoreCreateMaterial({ data: body, user: { userId: user.userId, name: user.name } });
    res.status(201).json(created);
  }
});

router.get("/materials/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const [m] = await db.select().from(materialsTable).where(
      or(eq(materialsTable.id, id), eq(materialsTable.materialId, id))
    ).limit(1);
    if (!m) { res.status(404).json({ error: "Material not found" }); return; }
    const cats = await db.select().from(categoriesTable);
    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const related = m.categoryId ? await db.select().from(materialsTable)
      .where(and(eq(materialsTable.categoryId, m.categoryId), sql`${materialsTable.id} != ${m.id}`))
      .limit(4) : [];
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
      relatedItems: related.map(r => formatMaterial(r, r.categoryId ? catMap[r.categoryId] : undefined)),
    });
  } catch {
    const mat = jsonStoreGetMaterial(id);
    if (!mat) { res.status(404).json({ error: "Material not found" }); return; }
    res.json(mat);
  }
});

router.put("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const body = req.body;
  try {
    const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
    if (!m) { res.status(404).json({ error: "Material not found" }); return; }
    await db.update(materialsTable).set({
      title: body.title ?? m.title, altTitle: body.altTitle, creator: body.creator,
      description: body.description, date: body.date, categoryId: body.categoryId,
      access: body.access ?? m.access, format: body.format, fileSize: body.fileSize,
      pages: body.pages, language: body.language, publisher: body.publisher,
      fileUrl: body.fileUrl ?? m.fileUrl, thumbnailUrl: body.thumbnailUrl ?? m.thumbnailUrl,
      status: body.status ?? m.status, updatedAt: new Date(),
    }).where(eq(materialsTable.id, id));
    await logAudit({ action: "UPDATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Updated material: ${m.title}` });
    const [updated] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
    res.json(formatMaterial(updated));
  } catch {
    const updated = jsonStoreUpdateMaterial(id, body, { userId: user.userId, name: user.name });
    if (!updated) { res.status(404).json({ error: "Material not found" }); return; }
    res.json(updated);
  }
});

router.delete("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
    if (!m) { res.status(404).json({ error: "Material not found" }); return; }
    await db.delete(materialsTable).where(eq(materialsTable.id, id));
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
    const [matCount] = await db.select({ count: count() }).from(materialsTable);
    const [catCount] = await db.select({ count: count() }).from(categoriesTable);
    const [userCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.status, "active"));
    const { accessRequestsTable } = await import("@workspace/db");
    const [pendingReqs] = await db.select({ count: count() }).from(accessRequestsTable).where(eq(accessRequestsTable.status, "pending"));
    const [pendingUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.status, "pending"));
    const { auditLogsTable } = await import("@workspace/db");
    const recentActivity = await db.select().from(auditLogsTable).orderBy(sql`${auditLogsTable.createdAt} desc`).limit(10);
    res.json({
      totalMaterials: Number(matCount.count),
      totalCategories: Number(catCount.count),
      totalUsers: Number(userCount.count),
      pendingRequests: Number(pendingReqs.count),
      pendingUsers: Number(pendingUsers.count),
      recentActivity,
    });
  } catch {
    res.json(jsonStoreGetStats());
  }
});

export default router;
