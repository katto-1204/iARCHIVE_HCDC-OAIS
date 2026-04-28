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
  const catName = categoryName || m.categoryName || "Uncategorized";
  const idValue = m.id || m.materialId || m.material_id;
  // Pass through ALL fields from Firestore — the frontend depends on many of them
  return {
    ...m,
    id: idValue,
    uniqueId: m.materialId || m.material_id || m.id,
    materialId: m.materialId || m.material_id || m.id,
    categoryName: catName,
    hierarchyPath: m.hierarchyPath || `HCDC > ${catName} > General Series`,
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
  const limit = Math.min(1000, parseInt(req.query.limit as string) || 50);
  const search = req.query.search as string;
  const access = req.query.access as string;
  const categoryId = req.query.category as string;
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    let query: FirebaseFirestore.Query = db.collection("materials");
    if (access && ["public", "restricted", "confidential"].includes(access)) {
      query = query.where("access", "==", access);
    }
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    const snapshot = await query.get();
    let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })) as any[];
    
    // Merge mock data from JSON store
    try {
      const mockData = jsonStoreGetMaterials({ limit: 10000, access, category: categoryId });
      if (mockData && mockData.materials) {
        const firestoreIds = new Set(rows.map(r => r.id));
        const mockRows = mockData.materials.filter((m: any) => !firestoreIds.has(m.id));
        rows = [...rows, ...mockRows];
      }
    } catch (e) {
        console.warn("Failed to merge mock materials", e);
    }

    // Sort in memory to avoid requiring composite Firestore indexes
    rows.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db2 - da;
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
  } catch (err) {
    console.error("Firestore materials fetch failed, using JSON store fallback:", err);
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
    if (!db) throw new Error("Firebase unavailable");
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
    const materialId = body.materialId || body.uniqueId || generateMaterialId(catNo, seqNo);
    const id = body.id || materialId || generateId();
    const sipId = body.sipId || `SIP-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}${String(new Date().getDate()).padStart(2,"0")}-${String(seqNo).padStart(3,"0")}`;
    const aipId = body.aipId || `AIP-${new Date().getFullYear()}-${String(seqNo).padStart(4,"0")}`;
    const ingestDate = body.ingestDate || new Date().toISOString().split("T")[0];
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
      hierarchyPath: body.hierarchyPath || `HCDC > ${(cat as any)?.name || "Uncategorized"} > General Series`,
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
      levelOfDescription: body.levelOfDescription ?? "Item",
      extentAndMedium: body.extentAndMedium ?? null,
      referenceCode: body.referenceCode ?? materialId,
      dateOfDescription: body.dateOfDescription ?? null,
      accessConditions: body.accessConditions ?? null,
      reproductionConditions: body.reproductionConditions ?? null,
      termsOfUse: body.termsOfUse ?? null,
      notes: body.notes ?? null,
      pointsOfAccess: body.pointsOfAccess ?? null,
      locationOfOriginals: body.locationOfOriginals ?? null,
      locationOfCopies: body.locationOfCopies ?? null,
      relatedUnits: body.relatedUnits ?? null,
      publicationNote: body.publicationNote ?? null,
      findingAids: body.findingAids ?? null,
      rulesOrConventions: body.rulesOrConventions ?? null,
      archivistNote: body.archivistNote ?? null,
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
    
    if (newMat.fileUrl && newMat.fileUrl.length > 800000) {
      console.log(`File is large (${newMat.fileUrl.length} chars). Chunking into materialChunks...`);
      const fullStr = newMat.fileUrl;
      const chunkSize = 800000;
      let chunksCount = 0;
      for (let i = 0; i < fullStr.length; i += chunkSize) {
        await db.collection("materialChunks").doc(`${id}_chunk_${chunksCount}`).set({
          materialId: id,
          chunkIndex: chunksCount,
          data: fullStr.substring(i, i + chunkSize)
        });
        chunksCount++;
      }
      (newMat as any).isFileChunked = true;
      (newMat as any).chunksCount = chunksCount;
      newMat.fileUrl = "CHUNKED";
    }

    // Handle pageImages separately to avoid Firestore document size limit (1MB)
    if (body.pageImages && Array.isArray(body.pageImages)) {
      console.log(`Saving ${body.pageImages.length} page images to materialPages...`);
      for (let i = 0; i < body.pageImages.length; i++) {
        await db.collection("materialPages").doc(`${id}_page_${i}`).set({
          materialId: id,
          pageIndex: i,
          data: body.pageImages[i]
        });
      }
      (newMat as any).hasPageImages = true;
      (newMat as any).pageCount = body.pageImages.length;
      // DO NOT save the full pageImages array in the main document
      delete (newMat as any).pageImages;
    }

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
    if (!db) throw new Error("Firebase unavailable");
    let docSnap = await db.collection("materials").doc(id).get();
    if (!docSnap.exists) {
      const byMaterialId = await db.collection("materials").where("materialId", "==", id).limit(1).get();
      if (!byMaterialId.empty) {
        docSnap = byMaterialId.docs[0];
      }
    }
    if (!docSnap || !docSnap.exists) { 
      const mat = jsonStoreGetMaterial(id);
      if (mat) {
        res.json(mat);
        return;
      }
      res.status(404).json({ error: "Material not found" }); 
      return; 
    }
    const m = { id: docSnap.id, ...docSnap.data() } as any;
    
    // Reconstruct chunked Base64 fileUrl if necessary
    if (m.isFileChunked) {
      let reconstructed = "";
      for (let i = 0; i < (m.chunksCount || 0); i++) {
        const cSnap = await db.collection("materialChunks").doc(`${m.id}_chunk_${i}`).get();
        if (cSnap.exists) reconstructed += cSnap.data()?.data || "";
      }
      m.fileUrl = reconstructed;
    }

    // Always try to fetch page images if it's a single material view
    try {
      const pagesSnap = await db.collection("materialPages")
        .where("materialId", "==", m.id)
        .get();
      
      if (!pagesSnap.empty) {
        m.pageImages = pagesSnap.docs
          .map(d => d.data())
          .sort((a: any, b: any) => (a.pageIndex || 0) - (b.pageIndex || 0))
          .map(d => d.data);
        m.hasPageImages = true;
      }
    } catch (e) {
      console.error("Failed to fetch pages for material:", m.id, e);
    }

    const catsSnap = await db.collection("categories").get();
    const catMap = Object.fromEntries(catsSnap.docs.map((c) => [c.id, (c.data() as any).name]));
    let related: any[] = [];
    if (m.categoryId) {
      // Avoid composite index requirement by sorting in memory if needed
      const relatedSnap = await db.collection("materials").where("categoryId", "==", m.categoryId).limit(10).get();
      related = relatedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.id !== m.id)
        .sort((a: any, b: any) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db2 - da;
        })
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
  } catch (err) {
    console.error("Material retrieval failed:", err);
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
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    let docRef = db.collection("materials").doc(id);
    let snap = await docRef.get();
    
    if (!snap.exists) {
      const byMaterialId = await db.collection("materials").where("materialId", "==", id).limit(1).get();
      if (!byMaterialId.empty) {
        snap = byMaterialId.docs[0];
        docRef = snap.ref;
      }
    }

    if (!snap.exists) { res.status(404).json({ error: "Material not found" }); return; }
    const m = snap.data() as any;
    const updateData: any = {
      title: body.title ?? m.title,
      altTitle: body.altTitle ?? m.altTitle ?? null,
      creator: body.creator ?? m.creator ?? null,
      description: body.description ?? m.description ?? null,
      date: body.date ?? m.date ?? null,
      categoryId: body.categoryId !== undefined ? body.categoryId : m.categoryId,
      hierarchyPath: body.hierarchyPath !== undefined ? body.hierarchyPath : m.hierarchyPath,
      access: body.access ?? m.access,
      format: body.format ?? m.format ?? null,
      fileSize: body.fileSize ?? m.fileSize ?? null,
      pages: body.pages ?? m.pages ?? null,
      language: body.language ?? m.language ?? null,
      publisher: body.publisher ?? m.publisher ?? null,
      fileUrl: body.fileUrl !== undefined ? body.fileUrl : m.fileUrl ?? null,
      thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl : m.thumbnailUrl ?? null,
      levelOfDescription: body.levelOfDescription ?? m.levelOfDescription ?? "Item",
      extentAndMedium: body.extentAndMedium ?? m.extentAndMedium ?? null,
      referenceCode: body.referenceCode ?? m.referenceCode ?? null,
      dateOfDescription: body.dateOfDescription ?? m.dateOfDescription ?? null,
      accessConditions: body.accessConditions ?? m.accessConditions ?? null,
      reproductionConditions: body.reproductionConditions ?? m.reproductionConditions ?? null,
      termsOfUse: body.termsOfUse ?? m.termsOfUse ?? null,
      notes: body.notes ?? m.notes ?? null,
      pointsOfAccess: body.pointsOfAccess ?? m.pointsOfAccess ?? null,
      locationOfOriginals: body.locationOfOriginals ?? m.locationOfOriginals ?? null,
      locationOfCopies: body.locationOfCopies ?? m.locationOfCopies ?? null,
      relatedUnits: body.relatedUnits ?? m.relatedUnits ?? null,
      publicationNote: body.publicationNote ?? m.publicationNote ?? null,
      findingAids: body.findingAids ?? m.findingAids ?? null,
      rulesOrConventions: body.rulesOrConventions ?? m.rulesOrConventions ?? null,
      archivistNote: body.archivistNote ?? m.archivistNote ?? null,
      status: body.status ?? m.status,
      updatedAt: new Date().toISOString(),
    };

    if (updateData.fileUrl && updateData.fileUrl.length > 800000 && updateData.fileUrl !== "CHUNKED") {
      console.log(`Update File is large (${updateData.fileUrl.length} chars). Chunking...`);
      const fullStr = updateData.fileUrl;
      const chunkSize = 800000;
      let chunksCount = 0;
      for (let i = 0; i < fullStr.length; i += chunkSize) {
        await db.collection("materialChunks").doc(`${id}_chunk_${chunksCount}`).set({
          materialId: id, chunkIndex: chunksCount, data: fullStr.substring(i, i + chunkSize)
        });
        chunksCount++;
      }
      updateData.isFileChunked = true;
      updateData.chunksCount = chunksCount;
      updateData.fileUrl = "CHUNKED";
    }

    // Handle pageImages updates
    if (body.pageImages && Array.isArray(body.pageImages)) {
      console.log(`Updating ${body.pageImages.length} page images...`);
      // Delete old pages first (optional but cleaner)
      const oldPages = await db.collection("materialPages").where("materialId", "==", id).get();
      const batch = db.batch();
      oldPages.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      for (let i = 0; i < body.pageImages.length; i++) {
        await db.collection("materialPages").doc(`${id}_page_${i}`).set({
          materialId: id,
          pageIndex: i,
          data: body.pageImages[i]
        });
      }
      updateData.hasPageImages = true;
      updateData.pageCount = body.pageImages.length;
      delete (updateData as any).pageImages;
    }

    await docRef.update(updateData);
    await logAudit({ action: "UPDATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Updated material: ${m.title}` });
    const updated = await docRef.get();
    res.json(formatMaterial({ id, ...updated.data() }));
  } catch {
    const updated = jsonStoreUpdateMaterial(id, body, { userId: user.userId, name: user.name });
    if (!updated) { res.status(404).json({ error: "Material not found" }); return; }
    res.json(updated);
  }
});

