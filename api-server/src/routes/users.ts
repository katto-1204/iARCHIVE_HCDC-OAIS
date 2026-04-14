import { Router } from "express";
import type { Query } from "firebase-admin/firestore";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logAudit } from "./audit.js";
import { jsonStoreApproveUser, jsonStoreDeleteUser, jsonStoreGetUsers, jsonStoreRejectUser } from "../lib/jsonStore.js";
import { getFirebaseAuth, getFirestoreDb } from "../lib/firebase.js";

const router = Router();

function formatUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, userCategory: u.userCategory, institution: u.institution, status: u.status, createdAt: u.createdAt };
}

router.get("/users", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const status = req.query.status as string;
  try {
    const db = getFirestoreDb();
    let query: Query = db.collection("users");
    if (status && ["pending", "active", "inactive", "rejected"].includes(status)) {
      query = query.where("status", "==", status);
    }
    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = users.slice(offset, offset + limit);
    res.json({ users: pageItems.map(formatUser), total, page, totalPages });
  } catch {
    res.json(jsonStoreGetUsers({ status, page }));
  }
});

router.post("/users/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
  const admin = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "User not found" }); return; }
    const u = snap.data() as any;
    await db.collection("users").doc(id).update({ status: "active", updatedAt: new Date().toISOString() });
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
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "User not found" }); return; }
    const u = snap.data() as any;
    await db.collection("users").doc(id).update({ status: "rejected", updatedAt: new Date().toISOString() });
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
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "User not found" }); return; }
    const u = snap.data() as any;
    await db.collection("users").doc(id).delete();
    try {
      const auth = getFirebaseAuth();
      await auth.deleteUser(id);
    } catch {
      // Best-effort delete in Auth; keep Firestore deletion.
    }
    await logAudit({ action: "DELETE_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Deleted user: ${u.name}` });
    res.json({ message: "User deleted" });
  } catch {
    const ok = jsonStoreDeleteUser(id);
    if (!ok) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User deleted" });
  }
});

export default router;
