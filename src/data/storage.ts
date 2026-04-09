import { SAMPLE_MATERIALS, ACTIVITY_FEED, type ArchivalMaterial, type ActivityEntry } from "./sampleData";

const STORAGE_KEYS = {
  MATERIALS: "iarchive_materials",
  ACTIVITY: "iarchive_activity",
  VERSION: "iarchive_version",
};

// Bump this whenever sample data structure changes
const STORAGE_VERSION = "3";

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
}

/** Read All Materials */
export function getMaterials(): ArchivalMaterial[] {
  if (typeof window === "undefined") return SAMPLE_MATERIALS;
  
  const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (currentVersion !== STORAGE_VERSION) {
    // Preserve any custom user-added materials (id not in SAMPLE_MATERIALS)
    const oldStored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    let userAdded: ArchivalMaterial[] = [];
    if (oldStored) {
        try {
            const oldMaterials = JSON.parse(oldStored) as ArchivalMaterial[];
            userAdded = oldMaterials.filter(m => !SAMPLE_MATERIALS.some(s => s.id === m.id));
        } catch(e) {}
    }
    
    // Merge updated sample materials with user added materials
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
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse materials from localStorage", e);
    return SAMPLE_MATERIALS;
  }
}

/** Get Single Material */
export function getMaterialById(id: string): ArchivalMaterial | undefined {
  const materials = getMaterials();
  return materials.find(m => m.id === id || m.uniqueId === id);
}

/** Save/Update Material */
export function saveMaterial(material: ArchivalMaterial) {
  const materials = getMaterials();
  const index = materials.findIndex(m => m.id === material.id);
  const now = new Date().toISOString();
  
  if (index >= 0) {
    materials[index] = { ...material, updatedAt: now };
  } else {
    // New material
    materials.push({ 
      ...material, 
      createdAt: material.createdAt || now, 
      updatedAt: now 
    });
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn("LocalStorage quota exceeded, pruning page images from stored materials...");
      
      // Attempt to save space by removing large pageImages from older materials
      const prunedMaterials = materials.map(m => {
        // Only keep first 2 images for non-selected materials to save space
         if (m.pageImages && m.pageImages.length > 2) {
            return { ...m, pageImages: m.pageImages.slice(0, 2) };
         }
         return m;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(prunedMaterials));
      } catch (innerError) {
        // If still failing, aggressively strip all images except current one
        const aggressivePrune = materials.map(m => {
          if (m.id !== material.id) {
             return { ...m, pageImages: [] };
          }
          // Limit current one to 4 pages max
          if (m.pageImages && m.pageImages.length > 4) {
             return { ...m, pageImages: m.pageImages.slice(0, 4) };
          }
          return m;
        });
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(aggressivePrune));
      }
    } else {
      throw e;
    }
  }
  return materials;
}

/** Delete Material */
export function deleteMaterial(id: string) {
  const materials = getMaterials();
  const filtered = materials.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));
  return filtered;
}

/** Read Activity Feed */
export function getActivityFeed(): ActivityEntry[] {
  if (typeof window === "undefined") return ACTIVITY_FEED;
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  if (!stored) {
    initializeStorage();
    return ACTIVITY_FEED;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return ACTIVITY_FEED;
  }
}

/** Add Activity Log Entry */
export function addActivity(entry: Omit<ActivityEntry, "id" | "timestamp">) {
  const feed = getActivityFeed();
  const newEntry: ActivityEntry = {
    ...entry,
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updatedFeed = [newEntry, ...feed].slice(0, 50); // Keep last 50
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updatedFeed));
  return updatedFeed;
}
