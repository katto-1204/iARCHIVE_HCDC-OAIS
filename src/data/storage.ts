import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ACTIVITY_FEED, type ArchivalMaterial, type ActivityEntry } from "./sampleData";

const STORAGE_KEYS = {
  MATERIALS: "iarchive_materials",
  ACTIVITY: "iarchive_activity",
  INGEST_REQUESTS: "iarchive_ingest_requests",
  FEEDBACK: "iarchive_feedback",
  VERSION: "iarchive_version",
};

export interface FeedbackEntry {
  id: string;
  type: "Suggestion" | "Bug Report" | "Compliment";
  message: string;
  name: string;
  email: string;
  date: string;
  status: "read" | "unread";
}

const STORAGE_VERSION = "5";
async function migrateBase64Media(materials: ArchivalMaterial[]) {
  let changed = false;
  for (const mat of materials) {
    if (mat.fileUrl && typeof mat.fileUrl === "string" && mat.fileUrl.startsWith("data:")) {
      const blob = await dataUrlToBlob(mat.fileUrl);
      await saveFile(mat.fileId || mat.id, blob, blob.type || mat.fileType);
      mat.fileId = mat.fileId || mat.id;
      mat.fileType = blob.type || mat.fileType;
      mat.fileUrl = undefined;
      changed = true;
    }
    if (mat.pageImages && mat.pageImages.length > 0) {
      const first = mat.pageImages[0];
      if (typeof first === "string" && first.startsWith("data:")) {
        const blobs = await Promise.all(mat.pageImages.map((img) => dataUrlToBlob(img)));
        await saveFile((mat.fileId || mat.id) + "_thumbs", blobs, "image/jpeg");
        mat.fileId = mat.fileId || mat.id;
        mat.pageImages = [];
        changed = true;
      }
    }
  }
  if (changed) {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }
}

interface IArchiveDB extends DBSchema {
  files: {
    key: string;
    value: { id: string; blob: string | Blob | Blob[]; type?: string };
  };
}

let dbPromise: Promise<IDBPDatabase<IArchiveDB>> | null = null;
export function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<IArchiveDB>('iarchive', 1, {
      upgrade(db) {
        db.createObjectStore('files', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveFile(id: string, data: string | Blob | Blob[], type?: string) {
  const db = await getDB();
  if (!db) return;
  await db.put('files', { id, blob: data, type });
}

export async function getFile(id: string): Promise<{ blob: string | Blob | Blob[]; type?: string } | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  const entry = await db.get('files', id);
  return entry ? { blob: entry.blob, type: entry.type } : undefined;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function toObjectUrl(value: string | Blob): string {
  if (typeof value === "string") return value;
  return URL.createObjectURL(value);
}

/** Initialize storage if empty or outdated */
export function initializeStorage() {
  if (typeof window === "undefined") return;
  const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (!localStorage.getItem(STORAGE_KEYS.MATERIALS) || currentVersion !== STORAGE_VERSION) {
    // No sample/preloaded materials. Keep local fallback empty.
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(ACTIVITY_FEED));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INGEST_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.INGEST_REQUESTS, JSON.stringify([]));
  }
}

/** Read All Materials */
export function getMaterials(): ArchivalMaterial[] {
  if (typeof window === "undefined") return [];
  
  const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (currentVersion !== STORAGE_VERSION) {
    const oldStored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    let existing: ArchivalMaterial[] = [];
    if (oldStored) {
      try {
        existing = JSON.parse(oldStored) as ArchivalMaterial[];
      } catch {
        existing = [];
      }
    }
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(existing));
    localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    return existing;
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
  if (!stored) {
    initializeStorage();
    return [];
  }
  try {
    const parsed = JSON.parse(stored) as ArchivalMaterial[];
    void migrateBase64Media(parsed);
    return parsed;
  } catch (e) {
    return [];
  }
}

export function getMaterialById(id: string): ArchivalMaterial | undefined {
  const materials = getMaterials();
  return materials.find(m => m.id === id || m.uniqueId === id);
}

/** Load heavy material with its IDB contents if fileId exists */
export async function loadMaterial(id: string): Promise<ArchivalMaterial | undefined> {
   const mat = getMaterialById(id);
   if (!mat) return undefined;
   if (mat.fileId) {
      try {
         const fileEntry = await getFile(mat.fileId);
         if (fileEntry) {
        if (Array.isArray(fileEntry.blob)) {
          // Unexpected, but avoid crashing
        } else {
          mat.fileUrl = toObjectUrl(fileEntry.blob as string | Blob);
          mat.fileType = fileEntry.type || mat.fileType;
        }
         }
         const thumbsEntry = await getFile(mat.fileId + "_thumbs");
         if (thumbsEntry) {
        if (Array.isArray(thumbsEntry.blob)) {
          mat.pageImages = thumbsEntry.blob.map((b) => toObjectUrl(b));
        } else if (typeof thumbsEntry.blob === "string") {
          mat.pageImages = JSON.parse(thumbsEntry.blob as string);
        }
         }
      } catch (e) {
         console.error("Failed to load rich media from IDB", e);
      }
   }
   return mat;
}

/** Save/Update Material - DISALBED LOCAL STORAGE VERSION */
export async function saveMaterial(material: ArchivalMaterial) {
  // ═══ FIRESTORE ENFORCEMENT ═══
  // Browser LocalStorage ingestion is now disabled per user request.
  // All saves must go through the API/Firestore.
  console.log("Local storage saveMaterial disabled. Use API instead.");
  return getMaterials(); 
}

/** Delete Material */
export async function deleteMaterial(id: string) {
  const materials = getMaterials();
  const filtered = materials.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));
  
  // Cleanup indexedDB
  const db = await getDB();
  if (db) {
     await db.delete('files', id);
     await db.delete('files', id + '_thumbs');
  }
  
  return filtered;
}

