import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId, generateMaterialId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

function formatMaterial(m: any, categoryName?: string) {
  const catName = categoryName || m.categoryName || "Uncategorized";
  const idValue = m.id || m.materialId || m.material_id;
  return {
    ...m,
    id: idValue,
    uniqueId: m.materialId || m.material_id || m.id,
    materialId: m.materialId || m.material_id || m.id,
    categoryName: catName,
    hierarchyPath: m.hierarchy_path || `HCDC > ${catName} > General Series`,
  };
}

function materialSeqFromMaterialId(materialId: string) {
  const match = materialId.match(/^(\d{2})iA(\d{2})(\d{7})$/);
  if (!match) return null;
  return Number(match[3]);
}

router.get("/materials", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(1000, parseInt(req.query.limit as string) || 50);
  const search = req.query.search as string;
  const access = req.query.access as string;
  const categoryId = req.query.category as string;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  console.log("Supabase Connection Check:");
  console.log("- URL:", supabaseUrl ? "Present (" + supabaseUrl.substring(0, 15) + "...)" : "MISSING");
  console.log("- Service Key:", supabaseServiceKey ? "Present" : "MISSING");

  try {
    let query = supabase.from('materials').select('*', { count: 'exact' });

    const userRole = (req as any).user?.role;
    const isPrivileged = userRole === "admin" || userRole === "archivist";

    if (!isPrivileged) {
      query = query.eq('status', 'published');
    }

    if (access && ["public", "restricted", "confidential"].includes(access)) {
      query = query.eq('access', access);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,material_id.ilike.%${search}%,creator.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const { data: categories } = await supabase.from('categories').select('id, name');
    const catMap = Object.fromEntries((categories || []).map(c => [c.id, c.name]));

    const materials = (rows || []).map((m) => formatMaterial(m, m.category_id ? catMap[m.category_id] : undefined));
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({ materials, total, page, limit, totalPages });
  } catch (err: any) {
    console.error("Supabase materials fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch materials from Supabase" });
  }
});

