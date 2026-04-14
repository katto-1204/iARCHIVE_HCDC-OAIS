import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getServiceAccountJson() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }
  const filePath = process.env["FIREBASE_SERVICE_ACCOUNT_PATH"];
  if (!filePath) return null;
  try {
    const resolvedPath = pathResolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Service account file not found: ${resolvedPath}`);
    }
    const fileRaw = fs.readFileSync(resolvedPath, "utf8");
    return JSON.parse(fileRaw);
  } catch {
    throw new Error("Invalid service account JSON file");
  }
}

function pathResolve(inputPath: string) {
  return path.resolve(inputPath);
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
