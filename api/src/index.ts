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
import fs from "fs";
import path from "path";

const rawPort = process.env["PORT"] || "5000";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", cwd: process.cwd(), node_env: process.env.NODE_ENV });
});

app.get("/api/debug", (req, res) => {
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "MISSING",
      HAS_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      HAS_SERVICE_ACCOUNT_FILE: fs.existsSync(path.join(process.cwd(), "service-account.json")),
      VERCEL: process.env.VERCEL,
    },
    cwd: process.cwd(),
    time: new Date().toISOString()
  });
});

app.use("/api", router);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