router.post("/materials", requireAuth, async (req, res) => {
  const user = req.user!;
  const body = req.body;
  const payloadSize = JSON.stringify(body).length;
  console.log(`Processing POST /materials, payload size: ${payloadSize} bytes`);

  if (!body.title) { res.status(400).json({ error: "Title required" }); return; }
  try {
    const { data: categories } = await supabase.from('categories').select('*');
    const cats = categories || [];
    const cat = body.categoryId ? cats.find((c: any) => c.id === body.categoryId) : cats[0];
    const catNo = cat ? Number((cat as any).category_no) : 1;

    const { data: existingMats } = await supabase
      .from('materials')
      .select('material_id')
      .eq('category_id', body.categoryId);
    
    const maxSeq = (existingMats || []).reduce((acc, m) => {
      const seq = materialSeqFromMaterialId(m.material_id || "");
      return seq == null ? acc : Math.max(acc, seq);
    }, 0);
    
    const seqNo = maxSeq + 1;
    let materialId = body.materialId || body.uniqueId || generateMaterialId(catNo, seqNo);
    
    // Safety check: ensure material_id is truly unique to avoid 500 errors
    const { data: collisionCheck } = await supabase.from('materials').select('id').eq('material_id', materialId).maybeSingle();
    if (collisionCheck) {
      // If it collides, force uniqueness by appending a random UUID segment
      const crypto = await import("crypto");
      const randomSuffix = crypto.randomUUID().split("-")[0];
      materialId = `${materialId}-${randomSuffix}`;
    }

    const id = body.id || materialId || crypto.randomUUID();
    const now = new Date().toISOString();

    const newMat: any = {
      id,
      material_id: materialId,
      title: body.title,
      alt_title: body.altTitle ?? null,
      creator: body.creator ?? null,
      description: body.description ?? null,
      date: body.date ?? null,
      category_id: body.categoryId ?? (cat as any)?.id ?? null,
      hierarchy_path: body.hierarchyPath || `HCDC > ${(cat as any)?.name || "Uncategorized"} > General Series`,
      access: body.access || "public",
      format: body.format ?? null,
      file_size: body.fileSize ?? null,
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
      archival_history: body.archivalHistory ?? null,
      custodial_history: body.custodialHistory ?? null,
      accession_no: body.accessionNo ?? null,
      scope_content: body.scopeContent ?? null,
      arrangement: body.arrangement ?? null,
      sha256: body.sha256 ?? null,
      scanner: body.scanner ?? null,
      resolution: body.resolution ?? null,
      physical_location: body.physicalLocation ?? null,
      physical_condition: body.physicalCondition ?? null,
      binding_type: body.bindingType ?? null,
      level_of_description: body.levelOfDescription ?? "Item",
      extent_and_medium: body.extentAndMedium ?? null,
      reference_code: body.referenceCode ?? materialId,
      date_of_description: body.dateOfDescription ?? null,
      access_conditions: body.accessConditions ?? null,
      reproduction_conditions: body.reproductionConditions ?? null,
      terms_of_use: body.termsOfUse ?? null,
      notes: body.notes ?? null,
      points_of_access: body.pointsOfAccess ?? null,
      location_of_originals: body.locationOfOriginals ?? null,
      location_of_copies: body.locationOfCopies ?? null,
      related_units: body.relatedUnits ?? null,
      publication_note: body.publicationNote ?? null,
      finding_aids: body.findingAids ?? null,
      rules_or_conventions: body.rulesOrConventions ?? null,
      archivist_note: body.archivistNote ?? null,
      cataloger: user.name,
      date_cataloged: now.split("T")[0],
      sip_id: body.sipId || null,
      aip_id: body.aipId || null,
      ingest_date: now.split("T")[0],
      ingest_by: user.name,
      fixity_status: body.sha256 ? "verified" : null,
      preferred_citation: body.preferredCitation || null,
      file_url: body.fileUrl ?? null,
      thumbnail_url: body.thumbnailUrl ?? null,
      status: user.role === "admin" ? "published" : "pending",
      created_by: user.userId,
      created_at: now,
      updated_at: now,
    };

    let chunks: string[] = [];
    if (newMat.file_url === "CHUNKED") {
      newMat.is_file_chunked = true;
      // We don't know the exact count yet if frontend is handling it, but we set it true
      newMat.chunks_count = body.chunksCount || 0; 
    } else if (newMat.file_url && newMat.file_url.length > 800000) {
      const fullStr = newMat.file_url;
      const chunkSize = 800000;
      for (let i = 0; i < fullStr.length; i += chunkSize) {
        chunks.push(fullStr.substring(i, i + chunkSize));
      }
      newMat.file_url = "CHUNKED";
      newMat.is_file_chunked = true;
      newMat.chunks_count = chunks.length;
    }

    const pageImages = (body.pageImages && Array.isArray(body.pageImages)) ? body.pageImages : [];
    if (pageImages.length > 0) {
      newMat.has_page_images = true;
      newMat.page_count = pageImages.length;
    } else if (body.hasPageImages) {
      newMat.has_page_images = true;
      newMat.page_count = body.pageCount || 0;
    }

    const { data: newMatResult, error: mainError } = await supabase.from('materials').insert(newMat).select().single();
    if (mainError) {
      console.error("Supabase error during material insert:", mainError);
      throw mainError;
    }

    if (chunks.length > 0) {
      for (let i = 0; i < chunks.length; i++) {
        await supabase.from('material_chunks').insert({
          material_id: id,
          chunk_index: i,
          data: chunks[i]
        });
      }
    }

    if (pageImages.length > 0) {
      for (let i = 0; i < pageImages.length; i++) {
        await supabase.from('material_pages').insert({
          material_id: id,
          page_index: i,
          data: pageImages[i]
        });
      }
    }

    logAudit({ 
      action: "CREATE_MATERIAL", 
      entityType: "material", 
      entityId: id, 
      userId: user.userId, 
      userName: user.name, 
      details: `Created material: ${body.title}` 
    }).catch(auditErr => console.warn("Audit log failed:", auditErr.message));

    const catName = body.categoryId ? (cats.find((c: any) => c.id === body.categoryId) as any)?.name : undefined;
    res.status(201).json(formatMaterial(newMatResult, catName));
  } catch (err: any) {
    console.error("Supabase material creation failed!");
    console.error("Error Message:", err.message);
    console.error("Error Details:", err);
    
    let userHint = "Please check your Supabase server logs.";
    if (err.message?.includes("column") && err.message?.includes("does not exist")) {
      userHint = "DATABASE SCHEMA MISMATCH: Your Supabase 'materials' table is missing new columns (is_file_chunked, chunks_count, etc.). Please run the updated supabase_schema.sql in your Supabase SQL Editor.";
    } else if (err.message?.includes("relation") && err.message?.includes("does not exist")) {
      userHint = "DATABASE TABLE MISSING: One of the required tables (materials, material_chunks, material_pages) was not found. Please run the full supabase_schema.sql script.";
    } else if (err.code === '23503') {
      userHint = "FOREIGN KEY VIOLATION: A referenced record (like category or profile) does not exist.";
    } else if (err.code === '23505') {
      userHint = "UNIQUE CONSTRAINT VIOLATION: A material with this ID or Reference Code already exists. Please refresh and try a different code.";
    }

    res.status(500).json({ 
      error: `Failed to create material in Supabase: ${err.message}`, 
      message: err.message,
      details: err.details,
      hint: userHint,
      code: err.code
    });
  }
});

