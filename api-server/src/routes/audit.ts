import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();

export async function logAudit(data: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
}) {
  await db.insert(auditLogsTable).values({
    id: generateId(),
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.userId,
    userName: data.userName,
    details: data.details,
  });
}

router.get("/audit", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;
  const [{ count: total }] = await db.select({ count: count() }).from(auditLogsTable);
  const logs = await db.select().from(auditLogsTable).orderBy(sql`${auditLogsTable.createdAt} desc`).limit(limit).offset(offset);
  res.json({ logs, total: Number(total), page, totalPages: Math.ceil(Number(total) / limit) });
});

export default router;
