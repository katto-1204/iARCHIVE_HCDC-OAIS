import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let _cachedServiceAccount: any = undefined; // undefined = not yet looked up

function getServiceAccountJson() {
  // Return cached result if we already looked it up
  if (_cachedServiceAccount !== undefined) return _cachedServiceAccount;

  // 1. Try env var JSON string
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (raw && raw.trim()) {
    try {
      _cachedServiceAccount = JSON.parse(raw);
      return _cachedServiceAccount;
    } catch (e: any) {
      console.error("Firebase JSON Parse Error:", e.message);
    }
  }

  // 2. Try explicit file path from env
  const filePath = process.env["FIREBASE_SERVICE_ACCOUNT_PATH"];
  if (filePath) {
    try {
      const resolvedPath = path.resolve(filePath);
      if (fs.existsSync(resolvedPath)) {
        const fileRaw = fs.readFileSync(resolvedPath, "utf8");
        _cachedServiceAccount = JSON.parse(fileRaw);
        return _cachedServiceAccount;
      }
    } catch (e: any) {
      console.error("Firebase service account file error:", e.message);
    }
  }

  // 3. Auto-detect service-account.json in common locations
  let thisDir: string;
  try {
    thisDir = path.dirname(fileURLToPath(import.meta.url));
  } catch {
    thisDir = __dirname || process.cwd();
  }

  const candidates = [
    path.resolve(thisDir, "../../service-account.json"),       // api-server/service-account.json
    path.resolve(thisDir, "../../../service-account.json"),     // project root
    path.resolve(process.cwd(), "service-account.json"),       // cwd
    path.resolve(process.cwd(), "api-server/service-account.json"),
    path.resolve(process.cwd(), "../api-server/service-account.json"), // Vercel function context
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const fileRaw = fs.readFileSync(candidate, "utf8");
        _cachedServiceAccount = JSON.parse(fileRaw);
        console.log("Firebase: auto-detected service account at", candidate);
        return _cachedServiceAccount;
      }
    } catch { /* skip invalid files */ }
  }

  _cachedServiceAccount = null;
  return null;
}

function getProjectId() {
  return process.env["FIREBASE_PROJECT_ID"] || getServiceAccountJson()?.project_id || undefined;
}

export function isFirebaseConfigured() {
  try {
    const projectId = getProjectId();
    const serviceAccount = getServiceAccountJson();
    return !!(projectId && serviceAccount);
  } catch {
    return false;
  }
}

export function ensureFirebaseApp() {
  if (getApps().length > 0) return;
  const projectId = getProjectId();
  const serviceAccount = getServiceAccountJson();

  if (!projectId || !serviceAccount) {
    throw new Error("Firebase not configured properly (Missing project ID or service account)");
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

export function getFirestoreDb() {
  ensureFirebaseApp();
  return getFirestore();
}

export function getFirebaseAuth() {
  ensureFirebaseApp();
  return getAuth();
}

export { Timestamp };
