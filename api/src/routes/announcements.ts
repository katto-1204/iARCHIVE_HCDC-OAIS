import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { getFirestoreDb } from "../lib/firebase.js";

const router = Router();

// In-memory fallback announcements
let memoryAnnouncements: any[] = [
  { id: "ann-1", title: "Welcome to iArchive!", content: "HCDC's digital repository is now live. Browse public collections or request access to restricted materials.", isActive: true, createdAt: new Date().toISOString(), likes: [], comments: [] },
  { id: "ann-2", title: "System Maintenance Notice", content: "Scheduled maintenance this weekend. The archive will be briefly unavailable Saturday 2-4 AM.", isActive: true, createdAt: new Date(Date.now() - 86400000).toISOString(), likes: [], comments: [] },
];

router.get("/announcements", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.log("[Announcements] Firebase DB not available, using memory fallback.");
      throw new Error("Firebase unavailable");
    }
    const snap = await db.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snap.docs.map((doc) => {
      const data = doc.data();
      return { 
        ...data,
        id: doc.id, 
        likes: data.likes || [], 
        comments: data.comments || []
      };
    });
    console.log(`[Announcements] Successfully fetched ${announcements.length} announcements from Firestore.`);
    res.json(announcements);
  } catch (err: any) {
    console.log(`[Announcements] GET error: ${err.message}. Serving memory announcements.`);
    res.json(memoryAnnouncements);
  }
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const { title, content, isActive } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const id = generateId();
  const now = new Date().toISOString();
  const ann = { id, title, content, isActive: isActive !== false, createdBy: user.userId, createdAt: now, updatedAt: now, likes: [], comments: [] };
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

router.post("/announcements/:id/like", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("announcements").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Announcement not found" }); return; }
    
    const data = snap.data() as any;
    const likes = Array.isArray(data.likes) ? data.likes : [];
    
    let newLikes;
    if (likes.includes(user.userId)) {
      newLikes = likes.filter((uid: string) => uid !== user.userId);
    } else {
      newLikes = [...likes, user.userId];
    }
    
    await db.collection("announcements").doc(id).update({ likes: newLikes });
    console.log(`[Announcements] Like updated for ${id}. New count: ${newLikes.length}`);
    res.json({ likes: newLikes });
  } catch (err: any) {
    console.log(`[Announcements] Like update error: ${err.message}. Falling back to memory.`);
    const ann = memoryAnnouncements.find(a => a.id === id);
    if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
    ann.likes = ann.likes || [];
    if (ann.likes.includes(user.userId)) {
      ann.likes = ann.likes.filter((uid: string) => uid !== user.userId);
    } else {
      ann.likes.push(user.userId);
    }
    res.json({ likes: ann.likes });
  }
});

router.post("/announcements/:id/comment", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { content } = req.body;
  if (!content) { res.status(400).json({ error: "Comment content required" }); return; }
  
  const comment = {
    id: generateId(),
    userId: user.userId,
    userName: user.name || "Anonymous",
    content,
    createdAt: new Date().toISOString()
  };

  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    
    const snap = await db.collection("announcements").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Announcement not found" }); return; }
    
    const data = snap.data() as any;
    const comments = Array.isArray(data.comments) ? data.comments : [];
    const newComments = [...comments, comment];
    
    await db.collection("announcements").doc(id).update({ comments: newComments });
    console.log(`[Announcements] Comment added to ${id} by ${user.name}. Total comments: ${newComments.length}`);
    res.json(comment);
  } catch (err: any) {
    console.log(`[Announcements] Comment update error: ${err.message}. Falling back to memory.`);
    const ann = memoryAnnouncements.find(a => a.id === id);
    if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
    ann.comments = ann.comments || [];
    ann.comments.push(comment);
    res.json(comment);
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