router.get("/materials/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const { data: m, error } = await supabase
      .from('materials')
      .select('*')
      .or(`id.eq.${id},material_id.eq.${id}`)
      .single();

    if (error || !m) {
      res.status(404).json({ error: "Material not found" });
      return;
    }

    // Reconstruct chunked fileUrl
    if ((m as any).is_file_chunked) {
      const { data: chunks, error: chunksErr } = await supabase
        .from('material_chunks')
        .select('data')
        .eq('material_id', m.id)
        .order('chunk_index', { ascending: true });
      
      if (!chunksErr && chunks) {
        m.file_url = chunks.map(c => c.data).join("");
      }
    }

    // Fetch page images
    const { data: pages } = await supabase
      .from('material_pages')
      .select('data, page_index')
      .eq('material_id', m.id)
      .order('page_index', { ascending: true });
    
    if (pages && pages.length > 0) {
      (m as any).pageImages = pages.map(p => p.data);
      (m as any).hasPageImages = true;
    }

    const { data: cat } = await supabase.from('categories').select('name').eq('id', m.category_id).single();
    
    // Fetch related materials
    const { data: related } = await supabase
      .from('materials')
      .select('*')
      .eq('category_id', m.category_id)
      .neq('id', m.id)
      .limit(4)
      .order('created_at', { ascending: false });

    res.json({
      ...formatMaterial(m, cat?.name),
      relatedItems: (related || []).map(r => formatMaterial(r, cat?.name))
    });
  } catch (err: any) {
    console.error("Supabase material retrieval failed:", err.message);
    res.status(500).json({ error: "Failed to retrieve material" });
  }
});

