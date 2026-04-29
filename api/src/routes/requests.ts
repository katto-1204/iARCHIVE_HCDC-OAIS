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

export default router;
