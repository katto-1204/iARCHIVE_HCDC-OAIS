import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/feedback", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const feedbacks = (data || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      message: f.message,
      rating: f.rating,
      type: f.type,
      status: f.status,
      read: f.read,
      createdAt: f.created_at,
    }));

    res.json(feedbacks);
  } catch (err: any) {
    console.error("Supabase feedback fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

router.post("/feedback", async (req, res) => {
  const { name, email, message, rating, type } = req.body;
  if (!message) { res.status(400).json({ error: "Message is required" }); return; }
  try {
    const { data, error } = await supabase.from('feedbacks').insert({
      name: name || "Anonymous",
      email: email || null,
      message,
      rating: rating ?? null,
      type: type || "general",
      status: "unread",
      read: false,
    }).select().single();

    if (error) throw error;

    res.status(201).json({ ...data, createdAt: data.created_at });
  } catch (err: any) {
    console.error("Supabase feedback create failed:", err.message);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

router.patch("/feedback/:id", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const id = String(req.params.id);
  const updates = req.body;
  try {
    const { data, error } = await supabase.from('feedbacks').update({
      ...updates,
    }).eq('id', id).select().single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Feedback not found" }); return; }

    res.json({ ...data, createdAt: data.created_at });
  } catch (err: any) {
    console.error("Supabase feedback patch failed:", err.message);
    res.status(500).json({ error: "Failed to update feedback" });
  }
});

router.delete("/feedback/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  try {
    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: "Feedback deleted" });
  } catch (err: any) {
    console.error("Supabase feedback delete failed:", err.message);
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

export default router;
