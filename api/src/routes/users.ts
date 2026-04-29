import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logAudit } from "./audit.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

function formatUser(u: any) {
  return { 
    id: u.id, 
    name: u.name, 
    email: u.email, 
    role: u.role, 
    userCategory: u.user_category || u.role, 
    institution: u.institution, 
    status: u.status, 
    createdAt: u.created_at,
    purpose: u.purpose || null
  };
}

router.get("/users", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 50;
  const status = req.query.status as string;
  try {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (status && ["pending", "active", "inactive", "rejected"].includes(status)) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    res.json({ users: (users || []).map(formatUser), total, page, totalPages });
  } catch (err: any) {
    console.error("Supabase users fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const { data: u, error: fetchErr } = await supabase.from('profiles').select('name').eq('id', id).single();
    if (fetchErr || !u) { res.status(404).json({ error: "User not found" }); return; }

    const { error } = await supabase.from('profiles').update({ status: "active", updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;

    await logAudit({ action: "APPROVE_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Approved user: ${u.name}` });
    res.json({ message: "User approved" });
  } catch (err: any) {
    console.error("Supabase approve user failed:", err.message);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

router.post("/users/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  const { reason } = req.body || {};
  try {
    const { data: u, error: fetchErr } = await supabase.from('profiles').select('name').eq('id', id).single();
    if (fetchErr || !u) { res.status(404).json({ error: "User not found" }); return; }

    const { error } = await supabase.from('profiles').update({ status: "rejected", updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;

    await logAudit({ action: "REJECT_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Rejected user: ${u.name}${reason ? ` — Reason: ${reason}` : ""}` });
    res.json({ message: "User rejected" });
  } catch (err: any) {
    console.error("Supabase reject user failed:", err.message);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const { data: u, error: fetchErr } = await supabase.from('profiles').select('name').eq('id', id).single();
    if (fetchErr || !u) { res.status(404).json({ error: "User not found" }); return; }

    // Delete from Supabase Auth (this cascades to profiles via ON DELETE CASCADE)
    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (authErr) {
      // If auth delete fails, try deleting just the profile
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    }

    await logAudit({ action: "DELETE_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Deleted user: ${u.name}` });
    res.json({ message: "User deleted" });
  } catch (err: any) {
    console.error("Supabase delete user failed:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const { name, email, password, role, userCategory, institution, purpose } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password, and role are required" });
    return;
  }

  try {
    // 1. Create in Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role || "archivist",
        institution: institution || "HCDC",
        purpose: purpose || null,
      },
    });

    if (authErr) throw authErr;

    // 2. Update the auto-created profile to be active (admin-created = auto-active)
    const uid = authData.user.id;
    await supabase.from('profiles').update({
      status: "active",
      user_category: userCategory || role || "staff",
    }).eq('id', uid);

    // 3. Audit Log
    await logAudit({
      action: "CREATE_USER",
      entityType: "user",
      entityId: uid,
      userId: admin.userId,
      userName: admin.name,
      details: `Created new ${role} account: ${name} (${email})`,
    });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
    res.status(201).json(formatUser(profile || { id: uid, name, email, role, status: "active", created_at: new Date().toISOString() }));
  } catch (err: any) {
    console.error("Admin Create User Error:", err.message);
    if (/email already/i.test(err.message) || /already been registered/i.test(err.message)) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create user account" });
  }
});

export default router;
