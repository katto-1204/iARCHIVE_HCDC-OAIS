import { Router } from "express";
import { getFirestoreDb } from "../lib/firebase.js";
import { generateId } from "../lib/id.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection("feedback").get();
    const feedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid index requirements
    feedback.sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db2 - da;
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.json([]);
  }
});

router.post("/", async (req, res) => {
  const { type, message, name, email } = req.body;
  if (!type || !message) {
    return res.status(400).json({ error: "Type and message are required" });
  }

  try {
    const db = getFirestoreDb();
    const id = generateId();
    const now = new Date().toISOString();
    const newFeedback = {
      id,
      type,
      message,
      name: name || "Anonymous",
      email: email || "",
      date: now.split('T')[0],
      createdAt: now,
      status: "unread",
    };
    await db.collection("feedback").doc(id).set(newFeedback);
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getFirestoreDb();
    await db.collection("feedback").doc(id).update({ status: "read" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark feedback as read" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getFirestoreDb();
    await db.collection("feedback").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

export default router;
