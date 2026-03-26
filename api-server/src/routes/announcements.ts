import { Router } from "express";
import { db, announcementsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";

const router = Router();

router.get("/announcements", async (_req, res) => {
  const announcements = await db.select().from(announcementsTable).orderBy(sql`${announcementsTable.createdAt} desc`);
  res.json(announcements);
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const { title, content, isActive } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const id = generateId();
  await db.insert(announcementsTable).values({ id, title, content, isActive: isActive !== false, createdBy: user.userId });
  await logAudit({ action: "CREATE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Created announcement: ${title}` });
  const [newAnn] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, id)).limit(1);
  res.status(201).json(newAnn);
});

router.delete("/announcements/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const [ann] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, id)).limit(1);
  if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  await logAudit({ action: "DELETE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Deleted announcement: ${ann.title}` });
  res.json({ message: "Announcement deleted" });
});

export default router;
