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

router.get("/categories", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase Unavailable");
    
    const catsSnap = await db.collection("categories").orderBy("categoryNo", "asc").get();
    const cats = catsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Efficiently get counts for all categories at once if needed, or just return cats
    // Since we want to be safe, we'll try a simpler approach if many categories exist
    const materialsSnap = await db.collection("materials").select("categoryId").get();
    const matCounts: Record<string, number> = {};
    materialsSnap.docs.forEach(doc => {
      const cid = doc.data().categoryId;
      if (cid) matCounts[cid] = (matCounts[cid] || 0) + 1;
    });

    res.json(cats.map((c: any) => ({ ...c, materialCount: matCounts[c.id] || 0 })));
  } catch (err: any) {
    console.warn("Categories Firebase fallback:", err.message);
    res.json(jsonStoreGetCategories());
  }
});

router.post("/categories", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { name, description, level, parentId } = req.body;
  if (!name || !level) { res.status(400).json({ error: "Name and level required" }); return; }
  try {
    const db = getFirestoreDb();
    const countSnap = await db.collection("categories").count().get();
    const categoryNo = Number(countSnap.data().count) + 1;
    const id = generateId();
    const now = new Date().toISOString();
    await db.collection("categories").doc(id).set({
      id,
      name,
      description: description ?? null,
      level,
      parentId: parentId ?? null,
      categoryNo,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({ action: "CREATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Created category: ${name}` });
    res.status(201).json({ id, name, description: description ?? null, level, parentId: parentId ?? null, categoryNo, createdAt: now, updatedAt: now, materialCount: 0 });
  } catch {
    const created = jsonStoreCreateCategory({ name, description, level, parentId });
    res.status(201).json(created);
  }
});

router.put("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId } = req.body;
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("categories").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Category not found" }); return; }
    const cat = snap.data() as any;
    await db.collection("categories").doc(id).update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parentId: parentId ?? cat.parentId ?? null,
      updatedAt: new Date().toISOString(),
    });
    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });
    const countSnap = await db.collection("materials").where("categoryId", "==", id).count().get();
    const updated = await db.collection("categories").doc(id).get();
    res.json({ id, ...updated.data(), materialCount: Number(countSnap.data().count) });
  } catch {
    const updated = jsonStoreUpdateCategory({ id, name, description, level, parentId });
    if (!updated) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(updated);
  }
});

// PATCH alias — the frontend sends PATCH for category updates
router.patch("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId } = req.body;
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("categories").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Category not found" }); return; }
    const cat = snap.data() as any;
    await db.collection("categories").doc(id).update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parentId: parentId ?? cat.parentId ?? null,
      updatedAt: new Date().toISOString(),
    });
    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });
    const countSnap = await db.collection("materials").where("categoryId", "==", id).count().get();
    const updated = await db.collection("categories").doc(id).get();
    res.json({ id, ...updated.data(), materialCount: Number(countSnap.data().count) });
  } catch {
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
  } catch {
    const ok = jsonStoreDeleteCategory(id);
    if (!ok) { res.status(404).json({ error: "Category not found" }); return; }
    res.json({ message: "Category deleted" });
  }
});

export default router;
