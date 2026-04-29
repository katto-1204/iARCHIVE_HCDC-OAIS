import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

export async function logAudit(data: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
}) {
  try {
    await supabase.from('audit_logs').insert({
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId ?? null,
      user_id: data.userId ?? null,
      user_name: data.userName ?? null,
      details: data.details ?? null,
    });
  } catch (err: any) {
    console.warn("Audit log skipped:", data.action, err.message);
  }
}

router.get("/audit", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    res.json({ logs: data || [], total, page, totalPages });
  } catch (err: any) {
    console.error("Supabase audit fetch failed:", err.message);
    res.json({ logs: [], total: 0, page: 1, totalPages: 1 });
  }
});

export default router;
