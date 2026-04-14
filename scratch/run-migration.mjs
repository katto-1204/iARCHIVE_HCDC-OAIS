import fs from "fs";
import { execSync } from "child_process";
import path from "path";

const rootDir = process.cwd();
const apiServerDir = path.join(rootDir, "api-server");
const serviceAccountPath = path.join(apiServerDir, "service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("service-account.json not found in api-server directory");
  process.exit(1);
}

const serviceAccount = fs.readFileSync(serviceAccountPath, "utf8");
const env = {
  ...process.env,
  FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccount,
  FIREBASE_PROJECT_ID: "iarchive-ab967"
};

console.log("Starting initialization...");
try {
  execSync("node ./scripts/init-firestore.mjs", {
    cwd: apiServerDir,
    env,
    stdio: "inherit"
  });
  console.log("Initialization completed successfully.");
} catch (error) {
  console.error("Initialization failed:", error.message);
}

console.log("Starting migration...");
try {
  execSync("node ./scripts/migrate-json-to-firestore.mjs", {
    cwd: apiServerDir,
    env,
    stdio: "inherit"
  });
  console.log("Migration completed successfully.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
}

