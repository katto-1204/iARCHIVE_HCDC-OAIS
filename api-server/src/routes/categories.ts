import { Router } from "express";
import { db, categoriesTable, materialsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import {
  jsonStoreCreateCategory,
  jsonStoreDeleteCategory,
  jsonStoreGetCategories,
  jsonStoreUpdateCategory,
} from "../lib/jsonStore.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(sql`${categoriesTable.categoryNo} asc`);
    const matCounts: Record<string, number> = {};
    for (const c of cats) {
      const [{ count: mc }] = await db.select({ count: count() }).from(materialsTable).where(eq(materialsTable.categoryId, c.id));
      matCounts[c.id] = Number(mc);
    }
    res.json(cats.map((c) => ({ ...c, materialCount: matCounts[c.id] || 0 })));
  } catch {
    res.json(jsonStoreGetCategories());
  }
});

router.post("/categories", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { name, description, level, parentId } = req.body;
  if (!name || !level) { res.status(400).json({ error: "Name and level required" }); return; }
  try {
    const [{ count: catCount }] = await db.select({ count: count() }).from(categoriesTable);
    const categoryNo = Number(catCount) + 1;
    const id = generateId();
    await db.insert(categoriesTable).values({ id, name, description, level, parentId, categoryNo });
    await logAudit({ action: "CREATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Created category: ${name}` });
    const [newCat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    res.status(201).json({ ...newCat, materialCount: 0 });
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
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
    await db.update(categoriesTable).set({ name: name ?? cat.name, description, level: level ?? cat.level, parentId, updatedAt: new Date() }).where(eq(categoriesTable.id, id));
    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });
    const [updated] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    const [{ count: mc }] = await db.select({ count: count() }).from(materialsTable).where(eq(materialsTable.categoryId, id));
    res.json({ ...updated, materialCount: Number(mc) });
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
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    await logAudit({ action: "DELETE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Deleted category: ${cat.name}` });
    res.json({ message: "Category deleted" });
  } catch {
    const ok = jsonStoreDeleteCategory(id);
    if (!ok) { res.status(404).json({ error: "Category not found" }); return; }
    res.json({ message: "Category deleted" });
  }
});

export default router;