router.put("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const body = req.body;
  try {
    const { data: existing, error: fetchErr } = await supabase.from('materials').select('*').or(`id.eq.${id},material_id.eq.${id}`).single();
    if (fetchErr || !existing) { res.status(404).json({ error: "Material not found" }); return; }

    const updateData: any = {
      title: body.title ?? existing.title,
      alt_title: body.altTitle ?? existing.alt_title,
      creator: body.creator ?? existing.creator,
      description: body.description ?? existing.description,
      date: body.date ?? existing.date,
      category_id: body.categoryId ?? existing.category_id,
      hierarchy_path: body.hierarchyPath ?? existing.hierarchy_path,
      access: body.access ?? existing.access,
      format: body.format ?? existing.format,
      file_size: body.fileSize ?? existing.file_size,
      pages: body.pages ?? existing.pages,
      language: body.language ?? existing.language,
      publisher: body.publisher ?? existing.publisher,
      file_url: body.fileUrl ?? existing.file_url,
      thumbnail_url: body.thumbnailUrl ?? existing.thumbnail_url,
      status: body.status ?? existing.status,
      updated_at: new Date().toISOString(),
    };

    if (body.fileUrl === "CHUNKED") {
      updateData.is_file_chunked = true;
      updateData.chunks_count = body.chunksCount || 0;
    } else if (body.fileUrl && body.fileUrl.length > 800000 && body.fileUrl !== "CHUNKED") {
      await supabase.from('material_chunks').delete().eq('material_id', existing.id);
      const fullStr = body.fileUrl;
      const chunkSize = 800000;
      let chunksCount = 0;
      for (let i = 0; i < fullStr.length; i += chunkSize) {
        await supabase.from('material_chunks').insert({
          material_id: existing.id, chunk_index: chunksCount, data: fullStr.substring(i, i + chunkSize)
        });
        chunksCount++;
      }
      updateData.file_url = "CHUNKED";
      updateData.is_file_chunked = true;
      updateData.chunks_count = chunksCount;
    }

    if (body.pageImages && Array.isArray(body.pageImages)) {
      await supabase.from('material_pages').delete().eq('material_id', existing.id);
      for (let i = 0; i < body.pageImages.length; i++) {
        await supabase.from('material_pages').insert({
          material_id: existing.id, page_index: i, data: body.pageImages[i]
        });
      }
      updateData.has_page_images = true;
      updateData.page_count = body.pageImages.length;
    } else if (body.hasPageImages !== undefined) {
      updateData.has_page_images = body.hasPageImages;
      if (body.pageCount !== undefined) {
        updateData.page_count = body.pageCount;
      }
    }

    const { error } = await supabase.from('materials').update(updateData).eq('id', existing.id);
    if (error) throw error;

    await logAudit({ action: "UPDATE_MATERIAL", entityType: "material", entityId: existing.id, userId: user.userId, userName: user.name, details: `Updated material: ${existing.title}` });
    res.json({ message: "Material updated successfully" });
  } catch (err: any) {
    console.error("Supabase material update failed:", err.message);
    res.status(500).json({ error: "Failed to update material" });
  }
});

router.delete("/materials/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { data: existing } = await supabase.from('materials').select('id, title').or(`id.eq.${id},material_id.eq.${id}`).single();
    if (!existing) { res.json({ message: "Material already deleted" }); return; }

    await supabase.from('materials').delete().eq('id', existing.id);
    await logAudit({ action: "DELETE_MATERIAL", entityType: "material", entityId: existing.id, userId: user.userId, userName: user.name, details: `Deleted material: ${existing.title}` });
    res.json({ message: "Material deleted successfully" });
  } catch (err: any) {
    console.error("Supabase material delete failed:", err.message);
    res.status(500).json({ error: "Failed to delete material" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const [
      { count: matCount },
      { count: catCount },
      { count: userCount },
      { count: pendingReqs },
      { count: pendingUsers },
      { data: recentActivity }
    ] = await Promise.all([
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    res.json({
      totalMaterials: matCount || 0,
      totalCategories: catCount || 0,
      totalUsers: userCount || 0,
      pendingRequests: pendingReqs || 0,
      pendingUsers: pendingUsers || 0,
      recentActivity: recentActivity || [],
    });
  } catch (err: any) {
    console.error("Supabase stats failed:", err.message);
    res.status(500).json({ error: "Failed to fetch stats from Supabase" });
  }
});

// Added chunking and paging helpers for direct use from frontend if needed
router.post("/materials/:id/pages", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { pageIndex, data } = req.body;
  try {
    await supabase.from('material_pages').insert({ material_id: id, page_index: pageIndex, data });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/materials/:id/file/chunks", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { chunkIndex, data } = req.body;
  try {
    await supabase.from('material_chunks').insert({ material_id: id, chunk_index: chunkIndex, data });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
