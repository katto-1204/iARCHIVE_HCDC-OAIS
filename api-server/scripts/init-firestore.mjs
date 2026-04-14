import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccountJson() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureFirebaseApp() {
  if (getApps().length > 0) return;
  const serviceAccount = getServiceAccountJson();
  const projectId = process.env["FIREBASE_PROJECT_ID"] || serviceAccount?.project_id;
  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID (or FIREBASE_SERVICE_ACCOUNT_JSON with project_id)");
  }
  if (!serviceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

async function main() {
  ensureFirebaseApp();
  const db = getFirestore();
  const now = new Date().toISOString();

  const collections = [
    "users",
    "materials",
    "categories",
    "accessRequests",
    "auditLogs",
    "announcements",
  ];

  for (const name of collections) {
    const metaRef = db.collection(name).doc("__meta");
    await metaRef.set(
      {
        initializedAt: now,
        initializedBy: "init-firestore.mjs",
        collection: name,
      },
      { merge: true },
    );
  }

  console.log("Initialized collections:", collections);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
