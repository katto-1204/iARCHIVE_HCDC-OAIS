import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { getFirestoreDb } from "../lib/firebase.js";
import {
  jsonStoreCreateCategory,
  jsonStoreDeleteCategory,
  jsonStoreGetCategories,
  jsonStoreUpdateCategory,
} from "../lib/jsonStore.js";

const router = Router();

function normalizeCategoryLevel(level: unknown) {
  const normalized = String(level || "").toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "fonds") return "fonds";
  if (normalized === "subfonds" || normalized === "department") return "subfonds";
  if (normalized === "series") return "series";
  if (normalized === "subseries") return "subseries";
  if (normalized === "file") return "file";
  if (normalized === "item") return "item";
  return "fonds";
}

router.get("/categories", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    
    const catsSnap = await db.collection("categories").orderBy("categoryNo", "asc").get();
    const cats = catsSnap.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        ...data,
        id: String(data.id || doc.id),
        level: normalizeCategoryLevel(data.level),
        parentId: data.parentId ?? data.parent_id ?? null,
        categoryNo: Number(data.categoryNo ?? data.category_no ?? 0),
        isFeatured: !!(data.isFeatured ?? data.is_featured ?? false),
      };
    });
    if (!cats.length || !cats.some((c: any) => c.level === "fonds")) {
      res.json(jsonStoreGetCategories());
      return;
    }
    
    const materialsSnap = await db.collection("materials").select("categoryId").get();
    const matCounts: Record<string, number> = {};
    materialsSnap.docs.forEach(doc => {
      const cid = doc.data().categoryId;
      if (cid) matCounts[cid] = (matCounts[cid] || 0) + 1;
    });

    res.json(cats.map((c: any) => ({ ...c, materialCount: matCounts[c.id] || 0 })));
  } catch (err: any) {
    console.error("Firestore categories fetch failed, using JSON store fallback:", err.message);
    res.json(jsonStoreGetCategories());
  }
});

router.post("/categories", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { name, description, level, parentId, isFeatured } = req.body;
  if (!name || !level) { res.status(400).json({ error: "Name and level required" }); return; }
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const countSnap = await db.collection("categories").count().get();
    const categoryNo = Number(countSnap.data().count) + 1;
    const id = generateId();
    const now = new Date().toISOString();
    await db.collection("categories").doc(id).set({
      id,
      name,
      description: description ?? null,
      level,
      isFeatured: !!(isFeatured ?? false),
      parentId: parentId ?? null,
      categoryNo,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({ action: "CREATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Created category: ${name}` });
    res.status(201).json({ id, name, description: description ?? null, level, isFeatured: !!(isFeatured ?? false), parentId: parentId ?? null, categoryNo, createdAt: now, updatedAt: now, materialCount: 0 });
  } catch (err: any) {
    console.error("Firestore category create failed, using JSON store fallback:", err.message);
    const created = jsonStoreCreateCategory({ name, description, level, parentId });
    res.status(201).json(created);
  }
});

router.put("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId, isFeatured } = req.body;
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("categories").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Category not found" }); return; }
    const cat = snap.data() as any;
    await db.collection("categories").doc(id).update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parentId: parentId ?? cat.parentId ?? null,
      isFeatured: isFeatured !== undefined ? !!isFeatured : (cat.isFeatured ?? cat.is_featured ?? false),
      updatedAt: new Date().toISOString(),
    });
    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });
    const countSnap = await db.collection("materials").where("categoryId", "==", id).count().get();
    const updated = await db.collection("categories").doc(id).get();
    res.json({ id, ...updated.data(), materialCount: Number(countSnap.data().count) });
  } catch (err: any) {
    console.error("Firestore category update failed, using JSON store fallback:", err.message);
    const updated = jsonStoreUpdateCategory({ id, name, description, level, parentId });
    if (!updated) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(updated);
  }
});

router.patch("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId, isFeatured } = req.body;
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("categories").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Category not found" }); return; }
    const cat = snap.data() as any;
    await db.collection("categories").doc(id).update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parentId: parentId ?? cat.parentId ?? null,
      isFeatured: isFeatured !== undefined ? !!isFeatured : (cat.isFeatured ?? cat.is_featured ?? false),
      updatedAt: new Date().toISOString(),
    });
    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });
    const countSnap = await db.collection("materials").where("categoryId", "==", id).count().get();
    const updated = await db.collection("categories").doc(id).get();
    res.json({ id, ...updated.data(), materialCount: Number(countSnap.data().count) });
  } catch (err: any) {
    console.error("Firestore category patch failed, using JSON store fallback:", err.message);
    const updated = jsonStoreUpdateCategory({ id, name, description, level, parentId });
    if (!updated) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(updated);
  }
});

router.delete("/categories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("categories").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Category not found" }); return; }
    const cat = snap.data() as any;
    await db.collection("categories").doc(id).delete();
    const materialsSnap = await db.collection("materials").where("categoryId", "==", id).get();
    const batch = db.batch();
    materialsSnap.docs.forEach((doc) => batch.update(doc.ref, { categoryId: null }));
    if (materialsSnap.size > 0) {
      await batch.commit();
    }
    await logAudit({ action: "DELETE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Deleted category: ${cat.name}` });
    res.json({ message: "Category deleted" });
  } catch (err: any) {
    console.error("Firestore category delete failed, using JSON store fallback:", err.message);
    const ok = jsonStoreDeleteCategory(id);
    if (!ok) { res.status(404).json({ error: "Category not found" }); return; }
    res.json({ message: "Category deleted" });
  }
});

export default router;