// PATCH alias for partial updates
router.patch("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const body = req.body;
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    let docRef = db.collection("materials").doc(id);
    let snap = await docRef.get();
    
    if (!snap.exists) {
      const byMaterialId = await db.collection("materials").where("materialId", "==", id).limit(1).get();
      if (!byMaterialId.empty) {
        snap = byMaterialId.docs[0];
        docRef = snap.ref;
      }
    }

    if (!snap.exists) { res.status(404).json({ error: "Material not found" }); return; }
    const m = snap.data() as any;
    const updateData: any = {
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
      levelOfDescription: body.levelOfDescription ?? m.levelOfDescription ?? "Item",
      extentAndMedium: body.extentAndMedium ?? m.extentAndMedium ?? null,
      referenceCode: body.referenceCode ?? m.referenceCode ?? null,
      dateOfDescription: body.dateOfDescription ?? m.dateOfDescription ?? null,
      accessConditions: body.accessConditions ?? m.accessConditions ?? null,
      reproductionConditions: body.reproductionConditions ?? m.reproductionConditions ?? null,
      termsOfUse: body.termsOfUse ?? m.termsOfUse ?? null,
      notes: body.notes ?? m.notes ?? null,
      pointsOfAccess: body.pointsOfAccess ?? m.pointsOfAccess ?? null,
      locationOfOriginals: body.locationOfOriginals ?? m.locationOfOriginals ?? null,
      locationOfCopies: body.locationOfCopies ?? m.locationOfCopies ?? null,
      relatedUnits: body.relatedUnits ?? m.relatedUnits ?? null,
      publicationNote: body.publicationNote ?? m.publicationNote ?? null,
      findingAids: body.findingAids ?? m.findingAids ?? null,
      rulesOrConventions: body.rulesOrConventions ?? m.rulesOrConventions ?? null,
      archivistNote: body.archivistNote ?? m.archivistNote ?? null,
      status: body.status ?? m.status,
      updatedAt: new Date().toISOString(),
    };

    if (updateData.fileUrl && updateData.fileUrl.length > 800000 && updateData.fileUrl !== "CHUNKED") {
      const fullStr = updateData.fileUrl;
      const chunkSize = 800000;
      let chunksCount = 0;
      for (let i = 0; i < fullStr.length; i += chunkSize) {
        await db.collection("materialChunks").doc(`${id}_chunk_${chunksCount}`).set({
          materialId: id, chunkIndex: chunksCount, data: fullStr.substring(i, i + chunkSize)
        });
        chunksCount++;
      }
      updateData.isFileChunked = true;
      updateData.chunksCount = chunksCount;
      updateData.fileUrl = "CHUNKED";
    }

    await docRef.update(updateData);
    await logAudit({ action: "UPDATE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Updated material: ${m.title}` });
    const updated = await docRef.get();
    res.json(formatMaterial({ id, ...updated.data() }));
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
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    let docRef = db.collection("materials").doc(id);
    let snap = await docRef.get();
    
    if (!snap.exists) {
      const byMaterialId = await db.collection("materials").where("materialId", "==", id).limit(1).get();
      if (!byMaterialId.empty) {
        snap = byMaterialId.docs[0];
        docRef = snap.ref;
      }
    }

    // Idempotent delete: if it's already gone, treat it as success to avoid noisy 404s in UI.
    if (!snap.exists) {
      res.json({ message: "Material already deleted" });
      return;
    }
    const m = snap.data() as any;

    // Clean up chunks if material was chunked
    if (m.isFileChunked) {
      try {
        const chunksCount = m.chunksCount || 0;
        for (let i = 0; i < chunksCount; i++) {
          await db.collection("materialChunks").doc(`${id}_chunk_${i}`).delete();
        }
      } catch (e) {
        console.error("Failed to clean up chunks during deletion:", e);
      }
    }

    // Clean up pages if material has them
    if (m.hasPageImages) {
      try {
        const pagesSnap = await db.collection("materialPages").where("materialId", "==", id).get();
        const batch = db.batch();
        pagesSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        console.error("Failed to clean up pages during deletion:", e);
      }
    }

    await docRef.delete();
    await logAudit({ action: "DELETE_MATERIAL", entityType: "material", entityId: id, userId: user.userId, userName: user.name, details: `Deleted material: ${m.title}` });
    res.json({ message: "Material deleted" });
  } catch (err: any) {
    console.error("Firestore DELETE failed:", err);
    const ok = jsonStoreDeleteMaterial(id);
    // Also idempotent for local/mock store.
    res.json({ message: ok ? "Material deleted" : "Material already deleted" });
  }
});

