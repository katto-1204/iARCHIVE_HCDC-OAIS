import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { getFirestoreDb } from "../lib/firebase.js";

const router = Router();

// In-memory fallback announcements
let memoryAnnouncements: any[] = [
  { id: "ann-1", title: "Welcome to iArchive!", content: "HCDC's digital repository is now live. Browse public collections or request access to restricted materials.", isActive: true, createdAt: new Date().toISOString() },
  { id: "ann-2", title: "System Maintenance Notice", content: "Scheduled maintenance this weekend. The archive will be briefly unavailable Saturday 2-4 AM.", isActive: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

router.get("/announcements", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(announcements);
  } catch {
    res.json(memoryAnnouncements);
  }
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const { title, content, isActive } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const id = generateId();
  const now = new Date().toISOString();
  const ann = { id, title, content, isActive: isActive !== false, createdBy: user.userId, createdAt: now, updatedAt: now };
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    await db.collection("announcements").doc(id).set(ann);
    await logAudit({ action: "CREATE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Created announcement: ${title}` });
    res.status(201).json(ann);
  } catch {
    memoryAnnouncements.unshift(ann);
    res.status(201).json(ann);
  }
});

router.delete("/announcements/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("announcements").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Announcement not found" }); return; }
    const ann = snap.data() as any;
    await db.collection("announcements").doc(id).delete();
    await logAudit({ action: "DELETE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Deleted announcement: ${ann.title}` });
    res.json({ message: "Announcement deleted" });
  } catch {
    const idx = memoryAnnouncements.findIndex((a) => a.id === id);
    if (idx >= 0) memoryAnnouncements.splice(idx, 1);
    res.json({ message: "Announcement deleted" });
  }
});

export default router;