/** Read/Add Activity Feed */
export function getActivityFeed(): ActivityEntry[] {
  if (typeof window === "undefined") return ACTIVITY_FEED;
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  if (!stored) {
    initializeStorage();
    return ACTIVITY_FEED;
  }
  try { return JSON.parse(stored); } catch (e) { return ACTIVITY_FEED; }
}

export function addActivity(entry: Omit<ActivityEntry, "id" | "timestamp">) {
  const feed = getActivityFeed();
  const newEntry: ActivityEntry = { ...entry, id: `act-${Date.now()}`, timestamp: new Date().toISOString() };
  const updatedFeed = [newEntry, ...feed].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updatedFeed));
  return updatedFeed;
}

export interface IngestApprovalRequest {
  id: string;
  materialId: string;
  materialTitle: string;
  hierarchyPath?: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export function getIngestRequests(): IngestApprovalRequest[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INGEST_REQUESTS);
  if (!stored) {
    initializeStorage();
    return [];
  }
  try { return JSON.parse(stored); } catch { return []; }
}

export function addIngestRequest(request: IngestApprovalRequest) {
  const list = getIngestRequests();
  const updated = [request, ...list].slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.INGEST_REQUESTS, JSON.stringify(updated));
  return updated;
}

export function updateIngestRequest(id: string, status: "approved" | "rejected") {
  const list = getIngestRequests();
  const updated = list.map((req) => req.id === id ? { ...req, status } : req);
  localStorage.setItem(STORAGE_KEYS.INGEST_REQUESTS, JSON.stringify(updated));
  return updated;
}

export function getFeedbacks(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
  if (!stored) return [
    { id: "1", type: "Suggestion", message: "Make the search bar bigger.", name: "Jane Doe", email: "jane@test.com", date: "2026-04-20", status: "unread" },
    { id: "2", type: "Bug Report", message: "The login page flashes sometimes on mobile.", name: "Anonymous", email: "", date: "2026-04-22", status: "read" },
    { id: "3", type: "Compliment", message: "The new collection cards look amazing!", name: "Alice Brown", email: "alice@example.com", date: "2026-04-25", status: "unread" },
  ];
  try { return JSON.parse(stored); } catch { return []; }
}

export function saveFeedback(feedback: FeedbackEntry) {
  const list = getFeedbacks();
  const index = list.findIndex(f => f.id === feedback.id);
  let updated;
  if (index >= 0) {
    updated = [...list];
    updated[index] = feedback;
  } else {
    updated = [feedback, ...list];
  }
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
  return updated;
}

export function markFeedbackAsRead(id: string) {
  const list = getFeedbacks();
  const updated = list.map(f => f.id === id ? { ...f, status: "read" as const } : f);
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
  return updated;
}
