import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";

/* ─── Demo Auth Mock Plugin ─── */
const DEMO_PASSWORD = "admin123";
const DEMO_USERS = [
  { id: "demo-admin", name: "Demo Admin", email: "admin@hcdc.edu.ph", role: "admin", userCategory: "administrator", institution: "HCDC", status: "active" },
  { id: "demo-archivist", name: "Demo Archivist", email: "archivist@hcdc.edu.ph", role: "archivist", userCategory: "staff", institution: "HCDC", status: "active" },
  { id: "demo-student", name: "Demo Student", email: "student@hcdc.edu.ph", role: "student", userCategory: "student", institution: "HCDC", status: "active" },
];

function makeToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 604800 })).toString("base64url");
  const sig = Buffer.from("devsignature").toString("base64url");
  return `${header}.${body}.${sig}`;
}

function parseToken(token: string): any {
  try {
    const parts = token.replace("Bearer ", "").split(".");
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch { return null; }
}

function mockAuthPlugin(): Plugin {
  return {
    name: "mock-auth",
    configureServer(server) {
      server.middlewares.use("/api/auth/login", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        let body = "";
        req.on("data", (c: Buffer) => (body += c.toString()));
        req.on("end", () => {
          try {
            const { email, password } = JSON.parse(body);
            const user = DEMO_USERS.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
            if (!user || password !== DEMO_PASSWORD) {
              res.statusCode = 401;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid credentials" }));
              return;
            }
            const token = makeToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ token, user: { ...user, createdAt: new Date().toISOString() } }));
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Bad request" }));
          }
        });
      });

      server.middlewares.use("/api/auth/me", (req, res) => {
        const auth = req.headers.authorization;
        const payload = auth ? parseToken(auth) : null;
        if (!payload) { res.statusCode = 401; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ error: "Unauthorized" })); return; }
        const user = DEMO_USERS.find((u) => u.id === payload.userId || u.email === payload.email);
        if (!user) { res.statusCode = 404; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ error: "User not found" })); return; }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ...user, createdAt: new Date().toISOString() }));
      });

      server.middlewares.use("/api/auth/logout", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Logged out" }));
      });

      server.middlewares.use("/api/auth/register", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Registration submitted. Awaiting admin approval." }));
      });

      /* ─── In-memory announcement store ─── */
      const announcements: Array<{ id: string; title: string; content: string; isActive: boolean; createdAt: string }> = [
        { id: "ann-1", title: "Welcome to iArchive!", content: "HCDC's digital repository is now live. Browse public collections or request access to restricted materials.", isActive: true, createdAt: new Date().toISOString() },
        { id: "ann-2", title: "System Maintenance Notice", content: "Scheduled maintenance this weekend. The archive will be briefly unavailable Saturday 2-4 AM.", isActive: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];

      /* ─── Announcements CRUD ─── */
      server.middlewares.use("/api/announcements", (req, res, next) => {
        if (res.headersSent) { next(); return; }

        // DELETE /api/announcements/:id
        const deleteMatch = (req.url || "").match(/^\/([^/?]+)/);
        if (req.method === "DELETE" && deleteMatch) {
          const idx = announcements.findIndex(a => a.id === deleteMatch[1]);
          if (idx >= 0) announcements.splice(idx, 1);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Deleted" }));
          return;
        }

        // POST /api/announcements (create)
        if (req.method === "POST") {
          let body = "";
          req.on("data", (c: Buffer) => (body += c.toString()));
          req.on("end", () => {
            try {
              const { title, content, isActive } = JSON.parse(body);
              const ann = { id: `ann-${Date.now()}`, title, content, isActive: isActive !== false, createdAt: new Date().toISOString() };
              announcements.unshift(ann);
              res.statusCode = 201;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(ann));
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Bad request" }));
            }
          });
          return;
        }

        // GET /api/announcements
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(announcements));
      });

      /* Fallback for other /api routes so they don't 500 */
      server.middlewares.use("/api", (req, res, next) => {
        if (res.headersSent) { next(); return; }
        const url = req.url || "";
        if (url.startsWith("/auth")) { next(); return; }
        res.setHeader("Content-Type", "application/json");
        if (url.includes("/stats")) { res.end(JSON.stringify({ totalMaterials: 8, totalCategories: 5, totalUsers: 3, pendingRequests: 0 })); return; }
        if (url.includes("/categories")) {
          try {
            const data = require("fs").readFileSync(require("path").resolve(import.meta.dirname, "categories.json"), "utf-8");
            res.end(data);
          } catch {
            res.end("[]");
          }
          return;
        }
        if (url.includes("/materials")) {
          try {
            const data = require("fs").readFileSync(require("path").resolve(import.meta.dirname, "materials.json"), "utf-8");
            res.end(data);
          } catch {
            res.end("[]");
          }
          return;
        }
        if (url.includes("/requests")) { res.end(JSON.stringify({ requests: [] })); return; }
        if (url.includes("/users")) { res.end(JSON.stringify(DEMO_USERS.map(u => ({ ...u, createdAt: new Date().toISOString() })))); return; }
        if (url.includes("/audit")) { res.end(JSON.stringify({ logs: [] })); return; }
        res.end(JSON.stringify([]));
      });
    },
  };
}


const rawPort = process.env.PORT || "5173";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    mockAuthPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

