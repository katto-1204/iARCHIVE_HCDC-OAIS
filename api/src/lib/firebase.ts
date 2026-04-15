import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let _firebaseInitialized = false;

function getServiceAccountJson() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (raw) {
    try {
      const sa = JSON.parse(raw);
      if (sa.private_key && typeof sa.private_key === "string") {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      return sa;
    } catch (err: any) {
      console.error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`);
    }
  }
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const possiblePaths = [
    process.env["FIREBASE_SERVICE_ACCOUNT_PATH"],
    path.join(process.cwd(), "service-account.json"),
    path.resolve(__dirname, "../../../api-server/service-account.json"),
    path.resolve(__dirname, "../../service-account.json"),
  ].filter(Boolean) as string[];

  for (const saPath of possiblePaths) {
    try {
      const resolvedPath = path.resolve(saPath);
      if (fs.existsSync(resolvedPath)) {
        return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
      }
    } catch {
      continue;
    }
  }
  return null;
}

function getProjectId() {
  return (
    process.env["FIREBASE_PROJECT_ID"] || 
    process.env["VITE_FIREBASE_PROJECT_ID"] || 
    getServiceAccountJson()?.project_id || 
    undefined
  );
}

export function ensureFirebaseApp() {
  if (_firebaseInitialized) return true;
  if (getApps().length > 0) {
    _firebaseInitialized = true;
    return true;
  }

  const projectId = getProjectId();
  const serviceAccount = getServiceAccountJson();

  if (!projectId || !serviceAccount) {
    return false;
  }

  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    _firebaseInitialized = true;
    console.log("Firebase Admin initialized successfully");
    return true;
  } catch (err: any) {
    console.warn("Firebase Admin failed to initialize:", err.message);
    return false;
  }
}

export function getFirestoreDb() {
  const ok = ensureFirebaseApp();
  if (!ok) return null;
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

export function getFirebaseAuth() {
  const ok = ensureFirebaseApp();
  if (!ok) return null;
  try {
    return getAuth();
  } catch {
    return null;
  }
}

export function isFirebaseAvailable(): boolean {
  return ensureFirebaseApp();
}

export { Timestamp };

