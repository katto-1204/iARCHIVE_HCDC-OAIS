import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

async function formatRequest(r: any) {
  let materialTitle = "Unknown";
  let userName = "Unknown";
  let userEmail = "Unknown";

  try {
    if (r.material_id) {
      const { data: mat } = await supabase.from('materials').select('title').eq('id', r.material_id).single();
      if (mat) materialTitle = mat.title || "Unknown";
    }
    if (r.user_id) {
      const { data: user } = await supabase.from('profiles').select('name, email').eq('id', r.user_id).single();
      if (user) {
        userName = user.name || "Unknown";
        userEmail = user.email || "Unknown";
      }
    }
  } catch {
    // Continue with default values
  }

  return {
    id: r.id,
    materialId: r.material_id,
    materialTitle,
    userId: r.user_id,
    userName,
    userEmail,
    purpose: r.purpose,
    status: r.status,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

router.get("/requests", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const status = req.query.status as string;
  const user = req.user!;

  try {
    let query = supabase.from('access_requests').select('*', { count: 'exact' });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq('status', status);
    }

    const selfRoles = ["student", "researcher", "alumni", "public"];
    if (selfRoles.includes(user.role)) {
      query = query.eq('user_id', user.userId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const formatted = await Promise.all((rows || []).map(formatRequest));

    res.json({ requests: formatted, total, page, totalPages });
  } catch (err: any) {
    console.error("Supabase requests fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.post("/requests", requireAuth, async (req, res) => {
  const user = req.user!;
  const { materialId, purpose } = req.body;
  if (!materialId || !purpose) { res.status(400).json({ error: "Material and purpose required" }); return; }
  try {
    const { data, error } = await supabase.from('access_requests').insert({
      material_id: materialId,
      user_id: user.userId,
      purpose,
      status: "pending",
    }).select().single();

    if (error) throw error;

    await logAudit({ action: "SUBMIT_REQUEST", entityType: "request", entityId: data.id, userId: user.userId, userName: user.name, details: `Submitted access request for material: ${materialId}` });
    res.status(201).json(await formatRequest(data));
  } catch (err: any) {
    console.error("Supabase request create failed:", err.message);
    res.status(500).json({ error: "Failed to submit access request" });
  }
});

router.post("/requests/:id/approve", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { error } = await supabase.from('access_requests').update({
      status: "approved",
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) throw error;

    await logAudit({ action: "APPROVE_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Approved access request` });
    res.json({ message: "Request approved" });
  } catch (err: any) {
    console.error("Supabase request approve failed:", err.message);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

router.post("/requests/:id/reject", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { reason } = req.body;
  try {
    const { error } = await supabase.from('access_requests').update({
      status: "rejected",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) throw error;

    await logAudit({ action: "REJECT_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Rejected access request: ${reason}` });
    res.json({ message: "Request rejected" });
  } catch (err: any) {
    console.error("Supabase request reject failed:", err.message);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

router.delete("/requests/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    // Check ownership
    const { data: reqData } = await supabase.from('access_requests').select('user_id').eq('id', id).single();
    if (!reqData) { res.status(404).json({ error: "Request not found" }); return; }
    if (reqData.user_id !== user.userId && user.role !== "admin" && user.role !== "archivist") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabase.from('access_requests').delete().eq('id', id);
    if (error) throw error;

    await logAudit({ action: "DELETE_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Deleted access request` });
    res.json({ message: "Request deleted" });
  } catch (err: any) {
    console.error("Supabase request delete failed:", err.message);
    res.status(500).json({ error: "Failed to delete request" });
  }
});

// ============================
// Ingest Requests Endpoints
// ============================

router.get("/ingest-requests", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const status = req.query.status as string;
  try {
    let query = supabase.from('ingest_requests').select('*');
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq('status', status);
    }
    const { data, error } = await query.order('requested_at', { ascending: false });
    if (error) throw error;
    res.json({ requests: data || [] });
  } catch (err: any) {
    console.error("Supabase ingest-requests fetch failed:", err.message);
    res.json({ requests: [] });
  }
});

router.post("/ingest-requests", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { materialId, materialTitle, hierarchyPath } = req.body;
  if (!materialId || !materialTitle) { res.status(400).json({ error: "Material ID and Title required" }); return; }
  try {
    const { data, error } = await supabase.from('ingest_requests').insert({
      material_id: materialId,
      material_title: materialTitle,
      hierarchy_path: hierarchyPath || "",
      requested_by: user.name || "Unknown",
      status: "pending",
    }).select().single();

    if (error) throw error;

    await logAudit({ action: "SUBMIT_INGEST", entityType: "request", entityId: data.id, userId: user.userId, userName: user.name, details: `Submitted ingest request for material: ${materialId}` });
    res.status(201).json(data);
  } catch (err: any) {
    console.error("Supabase ingest-request create failed:", err.message);
    res.status(500).json({ error: "Failed to submit ingest request" });
  }
});

router.post("/ingest-requests/:id/approve", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { data: reqData, error: fetchErr } = await supabase.from('ingest_requests').select('material_id').eq('id', id).single();
    if (fetchErr || !reqData) { res.status(404).json({ error: "Request not found" }); return; }

    await supabase.from('ingest_requests').update({ status: "approved" }).eq('id', id);

    // Also update the actual material status to 'published'
    if (reqData.material_id) {
      await supabase.from('materials').update({ status: "published", updated_at: new Date().toISOString() }).eq('id', reqData.material_id);
    }

    await logAudit({ action: "APPROVE_INGEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Approved ingest request and published material: ${reqData.material_id}` });
    res.json({ message: "Ingest request approved and material published" });
  } catch (err: any) {
    console.error("Supabase ingest approve failed:", err.message);
    res.status(500).json({ error: "Failed to approve ingest request" });
  }
});

router.post("/ingest-requests/:id/reject", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { error } = await supabase.from('ingest_requests').update({ status: "rejected" }).eq('id', id);
    if (error) throw error;

    await logAudit({ action: "REJECT_INGEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Rejected ingest request` });
    res.json({ message: "Ingest request rejected" });
  } catch (err: any) {
    console.error("Supabase ingest reject failed:", err.message);
    res.status(500).json({ error: "Failed to reject ingest request" });
  }
});

export default router;

