import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { 
  jsonStoreGetMaterials, 
  jsonStoreGetCategories 
} from "../lib/jsonStore.js";

const router = Router();

router.post("/migrate-to-supabase", async (req, res) => {
  try {
    const results: any = { categories: 0, materials: 0 };
    
    // 1. Migrate Categories
    const categories = jsonStoreGetCategories();
    for (const cat of categories) {
      // Use cast to 'any' to bypass strict type checking during migration
      const c = cat as any;
      const { error } = await supabase.from('categories').upsert({
        id: c.id,
        name: c.name,
        description: c.description || null,
        category_no: c.categoryNo || null,
        parent_id: c.parentId || null,
        status: 'active',
        updated_at: new Date().toISOString()
      });
      if (!error) results.categories++;
      else console.error(`Failed to migrate category ${c.id}:`, error.message);
    }

    // 2. Migrate Materials
    const { materials } = jsonStoreGetMaterials({ limit: 1000 });
    for (const mat of materials) {
      const m = mat as any;
      const { error } = await supabase.from('materials').upsert({
        id: m.id,
        material_id: m.materialId,
        title: m.title,
        creator: m.creator || null,
        description: m.description || null,
        date: m.date || null,
        category_id: m.categoryId || null,
        access: m.access || 'public',
        status: m.status || 'published',
        file_url: m.fileUrl || null,
        thumbnail_url: m.thumbnailUrl || null,
        updated_at: new Date().toISOString()
      });
      if (!error) results.materials++;
      else console.error(`Failed to migrate material ${m.id}:`, error.message);
    }

    res.json({ 
      message: "Migration completed for available local data types.", 
      results,
      note: "Announcements and Feedbacks are currently in memory only and were not migrated. Please create new ones in the UI."
    });
  } catch (err: any) {
    console.error("Migration error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
