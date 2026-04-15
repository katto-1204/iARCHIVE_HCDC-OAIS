import { Router } from "express";
import type { Query } from "firebase-admin/firestore";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logAudit } from "./audit.js";
import { jsonStoreApproveUser, jsonStoreDeleteUser, jsonStoreGetUsers, jsonStoreRejectUser } from "../lib/jsonStore.js";
import { getFirebaseAuth, getFirestoreDb } from "../lib/firebase.js";

const router = Router();

function formatUser(u: any) {
  return { 
    id: u.id, 
    name: u.name, 
    email: u.email, 
    role: u.role, 
    userCategory: u.userCategory, 
    institution: u.institution, 
    status: u.status, 
    createdAt: u.createdAt,
    purpose: u.purpose || u.researchPurpose || null
  };
}

router.get("/users", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 50; // Increased limit for easier management
  const status = req.query.status as string;
  try {
    const db = getFirestoreDb();
    let query: Query = db.collection("users");
    
    // If we have a status filter, we should ideally use it in Firestore.
    // However, combining status filter with orderBy("createdAt") requires a composite index.
    // To ensure it works "right away" without manual index creation, 
    // we'll fetch all and filter/sort in memory if the collection is reasonably sized.
    const snapshot = await query.get();
    let users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Safety check: ensure we didn't just get an empty array if Firebase is partially down
    if (users.length === 0 && !status && page === 1) {
       const localUsers = jsonStoreGetUsers({ status, page });
       if (localUsers.users.length > 0) {
         console.log("Empty Firestore users, falling back to local for display");
         return res.json(localUsers);
       }
    }

    if (status && ["pending", "active", "inactive", "rejected"].includes(status)) {
      users = users.filter((u: any) => u.status === status);
    }
    
    users.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = users.slice(offset, offset + limit);
    
    res.json({ users: pageItems.map(formatUser), total, page, totalPages });
  } catch (error: any) {
    console.error("Firestore Users Fetch Error:", error.message);
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
  const { reason } = req.body || {};
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "User not found" }); return; }
    const u = snap.data() as any;
    await db.collection("users").doc(id).update({ status: "rejected", rejectionReason: reason || "", updatedAt: new Date().toISOString() });
    await logAudit({ action: "REJECT_USER", entityType: "user", entityId: id, userId: admin.userId, userName: admin.name, details: `Rejected user: ${u.name}${reason ? ` — Reason: ${reason}` : ""}` });
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
