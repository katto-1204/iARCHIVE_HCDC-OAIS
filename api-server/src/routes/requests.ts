import { Router } from "express";
import { db, accessRequestsTable, materialsTable, usersTable } from "@workspace/db";
import { eq, count, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import {
  jsonStoreApproveAccessRequest,
  jsonStoreGetAccessRequests,
  jsonStoreRejectAccessRequest,
  jsonStoreSubmitAccessRequest,
} from "../lib/jsonStore.js";

const router = Router();

async function formatRequest(r: any) {
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, r.materialId)).limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
  return {
    id: r.id,
    materialId: r.materialId,
    materialTitle: material?.title || "Unknown",
    userId: r.userId,
    userName: user?.name || "Unknown",
    userEmail: user?.email || "Unknown",
    purpose: r.purpose,
    status: r.status,
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

router.get("/requests", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  const user = req.user!;

  try {
    const conditions: any[] = [];
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(accessRequestsTable.status, status as any));
    }
    if (user.role === "student" || user.role === "researcher" || user.role === "alumni" || user.role === "public") {
      conditions.push(eq(accessRequestsTable.userId, user.userId));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ count: total }] = await db.select({ count: count() }).from(accessRequestsTable).where(where);
    const rows = await db.select().from(accessRequestsTable).where(where).orderBy(sql`${accessRequestsTable.createdAt} desc`).limit(limit).offset(offset);
    const formatted = await Promise.all(rows.map(formatRequest));
    res.json({ requests: formatted, total: Number(total), page, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    const role = user.role;
    const selfRoles = ["student", "researcher", "alumni", "public"];
    const userId = selfRoles.includes(role) ? user.userId : undefined;
    res.json(jsonStoreGetAccessRequests({ status, page, userId, role }));
  }
});

router.post("/requests", requireAuth, async (req, res) => {
  const user = req.user!;
  const { materialId, purpose } = req.body;
  if (!materialId || !purpose) { res.status(400).json({ error: "Material and purpose required" }); return; }
  try {
    const id = generateId();
    await db.insert(accessRequestsTable).values({ id, materialId, userId: user.userId, purpose, status: "pending" });
    await logAudit({ action: "SUBMIT_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Submitted access request for material: ${materialId}` });
    const [newReq] = await db.select().from(accessRequestsTable).where(eq(accessRequestsTable.id, id)).limit(1);
    res.status(201).json(await formatRequest(newReq));
  } catch {
    const created = jsonStoreSubmitAccessRequest({
      materialId,
      purpose,
      userId: user.userId,
      userName: user.name,
    });
    if (!created) {
      res.status(500).json({ error: "Failed to submit access request" });
      return;
    }
    res.status(201).json(created);
  }
});

router.post("/requests/:id/approve", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const [req_] = await db.select().from(accessRequestsTable).where(eq(accessRequestsTable.id, id)).limit(1);
    if (!req_) { res.status(404).json({ error: "Request not found" }); return; }
    await db.update(accessRequestsTable).set({ status: "approved", reviewedBy: user.userId, updatedAt: new Date() }).where(eq(accessRequestsTable.id, id));
    await logAudit({ action: "APPROVE_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Approved access request` });
    res.json({ message: "Request approved" });
  } catch {
    const ok = jsonStoreApproveAccessRequest(id);
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Request approved" });
  }
});

router.post("/requests/:id/reject", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { reason } = req.body;
  try {
    const [req_] = await db.select().from(accessRequestsTable).where(eq(accessRequestsTable.id, id)).limit(1);
    if (!req_) { res.status(404).json({ error: "Request not found" }); return; }
    await db.update(accessRequestsTable).set({ status: "rejected", rejectionReason: reason, reviewedBy: user.userId, updatedAt: new Date() }).where(eq(accessRequestsTable.id, id));
    await logAudit({ action: "REJECT_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Rejected access request: ${reason}` });
    res.json({ message: "Request rejected" });
  } catch {
    const ok = jsonStoreRejectAccessRequest({ id, reason });
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Request rejected" });
  }
});

export default router;
