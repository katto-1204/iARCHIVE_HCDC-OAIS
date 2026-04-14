import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let _firebaseInitialized = false;
let _firebaseInitError: string | null = null;

function getServiceAccountJson() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (raw) {
    try {
      // Fix potential extra escaping if the variable was wrapped in unnecessary quotes in Vercel UI
      let sanitizedRaw = raw.trim();
      if (sanitizedRaw.startsWith("'") && sanitizedRaw.endsWith("'")) sanitizedRaw = sanitizedRaw.slice(1, -1);
      if (sanitizedRaw.startsWith('"') && sanitizedRaw.endsWith('"')) sanitizedRaw = sanitizedRaw.slice(1, -1);
      
      const sa = JSON.parse(sanitizedRaw);
      if (sa.private_key && typeof sa.private_key === "string") {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      return sa;
    } catch (err: any) {
      console.error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`);
    }
  }
  
  // Try FIREBASE_SERVICE_ACCOUNT_PATH or local service-account.json
  const possiblePaths = [
    process.env["FIREBASE_SERVICE_ACCOUNT_PATH"],
    path.join(process.cwd(), "service-account.json"),
    path.join(process.cwd(), "api-server", "service-account.json"),
  ].filter(Boolean) as string[];

  for (const saPath of possiblePaths) {
    try {
      const resolvedPath = path.resolve(saPath);
      if (fs.existsSync(resolvedPath)) {
        const fileRaw = fs.readFileSync(resolvedPath, "utf8");
        return JSON.parse(fileRaw);
      }
    } catch {
      // Ignore parse errors from files and try the next path
    }
  }

  console.warn("No valid service account JSON found — falling back to JSON store where handled");
  return null;
}

function getProjectId() {
  return process.env["FIREBASE_PROJECT_ID"] || getServiceAccountJson()?.project_id || undefined;
}

export function ensureFirebaseApp() {
  if (_firebaseInitError) {
    throw new Error(_firebaseInitError);
  }
  if (_firebaseInitialized || getApps().length > 0) {
    _firebaseInitialized = true;
    return;
  }

  const projectId = getProjectId();
  const serviceAccount = getServiceAccountJson();

  if (!projectId || !serviceAccount) {
    _firebaseInitError = "Firebase not configured: missing FIREBASE_PROJECT_ID or service account credentials. Falling back to JSON local storage.";
    console.warn(_firebaseInitError);
    throw new Error(_firebaseInitError);
  }

  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    _firebaseInitialized = true;
    console.log("Firebase Admin initialized successfully for project:", projectId);
  } catch (err: any) {
    _firebaseInitError = `Firebase init failed: ${err.message}`;
    console.error(_firebaseInitError);
    throw new Error(_firebaseInitError);
  }
}

export function getFirestoreDb() {
  ensureFirebaseApp();
  return getFirestore();
}

export function getFirebaseAuth() {
  ensureFirebaseApp();
  return getAuth();
}

export function isFirebaseAvailable(): boolean {
  try {
    ensureFirebaseApp();
    return true;
  } catch {
    return false;
  }
}

export { Timestamp };
