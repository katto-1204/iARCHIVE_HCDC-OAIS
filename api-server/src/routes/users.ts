import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, count, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logAudit } from "./audit.js";
import { jsonStoreApproveUser, jsonStoreDeleteUser, jsonStoreGetUsers, jsonStoreRejectUser } from "../lib/jsonStore.js";

const router = Router();

function formatUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, userCategory: u.userCategory, institution: u.institution, status: u.status, createdAt: u.createdAt };
}

router.get("/users", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  try {
    const conditions: any[] = [];
    if (status && ["pending", "active", "inactive", "rejected"].includes(status)) {
      conditions.push(eq(usersTable.status, status as any));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ count: total }] = await db.select({ count: count() }).from(usersTable).where(where);
    const users = await db.select().from(usersTable).where(where).orderBy(sql`${usersTable.createdAt} desc`).limit(limit).offset(offset);
    res.json({ users: users.map(formatUser), total: Number(total), page, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    res.json(jsonStoreGetUsers({ status, page }));
  }
});

router.post("/users/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    await db.update(usersTable).set({ status: "active", updatedAt: new Date() }).where(eq(usersTable.id, id));
    await logAudit({ action: "APPROVE_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Approved user: ${u.name}` });
    res.json({ message: "User approved" });
  } catch {
    const ok = jsonStoreApproveUser(id);
    if (!ok) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User approved" });
  }
});

router.post("/users/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    await db.update(usersTable).set({ status: "rejected", updatedAt: new Date() }).where(eq(usersTable.id, id));
    await logAudit({ action: "REJECT_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Rejected user: ${u.name}` });
    res.json({ message: "User rejected" });
  } catch {
    const ok = jsonStoreRejectUser(id);
    if (!ok) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User rejected" });
  }
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    await logAudit({ action: "DELETE_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Deleted user: ${u.name}` });
    res.json({ message: "User deleted" });
  } catch {
    const ok = jsonStoreDeleteUser(id);
    if (!ok) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User deleted" });
  }
});

export default router;
