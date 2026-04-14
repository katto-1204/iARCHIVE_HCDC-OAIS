import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { getFirestoreDb } from "../lib/firebase.js";

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
    const db = getFirestoreDb();
    const id = generateId();
    await db.collection("auditLogs").doc(id).set({
      id,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      userId: data.userId ?? null,
      userName: data.userName ?? null,
      details: data.details ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn("Audit log skipped (fallback not configured):", data.action, err.message);
  }
}

router.get("/audit", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection("auditLogs").orderBy("createdAt", "desc").get();
    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = logs.slice(offset, offset + limit);
    res.json({ logs: pageItems, total, page, totalPages });
  } catch (err: any) {
    // If DB fails, return empty logs so the UI doesn't crash
    res.json({ logs: [], total: 0, page: 1, totalPages: 1 });
  }
});

export default router;