router.post("/materials/:id/pages", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { pageIndex, data } = req.body;
  if (pageIndex === undefined || !data) {
    return res.status(400).json({ error: "pageIndex and data are required" });
  }
  try {
    const db = getFirestoreDb();
    await db.collection("materialPages").doc(`${id}_page_${pageIndex}`).set({
      materialId: id,
      pageIndex,
      data
    });
    // Ensure the material document reflects that it has pages
    await db.collection("materials").doc(id).update({
      hasPageImages: true,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save page:", err);
    res.status(500).json({ error: "Failed to save page" });
  }
});

router.post("/materials/:id/file/chunks", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { chunkIndex, totalChunks, data } = req.body;
  
  if (chunkIndex === undefined || !data) {
    return res.status(400).json({ error: "chunkIndex and data are required" });
  }

  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");

    // Save chunk to materialChunks collection
    await db.collection("materialChunks").doc(`${id}_chunk_${chunkIndex}`).set({
      materialId: id,
      chunkIndex,
      data
    });

    // If this is the last chunk, update the material document
    if (chunkIndex === totalChunks - 1) {
      await db.collection("materials").doc(id).update({
        isFileChunked: true,
        chunksCount: totalChunks,
        fileUrl: "CHUNKED", // Placeholder to indicate data is in chunks
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save file chunk:", err);
    res.status(500).json({ error: "Failed to save file chunk" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
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
