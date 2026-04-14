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
  const path = process.env["FIREBASE_SERVICE_ACCOUNT_PATH"];
  if (!path) return null;
  try {
    const resolvedPath = pathResolve(path);
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

export function ensureFirebaseApp() {
  if (getApps().length > 0) return;
  const projectId = getProjectId();
  const serviceAccount = getServiceAccountJson();

  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID (or FIREBASE_SERVICE_ACCOUNT_JSON with project_id)");
  }
  if (!serviceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH");
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
