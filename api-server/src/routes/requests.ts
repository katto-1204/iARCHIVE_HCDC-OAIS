import { Router } from "express";
import type { Query } from "firebase-admin/firestore";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { generateId } from "../lib/id.js";
import { logAudit } from "./audit.js";
import { getFirestoreDb } from "../lib/firebase.js";
import {
  jsonStoreApproveAccessRequest,
  jsonStoreGetAccessRequests,
  jsonStoreRejectAccessRequest,
  jsonStoreSubmitAccessRequest,
  jsonStoreGetIngestRequests,
  jsonStoreSubmitIngestRequest,
  jsonStoreApproveIngestRequest,
  jsonStoreRejectIngestRequest,
} from "../lib/jsonStore.js";

const router = Router();

async function formatRequest(r: any) {
  const db = getFirestoreDb();
  let materialTitle = "Unknown";
  const matSnap = await db.collection("materials").doc(r.materialId).get();
  if (matSnap.exists) {
    materialTitle = (matSnap.data() as any).title || "Unknown";
  } else {
    const byMaterialId = await db.collection("materials").where("materialId", "==", r.materialId).limit(1).get();
    if (!byMaterialId.empty) {
      materialTitle = (byMaterialId.docs[0].data() as any).title || "Unknown";
    }
  }
  const userSnap = await db.collection("users").doc(r.userId).get();
  const user = userSnap.exists ? (userSnap.data() as any) : null;
  return {
    id: r.id,
    materialId: r.materialId,
    materialTitle,
    userId: r.userId,
    userName: user?.name || "Unknown",
    userEmail: user?.email || "Unknown",
    purpose: r.purpose,
    status: r.status,
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

router.get("/requests", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const status = req.query.status as string;
  const user = req.user!;

  try {
    const db = getFirestoreDb();
    let query: Query = db.collection("accessRequests");
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.where("status", "==", status);
    }
    if (user.role === "student" || user.role === "researcher" || user.role === "alumni" || user.role === "public") {
      query = query.where("userId", "==", user.userId);
    }
    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = rows.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = rows.slice(offset, offset + limit);
    const formatted = await Promise.all(pageItems.map(formatRequest));
    res.json({ requests: formatted, total, page, totalPages });
  } catch {
    const role = user.role;
    const selfRoles = ["student", "researcher", "alumni", "public"];
    const userId = selfRoles.includes(role) ? user.userId : undefined;
    res.json(jsonStoreGetAccessRequests({ status, page, userId, role }));
  }
});

router.post("/requests", requireAuth, async (req, res) => {
  const user = req.user!;
  const { materialId, purpose } = req.body;
  if (!materialId || !purpose) { res.status(400).json({ error: "Material and purpose required" }); return; }
  try {
    const id = generateId();
    const db = getFirestoreDb();
    const now = new Date().toISOString();
    await db.collection("accessRequests").doc(id).set({
      id,
      materialId,
      userId: user.userId,
      purpose,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({ action: "SUBMIT_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Submitted access request for material: ${materialId}` });
    const newReq = { id, materialId, userId: user.userId, purpose, status: "pending", createdAt: now, updatedAt: now };
    res.status(201).json(await formatRequest(newReq));
  } catch {
    const created = jsonStoreSubmitAccessRequest({
      materialId,
      purpose,
      userId: user.userId,
      userName: user.name,
    });
    if (!created) {
      res.status(500).json({ error: "Failed to submit access request" });
      return;
    }
    res.status(201).json(created);
  }
});

router.post("/requests/:id/approve", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("accessRequests").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Request not found" }); return; }
    await db.collection("accessRequests").doc(id).update({ status: "approved", reviewedBy: user.userId, updatedAt: new Date().toISOString() });
    await logAudit({ action: "APPROVE_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Approved access request` });
    res.json({ message: "Request approved" });
  } catch {
    const ok = jsonStoreApproveAccessRequest(id);
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Request approved" });
  }
});

router.post("/requests/:id/reject", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  const { reason } = req.body;
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("accessRequests").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Request not found" }); return; }
    await db.collection("accessRequests").doc(id).update({ status: "rejected", rejectionReason: reason, reviewedBy: user.userId, updatedAt: new Date().toISOString() });
    await logAudit({ action: "REJECT_REQUEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Rejected access request: ${reason}` });
    res.json({ message: "Request rejected" });
  } catch {
    const ok = jsonStoreRejectAccessRequest({ id, reason });
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Request rejected" });
  }
});

// ============================
// Ingest Requests Endpoints
// ============================

router.get("/ingest-requests", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const status = req.query.status as string;
  try {
    const db = getFirestoreDb();
    let query: Query = db.collection("ingestRequests");
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.where("status", "==", status);
    }
    query = query.orderBy("requestedAt", "desc");
    const snapshot = await query.get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ requests: rows });
  } catch {
    res.json(jsonStoreGetIngestRequests({ status }));
  }
});

router.post("/ingest-requests", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const { materialId, materialTitle, hierarchyPath } = req.body;
  if (!materialId || !materialTitle) { res.status(400).json({ error: "Material ID and Title required" }); return; }
  try {
    const id = generateId();
    const db = getFirestoreDb();
    const now = new Date().toISOString();
    const payload = {
      id,
      materialId,
      materialTitle,
      hierarchyPath: hierarchyPath || "",
      requestedBy: user.name || "Unknown",
      requestedAt: now,
      status: "pending",
    };
    await db.collection("ingestRequests").doc(id).set(payload);
    await logAudit({ action: "SUBMIT_INGEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Submitted ingest request for material: ${materialId}` });
    res.status(201).json(payload);
  } catch {
    const created = jsonStoreSubmitIngestRequest({
      id: generateId(),
      materialId,
      materialTitle,
      hierarchyPath,
      requestedBy: user.name || "Unknown",
      requestedAt: new Date().toISOString(),
    });
    if (!created) {
      res.status(500).json({ error: "Failed to submit ingest request" });
      return;
    }
    res.status(201).json(created);
  }
});

router.post("/ingest-requests/:id/approve", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("ingestRequests").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Request not found" }); return; }
    await db.collection("ingestRequests").doc(id).update({ status: "approved" });
    await logAudit({ action: "APPROVE_INGEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Approved ingest request` });
    res.json({ message: "Ingest request approved" });
  } catch {
    const ok = jsonStoreApproveIngestRequest(id);
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Ingest request approved" });
  }
});

router.post("/ingest-requests/:id/reject", requireAuth, requireRole("admin", "archivist"), async (req, res) => {
  const user = req.user!;
  const id = String(req.params.id);
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("ingestRequests").doc(id).get();
    if (!snap.exists) { res.status(404).json({ error: "Request not found" }); return; }
    await db.collection("ingestRequests").doc(id).update({ status: "rejected" });
    await logAudit({ action: "REJECT_INGEST", entityType: "request", entityId: id, userId: user.userId, userName: user.name, details: `Rejected ingest request` });
    res.json({ message: "Ingest request rejected" });
  } catch {
    const ok = jsonStoreRejectIngestRequest(id);
    if (!ok) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ message: "Ingest request rejected" });
  }
});

export default router;
