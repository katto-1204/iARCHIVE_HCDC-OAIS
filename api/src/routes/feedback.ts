import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { getFirestoreDb } from "../lib/firebase.js";

const router = Router();

// In-memory fallback for when Firestore is unavailable
let memoryFeedbacks: any[] = [];

router.get("/feedback", async (_req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("feedback").orderBy("createdAt", "desc").get();
    const feedbacks = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(feedbacks);
  } catch {
    res.json(memoryFeedbacks);
  }
});

router.post("/feedback", async (req, res) => {
  const { name, email, message, rating, type } = req.body;
  if (!message) { res.status(400).json({ error: "Message is required" }); return; }
  const id = generateId();
  const now = new Date().toISOString();
  const feedback = {
    id,
    name: name || "Anonymous",
    email: email || null,
    message,
    rating: rating ?? null,
    type: type || "general",
    read: false,
    createdAt: now,
  };
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    await db.collection("feedback").doc(id).set(feedback);
    res.status(201).json(feedback);
  } catch {
    memoryFeedbacks.unshift(feedback);
    res.status(201).json(feedback);
  }
});

router.patch("/feedback/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const id = String(req.params.id);
  const updates = req.body;
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("feedback").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Feedback not found" }); return; }
    await db.collection("feedback").doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
    const updated = await db.collection("feedback").doc(id).get();
    res.json({ id, ...updated.data() });
  } catch {
    const idx = memoryFeedbacks.findIndex((f) => f.id === id);
    if (idx < 0) { res.status(404).json({ error: "Feedback not found" }); return; }
    memoryFeedbacks[idx] = { ...memoryFeedbacks[idx], ...updates };
    res.json(memoryFeedbacks[idx]);
  }
});

router.delete("/feedback/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase unavailable");
    const snap = await db.collection("feedback").doc(id).get();
    // Idempotent delete: if it's already gone, treat it as success to avoid noisy 404s in UI.
    if (!snap.exists) { res.json({ message: "Feedback already deleted" }); return; }
    await db.collection("feedback").doc(id).delete();
    res.json({ message: "Feedback deleted" });
  } catch {
    const idx = memoryFeedbacks.findIndex((f) => f.id === id);
    if (idx >= 0) memoryFeedbacks.splice(idx, 1);
    res.json({ message: idx >= 0 ? "Feedback deleted" : "Feedback already deleted" });
  }
});

export default router;
