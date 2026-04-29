import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root if it exists
try {
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
  }
} catch (e) {
  console.warn("Could not load .env file, relying on environment variables");
}

import app from "./app.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Maintenance debugging endpoints
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", cwd: process.cwd(), node_env: process.env.NODE_ENV });
});

app.get("/api/debug", async (req, res) => {
  let firestoreCounts = {};
  let firestoreError = null;
  try {
    const { getFirestoreDb } = await import("./lib/firebase.js");
    const db = getFirestoreDb();
    if (db) {
      const [m, c, u] = await Promise.all([
        db.collection("materials").count().get(),
        db.collection("categories").count().get(),
        db.collection("users").count().get()
      ]);
      firestoreCounts = {
        materials: m.data().count,
        categories: c.data().count,
        users: u.data().count
      };
    } else {
      firestoreError = "Firestore DB not initialized (check credentials)";
    }
  } catch (err: any) {
    firestoreError = err.message;
  }

  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "MISSING",
      HAS_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      HAS_SERVICE_ACCOUNT_FILE: fs.existsSync(path.join(process.cwd(), "service-account.json")),
      VERCEL: process.env.VERCEL,
    },
    firestore: {
      counts: firestoreCounts,
      error: firestoreError
    },
    cwd: process.cwd(),
    time: new Date().toISOString()
  });
});

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
