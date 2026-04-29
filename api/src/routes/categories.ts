import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { supabase } from "../lib/supabase.js";

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
    const { data: cats, error } = await supabase
      .from('categories')
      .select('*')
      .order('category_no', { ascending: true });

    if (error) throw error;

    // Get material counts per category
    const { data: materials } = await supabase
      .from('materials')
      .select('category_id');

    const matCounts: Record<string, number> = {};
    (materials || []).forEach((m: any) => {
      if (m.category_id) matCounts[m.category_id] = (matCounts[m.category_id] || 0) + 1;
    });

    const result = (cats || []).map((cat: any) => ({
      id: String(cat.id),
      name: cat.name,
      description: cat.description ?? null,
      categoryNo: Number(cat.category_no ?? 0),
      level: normalizeCategoryLevel(cat.level),
      isFeatured: !!(cat.is_featured ?? false),
      parentId: cat.parent_id ?? null,
      materialCount: matCounts[cat.id] || 0,
      createdAt: cat.created_at,
    }));

    res.json(result);
  } catch (err: any) {
    console.error("Supabase categories fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/categories", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { name, description, level, parentId, isFeatured } = req.body;
  if (!name || !level) { res.status(400).json({ error: "Name and level required" }); return; }
  try {
    // Get count for categoryNo
    const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const categoryNo = (count || 0) + 1;
    const id = generateId();
    const now = new Date().toISOString();

    const { error } = await supabase.from('categories').insert({
      id,
      name,
      description: description ?? null,
      level,
      is_featured: !!(isFeatured ?? false),
      parent_id: parentId ?? null,
      category_no: categoryNo,
      created_at: now,
      updated_at: now,
    });

    if (error) throw error;

    await logAudit({ action: "CREATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Created category: ${name}` });
    res.status(201).json({ id, name, description: description ?? null, level, isFeatured: !!(isFeatured ?? false), parentId: parentId ?? null, categoryNo, createdAt: now, updatedAt: now, materialCount: 0 });
  } catch (err: any) {
    console.error("Supabase category create failed:", err.message);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId, isFeatured } = req.body;
  try {
    const { data: cat, error: fetchErr } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchErr || !cat) { res.status(404).json({ error: "Category not found" }); return; }

    const { error } = await supabase.from('categories').update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parent_id: parentId ?? cat.parent_id ?? null,
      is_featured: isFeatured !== undefined ? !!isFeatured : (cat.is_featured ?? false),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) throw error;

    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });

    const { count: matCount } = await supabase.from('materials').select('*', { count: 'exact', head: true }).eq('category_id', id);
    const { data: updated } = await supabase.from('categories').select('*').eq('id', id).single();

    res.json({ id, ...updated, materialCount: matCount || 0 });
  } catch (err: any) {
    console.error("Supabase category update failed:", err.message);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.patch("/categories/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { name, description, level, parentId, isFeatured } = req.body;
  try {
    const { data: cat, error: fetchErr } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchErr || !cat) { res.status(404).json({ error: "Category not found" }); return; }

    const { error } = await supabase.from('categories').update({
      name: name ?? cat.name,
      description: description ?? cat.description ?? null,
      level: level ?? cat.level,
      parent_id: parentId ?? cat.parent_id ?? null,
      is_featured: isFeatured !== undefined ? !!isFeatured : (cat.is_featured ?? false),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) throw error;

    await logAudit({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Updated category: ${name}` });

    const { count: matCount } = await supabase.from('materials').select('*', { count: 'exact', head: true }).eq('category_id', id);
    const { data: updated } = await supabase.from('categories').select('*').eq('id', id).single();

    res.json({ id, ...updated, materialCount: matCount || 0 });
  } catch (err: any) {
    console.error("Supabase category patch failed:", err.message);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { data: cat, error: fetchErr } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchErr || !cat) { res.status(404).json({ error: "Category not found" }); return; }

    // Unlink materials from this category
    await supabase.from('materials').update({ category_id: null }).eq('category_id', id);

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    await logAudit({ action: "DELETE_CATEGORY", entityType: "category", entityId: id, userId: user.userId, userName: user.name, details: `Deleted category: ${cat.name}` });
    res.json({ message: "Category deleted" });
  } catch (err: any) {
    console.error("Supabase category delete failed:", err.message);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
