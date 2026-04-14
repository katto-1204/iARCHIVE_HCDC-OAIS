import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SAMPLE_MATERIALS, ACTIVITY_FEED, type ArchivalMaterial, type ActivityEntry } from "./sampleData";

const STORAGE_KEYS = {
  MATERIALS: "iarchive_materials",
  ACTIVITY: "iarchive_activity",
  INGEST_REQUESTS: "iarchive_ingest_requests",
  VERSION: "iarchive_version",
};

const STORAGE_VERSION = "4"; // Bump version
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
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(SAMPLE_MATERIALS));
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
  if (typeof window === "undefined") return SAMPLE_MATERIALS;
  
  const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (currentVersion !== STORAGE_VERSION) {
    const oldStored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    let userAdded: ArchivalMaterial[] = [];
    if (oldStored) {
        try {
            const oldMaterials = JSON.parse(oldStored) as ArchivalMaterial[];
            userAdded = oldMaterials.filter(m => !SAMPLE_MATERIALS.some(s => s.id === m.id));
        } catch(e) {}
    }
    const merged = [...SAMPLE_MATERIALS, ...userAdded];
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(merged));
    localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    return merged;
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
  if (!stored) {
    initializeStorage();
    return SAMPLE_MATERIALS;
  }
  try {
    const parsed = JSON.parse(stored) as ArchivalMaterial[];
    void migrateBase64Media(parsed);
    return parsed;
  } catch (e) {
    return SAMPLE_MATERIALS;
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

/** Save/Update Material */
export async function saveMaterial(material: ArchivalMaterial) {
  const materials = getMaterials();
  const index = materials.findIndex(m => m.id === material.id);
  const now = new Date().toISOString();
  
  let processedMaterial = { ...material };
  
  try {
      // If there is heavy binary data, move it to IndexedDB
        if (material.fileUrl) {
          const fileId = material.fileId || material.id;
          if (typeof material.fileUrl === "string" && material.fileUrl.startsWith("data:")) {
            const blob = await dataUrlToBlob(material.fileUrl);
            await saveFile(fileId, blob, blob.type || material.fileType);
            processedMaterial.fileType = blob.type || material.fileType;
            processedMaterial.fileUrl = undefined;
            processedMaterial.fileId = fileId;
          } else {
            const fileUrl = material.fileUrl as unknown;
            if (fileUrl && typeof fileUrl !== "string" && fileUrl instanceof Blob) {
              await saveFile(fileId, fileUrl, fileUrl.type || material.fileType);
              processedMaterial.fileType = fileUrl.type || material.fileType;
              processedMaterial.fileUrl = undefined;
              processedMaterial.fileId = fileId;
            } else if (typeof material.fileUrl === "string" && material.fileUrl.startsWith("blob:")) {
              processedMaterial.fileUrl = undefined;
              processedMaterial.fileId = fileId;
            }
          }
        }
        if (material.pageImages && material.pageImages.length > 0) {
          const fileId = material.fileId || material.id;
          const first = material.pageImages[0] as any;
          if (first instanceof Blob) {
            await saveFile(fileId + "_thumbs", material.pageImages as unknown as Blob[], "image/jpeg");
            processedMaterial.pageImages = [];
            processedMaterial.fileId = fileId;
          } else if (typeof first === "string" && first.startsWith("data:")) {
            const blobs = await Promise.all((material.pageImages as string[]).map((img) => dataUrlToBlob(img)));
            await saveFile(fileId + "_thumbs", blobs, "image/jpeg");
            processedMaterial.pageImages = [];
            processedMaterial.fileId = fileId;
          } else if (typeof first === "string" && first.startsWith("blob:")) {
            processedMaterial.pageImages = [];
            processedMaterial.fileId = fileId;
          }
        }

     if (index >= 0) {
       materials[index] = { ...processedMaterial, updatedAt: now };
     } else {
       materials.push({ 
         ...processedMaterial, 
         createdAt: processedMaterial.createdAt || now, 
         updatedAt: now 
       });
     }

     localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
     
     // Return hydrated representation for UI optimism
     return getMaterials().map(m => m.id === material.id ? material : m);
  } catch (e) {
     console.error("Critical Storage Error saving material:", e);
     throw new Error("IndexedDB or LocalStorage save failed");
  }
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
