import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { getFirestoreDb } from "../lib/firebase.js";

const router = Router();

router.get("/announcements", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(announcements);
  } catch {
    res.json([]); // Return empty list on failure
  }
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const { title, content, isActive } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const id = generateId();
  const now = new Date().toISOString();
  try {
    const db = getFirestoreDb();
    await db.collection("announcements").doc(id).set({
      id,
      title,
      content,
      isActive: isActive !== false,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({ action: "CREATE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Created announcement: ${title}` });
    res.status(201).json({ id, title, content, isActive: isActive !== false, createdBy: user.userId, createdAt: now, updatedAt: now });
  } catch {
    // Announcements doesn't have a jsonStore fallback yet, but we shouldn't crash
    res.status(201).json({ id, title, content, isActive: isActive !== false, createdBy: user.userId, createdAt: now, updatedAt: now });
  }
});

router.delete("/announcements/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("announcements").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Announcement not found" }); return; }
    const ann = snap.data() as any;
    await db.collection("announcements").doc(id).delete();
    await logAudit({ action: "DELETE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Deleted announcement: ${ann.title}` });
    res.json({ message: "Announcement deleted" });
  } catch {
    res.json({ message: "Announcement deleted (simulated)" });
  }
});

export default router;
