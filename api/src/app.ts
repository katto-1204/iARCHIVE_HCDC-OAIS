import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import jwt from "jsonwebtoken";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { supabase } from "./lib/supabase.js";

const app: Express = express();

console.log("iArchive Backend Initializing...");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── TOTAL WAR DEMO BYPASS (V3) ───
// This is placed at the VERY TOP to intercept and grant instant admin access.
app.use(async (req, res, next) => {
  const url = req.originalUrl || req.url || "";
  
  // Intercept any login or me request for demo accounts
  if (req.method === "POST" && (url.includes("/login") || url.includes("/auth/login"))) {
    const { email, password } = req.body || {};
    const inputEmail = (email || "").toLowerCase().trim();
    
    if (inputEmail === "admin@hcdc.edu.ph" && (password === "admin123" || !password)) {
      console.log(">>> ADMIN BYPASS TRIGGERED <<<");
      
      let adminUser = {
        id: "da000000-0000-0000-0000-000000000001", // Real-looking UUID
        name: "System Administrator",
        role: "admin",
        email: "admin@hcdc.edu.ph",
        status: "active"
      };

      try {
        // Attempt to get real profile for database consistency
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', inputEmail).single();
        if (profile) {
          adminUser.id = profile.id;
          adminUser.name = profile.name;
        }
      } catch (e) {
        console.warn("Supabase profile lookup failed in bypass, using defaults.");
      }

      const secret = process.env.JWT_SECRET || "iarchive-hcdc-secret-2026";
      const token = jwt.sign({ 
        userId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role, 
        name: adminUser.name 
      }, secret, { expiresIn: "7d" });
      
      console.log(">>> SUCCESS: Granted Demo Admin Access (ID: " + adminUser.id + ")");
      return res.status(200).json({ token, user: adminUser });
    }
  }
  next();
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", time: new Date().toISOString() });
});

app.use("/api", router);

// Global Error Handler
// @ts-ignore
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Backend Error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

export default app;
