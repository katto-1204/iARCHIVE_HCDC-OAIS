import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/announcements", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const announcements = (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      date: a.date,
      type: a.type,
      isActive: a.is_active,
      likes: a.likes || [],
      comments: a.comments || [],
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    res.json(announcements);
  } catch (err: any) {
    console.error("Supabase announcements fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const { title, content, isActive } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase.from('announcements').insert({
      title,
      content,
      date: now.split('T')[0],
      type: 'General',
      is_active: isActive !== false,
      likes: [],
      comments: [],
    }).select().single();

    if (error) throw error;

    await logAudit({ action: "CREATE_ANNOUNCEMENT", entityType: "announcement", entityId: data.id, userId: user.userId, userName: user.name, details: `Created announcement: ${title}` });
    res.status(201).json({ ...data, isActive: data.is_active, createdAt: data.created_at, likes: data.likes || [], comments: data.comments || [] });
  } catch (err: any) {
    console.error("Supabase announcement create failed:", err.message);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

router.post("/announcements/:id/like", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { data: ann, error: fetchErr } = await supabase.from('announcements').select('likes').eq('id', id).single();
    if (fetchErr || !ann) { res.status(404).json({ error: "Announcement not found" }); return; }

    const likes: string[] = Array.isArray(ann.likes) ? ann.likes : [];
    const newLikes = likes.includes(user.userId)
      ? likes.filter((uid: string) => uid !== user.userId)
      : [...likes, user.userId];

    const { error } = await supabase.from('announcements').update({ likes: newLikes }).eq('id', id);
    if (error) throw error;

    res.json({ likes: newLikes });
  } catch (err: any) {
    console.error("Supabase like update failed:", err.message);
    res.status(500).json({ error: "Failed to update like" });
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
    const { data: ann, error: fetchErr } = await supabase.from('announcements').select('comments').eq('id', id).single();
    if (fetchErr || !ann) { res.status(404).json({ error: "Announcement not found" }); return; }

    const comments = Array.isArray(ann.comments) ? ann.comments : [];
    const newComments = [...comments, comment];

    const { error } = await supabase.from('announcements').update({ comments: newComments }).eq('id', id);
    if (error) throw error;

    res.json(comment);
  } catch (err: any) {
    console.error("Supabase comment update failed:", err.message);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.delete("/announcements/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const { data: ann, error: fetchErr } = await supabase.from('announcements').select('title').eq('id', id).single();
    if (fetchErr || !ann) { res.status(404).json({ error: "Announcement not found" }); return; }

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;

    await logAudit({ action: "DELETE_ANNOUNCEMENT", entityType: "announcement", entityId: id, userId: user.userId, userName: user.name, details: `Deleted announcement: ${ann.title}` });
    res.json({ message: "Announcement deleted" });
  } catch (err: any) {
    console.error("Supabase announcement delete failed:", err.message);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

export default router;
